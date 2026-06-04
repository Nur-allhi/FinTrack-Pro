# Local-First Read Path Fix — Implementation Plan

**Branch:** `feat/local-first`
**Date:** 2026-06-04
**Status:** Planning

---

## Problem Statement

The app has two independent transaction write paths that don't share data:

| Write Path | Writes to | Read by |
|-----------|-----------|---------|
| **TransactionModal** (Dashboard) | localDb only | Dashboard (via `applyAccountDelta` React state) |
| **useTransactions** (Ledger/TransactionForm) | Server API only | Ledger (via server fetch) |

When a user adds a transaction from the Dashboard (TransactionModal → localDb), the Ledger doesn't see it because `useTransactions` fetches from the server API, not localDb. When a user adds from the Ledger (useTransactions → server API), the Dashboard eventually sees it after `fetchData()` completes (~200-500ms server roundtrip).

**Root cause:** The original plan (`plans/LOCAL_FIRST_ARCHITECTURE.md`) specified `useTransactions.ts` should "Read directly from IndexedDB" but the implementation still fetches from the server API and patches in localDb pending records via heuristic merge — a fragile approach with race conditions.

---

## Architecture Goal

```
All Writes → localDb (1-5ms) → instant React state update → background sync to server
All Reads  → localDb (1-5ms) → instant render
```

No component should fetch from the server API for display data. The server is a sync/backup layer only.

---

## Implementation Phases

---

### Phase 1: Reactive Change Events (Foundation)

Add a simple pub/sub system to localDb so components can subscribe to changes.

**File:** `src/services/localDb.ts`

**Changes:**
- Add listener registry: `Map<EntityName, Set<(record: LocalRecord) => void>>`
- Export `onChange(store, listener)` returning unsubscribe function
- Every `put()` and `remove()` calls `notify(store, record)` after write completes
- Add `adjustAccountBalance(accountLocalId: string, delta: number): Promise<void>` that atomically reads/updates balance and notifies

**Why first:** Without this, there's no way for `useTransactions` to know when TransactionModal writes a new record. The app would still require polling or manual refetch triggers.

---

### Phase 2: Unify Write Path — `useTransactions.addOrUpdateTransaction`

Make the Ledger write path write to localDb FIRST, matching how TransactionModal works.

**File:** `src/hooks/useTransactions.ts`

**Changes to `addOrUpdateTransaction`:**
1. Generate a local UUID record with `sync_status: 'pending'`
2. Write to `localDb.putTransaction()` **first** (always, 1-5ms)
3. Update React state from localDb immediately
4. Call `localDb.adjustAccountBalance()` to update current balance
5. **Then** attempt server API call (POST/PATCH)
6. On server success: update `sync_status → 'synced'`, store `server_id` from response
7. On failure/offline: leave as `'pending'` — sync engine handles it

**Changes to `deleteTransaction`:**
- Already calls `softDeleteLocal()` — make it primary (always runs) instead of fallback
- Server DELETE is secondary, best-effort
- Also adjust balance (reverse the amount)

---

### Phase 3: Unify Read Path — `useTransactions` reads from localDb

This is the core fix. The hook should read ALL transactions from localDb, not just pending ones.

**File:** `src/hooks/useTransactions.ts`

**Rewrite:**
1. On mount: read ALL non-deleted transactions for the account from localDb using `localDb.getTransactions(accountLocalId)`
2. Subscribe to localDb change events (`localDb.onChange('transactions', ...)`) for real-time updates
3. When a change event fires for this account, re-read and set state
4. **No server fetch for display data**
5. Remove cacheService dependency entirely

**Remove:**
- Server fetch logic (`authService.apiFetch` at line 26)
- Offline queue merging
- 30s polling interval
- Heuristic dedup (`alreadyInData` check)
- `lastUpdate` prop dependency

---

### Phase 4: Fix DashboardCharts

**File:** `src/components/DashboardCharts.tsx`

**Rewrite:**
1. Read ALL transactions from localDb via `localDb.getTransactions()`
2. Filter by active account IDs
3. Compute spending pie chart + balance trend from localDb data
4. Subscribe to localDb transaction changes for auto-refresh
5. Remove all `authService.apiFetch` calls

---

### Phase 5: Fix Sync Engine to Return `server_id`

**File:** `api/routes/sync.ts`

**Modify `POST /api/sync/push`:**
- For INSERT operations, return the new server `id` alongside the `client_id`
- Response: `{ results: { transactions: { pushed: 1, ids: [{ client_id: "uuid", server_id: 42 }] } } }`

**File:** `src/services/syncEngine.ts`

**Modify `pushUnsynced`:**
- After successful push, update local record's `server_id` from response
- `{ ...record, server_id: response.server_id, sync_status: 'synced' }`

**Why:** Without this, TransactionModal-created records never get `server_id`. Future operations that search by `server_id` (like softDeleteLocal) can't find them.

---

### Phase 6: Cleanup

- **Remove `cacheService.ts`** — redundant, replaced by localDb
- **Remove `lastUpdate` prop** from Ledger and App.tsx
- **Remove `offlineService.ts`** — merge unique functionality into syncEngine
- **Simplify `useLocalData.ts`** — remove `applyAccountDelta` (replaced by localDb events + adjustAccountBalance)
- **Remove `fetchData` from TransactionModal's onUpdate** in App.tsx (no longer needed)

---

## File Change Summary

| File | Change |
|------|--------|
| `src/services/localDb.ts` | Add pub/sub events, `adjustAccountBalance()` |
| `src/hooks/useTransactions.ts` | Rewrite: read/write from localDb, subscribe to events |
| `src/hooks/useLocalData.ts` | Subscribe to account changes, simplify |
| `src/components/Ledger.tsx` | Remove `lastUpdate` prop |
| `src/components/TransactionModal.tsx` | Use `adjustAccountBalance()` instead of fire-and-forget |
| `src/components/DashboardCharts.tsx` | Read from localDb, subscribe to changes |
| `src/App.tsx` | Remove `lastUpdate` from Ledger, simplify TransactionModal onUpdate |
| `api/routes/sync.ts` | Return `server_id` mapping |
| `src/services/syncEngine.ts` | Update `server_id` after push |
| `src/services/cacheService.ts` | Delete |
| `src/services/offlineService.ts` | Merge into syncEngine, delete |

---

## Acceptance Criteria

- [ ] TransactionModal write → Ledger shows transaction instantly (no navigation delay)
- [ ] Ledger TransactionForm write → Ledger shows transaction instantly
- [ ] Dashboard balance updates instantly from both write paths
- [ ] DashboardCharts shows accurate data from localDb
- [ ] No server API calls for display data (Ledger, DashboardCharts)
- [ ] Sync engine pushes to server in background, updates `server_id`
- [ ] No 30s polling for Ledger updates
- [ ] No heuristic dedup logic
- [ ] `cacheService.ts` deleted, no remaining imports
- [ ] `npx tsc --noEmit` passes
- [ ] `npm run lint` passes
