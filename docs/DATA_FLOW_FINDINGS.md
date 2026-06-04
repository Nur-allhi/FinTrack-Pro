# Data Flow Findings — Dashboard/Ledger Desync

> **Date**: 4 June 2026  
> **Context**: After Phase 14 local-first read path fix. Dashboard and Ledger still show mismatching balances. Sync engine pushes inconsistently.

---

## 1. Architecture Overview

The app uses a **local-first** architecture: IndexedDB (`localDb.ts`) is the single source of truth. A background sync engine (`syncEngine.ts`) pushes/pulls to/from a Supabase server.

### 1.1 Object Stores (IndexedDB)

`localDb.ts` manages 11 stores: `members`, `accounts`, `transactions`, `loans`, `loan_settlements`, `investments`, `investment_returns`, `groups`, `budgets`, `recurring_transactions`, `metadata`.

Every record has:
- `id: string` — local UUID (generated via `crypto.randomUUID()`)
- `server_id?: number` — server-assigned integer (populated after sync)
- `sync_status: 'pending' | 'synced' | 'conflict'`
- `_deleted: boolean`
- `updated_at: string` — ISO timestamp

---

## 2. Transaction Write Paths (Two Independent Paths)

### Path A: TransactionModal (Dashboard FAB)

**File**: `src/components/TransactionModal.tsx`  
**Trigger**: User clicks "Post Transaction" from Dashboard

```
TransactionModal.handleSubmit
  → localDb.getAccounts()                          // find local account by server_id
  → localDb.putTransaction(record)                 // save to IndexedDB (sync_status: 'pending')
  → localDb.adjustAccountBalance(acc.id, amount)   // current_balance += delta
  → onUpdate(accountServerId, amount)              // notify parent
      → App.tsx → applyAccountDelta(serverId, amount)  // optimistically update React state
```

**Sync**: Waits for sync engine's background push (30s interval, visibility change, online event).

### Path B: Ledger → useTransactions (Ledger "Add Transaction")

**File**: `src/hooks/useTransactions.ts`  
**Trigger**: User adds transaction from within an account's Ledger view

```
useTransactions.addOrUpdateTransaction
  → localDb.putTransaction(record)                 // save to IndexedDB (sync_status: 'pending')
  → localDb.adjustAccountBalance(acc.id, delta)    // current_balance += delta
  → setTransactions(prev => [displayRecord, ...])  // optimistically update React state
  → authService.apiFetch(POST /api/transactions)   // DIRECT server API call (bypasses sync engine)
    → on success: localDb.putTransaction({...server_id, sync_status: 'synced'})
    → on failure: leaves pending (sync engine retries later)
```

**Sync**: Direct API call immediately + sync engine fallback.

### Key Problem

Path B writes to the server DIRECTLY via `/api/transactions` AND also leaves the record as `sync_status: 'pending'` in localDb. The sync engine's `pushUnsynced()` will also try to push the same record. This creates a **race condition** where the same transaction may be inserted on the server twice (once by the direct API call, once by the sync engine).

Additionally, the sync engine pushes a raw dump of all pending records as a batch to `/api/sync/push`. If a transaction was already POSTed by Path B to `/api/transactions`, the sync engine's push of the same data to `/api/sync/push` lands on a **different endpoint** with different dedup logic.

---

## 3. Account Balance Management (Three Competing Approaches)

### Approach A: Incremental — `adjustAccountBalance()`

**File**: `src/services/localDb.ts:290-302`

```ts
async function adjustAccountBalance(accountLocalId: string, delta: number) {
  const account = await db.get('accounts', accountLocalId);
  account.current_balance = (account.current_balance || 0) + delta;
  account.sync_status = 'pending';
  await db.put('accounts', account);
}
```

Called after EVERY transaction write (both Path A and Path B). Directly mutates `current_balance`. Also marks account as `sync_status: 'pending'`, which means the sync engine will push the account record to server.

### Approach B: Full Recompute — `fetchData()` in useLocalData

**File**: `src/hooks/useLocalData.ts:162-177`

```ts
// Runs every 30s, on visibility change, on coming online
const recomputeAccounts = await localDb.getAccounts();
const allTxns = await localDb.getTransactions();
// ... sum all transactions per account ...
for (const acc of recomputeAccounts) {
  acc.current_balance = (acc.initial_balance || 0) + (txSumByLocalId.get(acc.id) || 0);
}
await localDb.putAccounts(recomputeAccounts);
```

Recomputes `current_balance` from scratch: `initial_balance + sum(all non-deleted transactions)`. Overwrites whatever `adjustAccountBalance` set.

### Approach C: Optimistic UI — `applyAccountDelta()`

**File**: `src/hooks/useLocalData.ts:47-53`

```ts
const applyAccountDelta = useCallback((accountServerId: number, amount: number) => {
  setAccounts(prev => prev.map(a =>
    a.server_id === accountServerId
      ? { ...a, current_balance: (a.current_balance || 0) + amount }
      : a
  ));
}, []);
```

Called from `App.tsx` when `onUpdate` fires from TransactionModal. Modifies React state directly without waiting for IndexedDB.

---

## 4. Root Cause of Dashboard/Ledger Mismatch

### Bug #1: `applyAccountDelta` Double-Apply (CRITICAL)

**Files**: `App.tsx:207`, `useLocalData.ts:47-53`, `useLocalData.ts:325-328`

**Flow**:
1. TransactionModal saves transaction → `adjustAccountBalance` → DB balance goes 1000 → 900
2. `localDb.onChange('accounts')` subscription fires → `useLocalData` re-reads accounts from DB → React state: `[{ balance: 900 }]`
3. TransactionModal calls `onUpdate(accountServerId, -100)` → `App.tsx` calls `applyAccountDelta(accountServerId, -100)`
4. `applyAccountDelta` reads current React state (900 from step 2) and adds -100 → **React state becomes 800**

**Result**: Dashboard reads from React state (800), Ledger reads from localDb via `useTransactions` (900). **Mismatch: 800 vs 900**.

This is a **race condition** — if step 3 fires before step 2 completes, the state is correct (step 4 reads 1000, sets 900; step 2 reads 900, sets 900). But when step 2 wins the race, the balance is off by exactly the transaction amount.

### Bug #2: Direct Server API in useTransactions (HIGH)

**File**: `src/hooks/useTransactions.ts:158-173`

`useTransactions.addOrUpdateTransaction` POSTs directly to `/api/transactions`. The same record also sits in localDb as `sync_status: 'pending'`. The sync engine's `pushUnsynced()` collects ALL pending records and pushes them to `/api/sync/push` (a different endpoint). The server receives the transaction twice — once via `/api/transactions` and once via `/api/sync/push`.

**Impact**: Duplicate transactions on server → duplicate records pulled on next sync → balance doubled.

### Bug #3: Sync Engine Pushes Account Balances (MEDIUM)

**File**: `localDb.ts:296`

`adjustAccountBalance` sets `account.sync_status = 'pending'`. The sync engine collects accounts with `sync_status: 'pending'` and pushes them to server. The server gets the locally-adjusted balance but doesn't have the corresponding transaction yet. On the next `pullChanges()`, the server returns the transaction (with the locally-adjusted balance already applied), creating a potential double-count.

### Bug #4: `fetchData` Recompute vs `adjustAccountBalance` (MEDIUM)

**File**: `useLocalData.ts:162-177`

`fetchData()` recomputes `current_balance = initial_balance + sum(transactions)`. This overwrites any incremental adjustments. While the arithmetic should produce the same result in theory, in practice:
- If a transaction has been pushed to server but the account hasn't, `adjustAccountBalance` and the recompute compete
- If the recompute runs mid-sync (some records pushed, some not), the balance is a snapshot of an inconsistent state
- Deleted transactions and orphan records can cause the recompute to produce a different sum

### Bug #5: Account Balance Display Sources Diverge (LOW)

| Location | Balance Source | Updates via |
|----------|--------------|-------------|
| **Dashboard totalBalance** | `accounts[].current_balance` from useLocalData React state | onChange('accounts') + applyAccountDelta |
| **DashboardCharts trend** | `localDb.getTransactions()` computed from scratch | onChange('transactions') |
| **Ledger header** | `account.current_balance` from props (same as Dashboard) | Same as Dashboard |
| **Ledger row balances** | Running balance derived from `useTransactions` | onChange('transactions') |

DashboardCharts computes its own balance independently from the account's `current_balance`. If there's a skew between transaction data and account data, the chart can show a different balance than the Dashboard hero.

---

## 5. Sync Engine Issues

### 5.1 Push sends raw pending records

`syncEngine.pushUnsynced()` (line 81-124) collects ALL records with `sync_status: 'pending'` across all stores and sends them as a batch to `POST /api/sync/push`. The server processes each table separately but there's no transactional guarantee — accounts might update but transactions fail, or vice versa.

### 5.2 Pull translates account IDs weakly

`syncEngine.pullChanges()` (line 127-208) translates server numeric `account_id` to local UUIDs via `accountIdMap`. If the local account hasn't been synced yet (no `server_id` mapping), the transaction gets stored with the server's numeric `account_id` — which won't match any local account, making the transaction invisible.

### 5.3 LWW conflict resolution skips pending local records

`pullChanges()` (line 174-182) skips server records where `local.sync_status === 'pending'`. This means if a local record is pending, the server version is discarded during pull — even if the server has a more recent version. This prevents conflicts but also means the server's version of the data is ignored until the local record is pushed.

---

## 6. Transaction `id` Instability

**File**: `src/hooks/useTransactions.ts:18`

```ts
function toUiTransaction(local: LocalTransaction, accountServerId: number): Transaction {
  return {
    id: local.server_id && typeof local.server_id === 'number'
      ? local.server_id
      : uuidToNumber(local.id),  // hash of UUID → unstable
    ...
  };
}
```

Transactions use `uuidToNumber()` (a hash of the UUID) as the display `id` until they get a `server_id`. This means the transaction's `id` **changes** after sync completes. This can cause:
- React key warnings
- Lost references in `editingTx` state
- Deleted transaction lookup failures

---

## 7. Summary of Required Fixes

| # | Fix | Priority | Impact |
|---|-----|----------|--------|
| 1 | Remove `applyAccountDelta` — let `onChange('accounts')` handle state updates | **Critical** | Fixes Dashboard/Ledger mismatch |
| 2 | Remove direct server API calls from `useTransactions.addOrUpdateTransaction` — let sync engine handle all server writes | **High** | Prevents duplicate server records |
| 3 | Stop setting `account.sync_status = 'pending'` in `adjustAccountBalance` — OR remove the recompute in `fetchData()` | **High** | Prevents balance drift |
| 4 | Add idempotency key or dedup logic in sync push | **Medium** | Prevents duplicate sync |
| 5 | Stabilize transaction `id` — use local UUID consistently | **Low** | Prevents key/reference issues |
