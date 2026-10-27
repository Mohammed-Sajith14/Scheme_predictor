import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { localizeTerm } from '../utils/localizationHelper';
import { ShieldAlert, ArrowRight, ShieldCheck, User, Mail, Phone, Key, Sparkles, Calendar, Eye, EyeOff } from 'lucide-react';

interface RegisterProps {
  onNavigate: (page: string) => void;
  onSignupSuccess: (token: string, user: any) => void;
  apiUrl: string;
}

export default function Register({ onNavigate, onSignupSuccess, apiUrl }: RegisterProps) {
  const { t, language } = useLanguage();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [dob, setDob] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!name.trim()) errors.name = "Full name is required.";
    if (!email.trim()) {
      errors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!phone.trim()) {
      errors.phone = "Phone number is required.";
    } else if (!/^\d{10}$/.test(phone.replace(/[^0-9]/g, ''))) {
      errors.phone = "Please enter a valid 10-digit mobile number.";
    }
    if (!password) {
      errors.password = "Password is required.";
    } else if (password.length < 8) {
      errors.password = "Password must be at least 8 characters long.";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match.";
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError('');
    
    try {
      // Normal signup explicitly creates role = USER
      const res = await fetch(`${apiUrl}/api/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone, password, role: 'USER' })
      });
      
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || data.message || "Failed to create account. Email may already be registered.");
      }
      
      // Auto authenticate after signup
      const loginRes = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      
      if (loginRes.ok) {
        const loginData = await loginRes.json();
        onSignupSuccess(loginData.token, loginData.user);
      } else {
        onNavigate('login');
      }
    } catch (err: any) {
      setError(err.message || "Failed to complete registration.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col md:flex-row min-h-[calc(100vh-64px)] bg-slate-50 animate-fadeIn">
      
      {/* Left / Visual Section (5/12) */}
      <div className="w-full md:w-5/12 bg-gov-blue-900 text-white p-10 lg:p-16 flex flex-col justify-between relative overflow-hidden text-left">
        
        {/* Decorative Glow */}
        <div className="absolute -top-20 -left-20 w-[350px] h-[350px] bg-gov-blue-500/30 rounded-full blur-3xl -z-10" />
        
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gov-gold-500 flex items-center justify-center text-gov-blue-950 font-black shadow-lg">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <span className="text-xl font-black font-display tracking-tight">SchemeWise</span>
          </div>

          <div className="pt-6 space-y-2">
            <span className="text-xs font-black uppercase text-gov-gold-400 tracking-widest flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 animate-pulse" /> {localizeTerm("Citizen Access", language)}
            </span>
            <h2 className="text-3xl font-black font-display tracking-tight leading-tight text-white">
              "One Profile. Every Government Benefit."
            </h2>
            <p className="text-xs text-gov-blue-100/80 leading-relaxed pt-2">
              {localizeTerm("SchemeWise is India's unified socio-economic Data Wallet platform. Store your profile once and automatically match with hundreds of central & state welfare schemes.", language)}
            </p>
          </div>
        </div>

        {/* Feature List */}
        <div className="space-y-4 py-8 max-w-sm">
          {[
            { title: 'Unified Data Wallet', desc: 'Eliminate tedious form filling across multiple state and central portals.' },
            { title: 'Precision Rule Match', desc: 'Official eligibility engines score your parameters authoritatively.' },
            { title: 'Grounded RAG AI Assistant', desc: 'Ask questions about scheme guidelines, deadlines, and documentation.' }
          ].map((item, idx) => (
            <div key={idx} className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center text-gov-gold-400 flex-shrink-0 mt-0.5">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-extrabold text-xs text-white">{item.title}</h4>
                <p className="text-[11px] text-gov-blue-100/70 mt-0.5 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="text-[10px] text-gov-blue-200/50">
          Official platform built for citizen convenience and transparent benefit delivery.
        </div>

      </div>

      {/* Right Section (7/12) */}
      <div className="w-full md:w-7/12 flex items-center justify-center p-6 sm:p-10 lg:p-12 overflow-y-auto bg-white">
        <div className="w-full max-w-[460px] space-y-6 py-4">
          
          <div className="space-y-1 text-left">
            <h1 className="text-2xl font-black text-gov-blue-900 font-display tracking-tight">Create Account</h1>
            <p className="text-slate-500 text-xs font-semibold">Register your citizen profile to unlock automated scheme matching.</p>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border-l-4 border-red-500 rounded-xl text-red-800 text-xs flex items-start gap-2.5 text-left">
              <ShieldAlert className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 text-left" noValidate>
            
            {/* Full Name */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeTerm("Full Name *", language)}</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Priya Sharma"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })); }}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${fieldErrors.name ? 'border-red-500' : 'border-slate-300'} rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/25 focus:border-gov-blue-500 transition-all font-semibold`}
                />
              </div>
              {fieldErrors.name && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.name}</span>}
            </div>

            {/* Email Address */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeTerm("Email Address *", language)}</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="priya.sharma@example.in"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${fieldErrors.email ? 'border-red-500' : 'border-slate-300'} rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/25 focus:border-gov-blue-500 transition-all font-semibold`}
                />
              </div>
              {fieldErrors.email && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.email}</span>}
            </div>

            {/* Phone Number & DOB */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeTerm("Phone Number *", language)}</label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setFieldErrors(p => ({ ...p, phone: '' })); }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${fieldErrors.phone ? 'border-red-500' : 'border-slate-300'} rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/25 focus:border-gov-blue-500 transition-all font-semibold`}
                  />
                </div>
                {fieldErrors.phone && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.phone}</span>}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeTerm("Date of Birth (Optional)", language)}</label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 bg-slate-50/50 border border-slate-300 rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/25 focus:border-gov-blue-500 transition-all font-semibold"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">{localizeTerm("Password *", language)}</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 8 characters"
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                    className={`w-full pl-10 pr-9 py-2.5 bg-slate-50/50 border ${fieldErrors.password ? 'border-red-500' : 'border-slate-300'} rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/25 focus:border-gov-blue-500 transition-all font-semibold`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
                {fieldErrors.password && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.password}</span>}
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wide">Confirm {localizeTerm("Password *", language)}</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => { setConfirmPassword(e.target.value); setFieldErrors(p => ({ ...p, confirmPassword: '' })); }}
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50/50 border ${fieldErrors.confirmPassword ? 'border-red-500' : 'border-slate-300'} rounded-xl text-xs outline-none focus:ring-2 focus:ring-gov-blue-500/25 focus:border-gov-blue-500 transition-all font-semibold`}
                  />
                </div>
                {fieldErrors.confirmPassword && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.confirmPassword}</span>}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-gov-blue-500 hover:bg-gov-blue-600 disabled:bg-gov-blue-200 text-white font-extrabold rounded-xl transition-all shadow-md shadow-gov-blue-500/20 flex items-center justify-center gap-2 cursor-pointer mt-4"
            >
              <span>{loading ? localizeTerm("Creating Account...", language) : localizeTerm("Create Account", language)}</span>
              {!loading && <ArrowRight className="w-4.5 h-4.5" />}
            </button>
          </form>

          <div className="pt-2 text-center text-xs font-semibold text-slate-500 border-t border-slate-100">
            {localizeTerm("Already have an account?", language)}{" "}
            <span
              onClick={() => onNavigate('login')}
              className="text-gov-blue-600 hover:text-gov-blue-800 cursor-pointer font-extrabold"
            >
              {localizeTerm("Sign In", language)}
            </span>
          </div>

        </div>
      </div>

    </div>
  );
}
