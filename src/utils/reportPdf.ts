import { Transaction } from '../types';
import jsPDF from 'jspdf';
import { drawPageHeader, drawTableHeader, drawFooter, fmtPdfCurrency } from './pdf';

export function exportReportPDF(
  reportData: Transaction[],
  filters: { startDate: string; endDate: string; accountId: string },
  accounts: { id: number; name: string }[],
  currency: string
) {
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
}

export function exportReportCSV(
  reportData: Transaction[],
  filters: { startDate: string; endDate: string },
  currency: string
) {
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
}
