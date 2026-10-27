import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { localizeTerm, localizeField, localizeOption } from '../utils/localizationHelper';
import { 
  User, Briefcase, GraduationCap, Users, ShieldAlert, Sparkles, 
  ArrowRight, CheckCircle2, AlertCircle, Loader2, Save, Info 
} from 'lucide-react';

interface DataWalletProps {
  token: string;
  apiUrl: string;
  onNavigate: (page: string) => void;
}

type TabCategory = 'personal' | 'economic' | 'education' | 'family' | 'additional';

export default function DataWallet({ token, apiUrl, onNavigate }: DataWalletProps) {
  const { t, language } = useLanguage();
  const [wallet, setWallet] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [activeTab, setActiveTab] = useState<TabCategory>('personal');

  // Form states matching 18 socio-economic variables
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('Male');
  const [state, setState] = useState('Tamil Nadu');
  const [district, setDistrict] = useState('');
  const [urbanRural, setUrbanRural] = useState('Urban');
  
  const [income, setIncome] = useState('');
  const [occupation, setOccupation] = useState('');
  const [employmentStatus, setEmploymentStatus] = useState('Unemployed');
  
  const [education, setEducation] = useState('Secondary School');
  const [studentStatus, setStudentStatus] = useState('No');
  
  const [familySize, setFamilySize] = useState('4');
  const [maritalStatus, setMaritalStatus] = useState('Single');
  
  const [farmerStatus, setFarmerStatus] = useState('No');
  const [landOwnership, setLandOwnership] = useState('No');
  const [landArea, setLandArea] = useState('0');
  
  const [disabilityStatus, setDisabilityStatus] = useState('No');
  const [disabilityPercentage, setDisabilityPercentage] = useState('0');
  const [disabilityCertificateStatus, setDisabilityCertificateStatus] = useState('No');
  
  const [housingStatus, setHousingStatus] = useState('Rented');
  const [existingBenefits, setExistingBenefits] = useState('Ration Card');

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${apiUrl}/api/wallet/get`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Could not decrypt wallet records.");
        const data = await res.json();
        setWallet(data);
        
        // Initialize form states
        if (data) {
          setDateOfBirth(data.dateOfBirth || '');
          setGender(data.gender || 'Male');
          setState(data.state || 'Tamil Nadu');
          setDistrict(data.district || '');
          setUrbanRural(data.urbanRural || 'Urban');
          setIncome(data.income !== null ? String(data.income) : '');
          setOccupation(data.occupation || '');
          setEmploymentStatus(data.employmentStatus || 'Unemployed');
          setEducation(data.education || 'Secondary School');
          setStudentStatus(data.studentStatus || 'No');
          setFamilySize(data.familySize !== null ? String(data.familySize) : '4');
          setMaritalStatus(data.maritalStatus || 'Single');
          setFarmerStatus(data.farmerStatus || 'No');
          setLandOwnership(data.landOwnership || 'No');
          setLandArea(data.landArea !== null ? String(data.landArea) : '0');
          setDisabilityStatus(data.disabilityStatus || 'No');
          setDisabilityPercentage(data.disabilityPercentage !== null ? String(data.disabilityPercentage) : '0');
          setDisabilityCertificateStatus(data.disabilityCertificateStatus || 'No');
          setHousingStatus(data.housingStatus || 'Rented');
          setExistingBenefits(data.existingBenefits || '');
        }
      } catch (err: any) {
        setError(err.message || "Failed to load wallet data.");
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [token, apiUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      dateOfBirth: dateOfBirth || null,
      gender,
      state,
      district: district || null,
      urbanRural,
      income: income ? parseFloat(income) : 0.0,
      occupation: occupation || null,
      employmentStatus,
      education,
      studentStatus,
      familySize: familySize ? parseInt(familySize) : 1,
      maritalStatus,
      farmerStatus,
      landOwnership: farmerStatus === 'Yes' ? landOwnership : 'No',
      landArea: farmerStatus === 'Yes' ? parseFloat(landArea) : 0.0,
      disabilityStatus,
      disabilityPercentage: disabilityStatus === 'Yes' ? parseFloat(disabilityPercentage) : 0.0,
      disabilityCertificateStatus: disabilityStatus === 'Yes' ? disabilityCertificateStatus : 'No',
      housingStatus,
      existingBenefits: existingBenefits || null
    };

    try {
      const response = await fetch(`${apiUrl}/api/wallet/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Failed to save wallet parameters.");
      }

      setSuccess("Your socio-economic Data Wallet variables have been securely compiled & saved.");
      
      // Update completion percentage locally
      const updated = await response.json();
      setWallet((prev: any) => ({ ...prev, profileCompletion: updated.profileCompletion }));
    } catch (err: any) {
      setError(err.message || "Failed to save data wallet.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-gov-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm font-semibold">Opening encrypted wallet profile...</span>
      </div>
    );
  }

  // Visual sub tabs definition
  const subTabs = [
    { id: 'personal', label: t('wallet.tab.personal', 'Personal & Demographics'), icon: User, complete: 100 },
    { id: 'economic', label: t('wallet.tab.economic', 'Financial & Income'), icon: Briefcase, complete: income ? 100 : 0 },
    { id: 'education', label: t('wallet.tab.education', 'Academic Profile'), icon: GraduationCap, complete: 100 },
    { id: 'family', label: t('wallet.tab.family', 'Family & Marital'), icon: Users, complete: 100 },
    { id: 'additional', label: t('wallet.tab.additional', 'Welfare & Agriculture'), icon: Sparkles, complete: 100 }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto text-left animate-fadeIn">
      
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gov-blue-900 font-display tracking-tight">
            {t('wallet.title', 'Socio-Economic Data Wallet')}
          </h1>
          <p className="text-slate-500 text-xs mt-1 font-semibold">
            {t('wallet.subtitle', 'Manage your single secure profile. Variables are reused across welfare registrations.')}
          </p>
        </div>
        
        {wallet && (
          <div className="px-4 py-2 bg-gov-blue-50 rounded-xl border border-gov-blue-100 flex items-center gap-2 shadow-sm">
            <span className="text-xs font-black text-gov-blue-800">{localizeTerm("Wallet Integrity:", language)}</span>
            <span className="text-xs font-black text-gov-blue-500">{Math.round(wallet.profileCompletion)}%</span>
          </div>
        )}
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main split grid */}
      <div className="grid md:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Nav Left */}
        <div className="md:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-1">
          {subTabs.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as TabCategory)}
                className={`w-full px-4 py-3 rounded-xl text-xs font-bold text-left transition-all flex items-center justify-between border cursor-pointer ${
                  active 
                    ? 'bg-gov-blue-50 border-gov-blue-100 text-gov-blue-700 font-extrabold' 
                    : 'bg-white border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4.5 h-4.5 flex-shrink-0" />
                  <span>{t.label}</span>
                </div>
                <ChevronRightActive active={active} />
              </button>
            );
          })}
        </div>

        {/* Editable Form right */}
        <div className="md:col-span-8 bg-white rounded-2xl border border-slate-200 shadow-sm p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* PERSONAL TAB */}
            {activeTab === 'personal' && (
              <div className="space-y-4 animate-slideDown">
                <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-50 pb-2">{localizeTerm("Personal Demographics", language)}</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Date of Birth", language)}</label>
                    <input
                      type="date"
                      required
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Gender", language)}</label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all cursor-pointer"
                    >
                      <option value="Male">{localizeOption("Male", language)}</option>
                      <option value="Female">{localizeOption("Female", language)}</option>
                      <option>Transgender</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">State Scope</label>
                    <select
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all cursor-pointer"
                    >
                      <option>Universal (National)</option>
                      <option>Tamil Nadu</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("District", language)}</label>
                    <input
                      type="text"
                      required
                      value={district}
                      onChange={(e) => setDistrict(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5 text-xs">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Area Designation</label>
                  <select
                    value={urbanRural}
                    onChange={(e) => setUrbanRural(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all cursor-pointer"
                  >
                    <option value="Urban">{localizeOption("Urban", language)}</option>
                    <option value="Rural">{localizeOption("Rural", language)}</option>
                  </select>
                </div>
              </div>
            )}

            {/* ECONOMIC TAB */}
            {activeTab === 'economic' && (
              <div className="space-y-4 animate-slideDown">
                <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-50 pb-2">{localizeTerm("Financial Credentials", language)}</h3>
                <div className="space-y-1.5 text-xs">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Annual Family Income (INR)", language)}</label>
                  <input
                    type="number"
                    required
                    value={income}
                    onChange={(e) => setIncome(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all"
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Employment Status", language)}</label>
                    <select
                      value={employmentStatus}
                      onChange={(e) => setEmploymentStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all cursor-pointer"
                    >
                      <option value="Employed">{localizeOption("Employed", language)}</option>
                      <option value="Unemployed">{localizeOption("Unemployed", language)}</option>
                      <option value="Self Employed">{localizeOption("Self Employed", language)}</option>
                      <option value="Student">{localizeOption("Student", language)}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Occupation / Sector", language)}</label>
                    <input
                      type="text"
                      required
                      value={occupation}
                      onChange={(e) => setOccupation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* EDUCATION TAB */}
            {activeTab === 'education' && (
              <div className="space-y-4 animate-slideDown">
                <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-50 pb-2">{localizeTerm("Academic Profile", language)}</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Highest Qualification", language)}</label>
                    <select
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all cursor-pointer"
                    >
                      <option value="Secondary School">{localizeOption("Secondary School", language)}</option>
                      <option value="Higher Secondary">{localizeOption("Higher Secondary", language)}</option>
                      <option value="Diploma">{localizeOption("Diploma", language)}</option>
                      <option value="Under Graduate">{localizeOption("Under Graduate", language)}</option>
                      <option value="Post Graduate">{localizeOption("Post Graduate", language)}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Currently Active Student?", language)}</label>
                    <select
                      value={studentStatus}
                      onChange={(e) => setStudentStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all cursor-pointer"
                    >
                      <option value="Yes">{localizeOption("Yes", language)}</option>
                      <option value="No">{localizeOption("No", language)}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* FAMILY TAB */}
            {activeTab === 'family' && (
              <div className="space-y-4 animate-slideDown">
                <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-50 pb-2">{localizeTerm("Family dynamics", language)}</h3>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Family Size (Members)", language)}</label>
                    <input
                      type="number"
                      required
                      value={familySize}
                      onChange={(e) => setFamilySize(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Marital Status", language)}</label>
                    <select
                      value={maritalStatus}
                      onChange={(e) => setMaritalStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all cursor-pointer"
                    >
                      <option value="Single">{localizeOption("Single", language)}</option>
                      <option value="Married">{localizeOption("Married", language)}</option>
                      <option value="Widowed">{localizeOption("Widowed", language)}</option>
                      <option value="Divorced">{localizeOption("Divorced", language)}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ADDITIONAL TAB */}
            {activeTab === 'additional' && (
              <div className="space-y-4 animate-slideDown">
                <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-50 pb-2">{localizeTerm("Welfare & Farmer Parameters", language)}</h3>
                
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Are you a Farmer?", language)}</label>
                    <select
                      value={farmerStatus}
                      onChange={(e) => setFarmerStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all cursor-pointer"
                    >
                      <option value="No">{localizeOption("No", language)}</option>
                      <option value="Yes">{localizeOption("Yes", language)}</option>
                    </select>
                  </div>

                  {farmerStatus === 'Yes' && (
                    <div className="space-y-1.5 animate-slideDown">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Do you own cultivable land?", language)}</label>
                      <select
                        value={landOwnership}
                        onChange={(e) => setLandOwnership(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all cursor-pointer"
                      >
                        <option value="Yes">{localizeOption("Yes", language)}</option>
                        <option value="No">{localizeOption("No", language)}</option>
                      </select>
                    </div>
                  )}
                </div>

                {farmerStatus === 'Yes' && (
                  <div className="space-y-1.5 text-xs animate-slideDown">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Cultivable Land Area (Acres)", language)}</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={landArea}
                      onChange={(e) => setLandArea(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all"
                    />
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Differently Abled?", language)}</label>
                    <select
                      value={disabilityStatus}
                      onChange={(e) => setDisabilityStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all cursor-pointer"
                    >
                      <option value="No">{localizeOption("No", language)}</option>
                      <option value="Yes">{localizeOption("Yes", language)}</option>
                    </select>
                  </div>

                  {disabilityStatus === 'Yes' && (
                    <div className="space-y-1.5 animate-slideDown">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Disability Percentage", language)}</label>
                      <input
                        type="number"
                        required
                        value={disabilityPercentage}
                        onChange={(e) => setDisabilityPercentage(e.target.value)}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all"
                      />
                    </div>
                  )}
                </div>

                {disabilityStatus === 'Yes' && (
                  <div className="space-y-1.5 text-xs animate-slideDown">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Do you hold a Disability Certificate?", language)}</label>
                    <select
                      value={disabilityCertificateStatus}
                      onChange={(e) => setDisabilityCertificateStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all cursor-pointer"
                    >
                      <option value="No">{localizeOption("No", language)}</option>
                      <option value="Yes">{localizeOption("Yes", language)}</option>
                    </select>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Housing Status", language)}</label>
                    <select
                      value={housingStatus}
                      onChange={(e) => setHousingStatus(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all cursor-pointer"
                    >
                      <option value="Homeless">{localizeOption("Homeless", language)}</option>
                      <option value="Kutcha House">{localizeOption("Kutcha House", language)}</option>
                      <option value="Rented">{localizeOption("Rented", language)}</option>
                      <option value="Owned Pakka House">{localizeOption("Owned Pakka House", language)}</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Existing Cards / Benefits", language)}</label>
                    <input
                      type="text"
                      required
                      value={existingBenefits}
                      onChange={(e) => setExistingBenefits(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 font-semibold transition-all"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Save Buttons panel */}
            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-gov-blue-500 hover:bg-gov-blue-600 disabled:bg-gov-blue-200 text-white font-extrabold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm shadow-gov-blue-500/10 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving Parameters...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" /> Save Data Wallet
                  </>
                )}
              </button>
            </div>

          </form>
        </div>

      </div>

    </div>
  );
}

function ChevronRightActive({ active }: { active: boolean }) {
  return (
    <span className={`text-[10px] font-bold transition-transform ${active ? 'translate-x-0.5' : ''}`}>
      →
    </span>
  );
}
