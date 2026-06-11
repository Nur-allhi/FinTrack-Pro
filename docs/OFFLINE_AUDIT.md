# Offline Usability Audit — FinTrack Pro

> **Date**: 2026-06-11
> **Auditor**: AI-assisted codebase analysis
> **Branch**: `feature/ui-ux-polish-improvement`

---

## Architecture Overview

The app uses a **local-first** pattern:
- **IndexedDB** (`localDb`) stores all entity data locally
- Records tagged with `sync_status: 'pending' | 'synced' | 'conflict'`
- **Sync engine** (`syncEngine.ts`) pushes pending records to server when online
- **Service worker** (`sw.ts`) precaches app assets via Workbox

---

## What Works Offline ✅

| Component | Reads | Writes |
|-----------|-------|--------|
| Dashboard | Local DB | N/A |
| Ledger (transactions) | Local DB | Full offline (WriteModal) |
| Members | Local DB | Full offline |
| Accounts | Local DB | API-first, falls back to local |
| Loans | Local DB | Full offline (WriteModal) |
| Investments | Local DB | Full offline (WriteModal) |
| Groups | Local DB | API-first, falls back to local |
| Recycle Bin (load/restore) | Local DB | Local-only |

---

## Critical Issues — Fix Required

### Issue 1: Blank screen on offline refresh

**Root cause**: Service worker uses `NetworkFirst` strategy for document navigation (`sw.ts:28`). When offline:
1. SW tries network fetch — fails (takes seconds)
2. Falls back to cache — serves precached `index.html`
3. During the network timeout window, browser shows blank/white

**Fix**: Change to `StaleWhileRevalidate` — serve cache instantly, update in background.

---

### Issue 2: BudgetManager.tsx — Fully offline-unaware (HIGH)

**File**: `src/components/BudgetManager.tsx`
- Line 34: Loads via `authService.apiFetch('/api/budgets')` — no localDb fallback → empty state offline
- Line 44: Creates via `authService.apiFetch('POST /api/budgets')` — no localDb write → "Failed to save" offline
- Line 61: Deletes via `authService.apiFetch('DELETE /api/budgets/')` — no localDb → "Failed to delete" offline

Despite `localDb.ts:417-421` having a fully functional `budgets` store with sync support, the component never uses it.

**Fix**: Follow the pattern of other managers — write to `localDb` with `sync_status: 'pending'`, then call `flushPending()`.

---

### Issue 3: RecurringManager.tsx — Fully offline-unaware (HIGH)

**File**: `src/components/RecurringManager.tsx`
- Line 36: Loads via `authService.apiFetch('/api/recurring')` — no localDb fallback
- Line 46: Creates via `authService.apiFetch('POST /api/recurring')` — no localDb write
- Line 57: Toggles via `authService.apiFetch('PATCH /api/recurring/')` — no localDb
- Line 62: Deletes via `authService.apiFetch('DELETE /api/recurring/')` — no localDb

Despite `localDb.ts:423-428` having a fully functional `recurring_transactions` store with sync support, the component never uses it.

**Fix**: Follow the pattern of other managers — write to `localDb` with `sync_status: 'pending'`, then call `flushPending()`.

---

### Issue 4: RecycleBin.tsx — Permanent delete skips local cleanup when offline (MEDIUM)

**File**: `src/components/RecycleBin.tsx`
- Lines 77-80: Permanent delete gates `localDb.permanentDelete` behind server API call — offline skips local cleanup
- Lines 95-96: Empty bin gates `localDb.emptyBin()` behind server API call — offline never executes

**Fix**: Reorder to do local delete first, then attempt server delete as best-effort.

---

### Issue 5: GroupManager.tsx — Premature sync_status assignment (LOW)

**File**: `src/components/GroupManager.tsx:86`
- Edit saves to localDb with `sync_status: 'synced'` before PATCH confirms
- If PATCH fails, corrects to `pending` — but there's a window of inconsistency

**Fix**: Save locally as `pending` first, update to `synced` only after PATCH succeeds.

---

### Issue 6: Auth init unhandled rejection when offline

**File**: `src/services/authService.ts:59`
- `setSession()` (POST to server) throws when offline, no try/catch
- Callers (e.g., `useAuth.ts`) catch it, but the unhandled rejection at the source is a risk

**Fix**: Wrap `setSession()` POST in try/catch in `refreshTokenInternal()`.

---

### Issue 7: API config fetch fails offline in getSupabase()

**File**: `src/services/authService.ts:23`
- `fetch('/api/auth/config')` fails offline — `getSupabase()` returns `null`
- `_initPromise` caches the rejection; subsequent calls get `null` until page refresh
- No retry mechanism when coming back online

**Fix**: Clear `_initPromise` on failure so next call retries.

---

## Summary

| Priority | Issue | Component | Impact |
|----------|-------|-----------|--------|
| **CRITICAL** | Blank screen on offline refresh | Service worker | User sees blank until online |
| **HIGH** | Budgets break offline | BudgetManager.tsx | Empty state + errors |
| **HIGH** | Recurring transactions break offline | RecurringManager.tsx | Empty state + errors |
| **MEDIUM** | Recycle bin cleanup skips offline | RecycleBin.tsx | Items stuck in bin |
| **LOW** | Group edit premature synced | GroupManager.tsx | Brief inconsistency |
| **LOW** | Auth setSession unhandled rejection | authService.ts | Risk of crash |
| **LOW** | API config cached rejection | authService.ts | Retry never happens |
