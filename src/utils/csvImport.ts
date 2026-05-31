import Papa from 'papaparse';
import { Transaction } from '../types';

interface CsvRow {
  Date: string;
  Particulars: string;
  Category: string;
  Debit: string;
  Credit: string;
}

function parseCurrencyValue(val: string, currency: string): number {
  const cleaned = val.replace(/[^\d.\-]/g, '');
  const num = parseFloat(cleaned);
  if (isNaN(num)) return 0;
  return num;
}

export function parseCsvTransactions(csvText: string, currency: string): Omit<Transaction, 'id' | 'user_id'>[] {
  const result = Papa.parse<CsvRow>(csvText, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h: string) => h.trim(),
  });

  if (result.errors.length > 0) {
    throw new Error(`CSV parse error: ${result.errors[0].message}`);
  }

  return result.data
    .filter(row => row.Date && (row.Debit || row.Credit))
    .map(row => {
      const debit = parseCurrencyValue(row.Debit || '', currency);
      const credit = parseCurrencyValue(row.Credit || '', currency);
      const amount = credit > 0 ? credit : -debit;

      return {
        account_id: 0,
        date: row.Date.trim(),
        particulars: row.Particulars?.trim() || '',
        category: row.Category?.trim() || null,
        amount,
        type: 'normal' as const,
      };
    });
}
