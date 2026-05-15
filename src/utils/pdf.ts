import jsPDF from 'jspdf';
import { format } from 'date-fns';

export function drawPageHeader(doc: jsPDF, title: string, subtitle?: string, dateRange?: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(248, 248, 250);
  doc.rect(0, 0, pageW, 38, 'F');
  doc.setDrawColor(0, 82, 255);
  doc.setLineWidth(0.8);
  doc.line(0, 38, pageW, 38);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(0, 82, 255);
  doc.text('FinTrack Pro', margin, 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(80, 80, 80);
  doc.text(title, pageW / 2, 18, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, pageW - margin, 18, { align: 'right' });

  if (subtitle) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    const subtitleText = dateRange ? `${subtitle}  |  ${dateRange}` : subtitle;
    doc.text(subtitleText, margin, 30);
  }
}

export function drawTableHeader(doc: jsPDF, headers: string[], colWidths: number[], yPos: number, leftAlignCount = 2) {
  const margin = 14;
  const pageW = doc.internal.pageSize.getWidth();
  const usableW = pageW - margin * 2;

  doc.setFillColor(0, 82, 255);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.rect(margin, yPos, usableW, 7, 'F');
  let x = margin;
  headers.forEach((h, i) => {
    const align = i < leftAlignCount ? 'left' : 'right';
    doc.text(h, x + (align === 'right' ? colWidths[i] - 3 : 3), yPos + 5, { align });
    x += colWidths[i];
  });
  return yPos + 9;
}

export function drawFooter(doc: jsPDF, pageNum: number) {
  const pageW = doc.internal.pageSize.getWidth();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  doc.text(`Page ${pageNum}`, pageW / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
}

export function fmtPdfCurrency(currency: string, n: number) {
  const loc = 'en-US';
  const pdfCur = /^[\x00-\x7F]+$/.test(currency) ? currency : '';
  return `${pdfCur}${Math.abs(n).toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


