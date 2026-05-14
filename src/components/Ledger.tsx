import React, { useState, useEffect } from 'react';
import { Account, Transaction } from '../types';
import { 
  ArrowLeft, 
  Download, 
  Loader2,
  Plus
} from 'lucide-react';
import { AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { cacheService } from '../services/cacheService';
import { useToast } from './Toast';

// Sub-components
import TransactionForm from './TransactionForm';
import TransactionRow from './TransactionRow';
import TransactionCard from './TransactionCard';

interface LedgerProps {
  account: Account;
  onBack: () => void;
  onUpdate: () => void;
  lastUpdate?: number;
  currency: string;
}

const downloadCSV = (txs: Transaction[], accountName: string, currency: string) => {
  const header = 'Date,Particulars,Category,Amount,Running Balance';
  const rows = txs.map((tx: any) =>
    [tx.date, `"${tx.particulars}"`, tx.category || '', tx.amount, tx.runningBalance].join(',')
  );
  const csv = [header, ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${accountName.replace(/\s+/g, '_')}_ledger.csv`;
  a.click();
  URL.revokeObjectURL(url);
};

export default function Ledger({ account, onBack, onUpdate, lastUpdate, currency }: LedgerProps) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [newTx, setNewTx] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    particulars: '',
    amount: '',
    isCredit: false,
    category: ''
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const fetchTransactions = async (showLoading = true) => {
    if (!account?.id) return setLoading(false);
    if (showLoading) setLoading(true);
    else setIsSyncing(true);
    
    try {
      const res = await fetch(`/api/transactions/${account.id}`);
      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setTransactions(data);
      cacheService.setTransactions(account.id.toString(), data);
    } catch (error) {
      console.error("Fetch failed:", error);
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      if (!account?.id) return;
      if (transactions.length > 0) return fetchTransactions(false);
      const cached = await cacheService.getTransactions(account.id.toString());
      if (cached) { setTransactions(cached); setLoading(false); fetchTransactions(false); }
      else fetchTransactions(true);
    };
    load();
  }, [account.id, lastUpdate]);

  const handleAddOrUpdateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTx.amount) * (newTx.isCredit ? 1 : -1);
    let category = newTx.category;
    let summary = editingTx?.summary || null;

    const optimisticTx: Transaction = {
      id: editingTx ? editingTx.id : Date.now(),
      account_id: account.id,
      date: newTx.date,
      particulars: newTx.particulars,
      category: category || 'Uncategorized',
      amount: amount,
      type: editingTx?.type || 'normal',
      summary: summary,
      linked_transaction_id: editingTx?.linked_transaction_id || null
    };

    const prev = [...transactions];
    if (editingTx) setTransactions(transactions.map(t => t.id === editingTx.id ? optimisticTx : t));
    else setTransactions([optimisticTx, ...transactions]);

    setIsAdding(false);
    setEditingTx(null);
    setNewTx({ date: format(new Date(), 'yyyy-MM-dd'), particulars: '', amount: '', isCredit: false, category: '' });
    onUpdate();

    try {
      const method = editingTx ? 'PATCH' : 'POST';
      const url = editingTx ? `/api/transactions/${editingTx.id}` : '/api/transactions';
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ account_id: account.id, date: newTx.date, particulars: newTx.particulars, category, amount, summary })
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      setTransactions(p => p.map(t => t.id === optimisticTx.id ? { ...t, id: saved.id } : t));
      fetchTransactions(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      setTransactions(prev);
      toast("Failed to save transaction.", 'error');
    }
  };

  const handleDelete = async (id: number) => {
    const prev = [...transactions];
    setTransactions(transactions.filter(t => t.id !== id));
    setDeletingId(null);
    onUpdate();
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
      fetchTransactions(false);
      onUpdate();
    } catch (error) {
      console.error(error);
      setTransactions(prev);
      toast("Failed to delete transaction.", 'error');
    }
  };

  const txsWithBalance = [...transactions]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id)
    .reduce((acc, tx) => {
      const prevBal = acc.length > 0 ? acc[acc.length - 1].runningBalance : Number(account.initial_balance);
      acc.push({ ...tx, runningBalance: prevBal + Number(tx.amount) });
      return acc;
    }, [] as any[])
    .reverse();

  return (
    <div className="space-y-4 md:space-y-8">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 md:gap-3 text-muted hover:text-ink transition-colors font-semibold text-[10px] md:text-sm">
          <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" /> Back to Portfolio
        </button>
        <button onClick={() => downloadCSV(txsWithBalance, account.name, currency)} className="p-2 md:p-3 text-muted hover:text-ink hover:bg-surface-soft rounded-full border border-hairline transition-all">
          <Download className="w-4 h-4 md:w-5 md:h-5" />
        </button>
      </div>

      <div className="bg-canvas rounded-xl border border-hairline shadow-sm overflow-hidden" aria-label="Transaction Ledger">
        <div className="p-4 md:p-5 flex items-center justify-between bg-primary/5 border-b border-hairline">
          <div>
            <h3 className="text-base md:text-xl font-normal text-ink tracking-tight">{account.name}</h3>
            <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">{account.type.replace('_', ' ')}</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 md:gap-2 justify-end mb-0.5 md:mb-1">
              {isSyncing && <Loader2 className="w-2.5 md:w-3 h-2.5 md:h-3 animate-spin text-primary" />}
              <p className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Balance</p>
            </div>
            <p className="text-xl md:text-3xl font-normal text-ink financial-number tracking-tighter">
              {currency}{account.current_balance.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="px-4 md:px-5 py-2.5 md:py-3 border-b border-hairline bg-canvas flex justify-between items-center">
          <h4 className="text-[9px] md:text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Ledger Entries</h4>
          <button onClick={() => setIsAdding(true)} className="btn-primary text-[10px] md:text-xs px-3 md:px-4 py-1.5 md:py-2">
            <Plus className="w-3 md:w-3.5 h-3 md:h-3.5" />
            Post
          </button>
        </div>

        {isAdding && (
          <div className="p-4 md:p-5 bg-surface-soft/50 border-b border-hairline">
            <TransactionForm onSubmit={handleAddOrUpdateTransaction} newTx={newTx} setNewTx={setNewTx} onCancel={() => { setIsAdding(false); setEditingTx(null); }} />
          </div>
        )}

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-soft text-muted text-[10px] font-bold uppercase tracking-[0.2em] border-b border-hairline">
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
                {txsWithBalance.map((tx, idx) => (
                  <TransactionRow 
                    key={tx.id} tx={tx} isNewDate={!txsWithBalance[idx - 1] || txsWithBalance[idx - 1].date !== tx.date}
                    isExpanded={expandedId === tx.id} onToggleExpand={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                    currency={currency} deletingId={deletingId} setDeletingId={setDeletingId} onDelete={handleDelete} onEdit={(t) => { setEditingTx(t); setNewTx({ date: t.date, particulars: t.particulars, amount: Math.abs(t.amount).toString(), isCredit: t.amount > 0, category: t.category || '' }); setIsAdding(true); }}
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="md:hidden divide-y divide-hairline">
          <AnimatePresence initial={false}>
            {txsWithBalance.map((tx, idx) => (
              <TransactionCard 
                key={tx.id} tx={tx} isNewDate={!txsWithBalance[idx - 1] || txsWithBalance[idx - 1].date !== tx.date}
                isExpanded={expandedId === tx.id} onToggleExpand={() => setExpandedId(expandedId === tx.id ? null : tx.id)}
                currency={currency} deletingId={deletingId} setDeletingId={setDeletingId} onDelete={handleDelete} onEdit={(t) => { setEditingTx(t); setNewTx({ date: t.date, particulars: t.particulars, amount: Math.abs(t.amount).toString(), isCredit: t.amount > 0, category: t.category || '' }); setIsAdding(true); }}
              />
            ))}
          </AnimatePresence>
        </div>
        {txsWithBalance.length === 0 && (
          <div className="px-6 md:px-12 py-16 md:py-32 text-center bg-canvas">
            <div className="w-12 md:w-20 h-12 md:h-20 bg-surface-soft rounded-full flex items-center justify-center mx-auto mb-4 md:mb-8 border border-hairline">
              <Plus className="w-6 md:w-10 h-6 md:h-10 text-muted" />
            </div>
            <p className="text-base md:text-xl font-normal text-ink mb-1 md:mb-2">No records found</p>
            <p className="text-xs md:text-sm text-muted mb-4 md:mb-8">Post your first ledger entry.</p>
            <button onClick={() => setIsAdding(true)} className="btn-secondary text-xs md:text-sm px-5 md:px-8 py-2 md:py-3 mx-auto">Add Transaction</button>
          </div>
        )}
      </div>
    </div>
  );
}
