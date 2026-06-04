import { useState, useEffect, useRef } from 'react';
import { Account, Transaction } from '../types';
import { cacheService } from '../services/cacheService';
import { authService } from '../services/authService';
import { offlineService } from '../services/offlineService';
import { localDb } from '../services/localDb';
import { useToast } from '../components/Toast';
import { format } from 'date-fns';

export function useTransactions(account: Account, lastUpdate?: number) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const expectedIdRef = useRef(account?.id);
  expectedIdRef.current = account?.id;

  const fetchTransactions = async (showLoading = true, retries = 3) => {
    const snapshotId = account?.id;
    if (!snapshotId) return setLoading(false);
    if (showLoading) setLoading(true);
    else setIsSyncing(true);

    try {
      const cacheBuster = navigator.onLine ? `?_=${Date.now()}` : '';
      const res = await authService.apiFetch(`/api/transactions/${snapshotId}${cacheBuster}`);
      if (res.status === 429 && retries > 0) {
        const delay = Math.min(1000 * (4 - retries), 3000);
        await new Promise(r => setTimeout(r, delay));
        return fetchTransactions(showLoading, retries - 1);
      }
      if (!res.ok) throw new Error("Server error");
      let data: Transaction[] = await res.json();

      if (expectedIdRef.current !== snapshotId) return;

      const queue = await offlineService.getQueue();
      if (expectedIdRef.current !== snapshotId) return;

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
          account_id: snapshotId,
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
        a.type === 'update' && a.body?.account_id === snapshotId && a.body
      );
      for (const update of pendingUpdates) {
        const id = parseInt(update.endpoint.split('/').pop()!, 10);
        const idx = data.findIndex(t => t.id === id);
        const b = update.body!;
        if (idx >= 0) {
          data[idx] = { ...data[idx], date: b.date || '', particulars: b.particulars || '', category: b.category || 'Uncategorized', amount: b.amount || 0 };
        }
      }

      try {
        const localTxns = await localDb.getUnsyncedTransactions();
        if (expectedIdRef.current !== snapshotId) return;
        for (const lt of localTxns) {
          if (Number(lt.account_id) !== snapshotId) continue;
          const alreadyInData = data.some(t =>
            t.date === lt.date && t.particulars === lt.particulars && Math.abs(t.amount - lt.amount) < 0.01
          );
          if (!alreadyInData) {
            data.unshift({
              id: Date.now() + Math.random(),
              account_id: snapshotId,
              date: lt.date || '',
              particulars: lt.particulars || '',
              category: lt.category || 'Uncategorized',
              amount: lt.amount || 0,
              type: lt.type || 'normal',
              summary: lt.summary || null,
              linked_transaction_id: null,
            } as Transaction);
          }
        }
      } catch (e) {
        console.error('Failed to read localDb pending transactions:', e);
      }

      setTransactions(data);
      setLoading(false);
      setIsSyncing(false);
      cacheService.setTransactions(snapshotId.toString(), data).catch(() => {});
    } catch (error) {
      console.error("Fetch failed:", error);
      setLoading(false);
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const load = async () => {
      const currentId = account?.id;
      if (!currentId) return;

      const cached = await cacheService.getTransactions(currentId.toString());
      if (expectedIdRef.current !== currentId) return;

      let displayData: Transaction[] = cached || [];

      try {
        const localTxns = await localDb.getUnsyncedTransactions();
        if (expectedIdRef.current !== currentId) return;
        for (const lt of localTxns) {
          if (Number(lt.account_id) !== currentId) continue;
          const alreadyExists = displayData.some(t =>
            t.date === lt.date && t.particulars === lt.particulars && Math.abs(t.amount - lt.amount) < 0.01
          );
          if (!alreadyExists) {
            displayData.unshift({
              id: Date.now() + Math.random(),
              account_id: currentId,
              date: lt.date || '',
              particulars: lt.particulars || '',
              category: lt.category || 'Uncategorized',
              amount: lt.amount || 0,
              type: lt.type || 'normal',
              summary: lt.summary || null,
              linked_transaction_id: null,
            } as Transaction);
          }
        }
      } catch (e) {
        console.error('Failed to read localDb pending transactions:', e);
      }

      if (cached) {
        setTransactions(displayData);
        setLoading(false);
        fetchTransactions(false);
      } else {
        setTransactions(displayData);
        setLoading(true);
        fetchTransactions(true);
      }
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

    const softDeleteLocal = async () => {
      try {
        const allTxns = await localDb.getTransactions();
        const localTxn = allTxns.find(t => t.server_id === id);
        if (localTxn) {
          await localDb.putTransaction({ ...localTxn, _deleted: true, sync_status: 'synced', updated_at: new Date().toISOString() });
        }
      } catch (e) {
        console.error('Failed to soft-delete local transaction:', e);
      }
    };

    if (!navigator.onLine) {
      await queueDelete();
      await softDeleteLocal();
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
      await softDeleteLocal();
      fetchTransactions(false);
    } catch (error) {
      console.error(error);
      if (error instanceof TypeError) {
        await queueDelete();
        await softDeleteLocal();
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
