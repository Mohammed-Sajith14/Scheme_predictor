import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { Language } from '../translations';

interface LanguageSwitcherProps {
  className?: string;
  variant?: 'pill' | 'select' | 'compact';
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ 
  className = '',
  variant = 'pill' 
}) => {
  const { language, setLanguage, supportedLanguages, currentLanguageOption } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (lang: Language) => {
    setLanguage(lang);
    setIsOpen(false);
  };

  if (variant === 'select') {
    return (
      <div className={`relative inline-block ${className}`}>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="appearance-none bg-white border border-slate-300 hover:border-gov-blue-500 rounded-xl px-3.5 py-2 pr-9 text-xs font-bold text-slate-700 cursor-pointer shadow-xs focus:ring-2 focus:ring-gov-blue-500/20 focus:outline-none transition-all"
        >
          {supportedLanguages.map((l) => (
            <option key={l.code} value={l.code}>
              {l.flag} {l.native} ({l.label})
            </option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    );
  }

  return (
    <div className={`relative inline-block ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
          isOpen
            ? 'bg-gov-blue-50 border-gov-blue-400 text-gov-blue-900 ring-2 ring-gov-blue-500/10'
            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-gov-blue-700'
        }`}
        title="Change Language / மொழி / भाषा"
        aria-label="Change Language"
      >
        <Globe className="w-3.5 h-3.5 text-gov-blue-600 flex-shrink-0" />
        <span className="font-extrabold tracking-tight">{currentLanguageOption.native}</span>
        <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-gov-blue-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 text-left animate-slideDown">
          <div className="px-3 py-1.5 border-b border-slate-100 text-[9px] font-extrabold uppercase tracking-wider text-slate-400 flex items-center justify-between">
            <span>Select Language</span>
            <span className="text-[8px] bg-gov-blue-50 text-gov-blue-600 px-1.5 py-0.5 rounded font-bold">மொழி / भाषा</span>
          </div>

          <div className="p-1 space-y-0.5">
            {supportedLanguages.map((l) => {
              const isSelected = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => handleSelect(l.code)}
                  className={`w-full px-3 py-2 rounded-xl text-xs flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gov-blue-500 text-white font-black shadow-xs'
                      : 'hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-bold'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-base">{l.flag}</span>
                    <div className="flex flex-col text-left">
                      <span className="text-xs leading-none">{l.native}</span>
                      <span className={`text-[9px] mt-0.5 leading-none ${isSelected ? 'text-white/80' : 'text-slate-400'}`}>
                        {l.label}
                      </span>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-white" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
