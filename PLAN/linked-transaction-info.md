# Plan: Show Linked Transaction Info in Ledger

## Problem
When a transaction is connected to a loan or transfer, the ledger shows only a raw `Linked: #123` ID (desktop) or nothing at all (mobile). Users can't tell what the connection is or navigate to it.

## Goal
When expanding a transaction in the ledger, show a meaningful linked-info badge indicating the connection type (Transfer / Loan / Settlement), the linked account name, amount, and a button to navigate to that account's ledger.

---

## Steps

### Step 1 — Backend: Extend `getTransactions()`
**File**: `api/db/transactions.ts`

Currently fetches `id, account_id, accounts(name)` for linked transactions. Add `amount` to the select and return `linked_amount` alongside `linked_account_name`.

### Step 2 — Frontend type update
**File**: `src/types.ts`

- Add `linked_account_name?: string` and `linked_amount?: number` to `Transaction`
- Expand `type` to `'normal' | 'transfer' | 'loan' | 'loan_settle'`

### Step 3 — New component: `LinkedInfo.tsx`
**File**: `src/components/LinkedInfo.tsx`

A small inline section shown when a transaction is expanded and has a link. Shows:
- Badge indicating type (Transfer / Loan / Settlement) with appropriate icon
- Linked account name
- Linked amount (colored debit/credit)
- "Go to account" button that navigates to the linked account's ledger

### Step 4 — Update `TransactionRow.tsx`
Replace the raw `Linked: #{tx.linked_transaction_id}` with the new `LinkedInfo` component.

### Step 5 — Update `TransactionCard.tsx`
Add `LinkedInfo` to the expanded mobile view (currently missing entirely).

### Step 6 — Update `Ledger.tsx`
Pass `accounts` and `onSelectAccount` callback down to `TransactionRow` and `TransactionCard` so the "Go to account" button works.

---

## Files Changed
| File | Change |
|------|--------|
| `api/db/transactions.ts` | Add `amount` to linked tx select, return `linked_amount` |
| `src/types.ts` | Add fields, expand `type` union |
| `src/components/LinkedInfo.tsx` | **New** — linked transaction badge component |
| `src/components/TransactionRow.tsx` | Replace raw linked ID with `LinkedInfo` |
| `src/components/TransactionCard.tsx` | Add `LinkedInfo` to expanded view |
| `src/components/Ledger.tsx` | Pass `accounts` + `onSelectAccount` to row/card |

## LOC Estimate
~60 lines added, ~10 removed. All files stay under 300 LOC.
