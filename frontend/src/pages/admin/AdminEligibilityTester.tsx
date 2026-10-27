import React, { useState, useEffect, useMemo } from 'react';
import { Sliders, CheckCircle2, XCircle, AlertTriangle, Play, Sparkles, User, RefreshCw, ShieldCheck, Layers, Info } from 'lucide-react';

interface AdminEligibilityTesterProps {
  token: string;
  apiUrl: string;
  onNavigate: (page: string, params?: any) => void;
}

export default function AdminEligibilityTester({ token, apiUrl, onNavigate }: AdminEligibilityTesterProps) {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | null>(null);
  const [schemeDetails, setSchemeDetails] = useState<any>(null);
  const [loadingSchemes, setLoadingSchemes] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Dynamic test values for the selected scheme's requirements
  const [testValues, setTestValues] = useState<Record<string, string>>({});
  const [missingToggles, setMissingToggles] = useState<Record<string, boolean>>({});

  const [evaluating, setEvaluating] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // 1. Fetch all schemes for dropdown
  useEffect(() => {
    const fetchSchemes = async () => {
      try {
        const res = await fetch(`${apiUrl}/api/admin/schemes?size=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          const content = data.content || [];
          setSchemes(content);
          if (content.length > 0) {
            setSelectedSchemeId(content[0].id);
          }
        }
      } catch (err) {
        console.error("Failed to load schemes for eligibility tester", err);
      } finally {
        setLoadingSchemes(false);
      }
    };
    fetchSchemes();
  }, [apiUrl, token]);

  // 2. Fetch scheme-specific details & requirements when selected scheme changes
  useEffect(() => {
    if (!selectedSchemeId) return;
    const fetchSchemeDetails = async () => {
      setLoadingDetails(true);
      setTestResult(null);
      try {
        const res = await fetch(`${apiUrl}/api/admin/schemes/${selectedSchemeId}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSchemeDetails(data);

          // Populate default test values based on requirements
          const initialValues: Record<string, string> = {};
          const initialMissing: Record<string, boolean> = {};

          if (data.requirements && data.requirements.length > 0) {
            data.requirements.forEach((req: any) => {
              const fn = req.fieldName;
              let defaultVal = req.requiredValue || '';
              if (req.dataType === 'BOOLEAN') {
                defaultVal = 'Yes';
              } else if (req.optionsCsv) {
                const opts = req.optionsCsv.split(',').map((x: string) => x.trim());
                if (opts.length > 0) defaultVal = opts[0];
              }
              initialValues[fn] = defaultVal;
              initialMissing[fn] = false;
            });
          }
          setTestValues(initialValues);
          setMissingToggles(initialMissing);
        }
      } catch (err) {
        console.error("Failed to fetch scheme details", err);
      } finally {
        setLoadingDetails(false);
      }
    };
    fetchSchemeDetails();
  }, [selectedSchemeId, apiUrl, token]);

  const handleToggleMissing = (field: string) => {
    setMissingToggles(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Live evaluation logic for Admin Diagnostic mode
  const liveAdminEval = useMemo(() => {
    if (!schemeDetails || !schemeDetails.requirements) {
      return { coverageScore: 100, ruleMatchScore: 100, overallScore: 100, status: "HIGHLY_ELIGIBLE", rows: [] };
    }

    const reqs = schemeDetails.requirements;
    let presentCount = 0;
    let matchCount = 0;
    let violatedMandatory = false;
    let missingCount = 0;
    const rows: any[] = [];

    reqs.forEach((req: any) => {
      const fieldName = req.fieldName;
      const isSimulatedMissing = !!missingToggles[fieldName];
      const val = testValues[fieldName];

      const isPresent = !isSimulatedMissing && val !== undefined && val !== null && val.trim() !== '';
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
  }, [schemeDetails, testValues, missingToggles]);

  const activeScheme = schemes.find(s => s.id === selectedSchemeId);
  const activeReqs = schemeDetails?.requirements || [];

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900 text-white p-6 rounded-3xl border border-slate-800 shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 rounded-xl">
              <Sliders className="w-5 h-5" />
            </span>
            <h1 className="text-xl md:text-2xl font-black font-display text-white tracking-tight">Admin Scheme Rule Diagnostic Engine</h1>
            <span className="px-2.5 py-0.5 bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 text-[10px] font-black uppercase rounded-md tracking-wider">
              Scheme-Specific Rule Mode
            </span>
          </div>
          <p className="text-xs text-slate-400 font-medium">
            Diagnose and test the production rule evaluation logic for any selected scheme prior to publishing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('admin-schemes')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl text-xs border border-slate-700 transition-colors cursor-pointer"
          >
            ← Back to Schemes
          </button>
        </div>
      </div>

      {/* Main Diagnostic Workspace: Left Input Simulation / Right Diagnostic Result */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Scheme-Specific Requirement Inputs (5 cols) */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-5">
          
          <div className="space-y-1.5">
            <label className="block text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Select Target Scheme</label>
            <select
              disabled={loadingSchemes}
              value={selectedSchemeId || ''}
              onChange={(e) => setSelectedSchemeId(Number(e.target.value))}
              className="w-full p-3 bg-slate-50 border border-slate-300 rounded-2xl text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {schemes.map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.department || s.category || 'General'})
                </option>
              ))}
            </select>
          </div>

          <div className="border-t border-slate-100 pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-indigo-600" /> Active Scheme Requirements ({activeReqs.length})
              </span>
              <span className="text-[10px] text-slate-400 font-semibold">Toggle ⚠ to simulate missing data</span>
            </div>

            {loadingDetails ? (
              <div className="py-12 text-center text-xs text-slate-400 font-semibold flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-indigo-500" /> Loading scheme requirements...
              </div>
            ) : activeReqs.length === 0 ? (
              <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-800">
                No specific rules defined for this scheme yet. Add rules in the Scheme Editor.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto custom-scrollbar pr-1">
                {activeReqs.map((req: any) => {
                  const fieldKey = req.fieldName;
                  const label = req.fieldLabel || fieldKey.replace(/([A-Z])/g, ' $1');
                  const unit = req.unit || '';
                  const options = req.optionsCsv ? req.optionsCsv.split(',').map((o: string) => o.trim()) : null;
                  const isMissing = !!missingToggles[fieldKey];
                  const val = testValues[fieldKey] !== undefined ? testValues[fieldKey] : '';

                  return (
                    <div key={req.id || fieldKey} className={`p-3.5 rounded-2xl border transition-all ${isMissing ? 'bg-amber-50/70 border-amber-200' : 'bg-slate-50 border-slate-200'}`}>
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <div className="flex flex-col">
                          <label className="font-extrabold text-slate-800 capitalize">{label}</label>
                          <span className="text-[10px] font-bold text-indigo-600">Rule: {req.operator} {req.requiredValue} {unit && `(${unit})`}</span>
                        </div>
                        <button 
                          type="button"
                          onClick={() => handleToggleMissing(fieldKey)}
                          className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold cursor-pointer transition-colors ${
                            isMissing ? 'bg-amber-200 text-amber-900 border border-amber-300' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {isMissing ? '⚠ Simulated Missing' : 'Simulate Missing'}
                        </button>
                      </div>

                      {!isMissing && (
                        options ? (
                          <select
                            value={val}
                            onChange={(e) => setTestValues({ ...testValues, [fieldKey]: e.target.value })}
                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                          >
                            {options.map((opt: string) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : req.dataType === 'BOOLEAN' ? (
                          <select
                            value={val}
                            onChange={(e) => setTestValues({ ...testValues, [fieldKey]: e.target.value })}
                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                          >
                            <option value="Yes">Yes (True)</option>
                            <option value="No">No (False)</option>
                          </select>
                        ) : (
                          <input
                            type={req.dataType === 'NUMBER' || req.dataType === 'DECIMAL' || fieldKey.toLowerCase().includes('percentile') || fieldKey.toLowerCase().includes('income') ? 'number' : 'text'}
                            step="any"
                            value={val}
                            onChange={(e) => setTestValues({ ...testValues, [fieldKey]: e.target.value })}
                            className="w-full mt-1 p-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                          />
                        )
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <button
              onClick={() => {
                // Re-evaluate live state
                setTestValues(prev => ({ ...prev }));
              }}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-2xl shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <Play className="w-4 h-4" />
              <span>Run Rule Evaluation Diagnostic</span>
            </button>

          </div>

        </div>

        {/* Right Column: Diagnostic Result Output (7 cols) */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-6">
          
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-black text-slate-900 font-display">Diagnostic Evaluation Output</h3>
                <p className="text-xs text-slate-500 font-semibold">{activeScheme ? activeScheme.name : 'Select a scheme'}</p>
              </div>
              <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1 rounded-full uppercase tracking-wide">
                Admin Diagnostic Mode
              </span>
            </div>

            <div className="space-y-6">
              
              {/* Rule Evaluation Checklist */}
              <div className="space-y-2">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Scheme Rules Evaluation Table</span>
                
                <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase font-black text-slate-400">
                      <tr>
                        <th className="py-3 px-3">Requirement</th>
                        <th className="py-3 px-3">Target Condition</th>
                        <th className="py-3 px-3">Evaluated Data</th>
                        <th className="py-3 px-3">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {liveAdminEval.rows.map((row: any) => {
                        const req = row.req;
                        let statusClass = "bg-amber-50 text-amber-800 border-amber-200 font-extrabold";
                        if (row.status === 'PASS') {
                          statusClass = "bg-emerald-50 text-emerald-800 border-emerald-200 font-extrabold";
                        } else if (row.status === 'FAIL') {
                          statusClass = "bg-rose-50 text-rose-800 border-rose-200 font-extrabold";
                        }

                        return (
                          <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-3 px-3 font-bold text-slate-800 capitalize">{req.fieldLabel || row.fieldName}</td>
                            <td className="py-3 px-3 text-slate-500 font-semibold">{req.operator} {req.requiredValue}</td>
                            <td className="py-3 px-3 font-bold text-slate-900">{row.val !== null && row.val !== undefined && row.val !== '' ? row.val.toString() : '—'}</td>
                            <td className="py-3 px-3">
                              <span className={`px-2 py-0.5 border rounded-lg text-[9px] ${statusClass}`}>
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Score Breakdown Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Data Coverage</span>
                  <span className="text-lg font-black text-slate-800">{Math.round(liveAdminEval.coverageScore)}%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Rule Match</span>
                  <span className="text-lg font-black text-slate-800">{Math.round(liveAdminEval.ruleMatchScore)}%</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Evaluation Weights</span>
                  <span className="text-lg font-black text-slate-800">100% Heuristic</span>
                </div>
                <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <span className="text-[10px] font-bold text-indigo-500 uppercase block">Overall Score</span>
                  <span className="text-lg font-black text-indigo-700">
                    {liveAdminEval.overallScore !== null ? `${Math.round(liveAdminEval.overallScore)}%` : 'Inputs Needed'}
                  </span>
                </div>
              </div>

              {/* Status Badge Output */}
              <div className="p-4 rounded-2xl border flex items-center justify-between bg-slate-900 text-white shadow-md">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Calculated Result Status</span>
                  <span className="text-lg font-black font-display text-sky-300">
                    {liveAdminEval.status.replace(/_/g, ' ')}
                  </span>
                </div>

                <div className="text-right">
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                    liveAdminEval.status === 'HIGHLY_ELIGIBLE' ? 'bg-emerald-500 text-white' :
                    liveAdminEval.status === 'LIKELY_ELIGIBLE' ? 'bg-blue-500 text-white' :
                    liveAdminEval.status === 'INFORMATION_NEEDED' ? 'bg-amber-500 text-white' :
                    'bg-red-500 text-white'
                  }`}>
                    {liveAdminEval.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

            </div>

          </div>

          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
            <strong>Admin Diagnostic Note:</strong> The rule evaluation engine evaluates scheme-specific parameters in real-time. Missing parameters yield <code>INFORMATION_NEEDED</code>, while mandatory condition failures yield <code>NOT_ELIGIBLE</code>.
          </div>

        </div>

      </div>

    </div>
  );
}
