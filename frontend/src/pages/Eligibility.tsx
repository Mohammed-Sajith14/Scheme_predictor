import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  localizeSchemeName, localizeSchemeDesc, localizeCategory, 
  localizeStatus, localizeTerm, localizeField 
} from '../utils/localizationHelper';
import { 
  Search, SlidersHorizontal, ArrowUpDown, Bookmark, Award, AlertCircle, 
  ArrowRight, Calendar, Info, CheckCircle2, XCircle, HelpCircle, 
  Sparkles, ExternalLink, RefreshCw, ChevronRight, FileText, Wallet,
  Building, IndianRupee, Tag, ShieldCheck, Filter
} from 'lucide-react';
import { getSchemeImageUrl } from '../utils/imageHelper';

interface EligibilityProps {
  onNavigate: (page: string) => void;
  setSelectedSchemeId: (id: number | null) => void;
  token: string;
  isLoggedIn: boolean;
  apiUrl: string;
}

export default function Eligibility({ 
  onNavigate, 
  setSelectedSchemeId, 
  token, 
  isLoggedIn, 
  apiUrl 
}: EligibilityProps) {
  const { t, language } = useLanguage();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All'); // 'All' | 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'INFORMATION_NEEDED'
  const [sortBy, setSortBy] = useState('Recommended'); // 'Recommended' | 'Name' | 'Benefits'

  // Fetch schemes and wallet
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');

        const endpoint = isLoggedIn ? `${apiUrl}/api/schemes` : `${apiUrl}/api/schemes/public`;
        const headers: any = {};
        if (isLoggedIn && token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(endpoint, { headers });
        if (!res.ok) {
          throw new Error('Failed to load government scheme registry');
        }
        const data = await res.json();
        setSchemes(Array.isArray(data) ? data : []);

        // Fetch wallet if logged in
        if (isLoggedIn && token) {
          try {
            const wRes = await fetch(`${apiUrl}/api/wallet/get`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });
            if (wRes.ok) {
              const wData = await wRes.json();
              setWallet(wData);
            }
          } catch (wErr) {
            console.warn('Wallet fetch error', wErr);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load government scheme registry.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [apiUrl, isLoggedIn, token]);

  // Handle bookmarking / saving
  const handleSaveScheme = async (schemeId: number, currentSaved: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      onNavigate('login');
      return;
    }

    try {
      const endpoint = currentSaved 
        ? `${apiUrl}/api/schemes/unsave/${schemeId}` 
        : `${apiUrl}/api/schemes/save/${schemeId}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSchemes(prev => prev.map(s => {
          const sId = s.schemeId || s.id;
          if (sId === schemeId) {
            return { ...s, saved: !currentSaved };
          }
          return s;
        }));
      }
    } catch (err) {
      console.error('Failed to toggle bookmark', err);
    }
  };

  // Convert raw failed rule string into simple and neat humanized sentences
  const parseFailedRule = (rule: string): { label: string; condition: string; userVal: string; simpleExplanation: string } => {
    if (!rule || typeof rule !== 'string') {
      return {
        label: localizeTerm('Requirement', language),
        condition: '',
        userVal: '',
        simpleExplanation: localizeTerm('Mandatory criteria evaluation', language)
      };
    }

    // Format: "Annual Income requirement: <= 250000 (Your Annual Income: 450000)"
    const match = rule.match(/^(.*?)\s*requirement:\s*([^\(]+)(?:\(Your\s*(.*?):\s*(.*?)\))?$/i);
    if (match) {
      const rawLabel = match[1].trim();
      const rawOpVal = match[2].trim();
      const userVal = match[4] ? match[4].trim() : '';

      const localizedField = localizeField(rawLabel, language);

      // Translate operators
      let conditionText = rawOpVal;
      let humanMeaning = '';

      if (rawOpVal.startsWith('<=')) {
        const threshold = rawOpVal.replace('<=', '').trim();
        conditionText = `${localizeTerm('Must be', language)} ≤ ${threshold}`;
        humanMeaning = `${localizedField} ${localizeTerm('Must be', language)} ${localizeTerm('At most', language)} ${threshold}. ${localizeTerm('Your Profile', language)}: ${userVal} (${localizeTerm('Exceeds limit', language)}).`;
      } else if (rawOpVal.startsWith('>=')) {
        const threshold = rawOpVal.replace('>=', '').trim();
        conditionText = `${localizeTerm('Must be', language)} ≥ ${threshold}`;
        humanMeaning = `${localizedField} ${localizeTerm('Must be', language)} ${localizeTerm('At least', language)} ${threshold}. ${localizeTerm('Your Profile', language)}: ${userVal}.`;
      } else if (rawOpVal.startsWith('==')) {
        const expected = rawOpVal.replace('==', '').trim();
        conditionText = `${localizeTerm('Must be', language)} ${expected}`;
        humanMeaning = `${localizedField} ${localizeTerm('Must be', language)} ${expected}. ${localizeTerm('Your Profile', language)}: ${userVal} (${localizeTerm('Does not match', language)}).`;
      } else if (rawOpVal.toLowerCase().startsWith('in')) {
        const expectedList = rawOpVal.replace(/in/i, '').trim();
        conditionText = `${localizeTerm('Must be', language)} ${expectedList}`;
        humanMeaning = `${localizedField} ${localizeTerm('Must be', language)} ${expectedList}. ${localizeTerm('Your Profile', language)}: ${userVal}.`;
      } else {
        humanMeaning = `${localizedField}: ${rawOpVal}. ${localizeTerm('Your Profile', language)}: ${userVal || 'N/A'}`;
      }

      return {
        label: localizedField,
        condition: conditionText,
        userVal: userVal,
        simpleExplanation: humanMeaning
      };
    }

    // Fallback simple parsing
    return {
      label: localizeTerm('Requirement', language),
      condition: '',
      userVal: '',
      simpleExplanation: rule
    };
  };

  // Determine eligibility status grouping
  const getEligibilityState = (item: any): 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'INFORMATION_NEEDED' | 'GUEST' => {
    if (!isLoggedIn) return 'GUEST';
    if (item.status === 'NOT_ELIGIBLE') return 'NOT_ELIGIBLE';
    if (item.status === 'INFORMATION_NEEDED' || (item.coverageScore !== undefined && item.coverageScore < 100 && (!item.overallScore || item.overallScore === 0))) {
      return 'INFORMATION_NEEDED';
    }
    if (item.status === 'HIGHLY_ELIGIBLE' || item.status === 'LIKELY_ELIGIBLE' || item.status === 'POTENTIAL_MATCH' || (item.overallScore && item.overallScore > 0)) {
      return 'ELIGIBLE';
    }
    return 'ELIGIBLE';
  };

  // Extract categories dynamically
  const categories = useMemo(() => {
    const set = new Set<string>();
    schemes.forEach(s => {
      if (s.category) set.add(s.category);
    });
    return ['All', ...Array.from(set)];
  }, [schemes]);

  // Filter and sort schemes
  const filteredSchemes = useMemo(() => {
    return schemes.filter(s => {
      const name = s.name || '';
      const dept = s.department || '';
      const desc = s.description || '';
      const benefits = s.benefits || '';

      const matchesSearch = 
        name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.toLowerCase().includes(searchTerm.toLowerCase()) ||
        desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
        benefits.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;

      const state = getEligibilityState(s);
      let matchesStatus = true;
      if (selectedStatus === 'ELIGIBLE') {
        matchesStatus = state === 'ELIGIBLE';
      } else if (selectedStatus === 'NOT_ELIGIBLE') {
        matchesStatus = state === 'NOT_ELIGIBLE';
      } else if (selectedStatus === 'INFORMATION_NEEDED') {
        matchesStatus = state === 'INFORMATION_NEEDED';
      }

      return matchesSearch && matchesCategory && matchesStatus;
    }).sort((a, b) => {
      if (sortBy === 'Recommended') {
        // Priority: Eligible high scores first, then info needed, then not eligible
        const stateA = getEligibilityState(a);
        const stateB = getEligibilityState(b);
        const rank = (st: string) => st === 'ELIGIBLE' ? 1 : st === 'INFORMATION_NEEDED' ? 2 : st === 'NOT_ELIGIBLE' ? 3 : 4;
        if (rank(stateA) !== rank(stateB)) {
          return rank(stateA) - rank(stateB);
        }
        const scoreA = a.overallScore || 0;
        const scoreB = b.overallScore || 0;
        return scoreB - scoreA;
      } else if (sortBy === 'Name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'Benefits') {
        return (b.benefits || '').localeCompare(a.benefits || '');
      }
      return 0;
    });
  }, [schemes, searchTerm, selectedCategory, selectedStatus, sortBy, isLoggedIn]);

  // Counts for summary metrics
  const counts = useMemo(() => {
    let eligible = 0;
    let notEligible = 0;
    let infoNeeded = 0;
    schemes.forEach(s => {
      const st = getEligibilityState(s);
      if (st === 'ELIGIBLE') eligible++;
      else if (st === 'NOT_ELIGIBLE') notEligible++;
      else if (st === 'INFORMATION_NEEDED') infoNeeded++;
    });
    return {
      total: schemes.length,
      eligible,
      notEligible,
      infoNeeded
    };
  }, [schemes, isLoggedIn]);

  return (
    <div className="space-y-8 animate-fadeIn pb-16">
      
      {/* Top Banner / Hero Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-gov-blue-900 via-gov-blue-800 to-indigo-950 p-6 sm:p-8 md:p-10 text-white shadow-xl overflow-hidden border border-gov-blue-700/40">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-80 h-80 rounded-full bg-gov-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-60 h-60 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-gov-blue-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>{localizeTerm('Eligibility Checker', language)}</span>
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black font-display tracking-tight text-white leading-tight">
            {localizeTerm('Check your personalized eligibility', language)}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-2xl">
            {t('eligibility.hero_desc', 'Explore every scheme with transparent evaluation. Each card details mandatory criteria, shows whether you are eligible or not eligible, and provides simple, plain-language explanations.')}
          </p>

          {/* Quick Stats Strip */}
          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                {localizeTerm('Total Welfare Programs', language)}
              </span>
              <span className="text-xl sm:text-2xl font-black text-white font-display mt-0.5 block">
                {counts.total}
              </span>
            </div>

            <div className="bg-emerald-500/20 backdrop-blur-md rounded-2xl p-3 border border-emerald-400/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-200 block">
                  {localizeTerm('You Are Eligible', language)}
                </span>
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-emerald-200 font-display mt-0.5 block">
                {counts.eligible}
              </span>
            </div>

            <div className="bg-rose-500/20 backdrop-blur-md rounded-2xl p-3 border border-rose-400/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-200 block">
                  {localizeTerm('Not Currently Eligible', language)}
                </span>
                <XCircle className="w-4 h-4 text-rose-300" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-rose-200 font-display mt-0.5 block">
                {counts.notEligible}
              </span>
            </div>

            <div className="bg-amber-500/20 backdrop-blur-md rounded-2xl p-3 border border-amber-400/30">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-200 block">
                  {localizeTerm('Profile Incomplete', language)}
                </span>
                <HelpCircle className="w-4 h-4 text-amber-300" />
              </div>
              <span className="text-xl sm:text-2xl font-black text-amber-200 font-display mt-0.5 block">
                {counts.infoNeeded}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Guest or Incomplete Wallet Prompt Banner */}
      {!isLoggedIn ? (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5 text-amber-900">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">
                {localizeTerm('Sign in to see personalized evaluation', language)}
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {t('eligibility.guest_hint', 'Sign in to let our automated Rule & ML Engine verify your eligibility instantly against your demographic data.')}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('login')}
            className="px-5 py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <span>{localizeTerm('Sign In', language)}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : counts.infoNeeded > 0 ? (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="flex items-center gap-3.5 text-sky-900">
            <div className="w-10 h-10 rounded-xl bg-gov-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm text-slate-800">
                {localizeTerm('Complete Data Wallet', language)} ({counts.infoNeeded} {localizeTerm('details needed', language)})
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                {localizeTerm('Wallet banner desc', language)}
              </p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('wallet')}
            className="px-5 py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white font-extrabold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2 whitespace-nowrap cursor-pointer"
          >
            <span>{localizeTerm('Complete Data Wallet', language)}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      ) : null}

      {/* Search, Filter & View Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
        
        {/* Main Search Bar */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={localizeTerm('Search schemes', language)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-medium text-slate-800"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort selector */}
          <div className="flex items-center gap-2">
            <div className="relative min-w-[170px]">
              <ArrowUpDown className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-gov-blue-500 cursor-pointer appearance-none"
              >
                <option value="Recommended">{localizeTerm('Recommended', language)}</option>
                <option value="Name">{localizeTerm('Alphabetical', language)} (A-Z)</option>
                <option value="Benefits">{localizeTerm('Key Benefits', language)}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Filter Pills Strip: Status Tabs + Category Dropdown */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          
          {/* Status Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" />
              <span>{localizeTerm('Filter by Status', language)}:</span>
            </span>

            <button
              onClick={() => setSelectedStatus('All')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                selectedStatus === 'All'
                  ? 'bg-gov-blue-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {localizeTerm('All Schemes', language)} ({schemes.length})
            </button>

            <button
              onClick={() => setSelectedStatus('ELIGIBLE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === 'ELIGIBLE'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200/60'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{localizeTerm('Eligible Schemes', language)} ({counts.eligible})</span>
            </button>

            <button
              onClick={() => setSelectedStatus('NOT_ELIGIBLE')}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedStatus === 'NOT_ELIGIBLE'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200/60'
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>{localizeTerm('Ineligible Schemes', language)} ({counts.notEligible})</span>
            </button>

            {counts.infoNeeded > 0 && (
              <button
                onClick={() => setSelectedStatus('INFORMATION_NEEDED')}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedStatus === 'INFORMATION_NEEDED'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200/60'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{localizeTerm('Information Needed', language)} ({counts.infoNeeded})</span>
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
              {localizeTerm('Category', language)}:
            </span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-gov-blue-500 cursor-pointer"
            >
              <option value="All">{localizeTerm('All Categories', language)}</option>
              {categories.filter(c => c !== 'All').map(cat => (
                <option key={cat} value={cat}>
                  {localizeCategory(cat, language)}
                </option>
              ))}
            </select>
          </div>
        </div>

      </div>

      {/* Schemes List with Side-by-Side Details & Simple Explanation Cards */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-10 h-10 border-4 border-gov-blue-200 border-t-gov-blue-600 rounded-full animate-spin" />
          <p className="text-xs font-extrabold text-slate-500">{localizeTerm('Evaluating criteria against your Data Wallet...', language)}</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-sm font-bold">{error}</p>
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 space-y-4">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="font-black text-lg text-slate-800">
            {localizeTerm('No matching schemes', language)}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {localizeTerm('Adjust search', language)}
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('All');
              setSelectedStatus('All');
            }}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            {localizeTerm('Reset Filters', language)}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredSchemes.map((item) => {
            const schemeId = item.schemeId || item.id;
            const state = getEligibilityState(item);
            const isEligible = state === 'ELIGIBLE';
            const isNotEligible = state === 'NOT_ELIGIBLE';
            const isInfoNeeded = state === 'INFORMATION_NEEDED';
            const score = item.overallScore !== null && item.overallScore !== undefined ? Math.round(item.overallScore) : null;

            // Failed rules parsing for neat explanations
            const failedRulesList: string[] = item.failedRules || [];

            return (
              <div 
                key={schemeId}
                className={`bg-white rounded-3xl border transition-all duration-300 shadow-sm hover:shadow-md overflow-hidden ${
                  isEligible 
                    ? 'border-emerald-200/80 hover:border-emerald-300' 
                    : isNotEligible 
                    ? 'border-rose-200/80 hover:border-rose-300' 
                    : isInfoNeeded 
                    ? 'border-amber-200/80 hover:border-amber-300' 
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="grid lg:grid-cols-12 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                  
                  {/* Left / Main Section (Important Details) - 7 cols */}
                  <div className="lg:col-span-7 p-6 sm:p-7 flex flex-col justify-between space-y-6">
                    
                    <div className="space-y-4">
                      {/* Category, Department & Action tags */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-lg bg-gov-blue-50 text-gov-blue-700 border border-gov-blue-100">
                            {localizeCategory(item.category || 'General', language)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <Building className="w-3.5 h-3.5 text-slate-400" />
                            <span className="line-clamp-1 max-w-[260px]">{item.department || 'Government of India'}</span>
                          </span>
                        </div>

                        {/* Bookmark Button */}
                        <button
                          type="button"
                          onClick={(e) => handleSaveScheme(schemeId, item.saved, e)}
                          title={item.saved ? localizeTerm('Saved', language) : localizeTerm('Save', language)}
                          className={`p-2 rounded-xl border transition-all cursor-pointer ${
                            item.saved 
                              ? 'bg-purple-50 text-purple-600 border-purple-200' 
                              : 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <Bookmark className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Scheme Title */}
                      <div>
                        <h3 
                          onClick={() => {
                            setSelectedSchemeId(schemeId);
                            onNavigate('schemeDetails');
                          }}
                          className="text-lg sm:text-xl font-black text-gov-blue-900 hover:text-gov-blue-600 transition-colors cursor-pointer font-display leading-snug"
                        >
                          {localizeSchemeName(item.name, language)}
                        </h3>
                        
                        <p className="text-xs text-slate-500 mt-2 leading-relaxed line-clamp-2">
                          {localizeSchemeDesc(item.description, item.name, language)}
                        </p>
                      </div>

                      {/* Key Benefit Highlight Box */}
                      {item.benefits && (
                        <div className="p-3.5 bg-gradient-to-r from-emerald-50/70 to-teal-50/50 border border-emerald-100/90 rounded-2xl flex items-start gap-3">
                          <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-emerald-500/20">
                            <IndianRupee className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 block">
                              {localizeTerm('Key Benefits', language)}
                            </span>
                            <p className="text-xs font-bold text-slate-800 mt-0.5 leading-snug">
                              {item.benefits}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Metadata Chips: Timeline & Beneficiaries */}
                      <div className="flex flex-wrap items-center gap-3 pt-1 text-[11px] text-slate-500 font-semibold">
                        {item.deadline && (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{item.deadline}</span>
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600">
                          <Tag className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.state || localizeTerm('National', language)}</span>
                        </span>
                      </div>
                    </div>

                    {/* Left Actions Footer */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        onClick={() => {
                          setSelectedSchemeId(schemeId);
                          onNavigate('schemeDetails');
                        }}
                        className="px-4 py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-2 cursor-pointer shadow-sm shadow-gov-blue-600/10"
                      >
                        <span>{localizeTerm('View Details', language)}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {item.officialUrl && (
                        <a
                          href={item.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3.5 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
                        >
                          <span>{localizeTerm('Apply Online', language)}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      )}
                    </div>

                  </div>

                  {/* Right Section: Eligibility Status & Simple Explanation - 5 cols */}
                  <div className={`lg:col-span-5 p-6 sm:p-7 flex flex-col justify-between ${
                    isEligible 
                      ? 'bg-emerald-50/30' 
                      : isNotEligible 
                      ? 'bg-rose-50/30' 
                      : isInfoNeeded 
                      ? 'bg-amber-50/30' 
                      : 'bg-slate-50/40'
                  }`}>
                    
                    <div className="space-y-4">
                      
                      {/* Eligibility Status Pill */}
                      <div className="flex items-center justify-between">
                        {isEligible ? (
                          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 font-black text-xs uppercase tracking-wide shadow-sm">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>{localizeTerm('Eligible', language)}</span>
                          </div>
                        ) : isNotEligible ? (
                          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-rose-100 border border-rose-300 text-rose-800 font-black text-xs uppercase tracking-wide shadow-sm">
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>{localizeTerm('Not Eligible', language)}</span>
                          </div>
                        ) : isInfoNeeded ? (
                          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-100 border border-amber-300 text-amber-900 font-black text-xs uppercase tracking-wide shadow-sm">
                            <HelpCircle className="w-4 h-4 text-amber-600" />
                            <span>{localizeTerm('Information Needed', language)}</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-200 border border-slate-300 text-slate-700 font-bold text-xs uppercase tracking-wide">
                            <ShieldCheck className="w-4 h-4 text-slate-500" />
                            <span>{localizeTerm('Evaluation Available', language)}</span>
                          </div>
                        )}

                        {/* Match Score Badge (if available) */}
                        {isLoggedIn && score !== null && score > 0 && (
                          <div className="text-right">
                            <span className="text-xl font-black font-display text-gov-blue-900 leading-none block">
                              {score}%
                            </span>
                            <span className="text-[9px] font-bold uppercase text-slate-400 block tracking-wider mt-0.5">
                              {localizeTerm('Match Score', language)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Explanation Section */}
                      <div className="space-y-2">
                        
                        {isNotEligible ? (
                          /* NOT ELIGIBLE - RIGHT SIDE SIMPLE AND NEAT EXPLANATION */
                          <div className="space-y-3">
                            <span className="text-xs font-black text-rose-900 uppercase tracking-wider block flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-rose-600" />
                              <span>{localizeTerm('Why you are not eligible', language)}</span>
                            </span>

                            <div className="bg-white rounded-2xl p-4 border border-rose-200 shadow-sm space-y-3">
                              {failedRulesList.length > 0 ? (
                                <ul className="space-y-2 text-xs">
                                  {failedRulesList.map((rule, idx) => {
                                    const parsed = parseFailedRule(rule);
                                    return (
                                      <li key={idx} className="flex items-start gap-2.5 leading-relaxed text-slate-700">
                                        <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                                          ✕
                                        </span>
                                        <div className="space-y-0.5">
                                          <span className="font-extrabold text-slate-900 block">
                                            {parsed.label}
                                          </span>
                                          <p className="text-[11px] text-rose-700 font-medium">
                                            {parsed.simpleExplanation}
                                          </p>
                                        </div>
                                      </li>
                                    );
                                  })}
                                </ul>
                              ) : (
                                <p className="text-xs text-rose-700 font-medium leading-relaxed">
                                  {localizeTerm('Mandatory criteria evaluation', language)}: {localizeTerm('One or more demographic eligibility criteria (such as income ceiling, occupation, or regional domicile) do not match your current Data Wallet.', language)}
                                </p>
                              )}

                              {/* Simple Tip Box */}
                              <div className="pt-2 border-t border-rose-100 text-[11px] text-slate-500 leading-snug">
                                <span className="font-bold text-slate-700">{localizeTerm('Helpful Tip', language)}: </span>
                                <span>{t('eligibility.tip_not_eligible', 'If your financial year income or household situation has updated, review and modify your details in Data Wallet.')}</span>
                              </div>
                            </div>
                          </div>
                        ) : isEligible ? (
                          /* ELIGIBLE - POSITIVE SUMMARY */
                          <div className="space-y-3">
                            <span className="text-xs font-black text-emerald-900 uppercase tracking-wider block flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                              <span>{localizeTerm('Why you are eligible', language)}</span>
                            </span>

                            <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm space-y-2.5 text-xs text-slate-700">
                              <p className="font-bold text-emerald-800 flex items-center gap-2">
                                <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-700 font-black text-[10px] flex items-center justify-center flex-shrink-0">✓</span>
                                <span>{localizeTerm('All Criteria Met', language)}</span>
                              </p>

                              <ul className="space-y-1.5 text-[11px] text-slate-600 pl-6 list-disc">
                                <li>{localizeTerm('Verified by Data Wallet', language)}</li>
                                <li>{t('eligibility.income_ok', 'Income and target demographic within threshold')}</li>
                                <li>{t('eligibility.direct_benefit', 'Eligible for direct subsidy and welfare benefits')}</li>
                              </ul>
                            </div>
                          </div>
                        ) : isInfoNeeded ? (
                          /* INFORMATION NEEDED - MISSING DATA */
                          <div className="space-y-3">
                            <span className="text-xs font-black text-amber-900 uppercase tracking-wider block flex items-center gap-1.5">
                              <HelpCircle className="w-4 h-4 text-amber-600" />
                              <span>{localizeTerm('Information Needed', language)}</span>
                            </span>

                            <div className="bg-white rounded-2xl p-4 border border-amber-200 shadow-sm space-y-2.5 text-xs">
                              <p className="text-slate-600 leading-relaxed text-[11px]">
                                {t('eligibility.missing_desc', 'Some mandatory parameters are missing from your Data Wallet to complete authoritative verification.')}
                              </p>

                              {item.missingFields && item.missingFields.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1">
                                  {item.missingFields.map((field: string, fIdx: number) => (
                                    <span key={fIdx} className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                                      {localizeField(field, language)}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          /* GUEST EVALUATION PREVIEW */
                          <div className="space-y-3">
                            <span className="text-xs font-black text-slate-700 uppercase tracking-wider block">
                              {localizeTerm('Simple explanation', language)}
                            </span>
                            <div className="bg-white rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2 leading-relaxed">
                              <p>{localizeTerm('Sign in to see personalized evaluation', language)}</p>
                              <p className="text-[11px] text-slate-400">
                                {t('eligibility.guest_rule_note', 'Our platform cross-references your age, occupation, state, and income against official government rule engines.')}
                              </p>
                            </div>
                          </div>
                        )}

                      </div>
                    </div>

                    {/* Right Card Action Footnote */}
                    <div className="pt-4 border-t border-slate-200/60 mt-4 flex items-center justify-between text-xs">
                      {isNotEligible ? (
                        <button
                          onClick={() => onNavigate('wallet')}
                          className="text-xs font-extrabold text-gov-blue-600 hover:text-gov-blue-800 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>{localizeTerm('Update Data Wallet', language)}</span>
                        </button>
                      ) : isInfoNeeded ? (
                        <button
                          onClick={() => onNavigate('wallet')}
                          className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>{localizeTerm('Complete Data Wallet', language)}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedSchemeId(schemeId);
                            onNavigate('schemeDetails');
                          }}
                          className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <span>{localizeTerm('Check Guidelines', language)}</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                  </div>

                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
