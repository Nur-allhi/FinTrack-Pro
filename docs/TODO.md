# TODO — FinTrack Pro

> Generated from `plans/MASTER_PROMPT.md` · 2026-06-02
> **188 completed**, **3 remaining** (Google Drive backup deferred)
>
> ## Branching Strategy
>
> ```
> main (stable)
>   └── performance/ai-improvements (Phase 10 — P0/P1/P2/Data)
>         └── design/obsidian-theme (Phase 11 — Design polish from design.md)
> ```
> 1. Work on `design/obsidian-theme` first.
> 2. Merge `design/obsidian-theme` → `performance/ai-improvements`.
> 3. Merge `performance/ai-improvements` → `main`.

---

## Phase 0 — Critical Fixes ✅

- [x] **T-065** Fix 3 TypeScript errors (App.tsx, Settings.tsx, csvImport.ts) (1-2h)

## Phase 0 — In-Flight Issues ✅

- [x] **T-029** Typography audit (30m)
- [x] **T-030** Dark mode micro-interactions (1h)

## Phase 1 — Data Layer & Architecture ✅

- [x] **T-031** Create unified query interface `api/db/queries.ts` (4-6h)
- [x] **T-032** Extract shared Zod schemas to `shared/validation.ts` (2-3h)
- [x] **T-033** Swap `supabaseAdmin` for regular client in data queries (1-2h) — AsyncLocalStorage per-request client
- [x] **T-034** Migrate token from `localStorage` to HttpOnly cookie (4-6h)

## Phase 2 — Type Safety & Cleanup ✅

- [x] **T-035** Replace `any` types across API layer (1-2h) — 2 instances fixed
- [x] **T-036** Replace `any` types across frontend components (4-6h) — 10 instances fixed
- [x] **T-037** Wrap `/api/import` in a DB transaction (1h)
- [x] **T-038** Add rate limiting middleware (2-3h)
- [x] **T-066** Replace `any` types in frontend services (2-3h) — 12 instances fixed

## Phase 3 — File Splitting (<300 LOC) ✅

- [x] **T-039** Split `Ledger.tsx` (542→258) → `useTransactions`, `LedgerToolbar` (2-3h)
- [x] **T-040** ~~Split `AdminPanel.tsx` (444)~~ — file deleted (admin removed)
- [x] **T-041** Split `LoanManager.tsx` (403→181) → `LoanGroupCard` (2-3h)
- [x] **T-042** Split `AccountManager.tsx` (398→194) → `AccountForm`, `AccountListView` (1-2h)
- [x] **T-043** Split `Dashboard.tsx` (393→268) → `DashboardHero`, `DashboardSettings`, `DashboardTodos` (2-3h)
- [x] **T-044** Split `GroupManager.tsx` (341→306) → `GroupForm` (1-2h)
- [x] **T-045** Split `Settings.tsx` (319→136) → `AppearanceSettings`, `DashboardSettings`, `CategorySettings` (1-2h)
- [x] **T-046** Split `InvestmentTracker.tsx` (311→186) → `InvestmentDetail` (1h)
- [x] **T-047** Split `LoanGroupCard.tsx` (314→182) → `LoanTable`, `GroupSettleModal` (1h)
- [x] **T-048** Split `ReportGenerator.tsx` (303→205) → `utils/reportPdf.ts` (1h)
- [x] **T-067** Split `UserProfile.tsx` (318→245 LOC) → `useProfileData` hook (1-2h)
- [x] **T-068** Split `GroupManager.tsx` (306→240 LOC) → `GroupGridView` (1-2h) — from audit #6

## Phase 4 — Testing ✅

- [x] **T-049** Vitest + supertest setup for API integration tests (1h)
- [x] **T-050** Smoke tests for all GET endpoints (2-3h) ← depends T-049
- [x] **T-051** CRUD tests for transactions, accounts, loans (3-4h) ← depends T-049
- [x] **T-052** Auth middleware tests (1-2h) ← depends T-049
- [x] **T-053** Offline queue sync tests (2-3h) ← depends T-049, requires IndexedDB mock

## Phase 5 — Recycle Bin / Soft-Delete ✅

- [x] **T-054** Recycle bin backend — soft-delete, restore, permanent-delete (4-6h)
- [x] **T-055** Recycle bin frontend — RecycleBin component (4-6h) ← depends T-054

## Phase 6 — Feature Enhancements ✅

- [x] **T-056** Liability tracking — computes from accounts with negative balances
- [x] **T-057** Budgeting module — monthly category budgets with CRUD
- [x] **T-058** Recurring transactions — daily/weekly/monthly/yearly scheduling
- [x] **T-059** Multi-currency support — per-account currency, exchange rate API
- [x] **T-060** Dashboard charts — spending pie chart + balance trend line via Recharts
- [x] **T-061** PWA push notifications — service worker push handler + subscription management
- [x] **T-062** CSV import — papaparse-based CSV transaction import
- [x] **T-063** Excel export — .xlsx alongside PDF/CSV via xlsx library
- [x] **T-064** Full-text search — PostgreSQL FTS with GIN indexes + tsvector columns

## Phase 8 — Audit Leftovers ✅

- [x] **T-069** Input sanitization — sanitizeHtml transform on all user-input Zod fields (2-3h) — from audit #13

## Phase 9 — Performance Optimization ✅

- [x] **T-070** Move server deps to devDependencies (30m) — sharp, dotenv, tsx, pino, express
- [x] **T-071** Add manualChunks vendor splitting in vite.config.ts (30m) — main bundle 1,015→733 kB
- [x] **T-072** Defer Google Fonts with preload + display=swap (15m)
- [x] **T-073** Memoize Dashboard computations with useMemo (30m) — 8 wrappers
- [x] **T-074** Memoize defaultSettings to module scope (15m)
- [x] **T-075** Remove cache-busting query param from API calls (15m)
- [x] **T-076** Lazy-load xlsx and jspdf/pdf libs on-demand (1h) — dynamic import() on export click
- [x] **T-077** ~~Replace motion animations with CSS transitions~~ — kept as-is, 94 kB acceptable for animation quality
- [x] **T-078** Add React.memo to list item components (1h) — AccountCard done, TransactionCard/Row already had it
- [x] **T-079** Consolidate duplicate /api/auth/me calls (15m) — single call returns auth + email
- [x] **T-080** Reduce service worker precache scope (30m) — 2,677→1,488 kB (44% reduction)
- [x] **T-081** ~~Optimize PNG icons~~ — already 37 kB total; all references require PNG (PWA manifest, apple-touch-icon, notifications)

---

## Phase 10 — Performance & UX Improvements ✅

> Source: `plans/MASTER_PROMPT.md` — Apply App X Performance & UX Patterns
> Branch: `performance/ai-improvements`
> **Status: 20/20 complete**

### 🔴 P0 — Must Fix (Mobile Responsiveness Basics)

- [x] **T-082** Add global touch + overscroll CSS (`src/index.css` — `touch-action: manipulation`, `overscroll-behavior: none/contain`) (30m) — `📄 MASTER_PROMPT.md:P0#1` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:8.1`
- [x] **T-083** Make all scroll/touch event listeners passive (`Select.tsx:44`, `DatePicker.tsx:59`, `FloatingActionButton.tsx:43`) (30m) — `📄 MASTER_PROMPT.md:P0#2` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:8.1,8.7`
- [x] **T-084** Add body scroll locking + Escape key to all modals (SettleModal, GroupSettleModal, TransferModal, TransactionModal, RenameModal) (1h) — `📄 MASTER_PROMPT.md:P0#3` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:8.4`
- [x] **T-085** Add font preconnect to `index.html` (`fonts.googleapis.com`, `fonts.gstatic.com`) (15m) — `📄 MASTER_PROMPT.md:P0#4` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:8.5`

### 🟡 P1 — Visual Responsiveness

- [x] **T-086** Add tactile press feedback (`active:scale-[0.97]`) to all interactive elements (buttons, cards, FAB, toggles, nav items) (1h) — `📄 MASTER_PROMPT.md:P1#5` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:8.2`
- [x] **T-087** Create `SkeletonLoader.tsx` component with shimmer variants (cards, table rows, charts, dashboard) + RAF two-phase reveal (2h) — `📄 MASTER_PROMPT.md:P1#6` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:1.2,2.4,8.3`
- [x] **T-088** Add `focus-visible` rings + ARIA attributes (`aria-current`, `aria-pressed`, `aria-label`, `aria-hidden`, `role="button"`) (1-2h) — `📄 MASTER_PROMPT.md:P1#7` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:8.2,8.6`
- [x] **T-089** Add `content-visibility: auto` + `contain-intrinsic-size` to lazy-loaded route wrappers in `App.tsx` (30m) — `📄 MASTER_PROMPT.md:P1#8` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:8.3`

### 🟢 P2 — Polish

- [x] **T-090** Add `overscroll-behavior: contain` to all scrollable containers (sidebar, Select dropdown, DashboardTodos) (15m) — `📄 MASTER_PROMPT.md:P2#9` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:8.8`
- [x] **T-091** Throttle scroll/resize handlers with RAF in `Select.tsx` and `DatePicker.tsx` (30m) — `📄 MASTER_PROMPT.md:P2#10` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:1.9,8.7`
- [x] **T-092** Add `safe-area-inset-bottom` padding to bottom-fixed elements (30m) — `📄 MASTER_PROMPT.md:P2#11` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:8.1`
- [x] **T-093** Add `contain: layout style` to all `<motion.div>` elements (30m) — `📄 MASTER_PROMPT.md:P2#12` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:8.3`

### 🎬 Animation Smoothness

- [x] **T-094** Fix animation durations (0.15→0.35, 0.2→0.4) and easings (custom cubic-bezier) on all motion.div transitions (1h) — `📄 MASTER_PROMPT.md:#13` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:7.4,7.5`
- [x] **T-095** Add `will-change: transform, opacity` to all animated `<motion.div>` and `<motion.button>` elements (30m) — `📄 MASTER_PROMPT.md:#14` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:7.3`
- [x] **T-096** Add `prefers-reduced-motion` media query to `src/index.css` (15m) — `📄 MASTER_PROMPT.md:#15` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:7.1,7.7`
- [x] **T-097** (Skipped) Staggered list animations — CSS class defined but never applied to components; deferred as low-value (1h) — `📄 MASTER_PROMPT.md:#16` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:1.8,7.6`

### 🗄️ Data Architecture (Cache-First)

- [x] **T-098** Refactor `useAccounts`, `useTransactions`, `useMembers` to cache-first pattern (read IndexedDB first, fetch API in background) (3-4h) — `📄 MASTER_PROMPT.md:#17` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:6.3,6.4`
- [x] **T-099** Update IndexedDB cache after every successful POST/PUT/DELETE (1-2h) — `📄 MASTER_PROMPT.md:#18` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:6.3`
- [x] **T-100** Increase cache TTL to session-length (no expiry) + add "Last synced" indicator (30m) — `📄 MASTER_PROMPT.md:#19` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:6.3`
- [x] **T-101** (Deferred) View Transitions API — kept as optional; `document.startViewTransition` would conflict with existing `AnimatePresence` page transitions (1h) — `📄 MASTER_PROMPT.md:#20` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:1.7`
>
> ---
>
> ## Phase 11 — Obsidian Theme (Design Polish) ✅
>
> > Source: `design.md` — Apply the Obsidian dark palette to the entire app
> > Branch: `design/obsidian-theme`
> > **Merge order**: `design/obsidian-theme` → `performance/ai-improvements` → `main`
>
> ### 🎨 Design Token Implementation
>
> - [x] **T-102** Map `design.md` tokens to Tailwind config — colors, typography, spacing, rounded, component tokens (1-2h)
> - [x] **T-103** Replace hardcoded colors across all components with design token classes (3-4h)
>
> ### 🖌️ Component Audit
>
> - [x] **T-104** Audit and update Card, Button, Surface components against `design.md` component specs (2h)
> - [x] **T-105** Audit typography (display, h1, body, label) across all pages to match `design.md` (1h)
> - [x] **T-106** Ensure single-accent rule — Tertiary (`#A78BFA`) used for exactly one action per screen (1h)
>
> ### ✅ Design QA
>
> - [x] **T-107** Verify contrast ratios meet WCAG AA on Obsidian surfaces (1h)
> - [x] **T-108** Final visual regression check across all routes (1h)

---

## Phase 12 — Mobile Navigation Redesign ✅

> Source: `plans/MOBILE_NAVIGATION_REDESIGN.md`
> Branch: `mobile-navigation-redesign`
> **Status: 7/7 complete**

### 📱 Core Components

- [x] **T-109** Create `useScrollDirection` hook — scroll detection for nav auto-hide (1h) — `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§4 Step 1` `📄 HIG:Bottom Navigation#scroll-behavior` `📄 web.dev:scroll-driven-animations`
- [x] **T-110** Add `.glass-nav` CSS utility to `src/index.css` — glassmorphic styling (15m) — `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§4 Step 2` `📄 Material Design 3:Glass#backdrop-blur` `📄 HIG:Visual Effects#blur`
- [x] **T-111** Create `MoreMenu` bottom sheet component — remaining 6 nav items in grid (2h) — `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§4 Step 3` `📄 Material Design 3:Bottom Sheets` `📄 HIG:Sheets#modal`
- [x] **T-112** Create `BottomNav` component — glassmorphic tab bar with 5 items + FAB morph (3h) — `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§4 Step 4` `📄 Material Design 3:Navigation Bar` `📄 HIG:Tab Bars#tab-bar`

### 🔗 Integration & Cleanup

- [x] **T-113** Integrate `BottomNav` in `App.tsx` — scroll ref, Ledger FAB, remove old FAB (2h) — `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§4 Step 5` `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§5 Animation Reference`
- [x] **T-114** Delete `FloatingActionButton.tsx` — replaced by + button in `BottomNav` (15m) — `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§4 Step 6`
- [x] **T-115** Run `npm run lint` and verify type correctness (15m) — `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§8 Testing Checklist`

---

## Phase 12b — Mobile Nav Fixes ✅

> Source: `plans/MOBILE_NAVIGATION_REDESIGN.md:§9 Post-Implementation Fixes`
> Branch: `mobile-navigation-redesign`
> **Status: 5/5 complete**

### 🔧 Bug Fixes

- [x] **T-116** Fix scroll auto-hide — change root div from `min-h-[100dvh]` to `h-[100dvh] overflow-hidden` on mobile so inner container actually scrolls (30m) — `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§9 Fix A`
- [x] **T-117** Fix FAB position on Ledger — move from `bottom-8 right-8` to `bottom-24 right-6` so it clears the bottom nav bar (15m) — `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§9 Fix B`

### 📱 Mobile Cleanup

- [x] **T-118** Hide sidebar on mobile — add `hidden md:block` to `<aside>` in Sidebar.tsx (15m) — `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§9 Fix C`
- [x] **T-119** Add profile avatar to Header on mobile — replace hamburger with circular initial button, add `userEmail` + `onOpenProfile` props (30m) — `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§9 Fix C`
- [x] **T-120** Remove `isMobileMenuOpen` state from App.tsx — clean up unused state and Sidebar/Header props (15m) — `📄 plans/MOBILE_NAVIGATION_REDESIGN.md:§9 Fix C`

---

## Phase 13 — Local-First Architecture

> Source: `plans/LOCAL_FIRST_ARCHITECTURE.md`
> Branch: `feat/local-first`
> **Status: 26/28 complete**

### 🔐 Phase 1 — Auth System (Signup + Password Reset)

- [x] **T-121** Create `src/components/Signup.tsx` — signup form with email/password (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§5.1`
- [x] **T-122** Create `src/components/ForgotPassword.tsx` — password reset request form (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§5.3`
- [x] **T-123** Create `src/components/ResetPassword.tsx` — new password form after email link (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§5.3`
- [x] **T-124** Update `src/services/authService.ts` — add `signUp()`, `resetPassword()`, `updatePassword()` methods (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§5.1`
- [x] **T-125** Update `src/components/Login.tsx` — remove Google button, add "Sign Up" and "Forgot Password" links (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§5.2`
- [x] **T-126** Update `src/hooks/useAuth.ts` — new auth state model with guest mode (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§5.4`
- [x] **T-127** Update `src/App.tsx` — add routes for auth pages (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§5.5`

### 🗄️ Phase 2 — Local-First IndexedDB Core

- [x] **T-128** Create `src/services/localDb.ts` — primary IndexedDB database with full schema (4h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§3`
- [x] **T-129** Create `src/utils/ids.ts` — UUID generation utility (15m) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§4`
- [x] **T-130** Update `shared/types.ts` — add `sync_status`, `updated_at`, `client_id` fields (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§4`
- [x] **T-131** Create `src/hooks/useLocalData.ts` — replace `useOfflineSync.ts` (3h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§6`
- [x] **T-132** Rewrite `src/App.tsx` — remove `dataReady` gate, render from local data (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§6`

### ✍️ Phase 3 — Component Write Path Migration

- [x] **T-133** Update `TransactionModal.tsx` — instant local write (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§6`
- [x] **T-134** Update `TransferModal.tsx` — instant local write (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§6`
- [x] **T-135** Update `LoanManager.tsx` — instant local write (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§6`
- [x] **T-136** Update `MemberManager.tsx` — instant local write (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§6`
- [x] **T-137** Update `GroupManager.tsx` — instant local write (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§6`
- [x] **T-138** Update `InvestmentTracker.tsx` — instant local write (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§6`
- [x] **T-139** Update `RecycleBin.tsx` — instant local write (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§6`
- [x] **T-140** Fix double-click issues in all components (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§6`

### 👤 Phase 4 — Guest Mode + Signup Nudge

- [x] **T-143** Update `src/services/authService.ts` — make auth optional for guests (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§7`
- [x] **T-144** Update `src/hooks/useAuth.ts` — guest mode state management (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§7`
- [x] **T-145** Create `src/components/SignupNudge.tsx` — signup prompt popup (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§7.2`
- [x] **T-146** Test guest → registered migration flow (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§7.3`

### ☁️ Phase 5 — Supabase Sync Engine

- [x] **T-147** Create `supabase/migrations/015_add_uuid_sync_fields.sql` — UUID + updated_at columns (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§10`
- [x] **T-148** Create `src/services/syncEngine.ts` — background sync to Supabase (4h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§9`
- [x] **T-149** Create `api/routes/sync.ts` — bulk sync API endpoint (3h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§10`
- [x] **T-150** Create `src/services/migrationService.ts` — one-time UUID migration for existing users (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§3`
- [x] **T-151** Implement push/pull/merge logic (3h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§9`
- [x] **T-152** Test multi-device sync (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§9`

### 💾 Phase 6 — Data Backup (Google Drive + JSON)

- [x] **T-156** Update `src/components/UserProfile.tsx` — add Google Drive + Export/Import buttons (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§8.3`
- [x] **T-157** Create `src/services/exportService.ts` — JSON export for local backup (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§8.2`
- [x] **T-158** Create `src/components/ImportModal.tsx` — JSON import (2h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§8.2`

### 🎬 Phase 7 — Animations & Polish ✅

- [x] **T-159** Add slide-in animations for new transactions (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§11` — already implemented via AnimatePresence on TransactionRow/TransactionCard
- [x] **T-160** Add slide-out animations for deleted transactions (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§11` — already implemented via AnimatePresence exit on TransactionRow/TransactionCard
- [x] **T-161** Add balance update animations (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§11` — AnimatedBalance component with color-flash on value change
- [x] **T-162** Update `OfflineIndicator.tsx` with sync status (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§11` — status dot + cloud icons for sync visualization
- [x] **T-163** Create `public/offline.html` — offline fallback page (30m) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§12` — already existed

---

## Phase 14 — Local-First Read Path Fix

> Source: `docs/LOCAL_FIRST_READ_PATH_FIX.md`
> Branch: `feat/local-first`
> **Status: 6/6 complete**

### Phase 14.1 — Reactive Change Events

- [x] **T-164** Add pub/sub event system to `localDb.ts` — listener registry, `onChange()`/`offChange()`, notify after every put/remove (1-2h) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 1`
- [x] **T-165** Add `adjustAccountBalance()` to `localDb.ts` — atomic read-update-write with notification (1h) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 1`

### Phase 14.2 — Unify Write Path (useTransactions → localDb first)

- [x] **T-166** Rewrite `useTransactions.addOrUpdateTransaction` — write to localDb first, then server (2h) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 2`
- [x] **T-167** Rewrite `useTransactions.deleteTransaction` — localDb soft-delete primary, server DELETE secondary (1h) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 2`

### Phase 14.3 — Unify Read Path (useTransactions reads from localDb)

- [x] **T-168** Rewrite `useTransactions` to read ALL transactions from localDb as primary source (3h) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 3`
- [x] **T-169** Subscribe `useTransactions` to localDb change events, remove 30s polling and `lastUpdate` prop (1h) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 3`

### Phase 14.4 — Fix DashboardCharts

- [x] **T-170** Rewrite `DashboardCharts` to read from localDb, subscribe to changes, remove server API fetches (2h) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 4`

### Phase 14.5 — Fix Sync Engine server_id Mapping

- [x] **T-171** Update `POST /api/sync/push` to return `server_id` for inserted records (1h) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 5`
- [x] **T-172** Update `syncEngine.pushUnsynced` to save `server_id` on local records after push (1h) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 5`

### Phase 14.6 — Cleanup

- [x] **T-173** Delete `cacheService.ts`, remove all imports (30m) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 6`
- [x] **T-174** Remove `lastUpdate` prop from Ledger and App.tsx (30m) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 6`
- [x] **T-175** Remove `offlineService.ts`, merge unique functionality into syncEngine (1h) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 6`
- [x] **T-176** Simplify `TransactionModal.tsx` — replace fire-and-forget balance update with `adjustAccountBalance()` (30m) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 6`
- [x] **T-177** Simplify `App.tsx` — remove `fetchData` from TransactionModal `onUpdate`, clean up stale props (30m) — `📄 docs/LOCAL_FIRST_READ_PATH_FIX.md:§Phase 6`

---

## Phase 15 — Unified Write Modal (Bugfix Data Flow)

> **Plan**: `📄 plans/UNIFIED_WRITE_MODAL.md`
> **Branch**: `feat/unified-write-modal` (from `feat/local-first`)
> **Status**: all completed ✅

- [x] **T-178** Create `WriteModal.tsx` + `WriteModalForms.tsx` — single modal shell with 7 mode submit handlers, pure form components per mode (4h) — `📄 plans/UNIFIED_WRITE_MODAL.md:§Design`
- [x] **T-179** Add `WriteOperation` type to `src/types.ts` — union type covering all 7 write modes (30m) — `📄 plans/UNIFIED_WRITE_MODAL.md:§Design`
- [x] **T-180** Rewire `App.tsx` — replace independent modals with single `writeOperation` state + `<WriteModal>` (1h) — `📄 plans/UNIFIED_WRITE_MODAL.md:§Step 3`
- [x] **T-181** Remove direct server API calls from `useTransactions.ts` — writes only go to localDb, no optimistic state (2h) — `📄 plans/UNIFIED_WRITE_MODAL.md:§Step 4`
- [x] **T-182** Remove `applyAccountDelta` + `fetchData` balance recompute from `useLocalData.ts` (1h) — `📄 plans/UNIFIED_WRITE_MODAL.md:§Step 5`
- [x] **T-183** Remove `'accounts'` from `syncEngine.ts` SYNC_TABLES + all related getters/markers/putters (1h) — `📄 plans/UNIFIED_WRITE_MODAL.md:§Step 6`
- [x] **T-184** Rewire all components (`Ledger`, `Dashboard`, `LoanManager`, `InvestmentTracker`, `InvestmentDetail`, `TransactionRow`, `TransactionCard`, `LoanGroupCard`) to use `onWriteOperation` prop (3h) — `📄 plans/UNIFIED_WRITE_MODAL.md:§Steps 7-12`
- [x] **T-185** Delete 6 old component files, run tsc --noEmit + build, verify zero errors (1h) — `📄 plans/UNIFIED_WRITE_MODAL.md:§Steps 13-15`

---

---

## Phase 16 — Sync Improvements (Immediate Push + Progress Bar + Reconcile)

> **Plan**: `📄 plans/SYNC_IMPROVEMENTS.md`
> **Branch**: `feat/unified-write-modal`
> **Status**: all completed ✅

- [x] **T-186** Fix `syncState` to emit `'syncing'` state — `setSyncing()` now calls `syncState.setState({ state })`, plugging the gap where `syncNow()` never updated the UI observable (30m) — `📄 plans/SYNC_IMPROVEMENTS.md:§Part 1`
- [x] **T-187** Add real progress tracking to `pushUnsynced()` and `pullChanges()` — emit `progress: { current, total }` via `syncState.setState` per table processed (1h) — `📄 plans/SYNC_IMPROVEMENTS.md:§Part 1`
- [x] **T-188** Add `flushPending()` to `syncEngine.ts` — push-only sync (no pull), fire-and-forget (30m) — `📄 plans/SYNC_IMPROVEMENTS.md:§Part 2`
- [x] **T-189** Wire `flushPending()` after every CRUD — `WriteModal.tsx` handleSubmit, `useTransactions.ts` add/delete, `LoanManager.tsx` delete (1h) — `📄 plans/SYNC_IMPROVEMENTS.md:§Part 2`
- [x] **T-190** Update `OfflineIndicator.tsx` — replace fake `60%` with real progress from props, animate smoothly (30m) — `📄 plans/SYNC_IMPROVEMENTS.md:§Part 3`
- [x] **T-191** Add 5-minute reconcile interval to `startSyncScheduler()` (15m) — `📄 plans/SYNC_IMPROVEMENTS.md:§Part 4`

---

---

## Phase 17 — Three-Layer Alignment (Supabase → IndexedDB → App Types)

> **Plan**: `📄 plans/THREE_LAYER_ALIGNMENT.md`
> **Branch**: `feat/unified-write-modal`
> **Status**: 20/20 complete ✅

### Phase 0 — Supabase Schema Audit & Fix ✅

- [x] **T-200** Verify all 10 tables have `client_id UUID UNIQUE` + `updated_at TIMESTAMPTZ` — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 0`
- [x] **T-201** Add `deleted_at TIMESTAMPTZ` to `members`, `investments`, `investment_returns`, `budgets`, `recurring_transactions` — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 0`
- [x] **T-202** Add `user_id UUID` to `investment_returns` table — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 0`
- [x] **T-203** Run diagnostic query to find records with `client_id IS NULL` — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 0`

### Phase 1 — Canonical Schema Definition ✅

- [x] **T-204** Create `shared/schema.ts` — central field map per entity, canonical definitions — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 1`
- [x] **T-205** Regenerate `shared/types.ts` from `schema.ts` — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 1`
- [x] **T-206** Regenerate `src/types.ts` — app-specific types aligned to canonical schema — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 1`
- [x] **T-207** Regenerate localDb types (`LocalMember`, `LocalAccount`, etc.) aligned to canonical schema — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 1`

### Phase 2 — Fix Sync Engine Push (CRITICAL) ✅

- [x] **T-208** Strip local-only fields (`sync_status`, `_deleted`, `server_id`) before push — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 2`
- [x] **T-209** Map `_deleted` boolean → `deleted_at` timestamp on push — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 2`
- [x] **T-210** Handle `deleted_at` on pull — map to `_deleted: true` locally — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 2`
- [x] **T-211** Include `_deleted` records in unsynced collection so server learns of deletions — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 2`
- [x] **T-212** Strip local-only fields on server side (defense in depth) — `api/routes/sync.ts` — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 2`

### Phase 3 — Fix Type Coercions ✅

- [x] **T-213** Fix `member_id`/`parent_id` type coercion — use server_id→local_id maps in fetchData — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 3`
- [x] **T-214** Fix `linked_transaction_id` type — store as `string | null` in localDb — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 3`
- [x] **T-215** Add missing app types (`LoanSettlement`, `Budget`, `RecurringTransaction`, `Group`) to `src/types.ts` — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 3`
- [x] **T-216** Add string union types to localDb (`type`, `status` fields instead of plain `string`) — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 3`

### Phase 4 — Align IndexedDB Schema ✅

- [x] **T-217** Add missing fields to localDb types (`currency`, `lender_name`, `created_at`, `transaction_id`, etc.) — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 4`

### Phase 5 — Stale Data Cleanup ✅

- [x] **T-218** Add startup schema migration check in `localDb.ts:init` — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 5`
- [x] **T-219** Run full verification suite (tsc ✅, build ✅) — `📄 plans/THREE_LAYER_ALIGNMENT.md:§Phase 6`

---

## Phase 18 — Sync Toast & Ledger Sync Indicators

> **Branch**: `feat/local-first`
> **Status**: completed

- [x] **T-220** Create `SyncToast` component — slides down from header during sync with real progress, shows tick mark + item count on completion (1h)
- [x] **T-221** Replace `OfflineIndicator` syncing animation with `SyncToast` in `App.tsx` (30m)
- [x] **T-222** Add `sync_status` to `Transaction` type + `toUiTransaction` mapping (15m)
- [x] **T-223** Add sync status icons (pending/synced) beside balance column in `TransactionRow` and `TransactionCard` (30m)

---

## Phase 19 — Bug Fixes (45 bugs from codebase analysis) ✅

> **Source**: `docs/BUG_REPORT.md`
> **Status**: 44/44 complete ✅ (T-264 already done, T-258 handled via batch 4)
>
> ### Branching Strategy
>
> ```
> feat/local-first
>   └── fix/all-bugs (main bug fixes branch)
>         ├── fix/batch-1-sync-engine (from fix/all-bugs) → merge back → delete
>         ├── fix/batch-2-auth-service (from fix/all-bugs) → merge back → delete
>         ├── fix/batch-3-cascade-deletes (from fix/all-bugs) → merge back → delete
>         ├── fix/batch-4-logout-auth (from fix/all-bugs) → merge back → delete
>         ├── fix/batch-5-local-db (from fix/all-bugs) → merge back → delete
>         ├── fix/batch-6-use-local-data (from fix/all-bugs) → merge back → delete
>         ├── fix/batch-7-app-state (from fix/all-bugs) → merge back → delete
>         └── fix/batch-8-individual (from fix/all-bugs) → merge back → delete
> ```
>
> **Workflow per batch**:
> 1. Create `fix/batch-N-name` from `fix/all-bugs`
> 2. Fix bugs in that batch
> 3. Commit with task references
> 4. Merge back to `fix/all-bugs`
> 5. Delete `fix/batch-N-name`
>
> **After all batches**: Push `fix/all-bugs` → merge into `dev`

### Batch 1: Sync Engine Core (12 bugs) — CRITICAL + HIGH
**File**: `src/services/syncEngine.ts`
**Est. time**: 4-6h
**Risk**: HIGH — core sync logic

- [x] **T-224** BUG-002: Implement `markTableSynced` for all 6 entity types (1h) — `📄 docs/BUG_REPORT.md:Group 1`
- [x] **T-225** BUG-001: Add promise-based mutex on `_isSyncing` to prevent race conditions (1h) — `📄 docs/BUG_REPORT.md:Group 1`
- [x] **T-226** BUG-003: Fix pull FK translation — skip record or queue for retry instead of silent corruption (1h) — `📄 docs/BUG_REPORT.md:Group 1`
- [x] **T-227** BUG-012: Move `resetStaleAccountPending()` before FK map construction (30m) — `📄 docs/BUG_REPORT.md:Group 1`
- [x] **T-228** BUG-035: Add retry queue for records with untranslatable FKs (1h) — `📄 docs/BUG_REPORT.md:Group 1`
- [x] **T-229** BUG-017/018: Surface push/pull errors to syncState (not silently swallow) (30m) — `📄 docs/BUG_REPORT.md:Group 1`
- [x] **T-230** BUG-021: Replace `as never[]` with proper type narrowing in `upsertFromServer` (30m) — `📄 docs/BUG_REPORT.md:Group 1`
- [x] **T-231** BUG-036: Make sync timestamp update atomic with upsert (30m) — `📄 docs/BUG_REPORT.md:Group 1`
- [x] **T-232** BUG-039: Add NaN guard on `updated_at` comparison in LWW logic (15m) — `📄 docs/BUG_REPORT.md:Group 1`
- [x] **T-233** BUG-009: Strip `deleted_at` from pull records when null (15m) — `📄 docs/BUG_REPORT.md:Group 1`
- [x] **T-234** BUG-007: Clear stale listeners on HMR (dev only, low priority) (15m) — `📄 docs/BUG_REPORT.md:Group 1`

### Batch 2: Auth Service (4 bugs) — CRITICAL + HIGH
**File**: `src/services/authService.ts`
**Est. time**: 2-3h
**Risk**: MEDIUM — auth flow

- [x] **T-235** BUG-016: Fix token refresh retry — re-inject cookies or use refreshed session (1h) — `📄 docs/BUG_REPORT.md:Group 2`
- [x] **T-236** BUG-005: Return unsubscribe function from `onAuthStateChange` (30m) — `📄 docs/BUG_REPORT.md:Group 2`
- [x] **T-237** BUG-027: Add `credentials: 'same-origin'` to all fetch calls (15m) — `📄 docs/BUG_REPORT.md:Group 2`
- [x] **T-238** BUG-037: Show toast when guest mode blocks API calls (15m) — `📄 docs/BUG_REPORT.md:Group 2`

### Batch 3: API Cascade Deletes (3 bugs) — HIGH
**Files**: `api/db/accounts.ts`, `api/db/loans.ts`, `api/db/groups.ts`
**Est. time**: 2-3h
**Risk**: MEDIUM — server-side only

- [x] **T-239** BUG-030: Cascade soft-delete transactions when account is deleted (1h) — `📄 docs/BUG_REPORT.md:Group 5`
- [x] **T-240** BUG-031: Cascade soft-delete transactions + settlements when loan is deleted (1h) — `📄 docs/BUG_REPORT.md:Group 5`
- [x] **T-241** BUG-032: Warn user before orphaning child accounts on group delete (30m) — `📄 docs/BUG_REPORT.md:Group 5`

### Batch 4: Logout & Auth Flow (3 bugs) — MEDIUM
**File**: `src/hooks/useAuth.ts`
**Est. time**: 1-2h
**Risk**: LOW — logout edge cases

- [x] **T-242** BUG-019: Replace `localStorage.clear()` with app-specific key cleanup (30m) — `📄 docs/BUG_REPORT.md:Group 3`
- [x] **T-243** BUG-020: Call `stopSyncScheduler()` in `handleLogout` (15m) — `📄 docs/BUG_REPORT.md:Group 3`
- [x] **T-244** BUG-038: Set `authStatus` to `'guest'` when server unreachable (not `'authenticated'`) (30m) — `📄 docs/BUG_REPORT.md:Group 3`

### Batch 5: Local DB (5 bugs) — MEDIUM
**File**: `src/services/localDb.ts`
**Est. time**: 1-2h
**Risk**: LOW — local data operations

- [x] **T-245** BUG-004: Wait for sync to complete before `emptyBin` hard-deletes (30m) — `📄 docs/BUG_REPORT.md:Group 4`
- [x] **T-246** BUG-015: Add `investment_returns`, `budgets`, `recurring_transactions` to `emptyBin` (15m) — `📄 docs/BUG_REPORT.md:Group 4`
- [x] **T-247** BUG-014: Only notify changed accounts in `recalculateAllBalances` (30m) — `📄 docs/BUG_REPORT.md:Group 4`
- [x] **T-248** BUG-010: Rename shadowed `now` variable to avoid confusion (5m) — `📄 docs/BUG_REPORT.md:Group 4`
- [x] **T-249** BUG-034: Make `recalculateAllBalances` accept optional account ID filter (30m) — `📄 docs/BUG_REPORT.md:Group 4`

### Batch 6: useLocalData Hook (4 bugs) — MEDIUM
**File**: `src/hooks/useLocalData.ts`
**Est. time**: 1-2h
**Risk**: LOW — data fetching

- [x] **T-250** BUG-040: Consolidate auth-triggered data fetches into single effect (30m) — `📄 docs/BUG_REPORT.md:Group 6`
- [x] **T-251** BUG-013: Ensure member map is built before account upsert in `fetchData` (30m) — `📄 docs/BUG_REPORT.md:Group 6`
- [x] **T-252** BUG-011: Add fallback for undefined member_name in `toApiAccount` (15m) — `📄 docs/BUG_REPORT.md:Group 6`
- [x] **T-253** BUG-006: Memoize `fetchData` with stable deps to prevent polling recreation (15m) — `📄 docs/BUG_REPORT.md:Group 6`

### Batch 7: App.tsx State (5 bugs) — MEDIUM + HIGH
**File**: `src/App.tsx`
**Est. time**: 1-2h
**Risk**: MEDIUM — UI state

- [x] **T-254** BUG-028: Remove `window.__localDb` debug exposure (5m) — `📄 docs/BUG_REPORT.md:Group 7`
- [x] **T-255** BUG-045: Remove duplicate `syncNow()` call from App.tsx useEffect (15m) — `📄 docs/BUG_REPORT.md:Group 7`
- [x] **T-256** BUG-041: Fix `selectedAccountId` type — use `string | null` with `_localId` or handle `0` case (1h) — `📄 docs/BUG_REPORT.md:Group 7`
- [x] **T-257** BUG-042: Add NaN guard on `Number(savedAccountId)` from sessionStorage (15m) — `📄 docs/BUG_REPORT.md:Group 7`
- [x] **T-258** BUG-044: Clear stale `dashboardFilter` from localStorage on logout (15m) — `📄 docs/BUG_REPORT.md:Group 7`

### Batch 8: Individual Fixes (9 bugs) — MEDIUM + LOW
**Various files**
**Est. time**: 2-3h
**Risk**: LOW — isolated fixes

- [x] **T-259** BUG-008: Add null/empty check for `userEmail[0]` in Header.tsx (15m) — `📄 docs/BUG_REPORT.md:Individual`
- [x] **T-260** BUG-025: Add CSRF token validation to auth endpoints (1h) — `📄 docs/BUG_REPORT.md:Individual`
- [x] **T-261** BUG-033: Trigger balance recalc after loan settlement (30m) — `📄 docs/BUG_REPORT.md:Individual`
- [x] **T-262** BUG-029: Add `trust proxy` config for rate limiter behind reverse proxy (15m) — `📄 docs/BUG_REPORT.md:Individual`
- [x] **T-263** BUG-023: Validate `accountId` as number in transactions route (15m) — `📄 docs/BUG_REPORT.md:Individual`
- [x] **T-264** BUG-024: Add `Secure` flag to cookies in production only (15m) — `📄 docs/BUG_REPORT.md:Individual`
- [x] **T-265** BUG-026: Replace naive regex with DOMPurify or proper HTML stripper (30m) — `📄 docs/BUG_REPORT.md:Individual`
- [x] **T-266** BUG-022: Replace type cast with proper type guard in recyclebin route (15m) — `📄 docs/BUG_REPORT.md:Individual`
- [x] **T-267** BUG-043: Store setTimeout ref and clear on unmount in Toast.tsx (15m) — `📄 docs/BUG_REPORT.md:Individual`

---

## Phase 20 — Post-Phase 19 Bug Fixes (4 bugs from verification scan) ✅

> **Source**: `docs/BUG_REPORT.md` §New Findings
> **Branch**: `fix/all-bugs`
> **Status**: completed — merged into `dev`

### Bugs to Fix

- [x] **T-268** BUG-NEW-001: Replace `localStorage.clear()` in `useProfileData.ts` with app-specific key cleanup (15m) — `📄 docs/BUG_REPORT.md:BUG-NEW-001`
- [x] **T-269** BUG-NEW-002: Delete orphaned `OfflineIndicator.tsx` (dead code, never imported) (5m) — `📄 docs/BUG_REPORT.md:BUG-NEW-002`
- [x] **T-270** BUG-NEW-003: Add `_bin_emptied` to `LocalRecord` type, remove `as any` casts in `localDb.ts` and `syncEngine.ts` (15m) — `📄 docs/BUG_REPORT.md:BUG-NEW-003`
- [x] **T-271** BUG-NEW-004: Add try-catch to async functions missing error handling in `useLocalData.ts`, `useTransactions.ts`, `App.tsx` (30m) — `📄 docs/BUG_REPORT.md:BUG-NEW-004`

---

## Remaining — Google Drive Backup (Deferred — requires manual Google Cloud Console setup)

- [ ] **T-153** (Deferred) Create Google Cloud Console project + enable Drive API + OAuth credentials (1h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§8.1`
- [ ] **T-154** (Deferred) Create `supabase/migrations/016_add_google_tokens.sql` — Google OAuth tokens table (30m) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§8.1`
- [ ] **T-155** (Deferred) Create `src/services/googleDriveService.ts` — Google Drive backup/restore (3h) — `📄 plans/LOCAL_FIRST_ARCHITECTURE.md:§8.1`
