import React, { useState } from 'react';
import { 
  Award, FileText, CheckCircle2, Calendar, HelpCircle, ExternalLink, 
  ShieldCheck, ArrowRight, Sparkles, Building2, MapPin, Users, Info, Globe, CheckCircle
} from 'lucide-react';
import type { SchemeRequirementItem } from './RuleBuilder';
import { getSchemeImageUrl } from '../../utils/imageHelper';

interface Props {
  scheme: {
    id?: number;
    name: string;
    category?: string;
    department?: string;
    description?: string;
    shortDescription?: string;
    benefits?: string;
    applicationProcess?: string;
    requiredDocuments?: string;
    deadline?: string;
    officialUrl?: string;
    imageUrl?: string;
    state?: string;
    schemeType?: string;
    beneficiaryType?: string;
    targetBeneficiary?: string;
  };
  requirements: SchemeRequirementItem[];
  benefitsList: Array<{ title: string; description?: string; amount?: string; frequency?: string }>;
  documentsList: Array<{ name: string; description?: string; mandatory?: boolean }>;
  applicationSteps: Array<{ stepNumber?: number; title: string; description?: string }>;
  faqs: Array<{ question: string; answer: string }>;
  sources: Array<{ sourceName: string; officialUrl?: string; sourceType?: string }>;
}

export const CitizenViewPreview: React.FC<Props> = ({
  scheme,
  requirements = [],
  benefitsList = [],
  documentsList = [],
  applicationSteps = [],
  faqs = [],
  sources = [],
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'eligibility' | 'application'>('overview');

  const bannerImg = getSchemeImageUrl(scheme.category || '', scheme.name || '', scheme.id, scheme.imageUrl);

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xl text-slate-800 text-left animate-fadeIn font-sans">
      
      {/* Admin Live Preview Ribbon */}
      <div className="bg-gov-blue-900 text-white px-5 py-2.5 flex items-center justify-between text-xs font-bold border-b border-gov-blue-800">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Live Citizen Page Preview (Exact Citizen View Rendering)</span>
        </div>
        <span className="px-2.5 py-0.5 bg-emerald-500/20 text-emerald-300 font-mono text-[10px] rounded-full border border-emerald-400/30">
          LIVE USER VIEW
        </span>
      </div>

      {/* Hero Banner Header */}
      <div className="relative min-h-[260px] bg-slate-900 flex items-end p-6 sm:p-8 overflow-hidden">
        <img 
          src={bannerImg} 
          alt={scheme.name} 
          className="absolute inset-0 w-full h-full object-cover opacity-40 scale-105 transition-transform duration-700 hover:scale-100" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
        
        <div className="relative z-10 space-y-3 max-w-4xl">
          <div className="flex flex-wrap items-center gap-2">
            {scheme.category && (
              <span className="px-3 py-1 bg-gov-blue-500 text-white rounded-xl text-xs font-extrabold shadow-sm">
                {scheme.category}
              </span>
            )}
            {scheme.department && (
              <span className="px-3 py-1 bg-white/10 backdrop-blur-md text-slate-200 rounded-xl text-xs font-semibold border border-white/10 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5 text-gov-blue-400" /> {scheme.department}
              </span>
            )}
            <span className="px-3 py-1 bg-emerald-500/20 backdrop-blur-md text-emerald-300 rounded-xl text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" /> {scheme.state || 'All India'}
            </span>
            {scheme.schemeType && (
              <span className="px-3 py-1 bg-amber-500/20 backdrop-blur-md text-amber-300 rounded-xl text-xs font-semibold border border-amber-500/30">
                {scheme.schemeType} Sector Scheme
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight leading-tight font-display">
            {scheme.name || 'Scheme Title'}
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 max-w-3xl line-clamp-2 leading-relaxed">
            {scheme.shortDescription || scheme.description || 'Comprehensive government welfare & entitlement initiative.'}
          </p>

          <div className="flex flex-wrap items-center gap-4 pt-1 text-xs text-slate-300 font-medium">
            {scheme.deadline && (
              <div className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Deadline: <strong className="text-white">{scheme.deadline}</strong></span>
              </div>
            )}
            {scheme.beneficiaryType && (
              <div className="flex items-center gap-1.5 bg-slate-800/80 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700">
                <Users className="w-4 h-4 text-gov-blue-400" />
                <span>Target: <strong className="text-white">{scheme.beneficiaryType}</strong></span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Citizen Navigation Tabs Bar */}
      <div className="bg-slate-50 border-b border-slate-200 px-6 pt-3 flex flex-wrap gap-2 text-xs font-bold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'border-gov-blue-600 text-gov-blue-900 bg-white shadow-sm font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <Info className="w-4 h-4 text-gov-blue-600" /> Overview & Benefits
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('eligibility')}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'eligibility'
              ? 'border-gov-blue-600 text-gov-blue-900 bg-white shadow-sm font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Eligibility Criteria ({requirements.length})
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('application')}
          className={`px-4 py-2.5 rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
            activeTab === 'application'
              ? 'border-gov-blue-600 text-gov-blue-900 bg-white shadow-sm font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
          }`}
        >
          <ArrowRight className="w-4 h-4 text-indigo-600" /> Application & Registration Steps ({applicationSteps.length})
        </button>
      </div>

      {/* Main Tab Content Container */}
      <div className="p-6 sm:p-8 space-y-8 bg-white">

        {/* TAB 1: OVERVIEW & BENEFITS */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Scheme Description */}
            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-gov-blue-900 flex items-center gap-2 font-display">
                <Sparkles className="w-5 h-5 text-gov-blue-600" /> Scheme Objective & Description
              </h3>
              <div className="p-5 bg-slate-50 border border-slate-200/80 rounded-2xl text-xs text-slate-700 leading-relaxed space-y-2">
                <p className="whitespace-pre-line">{scheme.description || 'Detailed objective and background parameters of this scheme.'}</p>
              </div>
            </div>

            {/* Key Benefits Grid */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-gov-blue-900 flex items-center gap-2 font-display">
                <Award className="w-5 h-5 text-amber-500" /> Key Welfare Benefits & Support
              </h3>

              {benefitsList.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {benefitsList.map((b, idx) => (
                    <div key={idx} className="p-5 bg-amber-50/50 border border-amber-200/80 rounded-2xl space-y-2 relative overflow-hidden">
                      <div className="w-1.5 h-full bg-amber-500 absolute left-0 top-0" />
                      <div className="flex justify-between items-start pl-2">
                        <span className="font-extrabold text-xs text-amber-950 block">{b.title}</span>
                        {b.frequency && (
                          <span className="px-2 py-0.5 bg-amber-200/60 text-amber-900 rounded font-bold text-[10px]">
                            {b.frequency}
                          </span>
                        )}
                      </div>
                      {b.amount && (
                        <div className="pl-2 text-xl font-black text-amber-900">{b.amount}</div>
                      )}
                      {b.description && (
                        <p className="pl-2 text-xs text-amber-900/80">{b.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-600">
                  {scheme.benefits || 'Direct financial transfer or institutional support provided to eligible beneficiaries.'}
                </div>
              )}
            </div>

            {/* FAQs */}
            {faqs.length > 0 && (
              <div className="space-y-4 pt-2">
                <h3 className="text-base font-extrabold text-gov-blue-900 flex items-center gap-2 font-display">
                  <HelpCircle className="w-5 h-5 text-indigo-600" /> Frequently Asked Questions
                </h3>
                <div className="space-y-3">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5 text-xs">
                      <span className="font-extrabold text-gov-blue-950 block">Q: {faq.question}</span>
                      <p className="text-slate-600 leading-relaxed">A: {faq.answer}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 2: ELIGIBILITY CRITERIA */}
        {activeTab === 'eligibility' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-gov-blue-900 flex items-center gap-2 font-display">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" /> Eligibility Rules & Criteria Checklist
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Parameters evaluated automatically against citizen data wallet.</p>
              </div>
              <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                {requirements.length} Evaluated Rules
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-200 text-xs">
              {requirements.length > 0 ? (
                requirements.map((req, idx) => (
                  <div key={idx} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white hover:bg-slate-50/80 transition-colors">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 font-extrabold text-slate-900">
                        <span>{req.fieldLabel || req.fieldName}</span>
                        {req.mandatory && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-black text-[9px] uppercase">
                            Mandatory
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>Data Wallet Attribute: <code className="bg-slate-100 px-1.5 py-0.5 rounded font-mono text-gov-blue-700">{req.fieldName}</code></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="px-3 py-1.5 bg-slate-900 text-white font-mono font-bold text-xs rounded-xl shadow-sm">
                        {req.operator} {req.requiredValue}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-400 font-bold">
                  No specific restrictive eligibility rules defined. Open for general eligibility.
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: APPLICATION & STEPS */}
        {activeTab === 'application' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Overview text */}
            <div className="space-y-3">
              <h3 className="text-base font-extrabold text-gov-blue-900 flex items-center gap-2 font-display">
                <ArrowRight className="w-5 h-5 text-indigo-600" /> Application Overview
              </h3>
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-700 leading-relaxed">
                {scheme.applicationProcess || 'Follow the step-by-step registration timeline below to complete your application.'}
              </div>
            </div>

            {/* Registration Steps Roadmap */}
            {applicationSteps.length > 0 && (
              <div className="space-y-4">
                <h3 className="text-base font-extrabold text-gov-blue-900 flex items-center gap-2 font-display">
                  <CheckCircle className="w-5 h-5 text-gov-blue-600" /> Registration Steps Timeline
                </h3>
                <div className="space-y-3">
                  {applicationSteps.map((step, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-4 text-xs">
                      <div className="w-8 h-8 rounded-xl bg-gov-blue-600 text-white font-extrabold text-sm flex items-center justify-center shrink-0 shadow-md">
                        {step.stepNumber || idx + 1}
                      </div>
                      <div className="space-y-1">
                        <h4 className="font-extrabold text-gov-blue-950 text-sm">{step.title}</h4>
                        <p className="text-slate-600 leading-relaxed">{step.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Required Documents List */}
            <div className="space-y-4">
              <h3 className="text-base font-extrabold text-gov-blue-900 flex items-center gap-2 font-display">
                <FileText className="w-5 h-5 text-gov-blue-600" /> Verification Documents Checklist
              </h3>
              {documentsList.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {documentsList.map((doc, idx) => (
                    <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                      <div className="space-y-0.5">
                        <span className="font-bold text-slate-900 block">{doc.name}</span>
                        {doc.description && <span className="text-[11px] text-slate-500 block">{doc.description}</span>}
                      </div>
                      <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase ${
                        doc.mandatory ? 'bg-red-100 text-red-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        {doc.mandatory ? 'Mandatory' : 'Optional'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600">
                  {scheme.requiredDocuments || 'Aadhaar Card, Bank Account Details, and Income Certificate.'}
                </div>
              )}
            </div>

            {/* Official Portal Action Button */}
            {scheme.officialUrl && (
              <div className="p-6 bg-gov-blue-900 text-white rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
                <div>
                  <h4 className="font-extrabold text-base font-display">Ready to Apply?</h4>
                  <p className="text-xs text-slate-300">Submit your verified application directly on the official government portal.</p>
                </div>
                <a
                  href={scheme.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs rounded-2xl transition-all shadow-md flex items-center gap-2 shrink-0 cursor-pointer"
                >
                  Apply on Official Portal <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

          </div>
        )}

      </div>

    </div>
  );
};
