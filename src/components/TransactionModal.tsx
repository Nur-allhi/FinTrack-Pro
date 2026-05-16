import React, { useState, useEffect } from 'react';
import { Account } from '../types';
import { X, Loader2, CheckCircle2 } from 'lucide-react';
import DatePicker from './DatePicker';
import { format } from 'date-fns';
import { useToast } from './Toast';
import DebitCreditToggle from './DebitCreditToggle';
import { authService } from '../services/authService';
import Select from './Select';

interface TransactionModalProps {
  accounts: Account[];
  onClose: () => void;
  onUpdate: () => void;
  initialAccountId?: number;
  currency: string;
}

export default function TransactionModal({ accounts, onClose, onUpdate, initialAccountId, currency }: TransactionModalProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [tx, setTx] = useState({
    account_id: initialAccountId?.toString() || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    particulars: '',
    amount: '',
    isCredit: false,
    category: ''
  });

  useEffect(() => {
    authService.apiFetch('/api/transactions/categories')
      .then(res => res.json())
      .then(setCategories)
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tx.account_id) {
      toast("Please select an account.", 'error');
      return;
    }

    setLoading(true);
    onUpdate();
    try {
      const amount = parseFloat(tx.amount) * (tx.isCredit ? 1 : -1);
      const res = await authService.apiFetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          account_id: Number(tx.account_id),
          date: tx.date,
          particulars: tx.particulars,
          category: tx.category || 'Uncategorized',
          amount
        })
      });
      
      if (!res.ok) throw new Error("Failed to save transaction");
      
      setSuccess(true);
      toast("Transaction saved successfully.", 'success');
      onUpdate();
      setTimeout(onClose, 1500);
    } catch (error) {
      console.error("Save failed:", error);
      toast("Failed to save transaction.", 'error');
      onUpdate();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-surface-dark/40 backdrop-blur-sm">
      <div className="bg-canvas w-full max-w-lg rounded-xl border border-hairline shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-hairline flex items-center justify-between bg-surface-soft/30">
          <h3 className="text-2xl font-normal text-ink tracking-tight">Post Transaction</h3>
          <button onClick={onClose} className="p-2 text-muted hover:text-ink transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-10">
          {success ? (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-20 h-20 bg-semantic-up/10 rounded-full flex items-center justify-center text-semantic-up shadow-lg shadow-semantic-up/10">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <div>
                <h4 className="text-2xl font-normal text-ink mb-2">Post Successful</h4>
                <p className="text-sm text-muted font-medium">The institutional ledger has been updated.</p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-8">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Target Account</label>
                  <Select
                    value={tx.account_id}
                    onChange={v => setTx({...tx, account_id: v})}
                    placeholder="Select Account"
                    options={accounts.filter(a => !a.archived).map(a => ({ value: String(a.id), label: a.member_name ? `${a.name} · ${a.member_name} (${currency}${a.current_balance.toLocaleString()})` : `${a.name} (${currency}${a.current_balance.toLocaleString()})` }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Value Date</label>
                    <DatePicker
                      value={tx.date}
                      onChange={v => setTx({...tx, date: v})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Audit Type</label>
                    <DebitCreditToggle isCredit={tx.isCredit} onChange={v => setTx({...tx, isCredit: v})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Settlement Amount ({currency})</label>
                  <input 
                    type="number" 
                    required
                    value={tx.amount}
                    onChange={e => setTx({...tx, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Category</label>
                  <div className="flex flex-col gap-2">
                    <Select
                      value={isCustomCategory ? '__new__' : (categories.includes(tx.category) ? tx.category : '')}
                      onChange={(v) => {
                        if (v === '__new__') { setIsCustomCategory(true); setTx({...tx, category: ''}); }
                        else { setIsCustomCategory(false); setTx({...tx, category: v}); }
                      }}
                      placeholder={tx.category && !categories.includes(tx.category) ? tx.category : 'Select category'}
                      options={[
                        ...categories.map(c => ({ value: c, label: c })),
                        { value: '__new__', label: 'New category...' }
                      ]}
                    />
                    {isCustomCategory && (
                      <input
                        type="text"
                        placeholder="Type new category name"
                        value={tx.category}
                        onChange={e => setTx({...tx, category: e.target.value})}
                        className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm font-medium"
                      />
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-[0.2em] ml-1">Transaction Description</label>
                  <input 
                    type="text" 
                    required
                    value={tx.particulars}
                    onChange={e => setTx({...tx, particulars: e.target.value})}
                    placeholder="Institutional memo"
                    className="w-full px-5 py-3.5 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button 
                  type="button" 
                  onClick={onClose}
                  className="btn-secondary flex-1 h-[56px]"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-[2] h-[56px] text-base"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                  Post Entry
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
