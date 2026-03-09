import React, { useState, useEffect } from 'react';
import { Account, Transaction } from '../types';
import { 
  ArrowLeft, 
  Plus, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Sparkles,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { format } from 'date-fns';
import { categorizeTransaction } from '../services/geminiService';

interface LedgerProps {
  account: Account;
  onBack: () => void;
  onUpdate: () => void;
}

export default function Ledger({ account, onBack, onUpdate }: LedgerProps) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newTx, setNewTx] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    particulars: '',
    amount: '',
    isCredit: false,
    category: ''
  });
  const [aiLoading, setAiLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transactions/${account.id}`);
      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      setTransactions(await res.json());
    } catch (error) {
      console.error("Failed to fetch transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [account.id]);

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newTx.amount) * (newTx.isCredit ? 1 : -1);
    
    let category = newTx.category;
    let summary = null;

    if (!category) {
      setAiLoading(true);
      const aiResult = await categorizeTransaction(newTx.particulars);
      category = aiResult.category;
      summary = aiResult.summary;
      setAiLoading(false);
    }

    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: account.id,
          date: newTx.date,
          particulars: newTx.particulars,
          category,
          amount,
          summary
        })
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || `Server error: ${res.status}`);
      }

      setIsAdding(false);
      setNewTx({
        date: format(new Date(), 'yyyy-MM-dd'),
        particulars: '',
        amount: '',
        isCredit: false,
        category: ''
      });
      fetchTransactions();
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      fetchTransactions();
      onUpdate();
    } catch (error) {
      console.error(error);
    }
  };

  // Calculate running balance
  const sortedTxs = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || a.id - b.id);
  let currentBalance = account.initial_balance;
  const txsWithBalance = sortedTxs.map(tx => {
    currentBalance += tx.amount;
    return { ...tx, runningBalance: currentBalance };
  }).reverse();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-primary transition-colors font-medium">
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <div className="flex items-center gap-3">
          <button className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
            <Download className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all font-semibold"
          >
            <Plus className="w-5 h-5" />
            Add Transaction
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div>
            <h3 className="text-xl font-bold text-slate-900">{account.name}</h3>
            <p className="text-sm text-slate-500 font-medium capitalize">{account.type.replace('_', ' ')} Ledger</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Current Balance</p>
            <p className="text-2xl font-bold text-primary financial-number">৳{account.current_balance.toLocaleString()}</p>
          </div>
        </div>

        {isAdding && (
          <div className="p-6 bg-primary/5 border-b border-primary/10">
            <form onSubmit={handleAddTransaction} className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <input 
                type="date" 
                required
                value={newTx.date}
                onChange={e => setNewTx({...newTx, date: e.target.value})}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <input 
                type="text" 
                placeholder="Particulars (Bengali/English)"
                required
                value={newTx.particulars}
                onChange={e => setNewTx({...newTx, particulars: e.target.value})}
                className="md:col-span-2 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none"
              />
              <div className="flex gap-2">
                <input 
                  type="number" 
                  placeholder="Amount"
                  required
                  value={newTx.amount}
                  onChange={e => setNewTx({...newTx, amount: e.target.value})}
                  className="flex-1 px-4 py-2 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 outline-none financial-number"
                />
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, isCredit: !newTx.isCredit})}
                  className={`px-3 rounded-xl font-bold text-xs uppercase transition-colors ${newTx.isCredit ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}
                >
                  {newTx.isCredit ? 'Credit' : 'Debit'}
                </button>
              </div>
              <div className="flex gap-2">
                <button 
                  type="submit" 
                  disabled={aiLoading}
                  className="flex-1 bg-primary text-white rounded-xl font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                  Save
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Particulars</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4 text-right">Debit</th>
                <th className="px-6 py-4 text-right">Credit</th>
                <th className="px-6 py-4 text-right">Balance</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {txsWithBalance.map((tx) => (
                <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-500 font-medium">{format(new Date(tx.date), 'dd MMM yyyy')}</td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-slate-800">{tx.particulars}</p>
                    {tx.summary && <p className="text-xs text-slate-400 italic mt-0.5">{tx.summary}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 text-slate-500 rounded-full uppercase tracking-wider">
                      {tx.category || 'Uncategorized'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-rose-500 financial-number">
                    {tx.amount < 0 ? `৳${Math.abs(tx.amount).toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-emerald-500 financial-number">
                    {tx.amount > 0 ? `৳${tx.amount.toLocaleString()}` : '-'}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 financial-number">
                    ৳{tx.runningBalance.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button 
                      onClick={() => handleDelete(tx.id)}
                      className="p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {txsWithBalance.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">
                    No transactions found for this account.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
