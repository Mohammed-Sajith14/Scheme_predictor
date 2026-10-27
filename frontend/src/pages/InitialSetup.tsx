import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { localizeTerm, localizeField, localizeOption } from '../utils/localizationHelper';
import { 
  User, Briefcase, GraduationCap, Users, ShieldAlert, Sparkles, 
  ArrowRight, ArrowLeft, Loader2, CheckCircle2 
} from 'lucide-react';

interface InitialSetupProps {
  onSetupComplete: () => void;
  token: string;
  apiUrl: string;
}

export default function InitialSetup({ onSetupComplete, token, apiUrl }: InitialSetupProps) {
  const { t, language } = useLanguage();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form State
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

  const handleNext = () => setStep(prev => Math.min(prev + 1, 5));
  const handlePrev = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Prepare complete payload matching standard DataWallet variables
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
        throw new Error("Failed to save socio-economic parameters.");
      }

      onSetupComplete();
    } catch (err: any) {
      setError(err.message || "Failed to initialize wallet profile.");
    } finally {
      setLoading(false);
    }
  };

  const stepLabels = [
    { num: 1, label: localizeTerm('Demographics', language), icon: User },
    { num: 2, label: localizeTerm('Financial Profile', language), icon: Briefcase },
    { num: 3, label: localizeTerm('Academic Details', language), icon: GraduationCap },
    { num: 4, label: localizeTerm('Family Dynamics', language), icon: Users },
    { num: 5, label: localizeTerm('Welfare Parameters', language), icon: Sparkles }
  ];

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-6 bg-slate-50 relative overflow-hidden">
      
      {/* Glow Spheres */}
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-gov-blue-100/40 rounded-full blur-3xl -z-10 animate-pulse-glow" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-teal-50/50 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-[640px] bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden p-6 md:p-8 space-y-8 animate-fadeIn relative">
        
        {/* Onboarding Header */}
        <div className="text-center space-y-2">
          <span className="text-[10px] font-black uppercase text-gov-gold-600 bg-gov-gold-50 px-2 py-0.5 rounded border border-gov-gold-100 inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3 animate-pulse" /> {localizeTerm("Onboarding Wizard", language)}
          </span>
          <h1 className="text-2xl font-black text-gov-blue-900 font-display">{localizeTerm("Initialize Data Wallet", language)}</h1>
          <p className="text-slate-500 text-xs leading-relaxed max-w-sm mx-auto">
            {localizeTerm("Fill in these parameters once. They will populate matches across all welfares instantly.", language)}
          </p>
        </div>

        {/* Step Indicator row */}
        <div className="relative flex justify-between items-center max-w-md mx-auto">
          {/* Progress bar background line */}
          <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-slate-100 -z-10" />
          <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-gov-blue-500 transition-all duration-300 -z-10`} style={{ width: `${((step - 1) / 4) * 100}%` }} />
          
          {stepLabels.map((s) => {
            const Icon = s.icon;
            const isCompleted = step > s.num;
            const isActive = step === s.num;
            return (
              <div key={s.num} className="flex flex-col items-center group relative">
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                  isCompleted ? 'bg-gov-blue-500 border-gov-blue-500 text-white' :
                  isActive ? 'bg-white border-gov-blue-500 text-gov-blue-600 font-bold shadow-md shadow-gov-blue-500/10' :
                  'bg-white border-slate-200 text-slate-400'
                }`}>
                  {isCompleted ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Icon className="w-4 h-4" />}
                </div>
                {/* Floating tooltip labels */}
                <span className={`absolute -bottom-6 text-[8px] font-bold uppercase tracking-wider text-center whitespace-nowrap hidden sm:block ${
                  isActive ? 'text-gov-blue-600' : isCompleted ? 'text-slate-700' : 'text-slate-400'
                }`}>
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>

        {error && (
          <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-lg text-red-800 text-xs flex items-start gap-2 max-w-md mx-auto">
            <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Wizard Forms */}
        <form onSubmit={handleSubmit} className="space-y-6 pt-6 text-left max-w-lg mx-auto">
          
          {/* STEP 1: Demographics */}
          {step === 1 && (
            <div className="space-y-4 animate-slideDown">
              <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-50 pb-2">1. Personal Demographics</h3>
              
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Date of Birth", language)}</label>
                  <input
                    type="date"
                    required
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Gender", language)}</label>
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold cursor-pointer"
                  >
                    <option value="Male">{localizeOption("Male", language)}</option>
                    <option value="Female">{localizeOption("Female", language)}</option>
                    <option>Transgender</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Home State</label>
                  <select
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold cursor-pointer"
                  >
                    <option>National (Universal)</option>
                    <option>Tamil Nadu</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("District", language)}</label>
                  <input
                    type="text"
                    required
                    placeholder="Chennai"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Area Designation</label>
                <select
                  value={urbanRural}
                  onChange={(e) => setUrbanRural(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold cursor-pointer"
                >
                  <option value="Urban">{localizeOption("Urban", language)}</option>
                  <option value="Rural">{localizeOption("Rural", language)}</option>
                </select>
              </div>
            </div>
          )}

          {/* STEP 2: Economic Profile */}
          {step === 2 && (
            <div className="space-y-4 animate-slideDown">
              <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-50 pb-2">2. Financial & Occupation Profile</h3>

              <div className="space-y-1.5 text-xs">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Annual Family Income (INR)", language)}</label>
                <input
                  type="number"
                  required
                  placeholder="180000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Employment Status", language)}</label>
                  <select
                    value={employmentStatus}
                    onChange={(e) => setEmploymentStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold cursor-pointer"
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
                    placeholder="e.g. Student, Agriculture"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Academic Details */}
          {step === 3 && (
            <div className="space-y-4 animate-slideDown">
              <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-50 pb-2">3. Educational & Student Profile</h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Highest Qualification", language)}</label>
                  <select
                    value={education}
                    onChange={(e) => setEducation(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold cursor-pointer"
                  >
                    <option value="Secondary School">{localizeOption("Secondary School", language)}</option>
                    <option value="Higher Secondary">{localizeOption("Higher Secondary", language)}</option>
                    <option value="Diploma">{localizeOption("Diploma", language)}</option>
                    <option value="Under Graduate">{localizeOption("Under Graduate", language)}</option>
                    <option value="Post Graduate">{localizeOption("Post Graduate", language)}</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Currently Student?</label>
                  <select
                    value={studentStatus}
                    onChange={(e) => setStudentStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold cursor-pointer"
                  >
                    <option value="Yes">{localizeOption("Yes", language)}</option>
                    <option value="No">{localizeOption("No", language)}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: Family dynamics */}
          {step === 4 && (
            <div className="space-y-4 animate-slideDown">
              <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-50 pb-2">4. Family & Marital Profile</h3>

              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Family Size (Members)", language)}</label>
                  <input
                    type="number"
                    required
                    value={familySize}
                    onChange={(e) => setFamilySize(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Marital Status", language)}</label>
                  <select
                    value={maritalStatus}
                    onChange={(e) => setMaritalStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold cursor-pointer"
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

          {/* STEP 5: Welfare Parameters */}
          {step === 5 && (
            <div className="space-y-4 animate-slideDown">
              <h3 className="font-extrabold text-sm text-gov-blue-900 border-b border-slate-50 pb-2">5. Agriculture, Housing & Disability</h3>

              {/* Farmer and Conditional land */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Are you a Farmer?", language)}</label>
                  <select
                    value={farmerStatus}
                    onChange={(e) => setFarmerStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold cursor-pointer"
                  >
                    <option value="No">{localizeOption("No", language)}</option>
                    <option value="Yes">{localizeOption("Yes", language)}</option>
                  </select>
                </div>

                {farmerStatus === 'Yes' && (
                  <div className="space-y-1.5 animate-slideDown">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Land Ownership?</label>
                    <select
                      value={landOwnership}
                      onChange={(e) => setLandOwnership(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold cursor-pointer"
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
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold"
                  />
                </div>
              )}

              {/* Disability and conditionals */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeField("Differently Abled?", language)}</label>
                  <select
                    value={disabilityStatus}
                    onChange={(e) => setDisabilityStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold cursor-pointer"
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
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold"
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
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold cursor-pointer"
                  >
                    <option value="No">{localizeOption("No", language)}</option>
                    <option value="Yes">{localizeOption("Yes", language)}</option>
                  </select>
                </div>
              )}

              {/* Housing and benefits */}
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Housing Type</label>
                  <select
                    value={housingStatus}
                    onChange={(e) => setHousingStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold cursor-pointer"
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
                    placeholder="e.g. Ration Card, BPL Card"
                    value={existingBenefits}
                    onChange={(e) => setExistingBenefits(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/20 focus:border-gov-blue-500 transition-all font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Controls */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            {step > 1 ? (
              <button
                type="button"
                onClick={handlePrev}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> {localizeTerm("Previous Step", language)}
              </button>
            ) : (
              <div />
            )}

            {step < 5 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
              >
                {localizeTerm("Next Step", language)} <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-gov-blue-500 hover:bg-gov-blue-600 disabled:bg-gov-blue-200 text-white font-extrabold rounded-lg text-xs transition-colors flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> {localizeTerm("Saving Profile...", language)}
                  </>
                ) : (
                  localizeTerm("Create My Data Wallet", language)
                )}
              </button>
            )}
          </div>

        </form>

      </div>
    </div>
  );
}
