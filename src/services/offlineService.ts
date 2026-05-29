import { openDB, IDBPDatabase } from 'idb';
import { cacheService } from './cacheService';

type OfflineAction = {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  body?: any;
  timestamp: number;
};

const DB_NAME = 'ledger_cache';
const DB_VERSION = 2;

interface OfflineQueueStore {
  offline_queue: {
    key: 'pending';
    value: OfflineAction[];
  };
}

let dbPromise: Promise<IDBPDatabase<OfflineQueueStore>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<OfflineQueueStore>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 2) {
          db.createObjectStore('offline_queue');
        }
      },
    });
  }
  return dbPromise;
}

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

async function registerBackgroundSync() {
  try {
    if ('sync' in navigator && 'serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      await (reg as any).sync.register('sync-offline-queue');
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
  } catch {
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
    if (queue.length === 0) return { synced: 0, failed: 0 };

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
        if (action.body) options.body = JSON.stringify(action.body);
        const res = await fetchFn(action.endpoint, options);
        if (res.ok) {
          synced++;
        } else if (res.status >= 500) {
          remaining.push(action);
          failed++;
        } else {
          failed++;
        }
      } catch {
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
    return { synced, failed };
  },
};
