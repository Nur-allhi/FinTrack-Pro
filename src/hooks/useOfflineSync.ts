import { useState, useEffect, useMemo } from 'react';
import { Account } from '../types';
import { cacheService } from '../services/cacheService';
import { authService } from '../services/authService';
import { offlineService, syncState } from '../services/offlineService';
import { useToast } from '../components/Toast';

export function useOfflineSync(isAuthenticated: boolean, onInitialLoad?: () => void) {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<number | null>(offlineService.getLastSync());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingBalanceAdj, setPendingBalanceAdj] = useState<Record<number, number>>({});
  const [members, setMembers] = useState([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  const fetchData = async (showToast = false) => {
    if (!offlineService.isOnline()) { if (showToast) toast("Cannot refresh while offline.", 'error'); return; }
    setDataLoading(true);
    setLastUpdate(Date.now());
    try {
      const cb = `?_=${Date.now()}`;
      const [membersRes, accountsRes] = await Promise.all([authService.apiFetch('/api/members' + cb), authService.apiFetch('/api/accounts' + cb)]);
      if (!membersRes.ok || !accountsRes.ok) throw new Error("Server error");
      const membersData = await membersRes.json();
      const accountsData = await accountsRes.json();
      setMembers(membersData);
      setAccounts(accountsData);
      cacheService.setMembers(membersData);
      cacheService.setAccounts(accountsData);
      setLastSync(Date.now());
      offlineService.setLastSync();
      if (showToast) toast("Data refreshed.", 'success');
    } catch (error) {
      console.error("Fetch failed:", error);
      if (showToast) toast("Failed to refresh data.", 'error');
    } finally {
      setDataLoading(false);
    }
  };

  const loadFromCache = async () => {
    const [cachedMembers, cachedAccounts] = await Promise.all([
      cacheService.getMembers(), cacheService.getAccounts()
    ]);
    if (cachedMembers) setMembers(cachedMembers);
    if (cachedAccounts) setAccounts(cachedAccounts);
  };

  useEffect(() => {
    if (!isAuthenticated) return;
    loadFromCache();
    if (offlineService.isOnline()) {
      fetchData().finally(() => onInitialLoad?.());
    } else {
      setIsOnline(false);
      setDataLoading(false);
      onInitialLoad?.();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (offlineService.isOnline()) fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const handleFocus = () => {
      if (offlineService.isOnline()) fetchData();
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated]);

  useEffect(() => {
    const offCleanup = offlineService.onOffline(() => setIsOnline(false));
    const onCleanup = offlineService.onOnline(async () => {
      setIsOnline(true);
      const result = await offlineService.syncQueue(authService.apiFetch.bind(authService));
      await fetchData();
      if (result.synced > 0) {
        const msg = result.failed > 0
          ? `Synced ${result.synced} change${result.synced !== 1 ? 's' : ''}, ${result.failed} failed.`
          : `Synced ${result.synced} pending change${result.synced !== 1 ? 's' : ''}.`;
        toast(msg, result.failed > 0 ? 'error' : 'success');
      }
    });
    return () => { offCleanup(); onCleanup(); };
  }, []);

  useEffect(() => {
    const unsub = syncState.subscribe(s => {
      setPendingCount(s.pendingCount);
      setIsSyncing(s.state === 'syncing');
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (pendingCount === 0) { setPendingBalanceAdj({}); return; }
    offlineService.getQueue().then(queue => {
      const adj: Record<number, number> = {};
      for (const a of queue) {
        if (a.type === 'create' && a.endpoint === '/api/transactions' && a.body?.account_id && typeof a.body.amount === 'number') {
          adj[a.body.account_id] = (adj[a.body.account_id] || 0) + a.body.amount;
        } else if (a.type === 'delete' && a.body?.account_id && typeof a.body.amount === 'number') {
          adj[a.body.account_id] = (adj[a.body.account_id] || 0) - a.body.amount;
        }
      }
      setPendingBalanceAdj(adj);
    });
  }, [pendingCount]);

  useEffect(() => {
    const handleSWSync = async () => {
      if (!offlineService.isOnline()) return;
      const result = await offlineService.syncQueue(authService.apiFetch.bind(authService));
      await fetchData();
      if (result.synced > 0) {
        toast(`Background synced ${result.synced} change${result.synced !== 1 ? 's' : ''}.`, result.failed > 0 ? 'error' : 'success');
      }
    };
    window.addEventListener('sw-sync-offline', handleSWSync);
    return () => window.removeEventListener('sw-sync-offline', handleSWSync);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(async () => {
      if (!offlineService.isOnline()) return;
      const state = syncState.get();
      if (state.pendingCount === 0 || state.state === 'syncing') return;
      console.log('[sync-poller] found pending items, running sync');
      const result = await offlineService.syncQueue(authService.apiFetch.bind(authService));
      if (result.synced > 0) {
        await fetchData();
        toast(
          result.failed > 0
            ? `Synced ${result.synced} change${result.synced !== 1 ? 's' : ''}, ${result.failed} failed.`
            : `Synced ${result.synced} pending change${result.synced !== 1 ? 's' : ''}.`,
          result.failed > 0 ? 'error' : 'success'
        );
      }
    }, 7000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const adjustedAccounts = useMemo(() =>
    accounts.map(a => ({
      ...a, current_balance: a.current_balance + (pendingBalanceAdj[a.id] || 0)
    })),
    [accounts, pendingBalanceAdj]
  );

  return {
    isOnline, lastSync, pendingCount, isSyncing,
    members, accounts: adjustedAccounts, dataLoading, lastUpdate,
    fetchData,
  };
}
