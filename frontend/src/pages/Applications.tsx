import React, { useEffect, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { localizeSchemeName, localizeCategory, localizeTerm, localizeStatus } from '../utils/localizationHelper';
import { FileText, CheckCircle2, CircleDot, AlertCircle, RefreshCw, Eye, Info } from 'lucide-react';

interface ApplicationsProps {
  onNavigate: (page: string) => void;
  setSelectedSchemeId: (id: number | null) => void;
  token: string;
  apiUrl: string;
}

export default function Applications({ onNavigate, setSelectedSchemeId, token, apiUrl }: ApplicationsProps) {
  const { t, language } = useLanguage();
  const [apps, setApps] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const appRes = await fetch(`${apiUrl}/api/applications`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const appData = await appRes.json();
      setApps(appData);

      const scRes = await fetch(`${apiUrl}/api/schemes/public`);
      const scData = await scRes.json();
      setSchemes(scData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token, apiUrl]);

  const handleStatusChange = async (schemeId: number, newStatus: string) => {
    setUpdatingId(schemeId);
    try {
      const res = await fetch(`${apiUrl}/api/applications/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ schemeId, status: newStatus })
      });

      if (res.ok) {
        const updatedApp = await res.json();
        setApps(prev => {
          const exists = prev.some(a => a.schemeId === schemeId);
          if (exists) {
            return prev.map(a => a.schemeId === schemeId ? updatedApp : a);
          } else {
            return [...prev, updatedApp];
          }
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-4 border-gov-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-slate-500 text-sm font-semibold">Opening application files...</span>
      </div>
    );
  }

  const trackedSchemes = schemes.map(s => {
    const app = apps.find(a => a.schemeId === s.id);
    return {
      ...s,
      status: app ? app.status : 'NOT_STARTED'
    };
  });

  const activeApps = trackedSchemes.filter(s => s.status !== 'NOT_STARTED');

  const statusOptions = [
    { value: 'STARTED', label: localizeTerm('Application Started', language) },
    { value: 'SUBMITTED', label: localizeTerm('Submitted', language) },
    { value: 'VERIFYING', label: localizeTerm('Under Verification', language) },
    { value: 'APPROVED', label: localizeTerm('Approved', language) },
    { value: 'REJECTED', label: localizeTerm('Rejected', language) },
    { value: 'NOT_STARTED', label: localizeTerm('Remove Tracking', language) }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto text-left animate-fadeIn">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gov-blue-900 font-display tracking-tight">{localizeTerm("Applications Tracking", language)}</h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold">{localizeTerm("Applications Tracking desc", language)}</p>
      </div>

      {/* Grid List */}
      {activeApps.length === 0 ? (
        <div className="p-16 text-center bg-white border border-slate-200 rounded-2xl max-w-md mx-auto space-y-4">
          <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-gov-blue-900 text-sm">{localizeTerm("No tracked applications", language)}</h3>
          <p className="text-slate-500 text-xs leading-relaxed">
            {localizeTerm("No tracked applications desc", language)}
          </p>
          <button
            onClick={() => onNavigate('schemes')}
            className="px-5 py-2.5 bg-gov-blue-500 hover:bg-gov-blue-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-sm shadow-gov-blue-500/10"
          >
            {localizeTerm("Explore Schemes", language)}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {activeApps.map((item) => {
            const currentStatus = item.status;
            
            let percentWidth = "w-0";
            if (currentStatus === 'STARTED') percentWidth = "w-1/6";
            else if (currentStatus === 'SUBMITTED') percentWidth = "w-1/2";
            else if (currentStatus === 'VERIFYING') percentWidth = "w-5/6";
            else if (currentStatus === 'APPROVED' || currentStatus === 'REJECTED') percentWidth = "w-full";

            return (
              <div key={item.id} className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-6">
                
                {/* Upper bar */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-gov-blue-50 text-gov-blue-600 rounded">
                      {localizeCategory(item.category, language)}
                    </span>
                    <h3 className="text-base font-extrabold text-gov-blue-900 mt-1.5 leading-snug">{localizeSchemeName(item.name, language)}</h3>
                    <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{item.department}</p>
                  </div>
                  
                  {/* Option pick */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{localizeTerm("Update Milestone:", language)}</span>
                    <div className="relative">
                      <select
                        value={currentStatus}
                        disabled={updatingId === item.id}
                        onChange={(e) => handleStatusChange(item.id, e.target.value)}
                        className="pl-3 pr-8 py-2 border border-slate-300 rounded-xl text-xs font-bold bg-slate-50 outline-none text-slate-700 cursor-pointer focus:border-gov-blue-500"
                      >
                        {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </select>
                      {updatingId === item.id && (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin text-gov-blue-500 absolute right-8 top-1/2 -translate-y-1/2" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Tracking bar representation */}
                <div className="space-y-4 px-2">
                  <div className="relative">
                    <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 -z-10 rounded-full" />
                    <div className={`absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gov-blue-500 ${percentWidth} transition-all duration-500 -z-10 rounded-full`} />
                    
                    <div className="flex justify-between items-center">
                      {[
                        { step: 'STARTED', label: localizeTerm('Started', language) },
                        { step: 'SUBMITTED', label: localizeTerm('Submitted', language) },
                        { step: 'VERIFYING', label: localizeTerm('Verifying', language) },
                        { step: 'APPROVED', label: localizeTerm('Result', language) }
                      ].map((node, i) => {
                        const isNodePassed = 
                            (node.step === 'STARTED' && ['STARTED', 'SUBMITTED', 'VERIFYING', 'APPROVED', 'REJECTED'].includes(currentStatus)) ||
                            (node.step === 'SUBMITTED' && ['SUBMITTED', 'VERIFYING', 'APPROVED', 'REJECTED'].includes(currentStatus)) ||
                            (node.step === 'VERIFYING' && ['VERIFYING', 'APPROVED', 'REJECTED'].includes(currentStatus)) ||
                            (node.step === 'APPROVED' && ['APPROVED', 'REJECTED'].includes(currentStatus));
                        
                        const isCurrent = currentStatus === node.step || (node.step === 'APPROVED' && currentStatus === 'REJECTED');
                        
                        let nodeIcon = <CircleDot className="w-3.5 h-3.5" />;
                        if (isNodePassed && !isCurrent) {
                          nodeIcon = <CheckCircle2 className="w-3.5 h-3.5 text-white" />;
                        } else if (isCurrent && currentStatus === 'REJECTED') {
                          nodeIcon = <AlertCircle className="w-3.5 h-3.5 text-white" />;
                        }

                        return (
                          <div key={i} className="flex flex-col items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all ${
                              isCurrent && currentStatus === 'REJECTED' ? 'bg-red-500 border-red-500 text-white animate-pulse' :
                              isCurrent ? 'bg-gov-blue-500 border-gov-blue-500 text-white font-bold shadow-md shadow-gov-blue-500/10' :
                              isNodePassed ? 'bg-gov-blue-500 border-gov-blue-500 text-white' :
                              'bg-white border-slate-200 text-slate-400'
                            }`}>
                              {nodeIcon}
                            </div>
                            <span className={`text-[9px] font-black mt-2 uppercase tracking-wider ${isNodePassed ? 'text-gov-blue-700 font-black' : 'text-slate-400'}`}>
                              {node.step === 'APPROVED' && currentStatus === 'REJECTED' ? 'Rejected' :
                               node.step === 'APPROVED' && currentStatus === 'APPROVED' ? 'Approved' :
                               node.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Footer details link */}
                <div className="flex justify-between items-center pt-3 border-t border-slate-50 text-[10px] text-slate-400 font-semibold">
                  <span>Tracking type: Citizen Manual Update</span>
                  <button
                    onClick={() => {
                      setSelectedSchemeId(item.id);
                      onNavigate('schemeDetails');
                    }}
                    className="flex items-center gap-1 font-bold text-gov-blue-500 hover:text-gov-blue-700 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> <span>View Details</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
