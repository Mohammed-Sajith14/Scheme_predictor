import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { localizeTerm } from '../utils/localizationHelper';
import { 
  ArrowRight, ShieldCheck, Sparkles, Wallet, Database, Compass, 
  GraduationCap, Wheat, Home, Briefcase, Heart, Accessibility, Calendar, Clock, MessageSquareText
} from 'lucide-react';

interface LandingProps {
  onNavigate: (page: string) => void;
  isLoggedIn: boolean;
}

export default function Landing({ onNavigate, isLoggedIn }: LandingProps) {
  const { t, language } = useLanguage();
  
  const stats = [
    { value: '15+', label: t('landing.stat.schemes', 'Government Schemes'), desc: t('landing.stat.schemes_desc', 'Active welfare registrations in education, farming, and business.') },
    { value: '1', label: t('landing.stat.wallet', 'Unified Data Wallet'), desc: t('landing.stat.wallet_desc', 'Secure demographic parameters saved once and reused.') },
    { value: 'AI', label: t('landing.stat.matching', 'Intelligent Matching'), desc: t('landing.stat.matching_desc', 'Scoring engine rules paired with predictive machine learning.') },
    { value: '24/7', label: t('landing.stat.rag', 'RAG AI Assistant'), desc: t('landing.stat.rag_desc', 'Grounded scheme coaching query interface.') }
  ];

  const categories = [
    { title: t('landing.cat.education', 'Education'), icon: GraduationCap, color: 'text-sky-600 bg-sky-50 border-sky-100 hover:border-sky-300' },
    { title: t('landing.cat.agriculture', 'Agriculture'), icon: Wheat, color: 'text-emerald-600 bg-emerald-50 border-emerald-100 hover:border-emerald-300' },
    { title: t('landing.cat.housing', 'Housing & Shelter'), icon: Home, color: 'text-violet-600 bg-violet-50 border-violet-100 hover:border-violet-300' },
    { title: t('landing.cat.employment', 'Employment'), icon: Briefcase, color: 'text-amber-600 bg-amber-50 border-amber-100 hover:border-amber-300' },
    { title: t('landing.cat.women', 'Women & Children'), icon: Heart, color: 'text-pink-600 bg-pink-50 border-pink-100 hover:border-pink-300' },
    { title: t('landing.cat.disability', 'Disability Support'), icon: Accessibility, color: 'text-indigo-600 bg-indigo-50 border-indigo-100 hover:border-indigo-300' }
  ];

  return (
    <div className="bg-slate-50 min-h-screen selection:bg-gov-blue-500/20 selection:text-gov-blue-900">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-36 gradient-hero border-b border-slate-200">
        
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-[450px] h-[450px] bg-gov-blue-100/40 rounded-full blur-3xl -z-10 animate-pulse-glow" />
        <div className="absolute bottom-0 left-0 w-[350px] h-[350px] bg-teal-50/40 rounded-full blur-3xl -z-10" />

        {/* Constrained layout grid */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-8 grid md:grid-cols-12 gap-12 items-center">
          
          {/* Hero Left Content */}
          <div className="md:col-span-6 space-y-8 text-left animate-fadeIn">
            
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gov-blue-50 border border-gov-blue-100 text-gov-blue-700 font-bold text-xs uppercase tracking-wide">
              <Sparkles className="w-3.5 h-3.5 text-gov-blue-600 animate-pulse" />
              <span>{t('landing.hero.badge', 'AI-Powered Government Discovery')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-black text-gov-blue-900 font-display leading-[1.1] tracking-tight">
              {t('landing.hero.title_part1', 'One Profile.')} <br />
              <span className="text-gov-blue-600">{t('landing.hero.title_part2', 'Every Government Benefit.')}</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-md">
              {t('landing.hero.subtitle', 'Securely compile your socio-economic variables once. Discover welfares and scholarships matched authoritatively to your eligibility guidelines.')}
            </p>

            <div className="flex flex-wrap gap-4 pt-2">
              <button
                onClick={() => onNavigate(isLoggedIn ? 'dashboard' : 'signup')}
                className="px-6 py-3.5 bg-gov-blue-500 hover:bg-gov-blue-600 hover:shadow-lg text-white font-extrabold rounded-xl transition-all flex items-center gap-2 group cursor-pointer text-xs"
              >
                <span>{t('landing.hero.cta_check', 'Check My Eligibility')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </button>
              <button
                onClick={() => onNavigate('schemes')}
                className="px-6 py-3.5 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 text-slate-700 font-extrabold rounded-xl transition-all cursor-pointer text-xs"
              >
                {t('landing.hero.cta_explore', 'Explore Schemes')}
              </button>
            </div>
          </div>

          {/* Hero Right: Real photograph with premium visual crop & floating cards */}
          <div className="md:col-span-6 flex justify-center relative mt-6 md:mt-0">
            <div className="relative w-full max-w-[460px]">
              
              {/* Premium visual composition frame */}
              <div className="rounded-3xl overflow-hidden p-3 bg-white shadow-2xl border border-slate-200 relative aspect-[4/3] flex items-center justify-center">
                <img 
                  src="/indian_citizen_gov_tech.jpg" 
                  alt="Indian citizen using tablet" 
                  className="w-full h-full rounded-2xl object-cover"
                />
                
                {/* Soft gradient overlay to blend corners */}
                <div className="absolute inset-3 rounded-2xl bg-gradient-to-t from-gov-blue-900/10 to-transparent pointer-events-none" />
              </div>

              {/* Floating Overlay Card 1 (overlaps slightly) */}
              <div className="absolute -top-6 -left-6 bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-float-slow floating-overlay-card">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">{localizeTerm("Scholarship Match", language)}</span>
                  <span className="block text-xs font-extrabold text-slate-800">{localizeTerm("96% Eligibility Match", language)}</span>
                </div>
              </div>

              {/* Floating Overlay Card 2 */}
              <div className="absolute bottom-12 -right-6 bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-float-medium floating-overlay-card">
                <div className="w-9 h-9 rounded-xl bg-gov-blue-50 border border-gov-blue-100 flex items-center justify-center text-gov-blue-600">
                  <Compass className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">{localizeTerm("Discovery", language)}</span>
                  <span className="block text-xs font-extrabold text-slate-800">{localizeTerm("12 Eligible Schemes", language)}</span>
                </div>
              </div>

              {/* Floating Overlay Card 3 */}
              <div className="absolute -bottom-6 left-12 bg-white/95 backdrop-blur px-4 py-3 rounded-2xl shadow-xl border border-slate-100 flex items-center gap-3 animate-float-slow floating-overlay-card">
                <div className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-500">
                  <Wallet className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <span className="block text-[8px] text-slate-400 font-bold uppercase tracking-wider">{localizeTerm("Verification status", language)}</span>
                  <span className="block text-xs font-extrabold text-slate-800">{localizeTerm("Data Wallet 94% Complete", language)}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* Trust statistics row */}
      <section className="bg-white border-b border-slate-200 py-10 relative">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((item, i) => (
            <div key={i} className="space-y-1.5 text-center md:text-left">
              <span className="text-3xl font-black text-gov-blue-600 font-display block">{item.value}</span>
              <span className="text-xs font-extrabold text-gov-blue-900 block">{item.label}</span>
              <span className="text-[11px] text-slate-400 block leading-relaxed max-w-[220px] mx-auto md:mx-0">{item.desc}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 md:py-24 max-w-[1400px] mx-auto px-6 md:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-2xl md:text-3xl font-black text-gov-blue-900 font-display tracking-tight">
            {localizeTerm("How SchemeWise Works", language)}
          </h2>
          <p className="text-slate-500 text-xs mt-2 leading-relaxed font-semibold">
            {localizeTerm("One unified profile matching against all central eligibility databases.", language)}
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-6 relative">
          {/* Connector line */}
          <div className="absolute top-[40px] left-[15%] right-[15%] h-0.5 bg-gov-blue-100 hidden md:block -z-10" />

          {[
            { step: '01', title: localizeTerm('Create Wallet Profile', language), desc: localizeTerm('Securely authenticate with basic variables. Personal records are fully encrypted.', language) },
            { step: '02', title: localizeTerm('Add Socio-Economic Info', language), desc: localizeTerm('Input parameters once: age, state, education, land ownership, and housing.', language) },
            { step: '03', title: localizeTerm('Match and Analyze', language), desc: localizeTerm('Scoring engine runs authority check rules and aggregates machine learning values.', language) },
            { step: '04', title: localizeTerm('Discover Benefits', language), desc: localizeTerm('Get a clear, ranked dashboard of eligible schemes with match breakdowns.', language) }
          ].map((item, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm relative group hover:shadow-md transition-all">
              <div className="w-10 h-10 rounded-xl bg-gov-blue-50 border border-gov-blue-100 flex items-center justify-center text-gov-blue-600 font-black font-display text-sm mb-4">
                {item.step}
              </div>
              <h3 className="font-extrabold text-gov-blue-900 text-xs group-hover:text-gov-blue-600 transition-colors">{item.title}</h3>
              <p className="text-slate-500 text-[11px] mt-2 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Data Wallet Showcase */}
      <section className="py-20 bg-slate-100/60 border-y border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8 grid md:grid-cols-2 gap-12 items-center">
          
          <div className="space-y-6 text-left">
            <div className="w-9 h-9 rounded-xl bg-gov-blue-50 border border-gov-blue-100 flex items-center justify-center text-gov-blue-600">
              <Wallet className="w-5 h-5" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black text-gov-blue-900 font-display leading-tight tracking-tight">
              {localizeTerm("Your Information.", language)}<br />{localizeTerm("One Secure Wallet.", language)}
            </h2>
            <p className="text-slate-600 text-xs leading-relaxed max-w-sm">
              {localizeTerm("You don't need to fill out complex welfares forms repeatedly. Enter your socio-economic details once and SchemeWise will evaluate your match rates automatically across the registry.", language)}
            </p>
            
            <div className="space-y-2 text-[11px] font-bold text-slate-700">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{localizeTerm("100% Client-Controlled Resets (Reset Wallet anytime)", language)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>{localizeTerm("Interactive Farmer and Disability Form Conditionals", language)}</span>
              </div>
            </div>

            <button
              onClick={() => onNavigate(isLoggedIn ? 'dashboard' : 'signup')}
              className="inline-flex items-center gap-1.5 text-xs font-extrabold text-gov-blue-500 hover:text-gov-blue-700 cursor-pointer pt-2 group"
            >
              <span>{localizeTerm("Build Profile Wallet", language)}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Cards mockup container */}
          <div className="flex justify-center">
            <div className="w-full max-w-[400px] bg-white rounded-2xl border border-slate-200 shadow-lg p-6 space-y-5">
              
              <div className="flex justify-between items-center border-b border-slate-100 pb-3.5">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-gov-blue-500" />
                  <span className="font-bold text-gov-blue-900 text-xs">{localizeTerm("Secure Profile Wallet", language)}</span>
                </div>
                <span className="text-[10px] font-black text-gov-blue-500 bg-gov-blue-50 px-2 py-0.5 rounded border border-gov-blue-100">{localizeTerm("89% Complete", language)}</span>
              </div>

              <div className="space-y-2.5">
                {[
                  { label: 'Personal & Demographics', status: '✓ Complete', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  { label: 'Economic Credentials', status: '✓ Complete', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  { label: 'Academic Profile', status: '✓ Complete', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                  { label: 'Welfare Parameters', status: '+ Add', color: 'text-amber-600 bg-amber-50 border-amber-100 hover:bg-amber-100/50 cursor-pointer' }
                ].map((step, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 rounded-xl border border-slate-100 bg-slate-50 text-xs">
                    <span className="font-bold text-slate-700">{localizeTerm(step.label, language)}</span>
                    <span className={`px-2 py-0.5 border rounded-lg font-bold text-[9px] ${step.color}`}>{localizeTerm(step.status, language)}</span>
                  </div>
                ))}
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* AI Assistant grounded preview */}
      <section className="py-20 max-w-[1400px] mx-auto px-6 md:px-8 grid md:grid-cols-12 gap-12 items-center">
        
        {/* Chat window mockup Left */}
        <div className="md:col-span-6 flex justify-center">
          <div className="w-full max-w-[420px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-[320px]">
            
            <div className="p-4 bg-gov-blue-50 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-gov-blue-100 text-gov-blue-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <span className="block font-bold text-gov-blue-900 text-xs">{localizeTerm("SchemeWise AI Coach", language)}</span>
                  <span className="block text-[8px] text-gov-blue-400 font-bold uppercase">{localizeTerm("Grounded in Guidelines", language)}</span>
                </div>
              </div>
            </div>

            <div className="p-4 flex-1 space-y-4 overflow-y-auto text-left text-[11px] leading-relaxed">
              <div className="flex justify-end">
                <div className="bg-gov-blue-500 text-white p-3 rounded-2xl rounded-br-none max-w-[260px] font-bold">
                  {localizeTerm("What documents do I need for this scholarship?", language)}
                </div>
              </div>

              <div className="flex justify-start">
                <div className="bg-slate-50 border border-slate-200 text-slate-700 p-3 rounded-2xl rounded-bl-none max-w-[260px] font-semibold">
                  {localizeTerm("For the Central Sector Scholarship, you need your Class 12 Roll Number details, family Income Certificate, Aadhaar, and a bank passbook.", language)}
                </div>
              </div>
            </div>

            <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-[10px] text-center text-slate-400 font-semibold">
              {localizeTerm("RAG answers are grounded strictly in registry documentation vectors.", language)}
            </div>

          </div>
        </div>

        {/* Text Right */}
        <div className="md:col-span-6 space-y-6 text-left">
          <div className="w-9 h-9 rounded-xl bg-gov-blue-50 border border-gov-blue-100 flex items-center justify-center text-gov-blue-600">
            <MessageSquareText className="w-5 h-5" />
          </div>
          <h2 className="text-2xl md:text-3xl font-black text-gov-blue-900 font-display leading-tight tracking-tight">
            {localizeTerm("Have a Question?", language)}<br />{localizeTerm("Ask SchemeWise AI.", language)}
          </h2>
          <p className="text-slate-600 text-xs leading-relaxed max-w-sm">
            {localizeTerm("Consult the vector-grounded RAG chatbot to ask about complex rules, closing dates, or documentation checks.", language)} 
          </p>
          
          <div className="grid grid-cols-2 gap-3 text-xs font-bold text-slate-600">
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gov-blue-500" />
              <span>{localizeTerm("Criteria Checks", language)}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-gov-blue-500" />
              <span>{localizeTerm("Document Checklist", language)}</span>
            </div>
          </div>
        </div>

      </section>

      {/* Scheme categories */}
      <section className="py-20 bg-slate-100/60 border-y border-slate-200">
        <div className="max-w-[1400px] mx-auto px-6 md:px-8 text-center">
          <div className="max-w-2xl mx-auto mb-16">
            <h2 className="text-2xl md:text-3xl font-black text-gov-blue-900 font-display tracking-tight">
              {localizeTerm("Browse Schemes by Category", language)}
            </h2>
            <p className="text-slate-500 text-xs mt-2 font-semibold">
              {localizeTerm("Explore benefits cataloged by primary target sectors.", language)}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {categories.map((cat, i) => {
              const Icon = cat.icon;
              return (
                <div
                  key={i}
                  onClick={() => onNavigate('schemes')}
                  className={`p-5 rounded-2xl border text-left cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${cat.color}`}
                >
                  <div className="w-9 h-9 rounded-xl bg-white border border-slate-200/60 flex items-center justify-center mb-3">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <h3 className="font-extrabold text-gov-blue-900 text-xs">{cat.title}</h3>
                  <span className="text-[9px] text-slate-400 font-bold block mt-1.5">{localizeTerm("Explore →", language)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="max-w-[1400px] mx-auto px-6 md:px-8 my-20">
        <div className="bg-gov-blue-900 text-white rounded-3xl p-8 md:p-14 text-center relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-[250px] h-[250px] bg-gov-blue-600/40 rounded-full blur-3xl -z-10" />
          
          <div className="max-w-md mx-auto space-y-5">
            <h2 className="text-2xl md:text-3xl font-black font-display tracking-tight leading-tight">
              {localizeTerm("Find Your Eligible Benefit Today", language)}
            </h2>
            <p className="text-gov-blue-100 text-xs leading-relaxed">
              {localizeTerm("Compile your secure Data Wallet and let our scoring engine check matching parameters instantly.", language)}
            </p>
            
            <button
              onClick={() => onNavigate(isLoggedIn ? 'dashboard' : 'signup')}
              className="px-6 py-3.5 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-extrabold rounded-xl transition-all shadow-md inline-flex items-center gap-1.5 cursor-pointer mt-3 text-xs"
            >
              <span>{localizeTerm("Create My Data Wallet", language)}</span>
              <ArrowRight className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
