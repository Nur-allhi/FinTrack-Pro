import React, { useState, useEffect, useCallback } from 'react';
import { Repeat, Plus, Trash2, Pause, Play, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useToast } from './Toast';
import { localDb } from '../services/localDb';
import { generateId } from '../utils/ids';
import { flushPending } from '../services/syncEngine';

interface RecurringItem {
  id: string;
  accountId: string;
  accountName?: string;
  particulars: string;
  category: string;
  amount: number;
  frequency: string;
  nextDate: string;
  active: boolean;
}

interface RecurringManagerProps {
  accounts: { id: number; name: string; member_name?: string; current_balance?: number }[];
  currency: string;
}

export default function RecurringManager({ accounts, currency }: RecurringManagerProps) {
  const { toast } = useToast();
  const [items, setItems] = useState<RecurringItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ account_id: '', particulars: '', category: '', amount: '', frequency: 'monthly', next_date: '' });

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const map = new Map(accounts.map(a => [a.id.toString(), a.name]));
      const all = await localDb.getRecurringTransactions();
      setItems(all.filter(r => !r._deleted).map(r => ({
        id: r.id,
        accountId: r.account_id,
        accountName: map.get(r.account_id) || 'Account',
        particulars: r.particulars,
        category: r.category,
        amount: r.amount,
        frequency: r.frequency,
        nextDate: r.next_date,
        active: r.active,
      })));
    } catch { /* silent */ }
    setLoading(false);
  }, [accounts]);

  useEffect(() => { loadItems(); }, [loadItems]);

  const handleAdd = async () => {
    if (!form.account_id || !form.particulars || !form.amount || !form.next_date) return;
    setSaving(true);
    try {
      await localDb.putRecurringTransaction({
        id: generateId(),
        account_id: form.account_id,
        particulars: form.particulars,
        category: form.category,
        amount: Number(form.amount),
        frequency: form.frequency as 'daily' | 'weekly' | 'monthly' | 'yearly',
        next_date: form.next_date,
        active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        sync_status: 'pending' as const,
        _deleted: false,
      });
      flushPending();
      toast('Recurring transaction created.', 'success');
      setForm({ account_id: '', particulars: '', category: '', amount: '', frequency: 'monthly', next_date: '' });
      loadItems();
    } catch { toast('Failed to create.', 'error'); }
    setSaving(false);
  };

  const handleToggle = async (id: string, active: boolean) => {
    try {
      const all = await localDb.getRecurringTransactions();
      const record = all.find(r => r.id === id);
      if (record) {
        await localDb.putRecurringTransaction({ ...record, active: !active, sync_status: 'pending', updated_at: new Date().toISOString() });
        flushPending();
        loadItems();
      }
    } catch { toast('Failed to toggle.', 'error'); }
  };

  const handleDelete = async (id: string) => {
    try {
      const all = await localDb.getRecurringTransactions();
      const record = all.find(r => r.id === id);
      if (record) {
        await localDb.putRecurringTransaction({ ...record, _deleted: true, sync_status: 'pending', updated_at: new Date().toISOString() });
        flushPending();
        loadItems();
      }
    } catch { toast('Failed to delete.', 'error'); }
  };

  return (
    <div className="card-xl space-y-4">
      <div className="flex items-center gap-3">
        <Repeat className="w-5 h-5 text-primary" />
        <h4 className="text-base font-normal text-ink uppercase tracking-tight">Recurring Transactions</h4>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <select value={form.account_id} onChange={e => setForm({ ...form, account_id: e.target.value })}
          className="px-3 py-2 bg-surface-soft border border-hairline rounded-lg text-xs font-semibold text-ink outline-none focus:border-primary">
          <option value="">Account</option>
          {accounts.map(a => <option key={a.id} value={a.id}>{a.member_name ? `${a.name} · ${a.member_name}` : a.name} — {currency}{(a.current_balance || 0).toLocaleString()}</option>)}
        </select>
        <input type="text" value={form.particulars} onChange={e => setForm({ ...form, particulars: e.target.value })}
          placeholder="Particulars" className="px-3 py-2 bg-surface-soft border border-hairline rounded-lg text-xs font-semibold text-ink outline-none focus:border-primary" />
        <input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })}
          placeholder="Amount" className="px-3 py-2 bg-surface-soft border border-hairline rounded-lg text-xs font-semibold text-ink outline-none focus:border-primary" />
        <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })}
          className="px-3 py-2 bg-surface-soft border border-hairline rounded-lg text-xs font-semibold text-ink outline-none focus:border-primary">
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="yearly">Yearly</option>
        </select>
        <input type="date" value={form.next_date} onChange={e => setForm({ ...form, next_date: e.target.value })}
          className="px-3 py-2 bg-surface-soft border border-hairline rounded-lg text-xs font-semibold text-ink outline-none focus:border-primary" />
        <button onClick={handleAdd} disabled={saving} className="btn-primary px-4 py-2 text-xs">
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted py-4"><Loader2 className="w-4 h-4 animate-spin" /><span className="text-xs">Loading...</span></div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted py-4">No recurring transactions set up.</p>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {items.map(r => (
              <motion.div key={r.id} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="flex items-center justify-between p-3 bg-surface-soft rounded-lg border border-hairline">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-ink truncate">{r.particulars}</p>
                  <p className="text-[10px] text-muted">{r.accountName || 'Account'} · {r.frequency} · {currency}{r.amount.toLocaleString()} · Next: {r.nextDate}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleToggle(r.id, r.active)} className="p-1 text-muted hover:text-ink transition-colors">
                    {r.active ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                  <button onClick={() => handleDelete(r.id)} className="p-1 text-muted hover:text-semantic-down transition-colors">
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
