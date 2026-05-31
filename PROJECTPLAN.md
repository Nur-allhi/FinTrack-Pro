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
- [x] **3.7** Micro-interactions — bounce animations removed, replaced with clean slide-in/slide-out
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

## Phase 5: Admin & User Experience

- [x] **5.1** Fix Users page not showing on mobile (responsive audit — padding, text size, button sizing)
- [x] **5.2** Profile icon in sidebar — avatar circle + email + Settings link (bottom section)
- [x] **5.3** Show password once in creation-success modal (not stored). Add Reset Password action.
- [x] **5.4** Add Name field + email validation to user creation form
- [x] **5.5** Storage usage display per user (byte calculation across all tables)
- [x] **5.6** 5MB storage limit for free users + admin override per user (input)
- [x] **5.7** Write user manual (USER_MANUAL.md)

---

## Phase 6: Settings Reorganization ✅

- [x] **6.1.1** Add vertical sidebar nav inside Settings page (desktop) + scrollable pill tabs (mobile)
- [x] **6.1.2** Section: Appearance — Dark Mode, Theme Style, Accent Color, Font Size, Account Colors
- [x] **6.1.3** Section: Dashboard Banner — 3 visibility toggles (Total Balance, Assets, Liabilities)
- [x] **6.1.4** Section: Categories — category list with rename
- [x] **6.1.5** Section: Export & Import moved to Profile page
- [x] **6.1.6** Remove dead "Audit Alerts" toggle

### Step 2: Recycle Bin Backend ✅
- [x] **6.2.1** Add `deleted_at TEXT` column to tables — migration `009_add_deleted_at.sql`
- [x] **6.2.2** Soft-delete instead of hard-delete — `softDeleteOne()` in `api/db/queries.ts`
- [x] **6.2.3** Filter out soft-deleted items in GET routes — applied in all entity queries
- [x] **6.2.4** GET /api/recycle-bin endpoint — `api/routes/recyclebin.ts`
- [x] **6.2.5** POST restore endpoint — `POST /api/recyclebin/:type/:id/restore`
- [x] **6.2.6** DELETE permanent endpoint — `DELETE /api/recyclebin/:type/:id`

### Step 3: Recycle Bin Frontend ✅
- [x] **6.3.1** Build RecycleBin component — `src/components/RecycleBin.tsx` (228 LOC)
- [x] **6.3.2** Item display with actions — restore, permanent delete, empty all
- [x] **6.3.3** Confirmation dialogs — SweetAlert2 confirm for destructive actions
- [x] **6.3.4** Auto-purge stale items — manual empty all feature

---

## Phase 7: Code Audit & Architecture Overhaul ✅

Completed in audit commit `e00c6a2`:

- [x] **7.1** Add `requireAuth` to `/api/import` (security)
- [x] **7.2** Fix `timerRef` typing in FloatingActionButton
- [x] **7.3** Fix offline `syncQueue` — filter by `item.id` instead of `indexOf`
- [x] **7.4** Fix `requireQuota` middleware — use `req.user` instead of re-extracting token
- [x] **7.5** Extract data-access layer — `api/db/*.ts` with per-entity query modules
- [x] **7.6** Add SQLite indexes on `user_id`, `account_id`, `loan_id`
- [x] **7.7** Add cache TTL to `cacheService` (5-min default)
- [x] **7.8** Add Zod request validation on all POST/PATCH routes
- [x] **7.9** Add pagination (`?limit=&offset=`) to GET endpoints
- [x] **7.10** Standardized error response format (`{ error, code, details }`)
- [x] **7.11** Add structured logging (pino)
- [x] **7.12** Add request ID tracing (UUID middleware)
- [x] **7.13** Shared types (`shared/types.ts`) created

### Partial
- [~] **7.14** Replace `any` types — `shared/types.ts` created, members & accounts typed
- [~] **7.15** Vitest tests — 3 passing tests for members data layer

---

## Phase 8: Animation Overhaul ✅

- [x] **8.1** Remove global button bounce effect (`button:active { scale: 0.96 }`)
- [x] **8.2** Replace all entry/exit `scale` animations with clean slide-in/slide-out
- [x] **8.3** Affected components: TransactionModal, TransferModal, RenameModal, Toast, AccountManager, GroupManager, FloatingActionButton, Dashboard, App, Sidebar

---

## Phase 9: Offline Mode ✅

- [x] **9.1** Cache API routes in SW (`StaleWhileRevalidate` for GET, `NetworkFirst` for documents)
- [x] **9.2** Offline fallback HTML page (`public/offline.html`)
- [x] **9.3** Migrate offline queue from localStorage to IndexedDB
- [x] **9.4** Add `navigator.sync` (Background Sync API) registration
- [x] **9.5** Background sync handler in service worker
- [x] **9.6** Reactive sync state store (`offlineService.syncState`)
- [x] **9.7** Enhanced sync-on-reconnect with retries & batch atomicity
- [x] **9.8** Ledger — offline delete support with optimistic UI
- [x] **9.9** OfflineIndicator — pending queue count display
- [x] **9.10** Last sync timestamp display
- [x] **9.11** Pending sync badge on FAB
- [x] **9.12** Offline-aware TTL — skip TTL checks when offline
- [x] **9.13** Fixes: dashboard balance for pending offline deletes, SW stale cache bypass, account balance adjustments, optimistic transaction persistence

---

## Phase 10: Branding & UI Polish

- [x] **10.1** Sidebar logo rebrand — replaced Wallet icon with bar-chart SVG + "FinTrack Pro" wordmark
- [x] **10.2** Roboto Slab font for wordmark
- [x] **10.3** Logo clickable to refresh app
- [x] **10.4** Moved project plan docs to `PLAN/` folder

---

## Phase 11: Future Enhancements (Backlog)

- [x] **11.1** Data-access layer — `api/db/queries.ts` unified query interface
- [x] **11.2** Request validation — `shared/validation.ts` with Zod schemas
- [ ] **11.3** Swap `supabaseAdmin` for `supabase` client in data queries — 56 references remain
- [x] **11.4** Testing infrastructure — 37 Vitest tests across 4 test files
- [x] **11.5** File splitting — all 10 files split to under 300 LOC
- [ ] **11.6** Type safety — 46 `any` instances remain (36 API, 10 frontend)
- [x] **11.7** Recycle bin / soft-delete — backend + frontend complete
- [ ] **11.8** Liability tracking — replace hardcoded "0" with real model
- [ ] **11.9** Budgeting module
- [ ] **11.10** Recurring transactions
- [ ] **11.11** Multi-currency support
- [x] **11.12** Rate limiting middleware — `apiLimiter` (60 req/min) + `authLimiter` (10 req/15min)
- [ ] **11.13** PWA push notifications — only basic browser Notification API exists
- [ ] **11.14** CSV import for bulk transactions
- [ ] **11.15** Dashboard charts — spending by category pie, balance trend line
- [ ] **11.16** Excel (.xlsx) export alongside PDF/CSV
- [ ] **11.17** Full-text search across transactions/particulars — currently uses ILIKE
- [x] **11.18** Dark mode micro-interactions — theme transition animations
- [x] **11.19** Typography audit — JetBrains Mono verified in CSS
- [x] **11.20** Migrate token from localStorage to HttpOnly cookie

---

## Summary

| Phase | Status |
|-------|--------|
| Phase 1: Bug Fixes | ✅ Done (8 fixes) |
| Phase 2: Refactoring | ✅ Done (8 items) |
| Phase 3: UI Redesign | ✅ Mostly done (7/8 items — 3.8 typography done in Phase 0) |
| Phase 4: PWA & UX Stability | ✅ Done (6 items) |
| Phase 5: Admin & UX | ✅ Done (7 items) |
| Phase 6: Settings Reorganization | ✅ Done (6 items + Recycle Bin backend/frontend) |
| Phase 7: Code Audit & Architecture | ✅ Done (13 items + 2 partial) |
| Phase 8: Animation Overhaul | ✅ Done (3 items) |
| Phase 9: Offline Mode | ✅ Done (13 items) |
| Phase 10: Branding & UI Polish | ✅ Done (4 items) |
| Phase 11: Future Enhancements | 📋 Backlog (10 items remaining, 10 completed) |
