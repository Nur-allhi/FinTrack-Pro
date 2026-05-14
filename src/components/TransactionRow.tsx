import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { Transaction } from '../types';
import { cn } from '../utils/cn';

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

export default function TransactionRow({
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
          <td colSpan={5} className="px-5 py-2 bg-surface-soft/50">
            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">
              {format(new Date(tx.date), 'EEEE, MMMM dd, yyyy')}
            </p>
          </td>
        </tr>
      )}
      <motion.tr
        layout="position"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onToggleExpand}
        className={cn(
          "cursor-pointer transition-all group border-b border-hairline",
          isExpanded ? "bg-primary/5" : "hover:bg-surface-soft/30"
        )}
      >
        <td className="px-5 py-2.5 whitespace-nowrap">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full shrink-0", isDebit ? 'bg-semantic-down' : 'bg-semantic-up')} />
            <span className="text-xs font-mono font-bold text-muted">{format(new Date(tx.date), 'dd MMM').toUpperCase()}</span>
          </div>
        </td>
        <td className="px-5 py-2.5 max-w-[250px]">
          <p className="text-sm font-semibold text-ink truncate">{tx.particulars}</p>
        </td>
        <td className="px-5 py-2.5">
          <span className={cn(
            "inline-block px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider",
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
          <span className="text-sm font-bold text-ink financial-number">{currency}{tx.runningBalance.toLocaleString()}</span>
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
      {isExpanded && (
        <motion.tr
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <td colSpan={6} className="px-5 py-4 bg-primary/5 border-b border-primary/10">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-6 text-xs text-muted">
                <span>ID: <span className="font-mono text-ink">#{tx.id}</span></span>
                {tx.linked_transaction_id && <span>Linked: <span className="font-mono text-ink">#{tx.linked_transaction_id}</span></span>}
                {tx.summary && <span className="italic">{tx.summary}</span>}
              </div>
            </div>
          </td>
        </motion.tr>
      )}
    </>
  );
}
