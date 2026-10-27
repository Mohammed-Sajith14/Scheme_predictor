import React, { useState, useEffect } from 'react';
import { 
  Search, Filter, Plus, Edit2, Eye, Copy, CheckCircle2, XCircle, Trash2, 
  ChevronLeft, ChevronRight, SlidersHorizontal, RefreshCw, ArrowUpDown, ShieldCheck, History, Play 
} from 'lucide-react';
import { VersionHistoryModal } from '../../components/admin/VersionHistoryModal';
import { RuleTesterModal } from '../../components/admin/RuleTesterModal';

interface AdminSchemesListProps {
  token: string;
  apiUrl: string;
  onNavigate: (page: string, params?: any) => void;
}

export default function AdminSchemesList({ token, apiUrl, onNavigate }: AdminSchemesListProps) {
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters & Search
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [departmentFilter, setDepartmentFilter] = useState('ALL');
  const [stateFilter, setStateFilter] = useState('ALL');

  // Pagination
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Message notifications
  const [actionMsg, setActionMsg] = useState('');

  // Modals
  const [versionModalSchemeId, setVersionModalSchemeId] = useState<number | null>(null);
  const [testModalSchemeId, setTestModalSchemeId] = useState<number | null>(null);
  const [testRequirements, setTestRequirements] = useState<any[]>([]);

  const fetchSchemes = async () => {
    try {
      setLoading(true);
      const query = new URLSearchParams({
        search,
        status: statusFilter,
        category: categoryFilter,
        department: departmentFilter,
        state: stateFilter,
        page: String(page),
        size: String(pageSize)
      }).toString();

      const res = await fetch(`${apiUrl}/api/admin/schemes?${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSchemes(data.content || []);
        setTotalElements(data.totalElements || 0);
        setTotalPages(data.totalPages || 1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, [search, statusFilter, categoryFilter, departmentFilter, stateFilter, page, pageSize, token]);

  const handlePublish = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/schemes/${id}/publish`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMsg('Scheme published successfully and vector index updated.');
        fetchSchemes();
      } else {
        const errJson = await res.json();
        alert(errJson.message || 'Validation failed for publish.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/schemes/${id}/deactivate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMsg('Scheme deactivated successfully.');
        fetchSchemes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicate = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/schemes/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMsg('Scheme duplicated as a new Draft.');
        fetchSchemes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to deactivate/delete this scheme?')) return;
    try {
      const res = await fetch(`${apiUrl}/api/admin/schemes/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setActionMsg('Scheme deleted/deactivated.');
        fetchSchemes();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openTestModal = async (id: number) => {
    try {
      const res = await fetch(`${apiUrl}/api/admin/schemes/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTestRequirements(data.requirements || []);
        setTestModalSchemeId(id);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* Top Title & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gov-blue-900 font-display flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-gov-blue-600" /> Government Scheme Repository
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create, publish, edit, duplicate, version, and dynamically manage rules for all registered government schemes.
          </p>
        </div>

        <button
          onClick={() => onNavigate('admin-create-scheme')}
          className="px-4 py-2.5 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-extrabold rounded-2xl text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Dynamic Scheme
        </button>
      </div>

      {actionMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex justify-between items-center animate-slideDown">
          <span>✓ {actionMsg}</span>
          <button onClick={() => setActionMsg('')} className="text-emerald-600 hover:text-emerald-900 font-bold">✕</button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200/80 rounded-2xl shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search box */}
          <div className="relative lg:col-span-2">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search scheme name, department, category..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-gov-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="ALL">All Statuses</option>
              <option value="PUBLISHED">Published Only</option>
              <option value="DRAFT">Drafts Only</option>
              <option value="INACTIVE">Inactive Only</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="ALL">All Categories</option>
              <option value="Education">Education</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Small Business">Small Business</option>
              <option value="Housing">Housing</option>
              <option value="Senior Citizens">Senior Citizens</option>
              <option value="Women & Child Welfare">Women & Child Welfare</option>
              <option value="Disability Assistance">Disability Assistance</option>
              <option value="Employment">Employment</option>
              <option value="Skill Development">Skill Development</option>
              <option value="Entrepreneurship">Entrepreneurship</option>
            </select>
          </div>

          {/* State Filter */}
          <div>
            <select
              value={stateFilter}
              onChange={(e) => { setStateFilter(e.target.value); setPage(0); }}
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700"
            >
              <option value="ALL">All States (National & Regional)</option>
              <option value="All India">All India (National)</option>
              <option value="Tamil Nadu">Tamil Nadu</option>
              <option value="Maharashtra">Maharashtra</option>
              <option value="Uttar Pradesh">Uttar Pradesh</option>
              <option value="Karnataka">Karnataka</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Schemes Management Table */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-4 border-gov-blue-500 border-t-transparent mx-auto"></div>
          </div>
        ) : schemes.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-2">
            <SlidersHorizontal className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-sm text-slate-600">No schemes found matching criteria.</p>
            <p className="text-xs text-slate-400">Try adjusting your search terms or status filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-extrabold text-[10px] uppercase tracking-wider">
                  <th className="py-3.5 px-4">Scheme Name</th>
                  <th className="py-3.5 px-4">Department</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">State</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-center">Rules</th>
                  <th className="py-3.5 px-4">Last Updated</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {schemes.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-extrabold text-gov-blue-900 max-w-xs line-clamp-1 flex items-center gap-1.5">
                        {s.name}
                        {s.name.includes('[DEMO]') && (
                          <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold bg-amber-100 text-amber-800 rounded">
                            DEMO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">v{s.version || 1} • ID #{s.id}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate">{s.department || 'N/A'}</td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-1 bg-slate-100 font-bold text-slate-700 rounded-lg text-[10px]">
                        {s.category || 'General'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">{s.state || 'All India'}</td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                        s.status === 'PUBLISHED' ? 'bg-emerald-100 text-emerald-800' :
                        s.status === 'DRAFT' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {s.status || 'PUBLISHED'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-extrabold rounded-md text-[11px]">
                        {s.rulesCount || 0}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : 'Seeded'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        
                        <button
                          onClick={() => openTestModal(s.id)}
                          className="p-1.5 hover:bg-emerald-50 rounded-lg text-emerald-600 hover:text-emerald-800 transition-colors"
                          title="Test Rules against Mock Citizen Profile"
                        >
                          <Play className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onNavigate('admin-scheme-versions', { id: s.id })}
                          className="p-1.5 hover:bg-indigo-50 rounded-lg text-indigo-600 hover:text-indigo-800 transition-colors"
                          title="Version History & Audit Snapshot"
                        >
                          <History className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onNavigate('schemeDetails', { id: s.id })}
                          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors"
                          title="View Citizen Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => onNavigate('admin-edit-scheme', { id: s.id })}
                          className="p-1.5 hover:bg-gov-blue-50 rounded-lg text-gov-blue-600 hover:text-gov-blue-800 transition-colors"
                          title="Edit Scheme & Requirements"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDuplicate(s.id)}
                          className="p-1.5 hover:bg-purple-50 rounded-lg text-purple-600 hover:text-purple-800 transition-colors"
                          title="Duplicate as Draft"
                        >
                          <Copy className="w-4 h-4" />
                        </button>

                        {s.status === 'DRAFT' || s.status === 'INACTIVE' ? (
                          <button
                            onClick={() => handlePublish(s.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-[10px] transition-colors"
                            title="Publish Scheme"
                          >
                            Publish
                          </button>
                        ) : (
                          <button
                            onClick={() => handleDeactivate(s.id)}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold rounded-lg text-[10px] transition-colors"
                            title="Deactivate Scheme"
                          >
                            Pause
                          </button>
                        )}

                        <button
                          onClick={() => handleDelete(s.id)}
                          className="p-1.5 hover:bg-red-50 rounded-lg text-red-500 hover:text-red-700 transition-colors"
                          title="Delete Scheme"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <span>
            Showing <strong className="text-slate-800">{schemes.length}</strong> of <strong className="text-slate-800">{totalElements}</strong> total schemes
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage(page - 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 disabled:opacity-40 rounded-xl hover:bg-slate-100 font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl font-bold text-slate-800">
              Page {page + 1} of {totalPages || 1}
            </span>
            <button
              disabled={page + 1 >= totalPages}
              onClick={() => setPage(page + 1)}
              className="px-3 py-1.5 bg-white border border-slate-200 disabled:opacity-40 rounded-xl hover:bg-slate-100 font-bold transition-colors flex items-center gap-1 cursor-pointer"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
