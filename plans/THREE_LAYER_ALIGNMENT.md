# Plan: Three-Layer Alignment (Supabase → IndexedDB → App Types)

> **Date**: 4 June 2026
> **Branch**: `feat/unified-write-modal`
> **Risk**: HIGH — touches sync engine, localDb types, shared types, app types, server push/pull
> **Estimate**: ~6 phases, ~18 tasks

---

## Motivation

The 17 mismatches found in the schema alignment audit prove that the three layers (Supabase PostgreSQL, IndexedDB/localDb, and TypeScript app types) have drifted significantly. This causes:

1. **Sync silently failing** — local-only fields (`sync_status`, `_deleted`, `server_id`) leak into push payloads; server ignores or errors
2. **Soft-delete broken** — client uses `_deleted` boolean, server uses `deleted_at` timestamp; deletes never propagate
3. **Type coercion bugs** — `member_id` stored as string in localDb but number on server, `account_id` converted back-and-forth
4. **Missing types** — Budgets, RecurringTransactions, LoanSettlements have no app-level TypeScript types
5. **Stuck pending count** — accounts marked pending but never pushed

---

## Phase 0 — Supabase Schema Audit & Fix

**Goal**: Ensure Supabase tables match what the local-first architecture plan describes.

| # | Task | Detail | Location |
|---|------|--------|----------|
| 0.1 | Verify all 10 tables have `client_id UUID UNIQUE` + `updated_at TIMESTAMPTZ` | Run in Supabase SQL Editor | migration `015_add_uuid_sync_fields.sql` |
| 0.2 | Add `deleted_at TIMESTAMPTZ` to `members`, `investments`, `investment_returns`, `budgets`, `recurring_transactions` | Currently only on 3 tables | SQL migration |
| 0.3 | Add `user_id UUID` to `investment_returns` table | Missing — not in any migration | SQL ALTER TABLE |
| 0.4 | Verify `sync_log` table exists with correct schema | Created in migration 015 | SQL SELECT |
| 0.5 | Run a diagnostic query to find records with `client_id IS NULL` | These were created before sync fields were added | SQL SELECT |

## Phase 1 — Canonical Schema Definition

**Goal**: Create a single source of truth that all three layers align to.

| # | Task | Detail | Files |
|---|------|--------|-------|
| 1.1 | Create `shared/schema.ts` | Central field map per entity — the canonical definition. Every column, its type, whether it's sent to server, whether it's stored locally | `shared/schema.ts` (new) |
| 1.2 | Regenerate `shared/types.ts` | Generate from `schema.ts` — shared server-client types with correct optional/nullable annotations | `shared/types.ts` |
| 1.3 | Regenerate `src/types.ts` | App-specific types (computed/joined fields like `member_name`, `current_balance`), matching the canonical schema | `src/types.ts` |
| 1.4 | Regenerate localDb types | `LocalMember`, `LocalAccount`, `LocalTransaction`, etc. aligned to canonical schema | `src/services/localDb.ts` |

### Canonical Field Rules

Every entity across all layers must agree on:

```
Server (PostgreSQL):
  id            BIGSERIAL PRIMARY KEY      (server auto-increment)
  client_id     UUID UNIQUE                 (correlation key, set by client)
  user_id       UUID NOT NULL               (RLS owner)
  ...domain fields...                       (names, amounts, dates, etc.)
  updated_at    TIMESTAMPTZ DEFAULT now()   (LWW conflict resolution)
  deleted_at    TIMESTAMPTZ                 (soft-delete timestamp, NULL = not deleted)
  
IndexedDB (localDb):
  id            string (UUID)               (primary key = client_id on server)
  server_id     number | null               (server's BIGSERIAL id, null until first sync)
  ...domain fields...                       (same names+types as server, with local UUIDs for FKs)
  updated_at    string (ISO 8601)           (mirrors server updated_at)
  sync_status   'pending' | 'synced' | 'conflict'  (local-only, NEVER sent to server)
  _deleted      boolean                     (local-only, maps to server deleted_at; NEVER sent to server)
```

### Field Mapping Rules

| Local Db Field | Server Field | Direction | Notes |
|---------------|-------------|-----------|-------|
| `id` (UUID) | `client_id` (UUID) | Both | Correlation key. Client generates UUID, sends as `client_id`. Server stores it. On pull, `client_id` → `id`. |
| `server_id` (number) | `id` (BIGSERIAL) | Pull only | Server's PK. Pull sets it. NEVER pushed. |
| `sync_status` | — | Local only | NEVER sent to server |
| `_deleted` (boolean) | `deleted_at` (timestamp) | Both | Push: if `_deleted=true`, send as `deleted_at=now()`. Pull: if `deleted_at IS NOT NULL`, store as `_deleted=true`. |
| `updated_at` | `updated_at` | Both | LWW timestamp |

## Phase 2 — Fix Sync Engine Push (CRITICAL)

**Goal**: Stop leaking local-only fields to the server, handle soft-delete properly.

| # | Task | Detail | Files |
|---|------|--------|-------|
| 2.1 | Strip local-only fields before push | In `pushUnsynced()`, delete `sync_status`, `_deleted`, `server_id` from each record before sending. Keep `id` mapped as `client_id`. | `src/services/syncEngine.ts:pushUnsynced` |
| 2.2 | Map `_deleted` → `deleted_at` on push | If `_deleted=true`, send `deleted_at: new Date().toISOString()` in the payload instead of `_deleted`. | `src/services/syncEngine.ts:pushUnsynced` |
| 2.3 | Handle `deleted_at` on pull | In `pullChanges()`, if server returns `deleted_at` as non-null, store locally as `_deleted: true`. | `src/services/syncEngine.ts:pullChanges` |
| 2.4 | Include deleted records in unsynced collection | `getUnsyncedForTable()` currently filters out `_deleted` records. Change to include them so server learns of deletions. | `src/services/localDb.ts:getUnsynced` |
| 2.5 | Strip local fields on server side too | In `api/routes/sync.ts:62`, also strip `sync_status`, `_deleted`, `server_id` from incoming records (defense in depth). | `api/routes/sync.ts` |

### Push Payload Transformation

```
Before (broken):
  { id: "uuid", client_id: "uuid", sync_status: "pending", _deleted: false, server_id: null, name: "Cash", ... }
                                                                       ↑ junk, gets sent to Supabase

After (fixed):
  { client_id: "uuid", updated_at: "...", name: "Cash", ... }
    ↑ only server columns
  Plus if _deleted=true: { ..., deleted_at: "2026-..." }
```

## Phase 3 — Fix Type Coercions

**Goal**: Ensure FK fields (`member_id`, `account_id`, `parent_id`, `linked_transaction_id`) have consistent types across all layers.

| # | Task | Detail | Files |
|---|------|--------|-------|
| 3.1 | Fix `member_id` / `parent_id` in `fetchData` | Server returns `number`, localDb stores as `string`. Add `Number()` conversion when reading from server, store as `number` in localDb. | `src/hooks/useLocalData.ts:123-124,139-140` |
| 3.2 | Fix `LocalAccount` types | Change `member_id` and `parent_id` to `number \| null` instead of `string \| null`. | `src/services/localDb.ts:25-26` |
| 3.3 | Fix `account_id` FK chain | `useTransactions.ts` converts local UUID → server number via `accountIdMap`. Ensure the reverse mapping (server → local on pull) is lossless. | `src/services/syncEngine.ts:149-154` |
| 3.4 | Add missing app types | Add `LoanSettlement`, `Budget`, `RecurringTransaction`, `Group` interfaces to `src/types.ts`. | `src/types.ts` |
| 3.5 | Fix `type` unions | `LocalAccount.type` should be `'cash'\|'bank'\|'mobile'\|'investment'\|'purpose'\|'home_exp'\|'group'` instead of `string`. Same for `LocalLoan.status`, `LocalTransaction.type`. | `src/services/localDb.ts` |
| 3.6 | Fix `linked_transaction_id` | Store as `number \| null` in localDb (matches server). Convert in/out of sync. | `src/services/localDb.ts:41` |
| 3.7 | Add query helpers for type-safe reads | Add `getAccountById()`, `getTransactionById()` etc. that return typed results instead of `Record<string, unknown>`. | `src/services/localDb.ts` |

## Phase 4 — Align IndexedDB Schema

**Goal**: IndexedDB stores match the canonical schema exactly.

| # | Task | Detail | Files |
|---|------|--------|-------|
| 4.1 | Add `currency` to `LocalAccount` | Server has `currency TEXT DEFAULT 'USD'` from migration 013. Add to local type. | `src/services/localDb.ts:21-31` |
| 4.2 | Expand `LocalTransaction.type` union | Add `'loan'` and `'loan_settle'` to the union (server allows these). | `src/services/localDb.ts:40` |
| 4.3 | Add `lender_name`, `borrower_account_name` to `LocalLoan` | These are display fields returned by server on pull. | `src/services/localDb.ts:45-58` |
| 4.4 | Add `created_at` to `LocalBudget` and `LocalRecurringTransaction` | Server has these, local should store them for pull data. | `src/services/localDb.ts:102-118` |
| 4.5 | Add `transaction_id` to `LocalLoanSettlement` | Server has this column (migration 006). | `src/services/localDb.ts:60-67` |
| 4.6 | Add `remaining` to `LocalLoan` if missing | Server has `remaining REAL DEFAULT 0`. | `src/services/localDb.ts:45-58` |
| 4.7 | Ensure IndexedDB indexes exist | Each store should have indexes on all queryable fields: `sync_status`, `_deleted`, FK fields, `date`, `category`, etc. | `src/services/localDb.ts` (schema init) |

## Phase 5 — Clean Up Stale Data

**Goal**: Fix any data stuck in a bad state from the misalignment.

| # | Task | Detail | Files |
|---|------|--------|-------|
| 5.1 | Reset any pending accounts to synced | Already implemented in `resetStaleAccountPending()`. Keep. | `src/services/syncEngine.ts:429-439` |
| 5.2 | Add startup migration check | On app load, if localDb version has changed, run data migrations (e.g., convert old pending accounts). | `src/services/localDb.ts:init` |
| 5.3 | Log schema version mismatch | If localDb schema differs from expected, log a warning for debugging. | `src/services/localDb.ts` |

## Phase 6 — Verification

| # | Task | Detail |
|---|------|--------|
| 6.1 | `npx tsc --noEmit` | Zero TypeScript errors |
| 6.2 | `npm run build` | Production build succeeds |
| 6.3 | `gitnexus analyze` + `gitnexus detect_changes` | Verify only expected symbols affected |
| 6.4 | Manual: create transaction → syncs → "0 pending" | Confirm push works end-to-end |
| 6.5 | Manual: delete transaction → server learns of deletion | Confirm soft-delete propagation |
| 6.6 | Manual: offline → create data → online → syncs | Confirm offline queue works |
| 6.7 | Manual: pull changes from server → local updates correctly | Confirm pull works end-to-end |
| 6.8 | Check server logs for column-not-found errors | Confirm no more junk fields in push payload |

---

## Implementation Order

```
Phase 0: Supabase Schema Fixes (run SQL in dashboard)
    ↓
Phase 1: Canonical Schema (shared/schema.ts + regenerate types)
    ↓
Phase 2: Sync Engine Push Fix (CRITICAL — fixes the broken push)
    ↓
Phase 3: Type Coercions (member_id, account_id, etc.)
    ↓
Phase 4: IndexedDB Schema Alignment
    ↓
Phase 5: Stale Data Cleanup
    ↓
Phase 6: Verification
```

## File Change Summary

| File | Change |
|------|--------|
| `shared/schema.ts` | **New** — canonical field definitions |
| `shared/types.ts` | Regenerate from schema.ts |
| `src/types.ts` | Add missing types, align existing |
| `src/services/localDb.ts` | Align all types, fix type unions, add indexes |
| `src/services/syncEngine.ts` | Strip local-only fields in push, handle deleted_at |
| `api/routes/sync.ts` | Defense-in-depth field stripping |
| `src/hooks/useLocalData.ts` | Fix member_id/parent_id coercion |
| `src/hooks/useTransactions.ts` | Fix account_id mapping |
| `.env` | Already set up with DATABASE_URL + JWT_SECRET |
| Various SQL migrations | Add missing columns |
