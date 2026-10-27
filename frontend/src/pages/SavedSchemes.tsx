import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { localizeSchemeName, localizeSchemeDesc, localizeCategory, localizeTerm } from '../utils/localizationHelper';
import { Bookmark, BookmarkX, ArrowRight, Award, Compass, Info } from 'lucide-react';
import { getSchemeImageUrl } from '../utils/imageHelper';

interface SavedSchemesProps {
  onNavigate: (page: string) => void;
  setSelectedSchemeId: (id: number | null) => void;
  token: string;
  apiUrl: string;
}

export default function SavedSchemes({ onNavigate, setSelectedSchemeId, token, apiUrl }: SavedSchemesProps) {
  const { t, language } = useLanguage();
  const [savedList, setSavedList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchSaved = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/schemes/saved`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setSavedList(data);
    } catch (err) {
      setError("Failed to fetch bookmarked schemes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSaved();
  }, [token, apiUrl]);

  const handleRemoveBookmark = async (schemeId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`${apiUrl}/api/schemes/unsave/${schemeId}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSavedList(prev => prev.filter(s => s.id !== schemeId));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-gov-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm font-semibold">Opening bookmark wallet...</span>
      </div>
    );
  }

  // Get accent styles
  const getCategoryStyles = (category: string) => {
    const cat = (category || '').toLowerCase();
    if (cat.includes('education')) return { accent: 'border-t-4 border-t-sky-500', badge: 'bg-sky-50 text-sky-700' };
    if (cat.includes('agriculture')) return { accent: 'border-t-4 border-t-emerald-500', badge: 'bg-emerald-50 text-emerald-700' };
    if (cat.includes('housing')) return { accent: 'border-t-4 border-t-violet-500', badge: 'bg-violet-50 text-violet-700' };
    return { accent: 'border-t-4 border-t-slate-400', badge: 'bg-slate-50 text-slate-700' };
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto text-left animate-fadeIn">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gov-blue-900 font-display tracking-tight">
          {t('saved.title', 'Saved & Bookmarked Schemes')}
        </h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold">
          {t('saved.subtitle', 'Quick access to the government programs you bookmarked for tracking.')}
        </p>
      </div>

      {/* Grid Bookmarks */}
      {savedList.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Bookmark className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-gov-blue-900 text-sm">{localizeTerm("No saved bookmarks", language)}</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            {localizeTerm('No saved bookmarks desc', language)}
          </p>
          <button
            onClick={() => onNavigate('schemes')}
            className="px-5 py-2.5 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm shadow-gov-blue-500/10"
          >
            {localizeTerm("Explore Schemes", language)}
          </button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {savedList.map((item) => {
            const styles = getCategoryStyles(item.category);
            const imageUrl = getSchemeImageUrl(item.category, item.name);
            return (
              <div
                key={item.id}
                onClick={() => {
                  setSelectedSchemeId(item.id);
                  onNavigate('schemeDetails');
                }}
                className={`bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex flex-col overflow-hidden group ${styles.accent}`}
              >
                {/* Card Banner Image */}
                <div className="h-44 w-full overflow-hidden relative border-b border-slate-100">
                  <img 
                    src={imageUrl} 
                    alt={item.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 via-slate-900/10 to-transparent" />
                  
                  {/* Category overlay */}
                  <span className={`absolute top-3 left-3 text-[9px] font-black uppercase px-2 py-0.5 rounded shadow-sm ${styles.badge}`}>
                    {localizeCategory(item.category || 'General', language)}
                  </span>

                  {/* Bookmark remove button overlay */}
                  <button
                    type="button"
                    onClick={(e) => handleRemoveBookmark(item.id, e)}
                    className="absolute top-3 right-3 p-1.5 rounded-full border bg-red-50 text-red-500 border-red-200 hover:bg-red-100 shadow-sm transition-colors cursor-pointer"
                    title="Remove bookmark"
                  >
                    <BookmarkX className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-base font-extrabold text-gov-blue-900 group-hover:text-gov-blue-500 transition-colors leading-tight line-clamp-1">{localizeSchemeName(item.name, language)}</h3>
                    <p className="text-slate-500 text-xs mt-2.5 line-clamp-2 leading-relaxed">{localizeSchemeDesc(item.description, item.name, language)}</p>
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-6">
                    <span className="text-[10px] text-slate-400 font-semibold">{item.department}</span>
                    <span className="text-xs font-bold text-gov-blue-500 group-hover:text-gov-blue-700 flex items-center gap-0.5">
                      <span>{localizeTerm("View Parameters", language)}</span>
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
