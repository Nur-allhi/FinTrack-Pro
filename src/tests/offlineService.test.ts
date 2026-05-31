import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockStore: Record<string, string> = {};

Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: vi.fn((key: string) => mockStore[key] || null),
    setItem: vi.fn((key: string, value: string) => { mockStore[key] = value; }),
    removeItem: vi.fn((key: string) => { delete mockStore[key]; }),
    clear: vi.fn(() => { Object.keys(mockStore).forEach(k => delete mockStore[k]); }),
  },
  writable: true,
});

Object.defineProperty(globalThis, 'navigator', {
  value: { onLine: true },
  writable: true,
});

const mockQueue: { id: string; type: string; endpoint: string; body?: unknown; timestamp: number }[] = [];

const mockDB = {
  get: vi.fn(async () => [...mockQueue]),
  put: vi.fn(async (_store: string, data: unknown) => {
    mockQueue.length = 0;
    if (Array.isArray(data)) mockQueue.push(...(data as typeof mockQueue));
  }),
  delete: vi.fn(async () => { mockQueue.length = 0; }),
};

vi.mock('../services/cacheService', () => ({
  getDB: vi.fn(async () => mockDB),
  cacheService: {
    getMembers: vi.fn(async () => []),
    getAccounts: vi.fn(async () => []),
  },
}));

describe('OfflineService', () => {
  beforeEach(() => {
    mockQueue.length = 0;
    Object.keys(mockStore).forEach(k => delete mockStore[k]);
    vi.clearAllMocks();
  });

  describe('syncQueue', () => {
    it('returns 0 synced/failed when queue is empty', async () => {
      const { offlineService } = await import('../services/offlineService');
      const fetchFn = vi.fn();
      const result = await offlineService.syncQueue(fetchFn);
      expect(result).toEqual({ synced: 0, failed: 0 });
    });

    it('syncs a single create action successfully', async () => {
      mockQueue.push({
        id: '1',
        type: 'create',
        endpoint: '/api/transactions',
        body: { amount: 100, date: '2026-01-01', particulars: 'Test' },
        timestamp: Date.now(),
      });
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      const { offlineService } = await import('../services/offlineService');
      const result = await offlineService.syncQueue(mockFetch);
      expect(result.synced).toBe(1);
      expect(result.failed).toBe(0);
      expect(mockFetch).toHaveBeenCalledWith('/api/transactions', expect.objectContaining({ method: 'POST' }));
    });

    it('keeps action in queue on server error (5xx)', async () => {
      mockQueue.push({
        id: '2',
        type: 'update',
        endpoint: '/api/transactions/1',
        body: { amount: 200 },
        timestamp: Date.now(),
      });
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
      const { offlineService } = await import('../services/offlineService');
      const result = await offlineService.syncQueue(mockFetch);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
      expect(mockDB.put).toHaveBeenCalled();
    });

    it('drops action on client error (4xx)', async () => {
      mockQueue.push({
        id: '3',
        type: 'delete',
        endpoint: '/api/transactions/999',
        timestamp: Date.now(),
      });
      const mockFetch = vi.fn().mockResolvedValue({ ok: false, status: 404 });
      const { offlineService } = await import('../services/offlineService');
      const result = await offlineService.syncQueue(mockFetch);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('keeps action in queue on network error', async () => {
      mockQueue.push({
        id: '4',
        type: 'create',
        endpoint: '/api/transactions',
        body: { amount: 50 },
        timestamp: Date.now(),
      });
      const mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));
      const { offlineService } = await import('../services/offlineService');
      const result = await offlineService.syncQueue(mockFetch);
      expect(result.synced).toBe(0);
      expect(result.failed).toBe(1);
    });

    it('processes multiple actions in order', async () => {
      mockQueue.push(
        { id: '5', type: 'create', endpoint: '/api/transactions', body: { amount: 10 }, timestamp: Date.now() },
        { id: '6', type: 'update', endpoint: '/api/transactions/1', body: { amount: 20 }, timestamp: Date.now() },
        { id: '7', type: 'delete', endpoint: '/api/transactions/2', timestamp: Date.now() },
      );
      const mockFetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
      const { offlineService } = await import('../services/offlineService');
      const result = await offlineService.syncQueue(mockFetch);
      expect(result.synced).toBe(3);
      expect(result.failed).toBe(0);
      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(mockFetch.mock.calls[0][1].method).toBe('POST');
      expect(mockFetch.mock.calls[1][1].method).toBe('PATCH');
      expect(mockFetch.mock.calls[2][1].method).toBe('DELETE');
    });
  });

  describe('syncState', () => {
    it('returns initial state', async () => {
      const { syncState } = await import('../services/offlineService');
      const state = syncState.get();
      expect(state.state).toBe('idle');
      expect(typeof state.pendingCount).toBe('number');
    });

    it('notifies subscribers on state change', async () => {
      const { syncState } = await import('../services/offlineService');
      const listener = vi.fn();
      const unsub = syncState.subscribe(listener);
      syncState.setState({ pendingCount: 5 });
      expect(listener).toHaveBeenCalledWith(expect.objectContaining({ pendingCount: 5 }));
      unsub();
    });
  });

  describe('queueAction', () => {
    it('adds an action to the queue', async () => {
      const { offlineService } = await import('../services/offlineService');
      await offlineService.queueAction({
        type: 'create',
        endpoint: '/api/transactions',
        body: { amount: 100 },
      });
      expect(mockDB.put).toHaveBeenCalled();
    });
  });

  describe('clearQueue', () => {
    it('clears the queue and resets pending count', async () => {
      mockQueue.push({ id: '99', type: 'create', endpoint: '/api/test', timestamp: Date.now() });
      const { offlineService, syncState } = await import('../services/offlineService');
      await offlineService.clearQueue();
      const state = syncState.get();
      expect(state.pendingCount).toBe(0);
    });
  });
});
