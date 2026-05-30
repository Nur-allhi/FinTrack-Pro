# FinTrack Pro — Full Codebase Audit Report

**Date**: 2026-05-25  
**Last Updated**: 2026-05-30  
**Author**: opencode audit  
**Status**: GitNexus indexed & up-to-date — see `PROJECTPLAN.md` Phase 7 for implementation details

---

## Summary

| Metric | Value |
|---|---|
| Files | ~60 source files |
| Total LOC | ~8,500+ (src + api) |
| TypeScript errors | 0 (`tsc --noEmit` passes) |
| GitNexus | Already installed & indexed (up-to-date) |
| Files over 300 LOC | **10 files** (violates AGENTS.md limit) |
| Test coverage | **~1%** (3 Vitest tests for members data layer) |
| Dual DB branching | **FIXED** — extracted to `api/db/*.ts`, routes are thin wrappers |

---

## BUGS (Confirmed)

| # | Severity | Issue | Location | Status |
|---|----------|-------|----------|--------|
| 1 | **HIGH** | `/api/import` has **NO auth middleware** — anyone can import data | `api/index.ts:93` (missing `requireAuth` before `exportRoutes`) | ✅ **FIXED** — `requireAuth` added |
| 2 | **MEDIUM** | `timerRef` initialized as `undefined as any` — TS error on line 16 | `src/components/FloatingActionButton.tsx:16` | ✅ **FIXED** — typed as `ReturnType<typeof window.setTimeout>` |
| 3 | **MEDIUM** | Offline `syncQueue` uses `queue.indexOf(a)` for filtering — returns first index always, corrupts queue on partial sync | `src/services/offlineService.ts:83-86` | ✅ **FIXED** — filtered by `item.id` instead |
| 4 | **LOW** | `requireQuota` re-extracts token from headers instead of using already-verified `req.user` | `api/middleware/quota.ts:18` | ✅ **FIXED** — uses `supabaseAdmin.getUserById(req.user.id)` |
| 5 | **LOW** | Liabilities card always shows hardcoded "0" | Dashboard component | ❌ **NOT FIXED** — see PROJECTPLAN Phase 11.8 |

---

## CODE QUALITY ISSUES

| # | Issue | Details | Status |
|---|-------|---------|--------|
| 6 | **Files > 300 LOC** | Ledger (542), AdminPanel (444), LoanManager (403), AccountManager (398), Dashboard (391), GroupManager (341), Settings (319), LoanGroupCard (314), InvestmentTracker (311), ReportGenerator (303) | ⏳ **PENDING** — see IMPLEMENTATION_PLAN.md Phase 3 |
| 7 | **Dual DB branching** | Every handler had `if (supabase) {...} else { db.prepare(...) }` — ~70% of API code duplicated | ✅ **FIXED** — extracted to `api/db/*.ts` with per-entity modules |
| 8 | **Excessive `any` types** | Heavy use of `any` throughout | ⏳ **PARTIAL** — `shared/types.ts` created, `members.ts` & `accounts.ts` typed, rest pending (IMPLEMENTATION_PLAN.md Phase 2) |
| 9 | **No request validation** | Zero Zod/validation schemas | ✅ **FIXED** — Zod schemas + `validate()` helper on all POST/PATCH routes |
| 10 | **No testing** | No unit, integration, or e2e tests | ⏳ **PARTIAL** — 3 Vitest tests for members data layer (`api/tests/members.test.ts`) |
| 11 | **No rate limiting** | All endpoints unprotected against abuse | ❌ **NOT FIXED** — see IMPLEMENTATION_PLAN.md Phase 2.4 |
| 12 | **No pagination** | GET endpoints returned all rows | ✅ **FIXED** — `?limit=&offset=` on accounts, transactions, loans |
| 13 | **No input sanitization** | Category names, particulars, etc. pass through unsanitized | ⏳ **PARTIAL** — Zod schemas trim strings, validate enums; further sanitization pending |
| 14 | **`/api/import` uses DELETE + INSERT** | Not wrapped in a transaction — partial failure corrupts data | ❌ **NOT FIXED** — see IMPLEMENTATION_PLAN.md Phase 2.3 |
| 15 | **SQLite missing indexes** | No indexes on `user_id`, `account_id`, `loan_id` | ✅ **FIXED** — 9 indexes added in `api/db.ts` |
| 16 | **Cache has no TTL** | `cacheService` stored data with timestamps but never checked them | ✅ **FIXED** — 5-min default TTL checked on getMembers/getAccounts/getTransactions |
| 17 | **`supabaseAdmin` used for data queries** | Service role key used for regular SELECT/INSERT | ❌ **NOT FIXED** — see IMPLEMENTATION_PLAN.md Phase 1.3 |

---

## ARCHITECTURE WEAKNESSES

| # | Issue | Impact | Status |
|---|-------|--------|--------|
| 18 | **No data-access layer** | Dual DB logic lived in route handlers — impossible to swap DB without touching every file | ✅ **FIXED** — `api/db/*.ts` with per-entity query modules |
| 19 | **No error standardization** | Routes returned `{ error: err.message }` — leaking internal details | ✅ **FIXED** — `sendError()` + `errorHandler` middleware with `{ error, code, details }` |
| 20 | **No logging framework** | Used raw `console.error` — no structured logging, no log levels | ✅ **FIXED** — pino logger with request-scoped child loggers |
| 21 | **Token in localStorage** | Bearer token stored in `localStorage` — XSS-vulnerable | ❌ **NOT FIXED** — see IMPLEMENTATION_PLAN.md Phase 1.4 |
| 22 | **No request ID tracing** | Impossible to correlate frontend→backend errors | ✅ **FIXED** — `requestId` middleware generates UUID per request |

---

## FEATURE IMPROVEMENTS (Recommended)

### P0 — Critical Fixes

- [x] **Add `requireAuth` to `/api/import`** — fixed at `api/index.ts`
- [x] **Fix FloatingActionButton TS error** — timerRef properly typed

### P1 — Quick Wins

- [x] **Extract data-access layer** — created `api/db/*.ts` with per-entity modules; routes are now thin wrappers
- [x] **Add pagination** to transactions, accounts, and loans GET endpoints (`?limit=50&offset=0`)
- [x] **Add request validation** with Zod schemas shared between frontend/backend
- [x] **Fix offline syncQueue** — tracked by `id` instead of `indexOf`

### P2 — UX Improvements

- [ ] **Recycle bin / soft-delete** — IMPLEMENTATION_PLAN.md Phase 5
- [ ] **Liability tracking** — replace hardcoded "0" with actual liability accounts/transactions
- [ ] **Budgeting module** — set monthly category budgets, track overspend
- [ ] **Recurring transactions** — auto-create transactions on schedule (cron job or client-side)
- [ ] **Multi-currency support** — exchange rate API integration, per-account currency
- [ ] **Notifications** — due loan reminders, low balance alerts (via Supabase or push)

### P3 — Technical Debt

- [ ] **Split 10 files over 300 LOC** into smaller modules — IMPLEMENTATION_PLAN.md Phase 3
- [x] **Replace `any` types** with proper interfaces — `shared/types.ts` created, `members.ts` & `accounts.ts` typed (partial)
- [ ] **Expand test coverage** — IMPLEMENTATION_PLAN.md Phase 4
- [x] **Add structured logging** — pino with request-scoped loggers installed
- [x] **Add database indexes** for SQLite — 9 indexes added in `api/db.ts`
- [x] **Make cacheService respect TTL** — default 5-minute TTL with per-call override

### P4 — Enhancements

- [ ] **Dark mode micro-interactions** — theme transition animations
- [ ] **Typography audit** — verify Inter/JetBrains Mono in CSS
- [ ] **PWA push notifications** for loan due dates
- [ ] **CSV import** for bulk transactions
- [ ] **Dashboard charts** — spending by category pie chart, balance trend line
- [ ] **Data export formats** — add Excel (.xlsx) support alongside PDF/CSV
- [ ] **Search improvements** — full-text search across all transactions/particulars

---

## Resolution Summary

### Fixed (14 items)
| Area | Items |
|------|-------|
| Bugs | #1 (auth on /api/import), #2 (timerRef type), #3 (syncQueue), #4 (requireQuota) |
| Code Quality | #7 (data layer), #9 (Zod validation), #12 (pagination), #15 (indexes), #16 (cache TTL) |
| Architecture | #18 (data layer), #19 (error standard), #20 (pino logging), #22 (request ID) |

### Partially Fixed (3 items)
| Area | Items |
|------|-------|
| Code Quality | #8 (`any` types — types.ts created, 2/8 files typed), #10 (testing — 3 tests created), #13 (sanitization — Zod trim/enum checks) |

### Not Fixed (5 items)
| Area | Items |
|------|-------|
| Bugs | #5 (liabilities "0" — PROJECTPLAN Phase 11.8) |
| Code Quality | #6 (file splitting — IMPLEMENTATION_PLAN.md Phase 3), #11 (rate limiting — IMPLEMENTATION_PLAN.md Phase 2.4), #14 (import transaction — IMPLEMENTATION_PLAN.md Phase 2.3), #17 (supabaseAdmin — IMPLEMENTATION_PLAN.md Phase 1.3) |
| Architecture | #21 (localStorage token — IMPLEMENTATION_PLAN.md Phase 1.4) |

### Post-Audit Work Completed
| Phase | Items |
|-------|-------|
| Animation Overhaul | Bounce removal, slide-in/slide-out across 10+ components |
| Offline Mode | Full implementation: SW caching, IndexedDB queue, Background Sync, reactive sync state, offline delete, pending count, offline-aware TTL |
| Branding | Sidebar logo rebrand — Wallet icon replaced with custom bar-chart SVG + Roboto Slab wordmark; logo clickable to refresh |

### All 20 API tests pass (login, validation CRUD, pagination, auth guards, export, admin)

## Refresh GitNexus After Changes

```bash
npx gitnexus analyze --force
```
