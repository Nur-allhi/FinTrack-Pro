import { localDb, LocalRecord, EntityName } from './localDb';
import { authService } from './authService';

const SYNC_TABLES = [
  'members', 'accounts', 'transactions', 'loans',
  'loan_settlements', 'investments', 'investment_returns',
  'budgets', 'recurring_transactions',
] as const;

type SyncTable = typeof SYNC_TABLES[number];

export interface SyncResult {
  pushed: number;
  pulled: number;
  conflicts: number;
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
}

export function isSyncing() {
  return _isSyncing;
}

async function getUnsyncedForTable(table: SyncTable): Promise<LocalRecord[]> {
  const getter = {
    members: () => localDb.getUnsyncedMembers(),
    accounts: () => localDb.getUnsyncedAccounts(),
    transactions: () => localDb.getUnsyncedTransactions(),
    loans: () => localDb.getUnsyncedLoans(),
    loan_settlements: async () => { const db = await import('./localDb'); return db.localDb.getLoanSettlements(); },
    investments: async () => { const db = await import('./localDb'); return db.localDb.getInvestments(); },
    investment_returns: async () => { const db = await import('./localDb'); return db.localDb.getInvestmentReturns(); },
    budgets: async () => { const db = await import('./localDb'); return db.localDb.getBudgets(); },
    recurring_transactions: async () => { const db = await import('./localDb'); return db.localDb.getRecurringTransactions(); },
  }[table];
  return getter();
}

async function markTableSynced(table: SyncTable, ids: string[]): Promise<void> {
  const markers = {
    members: () => localDb.markMembersSynced(ids),
    accounts: () => localDb.markAccountsSynced(ids),
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
    accounts: (r: Record<string, unknown>[]) => localDb.putAccounts(r as never[]),
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

  const res = await authService.apiFetch('/api/sync/push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ records }),
  });

  if (!res.ok) return { pushed: 0, conflicts: 0 };

  const data = await res.json();
  let pushed = 0;
  let conflicts = 0;

  for (const table of SYNC_TABLES) {
    const result = data.results?.[table];
    if (!result) continue;
    pushed += result.pushed || 0;
    conflicts += result.conflicts || 0;
    if (result.pushed > 0) {
      const ids = (records[table] || []).map(r => r.id);
      await markTableSynced(table as SyncTable, ids);
    }
  }

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

  for (const table of SYNC_TABLES) {
    const changes = data.changes?.[table];
    if (!Array.isArray(changes) || changes.length === 0) continue;

    // Get local records for LWW comparison
    const localRecords = await localDb.getAllRecords(table as EntityName);
    const localMap = new Map(localRecords.map(r => [r.id, r]));

    // Filter: skip records where local has pending changes or is newer
    const toUpsert = changes.filter((r: Record<string, unknown>) => {
      const local = localMap.get(r.client_id as string);
      if (!local) return true; // new record, upsert
      if (local.sync_status === 'pending') return false; // local has unpushed changes, skip
      // Both synced — LWW by updated_at
      const serverTime = new Date((r.updated_at as string) || 0).getTime();
      const localTime = new Date(local.updated_at).getTime();
      return serverTime > localTime;
    });

    if (toUpsert.length === 0) continue;

    const localRecords2 = toUpsert.map((r: Record<string, unknown>) => ({
      id: r.client_id || crypto.randomUUID(),
      server_id: r.id,
      updated_at: (r.updated_at as string) || new Date().toISOString(),
      sync_status: 'synced' as const,
      _deleted: false,
      ...r,
    }));

    await upsertFromServer(table as SyncTable, localRecords2);
    totalPulled += toUpsert.length;
  }

  if (totalPulled > 0 || data.pulledAt) {
    await localDb.setMeta('sync_timestamp', data.pulledAt || new Date().toISOString());
  }

  return totalPulled;
}

// Full sync: push then pull
export async function syncNow(): Promise<SyncResult> {
  if (_isSyncing) return { pushed: 0, pulled: 0, conflicts: 0 };
  if (!navigator.onLine) return { pushed: 0, pulled: 0, conflicts: 0 };

  setSyncing(true);
  try {
    const pushResult = await pushUnsynced();
    const pulled = await pullChanges();
    return { pushed: pushResult.pushed, pulled, conflicts: pushResult.conflicts };
  } catch (err) {
    console.error('Sync failed:', err);
    return { pushed: 0, pulled: 0, conflicts: 0 };
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

      const localRecords = rows.map((r: Record<string, unknown>) => ({
        id: r.client_id || crypto.randomUUID(),
        server_id: r.id,
        updated_at: (r.updated_at as string) || new Date().toISOString(),
        sync_status: 'synced' as const,
        _deleted: false,
        ...r,
      }));

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
let _started = false;
let _handleVisibility: (() => void) | null = null;
let _handleOnline: (() => void) | null = null;

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

  _syncInterval = setInterval(() => {
    if (navigator.onLine) {
      syncNow();
    }
  }, 30_000);
}

export function stopSyncScheduler() {
  if (_syncInterval) {
    clearInterval(_syncInterval);
    _syncInterval = null;
  }
  if (_handleVisibility) {
    document.removeEventListener('visibilitychange', _handleVisibility);
    _handleVisibility = null;
  }
  if (_handleOnline) {
    window.removeEventListener('online', _handleOnline);
    _handleOnline = null;
  }
  _started = false;
}
