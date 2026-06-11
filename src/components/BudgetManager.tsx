import React, { useState, useEffect, useCallback } from 'react';
import { PiggyBank, Plus, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';
import { localDb } from '../services/localDb';
import { generateId } from '../utils/ids';
import { flushPending } from '../services/syncEngine';
import { format } from 'date-fns';

interface BudgetItem {
  id: string;
  category: string;
  amount: number;
  month: string;
}

interface BudgetManagerProps {
  currency: string;
  categories: string[];
}

export default function BudgetManager({ currency, categories }: BudgetManagerProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');

  const loadBudgets = useCallback(async () => {
    setLoading(true);
    try {
      const all = await localDb.getBudgets();
      setItems(all.filter(b => b.month === currentMonth).map(b => ({
        id: b.id,
        category: b.category,
        amount: b.amount,
        month: b.month,
      })));
    } catch { /* silent */ }
    setLoading(false);
  }, [currentMonth]);

  useEffect(() => { loadBudgets(); }, [loadBudgets]);

  const handleAdd = async () => {
    if (!newCategory || !newAmount) return;
    setSaving(true);
    try {
      await localDb.putBudget({
        id: generateId(),
        category: newCategory,
        amount: Number(newAmount),
        month: currentMonth,
        updated_at: new Date().toISOString(),
        sync_status: 'pending' as const,
        _deleted: false,
      });
      flushPending();
      toast('Budget saved.', 'success');
      setNewCategory('');
      setNewAmount('');
      loadBudgets();
    } catch { toast('Failed to save budget.', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    try {
      await localDb.permanentDelete('budgets', id);
      flushPending();
      loadBudgets();
    } catch { toast('Failed to delete budget.', 'error'); }
  };

  const totalBudget = items.reduce((s, b) => s + b.amount, 0);

  return (
    <div className="card-xl space-y-4">
      <div className="flex items-center gap-3">
        <PiggyBank className="w-5 h-5 text-primary" />
        <h4 className="text-base font-normal text-ink uppercase tracking-tight">Monthly Budgets</h4>
      </div>

      <div className="flex items-center gap-2">
        <input type="month" value={currentMonth} onChange={e => setCurrentMonth(e.target.value)}
          className="px-3 py-2 bg-surface-soft border border-hairline rounded-lg text-xs font-semibold text-ink outline-none focus:border-primary" />
        <span className="text-xs text-muted font-bold">Total: {currency}{totalBudget.toLocaleString()}</span>
      </div>

      <div className="flex gap-2">
        <select value={newCategory} onChange={e => setNewCategory(e.target.value)}
          className="flex-1 px-3 py-2 bg-surface-soft border border-hairline rounded-lg text-xs font-semibold text-ink outline-none focus:border-primary">
          <option value="">Category</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)}
          placeholder="Amount" className="w-28 px-3 py-2 bg-surface-soft border border-hairline rounded-lg text-xs font-semibold text-ink outline-none focus:border-primary" />
        <button onClick={handleAdd} disabled={saving || !newCategory || !newAmount}
          className="btn-primary px-4 py-2 text-xs">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted py-4"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Loading...</span></div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted py-4">No budgets set for this month.</p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map(b => (
              <motion.div key={b.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center justify-between p-3 bg-surface-soft rounded-lg border border-hairline">
                <div>
                  <p className="text-xs font-semibold text-ink">{b.category}</p>
                  <p className="text-xs text-muted">{currency}{b.amount.toLocaleString()}</p>
                </div>
                <button onClick={() => handleDelete(b.id)} className="text-muted hover:text-semantic-down transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
