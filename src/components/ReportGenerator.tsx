import React, { useState } from 'react';
import { Account, Member, Transaction } from '../types';
import { FileText, Download, Loader2 } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { cn } from '../utils/cn';
import Select from './Select';
import { authService } from '../services/authService';
import DatePicker from './DatePicker';
import { exportReportPDF, exportReportCSV } from '../utils/reportPdf';

interface ReportGeneratorProps {
  accounts: Account[];
  members: Member[];
  currency: string;
}

export default function ReportGenerator({ accounts, members, currency }: ReportGeneratorProps) {
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<Transaction[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [filters, setFilters] = useState({
    startDate: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    endDate: format(endOfMonth(new Date()), 'yyyy-MM-dd'),
    accountId: '',
    memberId: ''
  });

  const generateReport = async () => {
    setLoading(true);
    setShowAll(false);
    try {
      const memberAccountIds = filters.memberId
        ? accounts.filter(a => a.member_id === Number(filters.memberId)).map(a => a.id)
        : null;
      let allTxs: Transaction[] = [];
      
      if (filters.accountId) {
        const res = await authService.apiFetch(`/api/transactions/${filters.accountId}`);
        allTxs = await res.json();
      } else {
        const targetAccounts = memberAccountIds
          ? accounts.filter(a => memberAccountIds.includes(a.id))
          : accounts;
        const promises = targetAccounts.map(a => authService.apiFetch(`/api/transactions/${a.id}`).then(r => r.json()));
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
            <label className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Start</label>
            <DatePicker value={filters.startDate} onChange={v => setFilters({...filters, startDate: v})} />
          </div>
          <div className="space-y-1 md:space-y-2">
            <label className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">End</label>
            <DatePicker value={filters.endDate} onChange={v => setFilters({...filters, endDate: v})} />
          </div>
          <div className="space-y-1 md:space-y-2">
            <label className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Account</label>
            <Select
              value={filters.accountId}
              onChange={v => setFilters({...filters, accountId: v})}
              options={[
                { value: '', label: 'All Accounts' },
                ...accounts.map(a => ({ value: String(a.id), label: a.member_name ? `${a.name} (${a.member_name})` : a.name }))
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
                <div className="flex items-center gap-2">
                  <button onClick={() => exportReportCSV(reportData, filters, currency)} className="btn-pill text-[10px] md:text-xs px-3 md:px-4 py-1.5 md:py-2">
                    <Download className="w-3 md:w-4 h-3 md:h-4" />
                    CSV
                  </button>
                  <button onClick={() => exportReportPDF(reportData, filters, accounts, currency)} className="btn-pill text-[10px] md:text-xs px-3 md:px-4 py-1.5 md:py-2">
                    <Download className="w-3 md:w-4 h-3 md:h-4" />
                    PDF
                  </button>
                </div>
              </div>
              <table className="w-full text-left border-collapse min-w-[400px]">
                <thead>
                  <tr className="bg-surface-soft/50 text-muted text-xs font-bold uppercase tracking-[0.2em]">
                    <th className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap">Date</th>
                    <th className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap">Memo</th>
                    <th className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap text-right">Debit</th>
                    <th className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap text-right">Credit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {(showAll ? reportData : reportData.slice(0, 10)).map(t => (
                    <tr key={t.id} className="hover:bg-surface-soft/30 transition-colors">
                      <td className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap text-xs text-muted font-medium">{t.date}</td>
                      <td className="px-4 md:px-5 py-2.5 md:py-3 text-xs font-semibold text-ink">{t.particulars}</td>
                      <td className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap text-right text-xs font-bold text-semantic-down financial-number">
                        {t.amount < 0 ? `${currency}${Math.abs(t.amount).toLocaleString()}` : '-'}
                      </td>
                      <td className="px-4 md:px-5 py-2.5 md:py-3 whitespace-nowrap text-right text-xs font-bold text-semantic-up financial-number">
                        {t.amount > 0 ? `${currency}${t.amount.toLocaleString()}` : '-'}
                      </td>
                    </tr>
                  ))}
                  {reportData.length > 10 && !showAll && (
                    <tr>
                      <td colSpan={4} className="px-4 md:px-5 py-3 text-center">
                        <button onClick={() => setShowAll(true)} className="text-[10px] text-primary font-bold uppercase tracking-widest hover:underline">
                          + Show all {reportData.length} transactions
                        </button>
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
                  <p className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Inflow</p>
                  <p className="text-lg md:text-2xl font-bold text-semantic-up financial-number mt-1">
                    {currency}{reportData.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 md:p-5 bg-surface-soft rounded-xl border border-hairline">
                  <p className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Outflow</p>
                  <p className="text-lg md:text-2xl font-bold text-semantic-down financial-number mt-1">
                    {currency}{Math.abs(reportData.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0)).toLocaleString()}
                  </p>
                </div>
                <div className="p-4 md:p-5 bg-surface-soft rounded-xl border border-primary/20">
                  <p className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Net</p>
                  <p className={cn("text-lg md:text-2xl font-bold financial-number mt-1", reportData.reduce((s, t) => s + t.amount, 0) >= 0 ? "text-primary" : "text-semantic-down")}>
                    {currency}{reportData.reduce((s, t) => s + t.amount, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-primary p-6 md:p-8 lg:p-10 rounded-xl shadow-2xl shadow-primary/20 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <FileText className="w-8 h-8 text-white/90" />
                  <h4 className="text-xl font-normal tracking-tight">Audit Insight</h4>
                </div>
                <p className="text-base text-white/80 leading-relaxed font-medium mb-4 italic">
                  "Your primary spending node this cycle was {
                    Object.entries(reportData.filter(t => t.amount < 0).reduce((acc, t) => {
                      acc[t.category || 'Other'] = (acc[t.category || 'Other'] || 0) + Math.abs(t.amount);
                      return acc;
                    }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Uncategorized'
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
