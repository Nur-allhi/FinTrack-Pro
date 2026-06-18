# Data Load / Write / Read / Sync Flow — Review

**Date**: 2026-06-18
**Scope**: Full data lifecycle analysis across the local-first architecture (IndexedDB + Supabase)

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (Device)                         │
│  ┌───────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  React UI  │◄─│  Hooks (state)   │◄─│   localDb.ts     │  │
│  │            │  │  useLocalData    │  │  (IndexedDB)     │  │
│  │  App.tsx   │  │  useTransactions │  │  fintrack_local  │  │
│  │  Comp.tsx  │  │  useAuth         │  │  11 stores       │  │
│  └───────────┘  └──────────────────┘  └────────┬─────────┘  │
│                                                 │            │
│                                    ┌────────────▼─────────┐ │
│                                    │   syncEngine.ts       │ │
│                                    │   push / pull / LWW   │ │
│                                    └────────────┬─────────┘ │
│                                                 │            │
│                                    ┌────────────▼─────────┐ │
│                                    │   sw.ts (Service      │ │
│                                    │   Worker)             │ │
│                                    │   - offline queue     │ │
│                                    │   - API cache         │ │
│                                    └──────────────────────┘ │
└─────────────────────────────────────┬───────────────────────┘
                                      │ HTTPS
┌─────────────────────────────────────▼───────────────────────┐
│                      Server (Express + Supabase)             │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  /api/sync/push    — Bulk upsert (client_id match)   │    │
│  │  /api/sync/pull    — Delta since timestamp           │    │
│  │  /api/sync/initial — Full download (guest migration) │    │
│  └──────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  PostgreSQL (Supabase) — RLS by user_id              │    │
│  │  Tables: members, accounts, transactions, loans,     │    │
│  │  loan_settlements, investments, investment_returns,  │    │
│  │  budgets, recurring_transactions                     │    │
│  └──────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Key files

| File | Lines | Purpose |
|------|-------|---------|
| `src/services/localDb.ts` | 666 | IndexedDB wrapper — 11 object stores, CRUD, change notification |
| `src/services/syncEngine.ts` | 894 | Bi-directional sync — push/pull, LWW, retry, scheduler |
| `src/hooks/useLocalData.ts` | 390 | Auth-aware data provider — local load + background server fetch |
| `src/hooks/useTransactions.ts` | 235 | Transaction CRUD — local-first write, triggers `flushPending()` |
| `api/routes/sync.ts` | 243 | Server sync — `/push`, `/pull`, `/initial` |
| `sw.ts` | 167 | Service Worker — offline mutation queue, API cache |
| `shared/schema.ts` | 307 | Canonical schema — every field tagged `push`/`pull`/`both`/`none` |

### Local IndexedDB stores (`fintrack_local`, version 2)

| Store | Key | Indices |
|-------|-----|---------|
| `members` | `id` (UUID) | `sync_status`, `_deleted` |
| `accounts` | `id` (UUID) | `sync_status`, `_deleted`, `member_id`, `parent_id`, `type` |
| `transactions` | `id` (UUID) | `sync_status`, `_deleted`, `account_id`, `date`, `category` |
| `loans` | `id` (UUID) | `sync_status`, `_deleted`, `lender_account_id`, `borrower_account_id`, `status` |
| `loan_settlements` | `id` (UUID) | `sync_status`, `_deleted`, `loan_id` |
| `investments` | `id` (UUID) | `sync_status`, `_deleted`, `account_id` |
| `investment_returns` | `id` (UUID) | `sync_status`, `_deleted` |
| `groups` | `id` (UUID) | `sync_status`, `_deleted`, `member_id` |
| `budgets` | `id` (UUID) | `sync_status`, `_deleted`, `month`, `category` |
| `recurring_transactions` | `id` (UUID) | `sync_status`, `_deleted`, `account_id`, `next_date`, `active` |
| `metadata` | arbitrary keys | none |

---

## Scenario 1: First Load (Fresh Device, Never Used Before)

### Sequence diagram

```
main.tsx                  App.tsx                    useAuth              useLocalData                 syncEngine
   │                        │                        │                       │                           │
   ├─ Register SW ──────────┤                        │                       │                           │
   │  (sw.js)               │                        │                       │                           │
   │                        ├─ useAuth() ────────────┤                       │                           │
   │                        │                        ├─ Check guest_mode     │                           │
   │                        │                        │  (sessionStorage)     │                           │
   │                        │                        ├─ Try Supabase refresh  │                           │
   │                        │                        ├─ Try /api/auth/me     │                           │
   │                        │                        ├─ 5s timeout           │                           │
   │                        │                        │  → guest or auth      │                           │
   │                        │◄──── isAuthenticated ──┤                       │                           │
   │                        │                             │                  │                           │
   │                        ├─ useLocalData(auth) ────────┼──────────────────┤                           │
   │                        │                             │                  │                           │
   │                        │                             │     loadFromLocal()                         │
   │                        │                             │       → IndexedDB GET                       │
   │                        │                             │       → [] (empty, first time)              │
   │                        │                             │                  │                           │
   │                        │◄─── members=[], accounts=[] ─┤                  │                           │
   │                        │                             │                  │                           │
   │                        │                             │     fetchData()  │                           │
   │                        │                             │  (if online+auth)│                           │
   │                        │                             │       │          │                           │
   │                        │                             │       ├─ GET /api/members ────→ server       │
   │                        │                             │       ├─ GET /api/accounts ───→ server       │
   │                        │                             │       ├─ GET /api/groups ─────→ server       │
   │                        │                             │       │                                       │
   │                        │                             │       ├─ localDb.putMembers()                 │
   │                        │                             │       ├─ localDb.putAccounts()                │
   │                        │                             │       ├─ localDb.putGroups()                  │
   │                        │                             │       │                                       │
   │                        │◄── members=[...], accounts=[...] ─┤                                       │
   │                        │                                                                           │
   │                        ├─ startSyncScheduler() ────────────────────────────────────────┤           │
   │                        │                                                                           │
   │                        ├─ syncNow() ───────────────────────────────────────────────────┤           │
   │                        │                                                                           │
   │                        │                                                              ├─ push (0)  │
   │                        │                                                              ├─ pull ────→│
   │                        │                                                              │  GET /pull  │
   │                        │                                                              │  since=1970 │
   │                        │                                                              │◄── data ───│
   │                        │                                                              ├─ reconcile │
   │                        │                                                                           │
   │                        ├─ POST /api/recurring/process                                              │
```

### Step-by-step

1. **`main.tsx`** — Registers the service worker at `/sw.js`, sets up listeners for `SYNC_OFFLINE_QUEUE` and `MUTATION_QUEUE` messages, registers Background Sync.

2. **`App.tsx`** mounts → calls `useAuth()`:
   - Checks `sessionStorage.getItem('guest_mode')`
   - Attempts Supabase auth.getSession() (works offline via cached session)
   - Pings `POST /api/auth/me` with 1.5s server timeout
   - Falls back to **guest mode** if unauthenticated or offline

3. **`useLocalData(isAuthenticated)`** triggers on auth state:
   - **Authenticated path:**
     - `loadFromLocal()` reads IndexedDB → **empty** (fresh device, no data) → `members: []`, `accounts: []`
     - UI renders empty state momentarily
     - `fetchData()` runs background parallel fetches:
       - `GET /api/members` → maps by `server_id`/`client_id`, assigns `crypto.randomUUID()` as local `id`, writes to IndexedDB with `sync_status: 'synced'`
       - `GET /api/accounts` → same pattern; translates `member_id` (server number → local UUID)
       - `GET /api/groups` → same pattern
     - React state updates → UI re-renders with data
   - **Guest path:**
     - reads IndexedDB (empty) → shows empty state
     - User can create data locally (written to IndexedDB with `sync_status: 'pending'`)

4. **Sync scheduler starts** (`App.tsx:171-178`):
   - `startSyncScheduler()` sets up:
     - 30s interval: `syncNow()`
     - 5min interval: `syncNow()` + reconciliation
     - `visibilitychange` → `syncNow()`
     - `online` event → `syncNow()`
   - Immediate `syncNow()` runs:
     - `pushUnsynced()` — 0 records pending
     - `pullChanges()` — GETs `/api/sync/pull?since=1970-01-01T00:00:00Z`
     - Server returns all user records (same data just fetched by `fetchData()`)
     - LWW comparison skips records already written by `fetchData()` (timestamps match)
     - `reconcileBalances()` — no-op (no transactions yet)

5. **`POST /api/recurring/process`** — triggers recurring transaction generation (no-op if none exist)

### Redundancy on first load

`fetchData()` (individual API calls) runs concurrently with `syncNow()` → `pullChanges()` (bulk pull). Both download the same server data. The `fetchData()` path wins the race and writes first; `pullChanges()` then runs LWW comparison and skips duplicates because timestamps match.

**Impact**: ~2x network transfer on first authenticated load. Non-blocking (background) so no user-visible delay.

---

## Scenario 2: Second Load (Returning User, Same Device)

### Sequence diagram

```
main.tsx         App.tsx           useAuth          useLocalData              syncEngine
   │                │                │                  │                       │
   │                ├─ useAuth() ────┤                  │                       │
   │                │                ├─ Session restored│                       │
   │                │◄─── auth ──────┤                  │                       │
   │                │                                    │                       │
   │                ├─ useLocalData(true) ──────────────┤                       │
   │                │                                    │                       │
   │                │                         loadFromLocal()                   │
   │                │                           → IndexedDB GET                 │
   │                │                           → members=[...] (instant!)      │
   │                │                           → accounts=[...] (instant!)     │
   │                │◄─ data loaded ───────────┤                                │
   │                │                                    │                       │
   │                │  UI renders instantly              │                       │
   │                │  with cached data                   │                       │
   │                │                                    │                       │
   │                │                         fetchData() (background)          │
   │                │                           → GET /api/members              │
   │                │                           → GET /api/accounts             │
   │                │                           → GET /api/groups               │
   │                │                                    │                       │
   │                │                           Dedup by server_id/client_id    │
   │                │                           Preserves local 'pending'       │
   │                │                           Soft-purges orphans             │
   │                │                                    │                       │
   │                ├─ startSyncScheduler() ─────────────┼───────────►          │
   │                ├─ syncNow() ────────────────────────┼───────────►          │
   │                │                                    │          pushUnsynced│
   │                │                                    │          pullChanges  │
   │                │                                    │          reconcile    │
   │                │                                    │                       │
   │                │  ┌─── Every 30s ───────────────────┼── syncNow() ────►    │
   │                │  ├─── visibilitychange ────────────┼── syncNow() ────►    │
   │                │  ├─── online ─────────────────────┼── syncNow() ────►    │
   │                │  └─── Every 5min ─────────────────┼── syncNow() ────►    │
   │                │                                    │      + reconcile     │
   │                │                                    │                       │
   │                │  localDb.onChange('accounts') ─────┤                       │
   │                │  → re-read accounts from IndexedDB │                       │
   │                │  → setAccounts() → UI re-render    │                       │
```

### Step-by-step

1. **Auth restored** — Supabase session cookie or guest mode in `sessionStorage` → `useAuth()` resolves quickly (no network for guest, cached token for auth)

2. **`loadFromLocal()`** — **Instant IndexedDB read** (`localDb.getMembers()` + `localDb.getAccounts()`). Data appears immediately — no network request, no loading spinner.

3. **UI renders** — Components show cached data (accounts, balances, transactions) from the previous session.

4. **`fetchData()`** (background, authenticated only):
   - Full GETs to `/api/members`, `/api/accounts`, `/api/groups`
   - **Dedup**: for each server record, checks local `server_id` and `client_id` maps. If existing local record is `pending`, keeps local version (server doesn't overwrite unsent changes).
   - **Soft-purge**: records that exist locally but not in server response are either soft-deleted (`_deleted: true`) if they have dependent records, or hard-deleted otherwise.
   - Writes updated data to IndexedDB.

5. **Reactive update**: `localDb.onChange('accounts')` and `localDb.onChange('members')` listeners in `useLocalData.ts` re-read from IndexedDB and update React state → components re-render with fresh data.

6. **Sync engine** starts and runs perpetually:
   - Pushes any local pending changes
   - Pulls any server changes since last `sync_timestamp`
   - Reconciles balances

### Key property: Cache persistence

IndexedDB has **no TTL**. Data persists until the app explicitly calls `clearAll()` or the user clears browser storage. This means returning to the app weeks later still shows the last synced state instantly.

---

## Scenario 3: Cross-Device Sync (Device 2 Writes, Device 1 Receives)

### Push flow (Device 2 → Server)

```
Device 2 User
  creates transaction
        │
        ▼
useTransactions.addOrUpdateTransaction()
        │
        ├─ Generate local UUID (crypto.randomUUID())
        ├─ localDb.putTransaction({ id: uuid, sync_status: 'pending', ... })
        ├─ localDb.adjustAccountBalance(acc.id, delta)
        ├─ flushPending() ────────────────────────────────► syncEngine
        │                                                       │
        ▼                                                       ▼
IndexedDB: transaction saved                             pushUnsynced()
                                                               │
                                                      ┌────────┴────────┐
                                                      │                 │
                                               GET pending records   BUILD FK maps
                                               (sync_status===       (local UUID →
                                                'pending')           server ID)
                                                      │                 │
                                                      └────────┬────────┘
                                                               │
                                                      Sanitize for push
                                                      strip: id, sync_status, _deleted
                                                      map: id → client_id
                                                      map: _deleted → deleted_at
                                                      map: account_id → server_number
                                                               │
                                                               ▼
                                                      POST /api/sync/push
                                                      { records: { transactions: [...] } }
                                                               │
                                                               ▼
                                                      Server upsert:
                                                        1. Try match by client_id
                                                        2. Fallback by server_id
                                                        3. Insert as new
                                                               │
                                                      Returns { client_id, server_id }
                                                               │
                                                               ▼
                                                      localDb.markPushed()
                                                      store server_id
                                                      sync_status → 'synced'
```

### Pull flow (Device 1 ← Server, silent update)

```
Device 1 sync scheduler (30s tick or visibilitychange)
        │
        ▼
syncNow() → pushUnsynced() → pullChanges()
        │
        ├─ GET /api/sync/pull?since=2026-06-18T10:00:00Z
        │
        ▼
Server responds with all records where updated_at > since
  { changes: { transactions: [...], accounts: [...], ... } }
        │
        ▼
For each table:
  1. Translate server IDs → local UUIDs
     (account_id: 42 → account_id: "abc-def...")
  2. Filter out tombstoned records
  3. LWW conflict resolution:
     ┌─────────────────────────────────────────────────────┐
     │ if local.sync_status === 'pending'  → SKIP         │
     │ if local._bin_emptied               → SKIP         │
     │ if server.updated_at > local.updated_at → UPSERT   │
     │ else                                  → SKIP       │
     └─────────────────────────────────────────────────────┘
  4. Upsert survivors with sync_status: 'synced'
        │
        ▼
If transactions were pulled:
  localDb.recalculateAllBalances()
  → replay all transactions against initial_balance
        │
        ▼
localDb.onChange('transactions') fires
  → useTransactions re-reads from IndexedDB
  → setTransactions() → UI re-renders
        │
        ▼
localDb.onChange('accounts') fires
  → useLocalData re-reads accounts
  → setAccounts() → UI re-renders with new balances
```

### LWW conflict resolution — detailed

```
Client-side (pullChanges at syncEngine.ts:537-547):
┌─────────────────────────────────────────────────────────────────────┐
│ const local = localMap.get(r.id as number);  // r.id = server_id   │
│ if (!local) return true;                     // new record, upsert  │
│ if (local.sync_status === 'pending') return false; // local wins   │
│ if (local._bin_emptied) return false;        // permanently deleted │
│ const serverTime = new Date(r.updated_at).getTime();                │
│ const localTime = new Date(local.updated_at).getTime();             │
│ return serverTime > localTime;               // server wins if newer│
└─────────────────────────────────────────────────────────────────────┘

Server-side (push at api/routes/sync.ts:77-79):
┌─────────────────────────────────────────────────────────────────────┐
│ if (new Date(sanitized.updated_at) < new Date(existing.updated_at)) │
│   conflicts++; continue;  // server has newer data, skip           │
└─────────────────────────────────────────────────────────────────────┘
```

### Conflict stalemate edge case

```
Time  │  Device 1          Device 2          Server
──────┼─────────────────────────────────────────────────────
T=0   │  Online: pull R   Online: pull R    R exists (T=0)
T=100 │  Offline: edit R   -                 -
      │  updated_at=T=100
T=200 │  -                Offline: edit R    -
      │                    updated_at=T=200
T=300 │  -                Online: push R     Server R → T=200
T=400 │  Online: push R    -                 -
      │  server sees R.updated_at=200
      │  > client.R.updated_at=100
      │  → CONFLICT, skip
      │
      │  Online: pull R    -                 -
      │  server sends R (T=200)
      │  local has R sync_status='pending'
      │  → SKIP (local wins)
      │
T=500 │  R stuck at pending, can't push or pull
      │  After 5 retries → sync_status = 'conflict'
      │  → Manual resolution required
```

**Result**: Device 1's edit (T=100) is effectively lost — it can't push because server is newer, and it won't accept the server version because local has pending changes. After 5 retry failures, marked as `conflict` with no UI to resolve it.

---

## Sync scheduling matrix

| Mechanism | Interval | Triggered by | Purpose |
|-----------|----------|-------------|---------|
| Timer | 30s | `setInterval` | Regular background sync |
| Reconciliation | 5min | `setInterval` | Periodic balance recalculation |
| Visibility change | On tab focus | `visibilitychange` event | Sync when user returns |
| Online event | On reconnect | `online` event | Sync immediately on coming online |
| Fallback timer | 60s | `setInterval` | For browsers without Background Sync (Safari, Firefox) |
| Background Sync | On reconnect | `sync` event (SW) | Standardized offline queue |
| Write trigger | On mutation | `flushPending()` | Immediate push after local write |

---

## Retry with exponential backoff

```
Attempt  │  Delay
─────────┼─────────
   1     │   5s
   2     │  15s
   3     │  45s
   4     │ 120s  (2 min)
   5     │ 300s  (5 min)
   ──────┼────────────────
   >5    │  sync_status = 'conflict'
         │  retry state cleared
```

Records with untranslatable foreign keys (e.g., a transaction referencing an account that hasn't synced yet) also enter the retry queue via `_pendingRetry` mechanism.

---

## Architectural strengths

| Aspect | Mechanism | Benefit |
|--------|-----------|---------|
| **Local-first writes** | Writes go to IndexedDB first, `sync_status: 'pending'` | Instant UI feedback, works fully offline |
| **Instant subsequent loads** | `loadFromLocal()` reads IndexedDB on mount | Sub-millisecond reads, no loading state for returning users |
| **Silent background sync** | 30s timer + events + pull delta | Data appears without refresh, without polling UI |
| **No balance conflicts** | `current_balance` is direction: `none` | Never pushed; always recalculated from transaction sums locally |
| **Dual ID system** | `id` (local UUID) + `server_id` (server BIGSERIAL) + `client_id` (server UUID column) | No ID collisions between devices; maps both directions |
| **Soft-delete** | `_deleted` ↔ `deleted_at` mapping | Recycle bin support; syncs deletions cleanly |
| **Tombstone tracking** | `tombstone:{table}:{serverId}` metadata | Permanently deleted records never reappear |
| **Reactive UI** | `localDb.onChange()` → hooks → React state | Components re-render automatically on data changes |
| **Change notification** | Custom listener pattern (not polling) | Efficient — React only re-renders affected data |
| **Canonical schema** | `shared/schema.ts` — single source of truth | All three layers (server, local, app) stay consistent |
| **Request-scoped Supabase client** | `api/db.ts` with AsyncLocalStorage | Proper RLS isolation; each request uses the user's JWT |

---

## Potential concerns

### 1. Conflict stalemate

Concurrent offline edits on two devices create a stuck `pending` state with no resolution path. The record enters `conflict` status after 5 retries, but there is no UI to review or merge the conflict.

**Impact**: User loses one device's changes silently.

### 2. `fetchData()` redundant with sync pull on first load

On initial authenticated load, `fetchData()` (individual API calls at `useLocalData.ts:68-272`) fetches all members/accounts/groups, then `syncNow()` immediately runs `pullChanges()` which fetches the same data a second time via the bulk sync endpoint.

**Impact**: ~2x network transfer on first load. Non-blocking (background), so no user-visible delay, but wasteful.

### 3. Pull-only on visibility change

The `visibilitychange` handler calls `syncNow()` (full push + pull cycle) even when the user just returns to an existing tab. If no pending local changes exist, the push scan (`getUnsyncedForTable` × 9 tables) is wasted.

**Impact**: Minor CPU/memory overhead on tab switch. No functional issue.

### 4. Balance recalc cadence after remote writes

If Device 2 pushes transactions, Device 1's next pull triggers immediate `recalculateAllBalances()`. But mid-cycle (between 30s pulls) there's no gap. Balance is recalculated immediately on pull that includes transactions (`syncEngine.ts:574`).

**No actual issue here** — the recalc fires immediately on any pull containing transactions. The 5th-cycle reconciliation is an extra safety net.

### 5. No cross-device sync for guests

Guest mode never communicates with the server. Data created by a guest lives only on that device. Cross-device sync is only available after authentication.

**Impact**: Expected behavior by design.

---

## Recommendation summary

| Concern | Severity | Recommendation |
|---------|----------|---------------|
| Conflict stalemate | Medium | Add conflict resolution UI with merge/keep-local/keep-server options |
| `fetchData()` redundancy on first load | Low | Use `pullChanges()` as the sole initial load path; remove `fetchData()` individual API calls |
| Visibility change pushes unnecessarily | Low | Add a `hasPending()` check before `pushUnsynced()` on visibility change |
