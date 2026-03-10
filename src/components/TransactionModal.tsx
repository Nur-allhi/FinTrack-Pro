import React, { useState } from 'react';
import { Account } from '../types';
import { X, Sparkles, Loader2, CheckCircle2, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { categorizeTransaction } from '../services/geminiService';

interface TransactionModalProps {
  accounts: Account[];
  onClose: () => void;
  onUpdate: () => void;
  initialAccountId?: number;
  currency: string;
}

export default function TransactionModal({ accounts, onClose, onUpdate, initialAccountId, currency }: TransactionModalProps) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [tx, setTx] = useState({
    account_id: initialAccountId?.toString() || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    particulars: '',
    amount: '',
    isCredit: false,
    category: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tx.account_id) {
      alert("Please select an account.");
      return;
    }

    // Close instantly for better UX
    onClose();
    // Trigger update immediately (optimistic update for parent)
    onUpdate();

    // Perform the rest in the background
    (async () => {
      let category = tx.category;
      let summary = null;

      if (!category) {
        try {
          const aiResult = await categorizeTransaction(tx.particulars);
          category = aiResult.category;
          summary = aiResult.summary;
        } catch (err) {
          console.error("AI Categorization failed", err);
          category = 'Uncategorized';
        }
      }

      try {
        const amount = parseFloat(tx.amount) * (tx.isCredit ? 1 : -1);
        const res = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            account_id: Number(tx.account_id),
            date: tx.date,
            particulars: tx.particulars,
            category,
            amount,
            summary
          })
        });
        
        if (!res.ok) {
          throw new Error("Failed to save transaction");
        }
        
        // Final sync to ensure all components see the new data
        onUpdate();
      } catch (error) {
        console.error("Background save failed:", error);
        // We could show a toast here if we had a toast system
      }
    })();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100">Add Transaction</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8">
          {success ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-slate-100">Transaction Saved</h4>
                <p className="text-slate-500 dark:text-slate-400">The ledger has been updated successfully.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Account</label>
                  <div className="relative">
                    <select 
                      required
                      value={tx.account_id}
                      onChange={e => setTx({...tx, account_id: e.target.value})}
                      className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none appearance-none font-bold text-slate-700 dark:text-slate-200"
                    >
                      <option value="">Select Account</option>
                      {accounts.filter(a => !a.archived).map(a => (
                        <option key={a.id} value={a.id}>{a.name} ({currency}{a.current_balance.toLocaleString()})</option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ChevronRight className="w-4 h-4 text-slate-400 rotate-90" />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Date</label>
                    <input 
                      type="date" 
                      required
                      value={tx.date}
                      onChange={e => setTx({...tx, date: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Type</label>
                    <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                      <button
                        type="button"
                        onClick={() => setTx({...tx, isCredit: false})}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${!tx.isCredit ? 'bg-rose-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        DEBIT
                      </button>
                      <button
                        type="button"
                        onClick={() => setTx({...tx, isCredit: true})}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${tx.isCredit ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                      >
                        CREDIT
                      </button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Amount ({currency})</label>
                  <input 
                    type="number" 
                    required
                    value={tx.amount}
                    onChange={e => setTx({...tx, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none financial-number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Particulars</label>
                  <input 
                    type="text" 
                    required
                    value={tx.particulars}
                    onChange={e => setTx({...tx, particulars: e.target.value})}
                    placeholder="What was this for?"
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-2xl focus:ring-2 focus:ring-primary/20 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="flex-1 px-6 py-3 text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading || aiLoading}
                  className="flex-[2] bg-primary text-white font-bold py-3 rounded-2xl shadow-lg shadow-primary/20 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {loading || aiLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  Save Transaction
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
