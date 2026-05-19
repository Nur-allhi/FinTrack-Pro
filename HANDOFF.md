# Handoff — 16 May 2026 (Session 7)

## Session Summary

PWA support, dark mode overhaul, settings reorganization, User Profile page, admin panel enhancements, and extensive UX stability improvements. Branch `dev` ready for merge to `main`.

## Changes

### PWA & Offline
- **Service worker** (`sw.ts`, `vite.config.ts`) — switched to `injectManifest` strategy with `skipWaiting()` + `clients.claim()`
- **Web manifest** — icons at all sizes, theme color, standalone display
- **Offline service** (`src/services/offlineService.ts`) — online/offline detection, sync queue for pending writes
- **OfflineIndicator** (`src/components/OfflineIndicator.tsx`) — banner when offline
- **App icons** — SVG + 192px/512px PNG generated from logo via `sharp`

### Dark Mode
- **Flash fix** (`index.html`) — inline script reads localStorage + critical CSS before first paint
- **3 variants** (`src/index.css`) — `dark` (Deep), `dark-dim`, `dark-night` with custom CSS classes
- **Style selector** (`src/components/Settings.tsx`) — pill selector visible when dark mode on
- **Accent color** (`src/App.tsx`, `src/components/Settings.tsx`) — custom primary color, 10 presets, updates CSS variables + theme-color meta tag
- **Persistence** — `darkModeStyle` saved to localStorage + IndexedDB

### Settings & Profile
- **Settings reorganized** (`src/components/Settings.tsx`) — sub-navigation with 3 sections: Appearance, Dashboard, Categories. Desktop sidebar nav, mobile pill tabs.
- **User Profile page** (`src/components/UserProfile.tsx`) — Account Info (name, email), Security (change password), Data (export/import/refresh/clear)
- **Export/Import moved** — from Settings to Profile page
- **Dead toggle removed** — "Audit Alerts" removed (no notification backend)
- **Quick Tasks toggle** — `showTodos` setting controls dashboard todo widget visibility
- **Sidebar profile card** — clickable entire card opens User Profile, shows name + email, no separate Settings link

### Admin Panel
- **Storage usage** — per-user MB/KB display with progress bar at `src/components/AdminPanel.tsx`, `api/routes/admin.ts`
- **Storage limits** — 5MB default, admin override per user, quota check on transaction POST at `api/middleware/quota.ts`
- **One-time password** — password shown in modal on creation, not stored. Reset Password flow with new endpoint at `api/routes/admin.ts`
- **Name field + email validation** on user creation at `src/components/AdminPanel.tsx`, `api/routes/admin.ts`
- **Admin check cached** — `is_admin` in localStorage, Admin Panel nav appears instantly on refresh
- **Database summary** — `GET /api/admin/storage/summary` shows total DB size at top of Users page
- **Renamed** "Users" → "Admin Panel", moved below Settings in nav

### Login
- **Removed backend validation step** — `validateAndLogin` eliminated, token trusted directly from Supabase (was adding 2-5s delay)
- **Stale session cleanup** — Supabase sessions without matching `auth_token` are cleared on mount
- **Timeout safety** — 30s AbortController on all auth calls, "Request timed out" error shown

### Auth & Config
- **Removed dead credentials** — `AUTH_USERNAME`/`AUTH_PASSWORD`/`AUTH_TOKEN_PREFIX` deleted from `api/config.ts` and `.env.example`
- **Service worker auto-update** — SW registration in `main.tsx` sends `SKIP_WAITING`, reloads on activate

### UI Audit
- **Typography standardized** — all `text-[10px]`/`text-[11px]` changed to `text-xs` (12px) across 16 components
- **Card titles** — bumped from `text-sm` to `text-base` for better readability
- **FAB** — fixed sticky options after modal close with `isAnyModalOpen` render guard

## New Files
- `sw.ts` — custom service worker with precaching + skipWaiting
- `src/components/UserProfile.tsx` — user profile page
- `src/components/OfflineIndicator.tsx` — offline banner
- `src/services/offlineService.ts` — offline detection + sync queue
- `api/middleware/quota.ts` — storage quota check middleware
- `USER_MANUAL.md` — comprehensive user documentation

## Files Changed
- `index.html` — PWA meta tags, inline dark mode script + critical CSS, manifest link
- `vite.config.ts` — VitePWA plugin with injectManifest
- `src/App.tsx` — showProfile state, UserProfile render, accent color effect, admin cache, dark mode style
- `src/main.tsx` — SW registration with SKIP_WAITING + auto-reload
- `src/index.css` — dark-dim + dark-night CSS classes, removed JetBrains Mono
- `src/components/layout/Sidebar.tsx` — profile card as clickable button, removed Total Assets
- `src/components/Settings.tsx` — sub-navigation, 3 sections, removed export/import, removed audit alerts
- `src/components/Dashboard.tsx` — showTodos toggle support
- `src/components/FloatingActionButton.tsx` — isAnyModalOpen render guard
- `src/components/Login.tsx` — simplified flow, stale session cleanup
- `src/components/AdminPanel.tsx` — storage display, password modal, reset password, name field, responsive
- `src/components/AccountCard.tsx` — bumped title size
- `src/components/AccountManager.tsx` — bumped title size
- `src/components/GroupManager.tsx` — bumped title size
- `src/components/MemberManager.tsx` — bumped title size
- `src/components/InvestmentTracker.tsx` — bumped title size
- `api/config.ts` — removed dead auth credentials
- `api/routes/admin.ts` — storage endpoint, reset password, name field, PATCH user metadata
- `api/routes/transactions.ts` — quota middleware on POST
- `.env.example` — removed old AUTH_USERNAME/PASSWORD
- `supabase/migrations/001_add_user_id.sql` — added `IF NOT EXISTS` for idempotent re-runs

---

## Session 8 — 17 May 2026 (QA fixes + UX polish)

### Changes
- **Auto-refetch** — 30s polling interval + window focus refetch so mobile sees desktop-ledgered data automatically, at `src/App.tsx`
- **Route persistence** — `activeTab`/`selectedAccountId` saved to `sessionStorage`, restored on refresh, at `src/App.tsx`
- **Back gesture prevention** — History API interceptor stops mobile back gesture from closing the app, at `src/App.tsx`
- **Offline queue fix** — `navigator.onLine` is unreliable; catch block now checks `error instanceof TypeError` (network failure) and falls back to `offlineService.queueAction()` in `TransactionModal`, `Ledger`, `TransferModal`
- **Categories crash fix** — `categories.includes()` threw when API returned 401 (error object, not array). Now checks `res.ok` + `Array.isArray()` in `TransactionModal`, `Ledger`, `Settings`
- **Service Worker no longer intercepts `/api/*`** — removed `registerRoute` for API cache which caused `net::ERR_FAILED` and `no-response` SW errors on all API calls, at `sw.ts`
- **Login flow UX** — "Login successful" toast, dashboard shows immediately with "Loading your data..." spinner, data loads in background, at `App.tsx`, `Dashboard.tsx`
- **Ledger loading indicator** — spinning "Loading entries..." shown while initial transaction fetch is in progress (was showing empty "No records found" misleadingly), at `src/components/Ledger.tsx`
- **Profile → nav navigation fix** — clicking sidebar nav items now correctly closes profile even when `activeTab` doesn't change, at `src/components/layout/Sidebar.tsx`
- **"All Members" grid includes General accounts** — unassigned accounts section added below member groups, at `src/components/Dashboard.tsx`

### Files Changed
- `src/App.tsx` — dataLoading state, handleLogin toast, polling, focus refetch, sessionStorage, history API
- `src/components/Dashboard.tsx` — dataLoading prop, loading indicator, General accounts section
- `src/components/Ledger.tsx` — loading spinner, offline queue fallback in catch, categories safe parse, removed lastUpdate trigger
- `src/components/TransactionModal.tsx` — offline queue (navigator.onLine + TypeError fallback), categories safe parse, removed duplicate onUpdate
- `src/components/TransferModal.tsx` — offline queue (navigator.onLine + TypeError fallback)
- `src/components/Settings.tsx` — categories safe parse
- `src/components/layout/Sidebar.tsx` — setShowProfile prop, close profile on nav click
- `sw.ts` — removed API route interception

### Environment
- Service worker no longer caches API responses — ensure previous SW registration is cleared in browser on first load after deploy

## Environment
- `SUPABASE_SERVICE_ROLE_KEY` required for admin features (user management, storage queries)
- Admin users set via `ADMIN_EMAILS` env var
- Supabase migration must be run: `supabase/migrations/001_add_user_id.sql`

### Latest (2026-05-16 cont.)
- **User name display** — name from Profile shown on sidebar card + Dashboard welcome greeting
- **Nav routing fix** — `useEffect([activeTab])` clears `showProfile` so nav items work after visiting Profile
- **Page animation** — Profile now has the same fade/slide transition as other pages
- **Sidebar profile card** — reads `localStorage.getItem('user_name')` with email prefix fallback

---

## Session 5 — 16 May 2026 (fixes)

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

## Session 6 — 16 May 2026 (polish + merge)

### Changes
- **FAB** — auto-close after 5s, fixed outside tap for mobile (`pointerdown`), ref-based timer for reliable cleanup
- **Modal animations** — open: backdrop fades in, card slides up; close: both fade out together via internal `closing` state + `setTimeout(onClose, 200)`
- **Dashboard layout** — Row 2: action buttons centered; Row 3: merged filters + Grid/List toggle; replaced "Your Portfolio" heading with member `Select` dropdown
- **Dashboard filter animation** — single `motion.div` wrapper with key change on filter, fades content in/out without affecting card sizes
- **Mobile keyboard** — amount fields use `inputMode="decimal"` (shows numeric keypad with decimal)

### New Files
- `src/components/ErrorBoundary.tsx` — catches render errors gracefully

## Branch
- `main` — merged from `dev` (Sessions 5-7)
- `dev` — ahead of `main`, ready for next session

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

## Session 9 — 17 May 2026 (Loan Module)

### Changes
- **Loan Manager** (`src/components/LoanManager.tsx`) — full CRUD component with desktop table + mobile cards, status filter (All/Active/Settled), create form with lender/borrower Select, settle action, delete confirmation
- **Loans API** (`api/routes/loans.ts`) — GET /api/loans (list with account names), POST (create), PATCH (update), POST /:id/settle, DELETE
- **DB schema** — `loans` table added to SQLite (auto-created) + Supabase migration `002_add_loans.sql`
- **Nav** — "Loans" tab between Investments and Reports with Handshake icon
- **Type** — `Loan` interface added to `src/types.ts`

### New Files
- `src/components/LoanManager.tsx` — loan tracking UI
- `api/routes/loans.ts` — loan CRUD endpoints
- `supabase/migrations/002_add_loans.sql` — loans table for Supabase

### Files Changed
- `src/types.ts` — added Loan interface
- `api/db.ts` — loans table CREATE IF NOT EXISTS
- `api/index.ts` — wired /api/loans route
- `src/App.tsx` — added nav item, lazy import, activeTab case

---

## Session 10 — 18 May 2026 (Loan Module: Person Loans + Partial Settlement + Edit Reversal)

### Changes
- **Person loans** — `borrower_name` (free text), `remaining` tracking, partial settlement via modal amount input
- **Inter-account loans** — now also creates `loan_settlements` record for consistent settlement tracking
- **Partial settlement** — settle modal opens for both loan types; user enters amount; remaining adjusts; only marks settled when remaining ≤ 0; amount validation prevents over-settlement
- **Settlement edit reversal** — `PATCH /api/transactions/:id` now recalculates `loan.remaining` from `SUM(loan_settlements)` when a `loan_settle` transaction amount changes; reverts status to `active` if no longer fully settled; syncs linked transaction amount (negated) for inter-account pairs
- **DELETE reversal fix** — `DELETE /api/transactions/:id` now also checks `linked_transaction_id` when looking up settlements (handles debit-side inter-account deletion)
- **`loan_settlements.transaction_id`** — stored on all settlement records; used for reliable lookup on edit/delete
- **Inter-account settle rewrite** — changed from `settleAmount ?? loan.amount` (always full settle) to `settleAmount ?? loan.remaining` with dynamic remaining calc and conditional settled status
- **Frontend settle modal** — removed `borrower_name` guard; inter-account now opens the same settle modal (borrower display name resolves from `borrower_name` or `borrower_account_name`)
- **Absolute value fix** — `Math.abs(amount)` used in settlement recalculation to handle debit-side negative transaction amounts

### New Files
- `src/components/LoanManager.tsx` — (untracked, added in Session 9 but not committed)
- `api/routes/loans.ts` — (untracked, added in Session 9 but not committed)
- `supabase/migrations/002_add_loans.sql` — (untracked)
- `supabase/migrations/003_add_loans_rls.sql` — (untracked)
- `supabase/migrations/004_add_loan_person_fields.sql` — borrower_name, remaining columns + loan_settlements table
- `supabase/migrations/005_borrower_account_nullable.sql` — makes borrower_account_id nullable
- `supabase/migrations/006_transaction_id_on_settlements.sql` — adds transaction_id to loan_settlements
- `scripts/` — backfill script for existing settlement records

### Files Changed
- `api/routes/loans.ts` — person loans, partial settlement, inter-account settle rewrite, loan_settlements record for inter-account
- `api/routes/transactions.ts` — PATCH handler recalculates loan on settlement edit; DELETE handler linked_transaction_id fallback; linked transaction sync for loan_settle type
- `src/types.ts` — Loan interface: added borrower_name, remaining, borrower_account_name, nullable borrower_account_id
- `api/db.ts` — SQLite schema: borrower_name, remaining columns + loan_settlements table
- `api/index.ts` — wired /api/loans route

### Pending
- Supabase migrations `002` through `006` must be run in Supabase Dashboard SQL Editor for loans features to work on Supabase
- Pre-existing TS error at `src/components/FloatingActionButton.tsx(16,20)` — unrelated

---

## Session 11 — 18 May 2026 (Documentation Overhaul)

### Changes
- **README.md** — rewritten with complete feature list, up-to-date project structure (added Loans, Groups, PWA sections), friendly easy English, full database schema, tech stack table, and navigation reference
- **CHANGELOG.md** — rewritten in plain, conversational English with clear "What's new" + "Bugs fixed" sections. Organized by date with descriptive headings instead of raw change lists
- **USER_MANUAL.md** — expanded to 16 sections (added Loans, User Profile, Offline Mode & PWA chapters). Added Loan module explanation covering person vs inter-account loans, partial settlement flow, settlement edit reversal behavior. Updated Settings, Admin Panel, and Troubleshooting sections. Written in friendly easy English throughout
- **HANDOFF.md** — appended Session 11 summary
- **PROJECTPLAN.md** — marked Phase 6 Settings Reorganization as complete (was done in Sessions 7-8 but not marked)

### Files Changed
- `README.md` — full rewrite
- `CHANGELOG.md` — full rewrite in plain English
- `USER_MANUAL.md` — expanded with Loans, Profile, PWA sections; all sections updated
- `HANDOFF.md` — appended this session
- `PROJECTPLAN.md` — Phase 6 status update

---

## Session 12 — 19 May 2026 (Auth stability + UI smoothness)

### Changes

**Session expiry on Vercel cold start** — token drift between Supabase auto-refresh and app's custom `auth_token` was causing silent 401s after inactivity. Fixed at `src/services/authService.ts`, `src/App.tsx`, `src/components/Login.tsx`:
- `authService.ts`: auth state listener syncs Supabase-refreshed tokens to `localStorage('auth_token')`; `refreshToken()` method recovers sessions from Supabase internal storage; `apiFetch()` intercepts 401, refreshes silently, retries once; `setOnSessionExpired()` callback for clean logout
- `App.tsx`: validates/refreshes token on mount instead of just checking `localStorage` existence; registers session expiry handler
- `Login.tsx`: recovers OAuth sessions on mount instead of destroying orphan Supabase sessions

**Ledger bump on transaction post** — full `fetchData` cycle replaced the `accounts` array causing unnecessary re-render and layout shift. Fixed at `src/components/Ledger.tsx`:
- Balance derived locally from `txsWithBalance[0].runningBalance` instead of `account.current_balance`
- `onUpdate()` replaced with `fetchTransactions(false)` in add/delete handlers — only refetches this account's transactions

**Loading spinners for Loan and Group modules** — added at `src/components/LoanManager.tsx`, `src/components/GroupManager.tsx`:
- LoanManager: initial fetch spinner, delete button spinner via `deletingId` state
- GroupManager: initial loading UI, delete button spinner, save button `Loader2` icon replaces text "Saving..."

**Fade-in animations** — `AnimatePresence` + `motion.tr`/`motion.div` added to match existing Ledger animation pattern at `src/components/LoanManager.tsx`, `src/components/GroupManager.tsx`:
- LoanManager: desktop table rows + mobile cards
- GroupManager: grid cards + desktop list table rows + mobile compact cards

**Live app version without dev restart** — `process.env.APP_VERSION` was static (baked at dev server start). Fixed at `vite.config.ts`, `src/components/Login.tsx`, `src/components/layout/Sidebar.tsx`:
- `vite.config.ts`: removed static `define`, added `inject-version` plugin with `transformIndexHtml` — injects `<meta name="app-version">` on every request during dev
- Login/Sidebar: read from meta tag instead of compile-time constant

### Files Changed
- `src/services/authService.ts` — token sync, refresh, 401 retry, session expiry callback
- `src/App.tsx` — mount token validation, session expiry handler
- `src/components/Login.tsx` — OAuth session recovery, version from meta tag
- `src/components/Ledger.tsx` — local balance derivation, fetchTransactions(false) instead of onUpdate()
- `src/components/LoanManager.tsx` — loading spinners, deleteId state, AnimatePresence animations
- `src/components/GroupManager.tsx` — loading UI, delete/save spinners, AnimatePresence animations
- `src/components/layout/Sidebar.tsx` — version from meta tag
- `vite.config.ts` — inject-version plugin, removed APP_VERSION define
