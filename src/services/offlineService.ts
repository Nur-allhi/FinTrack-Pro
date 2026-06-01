import { getDB, cacheService } from './cacheService';
import type { OfflineActionBody } from '../types';

type OfflineAction = {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  body?: OfflineActionBody;
  timestamp: number;
};

type SyncStateListener = (state: SyncStatus) => void;

export type SyncStatus = {
  state: 'idle' | 'syncing' | 'error';
  lastSyncAt: number | null;
  pendingCount: number;
};

let _syncState: SyncStatus = {
  state: 'idle',
  lastSyncAt: (() => {
    const stored = localStorage.getItem('last_sync');
    return stored ? Number(stored) : null;
  })(),
  pendingCount: 0,
};
const _listeners: Set<SyncStateListener> = new Set();

function notify() {
  _listeners.forEach(fn => fn({ ..._syncState }));
}

export const syncState = {
  subscribe(fn: SyncStateListener): () => void {
    _listeners.add(fn);
    fn({ ..._syncState });
    return () => { _listeners.delete(fn); };
  },
  get(): SyncStatus { return { ..._syncState }; },
  setState(partial: Partial<SyncStatus>) {
    _syncState = { ..._syncState, ...partial };
    notify();
  },
};

export async function initPendingCount() {
  try {
    const queue = await getQueueFromDB();
    syncState.setState({ pendingCount: queue.length });
  } catch (e) {
    console.error('Failed to init pending count:', e);
  }
}

async function registerBackgroundSync() {
  try {
    if ('sync' in navigator && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await (reg as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-offline-queue');
    }
  } catch {
    // Background Sync not available — fall back to online event
  }
}

async function getQueueFromDB(): Promise<OfflineAction[]> {
  try {
    const db = await getDB();
    const queue = await db.get('offline_queue', 'pending');
    return queue || [];
  } catch (e) {
    console.error('getQueueFromDB failed:', e);
    return [];
  }
}

async function setQueueToDB(queue: OfflineAction[]): Promise<void> {
  const db = await getDB();
  await db.put('offline_queue', queue, 'pending');
}

async function clearQueueInDB(): Promise<void> {
  const db = await getDB();
  await db.delete('offline_queue', 'pending');
}

export const offlineService = {
  isOnline(): boolean {
    return navigator.onLine;
  },

  onOnline(callback: () => void) {
    window.addEventListener('online', callback);
    return () => window.removeEventListener('online', callback);
  },

  onOffline(callback: () => void) {
    window.addEventListener('offline', callback);
    return () => window.removeEventListener('offline', callback);
  },

  getLastSync(): number | null {
    return _syncState.lastSyncAt;
  },

  setLastSync() {
    const now = Date.now();
    localStorage.setItem('last_sync', String(now));
    syncState.setState({ lastSyncAt: now });
  },

  hasCachedData(): Promise<boolean> {
    return cacheService.getMembers().then(m => m !== undefined && m !== null && m.length > 0);
  },

  async queueAction(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
    const queue = await getQueueFromDB();
    queue.push({ ...action, id: crypto.randomUUID(), timestamp: Date.now() });
    await setQueueToDB(queue);
    syncState.setState({ pendingCount: queue.length });
    registerBackgroundSync();
  },

  async getQueue(): Promise<OfflineAction[]> {
    return getQueueFromDB();
  },

  async clearQueue() {
    await clearQueueInDB();
    syncState.setState({ pendingCount: 0 });
  },

  async syncQueue(
    fetchFn: (url: string, options?: RequestInit) => Promise<Response>
  ): Promise<{ synced: number; failed: number }> {
    const queue = await getQueueFromDB();
    if (queue.length === 0) {
      console.log('[syncQueue] queue empty, nothing to sync');
      return { synced: 0, failed: 0 };
    }

    console.log(`[syncQueue] starting sync for ${queue.length} item(s)`, queue.map(a => ({ type: a.type, endpoint: a.endpoint })));
    syncState.setState({ state: 'syncing' });
    let synced = 0;
    let failed = 0;
    const remaining: OfflineAction[] = [];

    for (const action of queue) {
      try {
        const method = action.type === 'create' ? 'POST'
          : action.type === 'update' ? 'PATCH'
          : 'DELETE';
        const options: RequestInit = {
          method,
          headers: { 'Content-Type': 'application/json' },
        };
        if (action.body && method !== 'DELETE') options.body = JSON.stringify(action.body);
        console.log(`[syncQueue] replaying ${method} ${action.endpoint}`, action.body);
        const res = await fetchFn(action.endpoint, options);
        if (res.ok) {
          console.log(`[syncQueue] success: ${method} ${action.endpoint} -> ${res.status}`);
          synced++;
        } else if (res.status >= 500) {
          console.warn(`[syncQueue] server error: ${method} ${action.endpoint} -> ${res.status}, will retry`);
          remaining.push(action);
          failed++;
        } else {
          console.error(`[syncQueue] client error: ${method} ${action.endpoint} -> ${res.status}, action dropped`);
          failed++;
        }
      } catch (e) {
        console.error(`[syncQueue] network error replaying ${action.type} ${action.endpoint}:`, e);
        remaining.push(action);
        failed++;
      }
    }

    await setQueueToDB(remaining);
    this.setLastSync();
    syncState.setState({
      state: remaining.length > 0 ? 'error' : 'idle',
      pendingCount: remaining.length,
    });
    console.log(`[syncQueue] done: ${synced} synced, ${failed} failed, ${remaining.length} remaining`);
    return { synced, failed };
  },
};
