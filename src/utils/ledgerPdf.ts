import { Transaction, Account } from '../types';
import { format } from 'date-fns';

export const exportLedgerPDF = async (
  txs: (Transaction & { runningBalance: number })[],
  account: Account,
  currency: string,
  dateRange?: string
) => {
  const [{ default: jsPDF }, { drawPageHeader, drawTableHeader, drawFooter, fmtPdfCurrency, sanitizePdfText, drawSummaryDivider }] = await Promise.all([
    import('jspdf'),
    import('./pdf'),
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
  const colWidths = [colDate, colParticulars, colCat, colAmt, colAmt, colBal];
  const headers = ['Date', 'Particulars', 'Category', 'Debit', 'Credit', 'Balance'];

  const fm = (n: number) => fmtPdfCurrency(currency, n);
  const txsAsc = [...txs].reverse();
  const totalDebit = txsAsc.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalCredit = txsAsc.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const closingBal = txsAsc.length > 0 ? txsAsc[txsAsc.length - 1].runningBalance : account.initial_balance;

  let pageNum = 1;

  const subtitleParts = [account.name, account.member_name, account.type.replace(/_/g, ' ')].filter(Boolean);
  const subtitle = subtitleParts.join(' · ');

  drawPageHeader(doc, 'Account Statement', subtitle);

  const rightEdge = pageW - margin;
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

  let y = 52;
  y = drawTableHeader(doc, headers, colWidths, y, 3);

  const lineH = 5;
  const pageBottom = doc.internal.pageSize.getHeight() - 24;

  const drawPageSummary = (yPos: number, isLastPage: boolean) => {
    const sY = yPos + 2;
    const summaryH = isLastPage ? 20 : 10;

    drawSummaryDivider(doc, margin, sY, usableW);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    doc.text('Total:', margin + colDate + 2, sY + 6);

    let x = margin + colDate + colParticulars + colCat;
    x += colAmt;
    if (totalDebit > 0) {
      doc.text(fm(totalDebit), x - 2, sY + 6, { align: 'right' });
    }
    x += colAmt;
    if (totalCredit > 0) {
      doc.text(fm(totalCredit), x - 2, sY + 6, { align: 'right' });
    }

    if (isLastPage) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(0, 0, 0);
      doc.text('Closing Balance', margin + 2, sY + 15);
      doc.text(fm(closingBal), margin + usableW - 2, sY + 15, { align: 'right' });
      return sY + summaryH + 4;
    }
    return sY + summaryH + 2;
  };

  txsAsc.forEach((t, idx) => {
    const particWrapped = doc.splitTextToSize(sanitizePdfText(t.particulars), colWidths[1] - 4);
    const catText = t.category || '';
    const catWrapped = catText ? doc.splitTextToSize(sanitizePdfText(catText), colWidths[2] - 4) : [''];
    const numLines = Math.max(particWrapped.length, catWrapped.length);
    const rowH = Math.max(7, numLines * lineH);

    if (y + rowH > pageBottom) {
      drawPageSummary(y, false);
      drawFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
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
      y = 52;
      y = drawTableHeader(doc, headers, colWidths, y, 3);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7);
      doc.setTextColor(140, 140, 140);
      doc.text('(cont.)', margin + usableW, y - 1, { align: 'right' });
    }

    if (idx % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(margin, y, usableW, rowH, 'F');
    }

    let x = margin;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);
    const dateStr = format(new Date(t.date), 'dd MMM yyyy');
    doc.text(sanitizePdfText(dateStr), x + 2, y + 4);
    x += colWidths[0];

    particWrapped.forEach((line: string, li: number) => {
      doc.text(line, x + 2, y + 4 + li * lineH);
    });
    x += colWidths[1];

    catWrapped.forEach((line: string, li: number) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(140, 140, 140);
      doc.text(line, x + 2, y + 4 + li * lineH);
    });
    x += colWidths[2];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(0, 0, 0);

    if (t.amount < 0) {
      doc.text(fm(t.amount), x + colWidths[3] - 2, y + 4, { align: 'right' });
    }
    x += colWidths[3];

    if (t.amount > 0) {
      doc.text(fm(t.amount), x + colWidths[4] - 2, y + 4, { align: 'right' });
    }
    x += colWidths[4];

    doc.setFont('helvetica', 'bold');
    doc.text(fm(t.runningBalance), x + colWidths[5] - 2, y + 4, { align: 'right' });

    y += rowH;
  });

  y = drawPageSummary(y, true);
  drawFooter(doc, pageNum);
  doc.save(`${account.name.replace(/\s+/g, '_')}_statement.pdf`);
};
