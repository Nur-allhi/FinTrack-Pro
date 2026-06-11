import { useRef } from 'react';
import { authService } from '../services/authService';
import { parseCsvTransactions } from '../utils/csvImport';
import { exportLocalData, downloadJson, ExportData } from '../services/exportService';

interface UseProfileDataOptions {
  currency: string;
  accounts: { id: number; name: string }[];
  toast: (msg: string, type: 'success' | 'error') => void;
  onImportData?: (data: ExportData) => void;
}

export function useProfileData({ currency, accounts, toast, onImportData }: UseProfileDataOptions) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    try {
      const data = await exportLocalData();
      downloadJson(data);
      toast('Data exported successfully.', 'success');
    } catch { toast('Failed to export data.', 'error'); }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.members || !data.accounts || !data.data) throw new Error('Invalid format');
      // If callback provided, pass data; otherwise, import directly (legacy)
      if (onImportData) {
        onImportData(data as ExportData);
      } else {
        // Fallback to server import (should not be used in local-first mode)
        const res = await authService.apiFetch('/api/import', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
        });
        if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.error || `Server error (${res.status})`); }
        toast('Data imported. Reloading...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed to import.', 'error'); }
    finally { if (fileInputRef.current) fileInputRef.current.value = ''; }
  };

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const transactions = parseCsvTransactions(text, currency);
      if (transactions.length === 0) throw new Error('No valid transactions found in CSV');
      const defaultAccountId = accounts.length > 0 ? accounts[0].id : 0;
      if (!defaultAccountId) throw new Error('No accounts available. Create an account first.');
      const txsWithAccount = transactions.map(tx => ({ ...tx, account_id: defaultAccountId }));
      const res = await authService.apiFetch('/api/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ transactions: txsWithAccount }),
      });
      if (!res.ok) { const errData = await res.json().catch(() => ({})); throw new Error(errData.error || `Server error (${res.status})`); }
      toast(`Imported ${transactions.length} transactions from CSV.`, 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch (err) { toast(err instanceof Error ? err.message : 'Failed to import CSV.', 'error'); }
    finally { if (csvFileInputRef.current) csvFileInputRef.current.value = ''; }
  };

  const handleClearAll = async () => {
    if (!confirm('This will permanently delete ALL data. Are you sure?')) return;
    if (!confirm('Final confirmation: this cannot be undone. Clear everything?')) return;
    try {
      const res = await authService.apiFetch('/api/export/clear-all', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed');
      localStorage.removeItem('last_sync');
      localStorage.removeItem('dashboardFilter');
      sessionStorage.clear();
      toast('All data cleared. Reloading...', 'success');
      setTimeout(() => window.location.reload(), 1500);
    } catch { toast('Failed to clear data.', 'error'); }
  };

  return { fileInputRef, csvFileInputRef, handleExport, handleImport, handleCsvImport, handleClearAll };
}
