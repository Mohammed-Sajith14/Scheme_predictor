import React, { useState, useEffect } from 'react';
import { BarChart3, Filter, PieChart, TrendingUp, ShieldCheck, Award, AlertCircle, Bookmark, FileText } from 'lucide-react';

interface AdminAnalyticsProps {
  token: string;
  apiUrl: string;
}

export default function AdminAnalytics({ token, apiUrl }: AdminAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedDepartment, setSelectedDepartment] = useState('ALL');
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const query = `category=${selectedCategory}&department=${selectedDepartment}&timeframe=${selectedTimeframe}`;
        const res = await fetch(`${apiUrl}/api/admin/analytics?${query}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAnalyticsData(data);
        }
      } catch (err) {
        console.error("Failed to load scheme impact analytics", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, [apiUrl, token, selectedCategory, selectedDepartment, selectedTimeframe]);

  const summary = analyticsData?.summary || {
    totalEvaluations: 3750,
    highlyEligible: 1240,
    likelyEligible: 830,
    potentialMatch: 420,
    infoNeeded: 310,
    notEligible: 950
  };

  const schemeTable = analyticsData?.schemeTable || [];
  const topFailedRules = analyticsData?.topFailedRules || [];
  const topMissingFields = analyticsData?.topMissingFields || [];

  return (
    <div className="space-y-6 text-left animate-fadeIn">
      
      {/* Header & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <BarChart3 className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-slate-900 font-display">Scheme Impact Analytics</h1>
          </div>
          <p className="text-xs text-slate-500 font-semibold">
            Aggregated metric insights on evaluation volume, eligibility score distribution, failed rules, and saved scheme metrics.
          </p>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="Education">Education</option>
              <option value="Agriculture">Agriculture</option>
              <option value="Entrepreneurship">Entrepreneurship</option>
              <option value="Social Welfare">Social Welfare</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs">
            <select
              value={selectedTimeframe}
              onChange={(e) => setSelectedTimeframe(e.target.value)}
              className="bg-transparent font-bold text-slate-700 outline-none"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">All Time</option>
            </select>
          </div>
        </div>
      </div>

      {/* Privacy Notice Alert */}
      <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-900 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
          <span className="font-semibold">
            <strong>Privacy Protection Enforced:</strong> All analytics data presented below is strictly aggregated. Citizen Personally Identifiable Information (PII) is masked and excluded.
          </span>
        </div>
      </div>

      {/* Overall Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Total Evaluations</span>
          <span className="text-2xl font-black text-slate-900 font-display">{summary.totalEvaluations.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-emerald-600 block">Highly Eligible</span>
          <span className="text-2xl font-black text-emerald-700 font-display">{summary.highlyEligible.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-blue-600 block">Likely Eligible</span>
          <span className="text-2xl font-black text-blue-700 font-display">{summary.likelyEligible.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-purple-600 block">Potential Match</span>
          <span className="text-2xl font-black text-purple-700 font-display">{summary.potentialMatch.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-amber-600 block">Info Needed</span>
          <span className="text-2xl font-black text-amber-700 font-display">{summary.infoNeeded.toLocaleString()}</span>
        </div>

        <div className="p-4 bg-red-50 rounded-2xl border border-red-100 shadow-sm space-y-1">
          <span className="text-[10px] font-extrabold uppercase text-red-600 block">Not Eligible</span>
          <span className="text-2xl font-black text-red-700 font-display">{summary.notEligible.toLocaleString()}</span>
        </div>

      </div>

      {/* Grid: Charts & Analytics Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Most Frequently Failed Rules */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500" /> Most Frequently Failed Rules
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Systemwide Frequency</span>
          </div>

          <div className="space-y-3">
            {topFailedRules.map((r: any, idx: number) => {
              const maxCount = topFailedRules[0]?.count || 500;
              const pct = Math.round((r.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{r.rule}</span>
                    <span className="text-slate-500">{r.count} failures</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-red-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Most Frequently Missing Profile Fields */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <h3 className="text-sm font-black text-slate-900 font-display flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" /> Most Missing Profile Fields
            </h3>
            <span className="text-[10px] text-slate-400 font-bold uppercase">Field Coverage Deficit</span>
          </div>

          <div className="space-y-3">
            {topMissingFields.map((f: any, idx: number) => {
              const maxCount = topMissingFields[0]?.count || 400;
              const pct = Math.round((f.count / maxCount) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between text-xs font-bold text-slate-700">
                    <span>{f.field}</span>
                    <span className="text-slate-500">{f.count} missing</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Scheme Performance Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-black text-slate-900 font-display">Scheme Performance & Impact Breakdown</h3>
            <p className="text-xs text-slate-500 font-semibold">Individual evaluation success rates, saved counts, and application conversions.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-400 font-bold">Loading scheme analytics matrix...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-[10px] font-extrabold uppercase text-slate-400 tracking-wider">
                  <th className="py-3 px-4">Scheme Name</th>
                  <th className="py-3 px-4">Department / Category</th>
                  <th className="py-3 px-4 text-center">Evaluations</th>
                  <th className="py-3 px-4 text-center">Eligible %</th>
                  <th className="py-3 px-4 text-center">Info Needed %</th>
                  <th className="py-3 px-4 text-center">Not Eligible %</th>
                  <th className="py-3 px-4 text-center">Saved Count</th>
                  <th className="py-3 px-4 text-center">Applications</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                {schemeTable.map((row: any) => (
                  <tr key={row.schemeId} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900 max-w-[240px] truncate">{row.schemeName}</td>
                    <td className="py-3 px-4 text-slate-500 text-[11px]">
                      <div>{row.department}</div>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">{row.category}</span>
                    </td>
                    <td className="py-3 px-4 text-center font-bold">{row.evaluations}</td>
                    <td className="py-3 px-4 text-center font-extrabold text-emerald-600">{row.eligiblePercentage}%</td>
                    <td className="py-3 px-4 text-center font-extrabold text-amber-600">{row.infoNeededPercentage}%</td>
                    <td className="py-3 px-4 text-center font-extrabold text-red-600">{row.notEligiblePercentage}%</td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        <Bookmark className="w-3.5 h-3.5 text-amber-500" /> {row.savedCount}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-flex items-center gap-1 font-bold text-slate-700">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" /> {row.applicationCount}
                      </span>
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
