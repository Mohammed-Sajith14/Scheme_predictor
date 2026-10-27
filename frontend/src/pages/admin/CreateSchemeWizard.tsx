import React, { useState } from 'react';
import { 
  CheckCircle2, ArrowRight, ArrowLeft, Plus, Trash2, ShieldCheck, 
  HelpCircle, Calendar, FileText, Layers, Save, Send, Eye, Sparkles, Play, Image as ImageIcon, Link as LinkIcon
} from 'lucide-react';
import { RuleBuilder, type SchemeRequirementItem } from '../../components/admin/RuleBuilder';
import { RequiredCitizenInfo } from '../../components/admin/RequiredCitizenInfo';
import { CitizenViewPreview } from '../../components/admin/CitizenViewPreview';
import { RuleTesterModal } from '../../components/admin/RuleTesterModal';
import { SchemeImageUploader } from '../../components/admin/SchemeImageUploader';

interface CreateSchemeWizardProps {
  token: string;
  apiUrl: string;
  onNavigate: (page: string, params?: any) => void;
}

const STEPS = [
  { id: 1, name: 'Basic Information' },
  { id: 2, name: 'Benefits' },
  { id: 3, name: 'Eligibility Rules' },
  { id: 4, name: 'Documents' },
  { id: 5, name: 'Application Process' },
  { id: 6, name: 'Important Dates' },
  { id: 7, name: 'FAQs' },
  { id: 8, name: 'Sources' },
  { id: 9, name: 'Review & Publish' }
];

export default function CreateSchemeWizard({ token, apiUrl, onNavigate }: CreateSchemeWizardProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [formData, setFormData] = useState<any>({
    name: '',
    department: '',
    description: '',
    shortDescription: '',
    benefits: '',
    category: 'Education',
    beneficiaryType: 'Students',
    targetBeneficiary: 'Students & Youth',
    schemeType: 'Central',
    state: '',
    applicationProcess: '',
    requiredDocuments: '',
    deadline: '',
    officialUrl: '',
    tagsKeywords: '',
    officialSchemeId: '',
    status: 'DRAFT',
    
    // Sub-lists
    requirements: [
      { fieldName: 'income', operator: '<=', requiredValue: '250000', mandatory: true, weight: 50 },
      { fieldName: 'studentStatus', operator: '==', requiredValue: 'Yes', mandatory: true, weight: 50 }
    ],
    benefitsList: [{ title: 'Financial Assistance', description: 'Covers college fee allowance', amount: '₹10,000', frequency: 'Annual' }],
    documentsList: [{ name: 'Aadhaar Card', description: 'Identity proof', mandatory: true }],
    applicationSteps: [{ stepNumber: 1, title: 'Visit Portal', description: 'Register on official website' }],
    faqs: [{ question: 'Who is eligible?', answer: 'Students enrolled in post-matric courses with income below threshold.', displayOrder: 1 }],
    sources: [{ sourceName: 'Official Portal', officialUrl: 'https://scholarships.gov.in', sourceType: 'Government Portal' }]
  });

  const handleNext = () => {
    if (currentStep === 1) {
      if (!formData.name.trim()) {
        setErrorMsg('Scheme Name is required.');
        return;
      }
      if (!formData.department.trim()) {
        setErrorMsg('Department is required.');
        return;
      }
    }
    setErrorMsg('');
    if (currentStep < 9) setCurrentStep(currentStep + 1);
  };

  const handlePrev = () => {
    setErrorMsg('');
    if (currentStep > 1) setCurrentStep(currentStep - 1);
  };

  const handleSaveScheme = async (targetStatus: 'DRAFT' | 'PUBLISHED') => {
    try {
      setSaving(true);
      setErrorMsg('');
      const payload = { ...formData, status: targetStatus };

      const authToken = token || localStorage.getItem('token') || '';
      const res = await fetch(`${apiUrl}/api/admin/schemes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        onNavigate('admin-schemes');
      } else {
        const text = await res.text();
        let message = `Failed to save scheme (HTTP ${res.status})`;
        if (text) {
          try {
            const errJson = JSON.parse(text);
            message = errJson.message || errJson.error || message;
          } catch {
            message = text;
          }
        }
        setErrorMsg(message);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error communicating with backend server.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12 animate-fadeIn">
      
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gov-blue-900 font-display flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-gov-blue-600" /> Create Government Scheme
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Step-by-step scheme authoring wizard with real-time rule validation & vector sync.
          </p>
        </div>
        <button
          onClick={() => onNavigate('admin-schemes')}
          className="px-4 py-2 border border-slate-300 hover:bg-slate-100 font-bold rounded-xl text-xs transition-colors"
        >
          Cancel & Exit
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold animate-slideDown">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Progress Stepper Bar */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm overflow-x-auto custom-scrollbar">
        <div className="flex items-center justify-between min-w-[750px]">
          {STEPS.map((s, idx) => {
            const active = s.id === currentStep;
            const completed = s.id < currentStep;
            return (
              <div key={s.id} className="flex items-center gap-2">
                <div 
                  onClick={() => setCurrentStep(s.id)}
                  className={`w-7 h-7 rounded-full flex items-center justify-center font-extrabold text-xs cursor-pointer transition-all ${
                    active ? 'bg-gov-blue-500 text-white ring-4 ring-gov-blue-100 shadow-md' :
                    completed ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {completed ? '✓' : s.id}
                </div>
                <span className={`text-[11px] font-bold whitespace-nowrap cursor-pointer ${
                  active ? 'text-gov-blue-900 font-black' : completed ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {s.name}
                </span>
                {idx < STEPS.length - 1 && <div className="w-6 h-0.5 bg-slate-200 mx-1" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content Card */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        
        {/* STEP 1: Basic Information */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-gov-blue-900 border-b border-slate-100 pb-3">
              Step 1: Basic Scheme Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 md:col-span-2">
                <label className="block font-bold text-slate-700">Scheme Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Post Matric Scholarship Scheme"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-gov-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Department / Ministry *</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="e.g. Ministry of Social Justice & Empowerment"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-gov-blue-500 focus:bg-white"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Category Domain</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                >
                  <option value="Education">Education</option>
                  <option value="Agriculture">Agriculture</option>
                  <option value="Small Business">Small Business</option>
                  <option value="Housing">Housing</option>
                  <option value="Senior Citizens">Senior Citizens</option>
                  <option value="Women & Child Welfare">Women & Child Welfare</option>
                  <option value="Employment">Employment</option>
                  <option value="Disability Assistance">Disability Assistance</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">Beneficiary Group Scope</label>
                <input
                  type="text"
                  value={formData.beneficiaryType}
                  onChange={(e) => setFormData({ ...formData, beneficiaryType: e.target.value })}
                  placeholder="e.g. Students, Farmers, Widows"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-bold text-slate-700">State / Region (Leave empty for National)</label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="e.g. Tamil Nadu or National"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block font-bold text-slate-700">Short Summary Description</label>
                <input
                  type="text"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  placeholder="One sentence overview for scheme cards"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="md:col-span-2">
                <SchemeImageUploader
                  imageUrl={formData.imageUrl || ''}
                  category={formData.category}
                  schemeName={formData.name}
                  shortDescription={formData.shortDescription}
                  state={formData.state}
                  onChange={(newUrl) => setFormData({ ...formData, imageUrl: newUrl })}
                />
              </div>

              <div className="space-y-1 md:col-span-2">
                <label className="block font-bold text-slate-700">Full Detailed Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Complete objective and scope of the scheme..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Benefits */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-gov-blue-900">Step 2: Benefits Management</h3>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  benefitsList: [...formData.benefitsList, { title: 'New Benefit', description: '', amount: '₹0', frequency: 'Annual' }]
                })}
                className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Benefit
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">General Aggregate Benefits Text</label>
              <textarea
                rows={3}
                value={formData.benefits}
                onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                placeholder="High-level benefits summary for search indexing..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              />
            </div>

            <div className="space-y-3 pt-2">
              <span className="block text-xs font-extrabold text-slate-600">Structured Benefit Entries:</span>
              {formData.benefitsList.map((b: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-500">
                    <span>Benefit Entry #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        benefitsList: formData.benefitsList.filter((_: any, i: number) => i !== idx)
                      })}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Title (e.g. Financial Stipend)"
                      value={b.title}
                      onChange={(e) => {
                        const copy = [...formData.benefitsList];
                        copy[idx].title = e.target.value;
                        setFormData({ ...formData, benefitsList: copy });
                      }}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                    />
                    <input
                      type="text"
                      placeholder="Amount (e.g. ₹6,000)"
                      value={b.amount}
                      onChange={(e) => {
                        const copy = [...formData.benefitsList];
                        copy[idx].amount = e.target.value;
                        setFormData({ ...formData, benefitsList: copy });
                      }}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                    />
                    <select
                      value={b.frequency}
                      onChange={(e) => {
                        const copy = [...formData.benefitsList];
                        copy[idx].frequency = e.target.value;
                        setFormData({ ...formData, benefitsList: copy });
                      }}
                      className="px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                    >
                      <option value="One-Time">One-Time</option>
                      <option value="Monthly">Monthly</option>
                      <option value="Annual">Annual</option>
                      <option value="Recurring">Recurring</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 3: Eligibility Rules (Visual Builder) */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h3 className="font-extrabold text-base text-gov-blue-900 border-b border-slate-100 pb-3">
              Step 3: Visual Eligibility Rule Engine & Data Wallet Mapping
            </h3>
            <RuleBuilder
              requirements={formData.requirements}
              onChange={(rules: SchemeRequirementItem[]) => setFormData({ ...formData, requirements: rules })}
            />
            <RequiredCitizenInfo requirements={formData.requirements} />
          </div>
        )}

        {/* STEP 4: Documents */}
        {currentStep === 4 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-gov-blue-900">Step 4: Document Requirements</h3>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  documentsList: [...formData.documentsList, { name: 'Income Certificate', description: 'Issued by competent authority', mandatory: true }]
                })}
                className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Document
              </button>
            </div>

            <textarea
              rows={2}
              value={formData.requiredDocuments}
              onChange={(e) => setFormData({ ...formData, requiredDocuments: e.target.value })}
              placeholder="Comma-separated summary of documents (e.g. Aadhaar Card, Income Certificate)..."
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
            />

            <div className="space-y-2 pt-2 text-xs">
              {formData.documentsList.map((doc: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <input
                    type="text"
                    placeholder="Document Name"
                    value={doc.name}
                    onChange={(e) => {
                      const copy = [...formData.documentsList];
                      copy[idx].name = e.target.value;
                      setFormData({ ...formData, documentsList: copy });
                    }}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg font-bold"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const copy = [...formData.documentsList];
                      copy[idx].mandatory = !copy[idx].mandatory;
                      setFormData({ ...formData, documentsList: copy });
                    }}
                    className={`px-3 py-1.5 rounded-lg font-bold text-[10px] ${
                      doc.mandatory ? 'bg-red-100 text-red-700' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {doc.mandatory ? 'Mandatory' : 'Optional'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({
                      ...formData,
                      documentsList: formData.documentsList.filter((_: any, i: number) => i !== idx)
                    })}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Application Process */}
        {currentStep === 5 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-gov-blue-900">
                  Step 5: Application Process & Registration Timeline
                </h3>
                <p className="text-xs text-slate-500">Define the general application process text and step-by-step registration timeline for citizens.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  applicationSteps: [...(formData.applicationSteps || []), { stepNumber: (formData.applicationSteps?.length || 0) + 1, title: 'New Application Step', description: '' }]
                })}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Step
              </button>
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">Application Summary Overview Text</label>
              <textarea
                rows={3}
                value={formData.applicationProcess}
                onChange={(e) => setFormData({ ...formData, applicationProcess: e.target.value })}
                placeholder="High-level guidance on registration portals, nodal offices, offline submissions..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-gov-blue-500"
              />
            </div>

            <div className="space-y-3 pt-2">
              <span className="block text-xs font-extrabold text-slate-700">Structured Registration Steps Timeline ({formData.applicationSteps?.length || 0}):</span>
              {formData.applicationSteps?.map((step: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
                  <div className="flex justify-between items-center font-bold text-slate-600 border-b border-slate-200/60 pb-2">
                    <span className="flex items-center gap-2">
                      <span className="w-5 h-5 bg-gov-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                        {step.stepNumber || idx + 1}
                      </span>
                      Step #{step.stepNumber || idx + 1} Details
                    </span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        applicationSteps: formData.applicationSteps.filter((_: any, i: number) => i !== idx)
                      })}
                      className="text-red-500 hover:text-red-700 font-bold text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1">
                      <label className="block font-bold text-slate-600 mb-1">Step Number</label>
                      <input
                        type="number"
                        value={step.stepNumber || idx + 1}
                        onChange={(e) => {
                          const copy = [...formData.applicationSteps];
                          copy[idx].stepNumber = Number(e.target.value);
                          setFormData({ ...formData, applicationSteps: copy });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-800"
                      />
                    </div>
                    <div className="sm:col-span-3">
                      <label className="block font-bold text-slate-600 mb-1">Step Title</label>
                      <input
                        type="text"
                        placeholder="Step Title (e.g. Register on Official Portal)"
                        value={step.title || ''}
                        onChange={(e) => {
                          const copy = [...formData.applicationSteps];
                          copy[idx].title = e.target.value;
                          setFormData({ ...formData, applicationSteps: copy });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
                      />
                    </div>
                    <div className="sm:col-span-4">
                      <label className="block font-bold text-slate-600 mb-1">Step Instructions & Details</label>
                      <textarea
                        rows={2}
                        placeholder="Detailed instructions for citizens for completing this specific step..."
                        value={step.description || ''}
                        onChange={(e) => {
                          const copy = [...formData.applicationSteps];
                          copy[idx].description = e.target.value;
                          setFormData({ ...formData, applicationSteps: copy });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 6: Important Dates */}
        {currentStep === 6 && (
          <div className="space-y-4">
            <h3 className="font-extrabold text-base text-gov-blue-900 border-b border-slate-100 pb-3">
              Step 6: Important Dates & Deadlines
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700">Application Deadline</label>
                <input
                  type="date"
                  value={formData.deadline || ''}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: FAQs */}
        {currentStep === 7 && (
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-gov-blue-900">Step 7: Frequently Asked Questions</h3>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  faqs: [...formData.faqs, { question: 'New Question', answer: 'New Answer', displayOrder: formData.faqs.length + 1 }]
                })}
                className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add FAQ
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {formData.faqs.map((faq: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex justify-between items-center font-bold text-slate-500">
                    <span>FAQ #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        faqs: formData.faqs.filter((_: any, i: number) => i !== idx)
                      })}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    placeholder="Question"
                    value={faq.question}
                    onChange={(e) => {
                      const copy = [...formData.faqs];
                      copy[idx].question = e.target.value;
                      setFormData({ ...formData, faqs: copy });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-bold"
                  />
                  <textarea
                    rows={2}
                    placeholder="Answer"
                    value={faq.answer}
                    onChange={(e) => {
                      const copy = [...formData.faqs];
                      copy[idx].answer = e.target.value;
                      setFormData({ ...formData, faqs: copy });
                    }}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 8: Sources */}
        {currentStep === 8 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-base text-gov-blue-900">
                  Step 8: Official Reference Sources & Links
                </h3>
                <p className="text-xs text-slate-500">Add official portal links, guideline PDFs, and gazette references.</p>
              </div>
              <button
                type="button"
                onClick={() => setFormData({
                  ...formData,
                  sources: [...(formData.sources || []), { sourceName: 'Official Portal', officialUrl: 'https://', sourceType: 'Government Portal' }]
                })}
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> Add Source
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <label className="block font-bold text-slate-700">Primary Official Portal Website URL *</label>
              <input
                type="url"
                value={formData.officialUrl}
                onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
                placeholder="https://scholarships.gov.in"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-gov-blue-500"
              />
            </div>

            <div className="space-y-3 text-xs pt-2">
              <span className="font-extrabold text-slate-700 block">Structured Citation Sources ({formData.sources?.length || 0}):</span>
              {formData.sources?.map((src: any, idx: number) => (
                <div key={idx} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center font-bold text-slate-600">
                    <span>Source Entry #{idx + 1}</span>
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        sources: formData.sources.filter((_: any, i: number) => i !== idx)
                      })}
                      className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Source Label / Title</label>
                      <input
                        type="text"
                        placeholder="e.g. Official Guidelines Document"
                        value={src.sourceName || ''}
                        onChange={(e) => {
                          const copy = [...formData.sources];
                          copy[idx].sourceName = e.target.value;
                          setFormData({ ...formData, sources: copy });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-bold"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Source URL</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={src.officialUrl || ''}
                        onChange={(e) => {
                          const copy = [...formData.sources];
                          copy[idx].officialUrl = e.target.value;
                          setFormData({ ...formData, sources: copy });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-600 mb-1">Source Type</label>
                      <select
                        value={src.sourceType || 'Government Portal'}
                        onChange={(e) => {
                          const copy = [...formData.sources];
                          copy[idx].sourceType = e.target.value;
                          setFormData({ ...formData, sources: copy });
                        }}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-medium"
                      >
                        <option value="Government Portal">Government Portal</option>
                        <option value="Official Gazette">Official Gazette</option>
                        <option value="Guidelines PDF">Guidelines PDF</option>
                        <option value="Press Release">Press Release</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 9: Review & Publish */}
        {currentStep === 9 && (
          <div className="space-y-6">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-base text-gov-blue-900">Step 9: Review Scheme Details</h3>
              <p className="text-xs text-slate-500">Verify all information before saving as Draft or Publishing live to citizens.</p>
            </div>

            <CitizenViewPreview
              scheme={formData}
              requirements={formData.requirements}
              benefitsList={formData.benefitsList}
              documentsList={formData.documentsList}
              applicationSteps={formData.applicationSteps}
              faqs={formData.faqs}
              sources={formData.sources}
            />

            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleSaveScheme('DRAFT')}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-2xl text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" /> Save as Draft
              </button>

              <button
                type="button"
                onClick={() => handleSaveScheme('PUBLISHED')}
                disabled={saving}
                className="w-full sm:w-auto px-6 py-3 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg hover:shadow-gov-blue-500/20 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" /> {saving ? 'Publishing...' : 'Validate & Publish Scheme'}
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Navigation Buttons Footer */}
      <div className="flex items-center justify-between pt-2">
        <button
          type="button"
          onClick={handlePrev}
          disabled={currentStep === 1}
          className="px-5 py-2.5 border border-slate-300 disabled:opacity-40 hover:bg-slate-100 font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {currentStep < 9 && (
          <button
            type="button"
            onClick={handleNext}
            className="px-6 py-2.5 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            Next Step <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
}
