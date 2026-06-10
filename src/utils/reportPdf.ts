import { Transaction } from '../types';

export async function exportReportPDF(
  reportData: Transaction[],
  filters: { startDate: string; endDate: string; accountId: string },
  accounts: { id: number; name: string }[],
  currency: string
) {
  const [{ default: jsPDF }, { drawPageHeader, drawFooter, fmtPdfCurrency, sanitizePdfText, drawSummaryDivider }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('./pdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF();
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const usableW = pageW - margin * 2;
  const colWidths = [24, usableW - 24 - 28 - 28 - 28, 28, 28, 28];
  const accountName = filters.accountId ? accounts.find(a => a.id === Number(filters.accountId))?.name : 'All Accounts';
  const fm = (n: number) => fmtPdfCurrency(currency, n);
  const totalDebit = reportData.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalCredit = reportData.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const dateRange = `${filters.startDate} to ${filters.endDate}`;

  const rightEdge = pageW - margin;

  drawPageHeader(doc, 'Financial Report', String(accountName), undefined, dateRange);

  doc.setProperties({
    title: `Financial Report - ${accountName}`,
    author: 'FinTrack Pro',
    subject: 'Financial Report',
  });

  const bodyRows = reportData.map(t => [
    sanitizePdfText(t.date),
    sanitizePdfText(t.particulars),
    sanitizePdfText(t.category || ''),
    t.amount < 0 ? fm(t.amount) : '',
    t.amount > 0 ? fm(t.amount) : '',
  ]);

  autoTable(doc, {
    head: [['Date', 'Particulars', 'Category', 'Debit', 'Credit']],
    body: bodyRows,
    startY: 50,
    margin: { top: 50, bottom: 40 },
    tableWidth: usableW,
    columnStyles: {
      0: { cellWidth: colWidths[0], halign: 'left' },
      1: { cellWidth: colWidths[1], halign: 'left' },
      2: { cellWidth: colWidths[2], halign: 'left' },
      3: { cellWidth: colWidths[3], halign: 'right' },
      4: { cellWidth: colWidths[4], halign: 'right' },
    },
    headStyles: {
      fillColor: [0, 82, 255],
      textColor: 255,
      fontSize: 7.5,
      fontStyle: 'bold',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
    theme: 'grid',
    showHead: 'everyPage',
    didParseCell(data) {
      if (data.section === 'body' && data.column.index === 2) {
        data.cell.styles.textColor = [140, 140, 140];
        data.cell.styles.fontSize = 7.5;
      }
    },
    didDrawPage(data) {
      if (data.pageNumber > 1) {
        doc.setPage(data.pageNumber);
        drawPageHeader(doc, 'Financial Report', String(accountName), undefined, dateRange);
      }
      drawFooter(doc, data.pageNumber);
    },
  });

  const lj = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  const finalY = lj?.finalY ?? 0;
  const lastPage = doc.getNumberOfPages();
  doc.setPage(lastPage);

  const sY = finalY + 4;
  drawSummaryDivider(doc, margin, sY, usableW);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Total:', margin + colWidths[0] + 2, sY + 6);

  const debitX = margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3];
  if (totalDebit > 0) doc.text(fm(totalDebit), debitX - 2, sY + 6, { align: 'right' });
  const creditX = debitX + colWidths[4];
  if (totalCredit > 0) doc.text(fm(totalCredit), creditX - 2, sY + 6, { align: 'right' });

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
