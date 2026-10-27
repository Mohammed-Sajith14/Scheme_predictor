import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Save, Eye, Send, ArrowLeft, RefreshCw, Layers, 
  FileText, Sliders, CheckCircle, HelpCircle, Calendar, Link as LinkIcon, Plus, Trash2, Globe, Image as ImageIcon
} from 'lucide-react';
import { RuleBuilder, type SchemeRequirementItem } from '../../components/admin/RuleBuilder';
import { RequiredCitizenInfo } from '../../components/admin/RequiredCitizenInfo';
import { CitizenViewPreview } from '../../components/admin/CitizenViewPreview';
import { SchemeImageUploader } from '../../components/admin/SchemeImageUploader';
import { getSchemeImageUrl } from '../../utils/imageHelper';

interface EditSchemeProps {
  schemeId: number;
  token: string;
  apiUrl: string;
  onNavigate: (page: string, params?: any) => void;
}

export default function EditScheme({ schemeId, token, apiUrl, onNavigate }: EditSchemeProps) {
  const [activeTab, setActiveTab] = useState<'basic' | 'benefits' | 'eligibility' | 'documents' | 'application' | 'dates' | 'faqs' | 'sources' | 'preview'>('basic');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [formData, setFormData] = useState<any>(null);

  const getAuthToken = () => token || localStorage.getItem('token') || '';

  const fetchSchemeDetails = async () => {
    try {
      setLoading(true);
      const authToken = getAuthToken();
      const res = await fetch(`${apiUrl}/api/admin/schemes/${schemeId}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setFormData({
          ...data,
          requirements: data.requirements || [],
          benefitsList: data.benefitsList || [],
          documentsList: data.documentsList || [],
          applicationSteps: data.applicationSteps || [],
          faqs: data.faqs || [],
          sources: data.sources || []
        });
      } else {
        setErrorMsg('Failed to load scheme details.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error connecting to backend.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (schemeId) {
      fetchSchemeDetails();
    }
  }, [schemeId, token]);

  const handleSave = async (publish = false) => {
    try {
      setSaving(true);
      setSuccessMsg('');
      setErrorMsg('');

      const updatedData = {
        ...formData,
        status: publish ? 'PUBLISHED' : formData.status
      };

      const authToken = getAuthToken();
      const res = await fetch(`${apiUrl}/api/admin/schemes/${schemeId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(updatedData)
      });

      if (res.ok) {
        const text = await res.text();
        if (text) {
          try {
            const returnedData = JSON.parse(text);
            setFormData({
              ...returnedData,
              requirements: returnedData.requirements || [],
              benefitsList: returnedData.benefitsList || [],
              documentsList: returnedData.documentsList || [],
              applicationSteps: returnedData.applicationSteps || [],
              faqs: returnedData.faqs || [],
              sources: returnedData.sources || []
            });
          } catch {}
        }
        setSuccessMsg(publish ? 'Scheme updated and published live successfully! Changes synced to user side.' : 'Scheme draft saved successfully.');
      } else {
        const text = await res.text();
        let message = `Failed to save scheme updates (HTTP ${res.status})`;
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
      setErrorMsg(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gov-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  if (!formData) {
    return (
      <div className="p-8 text-center text-red-600 font-bold">
        {errorMsg || 'Scheme details unavailable.'}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 text-left animate-fadeIn">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-slate-200/80 rounded-3xl shadow-sm">
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('admin-schemes')}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500 cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-gov-blue-900 font-display">{formData.name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] uppercase ${
                formData.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {formData.status} (v{formData.version || 1})
              </span>
            </div>
            <p className="text-xs text-slate-400">ID #{formData.id} • {formData.department || 'Government Scheme'}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Draft'}
          </button>

          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-4 py-2 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-extrabold rounded-xl text-xs transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
          >
            <Send className="w-4 h-4" /> Save & Publish Live
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex justify-between items-center animate-slideDown">
          <span>✓ {successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs font-bold animate-slideDown">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Editor Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Left Nav Menu */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-3 shadow-sm space-y-1 h-fit">
          <button
            onClick={() => setActiveTab('basic')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 ${
              activeTab === 'basic' ? 'bg-gov-blue-500 text-white font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <FileText className="w-4 h-4" /> Basic Info & Image
          </button>
          
          <button
            onClick={() => setActiveTab('benefits')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 ${
              activeTab === 'benefits' ? 'bg-gov-blue-500 text-white font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4" /> Benefits ({formData.benefitsList?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('eligibility')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 ${
              activeTab === 'eligibility' ? 'bg-gov-blue-500 text-white font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Sliders className="w-4 h-4" /> Eligibility Rules ({formData.requirements?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('documents')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 ${
              activeTab === 'documents' ? 'bg-gov-blue-500 text-white font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <CheckCircle className="w-4 h-4" /> Documents ({formData.documentsList?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('application')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 ${
              activeTab === 'application' ? 'bg-gov-blue-500 text-white font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Globe className="w-4 h-4" /> Application & Steps ({formData.applicationSteps?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('dates')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 ${
              activeTab === 'dates' ? 'bg-gov-blue-500 text-white font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <Calendar className="w-4 h-4" /> Important Dates
          </button>

          <button
            onClick={() => setActiveTab('faqs')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 ${
              activeTab === 'faqs' ? 'bg-gov-blue-500 text-white font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <HelpCircle className="w-4 h-4" /> FAQs ({formData.faqs?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('sources')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 ${
              activeTab === 'sources' ? 'bg-gov-blue-500 text-white font-extrabold' : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            <LinkIcon className="w-4 h-4" /> Official Sources ({formData.sources?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('preview')}
            className={`w-full px-3 py-2.5 rounded-xl text-xs font-bold text-left transition-colors flex items-center gap-2.5 border border-indigo-200 bg-indigo-50/50 text-indigo-700 hover:bg-indigo-100 ${
              activeTab === 'preview' ? 'bg-indigo-600 text-white font-extrabold' : ''
            }`}
          >
            <Eye className="w-4 h-4" /> Live Citizen Preview
          </button>
        </div>

        {/* Right Editing Content Pane */}
        <div className="lg:col-span-3 bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
          
          {/* TAB 1: Basic Information & Cover Image */}
          {activeTab === 'basic' && (
            <div className="space-y-5 text-xs">
              <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-100 pb-3">
                Basic Scheme Information & Cover Banner
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="font-bold text-slate-700">Scheme Name *</label>
                  <input
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Department / Ministry *</label>
                  <input
                    type="text"
                    value={formData.department || ''}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Category Domain</label>
                  <input
                    type="text"
                    value={formData.category || ''}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Beneficiary Group Scope</label>
                  <input
                    type="text"
                    value={formData.beneficiaryType || ''}
                    onChange={(e) => setFormData({ ...formData, beneficiaryType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Target Beneficiary Profile</label>
                  <input
                    type="text"
                    value={formData.targetBeneficiary || ''}
                    onChange={(e) => setFormData({ ...formData, targetBeneficiary: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Scheme Type / Governance</label>
                  <input
                    type="text"
                    value={formData.schemeType || ''}
                    onChange={(e) => setFormData({ ...formData, schemeType: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">State / Region (Leave blank for National)</label>
                  <input
                    type="text"
                    value={formData.state || ''}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Tamil Nadu or All India"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700">Official Scheme ID / Code</label>
                  <input
                    type="text"
                    value={formData.officialSchemeId || ''}
                    onChange={(e) => setFormData({ ...formData, officialSchemeId: e.target.value })}
                    placeholder="e.g. SCH-EDU-2026-01"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700">Official Government Portal URL</label>
                  <input
                    type="url"
                    value={formData.officialUrl || ''}
                    onChange={(e) => setFormData({ ...formData, officialUrl: e.target.value })}
                    placeholder="https://scholarships.gov.in"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div className="md:col-span-2">
                  <SchemeImageUploader
                    imageUrl={formData.imageUrl || ''}
                    category={formData.category}
                    schemeName={formData.name}
                    shortDescription={formData.shortDescription}
                    state={formData.state}
                    schemeId={formData.id}
                    onChange={(newUrl) => setFormData({ ...formData, imageUrl: newUrl })}
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700">Short Card Summary Description</label>
                  <input
                    type="text"
                    value={formData.shortDescription || ''}
                    onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                    placeholder="Short 1-sentence overview"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div className="space-y-1 md:col-span-2">
                  <label className="font-bold text-slate-700">Full Detailed Program Description</label>
                  <textarea
                    rows={4}
                    value={formData.description || ''}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Benefits */}
          {activeTab === 'benefits' && (
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-gov-blue-900">Welfare Benefits Offered</h3>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    benefitsList: [...formData.benefitsList, { title: 'New Benefit Item', description: '', amount: '₹0', frequency: 'Annual' }]
                  })}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Benefit
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Benefits Summary Overview Text</label>
                <textarea
                  rows={3}
                  value={formData.benefits || ''}
                  onChange={(e) => setFormData({ ...formData, benefits: e.target.value })}
                  placeholder="Summary of direct financial or material assistance..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-3 pt-2">
                <span className="font-extrabold text-slate-800 text-xs block">Structured Benefit Line Items ({formData.benefitsList?.length || 0})</span>
                {formData.benefitsList?.map((b: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-700">Benefit #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.benefitsList];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, benefitsList: updated });
                        }}
                        className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Title</label>
                        <input
                          type="text"
                          value={b.title || ''}
                          onChange={(e) => {
                            const updated = [...formData.benefitsList];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, benefitsList: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Amount / Subsidy</label>
                        <input
                          type="text"
                          value={b.amount || ''}
                          onChange={(e) => {
                            const updated = [...formData.benefitsList];
                            updated[idx].amount = e.target.value;
                            setFormData({ ...formData, benefitsList: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="font-bold text-slate-600 block mb-1">Description</label>
                        <input
                          type="text"
                          value={b.description || ''}
                          onChange={(e) => {
                            const updated = [...formData.benefitsList];
                            updated[idx].description = e.target.value;
                            setFormData({ ...formData, benefitsList: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: Eligibility Rules Builder */}
          {activeTab === 'eligibility' && (
            <div className="space-y-6">
              <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-100 pb-3">
                Eligibility Rule Builder & Dynamic Parameters
              </h3>
              <RuleBuilder
                requirements={formData.requirements || []}
                onChange={(rules: SchemeRequirementItem[]) => setFormData({ ...formData, requirements: rules })}
              />
              <RequiredCitizenInfo requirements={formData.requirements || []} />
            </div>
          )}

          {/* TAB 4: Documents */}
          {activeTab === 'documents' && (
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-gov-blue-900">Required Documents Checklist</h3>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    documentsList: [...formData.documentsList, { name: 'Aadhaar Card', description: 'Identity proof', mandatory: true }]
                  })}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Document
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Documents Summary Text</label>
                <textarea
                  rows={3}
                  value={formData.requiredDocuments || ''}
                  onChange={(e) => setFormData({ ...formData, requiredDocuments: e.target.value })}
                  placeholder="e.g. Aadhaar Card, Income Certificate, College Admission Slip"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-3 pt-2">
                <span className="font-extrabold text-slate-800 text-xs block">Document Checklist Items ({formData.documentsList?.length || 0})</span>
                {formData.documentsList?.map((d: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-700">Document #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.documentsList];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, documentsList: updated });
                        }}
                        className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Document Name</label>
                        <input
                          type="text"
                          value={d.name || ''}
                          onChange={(e) => {
                            const updated = [...formData.documentsList];
                            updated[idx].name = e.target.value;
                            setFormData({ ...formData, documentsList: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Requirement Type</label>
                        <select
                          value={d.mandatory ? 'true' : 'false'}
                          onChange={(e) => {
                            const updated = [...formData.documentsList];
                            updated[idx].mandatory = e.target.value === 'true';
                            setFormData({ ...formData, documentsList: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        >
                          <option value="true">Mandatory Document</option>
                          <option value="false">Optional Document</option>
                        </select>
                      </div>
                      <div className="md:col-span-2">
                        <label className="font-bold text-slate-600 block mb-1">Description / Authority</label>
                        <input
                          type="text"
                          value={d.description || ''}
                          onChange={(e) => {
                            const updated = [...formData.documentsList];
                            updated[idx].description = e.target.value;
                            setFormData({ ...formData, documentsList: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: Application Process & Registration Steps */}
          {activeTab === 'application' && (
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-gov-blue-900">Application Process & Registration Roadmap</h3>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    applicationSteps: [...formData.applicationSteps, { stepNumber: formData.applicationSteps.length + 1, title: 'New Registration Step', description: '' }]
                  })}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Step
                </button>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Application Summary Overview</label>
                <textarea
                  rows={3}
                  value={formData.applicationProcess || ''}
                  onChange={(e) => setFormData({ ...formData, applicationProcess: e.target.value })}
                  placeholder="Detailed instructions on where and how to apply..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="space-y-3 pt-2">
                <span className="font-extrabold text-slate-800 text-xs block">Registration Steps Timeline ({formData.applicationSteps?.length || 0})</span>
                {formData.applicationSteps?.map((s: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-700">Step {s.stepNumber || idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.applicationSteps];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, applicationSteps: updated });
                        }}
                        className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Step Title</label>
                        <input
                          type="text"
                          value={s.title || ''}
                          onChange={(e) => {
                            const updated = [...formData.applicationSteps];
                            updated[idx].title = e.target.value;
                            setFormData({ ...formData, applicationSteps: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Step Number</label>
                        <input
                          type="number"
                          value={s.stepNumber || idx + 1}
                          onChange={(e) => {
                            const updated = [...formData.applicationSteps];
                            updated[idx].stepNumber = Number(e.target.value);
                            setFormData({ ...formData, applicationSteps: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="font-bold text-slate-600 block mb-1">Description</label>
                        <input
                          type="text"
                          value={s.description || ''}
                          onChange={(e) => {
                            const updated = [...formData.applicationSteps];
                            updated[idx].description = e.target.value;
                            setFormData({ ...formData, applicationSteps: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: Important Dates */}
          {activeTab === 'dates' && (
            <div className="space-y-4 text-xs">
              <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-100 pb-3">Important Dates & Application Deadline</h3>
              <div className="space-y-2 max-w-md">
                <label className="font-bold text-slate-700 block">Closing Date / Application Deadline</label>
                <input
                  type="date"
                  value={formData.deadline ? String(formData.deadline).substring(0, 10) : ''}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                />
              </div>
            </div>
          )}

          {/* TAB 7: FAQs */}
          {activeTab === 'faqs' && (
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-gov-blue-900">Frequently Asked Questions (FAQs)</h3>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    faqs: [...formData.faqs, { question: 'New Question?', answer: '', displayOrder: formData.faqs.length + 1 }]
                  })}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add FAQ
                </button>
              </div>

              <div className="space-y-3">
                {formData.faqs?.map((f: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-700">FAQ #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.faqs];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, faqs: updated });
                        }}
                        className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Question</label>
                        <input
                          type="text"
                          value={f.question || ''}
                          onChange={(e) => {
                            const updated = [...formData.faqs];
                            updated[idx].question = e.target.value;
                            setFormData({ ...formData, faqs: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Answer</label>
                        <textarea
                          rows={2}
                          value={f.answer || ''}
                          onChange={(e) => {
                            const updated = [...formData.faqs];
                            updated[idx].answer = e.target.value;
                            setFormData({ ...formData, faqs: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: Sources */}
          {activeTab === 'sources' && (
            <div className="space-y-6 text-xs">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-extrabold text-sm text-gov-blue-900">Official Reference Sources</h3>
                <button
                  type="button"
                  onClick={() => setFormData({
                    ...formData,
                    sources: [...formData.sources, { sourceName: 'Official Website', officialUrl: 'https://', sourceType: 'Government Portal' }]
                  })}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Source
                </button>
              </div>

              <div className="space-y-3">
                {formData.sources?.map((src: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="font-extrabold text-slate-700">Source #{idx + 1}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = [...formData.sources];
                          updated.splice(idx, 1);
                          setFormData({ ...formData, sources: updated });
                        }}
                        className="text-red-500 hover:text-red-700 font-bold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">Source Name</label>
                        <input
                          type="text"
                          value={src.sourceName || ''}
                          onChange={(e) => {
                            const updated = [...formData.sources];
                            updated[idx].sourceName = e.target.value;
                            setFormData({ ...formData, sources: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-600 block mb-1">URL</label>
                        <input
                          type="url"
                          value={src.officialUrl || ''}
                          onChange={(e) => {
                            const updated = [...formData.sources];
                            updated[idx].officialUrl = e.target.value;
                            setFormData({ ...formData, sources: updated });
                          }}
                          className="w-full p-2 bg-white border border-slate-300 rounded-lg"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 9: Preview */}
          {activeTab === 'preview' && (
            <div className="space-y-6">
              <CitizenViewPreview
                scheme={formData}
                requirements={formData.requirements || []}
                benefitsList={formData.benefitsList || []}
                documentsList={formData.documentsList || []}
                applicationSteps={formData.applicationSteps || []}
                faqs={formData.faqs || []}
                sources={formData.sources || []}
              />
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
