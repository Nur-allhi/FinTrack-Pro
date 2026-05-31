import React, { useState, useEffect } from 'react';
import { PiggyBank, Plus, Trash2, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';
import { authService } from '../services/authService';
import { format } from 'date-fns';

interface Budget {
  id: number;
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
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [newCategory, setNewCategory] = useState('');
  const [newAmount, setNewAmount] = useState('');

  useEffect(() => { loadBudgets(); }, [currentMonth]);

  const loadBudgets = async () => {
    setLoading(true);
    try {
      const res = await authService.apiFetch(`/api/budgets?month=${currentMonth}`);
      if (res.ok) setBudgets(await res.json());
    } catch { /* silent */ }
    setLoading(false);
  };

  const handleAdd = async () => {
    if (!newCategory || !newAmount) return;
    setSaving(true);
    try {
      const res = await authService.apiFetch('/api/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: newCategory, amount: Number(newAmount), month: currentMonth }),
      });
      if (res.ok) {
        toast('Budget saved.', 'success');
        setNewCategory('');
        setNewAmount('');
        loadBudgets();
      }
    } catch { toast('Failed to save budget.', 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await authService.apiFetch(`/api/budgets/${id}`, { method: 'DELETE' });
      loadBudgets();
    } catch { toast('Failed to delete budget.', 'error'); }
  };

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);

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
      ) : budgets.length === 0 ? (
        <p className="text-xs text-muted py-4">No budgets set for this month.</p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {budgets.map(b => (
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
