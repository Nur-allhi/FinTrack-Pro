import React, { useState, useEffect } from 'react';
import { Account, Transaction } from '../types';
import { 
  ArrowLeft, 
  Download, 
  Loader2,
  Plus,
  SlidersHorizontal
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { format } from 'date-fns';
import { exportLedgerPDF } from '../utils/ledgerPdf';
import { useToast } from './Toast';
import { authService } from '../services/authService';
import Select from './Select';

import TransactionForm from './TransactionForm';
import TransactionRow from './TransactionRow';
import TransactionCard from './TransactionCard';
import LedgerToolbar, { LedgerDesktopToolbar } from './LedgerToolbar';
import { useTransactions } from '../hooks/useTransactions';

interface LedgerProps {
  account: Account;
  onBack: () => void;
  onUpdate: () => void;
  lastUpdate?: number;
  currency: string;
}

export default function Ledger({ account, onBack, onUpdate, lastUpdate, currency }: LedgerProps) {
  const { toast } = useToast();
  const { transactions, loading, isSyncing, addOrUpdateTransaction, deleteTransaction } = useTransactions(account, lastUpdate);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [newTx, setNewTx] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    particulars: '',
    amount: '',
    isCredit: false,
    category: ''
  });
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [dateView, setDateView] = useState<'all' | 'month' | 'date' | 'range'>('all');
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), 'yyyy-MM'));
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [dateRangeStart, setDateRangeStart] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [dateRangeEnd, setDateRangeEnd] = useState(() => format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    authService.apiFetch('/api/transactions/categories')
      .then(res => res.ok ? res.json() : [])
      .then(data => { if (Array.isArray(data)) setAllCategories(data); })
      .catch(() => {});
  }, []);

  const handleAddOrUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await addOrUpdateTransaction(editingTx, newTx, allCategories);
    if (result?.success) {
      setIsAdding(false);
      setEditingTx(null);
      setNewTx({ date: format(new Date(), 'yyyy-MM-dd'), particulars: '', amount: '', isCredit: false, category: '' });
    }
  };

  const handleDelete = async (id: number) => {
    setDeletingId(null);
    await deleteTransaction(id);
  };

  const txsWithBalance = [...transactions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id)
    .reduce((acc, tx) => {
      const prevBal = acc.length > 0 ? acc[acc.length - 1].runningBalance : Number(account.initial_balance);
      acc.push({ ...tx, runningBalance: prevBal + Number(tx.amount) });
      return acc;
    }, [] as (Transaction & { runningBalance: number })[])
    .reverse();

  const currentBalance = txsWithBalance.length > 0
    ? txsWithBalance[0].runningBalance
    : Number(account.initial_balance);

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
    onAdd: () => setIsAdding(true),
  };

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 md:gap-3 text-muted hover:text-ink transition-colors font-semibold text-[10px] md:text-sm">
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> Back to Portfolio
        </button>
        <button onClick={() => exportLedgerPDF(filteredTxs, account.name, currency, account.initial_balance)} className="p-2 md:p-3 text-muted hover:text-ink hover:bg-surface-soft rounded-full border border-hairline transition-all">
          <Download className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      <div className="bg-canvas rounded-xl border border-hairline shadow-sm" aria-label="Transaction Ledger">
        <div className="p-4 md:p-5 bg-primary/5 border-b border-hairline">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base md:text-xl font-normal text-ink tracking-tight">{account.name}</h3>
              <p className="text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">{account.type.replace('_', ' ')}</p>
            </div>
            <div className="text-right shrink-0">
              <div className="flex items-center gap-1 md:gap-2 justify-end mb-0.5 md:mb-1">
                {isSyncing && <Loader2 className="w-2.5 md:w-3 h-2.5 md:h-3 animate-spin text-primary" />}
                <p className="hidden md:block text-[10px] md:text-xs font-bold text-muted uppercase tracking-[0.2em]">Balance</p>
              </div>
              <p className="text-xl md:text-3xl font-normal text-ink financial-number tracking-tighter">
                {currency}{currentBalance.toLocaleString()}
              </p>
            </div>
          </div>
          <div className="md:hidden flex items-center justify-between mt-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`-ml-1 px-3 py-1.5 rounded-pill text-[10px] font-bold uppercase tracking-wider transition-all ${
                showFilters || dateView !== 'all' || categoryFilter ? 'bg-primary text-white shadow-sm' : 'bg-surface-soft text-muted'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 inline mr-1" />
              Filters
            </button>
            <button onClick={() => setIsAdding(true)} className="btn-primary text-[10px] px-3 py-1.5">
              <Plus className="w-3.5 h-3.5" />
              New
            </button>
          </div>
        </div>

        <LedgerDesktopToolbar {...toolbarProps} />

        <LedgerToolbar {...toolbarProps} />

        <AnimatePresence>
          {isAdding && !editingTx && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              style={{ willChange: 'transform, opacity' }}
            >
              <div className="p-4 md:p-5 bg-surface-soft/50 border-b border-hairline">
                <TransactionForm onSubmit={handleAddOrUpdateTransaction} newTx={newTx} setNewTx={setNewTx} onCancel={() => { setIsAdding(false); setEditingTx(null); }} availableCategories={allCategories} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

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
                    currency={currency} deletingId={deletingId} setDeletingId={setDeletingId} onDelete={handleDelete} onEdit={(t) => { setEditingTx(t); setNewTx({ date: t.date, particulars: t.particulars, amount: Math.abs(t.amount).toString(), isCredit: t.amount > 0, category: t.category || '' }); setIsAdding(true); }}
                    editingTxId={editingTx?.id ?? null}
                    renderEditForm={editingTx ? () => (
                      <TransactionForm onSubmit={handleAddOrUpdateTransaction} newTx={newTx} setNewTx={setNewTx} onCancel={() => { setIsAdding(false); setEditingTx(null); }} availableCategories={allCategories} />
                    ) : undefined}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-hairline app-stagger-grid">
          <AnimatePresence initial={false}>
            {filteredTxs.map((tx, idx) => (
              <TransactionCard 
                key={tx.id} tx={tx} isNewDate={!filteredTxs[idx - 1] || filteredTxs[idx - 1].date !== tx.date}
                isExpanded={expandedId === tx.id} onToggleExpand={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                currency={currency} deletingId={deletingId} setDeletingId={setDeletingId} onDelete={handleDelete} onEdit={(t) => { setEditingTx(t); setNewTx({ date: t.date, particulars: t.particulars, amount: Math.abs(t.amount).toString(), isCredit: t.amount > 0, category: t.category || '' }); setIsAdding(true); }}
                editingTxId={editingTx?.id ?? null}
                renderEditForm={editingTx ? () => (
                  <TransactionForm onSubmit={handleAddOrUpdateTransaction} newTx={newTx} setNewTx={setNewTx} onCancel={() => { setIsAdding(false); setEditingTx(null); }} availableCategories={allCategories} />
                ) : undefined}
              />
            ))}
          </AnimatePresence>
        </div>
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
            <button onClick={() => setIsAdding(true)} className="btn-secondary text-xs md:text-sm px-5 md:px-8 py-2 md:py-3 mx-auto">Add Transaction</button>
          </div>
        )}
      </div>
    </div>
  );
}
