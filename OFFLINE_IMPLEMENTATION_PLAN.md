# Complete Offline Mode Implementation Plan

**Branch:** `feat/offline-mode`

---

## Current State Summary

| Area | Status |
|------|--------|
| Service Worker (precache + pages `NetworkFirst`) | Exists |
| IndexedDB cache (members, accounts, transactions, settings) | Exists |
| Offline action queue (create/update in localStorage) | Exists |
| Network detection (`navigator.onLine` events) | Exists |
| Offline indicator banner | Exists |
| API route caching in SW | **Missing** |
| Background sync via `navigator.sync` | **Missing** |
| Delete-offline queuing | **Missing** |
| Update-offline in TransactionModal/TransferModal | **Missing** |
| Offline-friendly global toast on sync | Basic (syncs in App.tsx, no toast state) |
| Conflict resolution / retry logic | **Missing** |
| Offline fallback HTML page | **Missing** |
| Pending queue count indicator | **Missing** |

---

## Implementation Phases

### Phase 0: Cache API Routes in Service Worker

**File:** `sw.ts`

Add `CacheFirst` / `NetworkFirst` / `StaleWhileRevalidate` strategies for `/api/*` endpoints:

```ts
// API data — stale-while-revalidate for reads, network-only for mutations
registerRoute(
  ({ url, request }) => url.pathname.startsWith('/api/') && request.method === 'GET',
  new StaleWhileRevalidate({
    cacheName: 'api-cache',
    plugins: [new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 })]
  })
);
```

Also cache static assets (JS/CSS/images) via precache (already done) + add an **offline fallback page**:

```ts
// Offline fallback for navigation requests
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'pages',
    plugins: [new FallbackPlugin({ fallbackUrl: '/offline.html' })]
  })
);
```

---

### Phase 1: Upgrade Offline Queue Service

**File:** `src/services/offlineService.ts`

#### 1a. Queue persistance — migrate from localStorage to IndexedDB

LocalStorage has a 5 MB limit and serialises everything per write. Move queue to IndexedDB (same `ledger_cache` DB, new `offline_queue` object store). This supports larger payloads and survives aggressive storage clearing better.

New store schema in `cacheService.ts` or `offlineService.ts`:

```ts
// offline_queue store
interface OfflineQueueStore {
  key: 'pending';
  value: OfflineAction[];
}
```

#### 1b. Add `navigator.sync` (Background Sync API) registration

```ts
async registerSync(): Promise<void> {
  if ('sync' in navigator && 'serviceWorker' in navigator) {
    const reg = await navigator.serviceWorker.ready;
    await reg.sync.register('sync-offline-queue');
  }
}
```

In `sw.ts`, add a `sync` event listener:

```ts
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});
```

The SW sync handler fetches the pending queue from IndexedDB (or broadcasts to the client via `Clients.matchAll`) and replays it.

#### 1c. Add `lastSync` info to a global reactive store

Expose a `lastSyncStatus` subject so the UI can show "Last synced: 2m ago" without re-reading localStorage.

```ts
type SyncStatus = {
  state: 'idle' | 'syncing' | 'error';
  lastSyncAt: number | null;
  pendingCount: number;
};

// Make this reactive — use a simple EventEmitter or zustand store
```

#### 1d. Better sync with retries & batch atomicity

```ts
async syncQueue(fetchFn): Promise<SyncResult> {
  const queue = await this.getQueue();
  if (queue.length === 0) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: OfflineAction[] = [];

  for (const action of queue) {
    try {
      const res = await fetchFn(action.endpoint, {
        method: action.type === 'create' ? 'POST'
              : action.type === 'update' ? 'PATCH'
              : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: action.body ? JSON.stringify(action.body) : undefined,
      });
      if (res.ok) synced++;
      else if (res.status >= 500) { remaining.push(action); failed++; } // retry server errors
      else failed++; // client errors → drop
    } catch {
      remaining.push(action);
      failed++;
    }
  }

  await this.setQueue(remaining);
  await this.setLastSync(Date.now());
  return { synced, failed };
}
```

---

### Phase 2: Cover All Mutation Gaps

#### 2a. Ledger — offline delete support

**File:** `src/components/Ledger.tsx`, `handleDelete` (line 169)

```ts
const handleDelete = async (id: number) => {
  const prev = [...transactions];
  setTransactions(transactions.filter(t => t.id !== id));
  setDeletingId(null);

  if (!navigator.onLine) {
    offlineService.queueAction({ type: 'delete', endpoint: `/api/transactions/${id}` });
    toast("Deletion queued for sync when online.", 'success');
    return;
  }

  try {
    const res = await authService.apiFetch(`/api/transactions/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error("Delete failed");
    fetchTransactions(false);
  } catch (error) {
    setTransactions(prev);
    toast("Failed to delete transaction.", 'error');
    // If TypeError (network error), queue offline
    if (error instanceof TypeError) {
      offlineService.queueAction({ type: 'delete', endpoint: `/api/transactions/${id}` });
      toast("Deletion queued for sync when online.", 'success');
    }
  }
};
```

#### 2b. Ledger — offline update fully covered

Already partially covered (`handleAddOrUpdateTransaction` lines 128-138, 155-161). ✅

#### 2c. TransactionModal — offline update support

**File:** `src/components/TransactionModal.tsx`

Currently only queues `create`. If we ever add edit capability here, queue `update` as well. For now, the modal is create-only so it's fine. ✅ (mark as complete)

#### 2d. TransferModal — offline update/delete

**File:** `src/components/TransferModal.tsx`

Currently only queues `create` on submit. If we add edit/delete, same pattern. For now, create-only. ✅ (mark as complete)

---

### Phase 3: Reactive Sync Status & Toast System

**File:** `src/services/offlineService.ts` (add reactive store)

#### 3a. Create a simple observable sync state

```ts
type SyncStateListener = (state: SyncStatus) => void;

let _syncState: SyncStatus = {
  state: 'idle',
  lastSyncAt: null,
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
```

#### 3b. Enhanced online handler in `App.tsx`

**File:** `src/App.tsx` — replace the current `onOnline` effect:

```tsx
useEffect(() => {
  const offCleanup = offlineService.onOffline(() => setIsOnline(false));
  const onCleanup = offlineService.onOnline(async () => {
    setIsOnline(true);
    syncState.setState({ state: 'syncing' });
    const result = await offlineService.syncQueue(authService.apiFetch);
    await fetchData();
    syncState.setState({
      state: 'idle',
      lastSyncAt: Date.now(),
      pendingCount: offlineService.getQueue().length,
    });
    if (result.synced > 0) {
      toast(
        `Synced ${result.synced} change${result.synced !== 1 ? 's' : ''}${result.failed > 0 ? ` (${result.failed} failed)` : ''}.`,
        result.failed > 0 ? 'error' : 'success'
      );
    }
  });
  return () => { offCleanup(); onCleanup(); };
}, []);
```

#### 3c. Toast — show sync progress + error for failed items

Update the toast call above to differentiate between partial and full success.

---

### Phase 4: UI Improvements

#### 4a. OfflineIndicator — show pending queue count

**File:** `src/components/OfflineIndicator.tsx`

```tsx
interface OfflineIndicatorProps {
  isOnline: boolean;
  pendingCount?: number;
}
```

When offline + pending items, show: `"Offline — 3 pending changes"`.
When offline + no pending, show current: `"Offline — showing cached data"`.

#### 4b. Add "Pending Sync" badge to header or FAB

Show a small badge on the sync icon or FAB button when there are queued items, even when online but not yet synced.

```tsx
{syncState.get().pendingCount > 0 && (
  <span className="absolute -top-1 -right-1 bg-semantic-down text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
    {syncState.get().pendingCount}
  </span>
)}
```

#### 4c. Last sync timestamp in OfflineIndicator or footer

```
Last synced: 2 minutes ago
```

Use `date-fns/formatDistanceToNow` with the `lastSync` timestamp from the reactive store.

#### 4d. Offline fallback HTML page

**File:** `public/offline.html`

Create a minimal offline page shown when the user navigates while completely disconnected (no cache for that page). Simple branding + "You're offline. Please reconnect." message.

---

### Phase 5: Data Freshness & Conflict Resolution

#### 5a. Remove TTL from cached data when offline

**File:** `src/services/cacheService.ts`

When `navigator.onLine === false`, skip TTL checks and always return cached data:

```ts
async getMembers(ttl?: number) {
  const db = await getDB();
  const entry = await db.get('members', 'list');
  if (!entry) return null;
  // If offline, ignore TTL — stale data is better than no data
  if (navigator.onLine && isExpired(entry.timestamp, ttl)) {
    await db.delete('members', 'list');
    return null;
  }
  return entry.data;
},
```

#### 5b. Server-side conflict detection (future)

For now, the queue replays in order (FIFO). If the server receives a PATCH for a deleted resource, it returns 404 → the action is dropped (not retried). Document this trade-off.

#### 5c. Write-through cache on mutation replay

After successful sync of a `create` action, the server response includes the real `id`. Update IndexedDB cache with the new ID so the locally-visible item remains consistent.

---

## Phase Order & Dependencies

| Phase | Depends On | Est. Effort |
|-------|-----------|-------------|
| **Phase 0** — SW API caching | None | 1 file, ~15 lines |
| **Phase 1** — Offline queue upgrade | Phase 0 | 3 files, ~100 lines |
| **Phase 2** — Mutation gap coverage | Phase 1 | 1 file, ~30 lines |
| **Phase 3** — Reactive sync state + toast | Phase 1 | 2 files, ~60 lines |
| **Phase 4** — UI improvements | Phase 3 | 3 files, ~80 lines |
| **Phase 5** — Data freshness & conflict | Phase 1 | 1 file, ~20 lines |

**Total estimated new/changed lines:** ~300 lines across 6-7 files.

---

## Files to Modify

| File | What Changes |
|------|-------------|
| `sw.ts` | Add API route caching, SW sync handler, offline fallback |
| `public/offline.html` | **New** — offline fallback page |
| `src/services/offlineService.ts` | IndexedDB queue, background sync, reactive sync state, retries |
| `src/services/cacheService.ts` | Offline-aware TTL, queue object store (if colocated) |
| `src/components/OfflineIndicator.tsx` | Pending count, last sync timestamp |
| `src/components/Ledger.tsx` | Offline delete coverage |
| `src/App.tsx` | Enhanced sync-on-reconnect with toast and state updates |
| `src/components/Toast.tsx` | (No changes needed — already supports success/error/info) |

---

## Key Design Decisions

1. **IndexedDB over localStorage for queue**: Larger capacity, structured data, survives storage pressure.
2. **Background Sync API as enhancement, not requirement**: If `navigator.sync` is unavailable, fall back to `online` event listener (already exists).
3. **Stale-while-revalidate for API GETs**: Fast offline reads from cache, fresh data when online — no waiting.
4. **Optimistic UI everywhere**: All mutations apply locally first, then sync. This is already the pattern; we just extend it to all mutation types.
5. **Drop vs. retry on sync failure**: Server errors (500+) retry; client errors (4xx) dropped with a logged warning. Avoids infinite retry loops.

---

## Rollback Strategy

If any phase causes regression:
- SW changes: unregister in DevTools, redeploy previous `sw.js`.
- Queue changes: clear IndexedDB `offline_queue` store, reload page.
- Feature flag: Add `VITE_OFFLINE_MODE` env var to gate Phase 3-4 UI changes behind a flag on first release.

---

## Acceptance Criteria

- [ ] All API GET requests return cached data when offline (no loading spinners).
- [ ] Creating/editing/deleting transactions works fully offline with optimistic UI.
- [ ] Creating transfers works fully offline.
- [ ] When coming back online, all queued mutations sync automatically.
- [ ] Toast shows summary ("Synced 3 changes.") on reconnect.
- [ ] Offline indicator shows pending queue count.
- [ ] Background Sync API fires sync when device reconnects (even if page is backgrounded).
- [ ] No data loss: queue persists across page reloads.
- [ ] Stale cached data is shown when offline (ignoring TTL).
- [ ] Offline fallback page renders when SW can't serve a navigation request.
