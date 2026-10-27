import React, { useEffect, useState, useMemo } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  localizeSchemeName, localizeSchemeDesc, localizeCategory, 
  localizeStatus, localizeTerm, localizeField, localizeOption 
} from '../utils/localizationHelper';
import { ArrowLeft, Bookmark, Calendar, Globe, AlertTriangle, CheckCircle2, MessageSquare, Loader2, Info, RefreshCw, Save } from 'lucide-react';
import { getSchemeImageUrl } from '../utils/imageHelper';

interface SchemeDetailsProps {
  schemeId: number;
  onNavigate: (page: string) => void;
  token: string;
  isLoggedIn: boolean;
  apiUrl: string;
}

type TabType = 'overview' | 'eligibility' | 'application';

export default function SchemeDetails({ schemeId, onNavigate, token, isLoggedIn, apiUrl }: SchemeDetailsProps) {
  const { t, language } = useLanguage();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [savingMissing, setSavingMissing] = useState(false);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState<TabType>('eligibility');
  const [simulatedValues, setSimulatedValues] = useState<Record<string, string>>({});

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const headers: any = {};
      if (isLoggedIn) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const res = await fetch(`${apiUrl}/api/schemes/${schemeId}`, { headers });
      const data = await res.json();
      setDetails(data);

      // Pre-fill simulatedValues with wallet values
      if (data.wallet) {
        const initMap: Record<string, string> = {};
        if (data.requirements) {
          data.requirements.forEach((req: any) => {
            const fn = req.fieldName;
            let val = data.wallet[fn];
            if (val === null || val === undefined || val === '') {
              const lowerKey = Object.keys(data.wallet).find(k => k.toLowerCase() === fn.toLowerCase());
              if (lowerKey) val = data.wallet[lowerKey];
            }
            if ((val === null || val === undefined || val === '') && data.wallet.additionalAttributes) {
              try {
                const extra = JSON.parse(data.wallet.additionalAttributes);
                const extraKey = Object.keys(extra).find(k => k.toLowerCase() === fn.toLowerCase());
                if (extraKey) val = extra[extraKey];
              } catch(e){}
            }
            if (val !== null && val !== undefined && val !== '') {
              initMap[fn] = String(val);
            }
          });
        }
        setSimulatedValues(prev => ({ ...initMap, ...prev }));
      }
    } catch (err) {
      setError("Failed to fetch scheme criteria details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [schemeId, token, isLoggedIn, apiUrl]);

  const handleSaveToggle = async () => {
    if (!isLoggedIn) {
      onNavigate('signup');
      return;
    }
    
    try {
      const endpoint = details.saved 
          ? `${apiUrl}/api/schemes/unsave/${schemeId}` 
          : `${apiUrl}/api/schemes/save/${schemeId}`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (res.ok) {
        setDetails((prev: any) => ({ ...prev, saved: !prev?.saved }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Live evaluation logic based on wallet + simulatedValues
  const liveEval = useMemo(() => {
    if (!details || !details.requirements) {
      return { coverageScore: 100, ruleMatchScore: 100, overallScore: 100, status: "HIGHLY_ELIGIBLE", rows: [], missingCount: 0 };
    }

    const reqs = details.requirements;
    const wallet = details.wallet;
    let presentCount = 0;
    let matchCount = 0;
    let violatedMandatory = false;
    let missingCount = 0;
    const rows: any[] = [];

    reqs.forEach((req: any) => {
      const fieldName = req.fieldName;
      
      // Get value from simulatedValues first, then wallet
      let val: any = simulatedValues[fieldName];
      if (val === undefined || val === null || val === '') {
        if (wallet) {
          val = wallet[fieldName];
          if (val === null || val === undefined || val === '') {
            const lowerKey = Object.keys(wallet).find(k => k.toLowerCase() === fieldName.toLowerCase());
            if (lowerKey) val = wallet[lowerKey];
          }
          if ((val === null || val === undefined || val === '') && wallet.additionalAttributes) {
            try {
              const extra = JSON.parse(wallet.additionalAttributes);
              const extraKey = Object.keys(extra).find(k => k.toLowerCase() === fieldName.toLowerCase());
              if (extraKey) val = extra[extraKey];
            } catch(e){}
          }
        }
      }

      if (fieldName.toLowerCase() === 'age' && (val === null || val === undefined || val === '') && wallet?.dateOfBirth) {
        const dobDate = new Date(wallet.dateOfBirth);
        const diffMs = Date.now() - dobDate.getTime();
        const ageDate = new Date(diffMs);
        val = Math.abs(ageDate.getUTCFullYear() - 1970);
      }

      const isPresent = (val !== null && val !== undefined && val !== '');
      let isMatch = false;

      if (!isPresent) {
        missingCount++;
      } else {
        presentCount++;
        const op = req.operator;
        const reqVal = req.requiredValue;

        try {
          const isBoolLike = (s: any) => {
            if (typeof s === 'boolean') return true;
            const str = String(s).trim().toLowerCase();
            return ['true', 'false', 'yes', 'no', 'y', 'n', '1', '0', 'student', 'enrolled'].includes(str);
          };

          const parseBool = (s: any) => {
            if (typeof s === 'boolean') return s;
            const str = String(s).trim().toLowerCase();
            return ['true', 'yes', 'y', '1', 'student', 'enrolled'].includes(str);
          };

          if (req.dataType === 'BOOLEAN' || (isBoolLike(val) && isBoolLike(reqVal))) {
            isMatch = parseBool(val) === parseBool(reqVal);
          } else if (typeof val === 'number' || (!isNaN(Number(val)) && !isNaN(parseFloat(val)) && isNaN(Number(reqVal)) === false)) {
            const valNum = parseFloat(val);
            const reqNum = parseFloat(reqVal);
            if (op === '<') isMatch = valNum < reqNum;
            else if (op === '>') isMatch = valNum > reqNum;
            else if (op === '<=') isMatch = valNum <= reqNum;
            else if (op === '>=') isMatch = valNum >= reqNum;
            else if (op === '==' || op === 'EQUALS') isMatch = Math.abs(valNum - reqNum) < 0.0001;
            else if (op === '!=') isMatch = Math.abs(valNum - reqNum) >= 0.0001;
          } else {
            const normVal = String(val).toLowerCase().replace(/[^a-z0-9]/g, '');
            const normReq = String(reqVal).toLowerCase().replace(/[^a-z0-9]/g, '');
            if (op === 'IN') {
              const allowed = String(reqVal).split(',').map((x: string) => x.toLowerCase().replace(/[^a-z0-9]/g, ''));
              isMatch = allowed.includes(normVal);
            } else {
              isMatch = normVal === normReq;
            }
          }
        } catch (e) {}

        if (isMatch) {
          matchCount++;
        } else if (req.mandatory === null || req.mandatory === undefined || req.mandatory === true) {
          violatedMandatory = true;
        }
      }

      rows.push({
        req,
        fieldName,
        val: isPresent ? val : null,
        isPresent,
        isMatch,
        status: !isPresent ? "UNKNOWN / MISSING" : isMatch ? "PASS" : "FAIL"
      });
    });

    const totalReq = reqs.length;
    const coverageScore = totalReq > 0 ? (presentCount * 100.0 / totalReq) : 100.0;
    const ruleMatchScore = presentCount > 0 ? (matchCount * 100.0 / presentCount) : 100.0;
    
    let overallScore: number | null = ruleMatchScore;
    let status = "HIGHLY_ELIGIBLE";

    if (violatedMandatory) {
      overallScore = 0;
      status = "NOT_ELIGIBLE";
    } else if (missingCount > 0) {
      status = "INFORMATION_NEEDED";
      overallScore = null;
    } else if (ruleMatchScore >= 80) {
      status = "HIGHLY_ELIGIBLE";
    } else if (ruleMatchScore >= 60) {
      status = "LIKELY_ELIGIBLE";
    } else if (ruleMatchScore >= 40) {
      status = "POTENTIAL_MATCH";
    } else {
      status = "NOT_ELIGIBLE";
      overallScore = 0;
    }

    return {
      coverageScore,
      ruleMatchScore,
      overallScore,
      status,
      rows,
      missingCount
    };
  }, [details, simulatedValues]);

  const handleSaveToWallet = async () => {
    if (!isLoggedIn) {
      onNavigate('signup');
      return;
    }

    setSavingMissing(true);
    const updatedWallet = { ...details.wallet };
    let additionalAttrs: Record<string, any> = {};
    if (updatedWallet.additionalAttributes) {
      try { additionalAttrs = JSON.parse(updatedWallet.additionalAttributes); } catch(e){}
    }

    const standardKeys = [
      'age', 'income', 'gender', 'state', 'district', 'urbanRural', 'occupation',
      'employmentStatus', 'education', 'studentStatus', 'familySize', 'maritalStatus',
      'farmerStatus', 'landOwnership', 'landArea', 'disabilityStatus', 'disabilityPercentage',
      'housingStatus', 'existingBenefits'
    ];

    Object.entries(simulatedValues).forEach(([key, val]) => {
      if (!val) return;
      if (standardKeys.includes(key)) {
        if (key === 'income' || key === 'landArea' || key === 'disabilityPercentage') {
          updatedWallet[key] = parseFloat(val);
        } else if (key === 'age' || key === 'familySize') {
          if (key === 'age') {
            const years = parseInt(val);
            const birthYear = new Date().getFullYear() - years;
            updatedWallet['dateOfBirth'] = `${birthYear}-01-01`;
          } else {
            updatedWallet[key] = parseInt(val);
          }
        } else {
          updatedWallet[key] = val;
        }
      } else {
        additionalAttrs[key] = isNaN(Number(val)) ? val : parseFloat(val);
      }
    });

    updatedWallet.additionalAttributes = JSON.stringify(additionalAttrs);

    try {
      const response = await fetch(`${apiUrl}/api/wallet/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedWallet),
      });

      if (!response.ok) {
        throw new Error("Failed to save answers to profile wallet");
      }

      await fetchDetails();
      alert("Successfully saved inputs to your Data Wallet!");
    } catch (err: any) {
      alert(err.message || "Failed to update profile variables.");
    } finally {
      setSavingMissing(false);
    }
  };

  const handleStartChat = async () => {
    if (!isLoggedIn) {
      onNavigate('signup');
      return;
    }
    
    try {
      const res = await fetch(`${apiUrl}/api/chat/sessions/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          schemeId: schemeId,
          title: `Discussion: ${details.scheme.name}`
        })
      });
      
      if (res.ok) {
        onNavigate('assistant');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-gov-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm font-semibold">Retrieving scheme checklist details...</span>
      </div>
    );
  }

  const s = details.scheme;
  const isSaved = details.saved || false;

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-6xl mx-auto text-left animate-fadeIn">
      
      {/* Top breadcrumb */}
      <div className="flex justify-between items-center">
        <button
          onClick={() => onNavigate('schemes')}
          className="px-3.5 py-2 hover:bg-slate-100 rounded-xl text-xs font-bold text-slate-600 transition-colors flex items-center gap-1 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> <span>{localizeTerm('Back to Schemes', language)}</span>
        </button>
        
        <button
          onClick={handleSaveToggle}
          className={`px-4 py-2 border rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm ${
            isSaved ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Bookmark className="w-4 h-4" /> <span>{isSaved ? localizeTerm('Bookmarked', language) : localizeTerm('Save Scheme', language)}</span>
        </button>
      </div>

      {/* Cover Banner Photo */}
      <div className="w-full h-56 md:h-72 rounded-2xl overflow-hidden relative border border-slate-200 shadow-md">
        <img 
          src={getSchemeImageUrl(s.category, s.name, s.id, s.imageUrl)} 
          alt={s.name} 
          className="w-full h-full object-cover" 
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/30 to-transparent" />
        
        {/* Floating Category Info */}
        <div className="absolute bottom-6 left-6 right-6 text-left flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-gov-blue-500 text-white rounded shadow-sm">
                {s.department}
              </span>
              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-teal-600 text-white rounded shadow-sm">
                {localizeCategory(s.category || 'General', language)}
              </span>
            </div>
            <h1 className="text-xl md:text-3xl font-black text-white font-display tracking-tight leading-tight drop-shadow-sm">{localizeSchemeName(s.name, language)}</h1>
            <div className="flex items-center gap-2 text-xs text-slate-300 font-semibold">
              <span>{localizeTerm('Beneficiary:', language)} {localizeTerm(s.beneficiaryType || 'Universal', language)}</span>
              {s.state && (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                  <span className="text-sky-300 font-bold">{localizeTerm(s.state, language)} {localizeTerm("Only", language)}</span>
                </>
              )}
            </div>
          </div>

          {isLoggedIn && (
            <div className="bg-white/95 backdrop-blur-md p-4 rounded-xl border border-white/20 flex items-center gap-4 shadow-xl self-start md:self-end">
              <div className="text-center">
                <span className="text-2xl font-black font-display leading-none text-gov-blue-600">
                  {liveEval.status === 'NOT_ELIGIBLE' 
                    ? '0%'
                    : liveEval.coverageScore < 100 || liveEval.overallScore === null
                      ? `${Math.round(liveEval.coverageScore)}%` 
                      : `${Math.round(liveEval.overallScore)}%`}
                </span>
                <span className="block text-[8px] text-slate-400 font-black uppercase tracking-wider mt-1">
                  {liveEval.status === 'NOT_ELIGIBLE' 
                    ? localizeTerm('NOT ELIGIBLE', language)
                    : liveEval.coverageScore < 100 
                      ? localizeTerm('Information Coverage', language) 
                      : localizeTerm('Eligibility Score', language)}
                </span>
              </div>
              <div className="border-l border-slate-200 pl-4 text-left">
                <span className="block text-xs font-black text-slate-800 uppercase leading-none">
                  {localizeStatus(liveEval.status, language)}
                </span>
                <span className="text-[8px] text-slate-400 block mt-1 leading-normal">
                  {liveEval.status === 'NOT_ELIGIBLE' 
                    ? localizeTerm('Mandatory criteria unmatched', language) 
                    : liveEval.coverageScore < 100 
                      ? localizeTerm('Inputs required for evaluation', language) 
                      : localizeTerm('Verified against Data Wallet', language)}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Information Coverage & Dynamic Interactive Testing Section */}
      {isLoggedIn && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-gov-blue-900 text-sm font-display flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-gov-blue-600" />
                {localizeTerm('Scheme Requirements & Interactive Eligibility Check', language)}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {localizeTerm('Test different inputs live', language)}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{localizeTerm("Coverage", language)}</span>
                <span className="text-lg font-black text-gov-blue-900 font-display">{Math.round(liveEval.coverageScore)}%</span>
              </div>
              <div className="w-12 h-12 rounded-full border-4 border-gov-blue-500/20 border-t-gov-blue-500 flex items-center justify-center font-black text-xs text-gov-blue-900">
                {Math.round(liveEval.coverageScore)}%
              </div>
            </div>
          </div>

          {/* Information Coverage Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-bold text-slate-700">
              <span>{localizeTerm('Information Coverage:', language)} {Math.round(liveEval.coverageScore)}%</span>
              <span className="text-amber-600 font-extrabold">{localizeTerm('Remaining Information:', language)} {Math.max(0, 100 - Math.round(liveEval.coverageScore))}%</span>
            </div>
            <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-gov-blue-500 to-sky-400 rounded-full transition-all duration-500" 
                style={{ width: `${liveEval.coverageScore}%` }} 
              />
            </div>
          </div>

          {/* Interactive Input Testing Panel */}
          <div className="p-5 bg-sky-50/60 rounded-2xl border border-sky-200/80 space-y-4 text-left">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-gov-blue-600 animate-spin-slow" />
                <h4 className="text-xs font-black uppercase tracking-wider text-gov-blue-950">
                  {localizeTerm('Interactive Scheme Attribute Tester', language)}
                </h4>
              </div>
              <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-2 py-0.5 rounded-md">
                {localizeTerm('Live Simulation (Instant Check)', language)}
              </span>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Enter or modify attributes below (e.g., enter <strong>79%</strong> vs <strong>85%</strong> for 12th Board Exam Percentile) to test eligibility. You can change and re-test as many times as you like!
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {details.requirements?.map((req: any) => {
                const fieldKey = req.fieldName;
                const label = req.fieldLabel || fieldKey.replace(/([A-Z])/g, ' $1');
                const unit = req.unit || '';
                const options = req.optionsCsv ? req.optionsCsv.split(',').map((o: string) => o.trim()) : null;
                const currentValue = simulatedValues[fieldKey] !== undefined ? simulatedValues[fieldKey] : '';

                return (
                  <div key={fieldKey} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-1.5">
                    <div className="flex justify-between items-center">
                      <label className="block text-xs font-extrabold text-slate-800 capitalize">
                        {localizeField(label, language)} {unit && <span className="text-[10px] text-slate-400">({unit})</span>}
                      </label>
                      <span className="text-[10px] font-bold text-slate-400">Req: {req.operator} {req.requiredValue}</span>
                    </div>
                    
                    {req.questionText && <p className="text-[11px] text-slate-500 font-medium leading-snug">{req.questionText}</p>}

                    {options ? (
                      <select
                        value={currentValue}
                        onChange={(e) => setSimulatedValues(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-gov-blue-500"
                      >
                        <option value="">Select option...</option>
                        {options.map((opt: string) => (
                          <option key={opt} value={opt}>{localizeOption(opt, language)}</option>
                        ))}
                      </select>
                    ) : req.dataType === 'BOOLEAN' ? (
                      <select
                        value={currentValue}
                        onChange={(e) => setSimulatedValues(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-gov-blue-500"
                      >
                        <option value="">Select option...</option>
                        <option value="Yes">{localizeOption("Yes", language)}</option>
                        <option value="No">{localizeOption("No", language)}</option>
                      </select>
                    ) : (
                      <input
                        type={req.dataType === 'NUMBER' || req.dataType === 'DECIMAL' || fieldKey.toLowerCase().includes('percentile') || fieldKey.toLowerCase().includes('income') ? 'number' : 'text'}
                        step="any"
                        placeholder={`Enter ${localizeField(label, language)}...`}
                        value={currentValue}
                        onChange={(e) => setSimulatedValues(prev => ({ ...prev, [fieldKey]: e.target.value }))}
                        className="w-full mt-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:bg-white focus:border-gov-blue-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-sky-200/80">
              <span className="text-xs font-bold text-slate-600">
                Live Status: <span className="font-extrabold text-gov-blue-900">{localizeStatus(liveEval.status, language)}</span> ({liveEval.overallScore !== null ? `${Math.round(liveEval.overallScore)}% Score` : 'Inputs Required'})
              </span>
              
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // Trigger live recalculation re-render
                    setSimulatedValues(prev => ({ ...prev }));
                  }}
                  className="px-5 py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{localizeTerm('Check Eligibility', language)}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveToWallet}
                  disabled={savingMissing}
                  title="Set as permanent Data Wallet profile values to update Dashboard eligibility"
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-extrabold rounded-xl text-xs shadow-md transition-all flex items-center gap-2 cursor-pointer"
                >
                  {savingMissing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  <span>{localizeTerm('Set', language)}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs list */}
      <div className="flex gap-2 border-b border-slate-200">
        {[
          { id: 'overview', label: localizeTerm('Scheme Overview', language) },
          { id: 'eligibility', label: localizeTerm('Eligibility Metrics', language) },
          { id: 'application', label: localizeTerm('Application Process', language) }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as TabType)}
            className={`px-4 py-2 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === tab.id 
                ? 'border-gov-blue-500 text-gov-blue-900' 
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Layout Columns */}
      <div className="grid md:grid-cols-3 gap-8">
        
        {/* Main tabs details container */}
        <div className="md:col-span-2 space-y-6">
          
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-gov-blue-900 font-display text-sm">{localizeTerm("Program Guidelines", language)}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{localizeSchemeDesc(s.description, s.name, language)}</p>
              </div>

              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <h3 className="font-extrabold text-gov-blue-900 font-display text-sm">{localizeTerm("Welfare Benefits Offered", language)}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{s.benefits}</p>
              </div>
            </div>
          )}

          {activeTab === 'eligibility' && (
            <div className="space-y-6">
              {/* Criteria Validation Checklist */}
              {isLoggedIn && details.requirements && details.requirements.length > 0 ? (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-extrabold text-gov-blue-900 font-display text-sm">{localizeTerm("Criteria Validation Checklist", language)}</h3>
                    <span className="text-[10px] font-extrabold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                      {liveEval.rows.filter((r: any) => r.isMatch).length} / {liveEval.rows.length} {localizeTerm("Criteria Passed", language)}
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] uppercase font-black text-slate-400">
                          <th className="pb-3 px-2">{localizeTerm("Credential", language)}</th>
                          <th className="pb-3 px-2">{localizeTerm("Required Value", language)}</th>
                          <th className="pb-3 px-2">{localizeTerm("Evaluated Data", language)}</th>
                          <th className="pb-3 px-2">{localizeTerm("Status", language)}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {liveEval.rows.map((row: any) => {
                          const req = row.req;
                          let requiredValText = `${req.operator} ${req.requiredValue}`;
                          if (req.operator === '==') requiredValText = req.requiredValue;
                          
                          let statusClass = "bg-amber-50 text-amber-800 border-amber-200 font-extrabold";
                          if (row.status === 'PASS') {
                            statusClass = "bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold";
                          } else if (row.status === 'FAIL') {
                            statusClass = "bg-rose-50 text-rose-800 border-rose-200 font-extrabold";
                          }

                          return (
                            <tr key={req.id} className="border-b border-slate-100 text-xs hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-2 font-bold text-slate-700 capitalize">{req.fieldLabel || row.fieldName.replace(/([A-Z])/g, ' $1')}</td>
                              <td className="py-3 px-2 text-slate-500 font-semibold">{requiredValText}</td>
                              <td className="py-3 px-2 text-slate-800 font-bold">{row.val !== null && row.val !== undefined && row.val !== '' ? row.val.toString() : '—'}</td>
                              <td className="py-3 px-2">
                                <span className={`px-2 py-0.5 border rounded-lg text-[9px] ${statusClass}`}>
                                  {localizeTerm(row.status, language)}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center py-8">
                  <Info className="w-6 h-6 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">{localizeTerm("Sign in to cross-evaluate rules against your variables.", language)}</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'application' && (
            <div className="space-y-6">
              
              {/* Registration & Application Header Card */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-extrabold text-gov-blue-900 font-display text-sm flex items-center gap-2">
                    <Globe className="w-5 h-5 text-gov-blue-600" />
                    {localizeTerm("Official Registration & Submission Guide", language)}
                  </h3>
                  <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-gov-blue-50 text-gov-blue-700 border border-gov-blue-200 rounded-md">
                    {localizeTerm("Direct Official Portal", language)}
                  </span>
                </div>
                
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {s.applicationProcess || "Applicants must complete online registration on the official government portal, submit verified identity documents, and obtain institution/department verification."}
                </p>

                {s.officialUrl && (
                  <div className="pt-2">
                    <a
                      href={s.officialUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gov-blue-600 hover:bg-gov-blue-700 text-white font-extrabold rounded-xl text-xs shadow-md transition-all cursor-pointer"
                    >
                      <Globe className="w-4 h-4" />
                      <span>{localizeTerm("Proceed to Official Registration Portal", language)} ({s.department})</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Step-by-Step Registration & Application Timeline */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5 text-left">
                <h3 className="font-extrabold text-gov-blue-900 font-display text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  {localizeTerm("Step-by-Step Registration & Application Roadmap", language)}
                </h3>

                <div className="space-y-4 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                  {details.steps && details.steps.length > 0 ? (
                    details.steps.map((st: any, idx: number) => (
                      <div key={st.id || idx} className="relative flex items-start gap-4 pl-1">
                        <div className="w-8 h-8 rounded-full bg-gov-blue-600 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-md z-10 flex-shrink-0">
                          {st.stepNumber || idx + 1}
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1 space-y-1">
                          <h4 className="text-xs font-black text-slate-900">{st.title}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">{st.description}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="relative flex items-start gap-4 pl-1">
                        <div className="w-8 h-8 rounded-full bg-gov-blue-600 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-md z-10 flex-shrink-0">
                          1
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1 space-y-1">
                          <h4 className="text-xs font-black text-slate-900">{localizeTerm("One-Time Registration on Portal", language)}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {localizeTerm("One-Time Reg desc", language)}
                          </p>
                        </div>
                      </div>

                      <div className="relative flex items-start gap-4 pl-1">
                        <div className="w-8 h-8 rounded-full bg-gov-blue-600 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-md z-10 flex-shrink-0">
                          2
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1 space-y-1">
                          <h4 className="text-xs font-black text-slate-900">{localizeTerm("Upload Credentials & Documents", language)}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {localizeTerm("Upload Cred desc", language)}
                          </p>
                        </div>
                      </div>

                      <div className="relative flex items-start gap-4 pl-1">
                        <div className="w-8 h-8 rounded-full bg-gov-blue-600 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-md z-10 flex-shrink-0">
                          3
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1 space-y-1">
                          <h4 className="text-xs font-black text-slate-900">{localizeTerm("Institution / Nodal Officer Verification", language)}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {localizeTerm("Inst Verif desc", language)}
                          </p>
                        </div>
                      </div>

                      <div className="relative flex items-start gap-4 pl-1">
                        <div className="w-8 h-8 rounded-full bg-gov-blue-600 text-white font-black text-xs flex items-center justify-center border-2 border-white shadow-md z-10 flex-shrink-0">
                          4
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex-1 space-y-1">
                          <h4 className="text-xs font-black text-slate-900">{localizeTerm("Direct Benefit Transfer (DBT) Disbursement", language)}</h4>
                          <p className="text-xs text-slate-600 leading-relaxed">
                            {localizeTerm("DBT desc", language)}
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Pre-Registration Document Preparation Checklist */}
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-left">
                <h3 className="font-extrabold text-gov-blue-900 font-display text-sm">{localizeTerm("Prerequisites & Document Checklist", language)}</h3>
                <p className="text-xs text-slate-500">{localizeTerm("Ensure soft copies", language)}</p>
                <div className="p-4 bg-amber-50/60 rounded-xl border border-amber-200 text-xs font-semibold text-amber-900 leading-relaxed">
                  {s.requiredDocuments ? s.requiredDocuments : localizeTerm('Prereq desc', language)}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Action Panel Side Column */}
        <div className="space-y-6">
          
          {/* Ask AI Agent */}
          <button
            onClick={handleStartChat}
            className="w-full py-4 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-extrabold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer shadow-gov-blue-500/10"
          >
            <MessageSquare className="w-4 h-4" />
            <span>{localizeTerm("Consult AI Scheme Assistant", language)}</span>
          </button>

          {/* Guidelines resources */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-extrabold text-gov-blue-900 font-display text-xs">{localizeTerm("Official Registry Assets", language)}</h3>
            
            <div className="space-y-1.5 text-xs text-slate-600">
              <span className="block font-bold">{localizeTerm("Required Documents Checklist:", language)}</span>
              <p className="leading-relaxed text-[11px]">{s.requiredDocuments || 'Aadhaar Card, Smart Ration Card, Income verification slips'}</p>
            </div>

            {s.deadline && (
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-3 border-t border-slate-100">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span className="font-semibold">{localizeTerm("Closing Date:", language)} {new Date(s.deadline).toLocaleDateString()}</span>
              </div>
            )}

            {s.officialUrl && (
              <a
                href={s.officialUrl}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Globe className="w-3.5 h-3.5" /> <span>{localizeTerm("Visit Official Registry Portal", language)}</span>
              </a>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
