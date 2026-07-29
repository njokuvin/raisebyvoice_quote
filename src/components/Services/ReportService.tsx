import React, { useEffect } from 'react';
import { BarChart3, TrendingUp, PieChart as PieIcon, DollarSign, FileCheck, Share2, ArrowUpRight, Award, Ruler, Cloud } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { YellowTapeIcon } from '../SharedFacility';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { CompanyProfile } from '../../types';
import { saveReportToFirestore, fetchReportsFromFirestore, ReportRecord } from '../../lib/firebase';

interface ReportServiceProps {
  companyProfile: CompanyProfile;
  onOpenShareModal: (title: string, refNum: string, summaryText: string) => void;
  onOpenMeasurement?: () => void;
  user?: FirebaseUser | null;
}

const revenueData = [
  { month: 'Jan', quotes: 1200000, invoices: 950000 },
  { month: 'Feb', quotes: 1800000, invoices: 1400000 },
  { month: 'Mar', quotes: 2400000, invoices: 2100000 },
  { month: 'Apr', quotes: 1900000, invoices: 1750000 },
  { month: 'May', quotes: 3100000, invoices: 2800000 },
  { month: 'Jun', quotes: 2800000, invoices: 2500000 },
  { month: 'Jul', quotes: 4200000, invoices: 3900000 },
];

const categoryData = [
  { name: 'Quotation Sales', value: 45, color: '#4f46e5' },
  { name: 'Invoiced Billings', value: 35, color: '#059669' },
  { name: 'BOQ Projects', value: 15, color: '#d97706' },
  { name: 'Inventory Assets', value: 5, color: '#9333ea' },
];

export const ReportService: React.FC<ReportServiceProps> = ({ companyProfile, onOpenShareModal, onOpenMeasurement, user }) => {
  const totalRevenue = revenueData.reduce((sum, d) => sum + d.invoices, 0);
  const totalQuotesVal = revenueData.reduce((sum, d) => sum + d.quotes, 0);
  const conversionRate = Math.round((totalRevenue / totalQuotesVal) * 100);

  // Auto-sync executive report record to Firestore if logged in
  useEffect(() => {
    if (user?.uid) {
      const reportRec: ReportRecord = {
        id: 'rep-2026-q3',
        title: 'Executive Financial Performance Report',
        period: 'Q1 - Q3 2026',
        summary: `Total Quote Volume: NGN ${totalQuotesVal.toLocaleString()} | Total Invoiced Revenue: NGN ${totalRevenue.toLocaleString()} | Conversion Rate: ${conversionRate}%`,
        status: 'Generated',
        updatedAt: new Date().toISOString()
      };
      saveReportToFirestore(user.uid, reportRec);
    }
  }, [user, totalRevenue, totalQuotesVal, conversionRate]);

  const handleShareClick = () => {
    const summary = `Executive Financial Performance Report (${companyProfile.name || 'RaisebyVoice'})\nTotal Quote Volume: NGN ${totalQuotesVal.toLocaleString()}\nTotal Invoiced Revenue: NGN ${totalRevenue.toLocaleString()}\nQuote-to-Invoice Conversion Rate: ${conversionRate}%\nReport Period: Q1 - Q3 2026`;
    onOpenShareModal('Executive Financial Report', 'REP-2026-Q3', summary);
  };

  return (
    <div className="flex-1 w-full p-4 sm:p-6 lg:p-10 bg-slate-50 flex flex-col overflow-y-auto custom-scrollbar">
      <div className="max-w-6xl mx-auto w-full space-y-6">
        
        {/* Header Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-600 text-white flex items-center justify-center shadow-md">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Report Builder & Analytics</h1>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                  Business Intelligence
                </span>
                {user && (
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 flex items-center gap-1">
                    <Cloud className="w-3 h-3 text-indigo-600" />
                    Firestore Synced
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">YTD Invoiced Volume: NGN {totalRevenue.toLocaleString()}</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* {onOpenMeasurement && (
              <button
                type="button"
                onClick={onOpenMeasurement}
                className="inline-flex items-center space-x-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 rounded-xl transition-all shadow-2xs cursor-pointer group"
                title="Launch Raisebyvoice-measurement (AR Tape)"
              >
                <div className="w-6.5 h-6.5 rounded-lg bg-slate-200 border border-slate-300 text-slate-800 flex items-center justify-center group-hover:scale-105 transition-transform shrink-0 p-0.5">
                  <YellowTapeIcon className="w-4.5 h-4.5" />
                </div>
                <div className="flex flex-col items-start text-left leading-tight">
                  <span className="text-xs font-bold text-slate-900">Raisebyvoice-measurement</span>
                  <span className="text-[10px] font-semibold text-slate-500">take measurement</span>
                </div>
              </button>
            )} */}
            <button
              onClick={handleShareClick}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors shadow-sm cursor-pointer"
            >
              <Share2 className="w-4 h-4" />
              <span>Export Executive Report</span>
            </button>
          </div>
        </div>

        {/* Executive Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Total Quotes Issued</span>
              <FileCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <p className="text-xl font-black text-slate-900 font-mono">NGN {totalQuotesVal.toLocaleString()}</p>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              <span>+18.4% vs last quarter</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Invoiced Settlement</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-xl font-black text-slate-900 font-mono">NGN {totalRevenue.toLocaleString()}</p>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              <span>+24.1% revenue growth</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Quote Conversion Rate</span>
              <Award className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-xl font-black text-slate-900 font-mono">{conversionRate}%</p>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-500">
              <span>High conversion efficiency</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-2">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">Avg Deal Velocity</span>
              <TrendingUp className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-xl font-black text-slate-900 font-mono">4.2 Days</p>
            <div className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600">
              <ArrowUpRight className="w-3 h-3" />
              <span>Fast client approval</span>
            </div>
          </div>

        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue & Quote Trends Area Chart */}
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Revenue & Quotation Trajectory</h3>
                <p className="text-xs text-slate-400">Monthly breakdown of quotes vs converted invoices</p>
              </div>
              <div className="flex items-center space-x-4 text-xs font-bold">
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span> Quotes
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span> Invoices
                </span>
              </div>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorQuotes" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorInvoices" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#059669" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={(val) => `₦${(val / 1000000).toFixed(1)}M`} />
                  <Tooltip 
                    formatter={(val: number) => [`NGN ${val.toLocaleString()}`, '']}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Area type="monotone" dataKey="quotes" stroke="#4f46e5" strokeWidth={2.5} fillOpacity={1} fill="url(#colorQuotes)" />
                  <Area type="monotone" dataKey="invoices" stroke="#059669" strokeWidth={2.5} fillOpacity={1} fill="url(#colorInvoices)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Revenue Distribution Pie Chart */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4 flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-tight">Service Revenue Distribution</h3>
              <p className="text-xs text-slate-400 mt-0.5">Share across 5 business modules</p>
            </div>

            <div className="h-48 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(val: number) => [`${val}%`, 'Share']} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex justify-between items-center text-slate-700">
                  <div className="flex items-center space-x-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }}></span>
                    <span className="font-semibold">{cat.name}</span>
                  </div>
                  <span className="font-mono font-bold">{cat.value}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
