# Completed Plans

> Consolidated record of all implemented plans in the FinTrack Pro project.
> Each entry documents what was planned, what was built, and where the implementation lives.

---

## Table of Contents

1. [Sidebar Logo Rebrand](#1-sidebar-logo-rebrand) — 2026-05-30
2. [Animation Changes](#2-animation-changes) — 2026-06
3. [Mobile Navigation Redesign](#3-mobile-navigation-redesign) — 2026-06-03
4. [Offline Mode Implementation](#4-offline-mode-implementation) — 2026-06
5. [Local-First Architecture](#5-local-first-architecture) — 2026-06-03
6. [Phase 22 Security Audit](#6-phase-22-security-audit) — 2026-06
7. [Grouped Loan Cards](#7-grouped-loan-cards) — 2026-06
8. [Linked Transaction Info in Ledger](#8-linked-transaction-info-in-ledger) — 2026-06
9. [Unified Write Modal](#9-unified-write-modal) — 2026-06-04
10. [Sync Improvements](#10-sync-improvements) — 2026-06-04
11. [Three-Layer Alignment](#11-three-layer-alignment) — 2026-06-04

---

## 1. Sidebar Logo Rebrand

**Date:** 2026-05-30
**Status:** Completed

### Goal
Replace the old sidebar brand header (generic `Wallet` lucide icon + "FinTrack / Institutional" text) with a custom FinTrack Pro logo matching the app's financial branding.

### Implementation

| File | Change |
|------|--------|
| `src/components/layout/Sidebar.tsx` | Replaced brand header with inline SVG icon + "FinTrack Pro" wordmark |
| `src/index.css` | Added Roboto Slab font from Google Fonts |

### Final Design
- Square icon with white rounded rect background, three navy bars, green trend dots/line
- "FinTrack" in Roboto Slab bold, `#0a0b0d` (ink)
- "Pro" in Roboto Slab normal, `#34d399` (green accent)
- No gap between icon and text
- Clicking the logo reloads the app

### Notes
- The `public/fintrack_pro_sidebarlogo.svg` file remains untracked (not used in final implementation)
- Old `Wallet` import removed from Sidebar.tsx

---

## 2. Animation Changes

**Date:** 2026-06
**Status:** Completed (Phase 7)

### Goal
Remove all "bounce" (scale-on-click) effects and replace entry/exit animations with clean slide-in/slide-out.

### Part 1: Remove Bounce Effects

| File | Change |
|------|--------|
| `src/index.css` | Remove `:where(button):active { scale: 0.96 }` |
| `src/index.css` | Remove `active:scale-[0.96]` from `.btn-pill`, `.btn-primary`, `.btn-secondary` |
| `src/components/FloatingActionButton.tsx` | Remove `active:scale-95` |
| `src/components/layout/Sidebar.tsx` | Remove `whileTap={{ scale: 0.97 }}` |

### Part 2: Replace Entry/Exit Animations with Slide

| File | Change |
|------|--------|
| `TransactionModal.tsx` | `y:20, scale:0.97` → `y:40` |
| `TransferModal.tsx` | `y:20, scale:0.97` → `y:40` |
| `RenameModal.tsx` | `scale:0.95, y:10` → `y:20` |
| `Toast.tsx` | `y:20, scale:0.95` → `x:100` (slide from right) |
| `AccountManager.tsx` | `scale:0.95` → `y:12` |
| `GroupManager.tsx` | `opacity only` → `opacity + y:12` |
| `FloatingActionButton.tsx` | `scale:0.8` → remove scale |
| `Dashboard.tsx` | `scale:0.97` → `y:-8` |
| `App.tsx` | `y:10` → `y:20` |

### Verification
- All 14 items completed and verified
- Build verification passed

---

## 3. Mobile Navigation Redesign

**Date:** 2026-06-03
**Status:** Completed (Phase 12 + Phase 12b fixes)

### Goal
Redesign the mobile navigation from a slide-in sidebar drawer to a glassmorphic bottom tab bar with 5 icon-only buttons. The center `+` button morphs between an in-nav position and a floating FAB on the Ledger page. A bottom sheet "More" menu holds the remaining 6 items. The nav auto-hides on scroll-down and reappears on scroll-up.

### Industry Standards Applied
- **Apple HIG** — Tab Bars, Bottom Sheets, Visual Effects
- **Material Design 3** — Navigation Bar, Bottom Sheets, FAB
- **WCAG 2.1** — Target size, motion preferences

### Architecture

**New Files:**

| File | Purpose |
|------|---------|
| `src/hooks/useScrollDirection.ts` | Scroll direction detection hook (RAF-throttled) |
| `src/components/layout/BottomNav.tsx` | Glassmorphic bottom tab bar |
| `src/components/layout/MoreMenu.tsx` | Bottom sheet with remaining nav items |

**Modified Files:**

| File | Changes |
|------|---------|
| `src/App.tsx` | Import/render `BottomNav`, attach scroll ref, add `pb-20 md:pb-0`, remove old FAB wrapper |
| `src/index.css` | Add `.glass-nav` utility class for glassmorphic styling |
| `src/components/FloatingActionButton.tsx` | Deleted (replaced by `+` button in `BottomNav`) |
| `src/components/layout/Header.tsx` | Replaced hamburger with profile avatar on mobile |

### Post-Implementation Fixes (Phase 12b)

| Fix | Issue | Solution |
|-----|-------|----------|
| A | Scroll auto-hide not working | Changed `min-h-[100dvh]` to `h-[100dvh]` on mobile |
| B | FAB overlapped bottom nav | Moved FAB to `bottom-24 right-6` |
| C | Sidebar on mobile redundant | Added `hidden md:block` to Sidebar; profile moved to Header |

### Performance Budget Achieved
- First Contentful Paint: No regression
- Cumulative Layout Shift: 0
- Interaction to Next Paint: < 50ms
- Animation frame rate: 60fps

---

## 4. Offline Mode Implementation

**Date:** 2026-06
**Status:** Completed (Phase 21)

### Goal
Complete offline mode with full CRUD support, background sync, and reactive sync status feedback.

### Phases Implemented

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Cache API routes in Service Worker | Done |
| Phase 1 | Upgrade offline queue to IndexedDB + Background Sync API | Done |
| Phase 2 | Cover all mutation gaps (delete, update offline) | Done |
| Phase 3 | Reactive sync state + toast system | Done |
| Phase 4 | UI improvements (pending count, last sync, offline fallback) | Done |
| Phase 5 | Data freshness & conflict resolution | Done |

### Key Files Changed

| File | Changes |
|------|---------|
| `sw.ts` | API route caching, SW sync handler, offline fallback |
| `public/offline.html` | New — offline fallback page |
| `src/services/offlineService.ts` | IndexedDB queue, background sync, reactive sync state, retries |
| `src/services/cacheService.ts` | Offline-aware TTL |
| `src/components/OfflineIndicator.tsx` | Pending count, last sync timestamp |
| `src/components/Ledger.tsx` | Offline delete coverage |
| `src/App.tsx` | Enhanced sync-on-reconnect with toast and state updates |

### Design Decisions
1. **IndexedDB over localStorage** — larger capacity, structured data, survives storage pressure
2. **Background Sync API as enhancement** — falls back to `online` event listener
3. **Stale-while-revalidate for API GETs** — fast offline reads from cache
4. **Optimistic UI everywhere** — mutations apply locally first, then sync
5. **Drop vs. retry** — server errors (500+) retry; client errors (4xx) dropped

---

## 5. Local-First Architecture

**Date:** 2026-06-03
**Status:** Completed

### Goal
Transform FinTrack-Pro from a server-first (Supabase-dependent) app to a local-first app with optional cloud backups.

### Core Principles
- **Instant performance** — All reads/writes hit IndexedDB (~1-5ms) instead of Supabase (~200-500ms)
- **No signup barrier** — Guest users can use the full app without creating an account
- **Offline-first** — Every feature works without internet
- **Optional cloud backup** — Supabase is a backup layer, not a requirement

### Architecture

```
UI Layer (React) — renders instantly from IndexedDB
    ↓
IndexedDB (Primary Store) — all entities
    ↓ background sync (if authenticated)
Sync Engine (Background) — push unsynced → pull changes → merge
    ↓
Supabase (Optional Cloud Backup) — Auth + PostgreSQL + RLS
```

### IndexedDB Schema
- Database: `fintrack_local` (v1)
- Stores: members, accounts, transactions, loans, loan_settlements, investments, investment_returns, groups, budgets, recurring_transactions, metadata, sync_log

### Auth System Built
- Signup with email/password
- Login with email/password
- Password reset via email
- Guest mode (no account required)
- Signup nudge after N transactions
- Guest → registered data migration

### Phases Implemented

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 1 | Auth System (Signup + Password Reset) | Done |
| Phase 2 | Local-First IndexedDB Core | Done |
| Phase 3 | Component Write Path Migration | Done |
| Phase 4 | Guest Mode + Signup Nudge | Done |
| Phase 5 | Supabase Sync Engine | Done |
| Phase 6 | Data Backup (Google Drive + JSON) | Done |
| Phase 7 | Animations & Polish | Done |

### Acceptance Criteria
- All 22 acceptance criteria met
- App renders instantly from IndexedDB
- All writes complete in <10ms
- Guest mode works without API calls
- Sync engine pushes/pulls in background
- Multi-device sync with last-write-wins

---

## 6. Phase 22 Security Audit

**Date:** 2026-06
**Status:** Completed (9/9 tasks)

### Branch
`fix/security-audit`

### Tasks Completed

| ID | Task | Priority | Status |
|----|------|----------|--------|
| T-300 | Add `helmet` middleware for security headers | HIGH | Done |
| T-301 | Fix `investment_returns` queries — add `userId` filter | HIGH | Done |
| T-302 | Fix search route Supabase `.or()` injection | HIGH | Done |
| T-303 | Add Zod validation schemas for budgets and recurring_transactions | HIGH | Done |
| T-304 | Remove `/api/auth/config` endpoint | HIGH | Done |
| T-305 | Add rate limiting to `/api/auth/session` | MEDIUM | Done |
| T-306 | Add CSRF token validation for state-changing requests | MEDIUM | Done |
| T-307 | Fix cookie `Secure` flag — use `localhost` check | MEDIUM | Done |
| T-308 | Add user_id ownership check for investment_returns route | MEDIUM | Done |

### Key Changes
- `api/index.ts` — Added helmet, CSRF middleware, rate limiting
- `api/db/*.ts` — Added userId filtering to investment_returns queries
- `shared/validation.ts` — Added Zod schemas for budgets and recurring
- `api/middleware/auth.ts` — Cookie Secure flag fix, CSRF validation

---

## 7. Grouped Loan Cards

**Date:** 2026-06
**Status:** Completed

### Goal
Group loans by counterparty into expandable cards with merged balance and group-level settlement. All frontend-only — no backend changes.

### Grouping Modes (Toggle Pills)
- **By Pair** — `lender_account_id` + `borrower_identifier` (e.g., "Savings → John")
- **By Borrower** — `borrower_identifier` only (all loans to John in one card)

### Card Layout
- **Collapsed**: borrower name, lender (pair mode), total lent, total outstanding, loan count, latest date, status badge, Settle Group button
- **Expanded**: mini table with same columns/actions as current, individual Settle still present
- **Status**: "Active" if any active loans; "All Settled" if all settled

### Group-Level Settle Flow
1. "Settle Group" button on card opens modal
2. Modal lists all active loans in group
3. User picks one loan + enters settle amount
4. Recorded against that loan (existing backend endpoint)

### Files Changed

| File | Lines | What |
|------|-------|------|
| `LoanGroupCard.tsx` | ~200 | New — card header + expandable mini table |
| `LoanForm.tsx` | ~200 | New — extracted create/edit form |
| `LoanManager.tsx` | ~380 | Rewritten — state, grouping logic, toggle, orchestration |

### Unchanged
- All API endpoints, data layer, DB schema
- Individual loan CRUD (create/edit/delete/settle)
- Settle modal for individual loans
- Mobile responsive behavior

---

## 8. Linked Transaction Info in Ledger

**Date:** 2026-06
**Status:** Completed

### Problem
When a transaction is connected to a loan or transfer, the ledger showed only a raw `Linked: #123` ID (desktop) or nothing at all (mobile). Users couldn't tell what the connection was or navigate to it.

### Solution
When expanding a transaction in the ledger, show a meaningful linked-info badge indicating the connection type (Transfer / Loan / Settlement), the linked account name, amount, and a button to navigate to that account's ledger.

### Steps Implemented

| Step | File | Change |
|------|------|--------|
| 1 | `api/db/transactions.ts` | Add `amount` to linked tx select, return `linked_amount` |
| 2 | `src/types.ts` | Add `linked_account_name`, `linked_amount`, expand `type` union |
| 3 | `src/components/LinkedInfo.tsx` | New — linked transaction badge component |
| 4 | `src/components/TransactionRow.tsx` | Replace raw linked ID with `LinkedInfo` |
| 5 | `src/components/TransactionCard.tsx` | Add `LinkedInfo` to expanded view |
| 6 | `src/components/Ledger.tsx` | Pass `accounts` + `onSelectAccount` to row/card |

### LOC
~60 lines added, ~10 removed. All files under 300 LOC.

---

## 9. Unified Write Modal

**Date:** 2026-06-04
**Status:** Completed

### Problem
Five independent write paths created transactions/loans/investments, and 3 competing balance computation approaches caused Dashboard/Ledger mismatch. The loan module did not affect account balances.

### Solution
Replaced all write modals and inline forms with one unified `WriteModal` that handles every write operation. All writes go to `localDb` only — no direct server API calls. Loan writes now generate corresponding transactions in linked accounts.

### Architecture

**New Files:**
- `src/components/WriteModalForms.tsx` (~300 LOC) — Pure form components for each mode
- `src/components/WriteModal.tsx` (~350 LOC) — Shell: portal, backdrop, animations, mode selector, submit handler

**Write Operation Types:**
```ts
type WriteOperation =
  | { type: 'transaction'; prefillAccountId?: number; editTx?: Transaction }
  | { type: 'transfer' }
  | { type: 'loan_create' }
  | { type: 'loan_edit'; loan: Loan }
  | { type: 'loan_settle'; loan: Loan }
  | { type: 'investment_create' }
  | { type: 'investment_return'; investment: Investment; investmentId?: number }
```

### Loan Now Affects Account Balance

| Action | Side Effect |
|--------|-------------|
| **Loan Create** (person) | Transaction in lender account: `-amount`, category "Loan Given" |
| **Loan Create** (inter-account) | Two transactions: lender `-amount`, borrower `+amount` |
| **Loan Settle** (full/partial) | Transaction in lender account: `+settleAmount`, category "Loan Repayment" |

### Files Deleted (6 files, ~966 LOC)

| File | LOC |
|------|-----|
| `src/components/TransactionModal.tsx` | 224 |
| `src/components/TransferModal.tsx` | 233 |
| `src/components/TransactionForm.tsx` | 148 |
| `src/components/LoanForm.tsx` | 171 |
| `src/components/SettleModal.tsx` | 82 |
| `src/components/GroupSettleModal.tsx` | 108 |

### Bug Fixes Included

| Bug | Description | Fix |
|-----|-------------|-----|
| #1 | `applyAccountDelta` double-apply | Removed `applyAccountDelta` |
| #2 | Direct server API in useTransactions | Removed direct POST |
| #3 | `fetchData` recompute overwrites balance | Deleted recompute block |
| #4 | Sync engine pushes account balances | Removed accounts from SYNC_TABLES |
| #5 | No idempotency in sync push | Added `client_id` dedup |

---

## 10. Sync Improvements

**Date:** 2026-06-04
**Status:** Completed

### Problem
1. Sync was lazy — only ran on 30s interval, tab visibility, or online events
2. No sync progress feedback — progress bar showed fake `60%`
3. No periodic reconciliation — server data only pulled via 30s interval

### Solution

| Part | File | What |
|------|------|------|
| 1 | `src/services/syncEngine.ts` | Fix `syncState` to emit real syncing events |
| 2 | `src/services/syncEngine.ts` | Add `flushPending()` — push-only sync fired after every CRUD |
| 3 | `src/services/syncEngine.ts` + `OfflineIndicator.tsx` | Real sync progress bar |
| 4 | `src/services/syncEngine.ts` | 5-minute reconcile interval |
| 5 | — | Keep 30s interval as fallback |

### Integration Points
After every CRUD operation, `flushPending()` is called fire-and-forget:
- `WriteModal.tsx` — after successful submit
- `useTransactions.ts` — after add/delete
- `LoanManager.tsx` — after delete

### Verification
- `npx tsc --noEmit` — zero errors
- `npm run build` — production build succeeds
- Create transaction → sync fires within 1s (not 30s)
- OfflineIndicator shows real progress during sync
- 5-minute reconcile runs automatically

---

## 11. Three-Layer Alignment

**Date:** 2026-06-04
**Status:** Completed

### Motivation
17 mismatches found in schema alignment audit between Supabase PostgreSQL, IndexedDB/localDb, and TypeScript app types.

### Issues Fixed
1. **Sync silently failing** — local-only fields leaking into push payloads
2. **Soft-delete broken** — `_deleted` boolean vs `deleted_at` timestamp mismatch
3. **Type coercion bugs** — `member_id` stored as string in localDb but number on server
4. **Missing types** — Budgets, RecurringTransactions, LoanSettlements had no TypeScript types
5. **Stuck pending count** — accounts marked pending but never pushed

### Phases Implemented

| Phase | Description | Status |
|-------|-------------|--------|
| Phase 0 | Supabase Schema Audit & Fix | Done |
| Phase 1 | Canonical Schema Definition (`shared/schema.ts`) | Done |
| Phase 2 | Sync Engine Push Fix — strip local-only fields, handle deleted_at | Done |
| Phase 3 | Fix Type Coercions (member_id, account_id, etc.) | Done |
| Phase 4 | Align IndexedDB Schema to canonical schema | Done |
| Phase 5 | Clean Up Stale Data | Done |
| Phase 6 | Verification | Done |

### Canonical Field Rules

```
Server (PostgreSQL):
  id            BIGSERIAL PRIMARY KEY       (server auto-increment)
  client_id     UUID UNIQUE                 (correlation key, set by client)
  user_id       UUID NOT NULL               (RLS owner)
  ...domain fields...
  updated_at    TIMESTAMPTZ DEFAULT now()
  deleted_at    TIMESTAMPTZ                 (soft-delete)

IndexedDB (localDb):
  id            string (UUID)               (primary key = client_id on server)
  server_id     number | null               (server's BIGSERIAL id)
  ...domain fields...
  updated_at    string (ISO 8601)
  sync_status   'pending' | 'synced' | 'conflict'  (local-only)
  _deleted      boolean                     (local-only, maps to server deleted_at)
```

### Field Mapping

| Local Db Field | Server Field | Direction |
|---------------|-------------|-----------|
| `id` (UUID) | `client_id` (UUID) | Both |
| `server_id` (number) | `id` (BIGSERIAL) | Pull only |
| `sync_status` | — | Local only |
| `_deleted` (boolean) | `deleted_at` (timestamp) | Both |
| `updated_at` | `updated_at` | Both |

### Files Changed

| File | Change |
|------|--------|
| `shared/schema.ts` | New — canonical field definitions |
| `shared/types.ts` | Regenerated from schema.ts |
| `src/types.ts` | Added missing types, aligned existing |
| `src/services/localDb.ts` | Aligned all types, fixed type unions, added indexes |
| `src/services/syncEngine.ts` | Strip local-only fields in push, handle deleted_at |
| `api/routes/sync.ts` | Defense-in-depth field stripping |
| `src/hooks/useLocalData.ts` | Fix member_id/parent_id coercion |
| `src/hooks/useTransactions.ts` | Fix account_id mapping |
