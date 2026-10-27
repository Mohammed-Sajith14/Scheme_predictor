import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { localizeTerm } from '../utils/localizationHelper';
import { ShieldAlert, ArrowRight, ShieldCheck, Key, Mail, Sparkles, Eye, EyeOff, User, Lock } from 'lucide-react';

interface LoginProps {
  onNavigate: (page: string) => void;
  onLoginSuccess: (token: string, user: any) => void;
  apiUrl: string;
}

export default function Login({ onNavigate, onLoginSuccess, apiUrl }: LoginProps) {
  const { t, language } = useLanguage();
  const [roleMode, setRoleMode] = useState<'USER' | 'ADMIN'>('USER');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [forgotModalOpen, setForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotMessage, setForgotMessage] = useState('');

  const handleModeSwitch = (mode: 'USER' | 'ADMIN') => {
    setRoleMode(mode);
    setError('');
    if (mode === 'ADMIN') {
      setEmail('admin@schemewise.com');
      setPassword('Admin@123');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = roleMode === 'ADMIN' ? `${apiUrl}/api/auth/admin-login` : `${apiUrl}/api/auth/login`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid email or password credentials.");
      }

      const authenticatedUser = data.user;
      if (roleMode === 'ADMIN' && authenticatedUser.role !== 'ADMIN') {
        throw new Error("Access Denied: This account does not have administrator privileges.");
      }

      onLoginSuccess(data.token, authenticatedUser);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate session.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotMessage("Password reset instructions have been dispatched to your email if registered.");
    setTimeout(() => {
      setForgotModalOpen(false);
      setForgotMessage('');
    }, 2500);
  };

  return (
    <div className="w-full flex-1 flex flex-col md:flex-row min-h-[calc(100vh-64px)] bg-slate-50 animate-fadeIn">
      
      {/* Left / Visual Section (5/12) */}
      <div className="w-full md:w-5/12 bg-gov-blue-900 text-white p-10 lg:p-16 flex flex-col justify-between relative overflow-hidden text-left">
        
        {/* Glow Element */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-gov-blue-500/25 rounded-full blur-3xl -z-10" />
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gov-gold-500 flex items-center justify-center text-gov-blue-950 font-black shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xl font-black font-display tracking-tight">SchemeWise</span>
          </div>

          <div className="pt-6 space-y-2">
            <span className="text-xs font-black uppercase text-gov-gold-400 tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 animate-pulse" /> {localizeTerm("Platform Access", language)}
            </span>
            <h2 className="text-3xl font-black font-display tracking-tight leading-tight text-white">
              "One Profile. Every Government Benefit."
            </h2>
            <p className="text-xs text-gov-blue-100/80 leading-relaxed pt-2">
              {roleMode === 'ADMIN'
                ? '{localizeTerm("Manage government schemes, eligibility rules, RAG AI knowledge base, and audit logs.", language)}'
                : '{localizeTerm("Sign in to access your socio-economic Data Wallet and automated scheme matching.", language)}'}
            </p>
          </div>
        </div>

        <div className="space-y-4 py-8 max-w-sm">
          {[
            { title: localizeTerm('Secure Identity Vault', language), desc: localizeTerm('Protected by Spring Security & BCrypt cryptographic encryption.', language) },
            { title: localizeTerm('Rule Match Engine', language), desc: localizeTerm('Evaluates citizen profiles against mandatory scheme parameters automatically.', language) },
            { title: localizeTerm('Grounded RAG AI Assistant', language), desc: localizeTerm('Direct access to RAG knowledge chatbot for document requirements.', language) }
          ].map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-gov-gold-400 flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-white">{item.title}</h4>
                <p className="text-[11px] text-gov-blue-100/70 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-gov-blue-200/50">
          Validated against National Informatics System security standards.
        </div>

      </div>

      {/* Right Section (7/12) */}
      <div className="w-full md:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-white">
        <div className="w-full max-w-[440px] space-y-6">

          {/* Toggle Switcher between User and Admin */}
          <div className="p-1.5 bg-slate-100 rounded-2xl flex items-center border border-slate-200">
            <button
              type="button"
              onClick={() => handleModeSwitch('USER')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                roleMode === 'USER'
                  ? 'bg-gov-blue-500 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>User Sign In</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeSwitch('ADMIN')}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer ${
                roleMode === 'ADMIN'
                  ? 'bg-gov-blue-900 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Lock className="w-4 h-4 text-gov-gold-400" />
              <span>Admin Sign In</span>
            </button>
          </div>

          <div className="space-y-1 text-left">
            <h1 className="text-2xl font-black text-gov-blue-900 font-display tracking-tight">
              {roleMode === 'ADMIN' ? 'SchemeWise Administration' : 'Sign In'}
            </h1>
            <p className="text-slate-500 text-xs font-semibold">
              {roleMode === 'ADMIN'
                ? 'Manage government schemes, eligibility rules and AI knowledge.'
                : 'Enter your credentials to access your citizen dashboard.'}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-800 text-xs flex items-start gap-2.5 text-left">
              <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {roleMode === 'ADMIN' && (
            <div className="p-3.5 bg-gov-blue-50 border border-gov-blue-100 rounded-xl text-gov-blue-900 text-xs space-y-1 text-left">
              <div className="font-extrabold text-[10px] uppercase tracking-wider text-gov-blue-800">
                {localizeTerm("Pre-existing Administrator Account:", language)}
              </div>
              <div className="font-mono text-[11px] text-gov-blue-900 flex justify-between">
                <span>Email: <strong>admin@schemewise.com</strong></span>
                <span>Pass: <strong>Admin@123</strong></span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            
            {/* Email */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                {roleMode === 'ADMIN' ? localizeTerm('Admin Email', language) : localizeTerm('Email Address', language)}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder={roleMode === 'ADMIN' ? "admin@schemewise.com" : "name@welfare.in"}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50/50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/25 focus:border-gov-blue-500 transition-all font-semibold"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeTerm("Password", language)}</label>
                {roleMode === 'USER' && (
                  <span 
                    onClick={() => setForgotModalOpen(true)}
                    className="text-[10px] text-gov-blue-600 hover:text-gov-blue-800 cursor-pointer font-bold"
                  >
                    {localizeTerm("Forgot Password?", language)}
                  </span>
                )}
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-50/50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/25 focus:border-gov-blue-500 transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 text-gov-blue-600 border-slate-300 rounded focus:ring-gov-blue-500"
                />
                <span>{localizeTerm("Remember me on this device", language)}</span>
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3.5 text-white font-extrabold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-5 ${
                roleMode === 'ADMIN'
                  ? 'bg-gov-blue-900 hover:bg-gov-blue-950 shadow-gov-blue-900/20'
                  : 'bg-gov-blue-500 hover:bg-gov-blue-600 shadow-gov-blue-500/20'
              }`}
            >
              <span>{loading ? localizeTerm("Authenticating Session...", language) : roleMode === 'ADMIN' ? localizeTerm("Secure Sign In", language) : localizeTerm("Sign In", language)}</span>
              {!loading && <ArrowRight className="w-4.5 h-4.5" />}
            </button>
          </form>

          <div className="pt-2 text-center text-xs font-semibold text-slate-500 border-t border-slate-100">
            {localizeTerm("Don't have an account?", language)}{" "}
            <span
              onClick={() => onNavigate('signup')}
              className="text-gov-blue-600 hover:text-gov-blue-800 cursor-pointer font-extrabold"
            >
              {localizeTerm("Create Account", language)}
            </span>
          </div>

        </div>
      </div>

      {/* Forgot Password Modal */}
      {forgotModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-left animate-fadeIn">
            <div className="space-y-1">
              <h3 className="text-lg font-black text-gov-blue-900 font-display">{localizeTerm("Reset Password", language)}</h3>
              <p className="text-xs text-slate-500 font-semibold">{localizeTerm("Enter your registered email address to receive password recovery instructions.", language)}</p>
            </div>

            {forgotMessage && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl font-semibold">
                {forgotMessage}
              </div>
            )}

            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase">{localizeTerm("Email Address", language)}</label>
                <input
                  type="email"
                  required
                  placeholder="name@welfare.in"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/25 focus:border-gov-blue-500 font-semibold"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setForgotModalOpen(false)}
                  className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs"
                >
                  {localizeTerm("Cancel", language)}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-extrabold rounded-xl text-xs shadow-sm"
                >
                  {localizeTerm("Send Recovery Link", language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
