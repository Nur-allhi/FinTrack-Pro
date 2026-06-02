# TODO — FinTrack Pro

> Generated from `PLAN/MASTER_PROMPT.md` · 2026-06-02
> **69 completed**, **1 remaining**, **3 partial** (Phases 0–9 done, Phase 10 mostly complete, Phase 11 active)
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

## Phase 10 — Performance & UX Improvements ✅ / ~

> Source: `PLAN/MASTER_PROMPT.md` — Apply App X Performance & UX Patterns
> Branch: `performance/ai-improvements`
> **Status: 15/20 done ✅, 3/20 partial ~, 1 skipped, 1 not started**
> Remaining gaps can be picked up after Phase 11 merges back.

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

- [~] **T-094** Fix animation durations (0.15→0.35, 0.2→0.4) and easings (custom cubic-bezier) on all motion.div transitions (1h) — `📄 MASTER_PROMPT.md:#13` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:7.4,7.5` **Partial — modals/route transitions fixed, but old values remain in ~15 list/card components (TransactionRow, TransactionCard, Dashboard, Sidebar, Ledger, etc.)**
- [~] **T-095** Add `will-change: transform, opacity` to all animated `<motion.div>` and `<motion.button>` elements (30m) — `📄 MASTER_PROMPT.md:#14` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:7.3` **Partial — applied to modals + App.tsx (5 elements), missing from ~20 other motion components**
- [x] **T-096** Add `prefers-reduced-motion` media query to `src/index.css` (15m) — `📄 MASTER_PROMPT.md:#15` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:7.1,7.7`
- [x] **T-097** (Skipped) Staggered list animations — CSS class defined but never applied to components; deferred as low-value (1h) — `📄 MASTER_PROMPT.md:#16` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:1.8,7.6`

### 🗄️ Data Architecture (Cache-First)

- [~] **T-098** Refactor `useAccounts`, `useTransactions`, `useMembers` to cache-first pattern (read IndexedDB first, fetch API in background) (3-4h) — `📄 MASTER_PROMPT.md:#17` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:6.3,6.4` **Partial — cache-first in useTransactions + useOfflineSync (covers accounts/members), but no standalone useAccounts/useMembers hooks**
- [x] **T-099** Update IndexedDB cache after every successful POST/PUT/DELETE (1-2h) — `📄 MASTER_PROMPT.md:#18` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:6.3`
- [x] **T-100** Increase cache TTL to session-length (no expiry) + add "Last synced" indicator (30m) — `📄 MASTER_PROMPT.md:#19` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:6.3`
- [ ] **T-101** (Optional) Add View Transitions API for page navigation in `App.tsx` (1h) — `📄 MASTER_PROMPT.md:#20` `📄 PROJECT_IMPROVEMENT_FINDINGS.md:1.7` **Not implemented — no usage of `document.startViewTransition` in any source file**
>
> ---
>
> ## Phase 11 — Obsidian Theme (Design Polish)
>
> > Source: `design.md` — Apply the Obsidian dark palette to the entire app
> > Branch: `design/obsidian-theme`
> > **Merge order**: `design/obsidian-theme` → `performance/ai-improvements` → `main`
>
> ### 🎨 Design Token Implementation
>
> - [ ] **T-102** Map `design.md` tokens to Tailwind config — colors, typography, spacing, rounded, component tokens (1-2h)
> - [ ] **T-103** Replace hardcoded colors across all components with design token classes (3-4h)
>
> ### 🖌️ Component Audit
>
> - [ ] **T-104** Audit and update Card, Button, Surface components against `design.md` component specs (2h)
> - [ ] **T-105** Audit typography (display, h1, body, label) across all pages to match `design.md` (1h)
> - [ ] **T-106** Ensure single-accent rule — Tertiary (`#A78BFA`) used for exactly one action per screen (1h)
>
> ### ✅ Design QA
>
> - [ ] **T-107** Verify contrast ratios meet WCAG AA on Obsidian surfaces (1h)
> - [ ] **T-108** Final visual regression check across all routes (1h)
