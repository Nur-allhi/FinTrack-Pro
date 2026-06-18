# Plan: Fix Blank Screen When Offline (PWA)

> **Goal**: Eliminate blank screen on first load and pull-to-refresh when offline. Ensure PWA reads from IndexedDB without requiring server auth.
> **Branch**: `fix/offline-sync-overhaul`

---

## Problem Summary

1. **Scenario 1 — First load while offline**: Auth init calls `refreshSession()` (3s timeout) + `fetch('/api/auth/me')` (fails) + `isServerReachable()` (1.5s timeout) → 5s of loading screen, then falls back to `authStatus='guest'` → Login page renders. User's IndexedDB data is never read.

2. **Scenario 2 — Pull-to-refresh while offline**: Page reloads → same 5s auth delay → guest fallback → Login page. User loses access to local data after refresh.

3. **Guest mode offline**: Guest users (`sessionStorage.guest_mode='true'`) bypass auth checks but still get `authStatus='guest'` → Login page. IndexedDB data exists but is never accessed.

4. **Loading screen deadlock**: `App.tsx:264` blocks rendering when `dataLoading && members.length === 0 && accounts.length === 0`. If `dataLoading` never resolves (or IndexedDB is empty), the app stays on a permanent loading screen.

---

## Proposed Solution

### Fix 1: Offline Auth Fast Path

**Files**: `src/hooks/useAuth.ts`

- At the very start of `init()`, check `navigator.onLine`
- **If offline + Supabase has a cached session** (`sb.auth.getSession()` returns a token):
  - Set `authStatus = 'authenticated'` immediately
  - Set `guestMode = false`
  - Skip all server checks (no refreshSession, no fetch /api/auth/me, no isServerReachable)
- **If offline + no cached session + guest_mode flag**: keep existing path (immediate guest)
- **If offline + no cached session + no guest_mode flag**: set guest immediately (no server attempt)

This eliminates the 3-5 second delay and prevents authenticated users from being downgraded to guest when offline.

### Fix 2: Guest Offline Data Loading

**Files**: `src/hooks/useLocalData.ts`

- Remove the strict `isAuthenticated` guard for offline scenarios
- When offline, always load from IndexedDB regardless of auth status
- Add a `hasLocalData` boolean to the return (true if IndexedDB has members/accounts)
- Add a 3-second loading timeout: after 3s, set `dataLoading = false` even if no data
- Don't clear `members`/`accounts` state on auth → guest transition if offline

### Fix 3: Render App for Offline Guests With Data

**Files**: `src/App.tsx`

- Before rendering the Login page, check if offline AND local data exists
- If `authStatus === 'guest'` AND `!navigator.onLine` AND `hasLocalData`:
  - Render the main app layout with `isOnline={false}` (Header already shows offline indicator)
  - Data comes from IndexedDB via `useLocalData`
- When coming back online: auth revalidates via the existing `online` event → sync engine

### Fix 4: Loading State Timeout (Safety Net)

**Files**: `src/hooks/useLocalData.ts`

- Add a `useEffect` with a 3-second fallback timer
- If `dataLoading` is still `true` after 3s, force-set it to `false`
- Prevents infinite loading in edge cases (empty IndexedDB + offline)

---

## Implementation Steps

### Step 1: Offline Auth Fast Path
- In `useAuth.init()`, before any server calls, check `navigator.onLine`
- If offline → check cached Supabase session → set status immediately
- Update `authService.ts` to export `getClient()` for session checking

### Step 2: Guest Offline Data in useLocalData
- In `useLocalData`, detect offline mode
- When offline + guest, still run `loadFromLocal()` from IndexedDB
- Add `hasLocalData` return flag
- Add 3s loading timeout

### Step 3: App.tsx — Offline Guest Mode
- Add `hasLocalData` check before Login page render
- Condition: `authStatus === 'guest' && !navigator.onLine && hasLocalData`
- If true → render main layout (the existing main return block)

### Step 4: Verify
- Test scenarios: first load offline, pull-to-refresh offline, guest mode offline
- Run lint + typecheck

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Stale session token used offline → 401 on reconnection | Medium | Data sync fails temporarily | Existing 401 retry in `apiFetch` handles this |
| Offline guest with no data still shows app | Low | Empty state (not blank) | Components have empty state handling |
| Loading timeout too aggressive (3s) | Low | Brief flash before data loads | IndexedDB reads are near-instant (<50ms) |
| Session expired while offline → need re-auth | Medium | User redirected to login on reconnection | `apiFetch` 401 handler calls `_onSessionExpired` |

---

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/useAuth.ts` | Add offline fast path before server checks |
| `src/hooks/useLocalData.ts` | Allow offline guest loading; add `hasLocalData`; 3s loading timeout |
| `src/App.tsx` | Render app for offline guests with local data |

---

## Order of Execution

1. Offline auth fast path (unblocks offline access for authenticated users)
2. Guest offline data loading + loading timeout (unblocks offline access for guests)
3. App.tsx — offline guest mode rendering (shows data instead of login)
4. Verify (lint, typecheck, manual scenarios)
