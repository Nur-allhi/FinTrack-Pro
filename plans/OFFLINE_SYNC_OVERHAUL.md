# Plan: Offline Reliability + Background Sync Overhaul

> **Goal**: Make the app work fully offline, eliminate duplicate entries, stabilize background sync.
> **Branch**: `fix/offline-sync-overhaul`

---

## Problem Summary

1. **Blank screen offline** — `authService.refreshSession()` hangs with no timeout when Supabase is unreachable, keeping `authStatus='loading'` → `<LoadingScreen />` forever
2. **Background Sync never fires** — `sw.ts` listens for `sync-offline-queue` but **nobody registers** the tag via `self.registration.sync.register()`
3. **`flushPending()` is fire-and-forget** — No retry on failure; if push fails, the record stays `pending` but is never retried until the next 30s cycle
4. **Dual pull mechanism creates duplicates** — `fetchData()` and `syncEngine.pullChanges()` are two independent pull systems racing on the same triggers. `fetchData` doesn't check `client_id` for dedup, only `server_id`
5. **Account balance drift** — `recalculateAllBalances()` is only called during `pullChanges()`, never on local writes or periodically
6. **SW doesn't queue mutations** — POST/PUT/DELETE failures are invisible to the SW layer

---

## Proposed Solution

### Fix 1: Auth Timeout (Blank Screen Fix)

**Files**: `src/services/authService.ts`, `src/hooks/useAuth.ts`

- Add a 3s timeout wrapper around `sb.auth.refreshSession()` using `AbortController` + `Promise.race`
- In `useAuth.init()`, add a 5s overall timeout for the entire auth initialization
- If timeout triggers, fall through gracefully: check for cached session token in browser, or default to guest mode

### Fix 2: Register Background Sync

**Files**: `src/main.tsx`, `sw.ts`

- After SW registration, call `navigator.serviceWorker.ready.then(reg => reg.sync.register('sync-offline-queue'))` 
- Add a **60s fallback timer** in `syncEngine` for browsers that don't support Background Sync (Safari, Firefox). This timer runs even when the tab is backgrounded.
- The fallback timer checks for `pending` records every 60s and calls `flushPending()` if online

### Fix 3: Retry Queue with Exponential Backoff

**Files**: `src/services/syncEngine.ts`, `src/services/localDb.ts`

- Add a retry queue in IndexedDB metadata: store `{ retryCount, nextRetryAt }` per failed push attempt
- Retry schedule: 5s → 15s → 45s → 2min → 5min (cap)
- On push failure, increment `retryCount` and set `nextRetryAt` instead of just logging
- `syncNow()` and the fallback timer check `nextRetryAt` before retrying
- After 5 failed retries, mark the record as `sync_status: 'conflict'` for user intervention

### Fix 4: Eliminate Dual Pull (Single Source of Truth)

**Files**: `src/hooks/useLocalData.ts`

- **Remove** the 30s polling interval for `fetchData` (the sync engine's 30s interval already handles this)
- **Remove** `visibilitychange` trigger for `fetchData` (sync engine handles this)
- **Remove** `online` event trigger for `fetchData` (sync engine handles this)
- Keep `fetchData` ONLY for:
  - Initial auth transition (first load) — one-shot migration
  - Manual "Refresh" button in UI
- Also fix the dedup in `fetchData` to check `client_id` in addition to `server_id`:
  ```typescript
  // Before: misses records where push succeeded but server_id wasn't stored locally
  const localByServerId = new Map(allRecords.map(r => [r.server_id, r]));
  // After: also check client_id for records that were pushed but lost server_id
  const localByServerId = new Map(allRecords.map(r => [r.server_id, r]));
  const localByClientId = new Map(allRecords.map(r => [r.id, r]));
  // Check both when matching
  ```

### Fix 5: Periodic Balance Reconciliation

**File**: `src/services/localDb.ts`

- Add a `scheduleBalanceReconciliation()` callable from `syncEngine`
- Auto-runs every 5th sync cycle (counter in metadata) or on `visibilitychange` to 'visible'
- Calls `recalculateAllBalances()` which recomputes all account balances from scratch (already implemented, just not triggered)

### Fix 6: SW Mutation Queue (Defense in Depth)

**File**: `sw.ts`

- Intercept failed POST/PUT/DELETE API responses when `!navigator.onLine` or `fetch` throws
- Store the failed request body in IndexedDB (using `localDb` metadata store through `postMessage`)
- When online event fires, replay queued mutations in order
- Dedup with existing sync engine by checking `client_id` before replaying

---

## Implementation Steps

### Step 1: Auth Timeout
- Modify `authService.refreshTokenInternal` to race with a 3s timeout
- Modify `useAuth.init()` to race with a 5s overall timeout
- On timeout → check if old token works locally → else guest mode

### Step 2: Background Sync + Fallback Timer
- In `main.tsx`, after SW registration promise resolves, call `reg.sync.register('sync-offline-queue')`
- In `syncEngine`, add `_fallbackTimer` at 60s interval that checks for pending records and calls `flushPending()`
- Start the fallback timer in `startSyncScheduler()`, stop in `stopSyncScheduler()`

### Step 3: Retry Queue
- Add `getRetryState()`, `setRetryState()`, `clearRetryState()` to `localDb` metadata helpers
- Modify `pushUnsynced` failure path to update retry state
- Modify `pushUnsynced` entry to skip records whose `nextRetryAt > Date.now()`
- Auto-escape hatch: after 5 retries → `sync_status: 'conflict'`

### Step 4: FetchData Cleanup + Dedup Fix
- Remove 30s interval, visibilitychange, online handlers from `useLocalData`
- Fix `localByServerId` → add `localByClientId` fallback lookup
- Ensure the check works bidirectionally

### Step 5: Balance Reconciliation
- Add counter to metadata, increment on each `syncNow()` cycle
- At counter >= 5, call `recalculateAllBalances()` and reset counter
- Also trigger on `visibilitychange → visible`

### Step 6: SW Mutation Queue
- Add IndexedDB access in SW via `localDb` message passing
- On `fetch` failure for POST/PUT/DELETE, postMessage to client to store in metadata
- On `online` event in SW, check mutation queue and replay

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Auth timeout too aggressive (3s) | Medium | User re-logs in unnecessarily | Fall back to cached token, not full logout |
| Retry queue fills up with stale records | Low | Sync takes longer | `conflict` status escape hatch after 5 retries |
| Balance reconciliation conflicts with live edits | Low | Temporary balance flicker | Runs during `pullChanges` which is already an offline-compatible batch |
| SW IndexedDB access complexity | Medium | SW message passing bugs | Keep SW logic minimal; primary retry is in sync engine |
| `fetchData` removal breaks initial migration | Low | Guest→registered migration fails | Keep `fetchData` for initial auth handoff only |

---

## Testing Strategy

1. **Manual offline test**: Enable airplane mode → create transaction → verify local display → go online → verify sync
2. **Auth timeout test**: Block Supabase domains in devtools → reload → verify guest mode within 5s (no blank screen)
3. **Dedup test**: Create transaction → simulate `markPushed` failure → trigger sync → verify no duplicate
4. **Background Sync test**: Create pending records offline → close tab → reopen → verify they synced
5. **Balance reconciliation test**: Create transactions offline on different accounts → go online → verify all balances correct

---

## Files Changed

| File | Change |
|------|--------|
| `src/services/authService.ts` | Add 3s timeout to `refreshSession()` |
| `src/hooks/useAuth.ts` | Add 5s timeout to `init()`, fallback to guest |
| `src/main.tsx` | Register Background Sync `sync-offline-queue` |
| `src/services/syncEngine.ts` | Retry queue, fallback timer, schedule balance recon |
| `src/services/localDb.ts` | Retry metadata helpers, balance reconciliation scheduler |
| `src/hooks/useLocalData.ts` | Remove duplicate polling, fix `client_id` dedup |
| `sw.ts` | Mutation queue interception (failed POST/PUT/DELETE) |

---

## Order of Execution

1. Auth timeout (quick fix, unblocks offline testing)
2. Background Sync registration + fallback timer (core reliability)
3. Retry queue with exponential backoff (prevents data loss)
4. FetchData cleanup + dedup fix (eliminates duplicates)
5. Balance reconciliation (data integrity)
6. SW mutation queue (defense in depth)
7. Verify + update docs
