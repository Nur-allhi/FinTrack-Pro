# Session Log — FinTrack Pro

> Cumulative record of all development sessions.
> **AI agents: Read this file at the start of every session to understand project context.**

---

## Quick Reference — Last Session

> **Session 29** — 4 June 2026 (Three-Layer Schema Alignment)
> **Branch**: `feat/unified-write-modal`
> **Tasks**: T-200, T-201, T-202, T-203, T-204, T-205, T-206, T-207, T-208, T-209, T-210, T-211, T-212, T-213, T-214, T-215, T-216, T-217, T-218, T-219
> **Status**: completed
> **Summary**: Fixed all 17 schema mismatches across Supabase, IndexedDB, and App types. Phase 0: added deleted_at/user_id columns via Management API, fixed 261 orphaned records. Phase 1: created shared/schema.ts canonical definitions, regenerated all type files. Phase 2: sync engine push now strips local-only fields and maps _deleted↔deleted_at; pull handles deleted_at; server-side defense-in-depth added. Phase 3: fixed FK type coercions via server_id→local_id maps. Phase 4: IndexedDB v2 with proper indexes. tsc clean, build passes. Commit 6ab89e9.

---

## Quick Reference — Last Session

> **Session 28** — 4 June 2026 (Unified Write Modal)
> **Branch**: `feat/unified-write-modal` (from `feat/local-first`)
> **Tasks**: T-178, T-179, T-180, T-181, T-182, T-183, T-184, T-185
> **Status**: completed
> **Summary**: Replaced all 6 independent write modals (TransactionModal, TransferModal, TransactionForm, LoanForm, SettleModal, GroupSettleModal) with a single Unified Write Modal routing all writes through localDb → sync engine. Removed direct server API calls from useTransactions, removed applyAccountDelta + fetchData recompute from useLocalData, removed 'accounts' from syncEngine SYNC_TABLES. All inline edit forms removed from Ledger, LoanManager, InvestmentTracker, InvestmentDetail. Added WriteOperation type to src/types.ts. Deleted 6 old component files. tsc --noEmit clean, build passes.

---

## Session 27 — 4 June 2026 (Phase 14 — Local-First Read Path Fix)

> **Branch**: `feat/local-first`
> **Tasks**: T-164, T-165, T-166, T-167, T-168, T-169, T-170, T-171, T-172, T-173, T-174, T-175, T-176, T-177
> **Status**: completed

### Summary
Implemented the full Phase 14 plan from `docs/LOCAL_FIRST_READ_PATH_FIX.md`. localDb is now the single source of truth for the UI. useTransactions, DashboardCharts, and useLocalData all read directly from IndexedDB via localDb and subscribe to change events. Writes go to localDb first, then best-effort server sync. cacheService and offlineService are deleted (functionality merged into syncEngine + localDb). Production build passes.

### Changes

**localDb.ts (532 LOC, +81):**
- Added `onChange(store, listener)` pub/sub returning unsubscribe, plus `notify(store, record, action)`.
- `put`/`putAll`/`remove` now call `notify` after the IDB transaction commits.
- Added `adjustAccountBalance(accountLocalId, delta)` — atomic read-update-write with `notify('accounts', …)`.
- Added `markPushed(store, mappings)` — atomic `withDB` transaction that sets `server_id` + `sync_status='synced'` and notifies.
- Added `getUnsyncedCount()` for the pending-count indicator.
- Refactored `restoreItem`/`permanentDelete`/`emptyBin` to use the new helper.

**useTransactions.ts (217 LOC, −97):**
- `addOrUpdateTransaction` writes to `localDb.putTransaction` first, then `adjustAccountBalance`, then attempts server API; on success stores `server_id` and marks `sync_status='synced'`.
- `deleteTransaction` soft-deletes in localDb first, adjusts balance, then best-effort server DELETE.
- Read path: `localDb.getTransactions()` → `toUiTransaction` map → sort by date desc. Subscribes to `localDb.onChange('transactions', …)`.
- Removed `lastUpdate` parameter, `cacheService` import, `offlineService` import, 30s polling, `fetchTransactions` API call.

**DashboardCharts.tsx (176 LOC):**
- Fully rewritten to read from `localDb.getTransactions()` and subscribe to `localDb.onChange('transactions', …)`.
- Removed all `authService.apiFetch` calls.

**TransactionModal.tsx (224 LOC):**
- `handleSubmit` looks up `targetAccount` by `server_id`, then `putTransaction` + `adjustAccountBalance(targetAccount.id, amount)` awaited atomically.

**syncEngine.ts (347 LOC, +73):**
- Added `syncState`, `isOnline`, `onOnline`, `onOffline`, `getLastSync`, `setLastSync`, `initPendingCount`.
- `pushUnsynced` now uses `localDb.markPushed` to set `server_id` + `sync_status='synced'` on local records.

**api/routes/sync.ts:**
- `POST /push` now returns `ids: [{ client_id, server_id }]` for inserts/updates; results type extended.

**App.tsx (338 LOC, −2):**
- `cacheService` and `offlineService` imports removed.
- `Ledger` `onUpdate` no longer calls `fetchData` (onChange subs handle refresh).
- `TransactionModal` `onUpdate` replaced with no-op (onChange subs handle refresh).

**useLocalData.ts (360 LOC, +13):**
- Added `localDb.onChange('accounts', …)` and `localDb.onChange('members', …)` subscriptions — re-reads and sets state when localDb changes.
- Imports `syncState`/`isOnline`/`onOnline`/`onOffline`/`getLastSync`/`setLastSync`/`initPendingCount` from `syncEngine` (replacing `offlineService` import).

**useAuth.ts:**
- `initPendingCount` import moved from `offlineService` to `syncEngine`.

**useThemeEffects.ts:**
- Removed unused `cacheService` import.

**Deleted:**
- `src/services/cacheService.ts`
- `src/services/offlineService.ts` (functionality merged into syncEngine)
- `src/hooks/useOfflineSync.ts` (legacy unused)
- `src/tests/offlineService.test.ts` (10 tests; offlineService no longer exists)

### Files Changed
- `src/services/localDb.ts` — pub/sub + adjustAccountBalance + markPushed + getUnsyncedCount
- `src/hooks/useTransactions.ts` — local-first read/write path
- `src/hooks/useLocalData.ts` — onChange subscriptions for accounts/members
- `src/hooks/useAuth.ts` — import path update
- `src/hooks/useThemeEffects.ts` — remove unused import
- `src/components/DashboardCharts.tsx` — read from localDb
- `src/components/TransactionModal.tsx` — atomic write
- `src/components/Ledger.tsx` — remove lastUpdate prop
- `src/App.tsx` — remove fetchData from onUpdate wiring
- `src/services/syncEngine.ts` — absorb offlineService + use markPushed
- `api/routes/sync.ts` — return server_id in push results
- `src/services/cacheService.ts` — DELETED
- `src/services/offlineService.ts` — DELETED
- `src/hooks/useOfflineSync.ts` — DELETED
- `src/tests/offlineService.test.ts` — DELETED

### Verification
- `npx tsc --noEmit` — clean
- `npm run build` — succeeds, no errors
- `npx gitnexus detect_changes --repo FinTrack-Pro` — 11 files / 109 symbols / 43 affected processes (expected: core data layer touched)

### Next Steps
- Phase 6 (Google Drive setup) — T-153 / T-154 / T-155 (Deferred)
- Recharts `width/height = -1` warning in `InvestmentDetail.tsx` (leftover from Session 25, out of Phase 14 scope)
- `GroupManager` still references `lastUpdate` (out of T-174 scope; harmless if not used)
- `localDb.ts` (532 LOC), `useLocalData.ts` (360 LOC), `syncEngine.ts` (347 LOC), `App.tsx` (338 LOC) all exceed the 300 LOC rule — consider refactoring in a future task

---

## Session Template

Use this template for new sessions:

```markdown
## Session N — DD MMM YYYY (Short Title)

> **Branch**: `branch-name`
> **Tasks**: T-XXX, T-YYY, T-ZZZ
> **Status**: completed | in-progress | partial

### Summary
Brief description of what was accomplished.

### Changes
- What was changed and why

### Files Changed
- `path/to/file.ts` — what changed

### Verification
- How the changes were verified (tests, lint, etc.)

### Next Steps
- What should be done next (if any)
```

---

## Session History

## Session 24 — 4 June 2026 (Dashboard Balance Fix + Recycle Bin)

> **Branch**: `feat/local-first`
> **Tasks**: Recycle bin deleted transactions, Dashboard instant balance
> **Status**: partial

### Summary

Fixed two issues: (1) Recycle bin not showing deleted transactions because `deleteTransaction` in `useTransactions.ts` never soft-deleted in localDb. (2) Dashboard balance taking ~10s to update after posting a transaction from TransactionModal.

### Changes

**Recycle Bin:**
- `useTransactions.ts:deleteTransaction()` — added `softDeleteLocal()` that finds the localDb transaction by `server_id` and sets `_deleted: true`, `sync_status: 'synced'`. Called on all deletion paths (online, offline, network error).
- Uses `localDb.getTransactions()` (unfiltered scan) instead of indexed lookup to avoid IndexedDB type-mismatch between string/number `account_id`.

**Dashboard Balance:**
- `useLocalData.ts` — added `applyAccountDelta(accountServerId, amount)` that updates `current_balance` in React state synchronously via `setAccounts(prev => prev.map(...))`.
- `TransactionModal.tsx` — changed `onUpdate` signature from `() => void` to `(accountId?: number, amount?: number) => void`. Moved `onUpdate` call before the IndexedDB `getAccounts`/`putAccount` (now fire-and-forget).
- `App.tsx` — wired `applyAccountDelta` to TransactionModal's `onUpdate`.
- Removed `content-visibility: auto` from main motion.div wrapper (can delay browser paint after overlay removal).

### Debug Results

Console logs confirmed:
```
[TransactionModal] calling onUpdate {accountId: 32, amount: -100}
[applyAccountDelta] called {accountServerId: 32, amount: -100, prevCount: 13, found: true, balances: Array(13)}
```

`applyAccountDelta` works correctly — finds the matching account and updates balance. But visual delay persists. Chart recharts error (width/height -1) observed during re-render. Likely the chart component error is delaying/suspending the render pipeline.

### Files Changed
- `src/hooks/useTransactions.ts` — softDeleteLocal helper
- `src/hooks/useLocalData.ts` — applyAccountDelta function
- `src/components/TransactionModal.tsx` — onUpdate signature + fire-and-forget persist
- `src/App.tsx` — wired applyAccountDelta, removed content-visibility:auto

### Next Steps
- Investigate why Dashboard visual update still lags despite confirmed React state update (recharts chart component error suspected)

---

## Session 23 — 4 June 2026 (Deferred Google Drive Tasks)

> **Branch**: `feat/local-first`
> **Tasks**: T-153, T-154, T-155
> **Status**: deferred

### Summary

Deferred Google Drive backup tasks (T-153, T-154, T-155) — requires manual Google Cloud Console setup that cannot be automated.

### Changes

- Updated `docs/TODO.md` — marked T-153, T-154, T-155 as "(Deferred)" with note about manual setup requirement

### Next Steps

- Google Drive integration can be revisited when Google Cloud Console credentials are available
- Local JSON export/import (T-157, T-158) already provides backup functionality

---

## Session 22 — 4 June 2026 (Local-First — Phase 7 Animations & Polish)

> **Branch**: `feat/local-first`
> **Tasks**: T-159, T-160, T-161, T-162, T-163
> **Status**: completed

### Summary

Completed Phase 7 animations & polish. Created AnimatedBalance component with color-flash on value change, enhanced OfflineIndicator with status dots and cloud icons. T-159/160/163 were already implemented in prior sessions.

### Changes

- Created `src/components/AnimatedBalance.tsx` — detects value changes and applies 800ms color-flash (green for increase, red for decrease) with smooth transition
- Updated `src/components/Ledger.tsx` — header balance now uses AnimatedBalance
- Updated `src/components/TransactionRow.tsx` — per-row running balance now uses AnimatedBalance
- Updated `src/components/TransactionCard.tsx` — mobile running balance now uses AnimatedBalance
- Updated `src/components/OfflineIndicator.tsx` — added StatusDot component (green/amber/gray), replaced Wifi icon with Cloud/CloudOff for clearer sync state visualization

### Verification

- `npx tsc --noEmit` passes with zero errors
- `npm run lint` passes

---

## Session 21 — 3 June 2026 (Local-First Architecture — Phase 6)

> **Branch**: `feat/local-first`
> **Tasks**: T-156, T-157, T-158
> **Status**: completed

### Summary

Implemented local JSON export/import for data backup. Created exportService.ts and ImportModal.tsx, updated UserProfile to use local export and preview import modal.

### Changes

- Created `src/services/exportService.ts` — exports all local IndexedDB data to JSON with version, timestamp, userId, strips internal fields (sync_status, _deleted, server_id, updated_at)
- Created `src/components/ImportModal.tsx` — preview modal showing counts of imported data, import with local-wins conflict resolution (skip existing IDs)
- Updated `src/hooks/useProfileData.ts` — replaced server-based export with local export, added onImportData callback for modal integration
- Updated `src/components/UserProfile.tsx` — integrated ImportModal, added state for import data, local export button

### Files Changed

- `src/services/exportService.ts` (new)
- `src/components/ImportModal.tsx` (new)
- `src/hooks/useProfileData.ts` (modified)
- `src/components/UserProfile.tsx` (modified)

### Verification

- `npx tsc --noEmit` passes with zero errors
- `npm run lint` passes
- `npm run build` succeeds

### Next Steps

- Phase 7: Animations & Polish (T-159 to T-163)
- Google Drive integration deferred (T-153, T-154, T-155)

## Session 20 — 3 June 2026 (Local-First Architecture — Phase 5)

> **Branch**: `feat/local-first`
> **Tasks**: T-148 through T-152
> **Status**: completed

### Summary

Implemented the Supabase sync engine: 3 API endpoints (push/pull/initial), client-side sync service with LWW conflict resolution, migration service for existing users, and background sync scheduler with multiple triggers.

### Changes

**T-148 — Sync Engine (src/services/syncEngine.ts):**
- `pushUnsynced()` — collects all pending records, POSTs to /api/sync/push, marks synced locally
- `pullChanges()` — GETs /api/sync/pull?since=, upserts server records to local IndexedDB
- `syncNow()` — full push+pull cycle with dedup (prevents concurrent syncs)
- `initialSync()` — full download for guest→registered migration
- `startSyncScheduler()` — visibilitychange, online, 30s interval triggers
- `onSyncStateChange()` — listener pattern for UI sync indicator

**T-149 — Sync API (api/routes/sync.ts):**
- `POST /api/sync/push` — bulk upsert with LWW conflict detection per record
- `GET /api/sync/pull?since=<timestamp>` — returns all records modified since timestamp
- `POST /api/sync/initial` — full download of all user records
- All endpoints log to sync_log table

**T-150 — Migration Service (src/services/migrationService.ts):**
- `isMigrationNeeded()` — checks if server has data but local is empty
- `migrateServerData()` — downloads server records, assigns client_ids, stores locally
- Handles type conversion from server integer IDs to local UUID format

**T-151 — Sync Triggers (App.tsx):**
- Starts sync scheduler on authentication
- Triggers initial sync on login
- Stops scheduler on logout
- 30s interval + tab visibility + online event

### Files Changed
- `src/services/syncEngine.ts` (new)
- `src/services/migrationService.ts` (new)
- `api/routes/sync.ts` (new)
- `api/index.ts` (registered sync route)
- `src/App.tsx` (sync scheduler lifecycle)

### Verification
- `npx tsc --noEmit` passes with zero errors
- `npm run lint` passes

### Next Steps
- Phase 6: Data Backup (Google Drive + JSON) — T-153 to T-158

---

## Session 19 — 3 June 2026 (Local-First Architecture — Phase 4)

> **Branch**: `feat/local-first`
> **Tasks**: T-143 through T-146
> **Status**: completed

### Summary

Completed guest mode enhancements: guest-aware API short-circuit, guest_id tracking in IndexedDB, SignupNudge component, and transaction-triggered nudge flow.

### Changes

**T-143 — Guest-Aware API Short-Circuit:**
- Added `_guestMode` flag to `authService.ts`
- `apiFetch()` short-circuits for guests (returns 401 without network request)
- `setGuestMode()` export for useAuth to control the flag

**T-144 — Guest ID Tracking:**
- Added `getOrCreateGuestId()` and `getTransactionCount()` to `localDb.ts`
- useAuth initializes guest_id on first guest visit

**T-145 — SignupNudge Component:**
- Created `SignupNudge.tsx` — non-blocking modal with Sign Up / Maybe Later / Never Show Again
- Tracks dismissal via `localDb.setMeta('signup_nudge_dismissed', true)`
- Styled consistently with existing modals (motion/react animations, portal-based)

**T-145b — Nudge Trigger Integration:**
- TransactionModal accepts `onTransactionSaved` callback
- App.tsx manages `showSignupNudge` state
- `checkSignupNudge()` checks transaction count ≥ 5 and not dismissed
- Nudge triggers after each transaction save for guests

### Files Changed
- `src/services/authService.ts` — added `_guestMode`, `setGuestMode()`, guest-aware `apiFetch()`
- `src/hooks/useAuth.ts` — calls `setGuestMode()` and `getOrCreateGuestId()` on auth state changes
- `src/services/localDb.ts` — added `getOrCreateGuestId()`, `getTransactionCount()`
- `src/components/SignupNudge.tsx` — new component
- `src/components/TransactionModal.tsx` — accepts `onTransactionSaved` prop
- `src/App.tsx` — manages nudge state, renders SignupNudge

### Verification
- `npx tsc --noEmit` passes with zero errors
- `npm run lint` passes

### Next Steps
- Phase 5: Supabase Sync Engine (T-148 to T-152)

---

## Session 18 — 3 June 2026 (Local-First Architecture — Phase 3)

> **Branch**: `feat/local-first`
> **Tasks**: T-133 through T-140
> **Status**: completed

### Summary

Converted all 7 component write paths to instant IndexedDB writes. Every mutation now writes to localDb first (1-5ms) instead of making API calls (200-500ms), eliminating loading spinners and enabling offline-first writes.

### Changes

**Component Write Path Migration:**
- **TransactionModal** — Writes transactions to localDb with UUID, removes authService/offlineService calls
- **TransferModal** — Creates 2 linked transactions (debit + credit) in localDb with matching `linked_transaction_id`
- **LoanManager** — Create/update/settle/delete all write to localDb; fetchLoans reads from localDb with toApiLoan mapping
- **MemberManager** — Create writes to localDb, delete uses soft-delete (`_deleted = true`)
- **GroupManager** — Create/update/delete write to localDb, fetchGroups reads from localDb with member name join
- **InvestmentTracker** — Create writes to localDb, fetchInvestments/fetchReturns read from localDb
- **RecycleBin** — Restore/permanent-delete use new localDb helpers, fetchItems reads soft-deleted records

**localDb Additions:**
- `getDeletedItems()` — queries all stores for `_deleted = true` records
- `restoreItem(entityType, id)` — sets `_deleted = false` and marks pending
- `permanentDelete(entityType, id)` — removes record from IndexedDB entirely
- `emptyBin(entityType?)` — removes all soft-deleted records (optionally filtered by type)

**Double-Click Prevention:**
- Added `isWriting` ref pattern to TransactionModal, TransferModal, LoanManager

### Files Changed
- `src/components/TransactionModal.tsx` — localDb write, removed loading state
- `src/components/TransferModal.tsx` — localDb write, removed loading state
- `src/components/LoanManager.tsx` — localDb CRUD, toApiLoan mapping
- `src/components/MemberManager.tsx` — localDb create/delete
- `src/components/GroupManager.tsx` — localDb CRUD with member name join
- `src/components/InvestmentTracker.tsx` — localDb create, local reads
- `src/components/RecycleBin.tsx` — localDb restore/delete/empty
- `src/services/localDb.ts` — added 4 new methods for recycle bin
- `docs/TODO.md` — Phase 3 tasks marked complete
- `CHANGELOG.md` — Phase 3 entry added

### Verification
- `npx tsc --noEmit` passes with zero errors
- `npm run lint` passes

### Next Steps
- Phase 4: Guest Mode + Signup Nudge (T-143 to T-146)

---

## Session 17 — 3 June 2026 (Local-First Architecture — Phase 1-2)

Branch: `feat/local-first`

Completed T-121 through T-132 (Auth System + Local-First IndexedDB Core).

### Phase 1 — Auth System

- **T-121** Created `Signup.tsx` — email/password signup form with validation
- **T-122** Created `ForgotPassword.tsx` — password reset request form
- **T-123** Created `ResetPassword.tsx` — new password form (after email link)
- **T-124** Updated `authService.ts` — added `signUp()`, `resetPassword()`, `updatePassword()` methods
- **T-125** Updated `Login.tsx` — removed Google button, added Sign Up and Forgot Password links, added Continue as Guest button
- **T-126** Updated `useAuth.ts` — new auth state model (`loading | guest | authenticated`), guest mode support
- **T-127** Updated `App.tsx` — auth page routing, guest mode renders app without API calls

### Phase 2 — Local-First IndexedDB Core

- **T-128** Created `localDb.ts` — full IndexedDB schema with 11 object stores, CRUD operations, sync tracking
- **T-129** Created `ids.ts` — UUID generation utility via `crypto.randomUUID()`
- **T-130** Updated `shared/types.ts` — added `client_id`, `updated_at` fields to all entity types
- **T-131** Created `useLocalData.ts` — cache-first pattern, reads from IndexedDB instantly, background API fetch
- **T-132** Updated `App.tsx` — removed `dataReady` gate, renders from local data, settings via localDb

### Files Changed
- `src/components/Signup.tsx` (new)
- `src/components/ForgotPassword.tsx` (new)
- `src/components/ResetPassword.tsx` (new)
- `src/services/localDb.ts` (new)
- `src/utils/ids.ts` (new)
- `src/hooks/useLocalData.ts` (new)
- `src/services/authService.ts` (added signUp, resetPassword, updatePassword)
- `src/hooks/useAuth.ts` (new auth state model)
- `src/components/Login.tsx` (removed Google, added links)
- `src/App.tsx` (auth routing, local data rendering)
- `shared/types.ts` (client_id, updated_at fields)
- `src/types.ts` (Account.member_id accepts string | null)

### Verification
- `npx tsc --noEmit` passes with zero errors
- `npm run lint` passes

---

## Session 16 — 2 June 2026 (Performance Optimization — Phase 9)

### Changes

Completed Phase 9 performance optimization (T-070 through T-081). Main bundle 1,015→733 kB (-28%), SW precache 2,677→1,488 kB (-44%).

**Bundle Optimization**
- Moved server deps (express, sharp, pino, dotenv, tsx) to devDependencies
- Removed dead deps (jspdf-autotable, autoprefixer)
- Added manualChunks vendor splitting: react, supabase, charts, motion, html2canvas
- jspdf and xlsx now dynamically imported on export click (not in page chunks)

**Font & CSS**
- Removed unused fonts (Roboto Slab, Inter:300)
- Google Fonts preloaded via `<link rel="preload">` with display=swap
- Replaced global `* { transition }` with targeted selectors on interactive elements

**React Memoization**
- 8 useMemo wrappers on Dashboard computations
- defaultSettings moved to module scope
- React.memo on AccountCard

**API & Service Worker**
- Removed cache-busting `?_=${Date.now()}` from API calls
- Consolidated duplicate `/api/auth/me` calls
- SW precache excluded lazy vendor chunks

**Docs Cleanup**
- Deleted ERROR.md (empty) and DESIGN.md (Coinbase design system — unrelated)
- Fixed README.md stale references (SQLite fallback, jspdf-autotable)
- Added performance entry to CHANGELOG.md
- Updated docs/AUDIT_REPORT.md with P5 performance section

### Files Changed
vite.config.ts, src/utils/reportPdf.ts, src/utils/ledgerPdf.ts, src/utils/pdf.ts, src/hooks/useAuth.ts, src/components/Dashboard.tsx, src/components/AccountCard.tsx, src/index.css, index.html, package.json, docs/TODO.md, docs/AUDIT_REPORT.md, CHANGELOG.md, README.md, docs/PERFORMANCE_REPORT.md

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
- `docs/AUDIT_REPORT.md`: all 27 issues resolved, no partially-fixed items
- `docs/IMPLEMENTATION_PLAN.md`: all 62 tasks marked done
- `docs/PROJECTPLAN.md`: Phase 11 fully completed
- `docs/TODO.md`: 53 completed, 0 remaining
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
- README.md, CHANGELOG.md, docs/USER_MANUAL.md rewritten
- Session appended to HANDOFF.md
- docs/PROJECTPLAN.md Phase 6 marked complete

### Session 12 — 19 May 2026 (Auth stability + UI smoothness)
- **Session expiry on Vercel cold start** — token drift fix, auth state listener syncs to localStorage, 401 retry
- **Ledger bump on transaction post** — local balance derivation, targeted refetch
- **Loading spinners** for Loan and Group modules
- **Fade-in animations** via AnimatePresence on loans + groups
- **Live app version** via transformIndexHtml meta tag
- **Pre-existing TS error** at FloatingActionButton.tsx(16,20) — fixed in Session 13

---

## Session 14 — 02 Jun 2026 (Phase 10 — Performance & UX Improvements)

Branch: `performance/ai-improvements`

Completed 19 tasks from Phase 10 of `docs/TODO.md`:

### P0 — Mobile Responsiveness Basics
- **T-082** Added `touch-action: manipulation` and `overscroll-behavior: none` to `body` in `src/index.css`
- **T-083** Made scroll/touch event listeners passive in `Select.tsx`, `DatePicker.tsx`, `FloatingActionButton.tsx`
- **T-084** Added body scroll locking + Escape key handlers to all 5 modals (SettleModal, GroupSettleModal, TransferModal, TransactionModal, RenameModal)
- **T-085** Added font preconnect links for Google Fonts in `index.html`

### P1 — Visual Responsiveness
- **T-086** Added tactile press feedback (`active:scale-[0.97]`) globally via CSS
- **T-087** Created `SkeletonLoader.tsx` with shimmer variants (card, table-row, chart, dashboard, avatar, text) + RAF two-phase reveal
- **T-088** Added `focus-visible` rings globally + `aria-current`, `aria-label`, `aria-hidden` to Sidebar and Header
- **T-089** Added `content-visibility: auto` + `contain-intrinsic-size` to route wrapper in `App.tsx`

### P2 — Polish
- **T-090** Added `overscroll-behavior: contain` to Sidebar nav, Select dropdown, DashboardTodos
- **T-091** Throttled scroll/resize handlers with `requestAnimationFrame` in `Select.tsx` and `DatePicker.tsx`
- **T-092** Added `safe-area-inset-bottom` padding to FAB
- **T-093** Added `contain: layout style` utility class to `App.tsx` route wrapper

### Animation Smoothness
- **T-094** Updated animation durations (0.15→0.3, 0.2→0.35) and custom cubic-bezier easing on all key motion.div transitions
- **T-095** Added `will-change: transform, opacity` to animated elements in `App.tsx`, `TransferModal`, `TransactionModal`
- **T-096** Added `prefers-reduced-motion` media query to `src/index.css`
- **T-097** Added `.app-stagger-grid` CSS pattern for optional staggered list animations

### Data Architecture
- **T-098**/ **T-099** Cache-first pattern verified (already implemented); cache updated after mutations
- **T-100** Changed cache TTL to session-length (`Infinity`) + added "Last synced" indicator to `OfflineIndicator`

### Files Changed (18 files)
- `src/index.css`, `index.html`, `src/App.tsx`
- `src/components/SkeletonLoader.tsx` (new)
- `src/components/SettleModal.tsx`, `GroupSettleModal.tsx`, `TransferModal.tsx`, `TransactionModal.tsx`, `RenameModal.tsx`
- `src/components/Select.tsx`, `DatePicker.tsx`, `FloatingActionButton.tsx`
- `src/components/layout/Sidebar.tsx`, `src/components/layout/Header.tsx`
- `src/components/DashboardTodos.tsx`, `src/components/OfflineIndicator.tsx`
- `src/services/cacheService.ts`

---

## Sessions 1–4 (Historical)

Refer to earlier project records for Sessions 1–4 (initial build, PWA, dark mode, settings reorganization, admin panel, user profile).

---

## Session 25 — 4 Jun 2026 (Dashboard-Ledger Balance Sync + Recharts Warning)

> **Branch**: `feat/local-first`
> **Status**: partial

### Summary
Fixed bi-directional balance desync between Dashboard and Ledger. Two independent transaction submission paths (TransactionModal → localDb, TransactionForm → API) were not sharing data. Also attempted fix for recharts width/height -1 warning but warning persists — likely needing InvestmentDetail.tsx fix and useLayoutEffect dimension check approach.

### Changes
- `src/hooks/useTransactions.ts` — Added localDb pending transaction merge in both fetchTransactions and initial load useEffect. Ledger now sees TransactionModal's transactions.
- `src/components/Ledger.tsx` — handleAddOrUpdateTransaction and handleDelete now call onUpdate(account.id, delta) to notify Dashboard of balance changes.
- `src/App.tsx` — Ledger onUpdate handler now calls applyAccountDelta + fetchData.
- `src/components/DashboardCharts.tsx` — Card containers stay in DOM during loading; ResponsiveContainer only mounts after layout ready. Removed accounts from useEffect deps to prevent cascading API calls.

### Remaining Issues
- Recharts width/height -1 warning still shown (InvestmentDetail.tsx also uses ResponsiveContainer unconditionally)
- Dashboard balance update still has delay (likely needs `setLastUpdate` bump in `applyAccountDelta` for real-time ledger refresh)

### Files Changed
- `src/App.tsx` — Ledger onUpdate handler
- `src/components/DashboardCharts.tsx` — recharts container fix
- `src/components/Ledger.tsx` — onUpdate calls with delta
- `src/hooks/useTransactions.ts` — localDb merge in fetch/load
- `AGENTS.md`, `CLAUDE.md` — gitnexus index stats

### Verification
- TypeScript compilation: passes (npx tsc --noEmit)
- gitnexus detect_changes: 11 affected processes, risk level HIGH

### Next Steps
- Fix InvestmentDetail.tsx ResponsiveContainer same way
- Add setLastUpdate(Date.now()) to applyAccountDelta for real-time ledger refresh

---

## Session 28 — 4 June 2026 (Unified Write Modal — Bugfixing Data Flow)

> **Branch**: `feat/unified-write-modal` (created from `feat/local-first`)
> **Tasks**: T-178, T-179, T-180, T-181, T-182, T-183, T-184, T-185
> **Status**: completed

### Summary
Implemented the Unified Write Modal to fix 5 data-flow bugs causing Dashboard/Ledger balance desync. Replaced 6 independent write modals/components with a single `<WriteModal>` that routes all writes through localDb → sync engine. Removed all direct server API calls from write paths. Removed `applyAccountDelta` and `fetchData` recompute blocks. Removed `'accounts'` from sync engine SYNC_TABLES. Added `WriteOperation` union type to `src/types.ts`. Deleted 6 old component files. TypeScript and production build both pass clean.

### Root Cause (5 Bugs Fixed)
1. **Duplicate records**: useTransactions.addOrUpdateTransaction wrote directly to server API, creating duplicates when sync engine also pushed
2. **Race condition on balance**: applyAccountDelta in App.tsx ran alongside useLocalData's fetchData, creating inconsistent intermediate states
3. **Balance drift over time**: accounts data in sync engine SYNC_TABLES was written server-side via push, then overwritten by pull, causing balance to revert to stale values
4. **Inline edit state fragmentation**: TransactionForm, LoanForm, SettleModal, and others each managed their own form state and server write paths, with no single orchestration layer
5. **Client_id dedup on server**: server already filtered duplicates by client_id + user_id (confirmed in api/routes/sync.ts:50-55) — latent fix was already in place

### Changes
- **Step 4**: Removed direct server API calls from useTransactions — writes only go to localDb
- **Step 5**: Removed applyAccountDelta function and fetchData recompute block from useLocalData
- **Step 6**: Removed 'accounts' from SYNC_TABLES in syncEngine — account balances are derived data
- **Step 3**: Replaced isTransferModalOpen/isTransactionModalOpen in App.tsx with single writeOperation state + WriteModal
- **Step 12**: Dashboard.tsx — replaced onOpenTransfer + onOpenTransaction with single onWriteOperation
- **Step 7**: Ledger.tsx — removed inline TransactionForm, all writes go through onWriteOperation modal
- **Step 8**: LoanManager.tsx — removed inline LoanForm + SettleModal, wired to modal
- **Step 9**: InvestmentTracker.tsx — removed inline create form, wired to modal
- **Step 10**: InvestmentDetail.tsx — removed inline return form + direct server API call, wired to modal
- **Step 11**: Confirmed client_id dedup already existed on server — no changes needed
- **Step 13**: Deleted 6 old component files (TransactionModal, TransferModal, TransactionForm, LoanForm, SettleModal, GroupSettleModal)
- **Step 14**: tsc --noEmit passes with zero errors
- **Step 15**: npm run build succeeds
- Cleaned up TransactionRow/TransactionCard (removed editingTxId/renderEditForm props)
- Cleaned up LoanGroupCard (removed GroupSettleModal import/group-settle logic)
- Moved WriteOperation type to src/types.ts, removed local definition from WriteModal.tsx

### Files Changed
- `src/types.ts` — Added `WriteOperation` union type (7 modes)
- `src/components/WriteModal.tsx` — New: modal shell with all 7 mode submit handlers
- `src/components/WriteModalForms.tsx` — New: pure form components per mode
- `src/App.tsx` — Single writeOperation state, WriteModal rendering, BottomNav wiring
- `src/hooks/useTransactions.ts` — Simplified: no server API, no isSyncing, no optimistic state
- `src/hooks/useLocalData.ts` — Removed applyAccountDelta + fetchData balance recompute
- `src/services/syncEngine.ts` — Removed 'accounts' from SYNC_TABLES, getters, markers, putters
- `src/components/Dashboard.tsx` — Single onWriteOperation prop
- `src/components/Ledger.tsx` — Inline form removed, all writes through onWriteOperation
- `src/components/LoanManager.tsx` — Inline forms removed, wired to modal
- `src/components/InvestmentTracker.tsx` — Inline form removed, wired to modal
- `src/components/InvestmentDetail.tsx` — Inline return form + server API removed, wired to modal
- `src/components/TransactionRow.tsx` — Removed editingTxId/renderEditForm props
- `src/components/TransactionCard.tsx` — Removed editingTxId/renderEditForm props
- `src/components/LoanGroupCard.tsx` — Removed GroupSettleModal import and group settle logic
- _Deleted_: TransactionModal.tsx, TransferModal.tsx, TransactionForm.tsx, LoanForm.tsx, SettleModal.tsx, GroupSettleModal.tsx

### New Files Created
- `src/components/WriteModal.tsx` (569 LOC)
- `src/components/WriteModalForms.tsx` (467 LOC)

### Verification
- `npx tsc --noEmit` — zero errors
- `npm run build` — production build succeeds

### Key Decisions
- WriteOperation type lives in src/types.ts — avoids circular imports
- 'accounts' removed from sync engine entirely — balances are derived data
- Group settle removed from LoanGroupCard — each loan settled individually via modal
- Inline transaction editing removed — edit/create both open WriteModal
- Loan creates now generate corresponding transactions (affect account balances)
- Batch mode toggle in modal corner for multi-entry data entry

### Next Steps
1. Commit all changes to `feat/unified-write-modal` branch
2. Manual verification: create transaction, transfer, loan, settle loan, batch mode toggle, offline write + online sync
3. Merge to `feat/local-first` then to `main` on approval

---

## Session 26 — 4 Jun 2026 (Read Path Analysis & Plan)

> **Branch**: `feat/local-first`
> **Tasks**: Dashboard-Ledger balance desync root cause analysis
> **Status**: planning

### Summary
Analyzed the Dashboard-Ledger balance desync. Identified that `useTransactions.ts` still reads from server API despite the local-first plan specifying "Read directly from IndexedDB". Created `docs/LOCAL_FIRST_READ_PATH_FIX.md` with a 6-phase fix plan.

### Root Cause
- Two independent write paths: TransactionModal (localDb) vs useTransactions (server API)
- `useTransactions` fetches from server, patches pending localDb via fragile heuristic merge
- Race condition: sync engine marks records 'synced' before Ledger merge runs
- No reactive event system — localDb changes don't trigger re-renders
- `DashboardCharts` never migrated to localDb

### Files Changed
- `docs/LOCAL_FIRST_READ_PATH_FIX.md` — new implementation plan

---

## Session 7 — 07 Jun 2026 (Modal, Sync Fixes, Balance Display)

> **Branch**: `feat/local-first`
> **Status**: completed

### Summary
Unified Modal component, offline fallback for account/group operations, group sync to server, current_balance in all account dropdowns.

### Changes
- Created reusable `Modal` component (portal + backdrop + animation)
- Converted inline collapsible forms → Modal in AccountManager, MemberManager, GroupManager
- Fixed AccountManager groups source (localDb instead of API)
- Added offline local-fallback to AccountManager create/update/archive
- Added API sync calls to GroupManager (create/update/delete)
- Fixed GroupManager error handling (server errors vs network errors)
- Removed y-offset page animations in App.tsx (layout shift fix)
- Added current_balance display in LoanCreateForm, InvestmentCreateForm, AccountForm (edit), RecurringManager, ReportGenerator

### Files Changed
- `src/components/Modal.tsx` — new reusable modal
- `src/components/AccountManager.tsx` — Modal, localDb groups, offline fallback
- `src/components/GroupManager.tsx` — Modal, API sync, error handling
- `src/components/MemberManager.tsx` — Modal conversion
- `src/components/AccountListView.tsx` — removed inline edit sections
- `src/components/GroupForm.tsx` — removed outer wrapper (handled by Modal)
- `src/App.tsx` — removed y-offset page animations
- `src/components/AccountForm.tsx` — currentBalance display
- `src/components/WriteModalForms.tsx` — currentBalance in Loan/Investment forms
- `src/components/WriteModal.tsx` — pass currency to forms
- `src/components/RecurringManager.tsx` — currentBalance in dropdown
- `src/components/ReportGenerator.tsx` — currentBalance in filter

### Verification
- `npm run build` passes
- gitnexus skipped (CLI not found)
