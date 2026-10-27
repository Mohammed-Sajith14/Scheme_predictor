import React, { useEffect, useState } from 'react';
import { History, RotateCcw, X, Clock, User, CheckCircle2, AlertCircle } from 'lucide-react';

interface SchemeVersion {
  id: number;
  schemeId: number;
  versionNumber: number;
  changedBy: string;
  changedAt: string;
  changeSummary: string;
  schemeDataJson: string;
}

interface Props {
  schemeId: number;
  isOpen: boolean;
  onClose: () => void;
  onRollbackComplete: () => void;
}

export const VersionHistoryModal: React.FC<Props> = ({
  schemeId,
  isOpen,
  onClose,
  onRollbackComplete,
}) => {
  const [versions, setVersions] = useState<SchemeVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [rollbackLoading, setRollbackLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && schemeId) {
      fetchHistory();
    }
  }, [isOpen, schemeId]);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    const token = localStorage.getItem('schemewise_token');

    try {
      const resp = await fetch(`http://localhost:8080/api/admin/schemes/${schemeId}/versions`, {
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
        },
      });

      if (!resp.ok) {
        throw new Error('Failed to load version history');
      }

      const data = await resp.json();
      setVersions(data);
    } catch (err: any) {
      setError(err.message || 'Could not retrieve scheme version history.');
    } finally {
      setLoading(false);
    }
  };

  const handleRollback = async (versionNumber: number) => {
    if (!window.confirm(`Are you sure you want to rollback this scheme to Version ${versionNumber}?`)) {
      return;
    }

    setRollbackLoading(versionNumber);
    setError(null);
    setMessage(null);
    const token = localStorage.getItem('schemewise_token');

    try {
      const resp = await fetch(
        `http://localhost:8080/api/admin/schemes/${schemeId}/rollback/${versionNumber}`,
        {
          method: 'POST',
          headers: {
            Authorization: token ? `Bearer ${token}` : '',
          },
        }
      );

      if (!resp.ok) {
        throw new Error('Rollback action failed.');
      }

      setMessage(`Scheme successfully restored to Version ${versionNumber}! Saved as a new draft revision.`);
      setTimeout(() => {
        onRollbackComplete();
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Rollback failed.');
    } finally {
      setRollbackLoading(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 space-y-6 shadow-2xl relative my-8">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-indigo-500/20 text-indigo-400 rounded-xl border border-indigo-500/30">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Scheme Version & Rollback Audit History</h2>
              <p className="text-xs text-slate-400">
                Complete history of published configuration snapshots for Scheme ID: #{schemeId}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs font-mono">
            Loading scheme version history...
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-xs">
            No previous version snapshots recorded. Publish this scheme to create its first snapshot version.
          </div>
        ) : (
          <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
            {versions.map((ver) => (
              <div
                key={ver.id}
                className="bg-slate-950/80 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 bg-indigo-500/20 text-indigo-300 font-mono font-bold text-xs rounded-full border border-indigo-500/30">
                      v{ver.versionNumber}
                    </span>
                    <span className="text-xs font-semibold text-white">
                      {ver.changeSummary || 'Published Configuration Snapshot'}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(ver.changedAt).toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      {ver.changedBy || 'Admin'}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleRollback(ver.versionNumber)}
                  disabled={rollbackLoading === ver.versionNumber}
                  className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 transition-colors border border-slate-700"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
                  {rollbackLoading === ver.versionNumber ? 'Restoring...' : 'Roll Back to v' + ver.versionNumber}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
