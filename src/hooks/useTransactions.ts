import { useState, useEffect, useRef, useCallback } from 'react';
import { Account, Transaction } from '../types';

import { localDb, LocalTransaction } from '../services/localDb';
import { flushPending } from '../services/syncEngine';
import { useToast } from '../components/Toast';
import { generateId } from '../utils/ids';

function toUiTransaction(local: LocalTransaction, accountServerId: number): Transaction {
  return {
    id: local.server_id && typeof local.server_id === 'number' ? local.server_id : 0,
    account_id: accountServerId,
    date: local.date,
    particulars: local.particulars,
    category: local.category,
    amount: local.amount,
    type: local.type,
    summary: local.summary,
    linked_transaction_id: null,
  };
}

export function useTransactions(account: Account) {
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const [localAccountId, setLocalAccountId] = useState<string | null>(null);
  const accountIdRef = useRef(account?.id);
  accountIdRef.current = account?.id;

  const readFromLocal = useCallback(async (accountLocalId: string) => {
    if (accountIdRef.current !== account?.id) return;
    const accounts = await localDb.getAccounts();
    const acc = accounts.find(a => a.id === accountLocalId);
    if (!acc) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    const allTxns = await localDb.getTransactions();
    const localTxns = allTxns.filter(t => {
      if (t.account_id === acc.id) return true;
      if (acc.server_id != null && String(t.account_id) === String(acc.server_id)) return true;
      return false;
    });
    if (accountIdRef.current !== account?.id) return;
    const uiTxns = localTxns
      .map(lt => toUiTransaction(lt, account.id))
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id);
    setTransactions(uiTxns);
    setLoading(false);
  }, [account?.id]);

  useEffect(() => {
    const findLocalAccount = async () => {
      const accounts = await localDb.getAccounts();
      const acc = accounts.find(a => a.server_id === account?.id);
      setLocalAccountId(acc?.id || null);
    };
    findLocalAccount();
  }, [account?.id]);

  useEffect(() => {
    if (!localAccountId) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    readFromLocal(localAccountId);
  }, [localAccountId, readFromLocal]);

  useEffect(() => {
    if (!localAccountId) return;
    const unsub = localDb.onChange('transactions', () => {
      readFromLocal(localAccountId);
    });
    return unsub;
  }, [localAccountId, readFromLocal]);

  const addOrUpdateTransaction = async (
    editingTx: Transaction | null,
    newTx: { date: string; particulars: string; amount: string; isCredit: boolean; category: string },
    _allCategories: string[]
  ) => {
    const amount = parseFloat(newTx.amount) * (newTx.isCredit ? 1 : -1);
    const oldAmount = editingTx?.amount || 0;
    const delta = amount - oldAmount;
    const summary = editingTx?.summary || null;

    const accounts = await localDb.getAccounts();
    const acc = accounts.find(a => a.server_id === account.id);
    if (!acc) {
      toast("Account not found locally.", 'error');
      return { success: false };
    }

    const localId = editingTx
      ? (editingTx.id.toString().includes('-') ? editingTx.id.toString() : generateId())
      : generateId();

    const record: LocalTransaction = {
      id: localId,
      server_id: editingTx && typeof editingTx.id === 'number' ? editingTx.id : null,
      account_id: acc.id,
      date: newTx.date,
      particulars: newTx.particulars,
      category: newTx.category || 'Uncategorized',
      amount,
      type: 'normal',
      linked_transaction_id: null,
      summary,
      updated_at: new Date().toISOString(),
      sync_status: 'pending',
      _deleted: false,
    };

    try {
      await localDb.putTransaction(record);
    } catch (e) {
      console.error("Failed to write transaction to localDb:", e);
      toast("Failed to save transaction.", 'error');
      return { success: false };
    }

    if (delta !== 0) {
      try {
        await localDb.adjustAccountBalance(acc.id, delta);
      } catch (e) {
        console.error("Failed to adjust account balance:", e);
      }
    }

    flushPending();

    return { success: true };
  };

  const deleteTransaction = async (id: number) => {
    const allTxns = await localDb.getTransactions();
    const localTxn = allTxns.find(t =>
      (typeof t.server_id === 'number' && t.server_id === id) || t.id === id.toString()
    );

    if (!localTxn) {
      setTransactions(prev => prev.filter(t => t.id !== id));
      return;
    }

    try {
      await localDb.putTransaction({ ...localTxn, _deleted: true, sync_status: 'pending', updated_at: new Date().toISOString() });
    } catch (e) {
      console.error("Failed to soft-delete transaction in localDb:", e);
      toast("Failed to delete transaction.", 'error');
      return;
    }

    try {
      const accounts = await localDb.getAccounts();
      const acc = accounts.find(a =>
        a.id === localTxn.account_id ||
        (a.server_id != null && String(a.server_id) === String(localTxn.account_id))
      );
      if (acc) {
        await localDb.adjustAccountBalance(acc.id, -localTxn.amount);
      }
    } catch (e) {
      console.error("Failed to adjust account balance on delete:", e);
    }

    flushPending();

    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  return {
    transactions,
    loading,
    addOrUpdateTransaction,
    deleteTransaction,
    refetch: () => localAccountId && readFromLocal(localAccountId),
  };
}