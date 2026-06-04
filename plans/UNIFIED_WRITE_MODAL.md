# Plan: Unified Write Modal

> **Date**: 4 June 2026  
> **Branch**: `feat/unified-write-modal`  
> **Risk**: HIGH — touches App.tsx, 7 components, hooks, creates 2 new files, deletes 6 files  
> **Estimate**: ~500 LOC changed net (−300 LOC)

---

## Problem

Currently 5 independent write paths create transactions/loans/investments, and 3 competing balance computation approaches cause Dashboard/Ledger mismatch (see `docs/DATA_FLOW_FINDINGS.md`).

Additionally, the **loan module does not affect account balances** — creating/settling a loan registers in the Loans page but does not create ledger entries or adjust account `current_balance`. Loans are tracked as separate records with `remaining` field, but no transactions flow into accounts.

## Solution

Replace all write modals and inline forms with **one unified WriteModal** that handles every write operation. All writes go to `localDb` only — no direct server API calls. The sync engine handles all server pushes.

Loan writes will now also generate corresponding transactions in the linked accounts, so loans appear in the ledger and affect balances.

---

## 1. Types

### 1.1 Write Operation Type

Defined in `src/types.ts`:

```ts
export type WriteOperation =
  | { type: 'transaction'; prefillAccountId?: number; editTx?: Transaction }
  | { type: 'transfer' }
  | { type: 'loan_create' }
  | { type: 'loan_edit'; loan: Loan }
  | { type: 'loan_settle'; loan: Loan }
  | { type: 'investment_create' }
  | { type: 'investment_return'; investment: Investment; investmentId?: number };
```

### 1.2 Modal State in App.tsx

```ts
const [writeOperation, setWriteOperation] = useState<WriteOperation | null>(null);
```

All trigger points call `setWriteOperation({ type: 'transaction' })` etc.

---

## 2. New Files

### 2.1 `src/components/WriteModalForms.tsx` (~300 LOC)

Pure form components for each mode — no portal, no backdrop, no submit logic. Just form state management and JSX.

Exports:
```ts
TransactionForm, TransferForm, LoanCreateForm, LoanEditForm,
LoanSettleForm, InvestmentCreateForm, InvestmentReturnForm
```

Each is a controlled component that receives `state + setState + accounts + members + currency` as props and renders the appropriate fields.

### 2.2 `src/components/WriteModal.tsx` (~350 LOC)

The shell: portal, backdrop, animations, mode selector, submit handler, batch toggle.

**Props:**
```ts
interface WriteModalProps {
  operation: WriteOperation;
  accounts: Account[];
  members: Member[];
  currency: string;
  onClose: () => void;
  onTransactionSaved?: () => void; // for signup nudge
}
```

**State:**
- `mode` — determined from `operation.type`
- Form state per mode (union discriminated by `operation.type`)
- `closing` — for exit animation
- `batchMode` — toggle in corner (default off)
- `isWriting` — double-click guard

**Data Flow (all modes):**
```
handleSubmit
  → validate
  → localDb.put*(record(s)) with sync_status: 'pending'
  → localDb.adjustAccountBalance() if applicable (transaction, transfer, LOAN)
  → if batchMode: reset form state (stay open)
  → else: close modal
  → onChange subscriptions update all React state automatically
```

**Batch mode behavior:**
- Toggle in top-right corner: `🔄 Batch`
- When ON: after submit, form resets to defaults, modal stays open
- When user manually closes (X / Escape / backdrop click), `batchMode` resets to OFF
- Toggle label changes to `🔁 Batch ON` (green highlight)

**Mode selector UI:**
- Top of modal: row of pill buttons
- Shows only relevant modes based on context
- When opened for an edit/settle, the mode pill is locked (disabled)

---

## 3. Loan Now Affects Account Balance

**Current behavior**: Loan create/settle only writes to `loans` store. Account balance never changes.

**New behavior**: Loan create generates transactions in both lender and borrower accounts (for inter-account loans) or just the lender account (for person loans). Loan settle generates repayment transactions in the lender account. This makes loans visible in the ledger and updates account `current_balance`.

| Action | Side Effect |
|--------|-------------|
| **Loan Create** (person) | `localDb.putTransaction({ account_id: lender.id, amount: -amount, category: 'Loan Given', particulars })` + `adjustAccountBalance(lender.id, -amount)` |
| **Loan Create** (inter-account) | `localDb.putTransaction({ account_id: lender.id, amount: -amount, category: 'Loan Given', particulars })` + `adjustAccountBalance(lender.id, -amount)`; `localDb.putTransaction({ account_id: borrower.id, amount: +amount, category: 'Loan Received', particulars })` + `adjustAccountBalance(borrower.id, +amount)` |
| **Loan Settle** (full) | `localDb.putTransaction({ account_id: lender.id, amount: +settleAmount, category: 'Loan Repayment', particulars })` + `adjustAccountBalance(lender.id, +settleAmount)` |
| **Loan Settle** (partial) | Same as full, but amount = partial settlement |

---

## 4. Files to Modify

### 4.1 `src/App.tsx`

| Change | Detail |
|--------|--------|
| Replace `isTransactionModalOpen` + `isTransferModalOpen` | Single `writeOperation` state |
| Remove `applyAccountDelta` and its wiring | `onChange('accounts')` handles this |
| Remove `onUpdate` passthrough to Ledger | No longer needed |
| Wire all modal triggers | `setWriteOperation(...)` calls |
| Render `<WriteModal>` | Conditionally at bottom, replaces both existing modals |

**Trigger wiring map:**

| Trigger Location | Current Action | New Action |
|---|---|---|
| Dashboard FAB "New Transaction" | `setIsTransactionModalOpen(true)` | `setWriteOperation({ type: 'transaction' })` |
| Dashboard FAB "Inter-Account Transfer" | `setIsTransferModalOpen(true)` | `setWriteOperation({ type: 'transfer' })` |
| AccountCard/Ledger "Add Transaction" | `setIsAdding(true)` → inline form | `setWriteOperation({ type: 'transaction', prefillAccountId: account.id })` |
| Ledger edit button | `setEditingTx(tx)` → inline form | `setWriteOperation({ type: 'transaction', prefillAccountId: ..., editTx: tx })` |
| LoanManager "New Loan" | Inline LoanForm | `setWriteOperation({ type: 'loan_create' })` |
| LoanManager "Edit" | Inline LoanForm (edit) | `setWriteOperation({ type: 'loan_edit', loan })` |
| LoanManager "Settle" | SettleModal | `setWriteOperation({ type: 'loan_settle', loan })` |
| InvestmentTracker "Add" | Inline create form | `setWriteOperation({ type: 'investment_create' })` |
| InvestmentDetail "Audit Yield" | Inline return form | `setWriteOperation({ type: 'investment_return', investment })` |

### 4.2 `src/hooks/useTransactions.ts`

| Change | Detail |
|--------|--------|
| Remove direct server API call | Delete lines 158-173 (POST/PATCH to `/api/transactions`) |
| Remove `isSyncing` state | No longer tracks server sync |
| Simplify `addOrUpdateTransaction` | Only writes to localDb + adjustAccountBalance |
| Simplify `deleteTransaction` | Only soft-deletes locally, no server DELETE |

### 4.3 `src/hooks/useLocalData.ts`

| Change | Detail |
|--------|--------|
| Remove `applyAccountDelta` | Delete function + export |

### 4.4 `src/components/Ledger.tsx`

| Change | Detail |
|--------|--------|
| Remove `TransactionForm` import | Replace with `setWriteOperation` prop or callback |
| Remove inline `isAdding` state | Open modal instead |
| `handleAddOrUpdateTransaction` | Replace with modal trigger |
| `openEdit(tx)` | Call `setWriteOperation({ type:'transaction', editTx: tx, prefillAccountId: account.id })` |
| Remove `handleAddOrUpdateTransaction` | No longer needed |

### 4.5 `src/components/Dashboard.tsx`

| Change | Detail |
|--------|--------|
| Replace `onOpenTransaction` + `onOpenTransfer` | Single `onWriteOperation` callback |

### 4.6 `src/components/LoanManager.tsx`

| Change | Detail |
|--------|--------|
| Remove `LoanForm` inline form + `AnimatePresence` wrapper | Replace with modal trigger |
| Remove `SettleModal` + `GroupSettleModal` | Replace with `{type:'loan_settle', loan}` |
| `handleCreate` | Replace with `setWriteOperation({ type: 'loan_create' })` |
| `openEdit(loan)` | Replace with `setWriteOperation({ type: 'loan_edit', loan })` |
| `handleSettleOpen(loan)` | Replace with `setWriteOperation({ type: 'loan_settle', loan })` |
| Keep `handleDelete` | Stays as-is |
| Remove `handleCreate`, `handleUpdate`, `handleSettleSubmit` | Logic moves to WriteModal |

### 4.7 `src/components/InvestmentTracker.tsx`

| Change | Detail |
|--------|--------|
| Remove inline create form + `AnimatePresence` | Replace with `setWriteOperation({ type: 'investment_create' })` |
| Remove `handleCreateInv` | Logic moves to WriteModal |

### 4.8 `src/components/InvestmentDetail.tsx`

| Change | Detail |
|--------|--------|
| Remove inline return form | Replace with `setWriteOperation({ type:'investment_return', investment })` |
| Remove direct server API call | Delete the `authService.apiFetch(POST /api/investments/...)` |
| Remove `handleAddReturn` | Logic moves to WriteModal |

---

## 5. Files to Delete

| File | LOC | Reason |
|------|-----|--------|
| `src/components/TransactionModal.tsx` | 224 | Replaced by WriteModal (transaction mode) |
| `src/components/TransferModal.tsx` | 233 | Replaced by WriteModal (transfer mode) |
| `src/components/TransactionForm.tsx` | 148 | Replaced by WriteModal (transaction mode) |
| `src/components/LoanForm.tsx` | 171 | Replaced by WriteModalForms (loan modes) |
| `src/components/SettleModal.tsx` | 82 | Replaced by WriteModal (loan_settle mode) |
| `src/components/GroupSettleModal.tsx` | 108 | Replaced by WriteModal (loan_settle mode) |

**Total deleted: ~966 LOC**

---

## 6. Mode-by-Mode Submit Logic

### Transaction Mode
```
→ localDb.putTransaction(record)
→ localDb.adjustAccountBalance(targetAccount.id, amount)
```

### Transfer Mode
```
→ 2x localDb.putTransaction (credit + debit, linked)
→ localDb.adjustAccountBalance(source, -amount)
→ localDb.adjustAccountBalance(dest, +amount)
```

### Loan Create Mode

Person loan:
```
→ localDb.putLoan(record)
→ localDb.putTransaction({ account_id: lender.id, amount: -amount, category: 'Loan Given', particulars })
→ localDb.adjustAccountBalance(lender.id, -amount)
```

Inter-account loan:
```
→ localDb.putLoan(record)
→ localDb.putTransaction({ account_id: lender.id, amount: -amount, category: 'Loan Given', particulars })
→ localDb.adjustAccountBalance(lender.id, -amount)
→ localDb.putTransaction({ account_id: borrower.id, amount: +amount, category: 'Loan Received', particulars })
→ localDb.adjustAccountBalance(borrower.id, +amount)
```

### Loan Edit Mode
Skip side effects — only update loan metadata (particulars, due_date, interest_rate).

### Loan Settle Mode
```
→ localDb.putLoan({ ...existing, remaining: newRemaining, status, settled_date })
→ localDb.putTransaction({ account_id: lender.id, amount: +settleAmount, category: 'Loan Repayment', particulars })  [NEW]
→ localDb.adjustAccountBalance(lender.id, +settleAmount)  [NEW]
```

### Investment Create Mode
```
→ localDb.putInvestment(record)
```

### Investment Return Mode
```
→ localDb.putInvestmentReturn(record)
```

---

## 7. Implementation Order

| Step | Files | What | Bug Fixed |
|------|-------|------|-----------|
| 1 | `src/components/WriteModalForms.tsx` | Create all form components with loan account-balance side effects | — |
| 2 | `src/components/WriteModal.tsx` | Create modal shell + routing logic | — |
| 3 | `src/App.tsx` | Wire single `writeOperation` state, remove old modals + `applyAccountDelta` | Bug #1 |
| 4 | `src/hooks/useTransactions.ts` | Remove direct server API | Bug #2 |
| 5 | `src/hooks/useLocalData.ts` | Remove `applyAccountDelta` export + **delete balance recompute block (lines 162-177)** | Bug #1 + Bug #3 |
| 6 | `src/services/syncEngine.ts` | **Remove `'accounts'` from `SYNC_TABLES`** | Bug #4 |
| 7 | `src/components/Ledger.tsx` | Replace inline form with modal | — |
| 8 | `src/components/LoanManager.tsx` | Replace inline forms/modals with modal | — |
| 9 | `src/components/InvestmentTracker.tsx` | Replace inline form with modal | — |
| 10 | `src/components/InvestmentDetail.tsx` | Replace inline return form + server API | — |
| 11 | `api/routes/sync.ts` | **Add `client_id` dedup in push handler** | Bug #5 |
| 12 | `src/components/Dashboard.tsx` | Wire to modal | — |
| 13 | Delete 6 files | Remove old components | — |
| 14 | `npx tsc --noEmit` | TypeScript check | — |
| 15 | `npm run build` | Build verification | — |

---

## 8. Verification

1. `npx tsc --noEmit` — zero errors
2. `npm run build` — production build succeeds
3. Manual test: Create transaction → Dashboard reflects new balance immediately
4. Manual test: Create transfer → both accounts update
5. Manual test: **Create loan → lender account balance decreases, transaction appears in ledger** [NEW]
6. Manual test: **Settle loan → lender account balance increases** [NEW]
7. Manual test: Batch toggle on → submit 3 transactions without closing
8. Manual test: Edit transaction from Ledger → opens modal pre-filled
9. Manual test: Offline → write succeeds, syncs when online
10. `npx gitnexus detect_changes` — verifies only expected flows affected

---

## 9. Additional Bug Fixes (Beyond the Modal)

The unified modal fixes bugs **#1** (applyAccountDelta double-apply) and **#2** (direct server API in useTransactions). Three remaining data-flow bugs need separate fixes:

### 9.1 Bug #3 — Remove Balance Recompute in `fetchData()`

**File**: `src/hooks/useLocalData.ts:162-177`

**Problem**: `fetchData()` recomputes ALL account balances from scratch (`initial_balance + sum of all transactions`) every 30s. This overwrites whatever `adjustAccountBalance` set. If a transaction is pending (not yet pushed to server), the recompute still includes it. After sync pushes it, the server's `current_balance` reflects the server state, but the local recompute includes locally-deleted or locally-orphaned records — causing drift.

**Fix**: Delete the recompute block entirely. Trust the server's `current_balance` from the API response for synced accounts. For accounts with local pending changes, the `onChange('accounts')` subscription handles live updates.

Change in `fetchData()`:
```
// DELETE lines 162-177 — remove the entire recomputeAccounts block
// Server current_balance flows through the normal upsert at line 124-156
```

### 9.2 Bug #4 — Stop Sync Engine from Pushing Accounts

**File**: `src/services/localDb.ts:296`

**Problem**: `adjustAccountBalance` sets `account.sync_status = 'pending'` (line 296). The sync engine's `pushUnsynced()` collects all pending accounts and pushes them to the server. But account balances are **derived data** — they should be computed by the server from transaction sums, not pushed directly. Pushing account balances creates a race where the server gets a balance update before it has the corresponding transactions.

**Fix**: Either:
- Option A: Don't set `sync_status = 'pending'` in `adjustAccountBalance` (remove line 296), AND filter out accounts from the sync engine's push list.
- Option B: Remove accounts from `SYNC_TABLES` in `syncEngine.ts`.

**Recommended**: Option B is simpler. Remove `'accounts'` from the `SYNC_TABLES` array in `syncEngine.ts` line 4-8.

### 9.3 Bug #5 — Add Idempotency to Sync Push

**File**: `src/services/syncEngine.ts:81-124`

**Problem**: If `pushUnsynced()` runs concurrently (unlikely with the `_isSyncing` guard, but possible on retries), or if `useTransactions.addOrUpdateTransaction` previously POSTed the same record to `/api/transactions`, the server receives duplicate data.

**Fix**: Add a `client_id` dedup check to the sync push. The server already stores `client_id` on records. The push endpoint should skip records where `client_id` already exists on the server. This is a server-side fix in `api/routes/sync.ts`.

---

## 10. Bug-to-Fix Mapping

| Bug | Description | Fix Location | Fixed By |
|-----|-------------|-------------|----------|
| #1 | `applyAccountDelta` double-apply | `App.tsx`, `useLocalData.ts` | Unified Modal (remove `applyAccountDelta`) |
| #2 | Direct server API in useTransactions | `useTransactions.ts:158-173` | Unified Modal (remove direct POST) |
| #3 | `fetchData` recompute overwrites balance | `useLocalData.ts:162-177` | **Additional fix: delete recompute block** |
| #4 | Sync engine pushes account balances | `localDb.ts:296`, `syncEngine.ts` | **Additional fix: remove accounts from SYNC_TABLES** |
| #5 | No idempotency in sync push | `api/routes/sync.ts` | **Additional fix: add client_id dedup** |

---

## 11. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| WriteModal becomes too large | Split into WriteModal.tsx (shell) + WriteModalForms.tsx (form sections) |
| Batch mode introduces stale state | Reset form completely after each submit in batch mode |
| Loan manager losing grouped view of inline forms | The modal opens on top — user returns to same LoanManager view after close |
| Missing edge case in transaction edit (linked transfers etc.) | Test with real data before merging |
| Loan → transaction side effect creates orphan records if loan save fails | Wrap in same try/catch, use `Promise.all` |
