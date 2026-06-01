import { useState, useEffect } from 'react';
import { Account, Transaction } from '../types';
import { cacheService } from '../services/cacheService';
import { authService } from '../services/authService';
import { offlineService } from '../services/offlineService';
import { useToast } from '../components/Toast';
import { format } from 'date-fns';

export function useTransactions(account: Account, lastUpdate?: number) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const fetchTransactions = async (showLoading = true) => {
    if (!account?.id) return setLoading(false);
    if (showLoading) setLoading(true);
    else setIsSyncing(true);

    try {
      const cacheBuster = navigator.onLine ? `?_=${Date.now()}` : '';
      const res = await authService.apiFetch(`/api/transactions/${account.id}${cacheBuster}`);
      if (!res.ok) throw new Error("Server error");
      let data: Transaction[] = await res.json();

      const queue = await offlineService.getQueue();
      const pendingDeletes = queue.filter(a =>
        a.type === 'delete' && a.endpoint.startsWith('/api/transactions/')
      );
      for (const del of pendingDeletes) {
        const id = parseInt(del.endpoint.split('/').pop()!, 10);
        data = data.filter(t => t.id !== id);
      }
      const pendingCreates = queue.filter(a =>
        a.type === 'create' && a.endpoint === '/api/transactions' && a.body
      );
      for (const create of pendingCreates) {
        const b = create.body!;
        data.unshift({
          id: Date.now() + Math.random(),
          account_id: account.id,
          date: b.date || '',
          particulars: b.particulars || '',
          category: b.category || 'Uncategorized',
          amount: b.amount || 0,
          type: 'normal',
          summary: b.summary || null,
          linked_transaction_id: null,
        } as Transaction);
      }
      const pendingUpdates = queue.filter(a =>
        a.type === 'update' && a.body?.account_id === account.id && a.body
      );
      for (const update of pendingUpdates) {
        const id = parseInt(update.endpoint.split('/').pop()!, 10);
        const idx = data.findIndex(t => t.id === id);
        const b = update.body!;
        if (idx >= 0) {
          data[idx] = { ...data[idx], date: b.date || '', particulars: b.particulars || '', category: b.category || 'Uncategorized', amount: b.amount || 0 };
        }
      }

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

  useEffect(() => {
    if (!account?.id) return;
    const interval = setInterval(() => {
      if (offlineService.isOnline()) fetchTransactions(false);
    }, 30000);
    return () => clearInterval(interval);
  }, [account.id]);

  const addOrUpdateTransaction = async (
    editingTx: Transaction | null,
    newTx: { date: string; particulars: string; amount: string; isCredit: boolean; category: string },
    allCategories: string[]
  ) => {
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

    if (!navigator.onLine) {
      const qBody: Record<string, unknown> = { account_id: account.id, date: newTx.date, particulars: newTx.particulars, category, amount };
      if (summary !== null) qBody.summary = summary;
      try {
        await offlineService.queueAction({
          type: editingTx ? 'update' : 'create',
          endpoint: editingTx ? `/api/transactions/${editingTx.id}` : '/api/transactions',
          body: qBody
        });
        const cached = await cacheService.getTransactions(account.id.toString());
        const updatedCache = editingTx
          ? (cached || []).map((t: Transaction) => t.id === editingTx.id ? optimisticTx : t)
          : [optimisticTx, ...(cached || [])];
        await cacheService.setTransactions(account.id.toString(), updatedCache);
      } catch (e) {
        console.error('Failed to queue action:', e);
      }
      toast("Transaction queued for sync when online.", 'success');
      return { success: true, optimisticTx };
    }

    try {
      const method = editingTx ? 'PATCH' : 'POST';
      const url = editingTx ? `/api/transactions/${editingTx.id}` : '/api/transactions';
      const body: Record<string, unknown> = { account_id: account.id, date: newTx.date, particulars: newTx.particulars, category, amount };
      if (summary !== null) body.summary = summary;
      const res = await authService.apiFetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Save failed");
      const saved = await res.json();
      setTransactions(p => p.map(t => t.id === optimisticTx.id ? { ...t, id: saved.id } : t));
      fetchTransactions(false);
      return { success: true, optimisticTx };
    } catch (error) {
      console.error(error);
      if (error instanceof TypeError) {
        await offlineService.queueAction({
          type: editingTx ? 'update' : 'create',
          endpoint: editingTx ? `/api/transactions/${editingTx.id}` : '/api/transactions',
          body: { account_id: account.id, date: newTx.date, particulars: newTx.particulars, category, amount, ...(summary !== null && { summary }) }
        });
        const cached = await cacheService.getTransactions(account.id.toString());
        const updatedCache = editingTx
          ? (cached || []).map((t: Transaction) => t.id === editingTx.id ? optimisticTx : t)
          : [optimisticTx, ...(cached || [])];
        await cacheService.setTransactions(account.id.toString(), updatedCache);
        toast("Transaction queued for sync when online.", 'success');
        return { success: true, optimisticTx };
      } else {
        setTransactions(prev);
        toast("Failed to save transaction.", 'error');
        return { success: false };
      }
    }
  };

  const deleteTransaction = async (id: number) => {
    const tx = transactions.find(t => t.id === id);
    const prev = [...transactions];
    setTransactions(transactions.filter(t => t.id !== id));

    const queueDelete = () => offlineService.queueAction({ type: 'delete', endpoint: `/api/transactions/${id}`, body: { account_id: account.id, amount: tx?.amount || 0 } });

    if (!navigator.onLine) {
      await queueDelete();
      const cached = await cacheService.getTransactions(account.id.toString());
      if (cached) {
        await cacheService.setTransactions(account.id.toString(), cached.filter((t: Transaction) => t.id !== id));
      }
      toast("Deletion queued for sync when online.", 'success');
      return;
    }

    try {
      const res = await authService.apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error("Delete failed");
      fetchTransactions(false);
    } catch (error) {
      console.error(error);
      if (error instanceof TypeError) {
        await queueDelete();
        const cached = await cacheService.getTransactions(account.id.toString());
        if (cached) {
          await cacheService.setTransactions(account.id.toString(), cached.filter((t: Transaction) => t.id !== id));
        }
        toast("Deletion queued for sync when online.", 'success');
      } else {
        setTransactions(prev);
        toast("Failed to delete transaction.", 'error');
      }
    }
  };

  return {
    transactions,
    setTransactions,
    loading,
    isSyncing,
    fetchTransactions,
    addOrUpdateTransaction,
    deleteTransaction,
  };
}
