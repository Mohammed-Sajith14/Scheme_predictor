import React, { useState, useEffect } from 'react';
import { 
  Sparkles, LayoutDashboard, Compass, CheckCircle2, MessageSquare, 
  Wallet, Bookmark, FileText, Settings as SettingsIcon, LogOut, Bell, Menu, X, Shield, ChevronRight,
  Database, PlusCircle, Layers, Activity, Sliders, ShieldCheck, Lock, BarChart3, History, HeartPulse
} from 'lucide-react';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import InitialSetup from './pages/InitialSetup';
import Dashboard from './pages/Dashboard';
import DataWallet from './pages/DataWallet';
import ExploreSchemes from './pages/ExploreSchemes';
import Eligibility from './pages/Eligibility';
import SchemeDetails from './pages/SchemeDetails';
import AiAssistant from './pages/AiAssistant';
import SavedSchemes from './pages/SavedSchemes';
import Settings from './pages/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminSchemesList from './pages/admin/AdminSchemesList';
import CreateSchemeWizard from './pages/admin/CreateSchemeWizard';
import EditScheme from './pages/admin/EditScheme';
import AdminEligibilityTester from './pages/admin/AdminEligibilityTester';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminSchemeVersions from './pages/admin/AdminSchemeVersions';
import AdminRagManagement from './pages/admin/AdminRagManagement';
import AdminAuditLog from './pages/admin/AdminAuditLog';
import AdminSystemHealth from './pages/admin/AdminSystemHealth';
import { useLanguage } from './context/LanguageContext';
import { localizeTerm } from './utils/localizationHelper';
import { LanguageSwitcher } from './components/LanguageSwitcher';

type PageType = 
  | 'landing' | 'login' | 'signup' | 'setup' | 'dashboard' 
  | 'schemes' | 'eligibility' | 'schemeDetails' | 'assistant' 
  | 'wallet' | 'saved' | 'settings'
  | 'admin-dashboard' | 'admin-schemes' | 'admin-create-scheme' | 'admin-edit-scheme' 
  | 'admin-eligibility-tester' | 'admin-analytics' | 'admin-scheme-versions'
  | 'admin-rag' | 'admin-audit' | 'admin-system-health';

const API_URL = 'http://localhost:8080';

export default function App() {
  const { t, language } = useLanguage();
  const [page, setPage] = useState<PageType>('landing');
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [user, setUser] = useState<any>(null);
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);
  const [walletCompletion, setWalletCompletion] = useState<number>(0);

  // Fetch current user details if token is present
  useEffect(() => {
    if (token) {
      const fetchUser = async () => {
        try {
          const res = await fetch(`${API_URL}/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const userData = await res.json();
            setUser(userData);
            
            // Fetch wallet completion percentage for citizens
            if (userData.role !== 'ADMIN') {
              const wRes = await fetch(`${API_URL}/api/wallet/get`, {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (wRes.ok) {
                const walletData = await wRes.json();
                setWalletCompletion(walletData.profileCompletion || 0);
                if (walletData.profileCompletion === 0 && page !== 'setup') {
                  setPage('setup');
                } else if (['landing', 'login', 'signup'].includes(page)) {
                  setPage('dashboard');
                }
              }
            } else {
              if (['landing', 'login', 'signup'].includes(page)) {
                setPage('admin-dashboard');
              }
            }
          } else {
            handleLogout();
          }
        } catch (err) {
          console.error(err);
        }
      };
      fetchUser();
    } else {
      setUser(null);
      if (!['landing', 'login', 'signup'].includes(page)) {
        setPage('landing');
      }
    }
  }, [token]);

  const handleLoginSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    if (newUser.role === 'ADMIN') {
      setPage('admin-dashboard');
    } else {
      setPage('dashboard');
    }
  };

  const handleSignupSuccess = (newToken: string, newUser: any) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(newUser);
    setPage('setup');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setPage('landing');
    setMobileMenuOpen(false);
  };

  // Citizen Navigation Menu Groups (Localized)
  const citizenNavGroups = [
    {
      group: t('nav.group.overview', 'Overview'),
      items: [
        { type: 'dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard }
      ]
    },
    {
      group: t('nav.group.discover', 'Discover'),
      items: [
        { type: 'schemes', label: t('nav.explore_schemes', 'Explore Schemes'), icon: Compass },
        { type: 'eligibility', label: t('nav.eligibility', 'Eligibility'), icon: CheckCircle2 }
      ]
    },
    {
      group: t('nav.group.personal', 'Personal'),
      items: [
        { type: 'wallet', label: t('nav.data_wallet', 'My Data Wallet'), icon: Wallet },
        { type: 'saved', label: t('nav.saved_schemes', 'Saved Schemes'), icon: Bookmark }
      ]
    },
    {
      group: t('nav.group.assistance', 'Assistance'),
      items: [
        { type: 'assistant', label: t('nav.ai_assistant', 'AI Assistant'), icon: MessageSquare }
      ]
    },
    {
      group: t('nav.group.account', 'Account'),
      items: [
        { type: 'settings', label: t('nav.settings', 'Profile Settings'), icon: SettingsIcon }
      ]
    }
  ];

  // Admin Navigation Menu Groups (Localized)
  const adminNavGroups = [
    {
      group: t('nav.group.overview', 'Overview'),
      items: [
        { type: 'admin-dashboard', label: t('nav.dashboard', 'Dashboard'), icon: LayoutDashboard }
      ]
    },
    {
      group: t('nav.group.scheme_mgmt', 'Scheme Management'),
      items: [
        { type: 'admin-schemes', label: t('nav.admin.all_schemes', 'All Schemes'), icon: Layers },
        { type: 'admin-create-scheme', label: t('nav.admin.create_scheme', 'Create Scheme'), icon: PlusCircle }
      ]
    },
    {
      group: t('nav.group.rule_engine', 'Rule Engine'),
      items: [
        { type: 'admin-eligibility-tester', label: t('nav.admin.rule_tester', 'Eligibility Rule Tester'), icon: Sliders }
      ]
    },
    {
      group: t('nav.group.analytics', 'Analytics & Knowledge'),
      items: [
        { type: 'admin-analytics', label: t('nav.admin.analytics', 'Impact Analytics'), icon: BarChart3 },
        { type: 'admin-rag', label: t('nav.admin.rag_kb', 'RAG Knowledge Base'), icon: Database }
      ]
    },
    {
      group: t('nav.group.governance', 'System Governance'),
      items: [
        { type: 'admin-audit', label: t('nav.admin.audit_logs', 'Audit Logs'), icon: Activity },
        { type: 'admin-system-health', label: t('nav.admin.system_health', 'System Health'), icon: HeartPulse }
      ]
    },
    {
      group: t('nav.group.account', 'Account'),
      items: [
        { type: 'settings', label: t('nav.settings', 'Settings'), icon: SettingsIcon }
      ]
    }
  ];

  const isAdmin = user?.role === 'ADMIN';
  const navGroups = isAdmin ? adminNavGroups : citizenNavGroups;

  const navigateTo = (target: string, params?: any) => {
    if (params?.id) {
      setSelectedSchemeId(params.id);
    }
    setPage(target as PageType);
    setMobileMenuOpen(false);
    setNotifDropdownOpen(false);
  };

  // Guard for Admin Pages
  const isAdminPage = page.startsWith('admin-');
  if (isAdminPage && (!isAdmin || !token)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white p-8 rounded-3xl border border-red-200 max-w-md w-full text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-black text-slate-900 font-display">Access Denied</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            You do not have administrator permissions to view this resource. Administrator endpoints are protected on the backend via Spring Security.
          </p>
          <div className="pt-2 space-y-2">
            <button
              onClick={() => setPage('login')}
              className="w-full py-2.5 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-extrabold rounded-xl text-xs transition-colors"
            >
              Sign In as Administrator
            </button>
            <button
              onClick={() => setPage(token ? 'dashboard' : 'landing')}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Return to Citizen Portal
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Navigation Header (Consistent SchemeWise styling) */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200/80 z-40 flex items-center justify-between px-6 shadow-sm">
        <div className="flex items-center gap-3">
          {token && (
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
          )}
          <span 
            onClick={() => navigateTo(token ? (isAdmin ? 'admin-dashboard' : 'dashboard') : 'landing')} 
            className="text-lg font-black text-gov-blue-900 flex items-center gap-2.5 cursor-pointer font-display"
          >
            <div className="w-9 h-9 rounded-xl bg-gov-blue-500 text-white flex items-center justify-center shadow-md shadow-gov-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <span className="tracking-tight">SchemeWise {isAdmin && <span className="text-xs bg-gov-blue-100 text-gov-blue-800 px-2 py-0.5 rounded-md font-bold ml-1">ADMIN</span>}</span>
          </span>
        </div>

        {/* Dynamic Header Actions with Language Switcher */}
        <div className="flex items-center gap-3">
          <LanguageSwitcher />

          {!token ? (
            <div className="flex items-center gap-3 text-xs font-bold">
              <span 
                onClick={() => navigateTo('schemes')} 
                className="text-slate-600 hover:text-gov-blue-600 cursor-pointer hidden sm:inline transition-colors"
              >
                {t('nav.public_schemes', 'Public Schemes')}
              </span>
              <button 
                onClick={() => navigateTo('login')}
                className="px-3.5 py-2 border border-slate-300 hover:bg-slate-50 rounded-xl text-slate-700 transition-all font-bold cursor-pointer"
              >
                {t('nav.sign_in', 'Sign In')}
              </button>
              <button 
                onClick={() => navigateTo('signup')}
                className="px-3.5 py-2 bg-gov-blue-500 hover:bg-gov-blue-600 text-white rounded-xl transition-all font-bold cursor-pointer shadow-sm shadow-gov-blue-500/10"
              >
                {t('nav.create_account', 'Create Account')}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-xs">
              
              {/* Profile Card */}
              <div className="hidden sm:flex flex-col items-end">
                <span className="font-extrabold text-slate-700">{user?.name}</span>
                <span className={`text-[10px] font-bold block mt-0.5 ${isAdmin ? 'text-gov-blue-600' : 'text-slate-400'}`}>
                  {isAdmin ? t('app.system_admin', 'System Administrator') : t('app.citizen_account', 'Citizen Account')}
                </span>
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setNotifDropdownOpen(!notifDropdownOpen)}
                  className="p-2 hover:bg-slate-100 rounded-full text-slate-500 relative transition-colors cursor-pointer"
                >
                  <Bell className="w-4.5 h-4.5" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-gov-blue-500" />
                </button>
                {notifDropdownOpen && (
                  <div className="absolute right-0 mt-3 w-80 bg-white text-slate-800 rounded-2xl border border-slate-200 shadow-xl py-3 text-xs z-50 animate-slideDown">
                    <span className="block px-4 py-2 font-bold text-gov-blue-900 border-b border-slate-100 uppercase tracking-wider text-[9px]">{t('nav.notifications', 'Notifications')}</span>
                    <div className="p-4 text-slate-500 leading-relaxed space-y-2 text-left">
                      <p className="font-semibold text-slate-700">{localizeTerm("Security Authorization Active", language)}</p>
                      <p className="text-[11px] text-slate-400">{localizeTerm("Security sync desc", language)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Logout */}
              <button 
                onClick={handleLogout}
                className="p-2 hover:bg-red-50 hover:text-red-600 rounded-full text-slate-400 transition-colors cursor-pointer"
                title={localizeTerm("Log Out", language)}
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex pt-16">
        
        {/* Sidebar (Unified Theme for Citizen & Admin) */}
        {token && page !== 'setup' && page !== 'login' && page !== 'signup' && (
          <aside className="w-64 border-r border-slate-200 bg-white hidden md:flex flex-col justify-between fixed top-16 bottom-0 left-0 z-30">
            
            <div className="p-4 space-y-6 overflow-y-auto custom-scrollbar flex-1">
              {navGroups.map((g, idx) => (
                <div key={idx} className="space-y-1.5">
                  <span className="block px-3 text-[9px] font-bold uppercase tracking-wider text-slate-400">{g.group}</span>
                  <div className="space-y-0.5">
                    {g.items.map((item) => {
                      const Icon = item.icon;
                      const active = page === item.type || ((item.type === 'schemes' || item.type === 'eligibility') && page === 'schemeDetails');
                      return (
                        <button
                          key={item.type}
                          onClick={() => navigateTo(item.type)}
                          className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between border cursor-pointer ${
                            active 
                              ? 'bg-gov-blue-500 border-gov-blue-500 text-white font-extrabold shadow-sm'
                              : 'bg-white border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span>{item.label}</span>
                          </div>
                          {active && <ChevronRight className="w-3.5 h-3.5" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
            {!isAdmin && (
              <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-2 text-xs">
                  <div className="flex justify-between items-center font-bold">
                    <span className="text-slate-500">{t('nav.wallet_completion', 'Wallet Completion')}</span>
                    <span className="text-gov-blue-600">{Math.round(walletCompletion)}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gov-blue-500 transition-all duration-500 rounded-full" 
                      style={{ width: `${walletCompletion}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

          </aside>
        )}

        {/* Mobile menu drawer */}
        {token && mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 md:hidden flex">
            <div className="w-64 bg-white h-full flex flex-col justify-between p-4 shadow-2xl animate-slideRight">
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <span className="font-extrabold text-gov-blue-900 text-sm">{localizeTerm("Navigation Menu", language)}</span>
                  <button onClick={() => setMobileMenuOpen(false)}>
                    <X className="w-5 h-5 text-slate-500" />
                  </button>
                </div>
                <div className="space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                  {navGroups.map((g, idx) => (
                    <div key={idx} className="space-y-1.5 text-left">
                      <span className="block px-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider">{g.group}</span>
                      <div className="space-y-0.5">
                        {g.items.map((item) => {
                          const Icon = item.icon;
                          const active = page === item.type;
                          return (
                            <button
                              key={item.type}
                              onClick={() => navigateTo(item.type)}
                              className={`w-full px-3 py-2 rounded-xl text-xs font-bold text-left transition-all flex items-center gap-2.5 border ${
                                active ? 'bg-gov-blue-500 text-white' : 'bg-white border-transparent text-slate-500 hover:bg-slate-50'
                              }`}
                            >
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              <span>{item.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full py-3 bg-red-50 hover:bg-red-100 border border-red-200 text-red-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4.5 h-4.5" /> Log Out
              </button>
            </div>
            <div className="flex-1" onClick={() => setMobileMenuOpen(false)} />
          </div>
        )}

        {/* Content Pane */}
        <main className={`flex-1 flex flex-col overflow-y-auto ${
          token && page !== 'setup' && page !== 'login' && page !== 'signup' ? 'md:ml-64' : ''
        }`}>
          <div className={`${!['landing', 'login', 'signup'].includes(page) ? 'w-full max-w-[1400px] mx-auto px-4 sm:px-6 md:px-8 py-6' : 'w-full'} flex-1 flex flex-col`}>
            
            {/* Public Routes */}
            {page === 'landing' && <Landing onNavigate={navigateTo} isLoggedIn={!!token} />}
            {page === 'login' && <Login onNavigate={navigateTo} onLoginSuccess={handleLoginSuccess} apiUrl={API_URL} />}
            {page === 'signup' && <Register onNavigate={navigateTo} onSignupSuccess={handleSignupSuccess} apiUrl={API_URL} />}
            {page === 'setup' && <InitialSetup onSetupComplete={() => navigateTo(isAdmin ? 'admin-dashboard' : 'dashboard')} token={token || ''} apiUrl={API_URL} />}
            
            {/* Citizen Routes */}
            {page === 'dashboard' && (
              <Dashboard 
                onNavigate={navigateTo} 
                setSelectedSchemeId={setSelectedSchemeId} 
                token={token || ''} 
                user={user} 
                apiUrl={API_URL} 
              />
            )}
            {page === 'schemes' && (
              <ExploreSchemes 
                onNavigate={navigateTo} 
                setSelectedSchemeId={setSelectedSchemeId} 
                token={token || ''} 
                isLoggedIn={!!token} 
                apiUrl={API_URL} 
              />
            )}
            {page === 'eligibility' && (
              <Eligibility 
                onNavigate={navigateTo} 
                setSelectedSchemeId={setSelectedSchemeId} 
                token={token || ''} 
                isLoggedIn={!!token} 
                apiUrl={API_URL} 
              />
            )}
            {page === 'schemeDetails' && selectedSchemeId !== null && (
              <SchemeDetails 
                schemeId={selectedSchemeId} 
                onNavigate={navigateTo} 
                token={token || ''} 
                isLoggedIn={!!token} 
                apiUrl={API_URL} 
              />
            )}
            {page === 'assistant' && (
              <AiAssistant 
                token={token || ''} 
                apiUrl={API_URL} 
              />
            )}
            {page === 'wallet' && <DataWallet token={token || ''} apiUrl={API_URL} onNavigate={navigateTo} />}
            {page === 'saved' && (
              <SavedSchemes 
                onNavigate={navigateTo} 
                setSelectedSchemeId={setSelectedSchemeId} 
                token={token || ''} 
                apiUrl={API_URL} 
              />
            )}
            {page === 'settings' && <Settings token={token || ''} user={user} apiUrl={API_URL} onLogout={handleLogout} />}

            {/* Admin Authenticated Routes */}
            {page === 'admin-dashboard' && <AdminDashboard token={token || ''} apiUrl={API_URL} onNavigate={navigateTo} />}
            {page === 'admin-schemes' && <AdminSchemesList token={token || ''} apiUrl={API_URL} onNavigate={navigateTo} />}
            {page === 'admin-create-scheme' && <CreateSchemeWizard token={token || ''} apiUrl={API_URL} onNavigate={navigateTo} />}
            {page === 'admin-edit-scheme' && selectedSchemeId && <EditScheme schemeId={selectedSchemeId} token={token || ''} apiUrl={API_URL} onNavigate={navigateTo} />}
            {page === 'admin-eligibility-tester' && <AdminEligibilityTester token={token || ''} apiUrl={API_URL} onNavigate={navigateTo} />}
            {page === 'admin-analytics' && <AdminAnalytics token={token || ''} apiUrl={API_URL} />}
            {page === 'admin-scheme-versions' && selectedSchemeId && <AdminSchemeVersions schemeId={selectedSchemeId} token={token || ''} apiUrl={API_URL} onNavigate={navigateTo} />}
            {page === 'admin-rag' && <AdminRagManagement token={token || ''} apiUrl={API_URL} />}
            {page === 'admin-audit' && <AdminAuditLog token={token || ''} apiUrl={API_URL} />}
            {page === 'admin-system-health' && <AdminSystemHealth token={token || ''} apiUrl={API_URL} />}

          </div>
        </main>
      </div>
    </div>
  );
}
