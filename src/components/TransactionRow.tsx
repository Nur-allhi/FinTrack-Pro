import React from 'react';
import { Edit2, Trash2, RefreshCw, CheckCircle2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { Transaction } from '../types';
import { cn } from '../utils/cn';
import AnimatedBalance from './AnimatedBalance';

interface TransactionRowProps {
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

export default React.memo(function TransactionRow({
  tx,
  isNewDate,
  isExpanded,
  onToggleExpand,
  currency,
  deletingId,
  setDeletingId,
  onDelete,
  onEdit
}: TransactionRowProps) {
  const isDebit = tx.amount < 0;

  return (
    <>
      {isNewDate && (
        <tr>
          <td colSpan={5} className="bg-surface-soft px-5 py-2 border-b border-hairline">
            <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">
              {format(new Date(tx.date), 'EEEE, MMMM dd, yyyy')}
            </p>
          </td>
        </tr>
      )}
      <motion.tr
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        layout="position"
        transition={{ type: 'tween', duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        onClick={onToggleExpand}
        style={{ willChange: 'transform, opacity' }}
        className={cn(
          "cursor-pointer transition-all group border-b border-hairline",
          isExpanded ? "bg-primary/5" : "hover:bg-surface-soft/30"
        )}
      >
        <td className="px-5 py-2.5 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full shrink-0", isDebit ? 'bg-semantic-down' : 'bg-semantic-up')} />
          </div>
        </td>
        <td className="px-5 py-2.5 max-w-[250px]">
          <p className={`text-sm font-semibold text-ink ${isExpanded ? '' : 'truncate'}`}>{tx.particulars}</p>
        </td>
        <td className="px-5 py-2.5">
          <span className={cn(
            "inline-block px-2 py-0.5 rounded-pill text-xs font-bold uppercase tracking-wider",
            tx.category ? "bg-surface-strong text-muted" : "bg-amber-50 text-amber-600"
          )}>
            {tx.category || 'PENDING'}
          </span>
        </td>
        <td className="px-5 py-2.5 text-right">
          <span className={cn(
            "text-sm font-bold financial-number",
            isDebit ? "text-semantic-down" : "text-semantic-up"
          )}>
            {isDebit ? '-' : '+'}{currency}{Math.abs(tx.amount).toLocaleString()}
          </span>
        </td>
        <td className="px-5 py-2.5 text-right">
          <div className="flex items-center justify-end gap-1.5">
            {tx.sync_status === 'pending' && (
              <RefreshCw className="w-3 h-3 text-amber-500 shrink-0" aria-label="Pending sync" />
            )}
            {tx.sync_status === 'synced' && (
              <CheckCircle2 className="w-3 h-3 text-semantic-up shrink-0" aria-label="Synced" />
            )}
            {tx.sync_status === 'conflict' && (
              <AlertTriangle className="w-3 h-3 text-semantic-down shrink-0" aria-label="Sync conflict — needs review" />
            )}
            <AnimatedBalance value={tx.runningBalance} currency={currency} className="text-sm font-bold" />
          </div>
        </td>
      </motion.tr>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.tr
            key={`expanded-${tx.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <td colSpan={5} className="px-0 py-0 bg-primary/5 border-b border-primary/10">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                style={{ willChange: 'height, opacity' }}
                className="overflow-hidden"
              >
                <div className="px-5 py-3">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-6 text-xs text-muted">
                      {tx.linked_account_name && <span>Pair: <span className="font-mono text-ink">{tx.linked_account_name}</span></span>}
                      {tx.summary && <span className="italic">{tx.summary}</span>}
                    </div>
                    <div className="flex items-center justify-end">
                      <AnimatePresence mode="wait" initial={false}>
                        {deletingId === tx.id ? (
                          <motion.div
                            key="delete-confirm"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="flex items-center gap-1.5 origin-right"
                          >
                            <button onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }} className="px-3 py-1.5 bg-semantic-down text-white rounded-pill text-[10px] font-bold whitespace-nowrap">Delete</button>
                            <button onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} className="px-3 py-1.5 bg-canvas border border-hairline rounded-pill text-[10px] font-bold whitespace-nowrap">Cancel</button>
                          </motion.div>
                        ) : (
                          <motion.div
                            key="delete-icons"
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                            className="flex items-center gap-1 origin-right"
                          >
                            <button onClick={(e) => { e.stopPropagation(); onEdit(tx as Transaction); }} className="p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit">
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={(e) => { e.stopPropagation(); setDeletingId(tx.id); }} className="p-1.5 text-muted hover:text-semantic-down rounded-full hover:bg-semantic-down/5 transition-colors" title="Delete">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
});
