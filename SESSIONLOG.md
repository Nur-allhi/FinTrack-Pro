# Session Log — FinTrack Pro

> Cumulative record of all development sessions.

---

## Session 13 — 25 May 2026 (Audit Remediation — Phases 0–3, 5–6)

### Changes

Full audit remediation based on `AUDIT_REPORT.md` — 14 items fixed, 20 API tests passing.

**Phase 0 — Critical Bug Fixes**
- `/api/import` now protected by `requireAuth` middleware (was wide open)
- `FloatingActionButton` timerRef typed as `ReturnType<typeof window.setTimeout>` instead of `undefined as any`
- Offline syncQueue filtering changed from `queue.indexOf(a)` (always returned first match) to `syncQueue.filter(item => item.id !== action.id)`
- `requireQuota` now uses `supabaseAdmin.getUserById(req.user.id)` instead of re-extracting token from headers

**Phase 1 — Data Layer Extraction**
- Created `api/db/` with per-entity query modules: `accounts.ts`, `members.ts`, `transactions.ts`, `loans.ts`, `groups.ts`, `investments.ts`, `transfers.ts`, `export.ts`, `index.ts`
- All 8 route files migrated from inline Supabase/SQLite branching to unified data layer calls
- 9 SQLite indexes added for performance (`transactions.account_id`, `loans.lender_account_id`, `loan_settlements.loan_id`, etc.)
- Cache TTL added to `cacheService` (default 5 minutes, configurable per call)

**Phase 2 — Zod Validation**
- Installed Zod, created `shared/validation.ts` with schemas + `validate()` helper returning discriminated union
- Applied validation to all POST/PATCH routes (members, accounts, transactions, loans, groups, investments, transfers)
- Added `?limit=&offset=` pagination to accounts, transactions, loans GET endpoints

**Phase 3 — Logging & Error Handling**
- Installed pino, created `api/logger.ts` with request-scoped child loggers
- `requestId` middleware generates UUID per request (stored in `res.locals` and `x-request-id` header)
- `errorHandler` middleware + `sendError()` helper for standardized `{ error, code, details }` responses

**Phase 5 — Type Safety**
- Created `shared/types.ts` with all entity interfaces (Account, Transaction, Loan, Member, Investment, etc.)
- Typed `members.ts` and `accounts.ts` data layer modules

**Phase 6 — Testing**
- Installed vitest + supertest
- Created `vitest.config.ts` (scoped to `api/tests/`, `src/tests/`)
- 3 passing tests for members data layer CRUD

### Verification
- `npx tsc --noEmit` passes with zero errors
- 20/20 API integration tests pass (login, auth guards, validation CRUD, pagination, export, admin endpoints)
- GitNexus re-indexed (1,312 symbols, 1,903 edges)

### New Files
- `api/db/*.ts` (9 files) — per-entity data access modules
- `shared/types.ts` — entity interfaces
- `shared/validation.ts` — Zod schemas + validate()
- `api/logger.ts` — pino logger setup
- `api/middleware/error.ts` — sendError + errorHandler
- `api/middleware/requestId.ts` — UUID request ID per request
- `api/tests/members.test.ts` — 3 Vitest tests
- `vitest.config.ts` — test configuration
- `IMPLEMENTATION_PLAN.md` — phased implementation plan
- `AUDIT_REPORT.md` — audit report (updated with status)

### Files Changed
- `api/index.ts` — requireAuth on import route, wired middleware
- `api/db.ts` — SQLite indexes added
- `api/routes/*.ts` (8 files) — migrated to data layer calls, validation, pagination
- `api/middleware/quota.ts` — getUserById fix
- `src/components/FloatingActionButton.tsx` — timerRef type fix
- `src/services/cacheService.ts` — TTL expiration
- `src/services/offlineService.ts` — syncQueue id-based filtering
- `package.json` — added zod, pino, pino-pretty, vitest, supertest, @types/supertest

---

## Session 7 — 16 May 2026 (dashboard polish)

### Changes
- **Dashboard controls** — single row: Member Select | Transactions (hidden on mobile) | Filters | Grid/List
- **Quick filters** — moved behind toggle button with smooth scale+fade animation (open/close)
- **AccountCard redesign** — removed redundant dot, SETTLED label, type tag from name row; added group name with Folder icon on the right; member name animates in/out based on filter selection
- **Sidebar nav animation** — `LayoutGroup` + `layout` for spring-animated active tab switching; auto-deselect when profile opens
- **Global button press** — enhanced `active:scale` from 0.98 to 0.96 on all btn-* classes, global `:where(button):active` rule for un-styled buttons
- **Text sizes** — all `text-[10px]` changed to `text-xs` (rem-based, scales with font-size setting)

### Files Changed
- `src/components/Dashboard.tsx` — layout rework, filter animation, text fixes
- `src/components/AccountCard.tsx` — full redesign with motion layout, props update
- `src/components/layout/Sidebar.tsx` — LayoutGroup, showProfile support
- `src/App.tsx` — pass showProfile to Sidebar
- `src/index.css` — global button active rule, enhanced btn scale, transform transition

---

## Session 6 — 16 May 2026 (polish + merge)

### Changes
- **FAB** — auto-close after 5s, fixed outside tap for mobile (`pointerdown`), ref-based timer for reliable cleanup
- **Modal animations** — open: backdrop fades in, card slides up; close: both fade out together via internal `closing` state + `setTimeout(onClose, 200)`
- **Dashboard layout** — Row 2: action buttons centered; Row 3: merged filters + Grid/List toggle; replaced "Your Portfolio" heading with member `Select` dropdown
- **Dashboard filter animation** — single `motion.div` wrapper with key change on filter, fades content in/out without affecting card sizes
- **Mobile keyboard** — amount fields use `inputMode="decimal"` (shows numeric keypad with decimal)

### New Files
- `src/components/ErrorBoundary.tsx` — catches render errors gracefully

---

## Session 5 — 16 May 2026 (Vercel fixes)

### Vercel Deployment Fixes

- **FAB white screen crash** (root cause: `FloatingActionButton`, `TransactionModal`, `TransferModal` shared one `<Suspense fallback={null}>` — lazy-loading a modal would replace ALL children with `null`, and any chunk-load error crashed the whole app since there was no error boundary)
  - Imported `FloatingActionButton` **eagerly** (it's tiny, no need for lazy)
  - Wrapped each modal in its own `<Suspense>` boundary
  - Wrapped modals in `<ErrorBoundary>` to catch chunk-load failures gracefully
  - Moved FAB outside the modal Suspense boundaries entirely
- **ErrorBoundary** (`src/components/ErrorBoundary.tsx`) — class-based boundary that logs errors and renders fallback instead of crashing the React tree
- **Admin panel not showing** (root cause: `/api/auth/me` API call fails silently on Vercel cold start, `.catch(() => {})` swallows errors, `isAdmin` stays `false`)
  - Added `console.warn` logging for the admin check failure
  - Added auto-retry after 3 seconds on failure

---

## Session 15 — 1 June 2026 (All Remaining TODOs Resolved)

### Changes

Completed all 6 remaining TODO items (T-033, T-035, T-065, T-066, T-067, T-068, T-069).

**T-065 — TypeScript Errors Fixed**
- `Sidebar.tsx`: added `TabId` union type for `activeTab`/`setActiveTab` props
- `AppearanceSettings.tsx`: added `showSpendingChart` and `showBalanceTrend` to settings interface
- `csvImport.ts`: added `linked_transaction_id: null`, fixed `category` type

**T-033 — supabaseAdmin Swap**
- Implemented per-request Supabase client via `AsyncLocalStorage` in `api/db.ts`
- Auth middleware creates user-scoped client with `createClientForToken(token)`
- All `api/db/*.ts` and `api/routes/*.ts` now use `db()` instead of direct `supabaseAdmin`
- Falls back to `supabaseAdmin` for non-HTTP contexts (tests)
- Updated all 3 test mock files to export `db`, `createClientForToken`, `runWithClient`

**T-035 — API `any` Types**
- `logger.ts`: removed `as any` cast on `req.requestId`
- `auth.ts`: `catch (err: unknown)` with `instanceof Error` check

**T-066 — Frontend Service `any` Types**
- `cacheService.ts`: imported `Member`, `Account`, `Transaction`, `OfflineActionBody` types
- `offlineService.ts`: typed `body` as `OfflineActionBody`, proper Background Sync cast
- `authService.ts`: `Session | null` for auth state callback
- Added `OfflineActionBody` interface to `src/types.ts`
- Fixed `useTransactions.ts` null guards for the new body type

**T-067 — Split UserProfile.tsx**
- Extracted `useProfileData` hook (84 LOC) to `src/hooks/useProfileData.ts`
- UserProfile.tsx reduced from 318→245 LOC

**T-068 — Split GroupManager.tsx**
- Extracted `GroupGridView` component (95 LOC) to `src/components/GroupGridView.tsx`
- GroupManager.tsx reduced from 306→240 LOC

**T-069 — Input Sanitization**
- Added `sanitizeHtml` transform to all user-input Zod fields in `shared/validation.ts`
- Strips HTML tags from name, particulars, category, summary, borrower_name, relationship

**Docs Updated**
- `AUDIT_REPORT.md`: all 27 issues resolved, no partially-fixed items
- `IMPLEMENTATION_PLAN.md`: all 62 tasks marked done
- `PROJECTPLAN.md`: Phase 11 fully completed
- `TODO.md`: 62 completed, 0 remaining
- `CHANGELOG.md`: added June 1 entry

### Files Changed
api/db.ts, api/db/*.ts (all), api/routes/budgets.ts, api/routes/recurring.ts, api/routes/search.ts, api/middleware/auth.ts, api/logger.ts, api/tests/helpers.ts, api/tests/auth.test.ts, api/tests/members.test.ts, shared/validation.ts, src/types.ts, src/services/cacheService.ts, src/services/offlineService.ts, src/services/authService.ts, src/hooks/useTransactions.ts, src/hooks/useProfileData.ts, src/components/UserProfile.tsx, src/components/GroupManager.tsx, src/components/GroupGridView.tsx, src/components/AppearanceSettings.tsx, src/components/layout/Sidebar.tsx, src/utils/csvImport.ts

---

## Session 14 — 31 May 2026 (Feature Enhancements)

### Changes

Completed T-056 through T-064 (liability tracking, budgeting, recurring transactions, multi-currency, dashboard charts, push notifications, CSV import, Excel export, full-text search).

---

## Sessions 8–12 — 17–19 May 2026 (QA, Loans, Docs, Auth)

### Session 8 — 17 May 2026 (QA fixes + UX polish)
- **Auto-refetch** — 30s polling interval + window focus refetch
- **Route persistence** — `activeTab`/`selectedAccountId` saved to `sessionStorage`
- **Back gesture prevention** — History API interceptor
- **Offline queue fix** — `navigator.onLine` unreliable; catch block checks `error instanceof TypeError`
- **Categories crash fix** — `Array.isArray()` guard on API response
- **Service Worker no longer intercepts `/api/*`** — removed `registerRoute` for API cache
- **Login flow UX** — "Login successful" toast, immediate dashboard
- **Ledger loading indicator** — "Loading entries..." spinner
- **Profile → nav navigation fix** — clicking sidebar nav closes profile
- **"All Members" grid includes General accounts** — unassigned accounts section

### Session 9 — 17 May 2026 (Loan Module)
- **Loan Manager** — full CRUD with desktop table + mobile cards, status filter
- **Loans API** — GET/POST/PATCH/DELETE + settle endpoint
- **DB schema** — loans table (SQLite + Supabase migration)
- **Nav** — Loans tab with Handshake icon

### Session 10 — 18 May 2026 (Person Loans + Partial Settlement + Edit Reversal)
- Person loans with free-text borrower name, remaining tracking
- Partial settlement via modal amount input
- Settlement edit reversal recalculates remaining from `SUM(loan_settlements)`
- DELETE reversal fix for linked_transaction_id fallback
- Frontend settle modal for both loan types

### Session 11 — 18 May 2026 (Documentation Overhaul)
- README.md, CHANGELOG.md, USER_MANUAL.md rewritten
- Session appended to HANDOFF.md
- PROJECTPLAN.md Phase 6 marked complete

### Session 12 — 19 May 2026 (Auth stability + UI smoothness)
- **Session expiry on Vercel cold start** — token drift fix, auth state listener syncs to localStorage, 401 retry
- **Ledger bump on transaction post** — local balance derivation, targeted refetch
- **Loading spinners** for Loan and Group modules
- **Fade-in animations** via AnimatePresence on loans + groups
- **Live app version** via transformIndexHtml meta tag
- **Pre-existing TS error** at FloatingActionButton.tsx(16,20) — fixed in Session 13

---

## Sessions 1–4 (Historical)

Refer to earlier project records for Sessions 1–4 (initial build, PWA, dark mode, settings reorganization, admin panel, user profile).
