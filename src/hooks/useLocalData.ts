import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { localDb, LocalMember, LocalAccount, LocalGroup, LocalTransaction } from '../services/localDb';
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
    initial_balance: r.initial_balance || 0, current_balance: r.current_balance || 0,
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
  const fetchingRef = useRef(false);
  const prevAuthRef = useRef(isAuthenticated);
  const authRef = useRef(isAuthenticated);
  authRef.current = isAuthenticated;

  const loadFromLocal = useCallback(async () => {
    const [localMembers, localAccounts] = await Promise.all([
      localDb.getMembers(),
      localDb.getAccounts(),
    ]);
    setMembers(localMembers);
    setAccounts(localAccounts);
  }, []);

  const fetchData = useCallback(async (showToast = false) => {
    if (!authRef.current) {
      if (showToast) toast("Sign in to sync data.", 'error');
      return;
    }
    if (!offlineService.isOnline()) {
      if (showToast) toast("Cannot refresh while offline.", 'error');
      return;
    }
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setDataLoading(true);
    try {
      const [membersRes, accountsRes] = await Promise.all([
        authService.apiFetch('/api/members'),
        authService.apiFetch('/api/accounts'),
      ]);

      if (membersRes.ok) {
        const data = await membersRes.json();
        // Build map of existing local records by server_id to avoid duplicates
        const localMembers = await localDb.getMembers();
        const localByServerId = new Map(localMembers.map(m => [m.server_id, m]));

        const toUpsert: LocalMember[] = data.map((m: { id: number; name: string; relationship?: string; client_id?: string; updated_at?: string }) => {
          const existing = localByServerId.get(m.id);
          if (existing) {
            // Preserve local id and pending status
            return {
              ...existing,
              name: m.name,
              relationship: m.relationship || '',
              updated_at: m.updated_at || existing.updated_at,
              sync_status: existing.sync_status === 'pending' ? 'pending' as const : 'synced' as const,
            };
          }
          // New record — use client_id or generate UUID
          return {
            id: m.client_id || generateId(),
            server_id: m.id,
            name: m.name,
            relationship: m.relationship || '',
            updated_at: m.updated_at || new Date().toISOString(),
            sync_status: 'synced' as const,
            _deleted: false,
          };
        });

        await localDb.putMembers(toUpsert);
        setMembers(await localDb.getMembers());
      }

      if (accountsRes.ok) {
        const data = await accountsRes.json();
        // Build map of existing local records by server_id to avoid duplicates
        const localAccounts = await localDb.getAccounts();
        const localByServerId = new Map(localAccounts.map(a => [a.server_id, a]));

        const toUpsert: LocalAccount[] = data.map((a: Record<string, unknown>) => {
          const existing = localByServerId.get(a.id as number);
          if (existing) {
            // Preserve local id and pending status
            return {
              ...existing,
              name: a.name as string,
              type: (a.type as string) || existing.type,
              member_id: (a.member_id as string | null) ?? existing.member_id,
              parent_id: (a.parent_id as string | null) ?? existing.parent_id,
              color: (a.color as string) || existing.color,
              archived: (a.archived as number) || existing.archived,
              initial_balance: (a.initial_balance as number) ?? existing.initial_balance,
              current_balance: (a.current_balance as number) ?? existing.current_balance,
              updated_at: (a.updated_at as string) || existing.updated_at,
              sync_status: existing.sync_status === 'pending' ? 'pending' as const : 'synced' as const,
            };
          }
          // New record — use client_id or generate UUID
          return {
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
          };
        });

        // Filter out groups — they belong in the groups store
        const nonGroupRecords = toUpsert.filter(r => r.type !== 'group');
        await localDb.putAccounts(nonGroupRecords);
        setAccounts(await localDb.getAccounts());
      }

      // Fetch groups
      const groupsRes = await authService.apiFetch('/api/groups');
      if (groupsRes.ok) {
        const data = await groupsRes.json();
        const localGroups = await localDb.getGroups();
        const localByServerId = new Map(localGroups.map(g => [g.server_id, g]));

        const toUpsert: LocalGroup[] = data.map((g: Record<string, unknown>) => {
          const existing = localByServerId.get(g.id as number);
          const children = (g.children as Array<{ id: number; name: string; type: string; current_balance: number }>) || [];
          if (existing) {
            return {
              ...existing,
              name: g.name as string,
              member_id: g.member_id != null ? String(g.member_id) : null,
              color: (g.color as string) || existing.color,
              child_count: (g.child_count as number) ?? existing.child_count,
              accumulated_balance: (g.accumulated_balance as number) ?? existing.accumulated_balance,
              children,
              updated_at: existing.updated_at,
              sync_status: existing.sync_status === 'pending' ? 'pending' as const : 'synced' as const,
            };
          }
          return {
            id: (g.client_id as string) || generateId(),
            server_id: g.id as number,
            name: g.name as string,
            type: (g.type as string) || 'group',
            member_id: g.member_id != null ? String(g.member_id) : null,
            color: (g.color as string) || '#A78BFA',
            child_count: (g.child_count as number) || 0,
            accumulated_balance: (g.accumulated_balance as number) || 0,
            children,
            updated_at: new Date().toISOString(),
            sync_status: 'synced' as const,
            _deleted: false,
          };
        });

        await localDb.putGroups(toUpsert);
      }

      setLastSync(Date.now());
      setLastUpdate(Date.now());
      offlineService.setLastSync();
      if (showToast) toast("Data refreshed.", 'success');
    } catch (error) {
      console.error("Fetch failed:", error);
      if (showToast) toast("Failed to refresh data.", 'error');
    } finally {
      fetchingRef.current = false;
      setDataLoading(false);
    }
  }, [toast]);

  // Initial load: read local first, then background fetch (runs once)
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

  // On login transition: clear stale state and fetch fresh data directly
  useEffect(() => {
    if (isAuthenticated && !prevAuthRef.current) {
      loadedRef.current = false;
      setMembers([]);
      setAccounts([]);
      if (offlineService.isOnline()) fetchData();
    }
    if (!isAuthenticated && prevAuthRef.current) {
      loadedRef.current = false;
      setMembers([]);
      setAccounts([]);
    }
    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated, fetchData]);

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
      if (authRef.current) {
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
