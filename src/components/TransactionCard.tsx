import React from 'react';
import { Edit2, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Transaction } from '../types';
import { cn } from '../utils/cn';
import AnimatedBalance from './AnimatedBalance';

interface TransactionCardProps {
  tx: Transaction & { runningBalance: number };
  isNewDate: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  currency: string;
  deletingId: number | null;
  setDeletingId: (id: number | null) => void;
  onDelete: (id: number) => void;
  onEdit: (tx: Transaction) => void;
}

export default React.memo(function TransactionCard({
  tx,
  isNewDate,
  isExpanded,
  onToggleExpand,
  currency,
  deletingId,
  setDeletingId,
  onDelete,
  onEdit
}: TransactionCardProps) {
  const isDebit = tx.amount < 0;

  return (
    <>
      {isNewDate && (
        <div className="bg-surface-soft px-4 py-2 border-b border-hairline">
          <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">
            {format(new Date(tx.date), 'EEEE, MMMM dd, yyyy')}
          </p>
        </div>
      )}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -12 }}
        transition={{ type: 'tween', duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        onClick={onToggleExpand}
        style={{ willChange: 'transform, opacity' }}
        className={cn(
          "px-4 py-3 transition-all cursor-pointer border-b border-hairline",
          isExpanded ? "bg-primary/5" : "bg-canvas hover:bg-surface-soft/30"
        )}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className={`text-sm font-semibold text-ink ${isExpanded ? '' : 'truncate'}`}>{tx.particulars}</p>
            <span className={cn(
              "text-sm font-bold financial-number shrink-0",
              isDebit ? "text-semantic-down" : "text-semantic-up"
            )}>
              {isDebit ? '-' : '+'}{currency}{Math.abs(tx.amount).toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className={cn(
              "inline-block px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider",
              tx.category ? "bg-surface-strong text-muted" : "bg-amber-50 text-amber-600"
            )}>
              {tx.category || 'PENDING'}
            </span>
          </div>
          <AnimatePresence initial={false}>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
                style={{ willChange: 'transform, opacity' }}
                className="overflow-hidden"
              >
                <div className="mt-2 pt-2 border-t border-hairline space-y-1">
                  {tx.linked_account_name && (
                    <span className="text-xs font-bold text-muted uppercase tracking-wider">Pair: <span className="font-mono text-ink">{tx.linked_account_name}</span></span>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted uppercase tracking-wider flex items-center gap-1.5">
                      {tx.sync_status === 'pending' && <RefreshCw className="w-3 h-3 text-amber-500" aria-label="Pending sync" />}
                      {tx.sync_status === 'synced' && <CheckCircle2 className="w-3 h-3 text-semantic-up" aria-label="Synced" />}
                      Balance: <AnimatedBalance value={tx.runningBalance} currency={currency} className="font-mono font-bold text-xs" />
                    </span>
                  <div className="flex items-center gap-1">
                    {deletingId === tx.id ? (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }} className="px-3 py-1 bg-semantic-down text-white rounded-pill text-[10px] font-bold">Delete</button>
                        <button onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} className="px-3 py-1 bg-canvas border border-hairline rounded-pill text-[10px] font-bold">Cancel</button>
                      </>
                    ) : (
                      <>
                        <button onClick={(e) => { e.stopPropagation(); onEdit(tx as Transaction); }} className="p-1 text-muted hover:text-primary transition-colors" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); setDeletingId(tx.id); }} className="p-1 text-muted hover:text-semantic-down transition-colors" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </>
  );
});
