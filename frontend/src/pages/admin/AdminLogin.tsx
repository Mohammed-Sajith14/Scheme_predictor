import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, Lock, Key, Mail, Sparkles, Building2, Eye, EyeOff } from 'lucide-react';

interface AdminLoginProps {
  onNavigate: (page: string) => void;
  onLoginSuccess: (token: string, user: any) => void;
  apiUrl: string;
}

export default function AdminLogin({ onNavigate, onLoginSuccess, apiUrl }: AdminLoginProps) {
  const [email, setEmail] = useState('admin@schemewise.com');
  const [password, setPassword] = useState('Admin@123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${apiUrl}/api/auth/admin-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Invalid administrator credentials or inactive account.");
      }

      if (data.user.role !== 'ADMIN') {
        throw new Error("Access Denied: This portal is strictly restricted to authorized administrators.");
      }

      onLoginSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || "Failed to authenticate administrator session.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col md:flex-row min-h-[calc(100vh-64px)] bg-slate-900 animate-fadeIn">
      
      {/* Form Panel Left (7/12) */}
      <div className="w-full md:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-16 bg-slate-950">
        <div className="w-full max-w-[440px] space-y-6">

          <div className="space-y-2 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-950/80 border border-indigo-700/50 rounded-full text-indigo-300 text-[10px] font-extrabold tracking-wider uppercase">
              <Lock className="w-3.5 h-3.5 text-indigo-400" />
              <span>Administrative Portal</span>
            </div>
            <h1 className="text-3xl font-black text-white font-display tracking-tight flex items-center gap-2.5">
              <Building2 className="w-7 h-7 text-indigo-500" /> SchemeWise Administration
            </h1>
            <p className="text-slate-400 text-xs font-semibold leading-relaxed">
              Manage government schemes, eligibility rules and AI knowledge.
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-950/80 border-l-4 border-red-500 rounded-xl text-red-200 text-xs flex items-start gap-2.5 shadow-lg">
              <ShieldAlert className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="p-3.5 bg-indigo-950/40 border border-indigo-800/40 rounded-xl text-indigo-200 text-xs space-y-1 text-left">
            <div className="font-extrabold text-[10px] uppercase tracking-wider text-indigo-400">
              Development Admin Credentials:
            </div>
            <div className="font-mono text-[11px] text-indigo-300 flex justify-between">
              <span>Email: <strong>admin@schemewise.com</strong></span>
              <span>Pass: <strong>Admin@123</strong></span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-left">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Admin Email</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  required
                  placeholder="admin@schemewise.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-semibold"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Password</label>
              </div>
              <div className="relative">
                <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-10 py-3 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-900 text-white font-extrabold rounded-xl transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer mt-5"
            >
              <span>{loading ? "Verifying Security Credentials..." : "Secure Sign In"}</span>
              {!loading && <ArrowRight className="w-4.5 h-4.5" />}
            </button>
          </form>

          <div className="pt-2 text-center text-xs font-semibold text-slate-500 border-t border-slate-800">
            Citizen user?{" "}
            <span
              onClick={() => onNavigate('login')}
              className="text-indigo-400 hover:text-indigo-300 cursor-pointer font-extrabold"
            >
              Go to Citizen Portal Sign In →
            </span>
          </div>

        </div>
      </div>

      {/* Info Panel Right (5/12) */}
      <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-10 lg:p-16 flex-col justify-between relative overflow-hidden border-l border-slate-800">
        
        {/* Glow Spheres */}
        <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/15 rounded-full blur-3xl -z-10" />
        
        <div className="space-y-2">
          <span className="text-xs font-black uppercase text-indigo-400 tracking-wider flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Administrative Command System</span>
          </span>
          <h2 className="text-2xl font-black font-display tracking-tight leading-tight">
            Scheme Lifecycle & Knowledge Management
          </h2>
        </div>

        <div className="space-y-6 max-w-sm">
          {[
            { title: 'Spring Security Enforcement', desc: 'All administrative REST endpoints enforce strict JWT role authorization.' },
            { title: 'Eligibility Engine & Tester', desc: 'Simulate citizen profiles against rule condition trees prior to publishing.' },
            { title: 'ChromaDB RAG Vector Store', desc: 'Seamlessly index and debug scheme vector embeddings for citizen AI responses.' },
            { title: 'Version Snapshots & Rollback', desc: 'Track every published change and restore previous scheme versions securely.' }
          ].map((item, idx) => (
            <div key={idx} className="flex gap-3 text-left">
              <div className="w-8 h-8 rounded-lg bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center text-indigo-300 flex-shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-white">{item.title}</h4>
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-slate-500 text-left">
          Confidential administrative system. Unauthorized access attempts are audited and logged.
        </div>

      </div>

    </div>
  );
}
