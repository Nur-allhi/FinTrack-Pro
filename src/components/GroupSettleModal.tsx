import React from 'react';
import { Loan } from '../types';
import { format } from 'date-fns';
import { cn } from '../utils/cn';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2 } from 'lucide-react';

interface GroupSettleModalProps {
  borrowerDisplay: string;
  totalRemaining: number;
  currency: string;
  activeLoans: Loan[];
  selectedLoanId: number | null;
  setSelectedLoanId: (id: number) => void;
  settleAmount: string;
  setSettleAmount: (v: string) => void;
  settleError: string;
  setSettleError: (v: string) => void;
  onSettle: () => void;
  onCancel: () => void;
  settling: boolean;
  open: boolean;
}

export default function GroupSettleModal({
  borrowerDisplay, totalRemaining, currency, activeLoans,
  selectedLoanId, setSelectedLoanId,
  settleAmount, setSettleAmount, settleError, setSettleError,
  onSettle, onCancel, settling, open,
}: GroupSettleModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
        >
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.95 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="bg-canvas rounded-xl border border-hairline shadow-xl w-full max-w-sm p-6 space-y-4"
          >
            <h4 className="text-base font-normal text-ink">Settle a Loan — {borrowerDisplay}</h4>
            <p className="text-xs text-muted">Total outstanding: <strong className="text-ink">{currency}{totalRemaining.toLocaleString()}</strong></p>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Select which loan to settle</label>
              {activeLoans.map(loan => (
                <button key={loan.id} type="button" onClick={() => { setSelectedLoanId(loan.id); setSettleAmount(String(loan.remaining)); setSettleError(''); }}
                  className={cn(
                    "w-full text-left p-3 rounded-lg border transition-all",
                    selectedLoanId === loan.id
                      ? "border-primary bg-primary/5"
                      : "border-hairline hover:bg-surface-soft"
                  )}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm font-semibold text-ink">{format(new Date(loan.date_given), 'dd MMM yyyy')}</span>
                      <span className="text-xs text-muted ml-2">{currency}{loan.amount.toLocaleString()}</span>
                      {loan.particulars && <div className="text-[10px] text-muted mt-0.5 truncate max-w-[180px]">{loan.particulars}</div>}
                    </div>
                    <span className="text-xs font-bold text-semantic-up financial-number">Rem: {currency}{loan.remaining.toLocaleString()}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Settle Amount</label>
              <input type="text" inputMode="decimal" value={settleAmount}
                onChange={e => { setSettleAmount(e.target.value); setSettleError(''); }}
                className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number" />
              {settleError && <p className="text-xs text-semantic-down font-medium">{settleError}</p>}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button onClick={onCancel}
                className="btn-secondary px-6 py-2.5 text-sm">Cancel</button>
              <button onClick={onSettle} disabled={settling || !selectedLoanId}
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
