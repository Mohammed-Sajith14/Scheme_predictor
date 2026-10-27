import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  localizeSchemeName, localizeCategory, localizeStatus, localizeTerm, localizeField 
} from '../utils/localizationHelper';
import { 
  Sparkles, Wallet, Bookmark, ArrowRight, ShieldCheck, 
  HelpCircle, AlertTriangle, ChevronRight, Award, CircleHelp, RefreshCw
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (page: string) => void;
  setSelectedSchemeId: (id: number | null) => void;
  token: string;
  user: any;
  apiUrl: string;
}

export default function Dashboard({ onNavigate, setSelectedSchemeId, token, user, apiUrl }: DashboardProps) {
  const { t, language } = useLanguage();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = async () => {
    try {
      setError('');
      
      const [walletRes, schemesRes] = await Promise.all([
        fetch(`${apiUrl}/api/wallet/get`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${apiUrl}/api/schemes`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (!walletRes.ok || !schemesRes.ok) {
        throw new Error("Could not load dashboard statistics from backend.");
      }

      const walletData = await walletRes.json();
      const schemesData = await schemesRes.json();

      setData({
        wallet: walletData,
        eligibleSchemes: schemesData
      });
    } catch (err: any) {
      setError(err.message || "Failed to load dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [token, apiUrl]);

  const handleRecalculate = async () => {
    setRefreshing(true);
    try {
      const res = await fetch(`${apiUrl}/api/schemes/recalculate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        await fetchDashboard();
      }
    } catch (e) {
      console.error(e);
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-4">
        <div className="w-10 h-10 border-4 border-gov-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm font-semibold">Decrypting wallet variables...</span>
      </div>
    );
  }

  const wallet = data?.wallet || {};
  const results = data?.eligibleSchemes || [];
  const completion = Math.round(wallet.profileCompletion || 0);

  // Group stats
  const totalSchemes = results.length;
  const highlyEligible = results.filter((r: any) => r.status === 'HIGHLY_ELIGIBLE').length;
  const potentialMatches = results.filter((r: any) => r.status === 'POTENTIAL_MATCH' || r.status === 'LIKELY_ELIGIBLE').length;

  const topRecommendations = [...results]
    .sort((a: any, b: any) => (b.overallScore || 0) - (a.overallScore || 0))
    .slice(0, 2);

  const allMissing = Array.from(new Set(results.flatMap((r: any) => r.missingFields || []))).slice(0, 3);

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-[1400px] mx-auto text-left animate-fadeIn">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gov-blue-900 font-display tracking-tight">
            {localizeTerm('Good morning', language)}, {user?.name || localizeTerm('Citizen', language)} 👋
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">{localizeTerm('Here is your personalized government benefit overview.', language)}</p>
        </div>
        
        <button
          onClick={handleRecalculate}
          disabled={refreshing}
          className="px-4 py-2 border border-slate-300 hover:bg-slate-50 disabled:bg-slate-100 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          <span>{refreshing ? t('dashboard.recalculating', 'Evaluating Rules...') : t('dashboard.recalculate', 'Recalculate Matches')}</span>
        </button>
      </div>

      {/* 1. Wallet Overview Card (Full-width) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Completeness Ring */}
          <div className="relative w-20 h-20 flex items-center justify-center flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="40" cy="40" r="34" stroke="#f1f5f9" strokeWidth="6" fill="transparent" />
              <circle cx="40" cy="40" r="34" stroke="#0b57d0" strokeWidth="6" fill="transparent" 
                      strokeDasharray={2 * Math.PI * 34}
                      strokeDashoffset={2 * Math.PI * 34 * (1 - completion / 100)} 
                      className="transition-all duration-700 ease-out"
              />
            </svg>
            <span className="absolute text-sm font-black text-gov-blue-950 font-display">{completion}%</span>
          </div>
          <div className="text-left space-y-1">
            <h3 className="font-extrabold text-gov-blue-900 text-sm">{t('dashboard.wallet_card_title', 'Unified Socio-Economic Data Wallet')}</h3>
            <p className="text-slate-500 text-xs leading-relaxed max-w-md">
              {t('dashboard.wallet_card_desc', 'Complete your wallet profile variables to allow the eligibility scoring engine to evaluate criteria matching rates.')}
            </p>
          </div>
        </div>

        <button
          onClick={() => onNavigate('wallet')}
          className="px-5 py-3 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1.5 shadow-sm shadow-gov-blue-500/10 cursor-pointer"
        >
          <Wallet className="w-4 h-4" />
          <span>{t('dashboard.btn_update_wallet', 'Update Data Wallet')}</span>
        </button>
      </div>

      {/* 2. Metrics Grid (3 Columns) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { value: totalSchemes, label: t('explore.title', 'Available Schemes'), badge: localizeTerm('Active Registry', language), color: 'bg-white border-slate-200 text-gov-blue-950' },
          { value: highlyEligible, label: t('dashboard.stat.eligible', 'Highly Eligible'), badge: localizeTerm('Satisfied Requirements', language), color: 'bg-emerald-50/50 border-emerald-200 text-emerald-800' },
          { value: potentialMatches, label: t('dashboard.stat.high_match', 'Potential Matches'), badge: localizeTerm('Likely Eligible / Gaps Flagged', language), color: 'bg-amber-50/50 border-amber-200 text-amber-800' }
        ].map((stat, idx) => (
          <div key={idx} className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between ${stat.color}`}>
            <div>
              <span className="block text-[9px] font-black uppercase tracking-wider opacity-60">{stat.label}</span>
              <span className="text-2xl font-black font-display mt-2 block">{stat.value}</span>
            </div>
            <span className="text-[8px] font-bold uppercase tracking-wider mt-4 opacity-50 block">{stat.badge}</span>
          </div>
        ))}
      </div>

      {/* 3. Recommendations & Missing Info (Split Grid) */}
      <div className="grid md:grid-cols-12 gap-8">
        
        {/* Left Column: Top Recommendations */}
        <div className="md:col-span-8 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 font-display">{localizeTerm("Top Scheme Matches", language)}</h2>
            <span 
              onClick={() => onNavigate('schemes')}
              className="text-xs font-bold text-gov-blue-500 hover:text-gov-blue-700 cursor-pointer flex items-center gap-0.5"
            >
              <span>{localizeTerm("View All Schemes ->", language)}</span>
            </span>
          </div>

          {topRecommendations.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-2xl">
              <p className="text-slate-500 text-xs">{localizeTerm("No matching schemes", language)}</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-6">
              {topRecommendations.map((rec) => {
                const score = Math.round(rec.overallScore || 0);
                const status = rec.status;
                
                let statusBadge = "bg-slate-100 text-slate-700 border-slate-200";
                if (status === 'HIGHLY_ELIGIBLE') statusBadge = "bg-emerald-50 text-emerald-800 border-emerald-200";
                else if (status === 'LIKELY_ELIGIBLE') statusBadge = "bg-sky-50 text-sky-800 border-sky-200";
                else if (status === 'POTENTIAL_MATCH') statusBadge = "bg-amber-50 text-amber-800 border-amber-200";

                return (
                  <div 
                    key={rec.schemeId}
                    onClick={() => {
                      setSelectedSchemeId(rec.schemeId);
                      onNavigate('schemeDetails');
                    }}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer p-6 flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      <div className="flex justify-between items-start">
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-gov-blue-50 text-gov-blue-600 rounded">
                          {localizeCategory(rec.category || 'General', language)}
                        </span>
                        <span className={`text-[8px] font-bold border px-1.5 py-0.5 rounded ${statusBadge}`}>
                          {localizeStatus(status, language)}
                        </span>
                      </div>

                      <div>
                        <h3 className="font-extrabold text-sm text-gov-blue-900 group-hover:text-gov-blue-500 transition-colors leading-snug line-clamp-1">{localizeSchemeName(rec.schemeName, language)}</h3>
                        <p className="text-[10px] text-slate-400 mt-0.5">{rec.department}</p>
                      </div>

                      <div className="flex items-end gap-2 border-y border-slate-50 py-3">
                        <span className="text-3xl font-black text-gov-blue-600 font-display leading-none">
                          {rec.status === 'INFORMATION_NEEDED' || rec.coverageScore < 100
                            ? `${Math.round(rec.coverageScore || 0)}%`
                            : `${Math.round(rec.overallScore || 0)}%`}
                        </span>
                        <div className="text-[8px] font-extrabold text-slate-400 uppercase tracking-wider leading-none pb-0.5">
                          <span>{rec.status === 'INFORMATION_NEEDED' || rec.coverageScore < 100 ? localizeTerm('Coverage', language) : localizeTerm('Score', language)}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5 text-[10px] text-slate-500">
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{localizeTerm('Income Criteria Matched', language)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>{localizeTerm('Age Threshold Matched', language)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 mt-4 border-t border-slate-50 text-[11px] font-bold text-gov-blue-500">
                      <span>{localizeTerm('View Parameters', language)}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Quick Actions & Missing Info Gaps */}
        <div className="md:col-span-4 space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-slate-400 font-display">{localizeTerm("Informational Gaps", language)}</h2>
          
          <div className="bg-amber-50/50 rounded-2xl border border-amber-200/50 shadow-sm p-6 flex flex-col justify-between h-[calc(100%-32px)]">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                <h3 className="font-extrabold text-xs">{localizeTerm("Missing Parameters", language)}</h3>
              </div>
              
              <p className="text-slate-600 text-xs leading-relaxed">
                {localizeTerm("Provide these parameters to recalculate matches against programs.", language)}
              </p>

              {allMissing.length > 0 ? (
                <div className="space-y-1.5">
                  {allMissing.map((f: any, i: number) => (
                    <div key={i} className="px-3 py-2 bg-white rounded-xl border border-amber-100 text-xs font-bold text-slate-700 capitalize flex items-center justify-between">
                      <span>{localizeField(f, language)}</span>
                      <span className="text-[9px] text-amber-600 font-black">{localizeTerm("Missing", language)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[10px] text-emerald-600 font-bold">✓ {localizeTerm("Profile is fully updated for matching schemes.", language)}</p>
              )}
            </div>

            <button
              onClick={() => onNavigate('wallet')}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer text-center mt-4"
            >
              {localizeTerm("Update Wallet Parameters", language)}
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
