import React from 'react';
import { Edit2, Trash2, RefreshCw, CheckCircle2 } from 'lucide-react';
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
          <td colSpan={6} className="bg-surface-soft px-5 py-2 border-b border-hairline">
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
            <AnimatedBalance value={tx.runningBalance} currency={currency} className="text-sm font-bold" />
          </div>
        </td>
        <td className="px-3 py-2.5 text-right w-20">
          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {deletingId === tx.id ? (
              <>
                <button onClick={(e) => { e.stopPropagation(); onDelete(tx.id); }} className="px-3 py-1.5 bg-semantic-down text-white rounded-pill text-[10px] font-bold">Delete</button>
                <button onClick={(e) => { e.stopPropagation(); setDeletingId(null); }} className="px-3 py-1.5 bg-canvas border border-hairline rounded-pill text-[10px] font-bold">Cancel</button>
              </>
            ) : (
              <>
                <button onClick={(e) => { e.stopPropagation(); onEdit(tx as Transaction); }} className="p-1.5 text-muted hover:text-primary rounded-full hover:bg-primary/5 transition-colors" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={(e) => { e.stopPropagation(); setDeletingId(tx.id); }} className="p-1.5 text-muted hover:text-semantic-down rounded-full hover:bg-semantic-down/5 transition-colors" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </td>
      </motion.tr>
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.tr
            key={`expanded-${tx.id}`}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: 'tween', duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
            style={{ willChange: 'transform, opacity' }}
          >
            <td colSpan={6} className="px-5 py-4 bg-primary/5 border-b border-primary/10">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-6 text-xs text-muted">
                  <span>ID: <span className="font-mono text-ink">#{tx.id}</span></span>
                  {tx.linked_account_name && <span>Pair: <span className="font-mono text-ink">{tx.linked_account_name}</span></span>}
                  {tx.summary && <span className="italic">{tx.summary}</span>}
                </div>
              </div>
            </td>
          </motion.tr>
        )}
      </AnimatePresence>
    </>
  );
});
