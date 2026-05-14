import React, { useState } from 'react';
import { Account, Member, Transaction } from '../types';
import { 
  FileText, 
  Download, 
  Loader2,
  PieChart
} from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { cn } from '../utils/cn';
import Select from './Select';

interface ReportGeneratorProps {
  accounts: Account[];
  members: Member[];
  currency: string;
}

export default function ReportGenerator({ accounts, members, currency }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
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
      const memberAccountIds = filters.memberId
        ? accounts.filter(a => a.member_id === Number(filters.memberId)).map(a => a.id)
        : null;
      let allTxs: Transaction[] = [];
      
      if (filters.accountId) {
        const res = await fetch(`/api/transactions/${filters.accountId}`);
        allTxs = await res.json();
      } else {
        const targetAccounts = memberAccountIds
          ? accounts.filter(a => memberAccountIds.includes(a.id))
          : accounts;
        const promises = targetAccounts.map(a => fetch(`/api/transactions/${a.id}`).then(r => r.json()));
        const results = await Promise.all(promises);
        allTxs = results.flat();
      }

      const filtered = allTxs.filter(tx => {
        const date = new Date(tx.date);
        return date >= new Date(filters.startDate) && date <= new Date(filters.endDate);
      });

      setReportData(filtered);
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
    doc.setTextColor(0, 82, 255); // Coinbase Blue
    doc.text('FinTrack Pro - Financial Report', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(124, 130, 138); // Muted
    doc.text(`Period: ${filters.startDate} to ${filters.endDate}`, 14, 32);
    doc.text(`Account: ${accountName}`, 14, 38);

    let y = 50;

    (doc as any).autoTable({
      startY: y + 10,
      head: [['Date', 'Particulars', 'Category', 'Debit', 'Credit']],
      body: reportData.map(t => [
        t.date,
        t.particulars,
        t.category || '-',
        t.amount < 0 ? `${currency}${Math.abs(t.amount).toLocaleString()}` : '-',
        t.amount > 0 ? `${currency}${t.amount.toLocaleString()}` : '-'
      ]),
      headStyles: { fillColor: [0, 82, 255] },
      alternateRowStyles: { fillColor: [247, 247, 247] }
    });

    doc.save(`FinTrack_Report_${filters.startDate}_${filters.endDate}.pdf`);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="card-xl">
        <div className="flex items-center gap-3 md:gap-6 mb-6 md:mb-8">
          <div className="p-2 md:p-4 bg-primary/5 rounded-full border border-primary/10">
            <FileText className="w-5 md:w-8 h-5 md:h-8 text-primary" />
          </div>
          <div>
            <h3 className="text-lg md:text-2xl lg:text-3xl font-normal text-ink tracking-tight">Reports</h3>
            <p className="text-xs md:text-sm text-muted font-medium">Generate financial reports.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="space-y-1 md:space-y-2">
            <label className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Start</label>
            <input type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})}
              className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary outline-none text-xs md:text-sm font-medium" />
          </div>
          <div className="space-y-1 md:space-y-2">
            <label className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">End</label>
            <input type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})}
              className="w-full px-4 md:px-5 py-2.5 md:py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary outline-none text-xs md:text-sm font-medium" />
          </div>
          <div className="space-y-1 md:space-y-2">
            <label className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Account</label>
            <Select
              value={filters.accountId}
              onChange={v => setFilters({...filters, accountId: v})}
              options={[
                { value: '', label: 'All Accounts' },
                ...accounts.map(a => ({ value: String(a.id), label: a.name }))
              ]}
            />
          </div>
          <div className="flex items-end">
            <button onClick={generateReport} disabled={loading}
              className="btn-primary w-full text-xs md:text-sm px-4 py-2.5 md:py-3.5">
              {loading ? <Loader2 className="w-4 md:w-5 h-4 md:h-5 animate-spin" /> : <FileText className="w-4 md:w-5 h-4 md:h-5" />}
              Generate
            </button>
          </div>
        </div>
      </div>

      {reportData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            <div className="bg-canvas border border-hairline rounded-xl shadow-sm overflow-x-auto">
              <div className="p-4 md:p-5 border-b border-hairline flex items-center justify-between bg-surface-soft/30">
                <h4 className="text-xs md:text-sm font-normal text-ink tracking-tight">Transaction Ledger</h4>
                <button onClick={exportPDF} className="btn-pill text-[10px] md:text-xs px-3 md:px-4 py-1.5 md:py-2">
                  <Download className="w-3 md:w-4 h-3 md:h-4" />
                  Export PDF
                </button>
              </div>
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-surface-soft/50 text-muted text-[10px] font-bold uppercase tracking-[0.2em]">
                    <th className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap">Date</th>
                    <th className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap">Memo</th>
                    <th className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap text-right">Debit</th>
                    <th className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {reportData.slice(0, 10).map(t => (
                    <tr key={t.id} className="hover:bg-surface-soft/30 transition-colors">
                      <td className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap text-[10px] md:text-xs text-muted font-medium">{t.date}</td>
                      <td className="px-4 md:px-5 py-2.5 md:py-3 text-[10px] md:text-xs font-semibold text-ink">{t.particulars}</td>
                      <td className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap text-right text-[10px] md:text-xs font-bold text-semantic-down financial-number">
                        {t.amount < 0 ? `${currency}${Math.abs(t.amount).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap text-right text-[10px] md:text-xs font-bold text-semantic-up financial-number">
                        {t.amount > 0 ? `${currency}${t.amount.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                  {reportData.length > 10 && (
                    <tr>
                      <td colSpan={4} className="px-4 md:px-5 py-3 text-center text-[10px] text-muted font-bold uppercase tracking-widest bg-surface-soft/10">
                        + {reportData.length - 10} more
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:col-span-1 space-y-4 md:space-y-6">
            <div className="card-xl">
              <h4 className="text-sm md:text-base font-normal text-ink uppercase tracking-tight mb-4 md:mb-6">Summary</h4>
              <div className="space-y-3 md:space-y-4">
                <div className="p-4 md:p-5 bg-surface-soft rounded-xl border border-hairline">
                  <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Inflow</p>
                  <p className="text-lg md:text-2xl font-bold text-semantic-up financial-number mt-1">
                    {currency}{reportData.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 md:p-5 bg-surface-soft rounded-xl border border-hairline">
                  <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Outflow</p>
                  <p className="text-lg md:text-2xl font-bold text-semantic-down financial-number mt-1">
                    {currency}{Math.abs(reportData.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 md:p-5 bg-surface-soft rounded-xl border border-primary/20">
                  <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Net</p>
                  <p className={cn("text-lg md:text-2xl font-bold financial-number mt-1", reportData.reduce((s, t) => s + t.amount, 0) >= 0 ? "text-primary" : "text-semantic-down")}>
                    {currency}{reportData.reduce((s, t) => s + t.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary p-6 md:p-8 lg:p-10 rounded-xl shadow-2xl shadow-primary/20 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <PieChart className="w-8 h-8 text-white/90" />
                  <h4 className="text-xl font-normal tracking-tight">Audit Insight</h4>
                </div>
                <p className="text-base text-white/80 leading-relaxed font-medium mb-4 italic">
                  "Your primary spending node this cycle was {
                    Object.entries(reportData.filter(t => t.amount < 0).reduce((acc, t) => {
                      acc[t.category || 'Other'] = (acc[t.category || 'Other'] || 0) + Math.abs(t.amount);
                      return acc;
                    }, {} as any)).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || 'Uncategorized'
                  }. Strategic optimization recommended."
                </p>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
