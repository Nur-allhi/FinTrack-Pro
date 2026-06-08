import { localDb, LocalRecord, EntityName, LocalTransaction, LocalLoan, LocalInvestment, LocalMember } from './localDb';
import { authService } from './authService';
import { isLocalOnly } from '../../shared/schema';

const SYNC_TABLES = [
  'members', 'transactions', 'loans',
  'loan_settlements', 'investments', 'investment_returns',
  'budgets', 'recurring_transactions',
] as const;

type SyncTable = typeof SYNC_TABLES[number];

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
}

/** Local-only fields that must never be sent to server */
const LOCAL_ONLY_FIELDS = ['id', 'server_id', 'sync_status', '_deleted'] as const;

/** Server-generated columns that must never be sent to server (e.g., generated tsvector columns) */
const SERVER_GENERATED_FIELDS = ['fts'] as const;

/** Computed/joined fields that exist on API response types but not on actual DB columns */
const COMPUTED_FIELDS = ['lender_name', 'borrower_account_name', 'account_name'] as const;

/** Strip local-only fields and map _deleted → deleted_at */
function sanitizeForPush(record: LocalRecord): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(record)) {
    if (LOCAL_ONLY_FIELDS.includes(key as typeof LOCAL_ONLY_FIELDS[number])) continue;
    if (SERVER_GENERATED_FIELDS.includes(key as typeof SERVER_GENERATED_FIELDS[number])) continue;
    if (COMPUTED_FIELDS.includes(key as typeof COMPUTED_FIELDS[number])) continue;
    out[key] = value;
  }
  // Map id → client_id
  out.client_id = record.id;
  // Map _deleted boolean → deleted_at timestamp
  if (record._deleted === true) {
    out.deleted_at = new Date().toISOString();
  }
  return out;
}

/** Convert server deleted_at → local _deleted */
function sanitizeForPull(record: Record<string, unknown>): Record<string, unknown> {
  const out = { ...record };
  if (out.deleted_at != null) {
    out._deleted = true;
    delete out.deleted_at;
  }
  return out;
}

let _isSyncing = false;
let _syncListeners: ((syncing: boolean) => void)[] = [];

export function onSyncStateChange(listener: (syncing: boolean) => void) {
  _syncListeners.push(listener);
  return () => { _syncListeners = _syncListeners.filter(l => l !== listener); };
}

function setSyncing(v: boolean) {
  _isSyncing = v;
  _syncListeners.forEach(l => l(v));
  syncState.setState({ state: v ? 'syncing' : 'idle', progress: v ? _syncProgress : null });
}

export function isSyncing() {
  return _isSyncing;
}

async function getUnsyncedForTable(table: SyncTable): Promise<LocalRecord[]> {
  const getter = {
    members: async () => {
      const [pending, deleted] = await Promise.all([
        localDb.getUnsyncedMembers(),
        localDb.getAllRecords('members').then(r => r.filter(x => x._deleted)),
      ]);
      return [...pending, ...deleted];
    },
    transactions: async () => {
      const [pending, deleted] = await Promise.all([
        localDb.getUnsyncedTransactions(),
        localDb.getAllRecords('transactions').then(r => r.filter(x => x._deleted)),
      ]);
      return [...pending, ...deleted];
    },
    loans: async () => {
      const [pending, deleted] = await Promise.all([
        localDb.getUnsyncedLoans(),
        localDb.getAllRecords('loans').then(r => r.filter(x => x._deleted)),
      ]);
      return [...pending, ...deleted];
    },
    loan_settlements: async () => {
      const [pending, deleted] = await Promise.all([
        localDb.getLoanSettlements().then(r => r.filter(x => x.sync_status === 'pending')),
        localDb.getAllRecords('loan_settlements').then(r => r.filter(x => x._deleted)),
      ]);
      return [...pending, ...deleted];
    },
    investments: async () => {
      const [pending, deleted] = await Promise.all([
        localDb.getInvestments().then(r => r.filter(x => x.sync_status === 'pending')),
        localDb.getAllRecords('investments').then(r => r.filter(x => x._deleted)),
      ]);
      return [...pending, ...deleted];
    },
    investment_returns: async () => {
      const [pending, deleted] = await Promise.all([
        localDb.getInvestmentReturns().then(r => r.filter(x => x.sync_status === 'pending')),
        localDb.getAllRecords('investment_returns').then(r => r.filter(x => x._deleted)),
      ]);
      return [...pending, ...deleted];
    },
    budgets: async () => {
      const [pending, deleted] = await Promise.all([
        localDb.getBudgets().then(r => r.filter(x => x.sync_status === 'pending')),
        localDb.getAllRecords('budgets').then(r => r.filter(x => x._deleted)),
      ]);
      return [...pending, ...deleted];
    },
    recurring_transactions: async () => {
      const [pending, deleted] = await Promise.all([
        localDb.getRecurringTransactions().then(r => r.filter(x => x.sync_status === 'pending')),
        localDb.getAllRecords('recurring_transactions').then(r => r.filter(x => x._deleted)),
      ]);
      return [...pending, ...deleted];
    },
  }[table];
  return getter();
}

async function markTableSynced(table: SyncTable, ids: string[]): Promise<void> {
  const markers = {
    members: () => localDb.markMembersSynced(ids),
    transactions: () => localDb.markTransactionsSynced(ids),
    loans: () => localDb.markLoansSynced(ids),
    loan_settlements: async () => {},
    investments: async () => {},
    investment_returns: async () => {},
    budgets: async () => {},
    recurring_transactions: async () => {},
  }[table];
  return markers();
}

async function upsertFromServer(table: SyncTable, records: Record<string, unknown>[]): Promise<void> {
  const putters = {
    members: (r: Record<string, unknown>[]) => localDb.putMembers(r as never[]),
    transactions: (r: Record<string, unknown>[]) => localDb.putTransactions(r as never[]),
    loans: (r: Record<string, unknown>[]) => localDb.putLoans(r as never[]),
    loan_settlements: (r: Record<string, unknown>[]) => localDb.putLoanSettlements(r as never[]),
    investments: (r: Record<string, unknown>[]) => localDb.putInvestments(r as never[]),
    investment_returns: (r: Record<string, unknown>[]) => localDb.putInvestmentReturns(r as never[]),
    budgets: (r: Record<string, unknown>[]) => localDb.putBudgets(r as never[]),
    recurring_transactions: (r: Record<string, unknown>[]) => localDb.putRecurringTransactions(r as never[]),
  }[table];
  return putters(records);
}

// Push unsynced local records to server
async function pushUnsynced(): Promise<{ pushed: number; conflicts: number }> {
  const records: Record<string, LocalRecord[]> = {};
  let totalUnsynced = 0;

  for (const table of SYNC_TABLES) {
    const unsynced = await getUnsyncedForTable(table);
    if (unsynced.length > 0) {
      records[table] = unsynced;
      totalUnsynced += unsynced.length;
    }
  }

  if (totalUnsynced === 0) return { pushed: 0, conflicts: 0 };

  _syncProgress = { current: 0, total: SYNC_TABLES.length };
  syncState.setState({ progress: _syncProgress });

  // Build local_id → server_id maps for FK translation (push direction)
  const localAccounts = await localDb.getAccounts();
  const accountLocalIdToServerId = new Map<string, number>();
  for (const a of localAccounts) {
    if (a.server_id != null) accountLocalIdToServerId.set(a.id, a.server_id);
  }

  const localTransactions = await localDb.getAllRecords('transactions') as Array<LocalTransaction & { server_id?: number | null }>;
  const transactionLocalIdToServerId = new Map<string, number>();
  for (const t of localTransactions) {
    if (t.server_id != null) transactionLocalIdToServerId.set(t.id, t.server_id);
  }

  const localLoans = await localDb.getAllRecords('loans') as Array<LocalLoan & { server_id?: number | null }>;
  const loanLocalIdToServerId = new Map<string, number>();
  for (const l of localLoans) {
    if (l.server_id != null) loanLocalIdToServerId.set(l.id, l.server_id);
  }

  const localInvestments = await localDb.getAllRecords('investments') as Array<LocalInvestment & { server_id?: number | null }>;
  const investmentLocalIdToServerId = new Map<string, number>();
  for (const inv of localInvestments) {
    if (inv.server_id != null) investmentLocalIdToServerId.set(inv.id, inv.server_id);
  }

  const localMembers = await localDb.getAllRecords('members') as Array<LocalMember & { server_id?: number | null }>;
  const memberLocalIdToServerId = new Map<string, number>();
  for (const m of localMembers) {
    if (m.server_id != null) memberLocalIdToServerId.set(m.id, m.server_id);
  }

  // Reset any accounts incorrectly marked as pending before building FK maps
  await resetStaleAccountPending();

  // Sanitize: strip local-only fields, map id→client_id, _deleted→deleted_at, translate FKs
  // Records with untranslatable REQUIRED FKs are skipped (stay pending for next cycle).
  const sanitized: Record<string, Record<string, unknown>[]> = {};
  for (const [table, recs] of Object.entries(records)) {
    const pushable: Record<string, unknown>[] = [];
    for (const r of recs) {
      const base = sanitizeForPush(r);
      let skip = false;

      if (table === 'transactions') {
        if (base.account_id != null) {
          const serverId = accountLocalIdToServerId.get(base.account_id as string);
          if (serverId != null) base.account_id = serverId;
          else skip = true; // required FK
        }
        if (base.linked_transaction_id != null) {
          const serverId = transactionLocalIdToServerId.get(base.linked_transaction_id as string);
          if (serverId != null) base.linked_transaction_id = serverId;
          else delete base.linked_transaction_id; // optional FK
        }
      }
      if (table === 'loans') {
        if (base.lender_account_id != null) {
          const serverId = accountLocalIdToServerId.get(base.lender_account_id as string);
          if (serverId != null) base.lender_account_id = serverId;
          else skip = true; // required FK
        }
        if (base.borrower_account_id != null) {
          const serverId = accountLocalIdToServerId.get(base.borrower_account_id as string);
          if (serverId != null) base.borrower_account_id = serverId;
          else delete base.borrower_account_id; // optional FK
        }
      }
      if (table === 'loan_settlements') {
        if (base.loan_id != null) {
          const serverId = loanLocalIdToServerId.get(base.loan_id as string);
          if (serverId != null) base.loan_id = serverId;
          else skip = true; // required FK
        }
        if (base.transaction_id != null) {
          const serverId = transactionLocalIdToServerId.get(base.transaction_id as string);
          if (serverId != null) base.transaction_id = serverId;
          else delete base.transaction_id; // optional FK (can be null)
        }
      }
      if (table === 'investments') {
        if (base.account_id != null) {
          const serverId = accountLocalIdToServerId.get(base.account_id as string);
          if (serverId != null) base.account_id = serverId;
          else skip = true; // required FK
        }
      }
      if (table === 'investment_returns') {
        if (base.investment_id != null) {
          const serverId = investmentLocalIdToServerId.get(base.investment_id as string);
          if (serverId != null) base.investment_id = serverId;
          else skip = true; // required FK
        }
      }
      if (table === 'recurring_transactions') {
        if (base.account_id != null) {
          const serverId = accountLocalIdToServerId.get(base.account_id as string);
          if (serverId != null) base.account_id = serverId;
          else skip = true; // required FK
        }
      }
      if (table === 'groups') {
        if (base.member_id != null) {
          const serverId = memberLocalIdToServerId.get(base.member_id as string);
          if (serverId != null) base.member_id = serverId;
          else skip = true; // required FK
        }
      }

      if (!skip) pushable.push(base);
    }
    sanitized[table] = pushable;
  }

  const res = await authService.apiFetch('/api/sync/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records: sanitized }),
  });

  if (!res.ok) return { pushed: 0, conflicts: 0 };

  const data = await res.json();
  let pushed = 0;
  let conflicts = 0;

  for (const [i, table] of SYNC_TABLES.entries()) {
    _syncProgress = { current: i + 1, total: SYNC_TABLES.length };
    syncState.setState({ progress: _syncProgress });

    const result = data.results?.[table];
    if (!result) continue;
    pushed += result.pushed || 0;
    conflicts += result.conflicts || 0;
    if (result.pushed > 0) {
      const ids = result.ids || [];
      if (ids.length > 0) {
        await localDb.markPushed(table as EntityName, ids);
      } else {
        const fallbackIds = (records[table] || []).map(r => r.id);
        await markTableSynced(table as SyncTable, fallbackIds);
      }
    }
  }

  _syncProgress = null;
  syncState.setState({ progress: null });
  return { pushed, conflicts };
}

// Pull server changes since last sync
async function pullChanges(): Promise<number> {
  const lastSync = await localDb.getMeta('sync_timestamp') as string | undefined;
  const since = lastSync || '1970-01-01T00:00:00Z';

  const res = await authService.apiFetch(`/api/sync/pull?since=${encodeURIComponent(since)}`);
  if (!res.ok) return 0;

  const data = await res.json();
  let totalPulled = 0;

  // Build account server_id → local_id map (for translating transactions/loans account refs)
  const localAccounts = await localDb.getAccounts();
  const accountIdMap = new Map<number, string>();
  for (const a of localAccounts) {
    if (a.server_id != null) accountIdMap.set(a.server_id, a.id);
  }

  // Build loan server_id → local_id map (for translating loan_settlements refs)
  const localLoans = await localDb.getLoans();
  const loanIdMap = new Map<number, string>();
  for (const l of localLoans) {
    if (l.server_id != null) loanIdMap.set(l.server_id, l.id);
  }

  for (const [i, table] of SYNC_TABLES.entries()) {
    _syncProgress = { current: i + 1, total: SYNC_TABLES.length };
    syncState.setState({ progress: _syncProgress });

    const changes = data.changes?.[table];
    if (!Array.isArray(changes) || changes.length === 0) continue;

    // Translate server numeric account refs to local UUIDs, and map deleted_at → _deleted
    const translated = changes.map((r: Record<string, unknown>) => {
      const sanitized = sanitizeForPull(r);
      if (table === 'transactions' && sanitized.account_id != null) {
        const localId = accountIdMap.get(Number(sanitized.account_id));
        if (localId) return { ...sanitized, account_id: localId };
      }
      if (table === 'loans') {
        let updated = sanitized;
        if (sanitized.lender_account_id != null) {
          const localId = accountIdMap.get(Number(sanitized.lender_account_id));
          if (localId) updated = { ...updated, lender_account_id: localId };
        }
        if (sanitized.borrower_account_id != null) {
          const localId = accountIdMap.get(Number(sanitized.borrower_account_id));
          if (localId) updated = { ...updated, borrower_account_id: localId };
        }
        return updated;
      }
      if (table === 'loan_settlements' && sanitized.loan_id != null) {
        const localLoanId = loanIdMap.get(Number(sanitized.loan_id));
        if (localLoanId) return { ...sanitized, loan_id: localLoanId };
      }
      return sanitized;
    });

    // Get local records for LWW comparison — key by server_id
    const localRecords = await localDb.getAllRecords(table as EntityName) as Array<LocalRecord & { server_id?: number | null }>;
    const localMap = new Map(localRecords.map(r => [r.server_id, r]));

    // Filter: skip records where local has pending changes or is newer
    const toUpsert = translated.filter((r: Record<string, unknown>) => {
      const local = localMap.get(r.id as number);
      if (!local) return true; // new record, upsert
      if (local.sync_status === 'pending') return false; // local has unpushed changes, skip
      // Both synced — LWW by updated_at
      const serverTime = new Date((r.updated_at as string) || 0).getTime();
      const localTime = new Date(local.updated_at).getTime();
      return serverTime > localTime;
    });

    if (toUpsert.length === 0) continue;

    const localRecords2 = toUpsert.map((r: Record<string, unknown>) => {
      const existing = localMap.get(r.id as number);
      return {
        ...r,
        // Canonical fields after spread so server data can't override our key structure
        id: existing?.id || crypto.randomUUID(),
        server_id: r.id,
        updated_at: (r.updated_at as string) || new Date().toISOString(),
        sync_status: 'synced' as const,
        _deleted: r._deleted === true,
      };
    });

    await upsertFromServer(table as SyncTable, localRecords2);
    totalPulled += toUpsert.length;
  }

  if (totalPulled > 0 || data.pulledAt) {
    await localDb.setMeta('sync_timestamp', data.pulledAt || new Date().toISOString());
  }

  _syncProgress = null;
  syncState.setState({ progress: null });
  return totalPulled;
}

// Full sync: push then pull
export async function syncNow(): Promise<SyncResult> {
  if (_isSyncing) return { pushed: 0, pulled: 0, conflicts: 0 };
  if (!navigator.onLine) return { pushed: 0, pulled: 0, conflicts: 0 };

  let hasPending = false;
  for (const table of SYNC_TABLES) {
    const unsynced = await getUnsyncedForTable(table);
    if (unsynced.length > 0) { hasPending = true; break; }
  }

  if (!hasPending) {
    const pulled = await pullChanges();
    await refreshPendingCount();
    return { pushed: 0, pulled, conflicts: 0 };
  }

  setSyncing(true);
  try {
    const pushResult = await pushUnsynced();
    const pulled = await pullChanges();
    await refreshPendingCount();
    return { pushed: pushResult.pushed, pulled, conflicts: pushResult.conflicts };
  } catch (err) {
    console.error('Sync failed:', err);
    return { pushed: 0, pulled: 0, conflicts: 0 };
  } finally {
    setSyncing(false);
  }
}

// Push-only sync: flush pending local changes to server (no pull)
export async function flushPending(): Promise<void> {
  if (_isSyncing) return;
  if (!navigator.onLine) return;

  let hasPending = false;
  for (const table of SYNC_TABLES) {
    const unsynced = await getUnsyncedForTable(table);
    if (unsynced.length > 0) { hasPending = true; break; }
  }

  if (!hasPending) return;

  setSyncing(true);
  try {
    await pushUnsynced();
    await refreshPendingCount();
  } catch (err) {
    console.error('Flush failed:', err);
  } finally {
    setSyncing(false);
  }
}

// Initial sync for guest → registered migration
export async function initialSync(): Promise<boolean> {
  if (_isSyncing) return false;

  setSyncing(true);
  try {
    const res = await authService.apiFetch('/api/sync/initial', { method: 'POST' });
    if (!res.ok) return false;

    const data = await res.json();
    for (const table of SYNC_TABLES) {
      const rows = data.data?.[table];
      if (!Array.isArray(rows) || rows.length === 0) continue;

      const localRecords = rows.map((r: Record<string, unknown>) => {
        const sanitized = sanitizeForPull(r);
        return {
          ...sanitized,
          id: crypto.randomUUID(),
          server_id: r.id,
          updated_at: (r.updated_at as string) || new Date().toISOString(),
          sync_status: 'synced' as const,
          _deleted: sanitized._deleted === true,
        };
      });

      await upsertFromServer(table as SyncTable, localRecords);
    }

    await localDb.setMeta('sync_timestamp', data.syncedAt || new Date().toISOString());
    return true;
  } catch (err) {
    console.error('Initial sync failed:', err);
    return false;
  } finally {
    setSyncing(false);
  }
}

// Background sync scheduler
let _syncInterval: ReturnType<typeof setInterval> | null = null;
let _reconcileInterval: ReturnType<typeof setInterval> | null = null;
let _started = false;
let _handleVisibility: (() => void) | null = null;
let _handleOnline: (() => void) | null = null;
let _stopPendingRefresh: (() => void) | null = null;

export function startSyncScheduler() {
  if (_started) return;
  _started = true;

  _handleVisibility = () => {
    if (document.visibilityState === 'visible') {
      syncNow();
    }
  };
  _handleOnline = () => {
    syncNow();
  };

  document.addEventListener('visibilitychange', _handleVisibility);
  window.addEventListener('online', _handleOnline);

  _stopPendingRefresh = startPendingCountAutoRefresh();

  _syncInterval = setInterval(() => {
    if (navigator.onLine) {
      syncNow();
    }
  }, 30_000);

  _reconcileInterval = setInterval(() => {
    if (navigator.onLine) {
      syncNow();
    }
  }, 5 * 60 * 1000);
}

export function stopSyncScheduler() {
  if (_syncInterval) {
    clearInterval(_syncInterval);
    _syncInterval = null;
  }
  if (_reconcileInterval) {
    clearInterval(_reconcileInterval);
    _reconcileInterval = null;
  }
  if (_handleVisibility) {
    document.removeEventListener('visibilitychange', _handleVisibility);
    _handleVisibility = null;
  }
  if (_handleOnline) {
    window.removeEventListener('online', _handleOnline);
    _handleOnline = null;
  }
  if (_stopPendingRefresh) {
    _stopPendingRefresh();
    _stopPendingRefresh = null;
  }
  _started = false;
}

type SyncStateListener = (state: SyncStatus) => void;

export type SyncProgress = {
  current: number;
  total: number;
};

export type SyncStatus = {
  state: 'idle' | 'syncing' | 'error';
  lastSyncAt: number | null;
  pendingCount: number;
  progress: SyncProgress | null;
};

let _syncProgress: SyncProgress | null = null;

let _syncUIState: SyncStatus = {
  state: 'idle',
  lastSyncAt: (() => {
    const stored = localStorage.getItem('last_sync');
    return stored ? Number(stored) : null;
  })(),
  pendingCount: 0,
  progress: null,
};
const _syncUIListeners: Set<SyncStateListener> = new Set();

function _notifySyncUI() {
  _syncUIListeners.forEach(fn => fn({ ..._syncUIState }));
}

export const syncState = {
  subscribe(fn: SyncStateListener): () => void {
    _syncUIListeners.add(fn);
    fn({ ..._syncUIState });
    return () => { _syncUIListeners.delete(fn); };
  },
  get(): SyncStatus { return { ..._syncUIState }; },
  setState(partial: Partial<SyncStatus>) {
    _syncUIState = { ..._syncUIState, ...partial };
    _notifySyncUI();
  },
};

export function isOnline(): boolean {
  return navigator.onLine;
}

export function onOnline(callback: () => void): () => void {
  window.addEventListener('online', callback);
  return () => window.removeEventListener('online', callback);
}

export function onOffline(callback: () => void): () => void {
  window.addEventListener('offline', callback);
  return () => window.removeEventListener('offline', callback);
}

export function getLastSync(): number | null {
  return _syncUIState.lastSyncAt;
}

export function setLastSync() {
  const now = Date.now();
  localStorage.setItem('last_sync', String(now));
  syncState.setState({ lastSyncAt: now });
}

// Reset any accounts incorrectly marked as pending — account balances are derived data.
async function resetStaleAccountPending() {
  try {
    const accounts = await localDb.getUnsyncedAccounts();
    if (accounts.length > 0) {
      await localDb.markAccountsSynced(accounts.map(a => a.id));
    }
  } catch (e) {
    console.error('Failed to reset stale account pending status:', e);
  }
}

export async function initPendingCount() {
  try {
    await resetStaleAccountPending();
    const count = await localDb.getUnsyncedCount();
    syncState.setState({ pendingCount: count });
  } catch (e) {
    console.error('Failed to init pending count:', e);
  }
}

export async function refreshPendingCount() {
  try {
    const count = await localDb.getUnsyncedCount();
    syncState.setState({ pendingCount: count });
  } catch (e) {
    console.error('Failed to refresh pending count:', e);
  }
}

export function startPendingCountAutoRefresh() {
  const stores = [
    'members', 'transactions', 'loans',
    'loan_settlements', 'investments', 'investment_returns',
    'budgets', 'recurring_transactions',
  ] as const;
  const unsubs = stores.map(store => localDb.onChange(store, refreshPendingCount));
  return () => { unsubs.forEach(u => u()); };
}
