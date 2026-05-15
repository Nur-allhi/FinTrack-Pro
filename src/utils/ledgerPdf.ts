import jsPDF from 'jspdf';
import { Transaction } from '../types';
import { drawPageHeader, drawTableHeader, drawFooter, fmtPdfCurrency } from './pdf';

export const exportLedgerPDF = (
  txs: (Transaction & { runningBalance: number })[],
  accountName: string,
  currency: string,
  initialBalance: number = 0
) => {
  const doc = new jsPDF();
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const usableW = pageW - margin * 2;
  const colDate = 24;
  const colParticulars = usableW - colDate - 34 - 34 - 34;
  const colAmt = 34;
  const colWidths = [colDate, colParticulars, colAmt, colAmt, colAmt];
  const headers = ['Date', 'Particulars', 'Debit', 'Credit', 'Balance'];

  const fm = (n: number) => fmtPdfCurrency(currency, n);
  const txsAsc = [...txs].reverse();
  const totalDebit = txsAsc.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalCredit = txsAsc.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const closingBal = txsAsc.length > 0 ? txsAsc[txsAsc.length - 1].runningBalance : initialBalance;

  let pageNum = 1;

  const drawLedgerSummary = (yPos: number, isLastPage: boolean) => {
    const sY = yPos + 4;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, sY, margin + usableW, sY);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(60, 60, 60);

    const partsX = margin + colDate;
    doc.text('Total:', partsX + 2, sY + 6);

    const debitX = margin + colDate + colParticulars + colAmt;
    if (totalDebit > 0) doc.text(fm(totalDebit), debitX - 2, sY + 6, { align: 'right' });

    const creditX = debitX + colAmt;
    if (totalCredit > 0) doc.text(fm(totalCredit), creditX - 2, sY + 6, { align: 'right' });

    if (isLastPage) {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, sY + 10, margin + usableW, sY + 10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(30, 30, 30);
      doc.text('Closing Balance', partsX + 2, sY + 18);
      doc.text(fm(closingBal), margin + usableW - 2, sY + 18, { align: 'right' });
      return sY + 24;
    }
    return sY + 10;
  };

  drawPageHeader(doc, 'Account Statement', accountName);

  const openingY = 46;
  doc.setFillColor(240, 245, 255);
  doc.rect(margin, openingY, usableW, 11, 'F');
  doc.setDrawColor(200, 215, 240);
  doc.rect(margin, openingY, usableW, 11, 'S');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(60, 60, 60);
  doc.text('Opening Balance', margin + 4, openingY + 7.5);
  doc.setFont('helvetica', 'bold');
  doc.text(fm(initialBalance), margin + usableW - 4, openingY + 7.5, { align: 'right' });

  let y = openingY + 14;
  y = drawTableHeader(doc, headers, colWidths, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(60, 60, 60);

  txsAsc.forEach((t, idx) => {
    if (y + 6 > doc.internal.pageSize.getHeight() - 24) {
      drawLedgerSummary(y, false);
      drawFooter(doc, pageNum);
      doc.addPage();
      pageNum++;
      drawPageHeader(doc, 'Account Statement', accountName);
      y = 44;
      y = drawTableHeader(doc, headers, colWidths, y);
    }
    if (idx % 2 === 0) {
      doc.setFillColor(252, 252, 252);
      doc.rect(margin, y, usableW, 6, 'F');
    }

    const partic = t.particulars.length > 30 ? t.particulars.slice(0, 30) + '...' : t.particulars;
    let x = margin;
    const vals = [t.date, partic, t.amount < 0 ? fm(t.amount) : '', t.amount > 0 ? fm(t.amount) : '', fm(t.runningBalance)];
    const aligns: ('left' | 'right')[] = ['left', 'left', 'right', 'right', 'right'];

    vals.forEach((v, i) => {
      const px = aligns[i] === 'right' ? x + colWidths[i] - 2 : x + 2;
      doc.text(v, px, y + 4, { align: aligns[i] });
      x += colWidths[i];
    });
    y += 6;
  });

  y = drawLedgerSummary(y, true);
  drawFooter(doc, pageNum);
  doc.save(`${accountName.replace(/\s+/g, '_')}_statement.pdf`);
};
