import { Transaction } from '../types';

export async function exportReportPDF(
  reportData: Transaction[],
  filters: { startDate: string; endDate: string; accountId: string },
  accounts: { id: number; name: string }[],
  currency: string
) {
  const [{ default: jsPDF }, { drawPageHeader, drawTableHeader, drawFooter, fmtPdfCurrency, sanitizePdfText }] = await Promise.all([
    import('jspdf'),
    import('./pdf'),
  ]);

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
    doc.setTextColor(0, 0, 0);
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
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);

  const lineH = 5;
  const pageBottom = doc.internal.pageSize.getHeight() - 20;

  reportData.forEach((t, idx) => {
    const particWrapped = doc.splitTextToSize(sanitizePdfText(t.particulars), colWidths[1] - 4);
    const cat = t.category || '';
    const catWrapped = cat ? doc.splitTextToSize(cat, colWidths[2] - 4) : [''];
    const numLines = Math.max(particWrapped.length, catWrapped.length);
    const rowH = Math.max(7, numLines * lineH);

    if (y + rowH > pageBottom) {
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
      doc.rect(margin, y, usableW, rowH, 'F');
    }
    let x = margin;
    doc.text(sanitizePdfText(t.date), x + 2, y + 4);
    x += colWidths[0];

    particWrapped.forEach((line: string, li: number) => {
      doc.text(line, x + 2, y + 4 + li * lineH);
    });
    x += colWidths[1];

    catWrapped.forEach((line: string, li: number) => {
      doc.text(line, x + 2, y + 4 + li * lineH);
    });
    x += colWidths[2];

    if (t.amount < 0) {
      doc.text(fm(t.amount), x + colWidths[3] - 2, y + 4, { align: 'right' });
    }
    x += colWidths[3];

    if (t.amount > 0) {
      doc.text(fm(t.amount), x + colWidths[4] - 2, y + 4, { align: 'right' });
    }

    y += rowH;
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

export async function exportReportExcel(
  reportData: Transaction[],
  filters: { startDate: string; endDate: string },
  currency: string
) {
  const XLSX = await import('xlsx');

  const rows = reportData.map(t => ({
    Date: t.date,
    Particulars: t.particulars,
    Category: t.category || '',
    Debit: t.amount < 0 ? Math.abs(t.amount) : '',
    Credit: t.amount > 0 ? t.amount : '',
  }));

  const totalDebit = reportData.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalCredit = reportData.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  rows.push({ Date: '', Particulars: 'Total', Category: '', Debit: totalDebit, Credit: totalCredit });

  const ws = XLSX.utils.json_to_sheet(rows);
  ws['!cols'] = [
    { wch: 12 },
    { wch: 40 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Report');
  XLSX.writeFile(wb, `FinTrack_Report_${filters.startDate}_${filters.endDate}.xlsx`);
}
