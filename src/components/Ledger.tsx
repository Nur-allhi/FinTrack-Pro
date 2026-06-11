import React, { useState } from 'react';
import { Account, Transaction, WriteOperation } from '../types';
import { 
  ArrowLeft, 
  Download, 
  Loader2,
  Plus,
  SlidersHorizontal
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import AnimatedBalance from './AnimatedBalance';
import { format } from 'date-fns';
import { exportLedgerPDF } from '../utils/ledgerPdf';
import { useToast } from './Toast';
import Select from './Select';

import TransactionRow from './TransactionRow';
import TransactionCard from './TransactionCard';
import LedgerToolbar, { LedgerDesktopToolbar } from './LedgerToolbar';
import { useTransactions } from '../hooks/useTransactions';

interface LedgerProps {
  account: Account;
  onBack: () => void;
  onWriteOperation: (op: WriteOperation) => void;
  currency: string;
}

export default function Ledger({ account, onBack, onWriteOperation, currency }: LedgerProps) {
  const { toast } = useToast();
  const { transactions, loading, addOrUpdateTransaction, deleteTransaction } = useTransactions(account);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [dateView, setDateView] = useState<'all' | 'month' | 'date' | 'range'>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [dateRangeStart, setDateRangeStart] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [dateRangeEnd, setDateRangeEnd] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  const handleDelete = async (id: number) => {
    setDeletingId(null);
    await deleteTransaction(id);
  };

  const txsWithBalance = [...transactions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.created_at || '').localeCompare(b.created_at || ''))
    .reduce((acc, tx) => {
      const prevBal = acc.length > 0 ? acc[acc.length - 1].runningBalance : Number(account.initial_balance);
      acc.push({ ...tx, runningBalance: prevBal + Number(tx.amount) });
      return acc;
    }, [] as (Transaction & { runningBalance: number })[])
    .reverse();

  const currentBalance = account.current_balance != null
    ? Number(account.current_balance)
    : (txsWithBalance.length > 0
        ? txsWithBalance[0].runningBalance
        : Number(account.initial_balance));

  const categoryCounts = transactions.reduce<Record<string, number>>((acc, tx) => {
    const cat = tx.category || 'Uncategorized';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const availableCategories = Object.keys(categoryCounts).sort((a, b) =>
    categoryCounts[b] - categoryCounts[a]
  );

  const dateFilteredTxs = txsWithBalance.filter(tx => {
    if (dateView === 'all') return true;
    if (dateView === 'month') return tx.date.startsWith(selectedMonth);
    if (dateView === 'date') return tx.date === selectedDate;
    if (dateView === 'range') return tx.date >= dateRangeStart && tx.date <= dateRangeEnd;
    return true;
  });

  const filteredTxs = categoryFilter
    ? dateFilteredTxs.filter(tx => (tx.category || 'Uncategorized') === categoryFilter)
    : dateFilteredTxs;

  const toolbarProps = {
    dateView, setDateView,
    selectedMonth, setSelectedMonth,
    selectedDate, setSelectedDate,
    dateRangeStart, setDateRangeStart,
    dateRangeEnd, setDateRangeEnd,
    categoryFilter, setCategoryFilter,
    availableCategories, categoryCounts,
    dateFilteredCount: dateFilteredTxs.length,
    showFilters, setShowFilters,
    onAdd: () => onWriteOperation({ type: 'transaction', prefillAccountId: account.id }),
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-canvas border border-hairline shadow-lg hover:shadow-xl transition-shadow text-muted hover:text-ink">
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
        </button>
          <button onClick={() => {
            const dates = filteredTxs.map(t => t.date).filter(Boolean).sort();
            const dateRange = dates.length > 1 ? `${dates[dates.length - 1]} to ${dates[0]}` : undefined;
            exportLedgerPDF(filteredTxs, account, currency, dateRange);
          }} className="w-9 h-9 md:w-11 md:h-11 flex items-center justify-center rounded-full bg-canvas border border-hairline shadow-lg hover:shadow-xl transition-shadow text-muted hover:text-ink">
          <Download className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      <div className="rounded-xl border border-hairline overflow-hidden" aria-label="Transaction Ledger">
        <div className="p-4 md:p-5 bg-primary/5 rounded-t-xl">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base md:text-xl font-normal text-ink tracking-tight">{account.name}</h3>
              <p className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">{account.type.replace('_', ' ')}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 md:gap-2 justify-end mb-0.5 md:mb-1">
                <p className="hidden md:block text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Balance</p>
              </div>
              <p className="text-xl md:text-3xl font-normal tracking-tighter">
                <AnimatedBalance value={currentBalance} currency={currency} />
              </p>
            </div>
          </div>
          <div className="md:hidden flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`-ml-1 px-3 py-1.5 rounded-pill text-[10px] font-bold uppercase tracking-wider transition-all ${
                showFilters || dateView !== 'all' || categoryFilter ? 'bg-primary text-white shadow-sm' : 'bg-surface-soft border border-hairline text-muted'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1" />
              Filters
            </button>
            <button onClick={() => onWriteOperation({ type: 'transaction', prefillAccountId: account.id })} className="btn-primary text-[10px] px-3 py-1.5">
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>
        </div>

        <LedgerDesktopToolbar {...toolbarProps} />

        <LedgerToolbar {...toolbarProps} />

        {filteredTxs.length > 0 && (
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse app-stagger-grid">
            <thead>
              <tr className="bg-surface-soft text-muted text-xs font-bold uppercase tracking-[0.2em] border-b border-hairline">
                <th className="px-4 py-2.5">Date</th>
                <th className="px-4 py-2.5">Particulars</th>
                <th className="px-4 py-2.5">Category</th>
                <th className="px-4 py-2.5 text-right">Amount</th>
                <th className="px-4 py-2.5 text-right">Balance</th>
                <th className="px-4 py-2.5 text-right w-16"></th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredTxs.map((tx, idx) => (
                  <TransactionRow 
                    key={tx.id} tx={tx} isNewDate={!filteredTxs[idx - 1] || filteredTxs[idx - 1].date !== tx.date}
                    isExpanded={expandedId === tx.id} onToggleExpand={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                    currency={currency} deletingId={deletingId} setDeletingId={setDeletingId} onDelete={handleDelete}
                    onEdit={(t) => onWriteOperation({ type: 'transaction', prefillAccountId: account.id, editTx: t })}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        )}

        {filteredTxs.length > 0 && (
        <div className="md:hidden divide-y divide-hairline app-stagger-grid">
          <AnimatePresence initial={false}>
            {filteredTxs.map((tx, idx) => (
              <TransactionCard 
                key={tx.id} tx={tx} isNewDate={!filteredTxs[idx - 1] || filteredTxs[idx - 1].date !== tx.date}
                isExpanded={expandedId === tx.id} onToggleExpand={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                currency={currency} deletingId={deletingId} setDeletingId={setDeletingId} onDelete={handleDelete}
                onEdit={(t) => onWriteOperation({ type: 'transaction', prefillAccountId: account.id, editTx: t })}
              />
            ))}
          </AnimatePresence>
        </div>
        )}
        {loading ? (
          <div className="px-6 md:px-12 py-16 md:py-32 text-center bg-canvas">
            <div className="w-12 md:w-20 h-12 md:h-20 bg-surface-soft rounded-full flex items-center justify-center mx-auto mb-4 md:mb-8 border border-hairline">
              <Loader2 className="w-6 md:w-10 h-6 md:h-10 text-muted animate-spin" />
            </div>
            <p className="text-base md:text-xl font-normal text-ink mb-1 md:mb-2">Loading entries...</p>
          </div>
        ) : filteredTxs.length === 0 && (
          <div className="px-6 md:px-12 py-16 md:py-32 text-center bg-canvas">
            <div className="w-12 md:w-20 h-12 md:h-20 bg-surface-soft rounded-full flex items-center justify-center mx-auto mb-4 md:mb-8 border border-hairline">
              <Plus className="w-6 md:w-10 h-6 md:h-10 text-muted" />
            </div>
            <p className="text-base md:text-xl font-normal text-ink mb-1 md:mb-2">
              {categoryFilter || dateView !== 'all' ? 'No matching records' : 'No records found'}
            </p>
            <p className="text-xs md:text-sm text-muted mb-4 md:mb-8">
              {categoryFilter ? 'Try a different category filter.' : dateView !== 'all' ? 'Try a different date range.' : 'Post your first ledger entry.'}
            </p>
            <button onClick={() => onWriteOperation({ type: 'transaction', prefillAccountId: account.id })} className="btn-secondary text-xs md:text-sm px-5 md:px-8 py-2 md:py-3 mx-auto">Add Transaction</button>
          </div>
        )}
      </div>
    </div>
  );
}
