import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { localDb, LocalMember, LocalAccount, LocalTransaction } from '../services/localDb';
import { authService } from '../services/authService';
import { offlineService, syncState } from '../services/offlineService';
import { generateId } from '../utils/ids';
import { useToast } from '../components/Toast';

function toApiMember(r: LocalMember) {
  return { id: r.server_id ?? 0, name: r.name, relationship: r.relationship };
}

function toApiAccount(r: LocalAccount) {
  return {
    id: r.server_id ?? 0, name: r.name, type: r.type as 'cash' | 'bank' | 'mobile' | 'investment' | 'purpose' | 'home_exp' | 'group',
    member_id: r.member_id, parent_id: r.parent_id,
    color: r.color, archived: r.archived,
    initial_balance: r.initial_balance, current_balance: r.current_balance,
  };
}

export function useLocalData(isAuthenticated: boolean, onInitialLoad?: () => void) {
  const { toast } = useToast();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<number | null>(offlineService.getLastSync());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const loadedRef = useRef(false);

  const loadFromLocal = useCallback(async () => {
    const [localMembers, localAccounts] = await Promise.all([
      localDb.getMembers(),
      localDb.getAccounts(),
    ]);
    setMembers(localMembers);
    setAccounts(localAccounts);
  }, []);

  const fetchData = useCallback(async (showToast = false) => {
    if (!isAuthenticated) {
      if (showToast) toast("Sign in to sync data.", 'error');
      return;
    }
    if (!offlineService.isOnline()) {
      if (showToast) toast("Cannot refresh while offline.", 'error');
      return;
    }
    setDataLoading(true);
    setLastUpdate(Date.now());
    try {
      const [membersRes, accountsRes] = await Promise.all([
        authService.apiFetch('/api/members'),
        authService.apiFetch('/api/accounts'),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        const records: LocalMember[] = data.map((m: { id: number; name: string; relationship?: string; client_id?: string; updated_at?: string }) => ({
          id: m.client_id || generateId(),
          server_id: m.id,
          name: m.name,
          relationship: m.relationship || '',
          updated_at: m.updated_at || new Date().toISOString(),
          sync_status: 'synced' as const,
          _deleted: false,
        }));
        setMembers(records);
        await localDb.putMembers(records);
      }

      if (accountsRes.ok) {
        const data = await accountsRes.json();
        const records: LocalAccount[] = data.map((a: Record<string, unknown>) => ({
          id: (a.client_id as string) || generateId(),
          server_id: a.id as number,
          name: a.name as string,
          type: (a.type as string) || 'cash',
          member_id: a.member_id as string | null,
          parent_id: a.parent_id as string | null,
          color: (a.color as string) || '#A78BFA',
          archived: (a.archived as number) || 0,
          initial_balance: (a.initial_balance as number) || 0,
          current_balance: (a.current_balance as number) || 0,
          updated_at: (a.updated_at as string) || new Date().toISOString(),
          sync_status: 'synced' as const,
          _deleted: false,
        }));
        setAccounts(records);
        await localDb.putAccounts(records);
      }

      setLastSync(Date.now());
      offlineService.setLastSync();
      if (showToast) toast("Data refreshed.", 'success');
    } catch (error) {
      console.error("Fetch failed:", error);
      if (showToast) toast("Failed to refresh data.", 'error');
    } finally {
      setDataLoading(false);
    }
  }, [isAuthenticated, toast]);

  // Initial load: read local first, then background fetch
  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;

    loadFromLocal().then(() => {
      onInitialLoad?.();
      if (isAuthenticated && offlineService.isOnline()) {
        fetchData();
      }
    });
  }, [isAuthenticated, loadFromLocal, fetchData, onInitialLoad]);

  // Polling every 30s
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && offlineService.isOnline()) fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchData]);

  // Visibility change refetch
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && offlineService.isOnline()) {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isAuthenticated, fetchData]);

  // Online/offline events
  useEffect(() => {
    const offCleanup = offlineService.onOffline(() => setIsOnline(false));
    const onCleanup = offlineService.onOnline(async () => {
      setIsOnline(true);
      if (isAuthenticated) {
        const result = await offlineService.syncQueue(authService.apiFetch.bind(authService));
        await fetchData();
        if (result.synced > 0) {
          const msg = result.failed > 0
            ? `Synced ${result.synced} change${result.synced !== 1 ? 's' : ''}, ${result.failed} failed.`
            : `Synced ${result.synced} pending change${result.synced !== 1 ? 's' : ''}.`;
          toast(msg, result.failed > 0 ? 'error' : 'success');
        }
      }
    });
    return () => { offCleanup(); onCleanup(); };
  }, [isAuthenticated, fetchData, toast]);

  // Sync state listener
  useEffect(() => {
    const unsub = syncState.subscribe(s => {
      setPendingCount(s.pendingCount);
      setIsSyncing(s.state === 'syncing');
    });
    return unsub;
  }, []);

  const apiMembers = useMemo(() => members.map(toApiMember), [members]);
  const apiAccounts = useMemo(() => accounts.map(toApiAccount), [accounts]);

  return {
    isOnline,
    lastSync,
    pendingCount,
    isSyncing,
    members: apiMembers,
    accounts: apiAccounts,
    localMembers: members,
    localAccounts: accounts,
    dataLoading,
    lastUpdate,
    fetchData,
  };
}
