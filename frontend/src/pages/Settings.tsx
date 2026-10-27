import React, { useState } from 'react';
import { User, Bell, Shield, ShieldAlert, Trash2, CheckCircle2, AlertTriangle, Loader2, Globe, Check } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface SettingsProps {
  token: string;
  user: any;
  apiUrl: string;
  onLogout: () => void;
}

export default function Settings({ token, user, apiUrl, onLogout }: SettingsProps) {
  const { language, setLanguage, supportedLanguages, t } = useLanguage();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleDeleteWallet = async () => {
    setDeleting(true);
    setError('');
    setSuccess('');
    
    try {
      const emptyWallet = {
        dateOfBirth: null,
        gender: null,
        state: null,
        district: null,
        urbanRural: null,
        income: null,
        occupation: null,
        employmentStatus: null,
        education: null,
        studentStatus: null,
        familySize: null,
        maritalStatus: null,
        farmerStatus: null,
        landOwnership: null,
        landArea: null,
        disabilityStatus: null,
        disabilityPercentage: null,
        disabilityCertificateStatus: null,
        housingStatus: null,
        existingBenefits: null
      };

      const res = await fetch(`${apiUrl}/api/wallet/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(emptyWallet)
      });

      if (!res.ok) {
        throw new Error("Failed to reset database wallet parameters.");
      }

      setSuccess("Your socio-economic Data Wallet has been deleted successfully.");
      setShowConfirmDelete(false);
      
      setTimeout(() => {
        onLogout();
      }, 2000);
    } catch (err: any) {
      setError(err.message || "Failed to delete wallet.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-4xl mx-auto text-left animate-fadeIn">
      
      {/* Page Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-gov-blue-900 font-display tracking-tight">Profile Settings</h1>
        <p className="text-slate-500 text-xs mt-1 font-semibold">Manage credentials, privacy clearances, and wallet resets.</p>
      </div>

      {success && (
        <div className="p-4 bg-emerald-50 border-l-4 border-emerald-500 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-800 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="space-y-6">
        
        {/* Language & Regional Localization Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-gov-blue-500" />
              <h3 className="font-extrabold text-gov-blue-900 font-display text-sm">
                {t('settings.lang_title', 'Language & Regional Localization')}
              </h3>
            </div>
            <span className="text-[10px] bg-gov-blue-50 text-gov-blue-700 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
              {supportedLanguages.find(l => l.code === language)?.native || 'English'}
            </span>
          </div>

          <p className="text-xs text-slate-500 leading-relaxed font-semibold">
            {t('settings.lang_desc', 'Choose your preferred language. The entire portal will instantly adapt.')}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
            {supportedLanguages.map((l) => {
              const isSelected = language === l.code;
              return (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => setLanguage(l.code)}
                  className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer flex items-center justify-between ${
                    isSelected
                      ? 'border-gov-blue-500 bg-gov-blue-50/70 shadow-sm'
                      : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{l.flag}</span>
                    <div>
                      <span className={`block text-sm font-black ${isSelected ? 'text-gov-blue-900' : 'text-slate-800'}`}>
                        {l.native}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">
                        {l.label}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 rounded-full bg-gov-blue-500 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Account Info Card */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <User className="w-5 h-5 text-gov-blue-500" />
            <h3 className="font-extrabold text-gov-blue-900 font-display text-sm">Account Information</h3>
          </div>
          
          <div className="grid md:grid-cols-3 gap-4 text-xs font-semibold">
            <div className="space-y-1">
              <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Full Name</span>
              <span className="block font-bold text-slate-800 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
                {user?.name || 'Citizen'}
              </span>
            </div>
            <div className="space-y-1">
              <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Email Address</span>
              <span className="block font-bold text-slate-800 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
                {user?.email || 'citizen@domain.gov'}
              </span>
            </div>
            <div className="space-y-1">
              <span className="block text-slate-400 font-bold uppercase tracking-wider text-[9px]">Mobile Number</span>
              <span className="block font-bold text-slate-800 bg-slate-50 px-3.5 py-2.5 rounded-xl border border-slate-200">
                {user?.phone || '9876543210'}
              </span>
            </div>
          </div>
        </div>

        {/* Notifications and Privacy */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Bell className="w-5 h-5 text-gov-blue-500" />
            <h3 className="font-extrabold text-gov-blue-900 font-display text-sm">Preferences & Consents</h3>
          </div>
          
          <div className="space-y-3.5 text-xs text-slate-600 font-semibold">
            <div className="flex items-start">
              <input id="notif_email" type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-gov-blue-600 focus:ring-gov-blue-500 mt-0.5 cursor-pointer" />
              <label htmlFor="notif_email" className="ml-2.5 cursor-pointer">Email Alerts for matching new schemes</label>
            </div>
            <div className="flex items-start">
              <input id="notif_sms" type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-gov-blue-600 focus:ring-gov-blue-500 mt-0.5 cursor-pointer" />
              <label htmlFor="notif_sms" className="ml-2.5 cursor-pointer">SMS notifications for application verification milestone updates</label>
            </div>
            <div className="flex items-start">
              <input id="privacy_rag" type="checkbox" defaultChecked className="w-4 h-4 rounded border-slate-300 text-gov-blue-600 focus:ring-gov-blue-500 mt-0.5 cursor-pointer" />
              <label htmlFor="privacy_rag" className="ml-2.5 cursor-pointer">Enable personalized AI context (sends minimal wallet fields to RAG chatbot)</label>
            </div>
          </div>
        </div>

        {/* Danger zone */}
        <div className="bg-red-50/50 p-6 rounded-2xl border border-red-200/60 shadow-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-red-100 pb-3 text-red-800">
            <ShieldAlert className="w-5 h-5 text-red-600" />
            <h3 className="font-extrabold font-display text-sm">Danger Zone</h3>
          </div>

          <p className="text-xs text-red-700 leading-relaxed">
            Deleting your data wallet will permanently erase all your socio-economic variables, land sizes, income details, and disability certificates from our central vault. This resets all matching scheme calculations back to 0%.
          </p>

          {!showConfirmDelete ? (
            <button
              onClick={() => setShowConfirmDelete(true)}
              className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs transition-colors flex items-center gap-1 cursor-pointer shadow-sm shadow-red-500/10"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete My Data Wallet
            </button>
          ) : (
            <div className="p-4 bg-white rounded-xl border border-red-200 space-y-4 animate-fadeIn">
              <span className="block text-xs font-bold text-red-800">Are you absolutely sure you want to delete your Data Wallet?</span>
              <p className="text-[11px] text-slate-500">This action cannot be undone. We will wipe the variables from the PostgreSQL repository.</p>
              <div className="flex gap-2">
                <button
                  onClick={handleDeleteWallet}
                  disabled={deleting}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-200 text-white font-bold rounded text-xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  {deleting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    "Yes, Confirm Delete"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowConfirmDelete(false)}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
