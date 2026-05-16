import React from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { format } from 'date-fns';
import { Transaction } from '../types';
import { cn } from '../utils/cn';

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

export default function TransactionCard({
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
        <div className="bg-surface-soft/50 px-4 py-2 border-y border-hairline">
          <p className="text-xs font-bold text-muted uppercase tracking-[0.2em]">
            {format(new Date(tx.date), 'EEEE, MMMM dd, yyyy')}
          </p>
        </div>
      )}
      <motion.div
        layout="position"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onToggleExpand}
        className={cn(
          "px-4 py-3 transition-all cursor-pointer border-b border-hairline",
          isExpanded ? "bg-primary/5" : "bg-canvas hover:bg-surface-soft/30"
        )}
      >
        <div className="flex items-start gap-3">
          <div className={cn("w-2 h-2 rounded-full mt-1.5 shrink-0", isDebit ? 'bg-semantic-down' : 'bg-semantic-up')} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink truncate">{tx.particulars}</p>
              <span className={cn(
                "text-sm font-bold financial-number shrink-0",
                isDebit ? "text-semantic-down" : "text-semantic-up"
              )}>
                {isDebit ? '-' : '+'}{currency}{Math.abs(tx.amount).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-mono font-bold text-muted">{format(new Date(tx.date), 'dd MMM').toUpperCase()}</span>
              <span className={cn(
                "inline-block px-2 py-0.5 rounded-pill text-[10px] font-bold uppercase tracking-wider",
                tx.category ? "bg-surface-strong text-muted" : "bg-amber-50 text-amber-600"
              )}>
                {tx.category || 'PENDING'}
              </span>
            </div>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs font-bold text-muted uppercase tracking-wider">
                Balance: <span className="text-ink font-mono font-bold">{currency}{tx.runningBalance.toLocaleString()}</span>
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
        </div>
      </motion.div>
    </>
  );
}
