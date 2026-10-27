import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  localizeSchemeName, localizeSchemeDesc, localizeCategory, 
  localizeStatus, localizeTerm 
} from '../utils/localizationHelper';
import { Search, SlidersHorizontal, ArrowUpDown, Bookmark, Award, AlertCircle, ArrowRight, Calendar, Info } from 'lucide-react';
import { getSchemeImageUrl } from '../utils/imageHelper';

interface ExploreSchemesProps {
  onNavigate: (page: string) => void;
  setSelectedSchemeId: (id: number | null) => void;
  token: string;
  isLoggedIn: boolean;
  apiUrl: string;
}

export default function ExploreSchemes({ onNavigate, setSelectedSchemeId, token, isLoggedIn, apiUrl }: ExploreSchemesProps) {
  const { t, language } = useLanguage();
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedState, setSelectedState] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [sortBy, setSortBy] = useState('Recommended');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        setLoading(true);
        const endpoint = isLoggedIn ? `${apiUrl}/api/schemes` : `${apiUrl}/api/schemes/public`;
        const headers: any = {};
        if (isLoggedIn) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        const res = await fetch(endpoint, { headers });
        const data = await res.json();
        setSchemes(data);
      } catch (err: any) {
        setError("Failed to load government scheme registry.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchSchemes();
  }, [token, isLoggedIn, apiUrl]);

  const handleSaveScheme = async (schemeId: number, currentSaved: boolean, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isLoggedIn) {
      onNavigate('signup');
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
          if (s.schemeId === schemeId || s.id === schemeId) {
            return { ...s, saved: !currentSaved };
          }
          return s;
        }));
      }
    } catch (err) {
      console.error("Error toggling bookmark:", err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-gov-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm font-semibold">Querying central databases...</span>
      </div>
    );
  }

  // Get categories and states dynamically for filters
  const categories = ['All', 'Education', 'Agriculture', 'Housing', 'Employment', 'Women & Child Welfare', 'Small Business', 'Disability Assistance'];
  const states = ['All', 'National', 'Tamil Nadu'];

  // Filter schemes
  let filtered = schemes.filter(s => {
    // Search filter
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (s.department && s.department.toLowerCase().includes(searchTerm.toLowerCase()));
      
    // Category filter
    const matchesCategory = selectedCategory === 'All' || s.category === selectedCategory;
    
    // State filter
    let matchesState = true;
    if (selectedState !== 'All') {
      if (selectedState === 'National') {
        matchesState = s.state === null || s.state === '';
      } else {
        matchesState = s.state && s.state.toLowerCase() === selectedState.toLowerCase();
      }
    }
    
    // Status filter
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesState && matchesStatus;
  });

  // Sort schemes
  filtered.sort((a, b) => {
    if (sortBy === 'Alphabetical') {
      return a.name.localeCompare(b.name);
    }
    
    if (isLoggedIn) {
      const scoreA = a.overallScore || 0;
      const scoreB = b.overallScore || 0;
      
      if (sortBy === 'Highest Eligibility Score' || sortBy === 'Recommended') {
        return scoreB - scoreA;
      }
    }
    return 0;
  });

  // Helper to resolve visual style classes based on scheme category
  const getCategoryStyles = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('education')) return { accent: 'border-t-4 border-t-sky-500', badge: 'bg-sky-50 text-sky-700' };
    if (cat.includes('agriculture') || cat.includes('fisheries')) return { accent: 'border-t-4 border-t-emerald-500', badge: 'bg-emerald-50 text-emerald-700' };
    if (cat.includes('housing') || cat.includes('awas')) return { accent: 'border-t-4 border-t-violet-500', badge: 'bg-violet-50 text-violet-700' };
    if (cat.includes('employment') || cat.includes('fellowship')) return { accent: 'border-t-4 border-t-amber-500', badge: 'bg-amber-50 text-amber-700' };
    return { accent: 'border-t-4 border-t-slate-400', badge: 'bg-slate-50 text-slate-700' };
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto text-left animate-fadeIn">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gov-blue-900 font-display tracking-tight">
          {t('explore.title', 'Discover Government Schemes')}
        </h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold">
          {t('explore.subtitle', 'Explore central and state welfare benefits matched to your profile.')}
        </p>
      </div>

      {/* Info Warning for Public Users */}
      {!isLoggedIn && (
        <div className="p-4 bg-gov-blue-50 border border-gov-blue-100 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Award className="w-8 h-8 text-gov-blue-600 flex-shrink-0" />
            <div>
              <h3 className="font-bold text-xs text-gov-blue-900">{localizeTerm('Unlock Automatic Score Re-ranking', language)}</h3>
              <p className="text-[11px] text-gov-blue-700 leading-normal mt-0.5">{localizeTerm('Wallet banner desc', language)}</p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('signup')}
            className="px-4 py-2 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-bold rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer shadow-sm shadow-gov-blue-500/15"
          >
            {localizeTerm('Build Wallet', language)}
          </button>
        </div>
      )}

      {/* Search and Filters Layout */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Text Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={t('explore.search_placeholder', 'Search schemes, benefits, departments...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold shadow-sm"
            />
          </div>
          
          <div className="flex gap-2">
            
            {/* Filters Drawer Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 border rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
                showFilters ? 'bg-gov-blue-50 border-gov-blue-500 text-gov-blue-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" /> <span>{localizeTerm('Filters', language)}</span>
            </button>
            
            {/* Sort Dropdown */}
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="pl-3 pr-8 py-3 bg-white border border-slate-300 rounded-xl text-xs font-bold outline-none text-slate-700 focus:border-gov-blue-500 appearance-none cursor-pointer shadow-sm"
              >
                <option value="Recommended">{localizeTerm('Recommended', language)}</option>
                <option value="Highest Eligibility Score">{localizeTerm('Highest Eligibility Score', language)}</option>
                <option value="Alphabetical">{localizeTerm('Alphabetical', language)}</option>
              </select>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

          </div>
        </div>

        {/* Category Chips Scrollbar */}
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((c, i) => (
            <button
              key={i}
              onClick={() => setSelectedCategory(c)}
              className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all whitespace-nowrap cursor-pointer ${
                selectedCategory === c 
                  ? 'bg-gov-blue-500 border-gov-blue-500 text-white shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {localizeCategory(c, language)}
            </button>
          ))}
        </div>

        {/* Collapsible Filter Panel */}
        {showFilters && (
          <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-inner grid grid-cols-1 md:grid-cols-3 gap-4 animate-slideDown">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                {localizeTerm('Scope / State', language)}
              </label>
              <select
                value={selectedState}
                onChange={(e) => setSelectedState(e.target.value)}
                className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 outline-none focus:bg-white cursor-pointer font-semibold"
              >
                {states.map((s, i) => (
                  <option key={i} value={s}>
                    {s === 'All' ? localizeCategory('All', language) : localizeTerm(s, language)}
                  </option>
                ))}
              </select>
            </div>

            {isLoggedIn && (
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">
                  {localizeTerm('Match Status', language)}
                </label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full p-2.5 border border-slate-300 rounded-xl text-xs bg-slate-50 outline-none focus:bg-white cursor-pointer font-semibold"
                >
                  <option value="All">{localizeTerm('All statuses', language)}</option>
                  <option value="HIGHLY_ELIGIBLE">{localizeStatus('HIGHLY_ELIGIBLE', language)}</option>
                  <option value="LIKELY_ELIGIBLE">{localizeStatus('LIKELY_ELIGIBLE', language)}</option>
                  <option value="POTENTIAL_MATCH">{localizeStatus('POTENTIAL_MATCH', language)}</option>
                  <option value="INFORMATION_NEEDED">{localizeStatus('INFORMATION_NEEDED', language)}</option>
                  <option value="NOT_ELIGIBLE">{localizeStatus('NOT_ELIGIBLE', language)}</option>
                </select>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid List */}
      {filtered.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-2xl space-y-3">
          <Info className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="font-extrabold text-sm text-gov-blue-900">{localizeTerm('No matching schemes', language)}</h3>
          <p className="text-slate-500 text-xs max-w-sm mx-auto">{localizeTerm('Adjust search', language)}</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((item) => {
            const schemeId = isLoggedIn ? item.schemeId : item.id;
            const score = isLoggedIn && item.overallScore !== null && item.overallScore !== undefined ? Math.round(item.overallScore) : null;
            const style = getCategoryStyles(item.category);
            
            let statusBadge = "bg-slate-100 text-slate-700 border-slate-200";
            let statusText = item.status ? item.status.replace(/_/g, ' ') : '';
            if (isLoggedIn) {
              if (item.status === 'HIGHLY_ELIGIBLE') statusBadge = "bg-emerald-50 text-emerald-800 border-emerald-200 font-black";
              else if (item.status === 'LIKELY_ELIGIBLE') statusBadge = "bg-sky-50 text-sky-800 border-sky-200 font-bold";
              else if (item.status === 'POTENTIAL_MATCH') statusBadge = "bg-amber-50 text-amber-800 border-amber-200 font-bold";
              else if (item.status === 'INFORMATION_NEEDED') {
                statusBadge = "bg-amber-100 text-amber-900 border-amber-300 font-extrabold";
                statusText = "INFORMATION NEEDED";
              } else if (item.status === 'NOT_ELIGIBLE') {
                statusBadge = "bg-rose-50 text-rose-800 border-rose-200 font-bold";
                statusText = "NOT ELIGIBLE";
              }
            }

            const imageUrl = getSchemeImageUrl(item.category, item.name, schemeId, item.imageUrl);
            return (
              <div
                key={schemeId}
                onClick={() => {
                  setSelectedSchemeId(schemeId);
                  onNavigate('schemeDetails');
                }}
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden group ${style.accent}`}
              >
                {/* Card Banner Image */}
                <div className="h-44 w-full overflow-hidden relative border-b border-slate-100">
                  <img 
                    src={imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-slate-900/10 to-transparent" />
                  
                  {/* Category and status badge overlay */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${style.badge}`}>
                      {localizeCategory(item.category || 'General', language)}
                    </span>
                    {isLoggedIn && (
                      <span className={`text-[9px] border px-2 py-0.5 rounded shadow-sm ${statusBadge}`}>
                        {localizeStatus(statusText, language)}
                      </span>
                    )}
                  </div>

                  {/* Bookmark overlay right */}
                  <button
                    type="button"
                    onClick={(e) => handleSaveScheme(schemeId, item.saved, e)}
                    className={`absolute top-3 right-3 p-1.5 rounded-full border transition-all cursor-pointer shadow-sm ${
                      item.saved ? 'bg-purple-50 text-purple-600 border-purple-200' : 'bg-white/80 backdrop-blur-md text-slate-500 border-slate-200 hover:text-slate-700'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-gov-blue-900 group-hover:text-gov-blue-500 transition-colors leading-tight line-clamp-1">
                      {localizeSchemeName(item.name, language)}
                    </h3>
                    <p className="text-slate-500 text-xs mt-2.5 line-clamp-2 leading-relaxed">
                      {localizeSchemeDesc(item.description, item.name, language)}
                    </p>
                  </div>

                  <div className="flex justify-between items-end border-t border-slate-100 pt-4 mt-6">
                    <div>
                      {isLoggedIn ? (
                        <div>
                          {item.status === 'NOT_ELIGIBLE' ? (
                            <div>
                              <span className="text-xs font-black text-rose-700 block">{localizeStatus("NOT_ELIGIBLE", language)}</span>
                              {item.failedRules && item.failedRules.length > 0 ? (
                                <p className="text-[10px] text-rose-600 font-medium line-clamp-1 mt-0.5 max-w-[220px]">
                                  {item.failedRules[0]}
                                </p>
                              ) : (
                                <p className="text-[10px] text-slate-400 font-medium mt-0.5">
                                  {localizeTerm("Mandatory condition not satisfied", language)}
                                </p>
                              )}
                            </div>
                          ) : item.status === 'INFORMATION_NEEDED' || item.coverageScore < 100 ? (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg font-black text-amber-600 font-display leading-none">
                                  {Math.round(item.coverageScore || 0)}%
                                </span>
                                <span className="text-[9px] text-amber-800 font-extrabold uppercase tracking-wider">
                                  {localizeTerm("Information Coverage", language)}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 font-semibold mt-1">
                                {item.missingFields?.length || ""} {localizeTerm("details needed", language)}
                              </p>
                            </div>
                          ) : (
                            <div>
                              <div className="flex items-baseline gap-1">
                                <span className="text-lg font-black text-gov-blue-600 font-display leading-none">
                                  {score}%
                                </span>
                                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                                  {localizeTerm("Eligibility Score", language)}
                                </span>
                              </div>
                              <p className="text-[10px] text-emerald-600 font-semibold mt-1 flex items-center gap-0.5">
                                <span>✓ {localizeTerm("All required info available", language)}</span>
                              </p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-semibold">{item.department}</span>
                      )}
                    </div>
                    
                    <span className="text-xs font-bold text-gov-blue-500 group-hover:text-gov-blue-700 flex items-center gap-0.5">
                      <span>{localizeTerm("Details", language)}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
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
