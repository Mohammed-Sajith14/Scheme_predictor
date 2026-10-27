import React, { useState, useEffect } from 'react';
import { ShieldCheck, Search, Filter, Clock, Activity, FileText } from 'lucide-react';

interface AdminAuditLogProps {
  token: string;
  apiUrl: string;
}

export default function AdminAuditLog({ token, apiUrl }: AdminAuditLogProps) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${apiUrl}/api/admin/audit`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [token]);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch = !search || 
      (log.details && log.details.toLowerCase().includes(search.toLowerCase())) ||
      (log.adminEmail && log.adminEmail.toLowerCase().includes(search.toLowerCase()));
    
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter;
    return matchesSearch && matchesAction;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gov-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12 animate-fadeIn">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-gov-blue-900 font-display flex items-center gap-2">
          <Activity className="w-6 h-6 text-gov-blue-600" /> Administrative Audit Log
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Complete security and operational audit trail of administrator actions across government schemes and RAG vector indexing.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search by details or admin email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-gov-blue-500 focus:bg-white"
          />
        </div>

        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
        >
          <option value="ALL">All Actions</option>
          <option value="CREATE">CREATE</option>
          <option value="UPDATE">UPDATE</option>
          <option value="PUBLISH">PUBLISH</option>
          <option value="DEACTIVATE">DEACTIVATE</option>
          <option value="DELETE">DELETE</option>
          <option value="REINDEX">REINDEX</option>
        </select>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden text-xs">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-400 font-bold">
            No audit records match the selected filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Timestamp</th>
                  <th className="py-3.5 px-4">Administrator</th>
                  <th className="py-3.5 px-4">Action</th>
                  <th className="py-3.5 px-4">Entity</th>
                  <th className="py-3.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                      {new Date(item.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 font-extrabold text-gov-blue-900">
                      {item.adminEmail || 'system@schemewise.com'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] ${
                        item.action === 'CREATE' ? 'bg-emerald-100 text-emerald-800' :
                        item.action === 'PUBLISH' ? 'bg-blue-100 text-blue-800' :
                        item.action === 'UPDATE' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-700'
                      }`}>
                        {item.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-bold">
                      {item.entityType} {item.entityId ? `#${item.entityId}` : ''}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-semibold max-w-md">
                      {item.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
