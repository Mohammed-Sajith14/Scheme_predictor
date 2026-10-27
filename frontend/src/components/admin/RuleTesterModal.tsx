import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, AlertTriangle, RefreshCw, X, ShieldCheck, FileText, ChevronDown, UserCheck } from 'lucide-react';
import type { SchemeRequirementItem } from './RuleBuilder';

interface Props {
  schemeId?: number;
  requirements?: SchemeRequirementItem[];
  isOpen: boolean;
  onClose: () => void;
}

interface RuleEvalItem {
  fieldName: string;
  fieldLabel: string;
  operator: string;
  requiredValue: string;
  actualValue: any;
  satisfied: boolean;
  mandatory: boolean;
  weight: number;
}

interface TestResult {
  coverageScore: number;
  ruleMatchScore: number;
  mlScore: number;
  overallScore: number;
  status: string;
  missingFields: string;
  ruleEvaluations: RuleEvalItem[];
}

export const RuleTesterModal: React.FC<Props> = ({ schemeId: initialSchemeId, requirements: initialRequirements, isOpen, onClose }) => {
  const [schemesList, setSchemesList] = useState<any[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | undefined>(initialSchemeId);
  const [currentScheme, setCurrentScheme] = useState<any>(null);
  const [activeRequirements, setActiveRequirements] = useState<any[]>(initialRequirements || []);

  const [testProfile, setTestProfile] = useState({
    age: '21',
    gender: 'Female',
    state: 'Tamil Nadu',
    income: '180000',
    studentStatus: 'true',
    farmerStatus: 'false',
    landOwnership: 'false',
    landArea: '0',
    disabilityStatus: 'false',
    housingStatus: 'Owned (Pucca)',
    urbanRural: 'Rural',
    employmentStatus: 'Unemployed',
    education: 'Undergraduate',
    occupation: 'Student',
  });

  const [loading, setLoading] = useState(false);
  const [fetchingScheme, setFetchingScheme] = useState(false);
  const [result, setResult] = useState<TestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch all schemes for context selector
  useEffect(() => {
    if (!isOpen) return;
    const fetchAllSchemes = async () => {
      try {
        const token = localStorage.getItem('schemewise_token');
        const res = await fetch('http://localhost:8080/api/admin/schemes?size=50', {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
          const data = await res.json();
          const list = data.content || [];
          setSchemesList(list);
          if (!selectedSchemeId && list.length > 0) {
            setSelectedSchemeId(list[0].id);
          }
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAllSchemes();
  }, [isOpen]);

  // Sync when initialSchemeId changes
  useEffect(() => {
    if (initialSchemeId) {
      setSelectedSchemeId(initialSchemeId);
    }
  }, [initialSchemeId]);

  // Fetch specific scheme details & requirements whenever selectedSchemeId changes
  useEffect(() => {
    if (!isOpen || !selectedSchemeId) return;
    
    const fetchSchemeDetails = async () => {
      setFetchingScheme(true);
      setResult(null);
      setError(null);
      try {
        const token = localStorage.getItem('schemewise_token');
        const res = await fetch(`http://localhost:8080/api/admin/schemes/${selectedSchemeId}`, {
          headers: { Authorization: token ? `Bearer ${token}` : '' }
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentScheme(data);
          setActiveRequirements(data.requirements || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setFetchingScheme(false);
      }
    };

    fetchSchemeDetails();
  }, [selectedSchemeId, isOpen]);

  if (!isOpen) return null;

  const runTest = async () => {
    setLoading(true);
    setError(null);

    const token = localStorage.getItem('schemewise_token');

    const walletPayload = {
      dateOfBirth: testProfile.age ? `${new Date().getFullYear() - parseInt(testProfile.age)}-01-01` : null,
      gender: testProfile.gender,
      state: testProfile.state,
      income: testProfile.income ? parseFloat(testProfile.income) : 0,
      studentStatus: testProfile.studentStatus === 'true',
      farmerStatus: testProfile.farmerStatus === 'true',
      landOwnership: testProfile.landOwnership === 'true',
      landArea: testProfile.landArea ? parseFloat(testProfile.landArea) : 0,
      disabilityStatus: testProfile.disabilityStatus === 'true',
      housingStatus: testProfile.housingStatus,
      urbanRural: testProfile.urbanRural,
      employmentStatus: testProfile.employmentStatus,
      education: testProfile.education,
      occupation: testProfile.occupation,
    };

    try {
      const resp = await fetch('http://localhost:8080/api/admin/schemes/test-rule-detailed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          schemeId: selectedSchemeId,
          requirements: activeRequirements,
          testWallet: walletPayload,
        }),
      });

      if (!resp.ok) {
        throw new Error(`Server returned HTTP ${resp.status}`);
      }

      const data: TestResult = await resp.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Failed to execute rule test');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'HIGHLY_ELIGIBLE':
        return <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full font-semibold text-xs">HIGHLY ELIGIBLE</span>;
      case 'LIKELY_ELIGIBLE':
        return <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-full font-semibold text-xs">LIKELY ELIGIBLE</span>;
      case 'POTENTIAL_MATCH':
        return <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full font-semibold text-xs">POTENTIAL MATCH</span>;
      case 'MORE_INFORMATION_NEEDED':
        return <span className="px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full font-semibold text-xs">INFORMATION NEEDED</span>;
      case 'NOT_ELIGIBLE':
      default:
        return <span className="px-3 py-1 bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full font-semibold text-xs">NOT ELIGIBLE</span>;
    }
  };

  const setPresetProfile = (preset: string) => {
    if (preset === 'student') {
      setTestProfile({
        age: '20', gender: 'Female', state: 'Tamil Nadu', income: '180000',
        studentStatus: 'true', farmerStatus: 'false', landOwnership: 'false', landArea: '0',
        disabilityStatus: 'false', housingStatus: 'Owned (Pucca)', urbanRural: 'Urban',
        employmentStatus: 'Unemployed', education: 'Undergraduate', occupation: 'Student'
      });
    } else if (preset === 'farmer') {
      setTestProfile({
        age: '42', gender: 'Male', state: 'Maharashtra', income: '120000',
        studentStatus: 'false', farmerStatus: 'true', landOwnership: 'true', landArea: '2.5',
        disabilityStatus: 'false', housingStatus: 'Pucca', urbanRural: 'Rural',
        employmentStatus: 'Self-Employed', education: 'Secondary (10th)', occupation: 'Farmer'
      });
    } else if (preset === 'senior') {
      setTestProfile({
        age: '65', gender: 'Male', state: 'Uttar Pradesh', income: '90000',
        studentStatus: 'false', farmerStatus: 'false', landOwnership: 'false', landArea: '0',
        disabilityStatus: 'false', housingStatus: 'Kutcha', urbanRural: 'Rural',
        employmentStatus: 'Unemployed', education: 'Primary', occupation: 'Retired'
      });
    } else if (preset === 'rural_housing') {
      setTestProfile({
        age: '34', gender: 'Female', state: 'Bihar', income: '110000',
        studentStatus: 'false', farmerStatus: 'false', landOwnership: 'false', landArea: '0',
        disabilityStatus: 'false', housingStatus: 'Kutcha', urbanRural: 'Rural',
        employmentStatus: 'Unemployed', education: 'Secondary (10th)', occupation: 'Daily Wage Worker'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-4xl w-full p-6 space-y-6 shadow-2xl relative my-8 text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Dynamic Scheme Rule Tester</h2>
              <p className="text-xs text-slate-400">
                Tests production rules and ML scoring engine against customizable mock citizen profiles.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scheme Context Selector */}
        <div className="bg-slate-800/80 p-4 rounded-2xl border border-indigo-500/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-indigo-400" /> Target Scheme Context
            </label>
            {fetchingScheme && <span className="text-xs text-amber-400 animate-pulse">Loading scheme rules...</span>}
          </div>

          <select
            value={selectedSchemeId || ''}
            onChange={(e) => setSelectedSchemeId(Number(e.target.value))}
            className="w-full bg-slate-900 text-white font-bold text-xs rounded-xl px-4 py-3 border border-slate-700 focus:border-indigo-500 outline-none cursor-pointer"
          >
            {schemesList.map((s) => (
              <option key={s.id} value={s.id}>
                #{s.id} - {s.name} ({s.department || s.category})
              </option>
            ))}
          </select>

          {/* Active Rules Preview Card */}
          <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
              Active Eligibility Rules for {currentScheme ? currentScheme.name : 'Selected Scheme'} ({activeRequirements.length} rules)
            </span>
            {activeRequirements.length === 0 ? (
              <p className="text-xs text-amber-400 font-semibold">No rules configured for this scheme yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {activeRequirements.map((r, i) => (
                  <div key={i} className="p-2 bg-slate-900 rounded-lg border border-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-bold text-indigo-300">{r.fieldLabel || r.fieldName}</span>
                      <span className="text-[10px] text-slate-400 font-mono ml-2">{r.operator} {r.requiredValue}</span>
                    </div>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-black uppercase ${r.mandatory ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-slate-800 text-slate-400'}`}>
                      {r.mandatory ? 'Mandatory' : 'Optional'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
            <UserCheck className="w-3.5 h-3.5 text-slate-400" /> Quick Profile Presets:
          </span>
          <button onClick={() => setPresetProfile('student')} className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-900/40 text-indigo-300 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer">
            🎓 College Student
          </button>
          <button onClick={() => setPresetProfile('farmer')} className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-900/40 text-emerald-300 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer">
            🌾 Small Farmer
          </button>
          <button onClick={() => setPresetProfile('senior')} className="px-2.5 py-1 bg-slate-800 hover:bg-amber-900/40 text-amber-300 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer">
            👴 Senior Citizen
          </button>
          <button onClick={() => setPresetProfile('rural_housing')} className="px-2.5 py-1 bg-slate-800 hover:bg-blue-900/40 text-blue-300 border border-slate-700 rounded-lg text-xs font-semibold cursor-pointer">
            🏠 Rural Kutcha Home
          </button>
        </div>

        {/* Profile Inputs */}
        <div className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700/60 space-y-3">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Mock Citizen Profile Inputs</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Age</label>
              <input
                type="number"
                value={testProfile.age}
                onChange={(e) => setTestProfile({ ...testProfile, age: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Gender</label>
              <select
                value={testProfile.gender}
                onChange={(e) => setTestProfile({ ...testProfile, gender: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="Female">Female</option>
                <option value="Male">Male</option>
                <option value="Transgender">Transgender</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Annual Family Income (₹)</label>
              <input
                type="number"
                value={testProfile.income}
                onChange={(e) => setTestProfile({ ...testProfile, income: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">State</label>
              <input
                type="text"
                value={testProfile.state}
                onChange={(e) => setTestProfile({ ...testProfile, state: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Student Status</label>
              <select
                value={testProfile.studentStatus}
                onChange={(e) => setTestProfile({ ...testProfile, studentStatus: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="true">Yes (Active Student)</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Farmer Status</label>
              <select
                value={testProfile.farmerStatus}
                onChange={(e) => setTestProfile({ ...testProfile, farmerStatus: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="true">Yes (Farmer)</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Land Ownership</label>
              <select
                value={testProfile.landOwnership}
                onChange={(e) => setTestProfile({ ...testProfile, landOwnership: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="true">Yes (Land Owner)</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Land Area (Acres)</label>
              <input
                type="number"
                value={testProfile.landArea}
                onChange={(e) => setTestProfile({ ...testProfile, landArea: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Disability Status</label>
              <select
                value={testProfile.disabilityStatus}
                onChange={(e) => setTestProfile({ ...testProfile, disabilityStatus: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="true">Yes (PWD)</option>
                <option value="false">No</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Location Type</label>
              <select
                value={testProfile.urbanRural}
                onChange={(e) => setTestProfile({ ...testProfile, urbanRural: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="Rural">Rural</option>
                <option value="Urban">Urban</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Housing Structure</label>
              <select
                value={testProfile.housingStatus}
                onChange={(e) => setTestProfile({ ...testProfile, housingStatus: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="Kutcha">Kutcha / Temporary</option>
                <option value="Homeless">Homeless</option>
                <option value="Rent">Rent</option>
                <option value="Pucca">Owned (Pucca)</option>
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-400 mb-1">Education Level</label>
              <select
                value={testProfile.education}
                onChange={(e) => setTestProfile({ ...testProfile, education: e.target.value })}
                className="w-full bg-slate-900 text-white text-xs rounded-lg px-3 py-1.5 border border-slate-700 focus:border-indigo-500 outline-none cursor-pointer"
              >
                <option value="Undergraduate">Undergraduate</option>
                <option value="Postgraduate">Postgraduate</option>
                <option value="Higher Secondary (12th)">Higher Secondary (12th)</option>
                <option value="Secondary (10th)">Secondary (10th)</option>
                <option value="Primary">Primary</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={runTest}
              disabled={loading || activeRequirements.length === 0}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Run Production Eligibility Engine
            </button>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {result && (
          <div className="space-y-4 border-t border-slate-800 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800">
              <div>
                <span className="text-xs text-slate-400 uppercase font-semibold tracking-wider block">Evaluated Result for {currentScheme ? currentScheme.name : 'Scheme'}</span>
                <div className="flex items-center gap-3 mt-1">
                  {getStatusBadge(result.status)}
                  <span className="text-2xl font-black text-white">{Math.round(result.overallScore)}%</span>
                  <span className="text-xs text-slate-400">Overall Score</span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-xs text-slate-300">
                <div className="text-center">
                  <span className="block font-bold text-white text-sm">{Math.round(result.coverageScore)}%</span>
                  <span className="text-[10px] text-slate-400 uppercase">Data Coverage</span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-white text-sm">{Math.round(result.ruleMatchScore)}%</span>
                  <span className="text-[10px] text-slate-400 uppercase">Rule Match</span>
                </div>
                <div className="text-center">
                  <span className="block font-bold text-white text-sm">{Math.round(result.mlScore)}%</span>
                  <span className="text-[10px] text-slate-400 uppercase">ML Prediction</span>
                </div>
              </div>
            </div>

            {/* Rule Evaluations Table */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Scheme Rule Evaluation Breakdown</h4>
              <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-800/80 text-slate-400 uppercase text-[10px]">
                    <tr>
                      <th className="py-2.5 px-4">Scheme Requirement Rule</th>
                      <th className="py-2.5 px-4">Operator</th>
                      <th className="py-2.5 px-4">Required Criteria</th>
                      <th className="py-2.5 px-4">Mock Profile Value</th>
                      <th className="py-2.5 px-4 text-center">Evaluation Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {result.ruleEvaluations.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/40">
                        <td className="py-3 px-4 font-bold text-white">
                          {item.fieldLabel} <span className="text-[10px] text-slate-500 font-mono">({item.fieldName})</span>
                        </td>
                        <td className="py-3 px-4 font-mono text-indigo-300 font-bold">{item.operator}</td>
                        <td className="py-3 px-4 font-mono text-emerald-400 font-bold">{item.requiredValue}</td>
                        <td className="py-3 px-4 font-mono text-slate-300">{String(item.actualValue ?? 'MISSING')}</td>
                        <td className="py-3 px-4 text-center">
                          {item.satisfied ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-xs">
                              <CheckCircle2 className="w-4 h-4" /> Passed Rule
                            </span>
                          ) : item.mandatory ? (
                            <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-xs">
                              <XCircle className="w-4 h-4" /> Violated (Mandatory)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-400 font-bold text-xs">
                              <AlertTriangle className="w-4 h-4" /> Missed (Optional)
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
