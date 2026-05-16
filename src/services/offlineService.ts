import { cacheService } from './cacheService';

type OfflineAction = {
  id: string;
  type: 'create' | 'update' | 'delete';
  endpoint: string;
  body?: any;
  timestamp: number;
};

const QUEUE_KEY = 'offline_queue';

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
    const stored = localStorage.getItem('last_sync');
    return stored ? Number(stored) : null;
  },

  setLastSync() {
    localStorage.setItem('last_sync', String(Date.now()));
  },

  hasCachedData(): Promise<boolean> {
    return cacheService.getMembers().then(m => m !== undefined && m !== null && m.length > 0);
  },

  queueAction(action: Omit<OfflineAction, 'id' | 'timestamp'>) {
    const queue = this.getQueue();
    queue.push({ ...action, id: crypto.randomUUID(), timestamp: Date.now() });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  },

  getQueue(): OfflineAction[] {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch {
      return [];
    }
  },

  clearQueue() {
    localStorage.removeItem(QUEUE_KEY);
  },

  async syncQueue(fetchFn: (url: string, options?: RequestInit) => Promise<Response>): Promise<{ synced: number; failed: number }> {
    const queue = this.getQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    let synced = 0;
    let failed = 0;

    for (const action of queue) {
      try {
        const options: RequestInit = {
          method: action.type === 'create' ? 'POST' : action.type === 'update' ? 'PATCH' : 'DELETE',
          headers: { 'Content-Type': 'application/json' },
        };
        if (action.body) options.body = JSON.stringify(action.body);
        const res = await fetchFn(action.endpoint, options);
        if (res.ok) synced++;
        else failed++;
      } catch {
        failed++;
      }
    }

    if (failed === 0) this.clearQueue();
    else {
      const remaining = queue.filter(a => {
        const action = queue.indexOf(a);
        return action >= synced;
      });
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
    }

    this.setLastSync();
    return { synced, failed };
  },
};
