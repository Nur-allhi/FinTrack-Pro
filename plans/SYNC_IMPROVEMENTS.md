# Plan: Sync Improvements — Immediate Push + Progress Bar + Periodic Reconcile

> **Date**: 4 June 2026
> **Branch**: `feat/unified-write-modal`
> **Risk**: MEDIUM — touches sync engine, WriteModal, useTransactions, LoanManager, OfflineIndicator
> **Estimate**: ~150 LOC changed net

---

## Problem

1. **Sync is lazy** — only runs on 30s interval, tab visibility, or online events. Users create data and it sits in `sync_status: 'pending'` for up to 30s before reaching the server.
2. **No sync progress feedback** — the `OfflineIndicator` has a fake `60%` progress bar that never shows real progress. The `syncState.state` is never set to `'syncing'` due to a bug (`syncNow()` uses the old `_isSyncing` mechanism instead of `syncState.setState`).
3. **No periodic reconciliation** — server data is only pulled via the 30s interval. If a sync was missed (offline), data can drift for a long time.

## Solution

### Part 1 — Fix `syncState` to emit syncing events

**File**: `src/services/syncEngine.ts`

The `setSyncing(v)` function (line 26) only notifies old `_syncListeners`. The `syncState` observable has a `state` field that is never set to `'syncing'`. Fix by also calling `syncState.setState({ state: v ? 'syncing' : 'idle' })`.

Also track real `progress` during sync for the progress bar.

### Part 2 — Fire `flushPending()` after every CRUD

**File**: `src/services/syncEngine.ts` — new `flushPending()` function (push-only sync)

**Call sites** (fire & forget):
- `WriteModal.tsx` — after successful submit in `handleSubmit`
- `useTransactions.ts` — after `addOrUpdateTransaction` and `deleteTransaction`
- `LoanManager.tsx` — after `handleDelete`

### Part 3 — Sync progress bar

**Files**: `src/services/syncEngine.ts` + `src/components/OfflineIndicator.tsx`

Emit `syncState.setState({ progress: { current, total } })` inside `pushUnsynced()` and `pullChanges()` loops. Replace the hardcoded `60%` in `OfflineIndicator` with real progress.

### Part 4 — 5-minute reconcile interval

**File**: `src/services/syncEngine.ts` — add a second `setInterval` in `startSyncScheduler()` that runs `syncNow()` every 5 minutes.

### Part 5 — Keep 30s interval as fallback

No changes — it stays as a safety net.

---

## Implementation Order

| Step | Files | What |
|------|-------|------|
| 1 | `syncEngine.ts` | Fix `setSyncing` to update `syncState.state`, add progress to `SyncStatus`, emit progress in push/pull loops |
| 2 | `syncEngine.ts` | Add `flushPending()` export (push without pull) |
| 3 | `syncEngine.ts` | Add 5min reconcile interval in `startSyncScheduler()` |
| 4 | `WriteModal.tsx` | Call `flushPending()` after successful submit |
| 5 | `useTransactions.ts` | Call `flushPending()` after add/delete |
| 6 | `LoanManager.tsx` | Call `flushPending()` after delete |
| 7 | `OfflineIndicator.tsx` | Replace fake 60% with real progress |

## Verification

1. `npx tsc --noEmit` — zero errors
2. `npm run build` — production build succeeds
3. Create transaction → sync fires within 1s (not 30s)
4. OfflineIndicator shows real progress during sync
5. Wait 5min → reconcile runs (pull from server)
