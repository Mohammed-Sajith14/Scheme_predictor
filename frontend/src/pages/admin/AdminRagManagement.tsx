import React, { useState, useEffect, useMemo } from 'react';
import { 
  Database, RefreshCw, Layers, CheckCircle2, ShieldCheck, Cpu, Terminal, 
  Play, Sparkles, Search, Trash2, ArrowRight, X, Plus, ExternalLink, 
  Edit3, AlertTriangle, FileText, Check, Link, Eye, UploadCloud, File, 
  FileCode, HelpCircle, Clock, AlertCircle, ChevronRight
} from 'lucide-react';
import FormattedMarkdown from '../../components/FormattedMarkdown';
import { useLanguage } from '../../context/LanguageContext';

interface AdminRagManagementProps {
  token: string;
  apiUrl: string;
}

interface SchemeSource {
  id: number;
  schemeId: number;
  sourceName: string;
  sourceType: string; // PDF, Text
  fileName?: string;
  filePath?: string;
  fileSize?: number;
  rawText?: string;
  chunkCount?: number;
  indexingStatus?: string; // INDEXED, PENDING, FAILED, NOT_INDEXED
  indexingError?: string;
  lastIndexedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface SchemeOverview {
  id: number;
  name: string;
  department: string;
  category: string;
  status: string; // PUBLISHED, DRAFT, etc.
  sourceCount: number;
  indexedChunkCount: number;
  ragStatus: string; // INDEXED, ERROR, PENDING, NOT_INDEXED, NO_SOURCES
  sources: SchemeSource[];
}

interface VectorChunk {
  chunkId: string;
  schemeId: number;
  schemeName: string;
  sourceId?: string;
  sourceTitle?: string;
  sourceType?: string;
  chunkIndex: number;
  content: string;
  charCount?: number;
  lastSync?: string;
}

export default function AdminRagManagement({ token, apiUrl }: AdminRagManagementProps) {
  const { t } = useLanguage();

  const [ragStatus, setRagStatus] = useState<any>(null);
  const [schemes, setSchemes] = useState<SchemeOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'DRAFT'>('ALL');
  const [showDebugger, setShowDebugger] = useState(false);
  
  // Feedback banners
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Modal 1: Upload / Add Source Modal (PDF or Plain Text)
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedSchemeForAdd, setSelectedSchemeForAdd] = useState<SchemeOverview | null>(null);
  const [addSourceType, setAddSourceType] = useState<'PDF' | 'Text'>('PDF');
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourceText, setSourceText] = useState('');
  const [selectedPdfFile, setSelectedPdfFile] = useState<globalThis.File | null>(null);
  const [autoIndexOnAdd, setAutoIndexOnAdd] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Modal 2: Source Details & Edit Modal (Popup on icon/edit click)
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [currentSource, setCurrentSource] = useState<SchemeSource | null>(null);
  const [currentSchemeForSource, setCurrentSchemeForSource] = useState<SchemeOverview | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const [editTextTitle, setEditTextTitle] = useState('');
  const [editTextContent, setEditTextContent] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState('');

  // Modal 3: Inspect Vector Chunks Modal
  const [chunksModalOpen, setChunksModalOpen] = useState(false);
  const [inspectingSource, setInspectingSource] = useState<SchemeSource | null>(null);
  const [inspectingScheme, setInspectingScheme] = useState<SchemeOverview | null>(null);
  const [loadedChunks, setLoadedChunks] = useState<VectorChunk[]>([]);
  const [chunksLoading, setChunksLoading] = useState(false);
  const [chunksSearch, setChunksSearch] = useState('');

  // Debugger Query State
  const [debugQuestion, setDebugQuestion] = useState('');
  const [debugSchemeId, setDebugSchemeId] = useState<number | ''>('');
  const [debugLoading, setDebugLoading] = useState(false);
  const [debugResponse, setDebugResponse] = useState<any>(null);

  const authHeaders = useMemo(() => ({
    'Authorization': `Bearer ${token}`
  }), [token]);

  // Fetch all schemes with sources overview and RAG health status
  const fetchData = async () => {
    setLoading(true);
    try {
      const [overviewRes, statusRes] = await Promise.all([
        fetch(`${apiUrl}/api/admin/rag/schemes-overview`, { headers: authHeaders }),
        fetch(`${apiUrl}/api/admin/rag/status`, { headers: authHeaders })
      ]);

      if (overviewRes.ok) {
        const data = await overviewRes.json();
        setSchemes(data.schemes || []);
      }
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setRagStatus(statusData);
      }
    } catch (err: any) {
      console.error('Failed to load RAG overview:', err);
      setErrorMessage('Could not connect to RAG knowledge services. ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [apiUrl, token]);

  // Filter schemes by search query and publication status
  const filteredSchemes = useMemo(() => {
    return schemes.filter(scheme => {
      const matchesSearch = 
        !searchQuery ||
        scheme.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.department?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        scheme.category?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = 
        statusFilter === 'ALL' ||
        (statusFilter === 'PUBLISHED' && scheme.status?.toUpperCase() === 'PUBLISHED') ||
        (statusFilter === 'DRAFT' && scheme.status?.toUpperCase() !== 'PUBLISHED');

      return matchesSearch && matchesStatus;
    });
  }, [schemes, searchQuery, statusFilter]);

  // Open Add / Upload Modal
  const handleOpenAddModal = (scheme: SchemeOverview, initialType: 'PDF' | 'Text' = 'PDF') => {
    setSelectedSchemeForAdd(scheme);
    setAddSourceType(initialType);
    setSourceTitle('');
    setSourceText('');
    setSelectedPdfFile(null);
    setAutoIndexOnAdd(true);
    setAddError('');
    setAddModalOpen(true);
  };

  // Open Source Detail / Edit Popup Modal
  const handleOpenSourceDetail = (source: SchemeSource, scheme: SchemeOverview, startInEditMode = false) => {
    setCurrentSource(source);
    setCurrentSchemeForSource(scheme);
    setIsEditingText(startInEditMode);
    setEditTextTitle(source.sourceName);
    setEditTextContent(source.rawText || '');
    setEditError('');
    setDetailModalOpen(true);
  };

  // Open Edit for Scheme: opens first text source if exists, or latest source, or opens Upload modal if none
  const handleOpenEditForScheme = (scheme: SchemeOverview) => {
    if (scheme.sources && scheme.sources.length > 0) {
      const textSource = scheme.sources.find(s => s.sourceType === 'Text');
      const targetSource = textSource || scheme.sources[0];
      handleOpenSourceDetail(targetSource, scheme, targetSource.sourceType === 'Text');
    } else {
      handleOpenAddModal(scheme, 'Text');
    }
  };

  // Save New Knowledge Source (PDF or Text)
  const handleSaveSource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSchemeForAdd) return;

    if (!sourceTitle.trim()) {
      setAddError('Source title is required.');
      return;
    }

    setAddLoading(true);
    setAddError('');

    try {
      if (addSourceType === 'PDF') {
        if (!selectedPdfFile) {
          setAddError('Please select a valid PDF file.');
          setAddLoading(false);
          return;
        }

        const formData = new FormData();
        formData.append('file', selectedPdfFile);
        formData.append('sourceTitle', sourceTitle.trim());
        formData.append('autoIndex', String(autoIndexOnAdd));

        const res = await fetch(`${apiUrl}/api/admin/rag/schemes/${selectedSchemeForAdd.id}/sources/upload-pdf`, {
          method: 'POST',
          headers: authHeaders,
          body: formData
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to upload PDF source.');
        }

        setSuccessMessage(`PDF source "${sourceTitle}" uploaded and indexed successfully!`);
        setAddModalOpen(false);
        fetchData();
      } else {
        // Plain Text Source
        if (!sourceText.trim()) {
          setAddError('Content is required for text sources.');
          setAddLoading(false);
          return;
        }

        const res = await fetch(`${apiUrl}/api/admin/rag/schemes/${selectedSchemeForAdd.id}/sources/text`, {
          method: 'POST',
          headers: {
            ...authHeaders,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sourceTitle: sourceTitle.trim(),
            content: sourceText.trim(),
            autoIndex: autoIndexOnAdd
          })
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.message || 'Failed to save text source.');
        }

        setSuccessMessage(`Text source "${sourceTitle}" saved and indexed successfully!`);
        setAddModalOpen(false);
        fetchData();
      }
    } catch (err: any) {
      console.error('Error saving source:', err);
      setAddError(err.message || 'Error occurred while saving source.');
    } finally {
      setAddLoading(false);
    }
  };

  // Save Edited Text Source
  const handleSaveTextEdit = async () => {
    if (!currentSource) return;
    if (!editTextTitle.trim()) {
      setEditError('Source title cannot be empty.');
      return;
    }
    if (!editTextContent.trim()) {
      setEditError('Content cannot be empty.');
      return;
    }

    setEditLoading(true);
    setEditError('');

    try {
      const res = await fetch(`${apiUrl}/api/admin/rag/sources/${currentSource.id}/text`, {
        method: 'PUT',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceTitle: editTextTitle.trim(),
          content: editTextContent.trim(),
          autoIndex: true
        })
      });

      const updated = await res.json();
      if (!res.ok) {
        throw new Error(updated.message || 'Failed to update source.');
      }

      setCurrentSource(updated);
      setIsEditingText(false);
      setSuccessMessage(`Source "${editTextTitle}" updated and re-indexed in ChromaDB!`);
      fetchData();
    } catch (err: any) {
      console.error('Failed to update text source:', err);
      setEditError(err.message || 'Error updating source.');
    } finally {
      setEditLoading(false);
    }
  };

  // Re-index a specific source
  const handleReindexSource = async (sourceId: number) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/rag/sources/${sourceId}/reindex`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Re-indexing failed.');
      }
      setSuccessMessage('Source re-indexed successfully in ChromaDB!');
      if (currentSource && currentSource.id === sourceId) {
        setCurrentSource(data);
      }
      fetchData();
    } catch (err: any) {
      console.error('Re-indexing error:', err);
      setErrorMessage(err.message || 'Failed to re-index source.');
    } finally {
      setActionLoading(false);
    }
  };

  // Delete a Source
  const handleDeleteSource = async (sourceId: number, sourceName: string) => {
    if (!window.confirm(`Are you sure you want to delete source "${sourceName}"? All associated ChromaDB vector chunks will be permanently purged.`)) {
      return;
    }

    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/rag/sources/${sourceId}`, {
        method: 'DELETE',
        headers: authHeaders
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete source.');
      }

      setSuccessMessage(`Source "${sourceName}" deleted and obsolete chunks purged!`);
      setDetailModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Deletion error:', err);
      setErrorMessage(err.message || 'Failed to delete source.');
    } finally {
      setActionLoading(false);
    }
  };

  // Inspect Vector Chunks for a specific Source
  const handleInspectChunks = async (source: SchemeSource, scheme: SchemeOverview) => {
    setInspectingSource(source);
    setInspectingScheme(scheme);
    setLoadedChunks([]);
    setChunksSearch('');
    setChunksModalOpen(true);
    setChunksLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/admin/rag/sources/${source.id}/chunks`, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        setLoadedChunks(data.chunks || []);
      } else {
        setLoadedChunks([]);
      }
    } catch (err) {
      console.error('Failed to load chunks:', err);
      setLoadedChunks([]);
    } finally {
      setChunksLoading(false);
    }
  };

  // Inspect all chunks for a Scheme
  const handleInspectSchemeChunks = async (scheme: SchemeOverview) => {
    setInspectingSource(null);
    setInspectingScheme(scheme);
    setLoadedChunks([]);
    setChunksSearch('');
    setChunksModalOpen(true);
    setChunksLoading(true);

    try {
      const res = await fetch(`${apiUrl}/api/admin/rag/schemes/${scheme.id}/chunks`, {
        headers: authHeaders
      });
      if (res.ok) {
        const data = await res.json();
        setLoadedChunks(data.chunks || []);
      } else {
        setLoadedChunks([]);
      }
    } catch (err) {
      console.error('Failed to load scheme chunks:', err);
      setLoadedChunks([]);
    } finally {
      setChunksLoading(false);
    }
  };

  // Re-index entire scheme
  const handleReindexScheme = async (schemeId: number, schemeName: string) => {
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/rag/reindex/${schemeId}`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Re-index failed.');
      }
      setSuccessMessage(`Scheme "${schemeName}" vector knowledge re-indexed successfully!`);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Scheme re-index failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Sync all published schemes
  const handleSyncAll = async () => {
    if (!window.confirm('Trigger full vector re-synchronization across all published government schemes?')) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${apiUrl}/api/admin/rag/sync`, {
        method: 'POST',
        headers: authHeaders
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Sync failed.');
      }
      setSuccessMessage(`All published schemes synchronized! ${data.syncedCount || 0} schemes processed.`);
      fetchData();
    } catch (err: any) {
      setErrorMessage(err.message || 'Sync failed.');
    } finally {
      setActionLoading(false);
    }
  };

  // Execute Debug RAG query
  const handleRunDebug = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!debugQuestion.trim()) return;

    setDebugLoading(true);
    setDebugResponse(null);

    try {
      const payload: any = { question: debugQuestion.trim() };
      if (debugSchemeId) payload.schemeId = Number(debugSchemeId);

      const res = await fetch(`${apiUrl}/api/admin/rag/debug`, {
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      setDebugResponse(data);
    } catch (err: any) {
      setErrorMessage('Failed to execute RAG debug query: ' + err.message);
    } finally {
      setDebugLoading(false);
    }
  };

  // Helper format file size
  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Total indexed chunks across schemes
  const totalChunksCount = useMemo(() => {
    return schemes.reduce((acc, s) => acc + (s.indexedChunkCount || 0), 0);
  }, [schemes]);

  // Helper: Render an already uploaded source as an interactive icon button with status
  const renderSourceIcon = (source: SchemeSource, scheme: SchemeOverview) => {
    const isPdf = source.sourceType === 'PDF';
    const isIndexed = source.indexingStatus === 'INDEXED';
    const isFailed = source.indexingStatus === 'FAILED';

    return (
      <button
        key={source.id}
        onClick={() => handleOpenSourceDetail(source, scheme)}
        title={`${source.sourceName} (${source.sourceType}) • ${source.chunkCount || 0} chunks • Status: ${source.indexingStatus}\nClick to view and edit in popup`}
        className={`group relative inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all duration-150 shadow-xs hover:shadow hover:-translate-y-0.5 cursor-pointer ${
          isPdf 
            ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300' 
            : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300'
        }`}
      >
        {isPdf ? (
          <FileText className="w-4 h-4 text-rose-600 shrink-0" />
        ) : (
          <FileCode className="w-4 h-4 text-indigo-600 shrink-0" />
        )}
        <span className="truncate max-w-[120px] font-medium">{source.sourceName}</span>
        
        {/* Status indicator dot */}
        <span 
          className={`w-2 h-2 rounded-full shrink-0 ${
            isIndexed ? 'bg-emerald-500 ring-2 ring-emerald-200' : isFailed ? 'bg-rose-500 ring-2 ring-rose-200 animate-pulse' : 'bg-amber-400 ring-2 ring-amber-200'
          }`} 
        />
      </button>
    );
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* Toast notifications */}
      {successMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl shadow-xl animate-fade-in border border-emerald-500/30">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{successMessage}</span>
          <button onClick={() => setSuccessMessage('')} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {errorMessage && (
        <div className="fixed top-20 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-xl shadow-xl animate-fade-in border border-rose-500/30">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-medium">{errorMessage}</span>
          <button onClick={() => setErrorMessage('')} className="ml-2 hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Simplified, Clean Top Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Title & Subtitle */}
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                  {t('nav.admin.rag_kb', 'RAG Knowledge Base')}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  ChromaDB Active
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Authoritative guidelines, circulars, and plain text indexed into ChromaDB for AI scheme assistance.
              </p>
            </div>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-600">
              <span>Schemes: <strong className="text-slate-900 font-bold">{schemes.length}</strong></span>
              <span className="text-slate-300">|</span>
              <span className="flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                <span>Chunks: <strong className="text-indigo-700 font-bold">{totalChunksCount}</strong></span>
              </span>
            </div>

            <button
              onClick={() => setShowDebugger(!showDebugger)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                showDebugger 
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm' 
                  : 'bg-white text-slate-700 hover:text-slate-900 border-slate-200 hover:bg-slate-50'
              }`}
              title="Test citizen questions against ChromaDB"
            >
              <Terminal className="w-3.5 h-3.5" />
              <span>{showDebugger ? 'Hide Debugger' : 'RAG Debugger'}</span>
            </button>

            <button
              onClick={fetchData}
              disabled={loading || actionLoading}
              title="Refresh Knowledge Base State"
              className="p-2 text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all shadow-xs"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
            </button>

            <button
              onClick={handleSyncAll}
              disabled={actionLoading}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl shadow-xs hover:shadow transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Sync All</span>
            </button>
          </div>
        </div>
      </div>

      {/* Optional RAG Debugger Drawer */}
      {showDebugger && (
        <div className="bg-white rounded-2xl border border-indigo-100 p-5 shadow-sm space-y-4 animate-fade-in bg-gradient-to-r from-white via-indigo-50/20 to-white">
          <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Terminal className="w-4 h-4 text-indigo-600" />
              <span>RAG Query Debugger & Retrieval Inspector</span>
            </div>
            <button onClick={() => setShowDebugger(false)} className="text-slate-400 hover:text-slate-600">
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleRunDebug} className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-semibold text-slate-700">Citizen Question / Query</label>
                <input
                  type="text"
                  value={debugQuestion}
                  onChange={e => setDebugQuestion(e.target.value)}
                  placeholder="e.g., What are the income criteria for the old age pension scheme?"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Scope Scheme</label>
                <select
                  value={debugSchemeId}
                  onChange={e => setDebugSchemeId(e.target.value ? Number(e.target.value) : '')}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">All Schemes (Global Search)</option>
                  {schemes.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={debugLoading || !debugQuestion.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
            >
              {debugLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Retrieving Chunks & Synthesizing...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  Run Debug Query
                </>
              )}
            </button>
          </form>

          {debugResponse && (
            <div className="space-y-3 pt-3 border-t border-slate-100">
              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-1">Synthesized RAG Answer:</span>
                <div className="prose prose-xs max-w-none text-slate-800">
                  <FormattedMarkdown content={debugResponse.answer || debugResponse.response || 'No answer generated.'} />
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-700">Retrieved Chunks ({debugResponse.retrievedContext?.length || debugResponse.contextChunks?.length || 0}):</span>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {(debugResponse.retrievedContext || debugResponse.contextChunks || []).map((chunk: any, i: number) => (
                    <div key={i} className="p-2.5 bg-white border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700">
                      {typeof chunk === 'string' ? chunk : (chunk.content || chunk.text || JSON.stringify(chunk))}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search scheme by name, department, or category..."
            className="w-full pl-10 pr-8 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-xs"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-500 font-medium">Filter:</span>
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-semibold">
            {(['ALL', 'PUBLISHED', 'DRAFT'] as const).map(f => (
              <button
                key={f}
                onClick={() => setStatusFilter(f)}
                className={`px-3 py-1 rounded-lg transition-all ${
                  statusFilter === f ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Schemes List with Right-Side Upload/Edit Options and Uploaded Source Icons */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {loading ? (
          <div className="p-12 text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-3" />
            <p className="text-xs text-slate-500 font-medium">Loading scheme knowledge catalog...</p>
          </div>
        ) : filteredSchemes.length === 0 ? (
          <div className="p-12 text-center">
            <HelpCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No schemes found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchQuery ? 'No schemes matched your search filter.' : 'No schemes available in the system.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredSchemes.map(scheme => {
              const isPublished = scheme.status?.toUpperCase() === 'PUBLISHED';
              const sources = scheme.sources || [];

              return (
                <div 
                  key={scheme.id}
                  className="p-4 sm:p-5 hover:bg-slate-50/70 transition-colors flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  {/* Left Side: Scheme Name & Metadata */}
                  <div className="space-y-1 min-w-0 max-w-xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                        {scheme.name}
                      </h3>
                      <span 
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold tracking-wide uppercase border ${
                          isPublished 
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}
                      >
                        {scheme.status || 'PUBLISHED'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 text-xs text-slate-500 flex-wrap">
                      <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600 font-mono text-[11px]">ID: {scheme.id}</span>
                      <span>Dept: <strong className="text-slate-700 font-medium">{scheme.department || 'General'}</strong></span>
                      <span>Category: <strong className="text-slate-700 font-medium">{scheme.category || 'Welfare'}</strong></span>
                      <span className="flex items-center gap-1">
                        <Layers className="w-3 h-3 text-indigo-500" />
                        <span>Chunks: <strong className="text-indigo-600 font-bold">{scheme.indexedChunkCount || 0}</strong></span>
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Uploaded Sources Icons & Options for Edit / Upload / Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 lg:shrink-0">
                    {/* Uploaded Sources shown as clean interactive icons */}
                    <div className="flex items-center gap-1.5 flex-wrap min-h-[32px]">
                      {sources.length > 0 ? (
                        sources.map(src => renderSourceIcon(src, scheme))
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          No sources attached
                        </span>
                      )}
                    </div>

                    {/* Action Buttons: Upload, Edit, Inspect Chunks, Re-index */}
                    <div className="flex items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      {/* Upload Button: Opens same popup style for PDF or Text */}
                      <button
                        onClick={() => handleOpenAddModal(scheme)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs hover:shadow transition-all"
                        title="Upload PDF or plain text format"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </button>

                      {/* Edit Button: Opens popup to edit scheme sources */}
                      <button
                        onClick={() => handleOpenEditForScheme(scheme)}
                        disabled={actionLoading}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all hover:border-slate-300"
                        title="Edit scheme knowledge source"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                        <span>Edit</span>
                      </button>

                      {/* Quick Inspect Scheme Chunks */}
                      <button
                        onClick={() => handleInspectSchemeChunks(scheme)}
                        title="Inspect all ChromaDB vector chunks for this scheme"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      >
                        <Layers className="w-4 h-4" />
                      </button>

                      {/* Quick Re-index Scheme */}
                      <button
                        onClick={() => handleReindexScheme(scheme.id, scheme.name)}
                        disabled={actionLoading}
                        title="Re-index scheme knowledge in ChromaDB"
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors border border-transparent hover:border-slate-200"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* POPUP MODAL 1: Upload Knowledge Source (PDF or Plain Text) */}
      {/* ========================================================================= */}
      {addModalOpen && selectedSchemeForAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-scale-up flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${addSourceType === 'PDF' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                  {addSourceType === 'PDF' ? <FileText className="w-5 h-5" /> : <FileCode className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Upload Knowledge Source</h2>
                  <p className="text-xs text-slate-500">
                    Scheme: <strong className="text-slate-700 font-medium">{selectedSchemeForAdd.name}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message if any */}
            {addError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{addError}</span>
              </div>
            )}

            {/* Form Body */}
            <form onSubmit={handleSaveSource} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Type Switcher Tabs (PDF vs Plain Text) */}
              <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setAddSourceType('PDF')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    addSourceType === 'PDF' 
                      ? 'bg-white text-rose-700 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span>Upload PDF Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAddSourceType('Text')}
                  className={`py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    addSourceType === 'Text' 
                      ? 'bg-white text-indigo-700 shadow-xs' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileCode className="w-4 h-4 text-indigo-600" />
                  <span>Plain Text Format</span>
                </button>
              </div>

              {/* Source Title Input */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-700">Source Title / Reference *</label>
                <input
                  type="text"
                  required
                  value={sourceTitle}
                  onChange={e => setSourceTitle(e.target.value)}
                  placeholder="e.g., Operational Guidelines 2026 or Circular No. 42"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {/* Mode A: PDF File Input */}
              {addSourceType === 'PDF' ? (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Official PDF Document (Max 20MB) *</label>
                  <div className="border-2 border-dashed border-slate-200 hover:border-rose-400 rounded-xl p-6 text-center bg-slate-50/60 hover:bg-rose-50/20 transition-all cursor-pointer relative">
                    <input
                      type="file"
                      accept=".pdf,application/pdf"
                      onChange={e => {
                        if (e.target.files && e.target.files[0]) {
                          setSelectedPdfFile(e.target.files[0]);
                          if (!sourceTitle) {
                            setSourceTitle(e.target.files[0].name.replace(/\.pdf$/i, ''));
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <UploadCloud className="w-8 h-8 text-rose-500 mx-auto mb-2" />
                    {selectedPdfFile ? (
                      <div>
                        <p className="text-xs font-bold text-slate-800">{selectedPdfFile.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{formatBytes(selectedPdfFile.size)}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-xs font-semibold text-slate-700">Click or drag & drop PDF here</p>
                        <p className="text-[11px] text-slate-400 mt-1">Supports searchable PDF files with text</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    * Note: Scanned image-only PDFs without OCR cannot be indexed.
                  </p>
                </div>
              ) : (
                /* Mode B: Plain Text Input */
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Source Text Content *</label>
                    <span className="text-[11px] text-slate-400 font-mono">{sourceText.length} chars</span>
                  </div>
                  <textarea
                    rows={8}
                    required
                    value={sourceText}
                    onChange={e => setSourceText(e.target.value)}
                    placeholder="Paste or write the authoritative eligibility rules, scheme guidelines, or circular text here..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}

              {/* Auto-Index Checkbox */}
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-700 pt-1">
                <input
                  type="checkbox"
                  checked={autoIndexOnAdd}
                  onChange={e => setAutoIndexOnAdd(e.target.checked)}
                  className="rounded text-indigo-600 focus:ring-indigo-500"
                />
                <span className="font-medium">Save & Index immediately in ChromaDB vector store</span>
              </label>

              {/* Modal Footer */}
              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addLoading}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  {addLoading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Saving & Indexing...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      Save & Index Source
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL 2: Source Details & Edit (Opened when source icon or Edit is clicked) */}
      {/* Same Popup Modal Style */}
      {/* ========================================================================= */}
      {detailModalOpen && currentSource && currentSchemeForSource && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${currentSource.sourceType === 'PDF' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                  {currentSource.sourceType === 'PDF' ? <FileText className="w-5 h-5" /> : <FileCode className="w-5 h-5" />}
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">{currentSource.sourceName}</h2>
                  <p className="text-xs text-slate-500">
                    Scheme: <strong className="text-slate-700 font-medium">{currentSchemeForSource.name}</strong> • Type: <strong className="text-slate-700 font-medium">{currentSource.sourceType}</strong>
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setDetailModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Banner */}
            {editError && (
              <div className="mx-6 mt-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-700 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editError}</span>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Quick Metadata Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block mb-0.5">Indexing Status</span>
                  <span className={`inline-flex items-center gap-1 font-semibold ${
                    currentSource.indexingStatus === 'INDEXED' ? 'text-emerald-700' : currentSource.indexingStatus === 'FAILED' ? 'text-rose-700' : 'text-amber-700'
                  }`}>
                    <span className={`w-2 h-2 rounded-full ${
                      currentSource.indexingStatus === 'INDEXED' ? 'bg-emerald-500' : currentSource.indexingStatus === 'FAILED' ? 'bg-rose-500' : 'bg-amber-500'
                    }`} />
                    {currentSource.indexingStatus || 'NOT_INDEXED'}
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Vector Chunks</span>
                  <span className="font-bold text-slate-900">{currentSource.chunkCount || 0} Chunks</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">Last Synced</span>
                  <span className="text-slate-700 font-medium truncate block">{currentSource.lastIndexedAt || 'Never'}</span>
                </div>

                <div>
                  <span className="text-slate-400 block mb-0.5">{currentSource.sourceType === 'PDF' ? 'File Size' : 'Chars'}</span>
                  <span className="text-slate-700 font-medium">
                    {currentSource.sourceType === 'PDF' ? formatBytes(currentSource.fileSize) : `${currentSource.rawText?.length || 0} chars`}
                  </span>
                </div>
              </div>

              {/* Indexing Error Details if any */}
              {currentSource.indexingError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 space-y-1">
                  <div className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                    <span>Indexing Error Diagnostics:</span>
                  </div>
                  <p className="font-mono text-[11px] pl-5.5">{currentSource.indexingError}</p>
                </div>
              )}

              {/* Text Source: View / Edit Switch */}
              {currentSource.sourceType === 'Text' ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-700">Text Knowledge Content</label>
                    {!isEditingText ? (
                      <button
                        onClick={() => setIsEditingText(true)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-semibold flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Text</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditingText(false)}
                        className="text-xs text-slate-500 hover:text-slate-700 font-medium"
                      >
                        Cancel Edit
                      </button>
                    )}
                  </div>

                  {isEditingText ? (
                    <div className="space-y-3">
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Title</label>
                        <input
                          type="text"
                          value={editTextTitle}
                          onChange={e => setEditTextTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] font-semibold text-slate-600 block mb-1">Content</label>
                        <textarea
                          rows={10}
                          value={editTextContent}
                          onChange={e => setEditTextContent(e.target.value)}
                          className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={handleSaveTextEdit}
                          disabled={editLoading}
                          className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
                        >
                          {editLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                          <span>Save & Re-index</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                      <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                        {currentSource.rawText || 'No text content available.'}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                /* PDF Extracted Text Preview */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700">Extracted PDF Text Preview</span>
                    <span className="text-slate-400 font-mono">{currentSource.rawText?.length || 0} characters</span>
                  </div>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 max-h-60 overflow-y-auto">
                    <pre className="text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed">
                      {currentSource.rawText || 'No text content extracted.'}
                    </pre>
                  </div>
                  {currentSource.fileName && (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>Original file: <strong className="text-slate-700">{currentSource.fileName}</strong></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={() => handleDeleteSource(currentSource.id, currentSource.sourceName)}
                disabled={actionLoading}
                className="px-3.5 py-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Source</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleInspectChunks(currentSource, currentSchemeForSource)}
                  className="px-3.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  <span>Inspect Chunks</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleReindexSource(currentSource.id)}
                  disabled={actionLoading}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-index Now</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL 3: Inspect Vector Chunks Modal */}
      {/* Same Popup Modal Style */}
      {/* ========================================================================= */}
      {chunksModalOpen && inspectingScheme && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200/90 shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    Indexed ChromaDB Vector Chunks
                  </h2>
                  <p className="text-xs text-slate-500">
                    Scheme: <strong className="text-slate-700">{inspectingScheme.name}</strong>
                    {inspectingSource && <span> • Source: <strong className="text-slate-700">{inspectingSource.sourceName}</strong></span>}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setChunksModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Filter */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={chunksSearch}
                  onChange={e => setChunksSearch(e.target.value)}
                  placeholder="Filter chunk contents..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              {chunksLoading ? (
                <div className="p-12 text-center">
                  <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
                  <p className="text-xs text-slate-500">Loading vector chunks from ChromaDB...</p>
                </div>
              ) : loadedChunks.length === 0 ? (
                <div className="p-10 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-semibold text-slate-600">No vector chunks indexed yet.</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">Upload a PDF or enter text, then click "Save & Index".</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {loadedChunks
                    .filter(c => !chunksSearch || c.content?.toLowerCase().includes(chunksSearch.toLowerCase()))
                    .map((chunk, idx) => (
                      <div key={chunk.chunkId || idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                          <span className="font-bold text-indigo-700">Chunk #{chunk.chunkIndex ?? idx + 1} ({chunk.chunkId})</span>
                          <span>{chunk.content?.length || 0} chars</span>
                        </div>
                        <p className="text-slate-800 font-mono text-[11px] whitespace-pre-wrap leading-relaxed bg-white p-2.5 rounded border border-slate-100">
                          {chunk.content}
                        </p>
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Total Chunks: <strong className="text-slate-800">{loadedChunks.length}</strong>
              </span>
              <button
                type="button"
                onClick={() => setChunksModalOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
