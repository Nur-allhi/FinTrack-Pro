# FinTrack Pro — Project Update Plan

## Phase 1: Bug Fixes ✅

- [x] **1.1** Dashboard buttons — wired Transfer Funds and Generate Report
- [x] **1.2** Settings export — JSON download for accounts + members
- [x] **1.3** Ledger download — CSV export of transactions
- [x] **1.4** Report Generator — memberId filter applied
- [x] **1.5** Liabilities card — hidden behind setting (no liability tracking yet)
- [x] **1.6** Dashboard visibility toggles — showCurrentAssets/showLiabilities wired
- [x] **1.7** Grid/List toggle — functional grid and list views
- [x] **1.8** Gemini model — configurable via GEMINI_MODEL env var

## Phase 2: Refactoring ✅

- [x] **2.1** Shared `DebitCreditToggle` component extracted
- [x] **2.2** Toast notification system (`ToastProvider` + `useToast`)
- [x] **2.3** Loading states on submit buttons (AccountManager, MemberManager)
- [x] **2.4** Dead settings cleaned up
- [x] **2.5** Debit/credit toggle deduplicated
- [x] **2.6** Security warnings in .env and api/config.ts
- [x] **2.7** Optimistic update rollback in TransactionModal
- [x] **2.8** Data export implemented

## Phase 3: UI Redesign

- [x] **3.1** Dashboard hero — hardcoded placeholders removed, values are now real or hidden
- [x] **3.2** Mobile responsiveness — card/table split on Ledger, responsive grid layouts
- [x] **3.3** Empty states — added to MemberManager and AccountManager
- [x] **3.4** Toast system — done in Phase 2
- [x] **3.5** Color palette — aligned with DESIGN.md spec (Coinbase tokens)
- [x] **3.6** Dark mode — CSS variable system + toggle in Settings
- [ ] **3.7** Micro-interactions — theme transition animations added
- [ ] **3.8** Typography audit — Inter/JetBrains Mono verified in CSS

---
## Phase 4: PWA & UX Stability

- [x] **4.1** PWA support — vite-plugin-pwa, service worker, manifest, offline caching
- [x] **4.2** SVG + PNG icons with white background at all required sizes
- [x] **4.3** Offline indicator banner + offline service with sync queue
- [x] **4.4** Auto data fetch on login (smooth dashboard load, no manual refresh)
- [x] **4.5** Admin check runs on auth — Users tab appears without refresh
- [x] **4.6** Manual refresh button in Settings with toast feedback

---

## Phase 5: Admin & User Experience (Current)

### P0 — Immediate

- [x] **5.1** Fix Users page not showing on mobile (responsive audit — padding, text size, button sizing)
- [x] **5.2** Profile icon in sidebar — avatar circle + email + Settings link (bottom section)

### P1 — High Priority

- [x] **5.3** Show password once in creation-success modal (not stored). Add Reset Password action.
- [x] **5.4** Add Name field + email validation to user creation form

### P2 — Medium Priority

- [x] **5.5** Storage usage display per user (byte calculation across all tables)
- [x] **5.6** 5MB storage limit for free users + admin override per user (input)
- [x] **5.7** Write user manual (USER_MANUAL.md)

---

## Phase 6: Settings Reorganization & Recycle Bin (Current)

### Step 1: Settings Sub-Navigation
- [ ] **6.1.1** Add vertical sidebar nav inside Settings page (desktop) + scrollable pill tabs (mobile)
- [ ] **6.1.2** Section: **Appearance** — Dark Mode, Theme Style, Accent Color, Font Size, Account Colors
- [ ] **6.1.3** Section: **Dashboard Banner** — 3 visibility toggles (Total Balance, Assets, Liabilities)
- [ ] **6.1.4** Section: **Categories** — category list with rename (same as current)
- [ ] **6.1.5** Section: **Export & Import** — Refresh, Export JSON, Import JSON, Clear All Data
- [ ] **6.1.6** Remove dead "Audit Alerts" toggle

### Step 2: Recycle Bin Backend
- [ ] **6.2.1** Add `deleted_at TEXT` column to `transactions`, `accounts`, `members` tables (Supabase migration + SQLite)
- [ ] **6.2.2** Change DELETE routes to soft-delete (set `deleted_at` timestamp) instead of hard-delete
- [ ] **6.2.3** Update GET routes to filter out soft-deleted items (`WHERE deleted_at IS NULL`)
- [ ] **6.2.4** New endpoint: `GET /api/recycle-bin` — list all soft-deleted items grouped by table
- [ ] **6.2.5** New endpoint: `POST /api/recycle-bin/:table/:id/restore` — restore item (clear `deleted_at`)
- [ ] **6.2.6** New endpoint: `DELETE /api/recycle-bin/:table/:id` — permanent hard-delete

### Step 3: Recycle Bin Frontend
- [ ] **6.3.1** Build RecycleBin component with 3 tabs (Transactions, Accounts, Members)
- [ ] **6.3.2** Each item shows: name, type, deleted date, Restore + Permanent Delete buttons
- [ ] **6.3.3** Confirmation dialogs for permanent delete
- [ ] **6.3.4** Auto-purge stale items after 30 days (backend cron on list)

---

## Phase 7: Future Enhancements (Backlog)

- [ ] **7.1** Data-access layer — extract Supabase/SQLite branching from all routes
- [ ] **7.2** Request validation (Zod schemas shared frontend/backend)
- [ ] **7.3** Testing infrastructure (Vitest + smoke tests)
- [ ] **7.4** Split large components (< 300 LOC)
- [ ] **7.5** Liability tracking (remove hardcoded "0")
- [ ] **7.6** Reusable Toggle component
- [ ] **7.7** Consolidate TransactionForm / TransactionModal

---

## Summary

| Phase | Status |
|-------|--------|
| Phase 1: Bug Fixes | ✅ Done (8 fixes) |
| Phase 2: Refactoring | ✅ Done (8 items) |
| Phase 3: UI Redesign | ✅ Mostly done (6/8 items) |
| Phase 4: PWA & UX Stability | ✅ Done (6 items) |
| Phase 5: Admin & UX | ✅ Done (7 items) |
| Phase 6: Settings & Recycle Bin | 🔄 In progress |
| Phase 7: Future | 📋 Backlog |
