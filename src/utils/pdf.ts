import type { jsPDF } from 'jspdf';
import { format } from 'date-fns';

export function drawPageHeader(doc: jsPDF, title: string, subtitle?: string, dateRange?: string, rightText?: string) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;

  doc.setFillColor(248, 248, 250);
  doc.rect(0, 0, pageW, 48, 'F');
  doc.setDrawColor(0, 82, 255);
  doc.setLineWidth(0.8);
  doc.line(0, 48, pageW, 48);
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
    doc.text(subtitleText, margin, 32);
  }

  if (rightText) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text(rightText, pageW - margin, 32, { align: 'right' });
  }
}

export function drawFooter(doc: jsPDF, pageNum: number, totalPages?: number) {
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 14;
  const usableW = pageW - margin * 2;
  const fy = doc.internal.pageSize.getHeight() - 10;

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, fy - 4, margin + usableW, fy - 4);
  doc.setLineWidth(0.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  const pageText = totalPages ? `Page ${pageNum} of ${totalPages}` : `Page ${pageNum}`;
  doc.text(pageText, pageW / 2, fy, { align: 'center' });
}

export function drawSummaryDivider(doc: jsPDF, x: number, y: number, w: number) {
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.6);
  doc.line(x, y, x + w, y);
  doc.setLineWidth(0.2);
}

export function fmtPdfCurrency(currency: string, n: number) {
  const loc = 'en-US';
  const pdfCur = /^[\x00-\x7F]+$/.test(currency) ? currency : '';
  return `${pdfCur}${Math.abs(n).toLocaleString(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const unicodeMap: Record<string, string> = {
  '\u2192': ' -> ',
  '\u2013': '-',
  '\u2014': '--',
  '\u2018': "'",
  '\u2019': "'",
  '\u201c': '"',
  '\u201d': '"',
  '\u2026': '...',
  '\u00a0': ' ',
};

export function sanitizePdfText(text: string): string {
  let result = '';
  for (const ch of text) {
    if (ch.charCodeAt(0) < 128) {
      result += ch;
    } else {
      result += unicodeMap[ch] ?? '?';
    }
  }
  return result;
}
