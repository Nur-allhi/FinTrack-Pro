# FinTrack Pro — Implementation Plan

**Cross-ref**: `PROJECTPLAN.md` for full project roadmap  
**Updated**: 2026-05-30

---

## ✅ Completed Items

### T-001 — Add `requireAuth` to `/api/import`
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: Added `requireAuth` middleware to protect the import route from unauthorized access.

### T-002 — Fix `timerRef` typing in FloatingActionButton
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: Typed `timerRef` as `ReturnType<typeof window.setTimeout>` instead of `undefined as any`.

### T-003 — Fix offline `syncQueue` filtering
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: Changed `queue.indexOf(a)` to `queue.filter(item => item.id !== a.id)` to avoid queue corruption on partial sync.

### T-004 — Fix `requireQuota` middleware
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: Uses already-verified `req.user` instead of re-extracting token from headers.

### T-005 — Extract data-access layer
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: Created `api/db/*.ts` with per-entity query modules (accounts, members, transactions, loans, groups, investments, transfers, export). Routes are now thin wrappers.

### T-006 — Add SQLite indexes
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: Added 9 indexes on `user_id`, `account_id`, `loan_id` in `api/db.ts`.

### T-007 — Add cache TTL
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: `cacheService` now enforces 5-minute default TTL on getMembers/getAccounts/getTransactions.

### T-008 — Add Zod request validation
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: Zod schemas + `validate()` helper applied to all POST/PATCH routes.

### T-009 — Add pagination to GET endpoints
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: Added `?limit=&offset=` support to accounts, transactions, and loans GET endpoints.

### T-010 — Standardize error response format
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: Created `sendError()` + `errorHandler` middleware returning `{ error, code, details }`.

### T-011 — Add structured logging (pino)
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: Integrated pino logger with request-scoped child loggers, replacing raw `console.error`.

### T-012 — Add request ID tracing
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: `requestId` middleware generates UUID per request for frontend→backend correlation.

### T-013 — Create shared types
- **Status**: ✅ Done
- **Commit**: `e00c6a2`
- **Details**: `shared/types.ts` created with core interfaces.

### T-014 — Remove global button bounce animation
- **Status**: ✅ Done
- **Commit**: `884fb5d`
- **Details**: Removed `button:active { scale: 0.96 }` from `index.css` and all component-level `active:scale-*` classes.

### T-015 — Replace entry/exit scale animations with slide
- **Status**: ✅ Done
- **Commit**: `884fb5d`
- **Details**: Replaced `scale` animations with clean `y`/`x` slide in TransactionModal, TransferModal, RenameModal, Toast, AccountManager, GroupManager, FloatingActionButton, Dashboard, App, Sidebar.

### T-016 — Cache API routes in service worker
- **Status**: ✅ Done
- **Commit**: `5e1dbf1`
- **Details**: Added `StaleWhileRevalidate` strategy for API GET routes, `NetworkFirst` for document navigation.

### T-017 — Create offline fallback HTML page
- **Status**: ✅ Done
- **Commit**: `5e1dbf1`
- **Details**: Created `public/offline.html` with branding and "You're offline" message.

### T-018 — Migrate offline queue to IndexedDB
- **Status**: ✅ Done
- **Commit**: `5e1dbf1`
- **Details**: Migrated action queue from localStorage to IndexedDB `offline_queue` store.

### T-019 — Add Background Sync API
- **Status**: ✅ Done
- **Commit**: `5e1dbf1`
- **Details**: Registered `navigator.sync` with `sync-offline-queue` tag; SW sync handler broadcasts to client.

### T-020 — Add reactive sync state store
- **Status**: ✅ Done
- **Commit**: `5e1dbf1`
- **Details**: Created `syncState` observable in `offlineService.ts` with subscribe/get/setState.

### T-021 — Enhance sync-on-reconnect with retries
- **Status**: ✅ Done
- **Commit**: `5e1dbf1`, `fff920b`, `1255ed7`, `6c57bc5`
- **Details**: Improved `syncQueue` with retry logic, batch atomicity, pending count, logging.

### T-022 — Add offline delete to Ledger
- **Status**: ✅ Done
- **Commit**: `5e1dbf1`
- **Details**: `handleDelete` queues delete action when offline, with optimistic UI removal.

### T-023 — Show pending queue count in OfflineIndicator
- **Status**: ✅ Done
- **Commit**: `5e1dbf1`, `6c57bc5`
- **Details**: OfflineIndicator now shows "Offline — N pending changes" with reactive syncState.

### T-024 — Add last sync timestamp display
- **Status**: ✅ Done
- **Commit**: `5e1dbf1`
- **Details**: Shows "Last synced: X minutes ago" using `date-fns/formatDistanceToNow`.

### T-025 — Add offline-aware TTL
- **Status**: ✅ Done
- **Commit**: `5e1dbf1`
- **Details**: Cache TTL checks are skipped when `navigator.onLine === false` — stale data shown instead of nothing.

### T-026 — Fix offline-related issues
- **Status**: ✅ Done
- **Commits**: `6eaaf57`, `0db284a`, `f0b49a6`, `2e82a8c`, `1c6a9af`, `cb5e16c`, `1d6c706`, `b5e4718`
- **Details**: Account balance adjustments for pending offline deletes, optimistic transaction persistence, unified IndexedDB connection, SW stale cache bypass, improved toast.

### T-027 — Sidebar logo rebrand
- **Status**: ✅ Done
- **Commit**: `b8f5aaa`, `c05d8c1`, `ea65304`
- **Details**: Replaced Wallet icon with bar-chart SVG from `public/icons/icon.svg`. Added "FinTrack Pro" in Roboto Slab. Logo clickable to refresh app.

### T-028 — Move docs to PLAN/ folder
- **Status**: ✅ Done
- **Commit**: `330ac34`, `c463a66`, `2d6060e`
- **Details**: Moved ANIMATION_CHANGES.md, OFFLINE_IMPLEMENTATION_PLAN.md, sidebar-logo-rebrand.md into PLAN/. Updated PROJECTPLAN.md, renamed IMPLEMENTATION.md → IMPLEMENTATION_PLAN.md.

---

## ⬜ Remaining Items

### T-029 — Typography audit
- **Status**: ✅ Done
- **Commit**: _(current branch)_
- **Details**: Added JetBrains Mono to Google Fonts import and corrected `--font-mono` theme token from Inter to JetBrains Mono.

### T-030 — Dark mode micro-interactions
- **Status**: ✅ Done
- **Commit**: _(current branch)_
- **Details**: Updated `*` selector transitions from 0.2s to 0.3s for `background-color`, `border-color`, and `color` to smooth theme toggling.

### T-031 — Create unified query interface
- **Priority**: P1
- **Phase**: 1 — Data Layer & Architecture
- **Estimate**: 4-6h
- **Details**: Create `api/db/queries.ts` as a unified query interface over Supabase + SQLite. Currently each `api/db/*.ts` module has its own branching; consolidate into a shared abstraction.
- **Dependency**: None

### T-032 — Extract shared Zod schemas to shared/validation/
- **Priority**: P1
- **Phase**: 1 — Data Layer & Architecture
- **Estimate**: 2-3h
- **Details**: Move inline Zod validation schemas from route handlers into `shared/validation/` directory for reuse between frontend and backend.
- **Dependency**: T-031

### T-033 — Swap supabaseAdmin for regular client in data queries
- **Priority**: P1
- **Phase**: 1 — Data Layer & Architecture
- **Estimate**: 1-2h
- **Details**: Replace `supabaseAdmin` (service role key) with regular `supabase` client for SELECT/INSERT queries. Reserve admin client for admin-only operations.
- **Dependency**: None (independent of T-031)

### T-034 — Migrate token from localStorage to HttpOnly cookie
- **Priority**: P1
- **Phase**: 1 — Data Layer & Architecture
- **Estimate**: 4-6h
- **Details**: Move Bearer token from `localStorage` to HttpOnly cookie to eliminate XSS vulnerability. Requires Supabase auth refactor and API middleware changes.
- **Dependency**: None (independent of T-031)

### T-035 — Replace any types across API layer
- **Priority**: P2
- **Phase**: 2 — Type Safety & Cleanup
- **Estimate**: 4-6h
- **Details**: Strongly type remaining `any` usages in API routes, middleware, and db modules. `shared/types.ts` exists with interfaces for members & accounts; extend to all entities.
- **Dependency**: None

### T-036 — Replace any types across frontend components
- **Priority**: P2
- **Phase**: 2 — Type Safety & Cleanup
- **Estimate**: 4-6h
- **Details**: Replace heavy `any` usage in React components with proper TypeScript interfaces. Focus on props, state, and event handlers.
- **Dependency**: None

### T-037 — Wrap /api/import in a transaction
- **Priority**: P2
- **Phase**: 2 — Type Safety & Cleanup
- **Estimate**: 1h
- **Details**: Wrap the DELETE+INSERT sequence in `/api/import` in a SQLite/DB transaction to prevent partial failure data corruption.
- **Dependency**: None

### T-038 — Add rate limiting middleware
- **Priority**: P2
- **Phase**: 2 — Type Safety & Cleanup
- **Estimate**: 2-3h
- **Details**: Add rate limiting to all API endpoints using `express-rate-limit` or similar. Protect against abuse.
- **Dependency**: None

### T-039 — Split Ledger component
- **Priority**: P2
- **Phase**: 3 — File Splitting (<300 LOC)
- **Estimate**: 2-3h
- **Details**: Split `src/components/Ledger.tsx` (542 LOC) into `LedgerTable`, `LedgerFilters`, `LedgerSummary`.
- **Dependency**: None

### T-040 — Split AdminPanel component
- **Priority**: P2
- **Phase**: 3 — File Splitting (<300 LOC)
- **Estimate**: 1-2h
- **Details**: Split `src/components/AdminPanel.tsx` (444 LOC) into `UserManager`, `SystemHealth`.
- **Dependency**: None

### T-041 — Split LoanManager component
- **Priority**: P2
- **Phase**: 3 — File Splitting (<300 LOC)
- **Estimate**: 2-3h
- **Details**: Split `src/components/LoanManager.tsx` (403 LOC) into `LoanForm`, `LoanList`, `LoanDetail`.
- **Dependency**: None

### T-042 — Split AccountManager component
- **Priority**: P2
- **Phase**: 3 — File Splitting (<300 LOC)
- **Estimate**: 1-2h
- **Details**: Split `src/components/AccountManager.tsx` (398 LOC) into `AccountForm`, `AccountList`.
- **Dependency**: None

### T-043 — Split Dashboard component
- **Priority**: P2
- **Phase**: 3 — File Splitting (<300 LOC)
- **Estimate**: 2-3h
- **Details**: Split `src/components/Dashboard.tsx` (391 LOC) into `DashboardHero`, `DashboardGrid`, `DashboardCards`.
- **Dependency**: None

### T-044 — Split GroupManager component
- **Priority**: P2
- **Phase**: 3 — File Splitting (<300 LOC)
- **Estimate**: 1-2h
- **Details**: Split `src/components/GroupManager.tsx` (341 LOC) into `GroupForm`, `GroupList`, `GroupMembers`.
- **Dependency**: None

### T-045 — Split Settings component
- **Priority**: P2
- **Phase**: 3 — File Splitting (<300 LOC)
- **Estimate**: 1-2h
- **Details**: Split `src/components/Settings.tsx` (319 LOC) into section-level files (already has sub-navigation).
- **Dependency**: None

### T-046 — Split InvestmentTracker component
- **Priority**: P2
- **Phase**: 3 — File Splitting (<300 LOC)
- **Estimate**: 1h
- **Details**: Split `src/components/InvestmentTracker.tsx` (311 LOC) from monolithic Dashboard extraction.
- **Dependency**: None

### T-047 — Split LoanGroupCard component
- **Priority**: P2
- **Phase**: 3 — File Splitting (<300 LOC)
- **Estimate**: 1h
- **Details**: Split `src/components/LoanGroupCard.tsx` (314 LOC) into smaller sub-components.
- **Dependency**: None

### T-048 — Defer ReportGenerator splitting
- **Priority**: P2
- **Phase**: 3 — File Splitting (<300 LOC)
- **Estimate**: —
- **Details**: `ReportGenerator` (303 LOC) is just over threshold. Defer until functional changes require edits.
- **Dependency**: None

### T-049 — Vitest + supertest setup for API integration tests
- **Priority**: P2
- **Phase**: 4 — Testing
- **Estimate**: 1h
- **Details**: Project already has `vitest.config.ts` and 3 members data layer tests. Verify setup works for API route tests with supertest.
- **Dependency**: None

### T-050 — Smoke tests for all GET endpoints
- **Priority**: P2
- **Phase**: 4 — Testing
- **Estimate**: 2-3h
- **Details**: Write smoke tests for every GET route to verify 200 response with valid auth.
- **Dependency**: T-049

### T-051 — CRUD tests for transactions, accounts, loans
- **Priority**: P2
- **Phase**: 4 — Testing
- **Estimate**: 3-4h
- **Details**: Integration tests for create, read, update, delete operations on core business entities.
- **Dependency**: T-049

### T-052 — Auth middleware tests
- **Priority**: P2
- **Phase**: 4 — Testing
- **Estimate**: 1-2h
- **Details**: Tests for `requireAuth`, `requireQuota`, `requireAdmin` middleware — valid/invalid/missing tokens.
- **Dependency**: T-049

### T-053 — Offline queue sync tests
- **Priority**: P2
- **Phase**: 4 — Testing
- **Estimate**: 2-3h
- **Details**: Tests for `queueAction`, `syncQueue`, retry logic, and queue persistence.
- **Dependency**: T-049

### T-054 — Recycle bin backend
- **Priority**: P2
- **Phase**: 5 — Recycle Bin / Soft-Delete
- **Estimate**: 4-6h
- **Details**: Add `deleted_at TEXT` column to tables, implement soft-delete logic, create restore/permanent-delete endpoints. See PROJECTPLAN Phase 6.2 for full breakdown.
- **Dependency**: None

### T-055 — Recycle bin frontend
- **Priority**: P2
- **Phase**: 5 — Recycle Bin / Soft-Delete
- **Estimate**: 4-6h
- **Details**: Build RecycleBin component with item display, restore action, permanent delete, auto-purge of stale items. See PROJECTPLAN Phase 6.3 for full breakdown.
- **Dependency**: T-054

### T-056 — Liability tracking
- **Priority**: P3
- **Phase**: 6 — Feature Enhancements
- **Estimate**: Medium
- **Details**: Replace hardcoded "0" in liabilities card with real liability accounts and transactions model.
- **Dependency**: None

### T-057 — Budgeting module
- **Priority**: P3
- **Phase**: 6 — Feature Enhancements
- **Estimate**: Medium
- **Details**: Monthly category budgets with overspend tracking.
- **Dependency**: None

### T-058 — Recurring transactions
- **Priority**: P3
- **Phase**: 6 — Feature Enhancements
- **Estimate**: Medium
- **Details**: Cron-based or SW-triggered auto-creation of recurring transactions.
- **Dependency**: None

### T-059 — Multi-currency support
- **Priority**: P3
- **Phase**: 6 — Feature Enhancements
- **Estimate**: Hard
- **Details**: Exchange rate API integration, per-account currency setting. Affects all number displays.
- **Dependency**: None

### T-060 — Dashboard charts
- **Priority**: P3
- **Phase**: 6 — Feature Enhancements
- **Estimate**: Medium
- **Details**: Spending by category pie chart and balance trend line using Recharts (already installed).
- **Dependency**: None

### T-061 — PWA push notifications
- **Priority**: P3
- **Phase**: 6 — Feature Enhancements
- **Estimate**: Medium
- **Details**: Push notifications for loan due dates and low balance alerts via service worker push API.
- **Dependency**: None

### T-062 — CSV import
- **Priority**: P3
- **Phase**: 6 — Feature Enhancements
- **Estimate**: Easy
- **Details**: File upload + CSV parse for bulk transaction import.
- **Dependency**: None

### T-063 — Excel export
- **Priority**: P3
- **Phase**: 6 — Feature Enhancements
- **Estimate**: Easy
- **Details**: Add .xlsx export format alongside existing PDF/CSV.
- **Dependency**: None

### T-064 — Full-text search
- **Priority**: P3
- **Phase**: 6 — Feature Enhancements
- **Estimate**: Medium
- **Details**: SQLite FTS index for full-text search across all transactions and particulars.
- **Dependency**: None

---

## Effort Summary

| Phase | Items | Status | Est. Effort | Risk |
|-------|-------|--------|-------------|------|
| Completed (T-001 to T-028) | 28 items | ✅ All done | — | — |
| Phase 0 — In-Flight Issues | T-029 to T-030 | ✅ Done | 1.5h | None |
| Phase 1 — Data Layer & Architecture | T-031 to T-034 | ⬜ 4 pending | 11-17h | Medium |
| Phase 2 — Type Safety & Cleanup | T-035 to T-038 | ⬜ 4 pending | 11-16h | Low |
| Phase 3 — File Splitting | T-039 to T-048 | ⬜ 10 pending | 8-14h | Low-Medium |
| Phase 4 — Testing | T-049 to T-053 | ⬜ 5 pending | 9-13h | None |
| Phase 5 — Recycle Bin | T-054 to T-055 | ⬜ 2 pending | 8-12h | Low |
| Phase 6 — Feature Enhancements | T-056 to T-064 | ⬜ 9 pending | Varies | N/A |

**Total completed**: 28 items  
**Total remaining (Phases 0-5)**: 27 items, ~48-73h  
**Total remaining (Phase 6)**: 9 items, varies

---

## Post-Implementation

```bash
npx gitnexus analyze --force
```
