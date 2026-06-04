# Changelog

All the changes made to FinTrack Pro, written in plain English.

---

2026-06-04: Add Unified Write Modal at src/components/WriteModal.tsx, src/components/WriteModalForms.tsx, src/types.ts — replaces 6 independent write modals (TransactionModal, TransferModal, TransactionForm, LoanForm, SettleModal, GroupSettleModal) with a single modal routing all writes through localDb → sync engine; fixes 5 data-flow bugs causing Dashboard/Ledger balance desync; WriteOperation type added to src/types.ts; all inline edit forms removed from Ledger, LoanManager, InvestmentTracker, InvestmentDetail; deleted 6 old component files; tsc --noEmit clean, build passes (completed).

2026-06-04: Add local-first read path with pub/sub change events at src/services/localDb.ts, src/hooks/useTransactions.ts, src/hooks/useLocalData.ts, src/components/DashboardCharts.tsx, src/components/TransactionModal.tsx, src/components/Ledger.tsx, src/App.tsx, src/services/syncEngine.ts, api/routes/sync.ts — localDb is now the single source of truth for the UI; useTransactions reads from IndexedDB and subscribes to onChange('transactions'); writes go to localDb first, then best-effort server sync; added onChange subscriptions for accounts/members in useLocalData; DashboardCharts reads from localDb; added adjustAccountBalance() for atomic balance updates; syncEngine.pushUnsynced saves server_id on local records (completed).
2026-06-04: Add server_id mapping to sync push response at api/routes/sync.ts — POST /push now returns ids: [{ client_id, server_id }] for inserted/updated records so the client can store server_id on local records (completed).
2026-06-04: Delete cacheService.ts, offlineService.ts, useOfflineSync.ts, offlineService.test.ts at src/services/, src/hooks/, src/tests/ — functionality merged into syncEngine and localDb; the offline queue was redundant once localDb.sync_status='pending' + syncEngine.pushUnsynced became the source of truth (completed).
2026-06-04: Remove lastUpdate prop from Ledger and App.tsx, remove fetchData from TransactionModal onUpdate at src/components/Ledger.tsx, src/components/TransactionModal.tsx, src/App.tsx — onChange subscriptions now handle refresh; fire-and-forget fetchData was redundant (completed).
2026-06-04: Fix recycle bin not showing deleted transactions — soft-delete in localDb from useTransactions.deleteTransaction at src/hooks/useTransactions.ts (completed).
2026-06-04: Fix dashboard-ledger balance desync and recharts mount warning — 5-part fix: (1) useTransactions.fetchTransactions checks localDb for pending transactions, (2) useTransactions initial load merges localDb pending into cached data, (3) Ledger calls onUpdate with delta after save/delete, (4) App.tsx Ledger onUpdate calls applyAccountDelta + fetchData, (5) DashboardCharts keeps card containers in DOM during loading, ResponsiveContainer only mounts after layout at src/hooks/useTransactions.ts, src/components/Ledger.tsx, src/App.tsx, src/components/DashboardCharts.tsx (completed).
2026-06-04: Fix dashboard balance delay — applyAccountDelta for synchronous React state update, fire-and-forget IndexedDB persist, removed content-visibility:auto at src/hooks/useLocalData.ts, src/components/TransactionModal.tsx, src/App.tsx (partial).
2026-06-04: Fix stale data after login — 5-part fix: (1) remove window.location.reload() on logout (causes flicker + race), (2) clear IndexedDB + localStorage + sessionStorage on logout, (3) clear IndexedDB again on login transition before fetchData, (4) fix handleLogin to verify session setup before setting authenticated, (5) fix _onSessionExpired to not fire on voluntary logout (completed).
2026-06-04: Fix logout not fully resetting state — was doing soft transition to login page leaving module-level variables stale; now does window.location.reload() after clearing IndexedDB, localStorage, and server session (completed).
2026-06-04: Fix auto re-login after logout — localStorage cleanup ran after setAuthStatus('guest'), letting Login component's refreshToken() find stale Supabase tokens and auto-login as old account before manual login could happen (completed).
2026-06-04: Fix stale old data showing after account switch — initial load effect re-ran on every auth change, racing with the login transition effect and setting stale IndexedDB state; now only runs on first auth (completed).
2026-06-04: Fix member/data duplication after fresh login — pullChanges() matched by client_id (always undefined) instead of server_id, creating duplicate IndexedDB entries; fetchData() now purges orphaned server_id records (completed).
2026-06-04: Fix member doubling root causes — remove event listener leaks in sync scheduler, fix fetchData stale closure with authRef, clear sync timestamp on logout (completed).
2026-06-04: Fix critical account data leak on switch — clear IndexedDB on logout, reset loadedRef, skip stale local data on login transition (completed).
2026-06-04: Skip DashboardCharts data fetch when charts are disabled — no API calls if showSpendingChart and showBalanceTrend are off (completed).
2026-06-04: Fix 429 rate limit errors on refresh — increase API limit to 300/min, change DashboardCharts to sequential fetches (completed).
2026-06-04: Fix duplicate accounts on re-login — add fetchingRef guard, clear state on auth transition, restore loadedRef (completed).
2026-06-04: Add full-screen loading indicator on first login — show LoadingScreen while data loads from server (completed).
2026-06-04: Fix stale data after account switch — Clear IndexedDB on logout and reset data load on re-login (completed).
2026-06-04: Add sign out button to UserProfile for phone screens at src/components/UserProfile.tsx — Mobile-only Sign Out button at bottom of profile page (completed).
2026-06-04: Add AnimatedBalance component at src/components/AnimatedBalance.tsx — Color-flash animation (green/red) when balance value changes in Ledger header and transaction rows (completed).
2026-06-04: Enhance OfflineIndicator at src/components/OfflineIndicator.tsx — Add status dot and cloud icons for clearer sync state visualization (completed).

2026-06-03: Add Supabase sync engine at src/services/syncEngine.ts — Push unsynced locals, pull server changes, LWW conflict resolution, background sync scheduler (completed).
2026-06-03: Add sync API endpoints at api/routes/sync.ts — POST /push (bulk upsert), GET /pull (changes since timestamp), POST /initial (full download) (completed).
2026-06-03: Add migration service at src/services/migrationService.ts — One-time UUID migration for existing server records, guest-to-registered data transfer (completed).
2026-06-03: Hook sync triggers in App.tsx — Start scheduler on auth, initial sync on login, stop on logout, 30s interval + tab visibility + online event (completed).

2026-06-03: Add guest mode signup nudge at src/components/SignupNudge.tsx — Non-blocking modal after 5 transactions prompting guests to sign up for data backup (completed).
2026-06-03: Make authService.apiFetch guest-aware at src/services/authService.ts — Short-circuits network requests for guests, avoiding wasted 401 calls (completed).
2026-06-03: Add guest_id generation and transaction count helpers at src/services/localDb.ts — getOrCreateGuestId() and getTransactionCount() for guest tracking (completed).

2026-06-03: Convert all component write paths to local-first IndexedDB writes at TransactionModal, TransferModal, LoanManager, MemberManager, GroupManager, InvestmentTracker, RecycleBin — All mutations write to IndexedDB instantly, eliminating API loading spinners and enabling offline-first writes (completed).
2026-06-03: Add soft-delete query helpers to localDb at src/services/localDb.ts — getDeletedItems(), restoreItem(), permanentDelete(), emptyBin() for recycle bin functionality (completed).
2026-06-03: Add double-click prevention via isWriting ref pattern to TransactionModal, TransferModal, LoanManager — Prevents duplicate submissions during write operations (completed).
2026-06-03: Add signup, password reset, and guest mode auth system at src/components/{Signup,ForgotPassword,ResetPassword}.tsx, src/services/authService.ts, src/hooks/useAuth.ts, src/App.tsx — Enables email/password signup, forgot/reset password flows, and guest mode (completed).
2026-06-03: Add local-first IndexedDB core at src/services/localDb.ts, src/utils/ids.ts, src/hooks/useLocalData.ts, shared/types.ts, src/App.tsx — Renders from local data instantly, replaces cache-based data loading (completed).
2026-06-03: Add Supabase migration for UUID sync fields at supabase/migrations/015_add_uuid_sync_fields.sql — Adds client_id, updated_at columns, indexes, triggers, and sync_log table (completed).
2026-06-03: Add local JSON export/import at src/services/exportService.ts, src/components/ImportModal.tsx, src/hooks/useProfileData.ts, src/components/UserProfile.tsx — Enables offline backup via JSON export with preview import modal, local-wins conflict resolution (completed).

## June 3, 2026 — Industry Standard Workflow Implementation

**What got done:**

**Git Workflow Rules (Non-negotiable)**
- Added branch naming convention: `<type>/<short-description>`
- Implemented plan-first approach: always create plan in `plans/` folder before coding
- Added user confirmation requirement before proceeding with implementation
- Added commit message format with type, scope, subject, body, and footer
- Added requirement to commit after every logical change with detailed messages

**Documentation Rules**
- Added CHANGELOG update requirement for every change, no matter how minor
- Added file organization rules: `plans/` for implementation plans, `docs/` for documentation
- Added documentation hierarchy: plans → docs → agent workflows → AGENTS.md → CLAUDE.md

**Parallel Agents**
- Added support for parallel agents for smaller, independent tasks
- Added guidance for launching multiple agents concurrently
- Added coordination requirements before merging to main

**Files Updated:**
- `AGENTS.md` - Added Git workflow, documentation, and parallel agent rules
- `CLAUDE.md` - Added Claude-specific workflow instructions
- `.agent/rules/workflow.md` - Created new workflow rules file
- `.agent/rules/GEMINI.md` - Updated to reference workflow rules

**Impact:**
- Establishes industry-standard workflow for the project
- Ensures consistent git practices across all development
- Improves code quality through planning and review process
- Enables parallel development for faster delivery

---

## June 1, 2026 — All Remaining TODOs Resolved

**What got done:**

**TypeScript Errors Fixed (T-065)**
- Fixed 3 type mismatches: `Sidebar.tsx` (TabId union), `AppearanceSettings.tsx` (showSpendingChart/showBalanceTrend), `csvImport.ts` (Transaction fields).
- `tsc --noEmit` now passes with 0 errors.

**supabaseAdmin Swap (T-033)**
- Implemented per-request Supabase client via `AsyncLocalStorage` in `api/db.ts`.
- Auth middleware creates a user-scoped client with `createClientForToken()`.
- All `api/db/*.ts` and `api/routes/*.ts` files now use `db()` instead of direct `supabaseAdmin`.
- Falls back to `supabaseAdmin` for non-HTTP contexts (tests).

**Type Safety (T-035, T-066)**
- API layer: removed `as any` in `logger.ts`, `catch (err: unknown)` in `auth.ts`.
- Frontend services: fixed 12 `any` types in `cacheService.ts`, `offlineService.ts`, `authService.ts`.
- Added `OfflineActionBody` interface to `src/types.ts`.

**File Splitting (T-067, T-068)**
- `UserProfile.tsx` (318→245 LOC) — extracted `useProfileData` hook.
- `GroupManager.tsx` (306→240 LOC) — extracted `GroupGridView` component.

**Input Sanitization (T-069)**
- Added `sanitizeHtml` transform to all user-input Zod fields in `shared/validation.ts`.
- Strips HTML tags from name, particulars, category, summary, borrower_name, relationship.

**Docs Updated**
- `docs/AUDIT_REPORT.md` — all 27 issues resolved, no partially-fixed or unfixed items remain.
- `docs/IMPLEMENTATION_PLAN.md` — all 62 tasks marked done.
- `docs/PROJECTPLAN.md` — Phase 11 fully checked off.
- `docs/TODO.md` — 53 completed, 0 remaining (all phases).

---

## June 2, 2026 — Performance Optimization (Phase 9)

**What got done:**

**Bundle Optimization (T-070, T-071, T-074, T-076)**
- Main bundle: 1,015 kB → 733 kB (-28%).
- Moved server deps (express, sharp, pino, dotenv, tsx) to devDependencies.
- Removed dead deps (jspdf-autotable, autoprefixer).
- Added manualChunks vendor splitting: react, supabase, charts, motion, html2canvas.
- jspdf and xlsx now dynamically imported on export click (not in page chunks).

**Font & CSS (T-072, T-073)**
- Removed unused fonts (Roboto Slab, Inter:300).
- Google Fonts preloaded via `<link rel="preload">` with display=swap.
- Replaced global `* { transition }` rule with targeted selectors on interactive elements.

**React Memoization (T-073, T-074, T-078)**
- 8 useMemo wrappers on Dashboard computations (activeAccounts, filteredAccounts, groupedByMember, totalBalance, totalLiabilities, etc.).
- defaultSettings moved to module scope — no longer recreated per render.
- React.memo on AccountCard, TransactionCard, TransactionRow.

**API & Service Worker (T-075, T-079, T-080)**
- Removed cache-busting `?_=${Date.now()}` from API calls.
- Consolidated duplicate `/api/auth/me` calls — single call returns auth + email.
- SW precache: 2,677 kB → 1,488 kB (-44%). Excluded lazy vendor chunks.

**Docs Updated**
- `docs/PERFORMANCE_REPORT.md` — full audit with before/after metrics.
- `docs/TODO.md` — 53 completed, 0 remaining.
- `docs/AUDIT_REPORT.md` — added P5 performance section.

---

## May 31, 2026 — Final Push: All TODO Items Completed

**Files touched:** api/db.ts, api/db/queries.ts, api/db/accounts.ts, api/db/groups.ts, api/db/loans.ts, api/db/transactions.ts, api/db/investments.ts, api/db/transfers.ts, api/db/export.ts, api/db/recyclebin.ts, api/routes/budgets.ts, api/routes/recurring.ts, api/routes/search.ts, api/middleware/auth.ts, api/logger.ts, api/tests/helpers.ts, api/tests/auth.test.ts, api/tests/members.test.ts, shared/validation.ts, src/types.ts, src/services/cacheService.ts, src/services/offlineService.ts, src/services/authService.ts, src/hooks/useTransactions.ts, src/hooks/useProfileData.ts, src/components/UserProfile.tsx, src/components/GroupManager.tsx, src/components/GroupGridView.tsx, src/components/Settings.tsx, src/components/AppearanceSettings.tsx, src/components/layout/Sidebar.tsx, src/utils/csvImport.ts

---

## May 31, 2026 — Final Push: All TODO Items Completed

**What got done:**

**CSV Import (T-062)**
- Added `papaparse` for CSV parsing on the frontend.
- New `src/utils/csvImport.ts` utility parses CSV files matching the export format (Date, Particulars, Category, Debit, Credit).
- "CSV Import" button added to Profile page — imports transactions into the first available account.

**Excel Export (T-063)**
- Added `xlsx` library for Excel file generation.
- New `exportReportExcel()` function in `src/utils/reportPdf.ts` generates `.xlsx` with formatted columns and totals.
- "Excel" button added to Report Generator alongside CSV and PDF.

**Dashboard Charts (T-060)**
- New `DashboardCharts.tsx` component with two charts:
  - Spending by category pie chart (top 8 categories, colored segments).
  - Balance trend line (AreaChart showing running balance over last 30 transactions).
- Charts appear below the DashboardHero when data is available.

**Full-Text Search (T-064)**
- Migration `010_add_fulltext_search.sql` adds `tsvector` columns and GIN indexes to transactions, accounts, and loans.
- Search route updated to use PostgreSQL `teq` (text search) with ILIKE fallback for exact matches.

**PWA Push Notifications (T-061)**
- Service worker (`sw.ts`) updated with `push` and `notificationclick` event handlers.
- New push subscription management in `notificationService.ts` — `subscribeToPush()`, `unsubscribeFromPush()`, `isPushSubscribed()`.
- VAPID key support via `VITE_VAPID_PUBLIC_KEY` environment variable.

**Liability Tracking (T-056)**
- DashboardHero now computes liabilities from accounts with negative balances.
- No more hardcoded "0" — shows real liability amount.

**Offline Queue Sync Tests (T-053)**
- 10 new tests in `src/tests/offlineService.test.ts` covering:
  - Empty queue sync, single action sync, server error retry, client error drop, network error handling.
  - Multiple action processing, sync state management, queue operations.
- All 47 tests passing.

**Type Safety (T-035, T-036)**
- 39 `any` types replaced across API routes and db modules (catch blocks, Record types, casts).
- 10 `any` types replaced in frontend components (Sidebar, Header, MemberManager, AccountCard, RecycleBin, Login, UserProfile).
- `LucideIcon` type used for icon props instead of `any`.

**supabaseAdmin Analysis (T-033)**
- Analysis of `supabaseAdmin` usage across all db modules — identified need for per-request client (completed June 1).
- Fixed data leak in `export.ts` — `investment_returns` now properly filtered by user's investments.

**Budgeting Module (T-057)**
- Migration `011_add_budgets.sql` creates `budgets` table with RLS.
- Backend: `api/routes/budgets.ts` with GET/POST/DELETE endpoints.
- Frontend: `BudgetManager.tsx` component in Settings with category budget CRUD.

**Recurring Transactions (T-058)**
- Migration `012_add_recurring_transactions.sql` creates `recurring_transactions` table with RLS.
- Backend: `api/routes/recurring.ts` with CRUD + `/process` endpoint that auto-creates due transactions.
- Frontend: `RecurringManager.tsx` component in Settings with daily/weekly/monthly/yearly scheduling.

**Multi-Currency Support (T-059)**
- Migration `013_add_account_currency.sql` adds `currency` column to accounts.
- New `src/utils/currency.ts` with exchange rate fetching (open.er-api.com), caching, and conversion.
- 15 currency options available in AccountForm.

**Files touched:** api/routes/budgets.ts, api/routes/recurring.ts, api/index.ts, api/db/export.ts, api/routes/search.ts, api/db/queries.ts, api/db/accounts.ts, src/utils/csvImport.ts, src/utils/currency.ts, src/utils/reportPdf.ts, src/components/DashboardCharts.tsx, src/components/BudgetManager.tsx, src/components/RecurringManager.tsx, src/components/AccountForm.tsx, src/components/UserProfile.tsx, src/components/ReportGenerator.tsx, src/components/Dashboard.tsx, src/components/DashboardHero.tsx, src/services/notificationService.ts, sw.ts, src/tests/offlineService.test.ts, supabase/migrations/010_add_fulltext_search.sql, supabase/migrations/011_add_budgets.sql, supabase/migrations/012_add_recurring_transactions.sql, supabase/migrations/013_add_account_currency.sql

---

## May 31, 2026 — Architecture Overhaul: File Splitting, Recycle Bin & Testing

**What got done:**

**File Splitting (10 components under 300 LOC)**
- `Ledger.tsx` (542→258) — extracted `useTransactions` hook and `LedgerToolbar` component.
- `LoanManager.tsx` (403→181) — extracted `LoanGroupCard` component.
- `AccountManager.tsx` (398→194) — extracted `AccountForm` and `AccountListView`.
- `Dashboard.tsx` (393→268) — extracted `DashboardHero`, `DashboardSettings`, `DashboardTodos`.
- `GroupManager.tsx` (341→306) — extracted `GroupForm`.
- `Settings.tsx` (319→136) — extracted `AppearanceSettings`, `DashboardSettings`, `CategorySettings`.
- `InvestmentTracker.tsx` (311→186) — extracted `InvestmentDetail`.
- `LoanGroupCard.tsx` (314→182) — extracted `LoanTable`, `GroupSettleModal`.
- `ReportGenerator.tsx` (303→205) — extracted `utils/reportPdf.ts`.
- `AdminPanel.tsx` deleted (admin features removed).

**Recycle Bin (Soft-Delete)**
- Backend: New migration `009_add_deleted_at.sql` adds `deleted_at` column to transactions, accounts, loans with partial indexes.
- Backend: `api/db/recyclebin.ts` with `getDeletedItems`, `restoreItem`, `permanentDeleteItem`, `emptyRecycleBin`.
- Backend: `api/db/queries.ts` now exports `softDeleteOne`, `restoreOne`, `permanentDeleteOne`.
- Backend: `api/routes/recyclebin.ts` with GET/POST/DELETE endpoints for listing, restoring, and permanently deleting items.
- Frontend: `RecycleBin.tsx` (228 LOC) — full UI with entity type filtering, restore, permanent delete, empty all, loading states, and confirmation dialogs.
- Frontend: Lazy-loaded in `App.tsx`, accessible via sidebar tab.

**Testing**
- `vitest.config.ts` configured for API and frontend tests.
- 13 smoke tests covering auth endpoints and all GET routes.
- 15 CRUD tests for accounts, transactions, loans, members, groups.
- 6 auth middleware tests for `requireAuth`, `requireQuota`, and session cookies.
- 3 members data layer tests (existing).

**Unified Query Interface**
- `api/db/queries.ts` (121 LOC) — shared `selectMany`, `selectOne`, `insertOne`, `updateOne`, `deleteOne`, `applyPagination` functions used by all entity modules.

**Shared Validation Schemas**
- `shared/validation.ts` (114 LOC) — Zod schemas for all entities with a `validate()` helper, reusable across frontend and backend.

**Rate Limiting**
- `api/middleware/rateLimit.ts` — `apiLimiter` (60 req/min) and `authLimiter` (10 req/15min) applied globally.

**HttpOnly Cookie Auth**
- Token migrated from `localStorage` to HttpOnly cookie (`sb-access-token`) with `SameSite=Strict`.
- `setSessionCookie` and `clearSessionCookie` helpers with proper security flags.

**Files touched:** api/db/queries.ts, api/db/recyclebin.ts, api/routes/recyclebin.ts, api/middleware/rateLimit.ts, api/middleware/auth.ts, api/tests/*.ts, shared/validation.ts, src/components/RecycleBin.tsx, src/components/Ledger.tsx, src/components/LoanManager.tsx, src/components/AccountManager.tsx, src/components/Dashboard.tsx, src/components/Settings.tsx, src/components/InvestmentTracker.tsx, src/components/LoanGroupCard.tsx, src/components/ReportGenerator.tsx, src/components/GroupManager.tsx, supabase/migrations/009_add_deleted_at.sql

---

## May 31, 2026 — Global Search: Transactions, Loans & Navigation Fix

**What's new:**
- Global search now finds **transactions** and **loans** in addition to accounts and members.
- Clicking a transaction from search results navigates directly to that account's ledger.
- Clicking a loan from search results navigates to the Loans tab.
- Search results show amount for transactions and loans.
- Loading spinner appears while the API search is in progress.
- Search falls back to local account/member filtering if the API is unreachable.

**Bugs fixed:**
- Search route (`/api/search`) existed but was never registered in the server — the endpoint returned 404 on deployment. Now properly mounted.
- Clicking a transaction from search previously showed a blank dashboard (was setting a transaction ID as a member filter). Now correctly navigates to the transaction's account ledger.

**Files touched:** api/routes/search.ts, api/index.ts, src/components/layout/Header.tsx, src/App.tsx

---

## May 19, 2026 — Auth Stability, Smoother UI & Live Version

**What got better:**

**Auth no longer breaks after inactivity**
- If you leave the app idle and come back, your session now refreshes automatically instead of silently failing. No more sign-out + sign-in cycle.
- When an API call returns 401, the app tries to refresh your token once before giving up. If the session is truly gone, you're redirected to login with a clear message.
- Google OAuth sign-in no longer leaves you stuck on the login screen — the app recovers the session from Supabase automatically.
- On page load, the stored token is validated and refreshed if needed.

**No more ledger "bump" when posting transactions**
- The ledger now computes the account balance locally from your transactions instead of relying on a full accounts refresh. No layout shift when data syncs in the background.
- After posting or deleting a transaction, only the transaction list refreshes — not the entire accounts list.

**Loan & Group modules feel more responsive**
- Both modules now show loading spinners while data is being fetched, saved, or deleted.
- Buttons show a spinner during save/delete so you know something is happening.
- When loans or groups appear, they fade in smoothly — matching the animation style used elsewhere in the app.

**Version shown on login screen is always up-to-date**
- Previously, the version (commit hash) was baked when the dev server started. If you committed new code, the login screen still showed the old hash until you restarted the server.
- Now the version is injected on every page request during development. Just refresh the browser after committing — no server restart needed.

**Files touched:** authService, App.tsx, Login, Ledger, LoanManager, GroupManager, Sidebar, vite.config.ts

## May 18, 2026 — Loan Module (Part 2): Person Loans & Flexible Settlements

**What's new:**
- You can now lend money to people outside the system (Person Loans). Just type their name — no need to create an account for them.
- When you settle a loan, you can pay any amount, not just the full balance. The system tracks how much is still owed.
- If you edit or delete a settlement transaction from the ledger, the loan balance updates automatically. No more mismatched records.
- Inter-account loans now also record settlement history, just like person loans.

**Bugs fixed:**
- Deleting a settlement transaction now correctly finds and reverses the linked transaction in all cases.
- When editing a settlement amount, the linked transaction on the other account stays in sync.
- Numbers are handled with absolute values to prevent negative balance bugs.

---

## May 17, 2026 — Quality of Life Fixes

**What got better:**
- Dashboard data refreshes every 30 seconds and when you switch back to the browser tab — so mobile users see desktop changes automatically.
- If you refresh the page, your last viewed tab and account are remembered.
- Mobile back gesture no longer closes the app by accident.
- Offline mode is now more reliable. When a network error happens, the app catches it and queues the action for later instead of crashing.
- Categories no longer crash the app when the server returns an error.
- Service worker no longer intercepts API calls (was causing random network errors).
- Login feels smoother — you see a "successful" toast and the dashboard loads with a spinner while data loads in the background.
- The ledger now shows a "Loading entries..." spinner instead of an empty "No records found" message.
- Clicking sidebar nav items correctly closes the profile page.
- The "All Members" filter on the Dashboard now includes unassigned (general) accounts.

**Files touched:** App.tsx, Dashboard, Ledger, TransactionModal, TransferModal, Settings, Sidebar, sw.ts

---

## May 16, 2026 — PWA, Dark Mode, Admin Tools & Design Polish

### Major Additions

**PWA (Progressive Web App)**
- Install FinTrack Pro as an app on your phone or desktop.
- Works offline — you can browse cached data without internet.
- An "Offline" banner shows when you lose connection, and data syncs automatically when you're back online.
- Service worker auto-updates when a new version is deployed.

**Dark Mode (3 variants)**
- Choose between Deep, Dim, or Night themes.
- Pick from 10 accent colors or set a custom one.
- No white flash when loading — the theme applies before the page renders.

**User Profile Page**
- View your account info (name, email).
- Change your password.
- Export, import, refresh, or clear all your data.
- Your name shows on the sidebar and dashboard greeting.

**Settings Reorganization**
- Settings now has sub-navigation: Appearance, Dashboard, Categories.
- Quick Tasks can be hidden from the Dashboard banner settings.
- Dead "Audit Alerts" toggle removed (no notification system exists).

**Admin Panel Upgrades**
- View storage usage per user with a progress bar (in MB/KB).
- Set custom storage limits per user (default 5MB).
- One-time password shown on user creation (shown once, then gone).
- Reset passwords for any user.
- Name field and email validation on user creation.
- Admin check is cached — the Admin Panel nav item shows instantly on refresh.
- Database summary shows total size at the top of the panel.

**Login Improvements**
- Login is faster — removed an unnecessary backend validation step that added 2-5 seconds delay.
- Stale sessions are cleaned up automatically.
- 30-second timeout on all auth calls (shows "Request timed out" if something hangs).

### Design Polish
- All tiny text (`text-[10px]`/`text-[11px]`) bumped to `text-xs` (12px) across 16 components.
- Card titles are now larger (`text-sm` → `text-base`).
- FAB (Floating Action Button) no longer sticks open after closing a modal.
- Sidebar profile card is clickable — opens your profile page.
- Removed "Total Assets" from sidebar (was redundant).
- Removed JetBrains Mono font (Inter used everywhere).

### Housekeeping
- Removed old legacy auth credentials (`password123`) from code.
- Cleaned up environment variables.

---

## May 14, 2026 — Bug Fixes, Toast System, Dark Mode, Groups & Mobile Views

### Bug Fixes
- Dashboard "Transfer Funds" and "Generate Report" buttons now actually work (were missing click handlers).
- Settings "Export" button now downloads your data as JSON.
- Ledger "Download" button exports transactions as CSV.
- Report Generator now filters by the selected member.
- Liabilities card was showing a hardcoded "0" — now hidden behind a setting toggle.
- Dashboard visibility toggles (showCurrentAssets, showLiabilities) actually work now.
- Grid/List toggle on Dashboard now switches views correctly.
- Gemini AI model name is now configurable via environment variable.
- Fixed missing `cn` import in TransactionForm.
- Fixed inverted "other" quick filter logic on Dashboard.
- Removed duplicate Liabilities card in dashboard hero section.
- Centered "Add Transaction" button in empty ledger state.

### What's New
- **Toast Notifications** — A proper notification system replaces all `alert()` popups.
- **Loading States** — Buttons show a "saving..." state while submitting (AccountManager, MemberManager).
- **Dark Mode** — Full dark theme with CSS variables and a toggle in Settings.
- **Account Groups** — Create parent groups for your accounts (e.g., "Savings" or "Joint Accounts"). Groups show accumulated balance. Navigate via new Groups page.
- **Custom Select Component** — Styled dropdown replacing native `<select>` elements everywhere.
- **Inline Edit Forms** — Edit accounts directly on the page with smooth animations (no page jump).
- **Mobile Card Views** — All list views show compact cards on mobile instead of horizontal scroll.
- **Responsive Design** — All pages optimized for mobile, tablet, and desktop.
- **Font Size Setting** — Choose small, normal, or large text in Settings.
- **Global Search** — Search for accounts and members from the header; results show in a dropdown.
- **Dashboard Quick Filters** — Filter accounts by type: All, Banks, Cash, Mobile, Investments, Others.
- **Interactive Members Page** — Click a member to see their accounts and balances; click an account to open its ledger.
- **Sidebar Backdrop** — Mobile menu now has a dark overlay when open.
- **Account Type Colors** — Customize colors for each account type in Settings.

### Design Changes
- Sidebar redesigned with card-style nav items and gradient active states.
- Account cards are more compact with type icons and color accents.
- Dashboard AccountCards have type-colored icon backgrounds.
- Color palette follows the Coinbase-inspired DESIGN.md spec.
- All dropdowns are pill-shaped with hover states and focus rings.
- Card padding reduced for a tighter layout.
- Database schema updated: `parent_id` column added to accounts for groups.
- API now excludes `type='group'` accounts from regular account lists.

### Removed
- AI integration (Gemini service, AI categorization, insights) — removed entirely.

---

## Earlier Development

Earlier work includes:
- Initial project setup with React + Vite + Express
- SQLite database with Supabase support
- Basic account, member, and transaction CRUD
- Investment tracking
- Report generation (PDF + CSV)
- Data export/import
- Session 1-4 foundational features

See git log or HANDOFF.md for full historical details.
