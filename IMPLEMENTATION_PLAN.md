# FinTrack Pro — Implementation Plan

**Cross-ref**: `PROJECTPLAN.md` for full project roadmap  
**Updated**: 2026-06-02

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
- **Commits**: `b8f5aaa`, `c05d8c1`, `ea65304`
- **Details**: Replaced Wallet icon with bar-chart SVG from `public/icons/icon.svg`. Added "FinTrack Pro" in Roboto Slab. Logo clickable to refresh app.

### T-028 — Move docs to PLAN/ folder
- **Status**: ✅ Done
- **Commits**: `330ac34`, `c463a66`, `2d6060e`
- **Details**: Moved ANIMATION_CHANGES.md, OFFLINE_IMPLEMENTATION_PLAN.md, sidebar-logo-rebrand.md into PLAN/. Updated PROJECTPLAN.md, renamed IMPLEMENTATION.md → IMPLEMENTATION_PLAN.md.

### T-029 — Typography audit
- **Status**: ✅ Done
- **Details**: Added JetBrains Mono to Google Fonts import and corrected `--font-mono` theme token from Inter to JetBrains Mono.

### T-030 — Dark mode micro-interactions
- **Status**: ✅ Done
- **Details**: Updated `*` selector transitions from 0.2s to 0.3s for `background-color`, `border-color`, and `color` to smooth theme toggling.

### T-031 — Create unified query interface
- **Status**: ✅ Done
- **Details**: Created `api/db/queries.ts` (121 LOC) with `selectMany`, `selectOne`, `insertOne`, `updateOne`, `deleteOne`, `softDeleteOne`, `restoreOne`, `permanentDeleteOne`, `applyPagination`, `isSoftDeleteTable`. Used by all entity modules.

### T-032 — Extract shared Zod schemas
- **Status**: ✅ Done
- **Details**: Created `shared/validation.ts` (114 LOC) with Zod schemas for all entities: `memberSchema`, `accountSchema`, `transactionSchema`, `loanSchema`, `groupSchema`, `investmentSchema`, `transferSchema`, `categoryRenameSchema`, plus `validate()` helper.

### T-034 — Migrate token from localStorage to HttpOnly cookie
- **Status**: ✅ Done
- **Details**: Auth middleware reads tokens from HttpOnly cookie (`sb-access-token`). `setSessionCookie` and `clearSessionCookie` set proper `HttpOnly; SameSite=Strict; Path=/; Max-Age=3600` flags. No localStorage usage for auth tokens.

### T-037 — Wrap /api/import in a transaction
- **Status**: ✅ Done (via Supabase RPC)
- **Details**: Import endpoint delegates to `importAllData()` which calls `db().rpc("fintrack_import_data", ...)` — a PostgreSQL stored procedure that executes atomically within a database transaction.

### T-038 — Add rate limiting middleware
- **Status**: ✅ Done
- **Details**: Created `api/middleware/rateLimit.ts` with `apiLimiter` (60 req/min) and `authLimiter` (10 req/15min). Applied globally via `app.use("/api", apiLimiter)`.

### T-039 — Split Ledger component
- **Status**: ✅ Done
- **Details**: `Ledger.tsx` (542→258 LOC), extracted `useTransactions` hook (219 LOC) and `LedgerToolbar` (189 LOC).

### T-040 — Split AdminPanel component
- **Status**: ✅ Done
- **Details**: `AdminPanel.tsx` deleted (admin features removed from app).

### T-041 — Split LoanManager component
- **Status**: ✅ Done
- **Details**: `LoanManager.tsx` (403→181 LOC), extracted `LoanGroupCard` (182 LOC).

### T-042 — Split AccountManager component
- **Status**: ✅ Done
- **Details**: `AccountManager.tsx` (398→194 LOC), extracted `AccountForm` and `AccountListView`.

### T-043 — Split Dashboard component
- **Status**: ✅ Done
- **Details**: `Dashboard.tsx` (393→268 LOC), extracted `DashboardHero` (67 LOC), `DashboardSettings` (51 LOC), `DashboardTodos` (81 LOC).

### T-044 — Split GroupManager component
- **Status**: ✅ Done
- **Details**: `GroupManager.tsx` (341→306 LOC), extracted `GroupForm`.

### T-045 — Split Settings component
- **Status**: ✅ Done
- **Details**: `Settings.tsx` (319→136 LOC), extracted `AppearanceSettings`, `DashboardSettings`, `CategorySettings`.

### T-046 — Split InvestmentTracker component
- **Status**: ✅ Done
- **Details**: `InvestmentTracker.tsx` (311→186 LOC), extracted `InvestmentDetail`.

### T-047 — Split LoanGroupCard component
- **Status**: ✅ Done
- **Details**: `LoanGroupCard.tsx` (314→182 LOC), extracted `LoanTable`, `GroupSettleModal`.

### T-048 — Split ReportGenerator component
- **Status**: ✅ Done
- **Details**: `ReportGenerator.tsx` (303→205 LOC), extracted `utils/reportPdf.ts`.

### T-049 — Vitest + supertest setup for API integration tests
- **Status**: ✅ Done
- **Details**: `vitest.config.ts` configured, `api/tests/helpers.ts` with shared mocks. 4 test files, 37 total test cases.

### T-050 — Smoke tests for all GET endpoints
- **Status**: ✅ Done
- **Details**: `api/tests/smoke.test.ts` — 13 tests covering auth endpoints and all GET routes.

### T-051 — CRUD tests for transactions, accounts, loans
- **Status**: ✅ Done
- **Details**: `api/tests/crud.test.ts` — 15 tests covering CRUD for accounts, transactions, loans, members, groups.

### T-052 — Auth middleware tests
- **Status**: ✅ Done
- **Details**: `api/tests/auth.test.ts` — 6 tests for `requireAuth`, `requireQuota`, session cookies.

### T-054 — Recycle bin backend
- **Status**: ✅ Done
- **Details**: Migration `009_add_deleted_at.sql` adds `deleted_at` column to transactions, accounts, loans. `api/db/recyclebin.ts` with `getDeletedItems`, `restoreItem`, `permanentDeleteItem`, `emptyRecycleBin`. `api/routes/recyclebin.ts` with GET/POST/DELETE endpoints. Soft-delete support in `api/db/queries.ts` via `softDeleteOne`, `restoreOne`, `permanentDeleteOne`.

### T-055 — Recycle bin frontend
- **Status**: ✅ Done
- **Details**: `src/components/RecycleBin.tsx` (228 LOC) — full UI with item listing, restore, permanent delete, empty all, entity type filtering, loading states, confirmation dialogs. Lazy-loaded in `App.tsx`, accessible via sidebar tab.

---

## ⬜ Remaining Items

### T-065 — Fix TypeScript errors (3 type mismatches)
- **Status**: ✅ Done (2026-06-02)
- **Details**: 3 TypeScript errors fixed:
  1. `src/components/layout/Sidebar.tsx` — added `TabId` union type to `activeTab`/`setActiveTab` props
  2. `src/components/AppearanceSettings.tsx` — added `showSpendingChart` and `showBalanceTrend` to settings interface
  3. `src/utils/csvImport.ts` — added `linked_transaction_id: null` and fixed `category` type from `null` to `''`

### T-066 — Replace any types in frontend services (12 instances)
- **Status**: ✅ Done (2026-06-02)
- **Details**: All 12 instances fixed:
  - `cacheService.ts` — imported `Member`, `Account`, `Transaction`, `OfflineActionBody` types
  - `offlineService.ts` — typed `body` as `OfflineActionBody`, proper Background Sync cast
  - `authService.ts` — `Session | null` for auth state callback
  - Added `OfflineActionBody` interface to `src/types.ts`
  - Fixed `useTransactions.ts` null guards for the new body type

### T-067 — Split UserProfile.tsx (318 LOC)
- **Status**: ✅ Done (2026-06-02)
- **Details**: Extracted `useProfileData` hook (84 LOC) to `src/hooks/useProfileData.ts`. UserProfile.tsx reduced from 318→245 LOC.

### T-033 — Swap supabaseAdmin for regular client in data queries
- **Status**: ✅ Done (2026-06-02)
- **Details**: Implemented per-request Supabase client via `AsyncLocalStorage` in `api/db.ts`. Auth middleware creates a client with the user's JWT via `createClientForToken()`. All `api/db/*.ts` files now use `db()` (request-scoped) instead of direct `supabaseAdmin`. Falls back to `supabaseAdmin` for non-HTTP contexts (tests).

### T-035 — Replace any types across API layer
- **Status**: ✅ Done (2026-06-02)
- **Details**: Fixed `logger.ts:12` — removed `as any` cast (requestId type already globally augmented). Fixed `middleware/auth.ts:69` — `catch (err: unknown)` with `instanceof Error` check.

### T-036 — Replace any types across frontend components
- **Status**: ✅ Done
- **Details**: 10 instances of `any` replaced in `Header.tsx`, `MemberManager.tsx`, `Sidebar.tsx`, `RecycleBin.tsx`, `Login.tsx`, `AccountCard.tsx`, `UserProfile.tsx`. Used `LucideIcon` type for icon props, `unknown` for catch blocks.

### T-053 — Offline queue sync tests
- **Status**: ✅ Done
- **Details**: 10 tests in `src/tests/offlineService.test.ts` covering empty queue, single action, server error retry, client error drop, network error, multiple actions, sync state, queue operations. IndexedDB and localStorage mocked.

### T-056 — Liability tracking
- **Status**: ✅ Done
- **Details**: Computed from accounts with negative `current_balance`. DashboardHero receives `totalLiabilities` prop from Dashboard.

### T-057 — Budgeting module
- **Status**: ✅ Done
- **Details**: Migration `011_add_budgets.sql`, backend `api/routes/budgets.ts` (GET/POST/DELETE), frontend `BudgetManager.tsx` in Settings with category selection and monthly budgets.

### T-058 — Recurring transactions
- **Status**: ✅ Done
- **Details**: Migration `012_add_recurring_transactions.sql`, backend `api/routes/recurring.ts` (CRUD + `/process`), frontend `RecurringManager.tsx` in Settings with daily/weekly/monthly/yearly scheduling.

### T-059 — Multi-currency support
- **Status**: ✅ Done
- **Details**: Migration `013_add_account_currency.sql` adds `currency` column to accounts. `src/utils/currency.ts` with exchange rate API (open.er-api.com), caching, 15 currencies. AccountForm includes currency selector.

### T-060 — Dashboard charts
- **Status**: ✅ Done
- **Details**: `DashboardCharts.tsx` with PieChart (spending by category, top 8) and AreaChart (balance trend, last 30 transactions). Uses Recharts.

### T-061 — PWA push notifications
- **Status**: ✅ Done
- **Details**: `sw.ts` updated with `push` and `notificationclick` handlers. `notificationService.ts` extended with `subscribeToPush()`, `unsubscribeFromPush()`, `isPushSubscribed()`. VAPID key via `VITE_VAPID_PUBLIC_KEY`.

### T-062 — CSV import
- **Status**: ✅ Done
- **Details**: `papaparse` installed. `src/utils/csvImport.ts` parses CSV (Date, Particulars, Category, Debit, Credit). CSV Import button in UserProfile page.

### T-063 — Excel export
- **Status**: ✅ Done
- **Details**: `xlsx` installed. `exportReportExcel()` in `reportPdf.ts` generates `.xlsx`. Excel button in ReportGenerator.

### T-064 — Full-text search
- **Status**: ✅ Done
- **Details**: Migration `010_add_fulltext_search.sql` adds `tsvector` columns and GIN indexes. Search route uses `fts.teq` with ILIKE fallback.

### T-068 — Split GroupManager.tsx (306 LOC)
- **Status**: ✅ Done (2026-06-02)
- **Details**: Extracted `GroupGridView` component (95 LOC) to `src/components/GroupGridView.tsx`. GroupManager.tsx reduced from 306→240 LOC.

### T-069 — Input sanitization improvements
- **Status**: ✅ Done (2026-06-02)
- **Details**: Added `sanitizeHtml` transform to all user-input string fields in `shared/validation.ts` — strips HTML tags from name, particulars, category, summary, borrower_name, relationship across all schemas.

---

## Effort Summary

| Phase | Items | Status | Est. Effort | Risk |
|-------|-------|--------|-------------|------|
| Completed (T-001 to T-028) | 28 items | ✅ All done | — | — |
| Phase 0 — In-Flight Issues | T-029 to T-030 | ✅ Done | 1.5h | None |
| Phase 1 — Data Layer & Architecture | T-031 to T-034 | ✅ All done | — | — |
| Phase 2 — Type Safety & Cleanup | T-035 to T-038, T-066 | ✅ All done | — | — |
| Phase 3 — File Splitting | T-039 to T-048, T-067, T-068 | ✅ All done | — | — |
| Phase 4 — Testing | T-049 to T-053 | ✅ All done | — | — |
| Phase 5 — Recycle Bin | T-054 to T-055 | ✅ All done | — | — |
| Phase 6 — Feature Enhancements | T-056 to T-064 | ✅ All done | — | — |
| Phase 7 — Critical Fixes | T-065 | ✅ Done | 1-2h | — |
| Phase 8 — Audit Leftovers | T-068, T-069 | ✅ Done | 3-5h | — |

**Total completed**: 62 items
**Total remaining**: 0 items

---

## Post-Implementation

```bash
npx gitnexus analyze --force
```
