import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { ExportData, importLocalData, ImportResult } from '../services/exportService';
import { useToast } from './Toast';

interface ImportModalProps {
  open: boolean;
  data: ExportData | null;
  onClose: () => void;
  onImported: () => void;
}

export default function ImportModal({ open, data, onClose, onImported }: ImportModalProps) {
  const { toast } = useToast();
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      onClose();
      setClosing(false);
      setResult(null);
    }, 200);
  };

  const handleImport = async () => {
    if (!data) return;
    setImporting(true);
    try {
      const importResult = await importLocalData(data);
      setResult(importResult);
      if (importResult.errors.length === 0) {
        toast(`Imported ${importResult.imported} records. Skipped ${importResult.skipped} existing.`, 'success');
        setTimeout(() => {
          onImported();
          handleClose();
        }, 1500);
      } else {
        toast(`Import completed with errors: ${importResult.errors.join(', ')}`, 'error');
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Import failed', 'error');
    } finally {
      setImporting(false);
    }
  };

  if (!data) return null;

  const summary = [
    { label: 'Members', count: data.data.members.length },
    { label: 'Accounts', count: data.data.accounts.length },
    { label: 'Transactions', count: data.data.transactions.length },
    { label: 'Loans', count: data.data.loans.length },
    { label: 'Investments', count: data.data.investments.length },
    { label: 'Groups', count: data.data.groups.length },
    { label: 'Budgets', count: data.data.budgets.length },
    { label: 'Recurring', count: data.data.recurring_transactions.length },
  ].filter(item => item.count > 0);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={closing ? { opacity: 0 } : { opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9998] flex items-center justify-center p-4 bg-surface-dark/40 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={closing ? { opacity: 0, y: 40 } : { opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
            className="bg-canvas w-full max-w-[28rem] rounded-xl border border-hairline shadow-2xl"
          >
            <div className="p-6 border-b border-hairline flex items-center justify-between bg-surface-soft/30">
              <h3 className="text-lg font-normal text-ink tracking-tight">Import Data</h3>
              <button onClick={handleClose} className="p-1.5 text-muted hover:text-ink transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {!result ? (
                <>
                  <p className="text-sm text-muted leading-relaxed">
                    This will merge the following data into your local database. Existing records with the same ID will be skipped (local wins).
                  </p>
                  <div className="bg-surface-soft rounded-lg p-4 border border-hairline">
                    <p className="text-xs font-bold text-muted uppercase tracking-wider mb-2">Preview</p>
                    <div className="grid grid-cols-2 gap-2">
                      {summary.map(item => (
                        <div key={item.label} className="flex justify-between text-sm">
                          <span className="text-ink">{item.label}</span>
                          <span className="font-mono text-muted">{item.count}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3 pt-3 border-t border-hairline text-xs text-muted">
                      Exported: {new Date(data.exportedAt).toLocaleString()}
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  {result.errors.length === 0 ? (
                    <div className="flex items-center gap-3 text-semantic-up">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="text-sm font-medium">Import successful</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-semantic-down">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm font-medium">Import completed with errors</span>
                    </div>
                  )}
                  <div className="text-sm text-muted">
                    <p>Imported: {result.imported} records</p>
                    <p>Skipped: {result.skipped} existing records</p>
                    {result.errors.length > 0 && (
                      <div className="mt-2 text-xs text-semantic-down">
                        {result.errors.map((err, i) => <p key={i}>{err}</p>)}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-hairline flex justify-end gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-muted hover:text-ink transition-colors"
                disabled={importing}
              >
                Cancel
              </button>
              {!result && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="btn-primary px-6 py-2 flex items-center gap-2"
                >
                  {importing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Import
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}