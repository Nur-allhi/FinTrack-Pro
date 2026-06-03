import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface SettleModalProps {
  borrowerName: string;
  amount: number;
  remaining: number;
  currency: string;
  settleAmount: string;
  setSettleAmount: (v: string) => void;
  settleError: string;
  setSettleError: (v: string) => void;
  onSettle: () => void;
  onCancel: () => void;
  settling: boolean;
  open: boolean;
}

export default function SettleModal({
  borrowerName, amount, remaining, currency,
  settleAmount, setSettleAmount, settleError, setSettleError,
  onSettle, onCancel, settling, open,
}: SettleModalProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            onClick={e => e.stopPropagation()}
            className="bg-canvas rounded-xl border border-hairline shadow-xl w-full max-w-[24rem] p-6 space-y-4"
          >
            <h4 className="text-base font-normal text-ink">Settle Loan</h4>
            <div className="text-sm text-muted space-y-1">
              <p>Borrower: <span className="font-semibold text-ink">{borrowerName}</span></p>
              <p>Original: <span className="font-semibold text-ink">{currency}{amount.toLocaleString()}</span></p>
              <p>Remaining: <span className="font-semibold text-ink">{currency}{remaining.toLocaleString()}</span></p>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Amount to Settle</label>
              <input type="text" inputMode="decimal" value={settleAmount}
                onChange={e => { setSettleAmount(e.target.value); setSettleError(''); }}
                className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
              {settleError && <p className="text-xs text-semantic-down font-medium">{settleError}</p>}
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onCancel}
                className="btn-secondary px-6 py-2.5 text-sm">Cancel</button>
              <button onClick={onSettle} disabled={settling}
                className="btn-primary px-6 py-2.5 text-sm">
                {settling ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Settle'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
