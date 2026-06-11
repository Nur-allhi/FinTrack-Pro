import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { localDb, LocalMember, LocalAccount, LocalGroup, LocalTransaction } from '../services/localDb';
import { authService } from '../services/authService';
import { syncState, isOnline, onOnline, onOffline, getLastSync, setLastSync as setLastSyncStamp, initPendingCount } from '../services/syncEngine';
import { generateId } from '../utils/ids';
import { useToast } from '../components/Toast';

function toApiMember(r: LocalMember) {
  return { id: r.server_id ?? 0, name: r.name, relationship: r.relationship };
}

function toApiAccount(
  r: LocalAccount,
  memberLocalIdToServerId: Map<string, number>,
  memberNameById: Map<string | number, string>,
  accountNameById: Map<string | number, string>,
) {
  const memberId = r.member_id != null
    ? memberLocalIdToServerId.get(String(r.member_id)) ?? r.member_id
    : null;
  const memberName = r.member_id != null ? memberNameById.get(r.member_id) ?? undefined : undefined;
  const parentName = r.parent_id != null ? accountNameById.get(r.parent_id) ?? undefined : undefined;
  return {
    id: r.server_id ?? 0,
    _localId: r.id,
    name: r.name, type: r.type as 'cash' | 'bank' | 'mobile' | 'investment' | 'purpose' | 'home_exp' | 'group',
    member_id: memberId, member_name: memberName,
    parent_id: r.parent_id, parent_name: parentName,
    color: r.color, archived: r.archived,
    initial_balance: r.initial_balance || 0, current_balance: r.current_balance || 0,
  };
}

export function useLocalData(isAuthenticated: boolean, onInitialLoad?: () => void) {
  const { toast } = useToast();
  const toastRef = useRef(toast);
  toastRef.current = toast;
  const [isOnlineState, setIsOnlineState] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState<number | null>(getLastSync());
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{ current: number; total: number } | null>(null);
  const [members, setMembers] = useState<LocalMember[]>([]);
  const [accounts, setAccounts] = useState<LocalAccount[]>([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(Date.now());
  const loadedRef = useRef(false);
  const fetchingRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const prevAuthRef = useRef(isAuthenticated);
  const authRef = useRef(isAuthenticated);
  authRef.current = isAuthenticated;

  const loadFromLocal = useCallback(async () => {
    try {
      const [localMembers, localAccounts] = await Promise.all([
        localDb.getMembers(),
        localDb.getAccounts(),
      ]);
      setMembers(localMembers);
      setAccounts(localAccounts);
    } catch (e) {
      console.error('loadFromLocal failed:', e);
    }
  }, []);


  const fetchData = useCallback(async (showToast = false) => {
    if (!authRef.current) {
      if (showToast) toastRef.current("Sign in to sync data.", 'error');
      return;
    }
    if (!isOnline()) {
      if (showToast) toastRef.current("Cannot refresh while offline.", 'error');
      return;
    }
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    setDataLoading(true);
    try {
      // Fetch members first, then accounts — accounts depend on member data
      const membersRes = await authService.apiFetch('/api/members');

      // Detect guest mode (403) and show toast
      if (membersRes.status === 403) {
        toast("Sign in to sync your data across devices.", 'info');
        return;
      }

      if (membersRes.ok) {
        const data = await membersRes.json();
        // Build map of all local records (including soft-deleted) by server_id to avoid re-import
        const allMemberRecords = await localDb.getAllRecords<LocalMember>('members');
        const localByServerId = new Map(allMemberRecords.map(m => [m.server_id, m]));

        const toUpsert: LocalMember[] = data.map((m: { id: number; name: string; relationship?: string; client_id?: string; updated_at?: string; deleted_at?: string | null }) => {
          const existing = localByServerId.get(m.id);
          if (existing) {
            return {
              ...existing,
              name: m.name,
              relationship: m.relationship || '',
              _deleted: existing.sync_status === 'pending' ? existing._deleted : !!m.deleted_at,
              updated_at: m.updated_at || existing.updated_at,
              sync_status: existing.sync_status === 'pending' ? 'pending' as const : 'synced' as const,
            };
          }
          if (m.deleted_at) return null;
          return {
            id: m.client_id || generateId(),
            server_id: m.id,
            name: m.name,
            relationship: m.relationship || '',
            updated_at: m.updated_at || new Date().toISOString(),
            sync_status: 'synced' as const,
            _deleted: false,
          };
        }).filter(Boolean) as LocalMember[];

        await localDb.putMembers(toUpsert);
        // Soft-purge records not in server response (deleted server-side) — mark _deleted instead of hard-delete
        const accountsLocal = await localDb.getAccounts();
        const serverMemberIds = new Set(data.map((m: { id: number }) => m.id));
        const allLocalMembers = await localDb.getMembers();
        const orphanedLocalMembers = allLocalMembers
          .filter(m => m.server_id != null && !serverMemberIds.has(m.server_id));
        for (const orphan of orphanedLocalMembers) {
          const hasAccounts = accountsLocal.some(a => a.member_id === orphan.server_id || a.member_id === orphan.id);
          if (hasAccounts) {
            await localDb.putMember({ ...orphan, _deleted: true, sync_status: 'pending', updated_at: new Date().toISOString() });
          } else {
            await localDb.deleteMember(orphan.id);
          }
        }
        setMembers(await localDb.getMembers());
      }

      // Now fetch accounts — member data is guaranteed to be in localDb
      const accountsRes = await authService.apiFetch('/api/accounts');
      if (accountsRes.ok) {
        const data = await accountsRes.json();
        // Build map of existing local records by server_id to avoid duplicates
        const localAccounts = await localDb.getAccounts();
        const localByServerId = new Map(localAccounts.map(a => [a.server_id, a]));
        
        // Build server_id → local_id maps for FK conversion
        const localMembers = await localDb.getMembers();
        const memberServerIdToLocalId = new Map<number, string>();
        for (const m of localMembers) {
          if (m.server_id != null) memberServerIdToLocalId.set(m.server_id, m.id);
        }
        const accountServerIdToLocalId = new Map<number, string>();
        for (const a of localAccounts) {
          if (a.server_id != null) accountServerIdToLocalId.set(a.server_id, a.id);
        }

        const toUpsert: LocalAccount[] = data.map((a: Record<string, unknown>) => {
          const serverMemberId = a.member_id as number | null;
          const serverParentId = a.parent_id as number | null;
          const localMemberId = serverMemberId != null ? memberServerIdToLocalId.get(serverMemberId) ?? null : null;
          const localParentId = serverParentId != null ? accountServerIdToLocalId.get(serverParentId) ?? null : null;

          const existing = localByServerId.get(a.id as number);
          if (existing) {
            return {
              ...existing,
              name: a.name as string,
              type: (a.type as string) || existing.type,
              member_id: localMemberId ?? existing.member_id,
              parent_id: localParentId ?? existing.parent_id,
              color: (a.color as string) || existing.color,
              archived: (a.archived as number) ?? existing.archived,
              initial_balance: (a.initial_balance as number) ?? existing.initial_balance,
              current_balance: existing.current_balance,
              currency: (a.currency as string) || existing.currency,
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
            member_id: localMemberId,
            parent_id: localParentId,
            color: (a.color as string) || '#A78BFA',
            archived: (a.archived as number) || 0,
            initial_balance: (a.initial_balance as number) || 0,
            current_balance: (a.current_balance as number) || 0,
            currency: (a.currency as string) || 'USD',
            updated_at: (a.updated_at as string) || new Date().toISOString(),
            sync_status: 'synced' as const,
            _deleted: false,
          };
        });

        // Filter out groups — they belong in the groups store
        const nonGroupRecords = toUpsert.filter(r => r.type !== 'group');
        await localDb.putAccounts(nonGroupRecords);
        // Purge records not in server response (deleted server-side, or sync engine duplicates)
        const serverAccountIds = new Set(data.map((a: { id: number }) => a.id));
        const allLocalAccounts = await localDb.getAccounts();
        const orphanedAccountIds = allLocalAccounts
          .filter(a => a.server_id != null && !serverAccountIds.has(a.server_id))
          .map(a => a.id);
        if (orphanedAccountIds.length) {
          await Promise.all(orphanedAccountIds.map(id => localDb.deleteAccount(id)));
        }
        setAccounts(await localDb.getAccounts());
      }

      // Fetch groups
      const groupsRes = await authService.apiFetch('/api/groups');
      if (groupsRes.ok) {
        const data = await groupsRes.json();
        const localGroups = await localDb.getGroups();
        const localByServerId = new Map(localGroups.map(g => [g.server_id, g]));

        const toUpsert: LocalGroup[] = data.map((g: Record<string, unknown>) => {
          const serverMemberId = g.member_id as number | null;

          const existing = localByServerId.get(g.id as number);
          const children = (g.children as Array<{ id: number; name: string; type: string; member_name?: string; current_balance: number }>) || [];
          if (existing) {
            return {
              ...existing,
              name: g.name as string,
              member_id: serverMemberId ?? existing.member_id,
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
            member_id: serverMemberId,
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
      setLastSyncStamp();
      if (showToast) toast("Data refreshed.", 'success');
    } catch (error) {
      console.error("Fetch failed:", error);
      if (showToast) toastRef.current("Failed to refresh data.", 'error');
    } finally {
      fetchingRef.current = false;
      setDataLoading(false);
    }
  }, []);

  // Initial load + auth transition: read local first, then background fetch
  useEffect(() => {
    if (!isAuthenticated) {
      // On logout: clear state
      if (prevAuthRef.current) {
        loadedRef.current = false;
        setMembers([]);
        setAccounts([]);
      }
      prevAuthRef.current = false;
      return;
    }

    // On first auth or login transition: load from local, then fetch from server
    if (!initialLoadDoneRef.current || !prevAuthRef.current) {
      loadedRef.current = false;
      setMembers([]);
      setAccounts([]);
      initialLoadDoneRef.current = true;

      loadFromLocal().then(() => {
        onInitialLoad?.();
        if (isOnline()) {
          fetchData();
        }
      });
    }
    prevAuthRef.current = isAuthenticated;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Polling every 30s
  useEffect(() => {
    if (!isAuthenticated) return;
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible' && isOnline()) fetchData();
    }, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, fetchData]);

  // Visibility change refetch
  useEffect(() => {
    if (!isAuthenticated) return;
    const handleVisibility = () => {
      if (document.visibilityState === 'visible' && isOnline()) {
        fetchData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [isAuthenticated, fetchData]);

  // Online/offline events
  useEffect(() => {
    const offCleanup = onOffline(() => setIsOnlineState(false));
    const onCleanup = onOnline(async () => {
      setIsOnlineState(true);
      if (authRef.current) {
        await fetchData();
      }
    });
    return () => { offCleanup(); onCleanup(); };
  }, [isAuthenticated, fetchData]);

  // Sync state listener
  useEffect(() => {
    const unsub = syncState.subscribe(s => {
      setPendingCount(s.pendingCount);
      setIsSyncing(s.state === 'syncing');
      setSyncProgress(s.progress ?? null);
    });
    return unsub;
  }, []);

  // Subscribe to localDb account changes
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = localDb.onChange('accounts', async () => {
      const localAccounts = await localDb.getAccounts();
      setAccounts(localAccounts);
    });
    return unsub;
  }, [isAuthenticated]);

  // Subscribe to localDb member changes
  useEffect(() => {
    if (!isAuthenticated) return;
    const unsub = localDb.onChange('members', async () => {
      const localMembers = await localDb.getMembers();
      setMembers(localMembers);
    });
    return unsub;
  }, [isAuthenticated]);

  const apiMembers = useMemo(() => members.map(toApiMember), [members]);
  const memberLocalIdToServerId = useMemo(() => {
    const map = new Map<string, number>();
    for (const m of members) {
      if (m.server_id != null) map.set(m.id, m.server_id);
    }
    return map;
  }, [members]);
  const memberNameById = useMemo(() => {
    const map = new Map<string | number, string>();
    for (const m of members) {
      map.set(m.id, m.name);
      if (m.server_id != null) map.set(m.server_id, m.name);
    }
    return map;
  }, [members]);

  const accountNameById = useMemo(() => {
    const map = new Map<string | number, string>();
    for (const a of accounts) {
      map.set(a.id, a.name);
      if (a.server_id != null) map.set(a.server_id, a.name);
    }
    return map;
  }, [accounts]);

  const apiAccounts = useMemo(
    () => accounts.map(a => toApiAccount(a, memberLocalIdToServerId, memberNameById, accountNameById)),
    [accounts, memberLocalIdToServerId, memberNameById, accountNameById],
  );

  return {
    isOnline: isOnlineState,
    lastSync,
    pendingCount,
    isSyncing,
    syncProgress,
    members: apiMembers,
    accounts: apiAccounts,
    localMembers: members,
    localAccounts: accounts,
    dataLoading,
    lastUpdate,
    fetchData,
    reloadFromLocal: loadFromLocal,
  };
}
