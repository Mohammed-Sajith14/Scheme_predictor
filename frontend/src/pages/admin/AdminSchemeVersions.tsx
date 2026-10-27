import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Eye, ArrowLeft, ArrowRight, ShieldAlert, CheckCircle2, Clock, User, Sparkles, Layers } from 'lucide-react';

interface AdminSchemeVersionsProps {
  schemeId: number;
  token: string;
  apiUrl: string;
  onNavigate: (page: string, params?: any) => void;
}

export default function AdminSchemeVersions({ schemeId, token, apiUrl, onNavigate }: AdminSchemeVersionsProps) {
  const [versions, setVersions] = useState<any[]>([]);
  const [scheme, setScheme] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState<any>(null);
  const [compareVersion, setCompareVersion] = useState<any>(null);
  const [rollbackModalVer, setRollbackModalVer] = useState<number | null>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchSchemeAndVersions();
  }, [schemeId, token, apiUrl]);

  const fetchSchemeAndVersions = async () => {
    setLoading(true);
    try {
      const sRes = await fetch(`${apiUrl}/api/admin/schemes/${schemeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (sRes.ok) {
        const sData = await sRes.json();
        setScheme(sData);
      }

      const vRes = await fetch(`${apiUrl}/api/admin/schemes/${schemeId}/versions`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (vRes.ok) {
        const vData = await vRes.json();
        setVersions(vData || []);
        if (vData && vData.length > 0) {
          setSelectedVersion(vData[0]);
          if (vData.length > 1) {
            setCompareVersion(vData[1]);
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch scheme version history", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (versionNumber: number) => {
    setRollbackLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${apiUrl}/api/admin/schemes/${schemeId}/rollback/${versionNumber}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (res.ok) {
        setMessage(`Successfully rolled back to Version ${versionNumber}. A new version snapshot was appended.`);
        setRollbackModalVer(null);
        await fetchSchemeAndVersions();
      } else {
        const err = await res.json();
        setMessage(`Rollback failed: ${err.message || 'Error occurred'}`);
      }
    } catch (err: any) {
      setMessage(`Rollback failed: ${err.message}`);
    } finally {
      setRollbackLoading(false);
    }
  };

  const parseSnapshot = (jsonStr: string) => {
    if (!jsonStr) return null;
    try {
      return JSON.parse(jsonStr);
    } catch (e) {
      return null;
    }
  };

  const currentSnapshot = selectedVersion ? parseSnapshot(selectedVersion.schemeDataJson) : null;
  const previousSnapshot = compareVersion ? parseSnapshot(compareVersion.schemeDataJson) : null;

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <History className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 font-display">Scheme Version History</h1>
          </div>
          <p className="text-xs text-slate-500 font-semibold">
            {scheme ? scheme.name : 'Loading scheme...'} — Complete snapshot audit timeline and rollback operations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('admin-schemes')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" /> All Schemes
          </button>
        </div>
      </div>

      {message && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs rounded-2xl flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Version Timeline List (4 cols) */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" /> Published Timeline
            </h3>
            <span className="text-[10px] font-bold text-slate-400 uppercase">{versions.length} Snapshots</span>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">Loading version history...</div>
          ) : versions.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">No version snapshots created yet. Publishing this scheme will generate Version 1.</div>
          ) : (
            <div className="space-y-3">
              {versions.map((ver) => {
                const isSelected = selectedVersion?.id === ver.id;
                const isCompare = compareVersion?.id === ver.id;
                return (
                  <div
                    key={ver.id}
                    className={`p-4 rounded-2xl border transition-all cursor-pointer space-y-2 ${
                      isSelected ? 'bg-indigo-50/70 border-indigo-500 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                    onClick={() => setSelectedVersion(ver)}
                  >
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-black text-slate-900 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-indigo-600" /> Version {ver.versionNumber}
                      </span>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded">
                        {ver.changedAt ? new Date(ver.changedAt).toLocaleDateString() : 'Recent'}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-600 font-medium line-clamp-2">
                      {ver.changeSummary || "Published version snapshot."}
                    </p>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold pt-1">
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> {ver.changedBy || 'Admin'}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setCompareVersion(ver); }}
                          className={`hover:underline ${isCompare ? 'text-indigo-600 font-black' : 'text-slate-500'}`}
                        >
                          {isCompare ? 'Comparing' : 'Compare'}
                        </button>
                        
                        {ver.versionNumber < (scheme?.version || 1) && (
                          <button
                            onClick={(e) => { e.stopPropagation(); setRollbackModalVer(ver.versionNumber); }}
                            className="text-indigo-600 font-extrabold hover:text-indigo-900"
                          >
                            Rollback
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Snapshot & Comparison Details (8 cols) */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-black text-slate-900 font-display">
                Version Comparison & Diff Analysis
              </h3>
              <p className="text-xs text-slate-500 font-semibold">
                Comparing Version {selectedVersion?.versionNumber || 1} against {compareVersion ? `Version ${compareVersion.versionNumber}` : 'Base'}
              </p>
            </div>

            {selectedVersion && (
              <span className="text-xs font-bold bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full">
                Active View: Version {selectedVersion.versionNumber}
              </span>
            )}
          </div>

          {!currentSnapshot ? (
            <div className="py-20 text-center text-xs text-slate-400 font-semibold">
              Select a version from the timeline on the left to view full snapshot details.
            </div>
          ) : (
            <div className="space-y-6">
              
              {/* Diff Highlights Card */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Field Changes (Diff Output)</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-slate-500 block">Version {selectedVersion?.versionNumber} Details</span>
                    <div className="text-xs space-y-1.5 font-semibold text-slate-800">
                      <div><strong className="text-slate-400 uppercase text-[10px] block">Scheme Name</strong> {currentSnapshot.name}</div>
                      <div><strong className="text-slate-400 uppercase text-[10px] block">Category / Department</strong> {currentSnapshot.category} — {currentSnapshot.department}</div>
                      <div><strong className="text-slate-400 uppercase text-[10px] block">Official Status</strong> <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">{currentSnapshot.status}</span></div>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-slate-500 block">
                      {compareVersion ? `Comparing Version ${compareVersion.versionNumber}` : 'Previous Baseline'}
                    </span>
                    {previousSnapshot ? (
                      <div className="text-xs space-y-1.5 font-semibold text-slate-800">
                        <div><strong className="text-slate-400 uppercase text-[10px] block">Scheme Name</strong> {previousSnapshot.name}</div>
                        <div><strong className="text-slate-400 uppercase text-[10px] block">Category / Department</strong> {previousSnapshot.category} — {previousSnapshot.department}</div>
                        <div><strong className="text-slate-400 uppercase text-[10px] block">Official Status</strong> <span className="bg-slate-200 text-slate-800 text-[10px] font-bold px-2 py-0.5 rounded">{previousSnapshot.status}</span></div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 py-4">No secondary compare version selected.</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Eligibility Requirements Snapshot */}
              <div className="space-y-3">
                <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">Eligibility Requirements Snapshot</span>
                <div className="space-y-2">
                  {currentSnapshot.requirements && currentSnapshot.requirements.length > 0 ? (
                    currentSnapshot.requirements.map((r: any, idx: number) => (
                      <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs flex justify-between items-center font-bold text-slate-800">
                        <span>{r.fieldName} {r.operator} {r.requiredValue}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">
                          {r.mandatory ? 'Mandatory' : 'Optional'} (Weight: {r.weight})
                        </span>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-400">No explicit rule definitions found in snapshot.</div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Rollback Confirmation Modal */}
      {rollbackModalVer !== null && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-4 text-left animate-fadeIn">
            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900 font-display">Confirm Scheme Rollback</h3>
              <p className="text-xs text-slate-500 font-semibold leading-relaxed">
                You are restoring the scheme state from <strong>Version {rollbackModalVer}</strong>.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-medium leading-relaxed">
              <strong>Non-Destructive Guarantee:</strong> Existing version history will NOT be deleted or overwritten. A new version <strong>Version {(scheme?.version || 1) + 1}</strong> will be appended with the restored snapshot data.
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRollbackModalVer(null)}
                className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rollbackLoading}
                onClick={() => handleRollback(rollbackModalVer)}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white font-extrabold rounded-xl text-xs shadow-sm"
              >
                {rollbackLoading ? "Restoring..." : `Rollback to v${rollbackModalVer}`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
