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
import { cn } from '../utils/cn';
import { drawPageHeader, drawTableHeader, drawFooter, fmtPdfCurrency } from '../utils/pdf';
import Select from './Select';
import { authService } from '../services/authService';
import DatePicker from './DatePicker';

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

  const exportCSV = () => {
    const header = 'Date,Particulars,Category,Debit,Credit';
    const rows = reportData.map(t => [
      t.date,
      `"${t.particulars}"`,
      `"${t.category || ''}"`,
      t.amount < 0 ? `${currency}${Math.abs(t.amount).toLocaleString('en-US')}` : '',
      t.amount > 0 ? `${currency}${t.amount.toLocaleString('en-US')}` : ''
    ].join(','));
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FinTrack_Report_${filters.startDate}_${filters.endDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const margin = 14;
    const pageW = doc.internal.pageSize.getWidth();
    const usableW = pageW - margin * 2;
    const colWidths = [24, usableW - 24 - 28 - 28 - 28, 28, 28, 28];
    const headers = ['Date', 'Particulars', 'Category', 'Debit', 'Credit'];
    const accountName = filters.accountId ? accounts.find(a => a.id === Number(filters.accountId))?.name : 'All Accounts';
    const fm = (n: number) => fmtPdfCurrency(currency, n);
    const totalDebit = reportData.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
    const totalCredit = reportData.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const dateRange = `${filters.startDate} to ${filters.endDate}`;

    let pageNum = 1;

    const drawReportSummary = (yPos: number) => {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, yPos + 2, margin + usableW, yPos + 2);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(60, 60, 60);
      const partsX = margin + colWidths[0];
      doc.text('Total:', partsX + 2, yPos + 8);
      const debitX = margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3];
      if (totalDebit > 0) doc.text(fm(totalDebit), debitX - 2, yPos + 8, { align: 'right' });
      const creditX = debitX + colWidths[4];
      if (totalCredit > 0) doc.text(fm(totalCredit), creditX - 2, yPos + 8, { align: 'right' });
    };

    drawPageHeader(doc, 'Financial Report', String(accountName), dateRange);

    let y = 44;
    y = drawTableHeader(doc, headers, colWidths, y, 3);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(60, 60, 60);

    reportData.forEach((t, idx) => {
      if (y + 6 > doc.internal.pageSize.getHeight() - 20) {
        drawReportSummary(y);
        drawFooter(doc, pageNum);
        doc.addPage();
        pageNum++;
        drawPageHeader(doc, 'Financial Report', String(accountName), dateRange);
        y = 44;
        y = drawTableHeader(doc, headers, colWidths, y, 3);
      }
      if (idx % 2 === 0) {
        doc.setFillColor(252, 252, 252);
        doc.rect(margin, y, usableW, 6, 'F');
      }
      let x = margin;
      const cat = t.category || '';
      const cells: { text: string; align: 'left' | 'right' }[] = [
        { text: t.date, align: 'left' },
        { text: t.particulars, align: 'left' },
        { text: cat.length > 16 ? cat.slice(0, 14) + '..' : cat, align: 'left' },
        { text: t.amount < 0 ? fm(t.amount) : '', align: 'right' },
        { text: t.amount > 0 ? fm(t.amount) : '', align: 'right' }
      ];
      cells.forEach((cell, ci) => {
        doc.text(cell.text, x + (cell.align === 'right' ? colWidths[ci] - 2 : 2), y + 4, { align: cell.align });
        x += colWidths[ci];
      });
      y += 6;
    });

    if (reportData.length > 0) drawReportSummary(y);
    drawFooter(doc, pageNum);
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
            <DatePicker value={filters.startDate} onChange={v => setFilters({...filters, startDate: v})} />
          </div>
          <div className="space-y-1 md:space-y-2">
            <label className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">End</label>
            <DatePicker value={filters.endDate} onChange={v => setFilters({...filters, endDate: v})} />
          </div>
          <div className="space-y-1 md:space-y-2">
            <label className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Account</label>
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
                  <button onClick={exportCSV} className="btn-pill text-[10px] md:text-xs px-3 md:px-4 py-1.5 md:py-2">
                    <Download className="w-3 md:w-4 h-3 md:h-4" />
                    CSV
                  </button>
                  <button onClick={exportPDF} className="btn-pill text-[10px] md:text-xs px-3 md:px-4 py-1.5 md:py-2">
                    <Download className="w-3 md:w-4 h-3 md:h-4" />
                    PDF
                  </button>
                </div>
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
                  {(showAll ? reportData : reportData.slice(0, 10)).map(t => (
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
