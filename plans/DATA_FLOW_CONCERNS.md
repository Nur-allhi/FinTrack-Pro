# Plan: Address Data Flow Concerns

**Date**: 2026-06-18
**Source**: `docs/DATA_FLOW_REVIEW.md` — Potential Concerns section
**Branch**: `fix/data-flow-concerns`

---

## Overview

Three concerns to address, two already closed as non-issues:

| # | Concern | Severity | Effort | Status |
|---|---------|----------|--------|--------|
| 1 | Conflict stalemate (sync_status: 'conflict' is a dead end) | Medium | ~2-3 days | **To implement** |
| 2 | `fetchData()` redundant with sync pull on first load | Low | ~0.5 day | **To implement** |
| 3 | Visibility change triggers full push+pull unnecessarily | Low | ~0.5 day | **To implement** |
| 4 | Balance recalc cadence | None | — | **Closed: no issue** |
| 5 | No cross-device sync for guests | None | — | **Closed: by design** |

---

## Closed items (no changes needed)

### Concern 4 — Balance recalc cadence

`recalculateAllBalances()` fires immediately on any pull containing transactions (`syncEngine.ts:574`). The 5th-cycle reconciliation is an additional safety net. No change needed.

### Concern 5 — No cross-device sync for guests

By design. Guest mode has no server account, so no sync is possible. The signup nudge encourages registration after 5 transactions. No change needed.

---

## Concern 1 — Conflict stalemate (Medium)

### Problem

Records with `sync_status: 'conflict'` are a write-only dead end:
- Entered only when a record fails 5 push retries (retry backoff: 5s → 15s → 45s → 120s → 300s)
- **Never queried** — no `getConflictRecords()` or `getConflictCount()` method exists
- **Never displayed** — the UI only has icons for `pending` and `synced` statuses; `conflict` is silent
- **Silently overwritable** — the pull LWW filter checks `pending` and `_bin_emptied` but passes `conflict` through, meaning the next pull from the server can silently overwrite the conflict record

**Impact**: The user can lose data without knowing it.

### Solution

#### 1a. Add conflict query methods to `localDb.ts`

```ts
async getConflictCount(): Promise<number>
// Returns count of records with sync_status === 'conflict' across all tables

async getConflictRecords(): Promise<Array<{ entity_type: string; record: LocalRecord }>>
// Returns all conflict records grouped/labeled for UI display

async resolveConflict(entityType: EntityName, localId: string, resolution: 'keep_local' | 'keep_server'): Promise<void>
// keep_local → mark synced (local wins, will re-push on next cycle)
// keep_server → set _deleted=true (will be overwritten by server on next pull)
```

#### 1b. Surface conflict count in the sync state

- Add `conflictCount` field to `SyncStatus` in `syncEngine.ts`
- Add `refreshConflictCount()` that queries `localDb.getConflictCount()`
- Wire into `startPendingCountAutoRefresh()` (rename it or add parallel subscription)
- The `useLocalData` hook already subscribes to `syncState` — conflict count flows through automatically

#### 1c. Show conflict status in the UI

- **Header/Sidebar badge**: Add a small red badge showing `conflictCount` next to the RecycleBin nav item (or a new "Conflicts" indicator)
- **TransactionRow.tsx / TransactionCard.tsx**: Add a red `AlertTriangle` icon for `sync_status === 'conflict'` with tooltip "Sync conflict — needs review"

#### 1d. Conflict resolution view

Extend the RecycleBin component (`src/components/RecycleBin.tsx`) to show conflict records alongside deleted items:

- Add a tab/toggle at the top: "Deleted Items" | "Sync Conflicts"
- Conflict records list:
  - Entity type label + summary (e.g., "Transaction: Groceries - $50")
  - Last known local `updated_at` timestamp
  - Two action buttons:
    - **"Keep mine"** → calls `resolveConflict(id, 'keep_local')` → record becomes `pending` → re-pushes on next sync
    - **"Accept server"** → calls `resolveConflict(id, 'keep_server')` → record soft-deleted locally → server version arrives on next pull
  - Multi-select + bulk resolve (optional v2)
- Empty state: "No sync conflicts"
- Loading state while fetching conflicts

### Files to modify

| File | Change |
|------|--------|
| `src/services/localDb.ts` | Add `getConflictCount()`, `getConflictRecords()`, `resolveConflict()` |
| `src/services/syncEngine.ts` | Add `conflictCount` to `SyncStatus`; add `refreshConflictCount()`; wire into auto-refresh |
| `src/components/RecycleBin.tsx` | Add conflicts sub-section with resolution UI |
| `src/components/TransactionRow.tsx` | Add conflict icon (AlertTriangle) |
| `src/components/TransactionCard.tsx` | Add conflict icon (AlertTriangle) |
| `src/hooks/useLocalData.ts` | Already subscribed to `syncState` — no change needed for count; may add `conflictCount` to return |

### Edge cases

- **Re-conflict after `keep_local`**: After resolution, record re-enters push as `pending`. If server is still newer, it will conflict again. OK — the user sees it again if re-resolution doesn't fix the root cause.
- **`keep_server` followed by pull**: Server version (unchanged) arrives on next pull → overwrites local soft-delete → record appears as `synced`. Clean state.
- **Empty conflicts list**: Show "No sync conflicts" empty state.
- **Multiple conflicts across tables**: Group by entity type in the UI for clarity.

---

## Concern 2 — `fetchData()` redundant with sync pull (Low)

### Problem

On initial authenticated load, the app fetches server data twice:
1. `useLocalData.ts:297` calls `fetchData()` → 3 individual GETs (`/api/members`, `/api/accounts`, `/api/groups`)
2. `App.tsx:177` calls `syncNow()` → which calls `pullChanges()` → `GET /api/sync/pull?since=...`

Both write the same data to IndexedDB, with similar merge logic through different code paths.

### Solution

#### 2a. Remove auto `fetchData()` call from initial load

In `useLocalData.ts`, change the initial load effect (lines 288-299):

```tsx
// Before:
loadFromLocal().then(() => {
  onInitialLoad?.();
  if (isOnline()) {
    fetchData();
  }
});

// After:
loadFromLocal().then(() => {
  onInitialLoad?.();
  // Initial server data loaded by syncNow() → pullChanges() in App.tsx:177
});
```

#### 2b. Keep `fetchData()` for manual refresh

The `fetchData` function stays exported and usable for:
- UserProfile "Refresh data" button
- Child component `onUpdate` callbacks (MemberManager, AccountManager, GroupManager)
- Pull-to-refresh (future)

#### 2c. Add orphan purge to `pullChanges()`

The `fetchData()` function has orphan detection logic (lines 123-135, 205-212) that `pullChanges()` currently lacks. Add an orphan purge pass to `pullChanges()`:

After processing each table, compare server response IDs against local records. Soft-delete local records whose `server_id` is not in the server response (matching existing `fetchData()` logic).

### Files to modify

| File | Change |
|------|--------|
| `src/hooks/useLocalData.ts` | Remove auto `fetchData()` call in initial load effect; keep the function for manual use |
| `src/services/syncEngine.ts` | Add orphan purge pass to `pullChanges()` for members + accounts |

### Verification

- DevTools Network tab: Only one set of requests on initial load (`GET /api/sync/pull`, not individual GETs + pull)
- Manual refresh from UserProfile still works
- Guest → registration migration unaffected (uses `initialSync()` not `fetchData()`)

---

## Concern 3 — Visibility change triggers unnecessary push (Low)

### Problem

- The `visibilitychange` handler calls `syncNow()` (full push + pull) even when user has no pending changes
- `reconcileBalances()` is called redundantly — `syncNow()` already calls it
- The 5-minute interval (`_reconcileInterval`) is fully redundant with the 30-second interval — both call `syncNow()`

### Solution

#### 3a. Change visibility handler to pull-only

In `startSyncScheduler()` (syncEngine.ts:723-728):

```ts
// Before:
_handleVisibility = () => {
  if (document.visibilityState === 'visible') {
    syncNow();
    reconcileBalances();
  }
};

// After:
_handleVisibility = () => {
  if (document.visibilityState === 'visible') {
    pullChanges();
    reconcileBalances();
  }
};
```

Pending changes are still pushed within 30s via the running interval timer. The visibility change is primarily for receiving fresh data.

#### 3b. Remove redundant 5-minute interval

Remove `_reconcileInterval` setup/teardown from `startSyncScheduler()` and `stopSyncScheduler()`. The 30-second `_syncInterval` already calls `syncNow()` → `reconcileBalances()` every 5th cycle.

#### 3c. Keep everything else

- 30s `_syncInterval` — full push+pull cycle
- 60s `_fallbackTimer` — `flushPending()` for Safari/Firefox Background Sync fallback
- `online` handler — `syncNow()` (full cycle, needed after connectivity restore)

### Files to modify

| File | Change |
|------|--------|
| `src/services/syncEngine.ts` | Change visibility handler to `pullChanges()`; remove `_reconcileInterval` and its cleanup |

### Verification

- DevTools Network: `visibilitychange` triggers only `GET /api/sync/pull` (no `POST /api/sync/push`)
- Pending changes still pushed within 30s via interval
- No regression on `online` event (still full sync)

---

## Implementation order

```
1. Concern 3 — Visibility change (simplest, isolated to syncEngine.ts)
   → Build confidence with a small, low-risk change

2. Concern 2 — fetchData redundancy (moderate, changes init flow)
   → Builds on understanding of sync engine from step 1

3. Concern 1 — Conflict stalemate (largest, touches UI + data layer)
   → Most impactful for users, requires careful UI design
```

---

## Testing strategy

| Concern | Verification |
|---------|-------------|
| **3** | DevTools Network: `visibilitychange` triggers only `GET /api/sync/pull`. Push still runs within 30s via interval. No double `reconcileBalances()`. |
| **2** | DevTools Network: single set of requests on initial load. Manual `fetchData()` from UserProfile still works. Guest→registration migration unaffected. |
| **1** | Unit test `getConflictCount()`, `resolveConflict()`. Manual: simulate 5 failed pushes (mock network off), verify conflict badge appears, verify resolution buttons, verify re-sync after resolution. |

---

## Rollback

Each concern's changes are independent:
- **Concern 3** → revert `syncEngine.ts` changes (isolated)
- **Concern 2** → revert `useLocalData.ts` + `syncEngine.ts` orphan purge
- **Concern 1** → revert `localDb.ts` + `syncEngine.ts` + component changes

If Concern 1 (conflict resolution) has issues, it can be reverted independently. Concerns 2 and 3 touch `syncEngine.ts` but in separate sections — changes don't overlap.
