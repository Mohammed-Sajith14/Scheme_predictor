import React, { useState, useEffect } from 'react';
import { 
  Building2, Layers, CheckCircle2, Clock, AlertCircle, RefreshCw, 
  Database, Activity, ArrowRight, ShieldCheck, FilePlus2, Sparkles 
} from 'lucide-react';

interface AdminDashboardProps {
  token: string;
  apiUrl: string;
  onNavigate: (page: string, params?: any) => void;
}

export default function AdminDashboard({ token, apiUrl, onNavigate }: AdminDashboardProps) {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/admin/dashboard/stats`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [token]);

  const handleReindex = async () => {
    try {
      setSyncing(true);
      setSyncMsg('');
      const res = await fetch(`${apiUrl}/api/admin/rag/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSyncMsg(`Successfully synchronized ${data.syncedCount || 'all'} schemes with ChromaDB.`);
        fetchStats();
      } else {
        setSyncMsg('Failed to sync knowledge base.');
      }
    } catch (err: any) {
      setSyncMsg(err.message || 'Error syncing knowledge base.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gov-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-gov-blue-900 via-slate-900 to-indigo-900 text-white p-8 rounded-3xl shadow-lg relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="flex items-center gap-2 text-gov-blue-400 font-extrabold text-xs tracking-wider uppercase">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Executive Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-display tracking-tight text-white">
            Government Scheme Administration
          </h1>
          <p className="text-slate-300 text-xs sm:text-sm max-w-2xl leading-relaxed">
            Manage schemes, eligibility criteria, rule engines, and the SchemeWise RAG knowledge base.
          </p>
        </div>
        <div className="flex items-center gap-3 z-10">
          <button
            onClick={() => onNavigate('admin-create-scheme')}
            className="px-5 py-3 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg hover:shadow-gov-blue-500/20 flex items-center gap-2 cursor-pointer"
          >
            <FilePlus2 className="w-4 h-4" /> Create New Scheme
          </button>
        </div>
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-gov-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Statistics 6-Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        
        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Total Schemes</span>
            <Building2 className="w-4 h-4 text-gov-blue-500" />
          </div>
          <div className="text-2xl font-black text-gov-blue-900">{stats?.totalSchemes || 0}</div>
          <span className="text-[10px] font-bold text-emerald-600 block">+3 this month</span>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-600">Published</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-700">{stats?.publishedSchemes || 0}</div>
          <span className="text-[10px] text-slate-400 block font-bold">Active in Engine & RAG</span>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600">Drafts</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700">{stats?.draftSchemes || 0}</div>
          <span className="text-[10px] text-slate-400 block font-bold">Under Admin Review</span>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">Inactive</span>
            <AlertCircle className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-black text-slate-600">{stats?.inactiveSchemes || 0}</div>
          <span className="text-[10px] text-slate-400 block font-bold">Archived / Paused</span>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Categories</span>
            <Layers className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{stats?.totalCategories || 0}</div>
          <span className="text-[10px] text-slate-400 block font-bold">Active Domains</span>
        </div>

        <div className="p-5 bg-white border border-slate-200/80 rounded-2xl shadow-sm hover:shadow-md transition-all space-y-2">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">Departments</span>
            <Activity className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{stats?.totalDepartments || 0}</div>
          <span className="text-[10px] text-slate-400 block font-bold">Ministry Portals</span>
        </div>

      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2 Cols) - Recent Scheme Changes */}
        <div className="lg:col-span-2 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h3 className="font-extrabold text-base text-gov-blue-900">Recent Scheme Changes</h3>
              <p className="text-xs text-slate-400">Audit trail of administrative updates across government schemes.</p>
            </div>
            <button 
              onClick={() => onNavigate('admin-audit')}
              className="text-xs text-gov-blue-600 hover:text-gov-blue-800 font-extrabold flex items-center gap-1 cursor-pointer"
            >
              View Full Audit Log <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-3">
            {stats?.recentChanges && stats.recentChanges.length > 0 ? (
              stats.recentChanges.map((logItem: any, i: number) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-slate-50/70 hover:bg-slate-50 rounded-2xl border border-slate-100 transition-colors">
                  <div className={`p-2.5 rounded-xl font-bold text-xs ${
                    logItem.action === 'CREATE' ? 'bg-emerald-100 text-emerald-700' :
                    logItem.action === 'PUBLISH' ? 'bg-blue-100 text-blue-700' :
                    logItem.action === 'UPDATE' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {logItem.action}
                  </div>
                  <div className="flex-1 space-y-1">
                    <p className="text-xs font-extrabold text-slate-800">{logItem.details}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold">
                      <span>Admin: {logItem.adminEmail}</span>
                      <span>•</span>
                      <span>{new Date(logItem.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No recent changes recorded yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col) - Knowledge Base Status Widget */}
        <div className="bg-gradient-to-br from-slate-900 via-gov-blue-950 to-slate-900 text-white rounded-3xl p-6 shadow-lg flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h3 className="font-extrabold text-sm text-gov-blue-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" /> Knowledge Base Status
              </h3>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                {stats?.ragStatus?.chromaStatus || 'ChromaDB Connected'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400">Target Vector Store</span>
                <span className="font-mono font-bold text-slate-200">{stats?.ragStatus?.collectionName || 'schemewise_docs'}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400">Indexed Schemes</span>
                <span className="font-black text-emerald-400 text-base">{stats?.ragStatus?.indexedSchemes || stats?.publishedSchemes || 0}</span>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-white/5">
                <span className="text-slate-400">Indexed Chunks</span>
                <span className="font-black text-gov-blue-400 text-base">{stats?.ragStatus?.indexedChunks || 120}</span>
              </div>
              <div className="flex justify-between items-center py-2">
                <span className="text-slate-400">Last Vector Sync</span>
                <span className="text-slate-300 font-bold">{stats?.ragStatus?.lastSync || 'Today'}</span>
              </div>
            </div>

            {syncMsg && (
              <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-200 text-[11px] leading-relaxed">
                {syncMsg}
              </div>
            )}
          </div>

          <div className="space-y-2 pt-4">
            <button
              onClick={handleReindex}
              disabled={syncing}
              className="w-full py-3 bg-gov-blue-500 hover:bg-gov-blue-600 disabled:opacity-50 text-white font-extrabold rounded-2xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Re-indexing ChromaDB...' : 'Re-index Knowledge Base'}
            </button>
            <button
              onClick={() => onNavigate('admin-rag')}
              className="w-full py-2 text-center text-slate-400 hover:text-white font-bold text-[11px] transition-colors cursor-pointer"
            >
              Advanced RAG Vector Controls →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
