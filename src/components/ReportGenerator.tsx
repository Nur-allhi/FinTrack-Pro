import React, { useState } from 'react';
import { Account, Member, Transaction } from '../types';
import { 
  FileText, 
  Sparkles, 
  Download, 
  Calendar, 
  Filter, 
  Loader2,
  AlertCircle,
  ChevronRight,
  PieChart
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { getFinancialInsights } from '../services/geminiService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface ReportGeneratorProps {
  accounts: Account[];
  members: Member[];
}

export default function ReportGenerator({ accounts, members }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<string[]>([]);
  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    accountId: '',
    memberId: ''
  });

  const generateReport = async () => {
    setLoading(true);
    try {
      // Fetch transactions based on filters
      // For simplicity, we'll fetch all and filter client-side if no specific account
      let allTxs: Transaction[] = [];
      
      if (filters.accountId) {
        const res = await fetch(`/api/transactions/${filters.accountId}`);
        allTxs = await res.json();
      } else {
        // Fetch all accounts' transactions
        const promises = accounts.map(a => fetch(`/api/transactions/${a.id}`).then(r => r.json()));
        const results = await Promise.all(promises);
        allTxs = results.flat();
      }

      // Filter by date
      const filtered = allTxs.filter(tx => {
        const date = new Date(tx.date);
        return date >= new Date(filters.startDate) && date <= new Date(filters.endDate);
      });

      setReportData(filtered);

      // Get AI Insights
      const aiInsights = await getFinancialInsights(filtered.map(t => ({
        date: t.date,
        particulars: t.particulars,
        amount: t.amount,
        category: t.category
      })));
      setInsights(aiInsights);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const accountName = filters.accountId ? accounts.find(a => a.id === Number(filters.accountId))?.name : 'All Accounts';
    
    doc.setFontSize(20);
    doc.setTextColor(26, 95, 204);
    doc.text('FinTrack Pro - Financial Report', 14, 22);
    
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 32);
    doc.text(`Account: ${accountName}`, 14, 38);

    doc.setFontSize(14);
    doc.setTextColor(0);
    doc.text('AI Insights:', 14, 50);
    
    let y = 58;
    insights.forEach(insight => {
      const lines = doc.splitTextToSize(`• ${insight}`, 180);
      doc.text(lines, 14, y);
      y += lines.length * 7;
    });

    (doc as any).autoTable({
      startY: y + 10,
      head: [['Date', 'Particulars', 'Category', 'Debit', 'Credit']],
      body: reportData.map(t => [
        t.date,
        t.particulars,
        t.category || '-',
        t.amount < 0 ? `৳${Math.abs(t.amount).toLocaleString()}` : '-',
        t.amount > 0 ? `৳${t.amount.toLocaleString()}` : '-'
      ]),
      headStyles: { fillColor: [26, 95, 204] },
      alternateRowStyles: { fillColor: [245, 248, 255] }
    });

    doc.save(`FinTrack_Report_${filters.startDate}_${filters.endDate}.pdf`);
  };

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-primary/10 rounded-2xl">
            <FileText className="text-primary w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Report Generator</h3>
            <p className="text-slate-500 font-medium">Generate detailed financial reports with AI-powered insights.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Start Date</label>
            <input 
              type="date" 
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">End Date</label>
            <input 
              type="date" 
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Account (Optional)</label>
            <select 
              value={filters.accountId}
              onChange={e => setFilters({...filters, accountId: e.target.value})}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
            >
              <option value="">All Accounts</option>
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button 
              onClick={generateReport}
              disabled={loading}
              className="w-full bg-primary text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {reportData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-bold text-slate-800">AI Financial Insights</h4>
                <div className="p-2 bg-primary/5 rounded-xl">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="space-y-4">
                {insights.map((insight, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm">
                      <span className="text-xs font-bold text-primary">{i + 1}</span>
                    </div>
                    <p className="text-sm text-slate-600 font-medium leading-relaxed">{insight}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-50 flex items-center justify-between">
                <h4 className="text-lg font-bold text-slate-800">Transaction Summary</h4>
                <button 
                  onClick={exportPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all font-bold text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export PDF
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Particulars</th>
                      <th className="px-6 py-4 text-right">Debit</th>
                      <th className="px-6 py-4 text-right">Credit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {reportData.slice(0, 10).map(t => (
                      <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-xs text-slate-500 font-medium">{t.date}</td>
                        <td className="px-6 py-4 text-xs font-bold text-slate-800">{t.particulars}</td>
                        <td className="px-6 py-4 text-right text-xs font-bold text-rose-500 financial-number">
                          {t.amount < 0 ? `৳${Math.abs(t.amount).toLocaleString()}` : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-xs font-bold text-emerald-500 financial-number">
                          {t.amount > 0 ? `৳${t.amount.toLocaleString()}` : '-'}
                        </td>
                      </tr>
                    ))}
                    {reportData.length > 10 && (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-xs text-slate-400 font-medium bg-slate-50/30">
                          + {reportData.length - 10} more transactions in full report
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h4 className="text-lg font-bold text-slate-800 mb-6">Summary Metrics</h4>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Income</p>
                  <p className="text-2xl font-bold text-emerald-500 financial-number">
                    ৳{reportData.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Total Expenses</p>
                  <p className="text-2xl font-bold text-rose-500 financial-number">
                    ৳{Math.abs(reportData.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)).toLocaleString()}
                  </p>
                </div>
                <div className="pt-6 border-t border-slate-50">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Net Cash Flow</p>
                  <p className={cn(
                    "text-2xl font-bold financial-number",
                    reportData.reduce((s, t) => s + t.amount, 0) >= 0 ? "text-primary" : "text-rose-600"
                  )}>
                    ৳{reportData.reduce((s, t) => s + t.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary p-8 rounded-3xl shadow-lg shadow-primary/20 text-white">
              <div className="flex items-center gap-3 mb-4">
                <PieChart className="w-6 h-6 text-white/80" />
                <h4 className="text-lg font-bold">Quick Tip</h4>
              </div>
              <p className="text-sm text-white/80 leading-relaxed font-medium">
                Your highest spending category this period was {
                  Object.entries(reportData.filter(t => t.amount < 0).reduce((acc, t) => {
                    acc[t.category || 'Other'] = (acc[t.category || 'Other'] || 0) + Math.abs(t.amount);
                    return acc;
                  }, {} as any)).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'N/A'
                }. Consider reviewing these expenses to optimize your budget.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
