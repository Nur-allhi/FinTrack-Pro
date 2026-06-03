import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Account } from '../types';
import { X, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import DatePicker from './DatePicker';
import { format } from 'date-fns';
import { useToast } from './Toast';
import DebitCreditToggle from './DebitCreditToggle';
import { localDb } from '../services/localDb';
import { generateId } from '../utils/ids';
import Select from './Select';

interface TransactionModalProps {
  accounts: Account[];
  onClose: () => void;
  onUpdate: () => void;
  onTransactionSaved?: () => void;
  initialAccountId?: number;
  currency: string;
}

export default function TransactionModal({ accounts, onClose, onUpdate, onTransactionSaved, initialAccountId, currency }: TransactionModalProps) {
  const { toast } = useToast();
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [closing, setClosing] = useState(false);
  const isWriting = useRef(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const handleClose = () => {
    setClosing(true);
    setTimeout(onClose, 200);
  };
  const [tx, setTx] = useState({
    account_id: initialAccountId?.toString() || '',
    date: format(new Date(), 'yyyy-MM-dd'),
    particulars: '',
    amount: '',
    isCredit: false,
    category: ''
  });

  useEffect(() => {
    localDb.getTransactions()
      .then(txns => {
        const cats = [...new Set(txns.map(t => t.category).filter(Boolean))];
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tx.account_id) {
      toast("Please select an account.", 'error');
      return;
    }
    if (isWriting.current) return;
    isWriting.current = true;

    try {
      const amount = parseFloat(tx.amount) * (tx.isCredit ? 1 : -1);
      const accountId = tx.account_id;

      const record = {
        id: generateId(),
        account_id: accountId,
        date: tx.date,
        particulars: tx.particulars,
        category: tx.category || 'Uncategorized',
        amount,
        type: 'normal' as const,
        linked_transaction_id: null,
        summary: null,
        updated_at: new Date().toISOString(),
        sync_status: 'pending' as const,
        _deleted: false,
      };

      await localDb.putTransaction(record);
      setSuccess(true);
      toast("Transaction saved.", 'success');
      onUpdate();
      onTransactionSaved?.();
      setTimeout(handleClose, 1200);
    } catch (error) {
      console.error("Save failed:", error);
      toast("Failed to save transaction.", 'error');
    } finally {
      isWriting.current = false;
    }
  };

  return createPortal(
    <motion.div initial={{ opacity: 0 }} animate={closing ? { opacity: 0 } : { opacity: 1 }} transition={{ duration: 0.3 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6 md:p-12 bg-surface-dark/40 backdrop-blur-sm" onClick={handleClose}>
      <motion.div initial={{ opacity: 0, y: 40 }} animate={closing ? { opacity: 0, y: 40 } : { opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }} onClick={e => e.stopPropagation()} className="bg-canvas w-full max-w-[28rem] md:max-w-[32rem] lg:max-w-[42rem] rounded-xl border border-hairline shadow-2xl">
        <div className="p-4 sm:p-6 md:p-10 border-b border-hairline flex items-center justify-between bg-surface-soft/30">
          <h3 className="text-lg sm:text-2xl font-normal text-ink tracking-tight">Post Transaction</h3>
          <button onClick={handleClose} className="p-1.5 sm:p-2 text-muted hover:text-ink transition-colors">
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        <div className="p-4 sm:p-6 md:p-10 lg:p-12">
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted uppercase tracking-[0.2em]">Target Account</label>
                  <Select
                    value={tx.account_id}
                    onChange={v => setTx({...tx, account_id: v})}
                    placeholder="Select Account"
                    options={accounts.filter(a => !a.archived).map(a => ({ value: String(a.id), label: a.member_name ? `${a.name} · ${a.member_name} (${currency}${a.current_balance.toLocaleString()})` : `${a.name} (${currency}${a.current_balance.toLocaleString()})` }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    type="text"
                    inputMode="decimal"
                    required
                    value={tx.amount}
                    onChange={e => setTx({...tx, amount: e.target.value})}
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm financial-number"
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
                        className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm font-medium"
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
                    className="w-full px-4 py-3 bg-canvas border border-hairline text-ink rounded-md focus:border-primary transition-all outline-none text-sm font-medium"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={handleClose}
                  className="btn-secondary flex-1 h-11"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="btn-primary flex-[2] h-11 text-sm"
                >
                  Post Entry
                </button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}
