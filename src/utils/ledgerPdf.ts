import { Transaction, Account } from '../types';
import { format } from 'date-fns';

export const exportLedgerPDF = async (
  txs: (Transaction & { runningBalance: number })[],
  account: Account,
  currency: string,
  dateRange?: string
) => {
  const [{ default: jsPDF }, { drawPageHeader, drawFooter, fmtPdfCurrency, sanitizePdfText }, { autoTable }] = await Promise.all([
    import('jspdf'),
    import('./pdf'),
    import('jspdf-autotable'),
  ]);

  const doc = new jsPDF();
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const usableW = pageW - margin * 2;

  const colDate = 22;
  const colCat = 20;
  const colAmt = 30;
  const colBal = 28;
  const colParticulars = usableW - colDate - colCat - colAmt - colAmt - colBal;

  const fm = (n: number) => fmtPdfCurrency(currency, n);
  const txsAsc = [...txs].reverse();
  const totalDebit = txsAsc.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalCredit = txsAsc.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const closingBal = txsAsc.length > 0 ? txsAsc[txsAsc.length - 1].runningBalance : account.initial_balance;

  const subtitleParts = [account.name, account.member_name, account.type.replace(/_/g, ' ')].filter(Boolean);
  const subtitle = subtitleParts.join(' · ');
  const rightEdge = pageW - margin;

  drawPageHeader(doc, 'Account Statement', subtitle);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  if (dateRange) doc.text(dateRange, rightEdge, 26, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`Opening: ${fm(account.initial_balance)}`, rightEdge, 33, { align: 'right' });
  doc.text(`Closing: ${fm(closingBal)}`, rightEdge, 40, { align: 'right' });

  doc.setProperties({
    title: `Account Statement - ${account.name}`,
    author: 'FinTrack Pro',
    subject: 'Account Statement',
  });

  const bodyRows = txsAsc.map(t => [
    sanitizePdfText(format(new Date(t.date), 'dd MMM yyyy')),
    sanitizePdfText(t.particulars),
    sanitizePdfText(t.category || ''),
    t.amount < 0 ? fm(t.amount) : '',
    t.amount > 0 ? fm(t.amount) : '',
    fm(t.runningBalance),
  ]);

  autoTable(doc, {
    head: [['Date', 'Particulars', 'Category', 'Debit', 'Credit', 'Balance']],
    body: bodyRows,
    startY: 50,
    margin: { top: 50, bottom: 40 },
    tableWidth: usableW,
    columnStyles: {
      0: { cellWidth: colDate, halign: 'left' },
      1: { cellWidth: colParticulars, halign: 'left' },
      2: { cellWidth: colCat, halign: 'left' },
      3: { cellWidth: colAmt, halign: 'right' },
      4: { cellWidth: colAmt, halign: 'right' },
      5: { cellWidth: colBal, halign: 'right', fontStyle: 'bold' },
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
        drawPageHeader(doc, 'Account Statement', subtitle);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(140, 140, 140);
        if (dateRange) doc.text(dateRange, rightEdge, 26, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.text(`Opening: ${fm(account.initial_balance)}`, rightEdge, 33, { align: 'right' });
        doc.text(`Closing: ${fm(closingBal)}`, rightEdge, 40, { align: 'right' });
      }
      drawFooter(doc, data.pageNumber);
    },
  });

  const lj = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable;
  const finalY = lj?.finalY ?? 0;
  const lastPage = doc.getNumberOfPages();
  doc.setPage(lastPage);

  const sY = finalY + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 0, 0);
  doc.text('Total:', margin + colDate + 2, sY + 6);

  let tx = margin + colDate + colParticulars + colCat + colAmt;
  if (totalDebit > 0) doc.text(fm(totalDebit), tx - 2, sY + 6, { align: 'right' });
  tx += colAmt;
  if (totalCredit > 0) doc.text(fm(totalCredit), tx - 2, sY + 6, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('Closing Balance', margin + 2, sY + 16);
  doc.text(fm(closingBal), margin + usableW - 2, sY + 16, { align: 'right' });

  doc.save(`${account.name.replace(/\s+/g, '_')}_statement.pdf`);
};
