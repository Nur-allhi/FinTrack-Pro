# Handoff — 15 May 2026 (Session 2)

## Session Summary

Code review-driven cleanup and feature expansion: fixed critical bugs (balance sync, type safety, overflow clipping), added custom DatePicker calendar, guest login, data export/import, category management, and improved mobile layouts with card-based filter panels.

## Changes

### Bug Fixes (Code Review)
- **Ledger balance sync** — restored `onUpdate()` calls after save/delete so parent account balances refresh (`src/components/Ledger.tsx`)
- **TypeScript types** — replaced `[] as any[]` with proper `(Transaction & { runningBalance: number })[]` in running balance reduce (`src/components/Ledger.tsx`)
- **TransactionForm types** — `newTx` prop typed with `TransactionFormState` interface replacing `any` (`src/components/TransactionForm.tsx`)
- **Truncation math** — fixed `> 32` → `> 30` to match `slice(0, 30)` (`src/components/Ledger.tsx`)
- **Category filter reset** — removed `setCategoryFilter(null)` from useEffect to preserve filter across re-fetches (`src/components/Ledger.tsx`)
- **File sizes** — split Ledger (446→292), Dashboard (368→327), ReportGenerator (350→303). Extracted `AccountCard`, PDF utilities, and `ledgerPdf.ts`

### Custom DatePicker (`src/components/DatePicker.tsx`)
- Calendar dropdown with day grid (Su–Mo headers) and month/year navigation
- Two modes: **date** (day grid) and **month** (4×3 month grid)
- Portal-rendered to `document.body` with viewport boundary detection (right-edge shift + bottom-edge flip)
- Click-outside detection using `containerRef` + `portalRef` to prevent premature close
- Responsive panel width (`Math.min(280, vw - 48)`)
- Replaced native `<input type="date">` across 6 files: TransactionForm, TransactionModal, TransferModal, InvestmentTracker (×2), ReportGenerator (×2), Ledger (month/date/range modes)

### Select Component (`src/components/Select.tsx`)
- Portal-based dropdown to prevent `overflow-hidden` parent clipping
- Fixed positioning tied to button's `getBoundingClientRect()` with viewport boundary checks
- Click-outside event changed from `mousedown` → `click` to fix premature close bug

### Guest Login (`src/components/Login.tsx`, `api/index.ts`)
- "Guest Access" button below sign-in form
- `POST /api/login/guest` endpoint returns dev session token

### Ledger UI Overhaul
- **Desktop toolbar** — consolidated 3 rows (entries header, date filters, category) into 1 compact flex row
- **Mobile toolbar** — hidden behind "Filters" button with card-based expandable panel
- **Category rename** — moved from browser `prompt()` to styled `RenameModal` component

### Dashboard Mobile Filters
- Type filter pills hidden behind "Filters" button on mobile
- Card-based expandable panel with all 6 filter options
- Button highlights when any filter is active

### Settings — Data Governance
- **Export** — `GET /api/export` dumps members, accounts, transactions, investments, investment_returns as JSON
- **Import** — file picker → `POST /api/import` deletes existing data, bulk-inserts imported records (supports both SQLite and Supabase)
- **Clear All Data** — double-confirmation → `DELETE /api/export/clear-all` wipes all 5 tables + `localStorage.clear()` + `sessionStorage.clear()`, auto-reloads

### Settings — Categories
- Lists all categories fetched from `GET /api/transactions/categories`
- Rename via `RenameModal` → `PATCH /api/transactions/category/rename`

### Sidebar
- Changed from `md:relative` to `md:fixed` so sidebar stays in place when content scrolls
- Main content offset with `md:pl-64`

### GroupManager
- Now receives `lastUpdate` prop to avoid redundant API calls on every navigation

### Loading Screen (`src/components/LoadingScreen.tsx`)
- Animated sliding progress bar replacing static "Loading..." text and spinner
- Full-screen mode for auth check, inline mode for lazy-loaded content

## New Files
- `src/components/DatePicker.tsx` — custom calendar date picker
- `src/components/RenameModal.tsx` — styled rename modal
- `src/components/LoadingScreen.tsx` — animated loading bar
- `src/components/AccountCard.tsx` — extracted from Dashboard
- `src/utils/pdf.ts` — shared PDF render helpers
- `src/utils/ledgerPdf.ts` — Ledger-specific PDF export
- `api/routes/export.ts` — export/import/clear-all endpoints

## Files Changed
- `src/components/Ledger.tsx` — critical fixes, refactor, toolbar, mobile filters, DatePicker
- `src/components/Select.tsx` — portal-based dropdown
- `src/components/Dashboard.tsx` — mobile filter card
- `src/components/TransactionForm.tsx` — DatePicker + typed props
- `src/components/TransactionModal.tsx` — DatePicker
- `src/components/TransferModal.tsx` — DatePicker
- `src/components/InvestmentTracker.tsx` — DatePicker (×2)
- `src/components/ReportGenerator.tsx` — DatePicker, show-all, PDF utils
- `src/components/Settings.tsx` — categories, export, import, clear-all
- `src/components/Login.tsx` — guest login
- `src/components/GroupManager.tsx` — lastUpdate prop
- `src/components/layout/Sidebar.tsx` — fixed positioning
- `src/App.tsx` — loading screen, sidebar offset, GroupManager lastUpdate
- `api/index.ts` — guest login route, export/import routes
- `api/routes/transactions.ts` — category rename endpoint
