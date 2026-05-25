# FinTrack Pro — Full Codebase Audit Report

**Date**: 2026-05-25  
**Author**: opencode audit  
**Status**: GitNexus indexed & up-to-date  

---

## Summary

| Metric | Value |
|---|---|
| Files | ~60 source files |
| Total LOC | ~8,500+ (src + api) |
| TypeScript errors | 0 (`tsc --noEmit` passes) |
| GitNexus | Already installed & indexed (up-to-date) |
| Files over 300 LOC | **10 files** (violates AGENTS.md limit) |
| Test coverage | **0%** |
| Dual DB branching | Every route duplicated for Supabase + SQLite |

---

## BUGS (Confirmed)

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | **HIGH** | `/api/import` has **NO auth middleware** — anyone can import data | `api/index.ts:93` (missing `requireAuth` before `exportRoutes`) |
| 2 | **MEDIUM** | `timerRef` initialized as `undefined as any` — TS error on line 16 | `src/components/FloatingActionButton.tsx:16` |
| 3 | **MEDIUM** | Offline `syncQueue` uses `queue.indexOf(a)` for filtering — returns first index always, corrupts queue on partial sync | `src/services/offlineService.ts:83-86` |
| 4 | **LOW** | `requireQuota` re-extracts token from headers instead of using already-verified `req.user` | `api/middleware/quota.ts:18` |
| 5 | **LOW** | Liabilities card always shows hardcoded "0" | Dashboard component |

---

## CODE QUALITY ISSUES

| # | Issue | Details |
|---|-------|---------|
| 6 | **Files > 300 LOC** | LoanManager (580), Ledger (459), AdminPanel (445), AccountManager (398), Dashboard (391), transactions.ts (403), loans.ts (400), GroupManager (341), Settings (319), InvestmentTracker (311), ReportGenerator (303) |
| 7 | **Dual DB branching** | Every handler has `if (supabase) {...} else { db.prepare(...) }` — massive duplication, hard to maintain. ~70% of API code is duplicated |
| 8 | **Excessive `any` types** | Heavy use of `any` throughout — defeats TypeScript's purpose |
| 9 | **No request validation** | Zero Zod/validation schemas — malformed payloads hit DB directly |
| 10 | **No testing** | No unit, integration, or e2e tests |
| 11 | **No rate limiting** | All endpoints unprotected against abuse |
| 12 | **No pagination** | GET endpoints return all rows — will break at scale |
| 13 | **No input sanitization** | Category names, particulars, etc. pass through unsanitized |
| 14 | **`/api/import` uses DELETE + INSERT** | Not wrapped in a transaction — partial failure corrupts data |
| 15 | **SQLite missing indexes** | No indexes on `user_id`, `account_id`, `loan_id` — slow at scale |
| 16 | **Cache has no TTL** | `cacheService` stores data with timestamps but never checks them |
| 17 | **`supabaseAdmin` used for data queries** | Service role key used in loans.ts for regular SELECT/INSERT — over-privileged |

---

## ARCHITECTURE WEAKNESSES

| # | Issue | Impact |
|---|-------|--------|
| 18 | **No data-access layer** | Dual DB logic lives in route handlers — impossible to swap DB without touching every file |
| 19 | **No error standardization** | Routes return `{ error: err.message }` — leaks internal details |
| 20 | **No logging framework** | Uses raw `console.error` — no structured logging, no log levels |
| 21 | **Token in localStorage** | Bearer token stored in `localStorage` — XSS-vulnerable (mitigated by Supabase HttpOnly cookie option) |
| 22 | **No request ID tracing** | Impossible to correlate frontend→backend errors |

---

## FEATURE IMPROVEMENTS (Recommended)

### P0 — Critical Fixes

- [ ] **Add `requireAuth` to `/api/import`** — fix at `api/index.ts:93`
- [ ] **Fix FloatingActionButton TS error** — initialize timerRef properly

### P1 — Quick Wins

- [ ] **Extract data-access layer** — create `api/db/queries.ts` with a unified interface; each route calls one function instead of duplicating Supabase/SQLite logic
- [ ] **Add pagination** to transactions, accounts, and loans GET endpoints (`?limit=50&offset=0`)
- [ ] **Add request validation** with Zod schemas shared between frontend/backend
- [ ] **Fix offline syncQueue** — track by `id` instead of `indexOf`

### P2 — UX Improvements

- [ ] **Recycle bin / soft-delete** — already in PROJECTPLAN Phase 6 backlog
- [ ] **Liability tracking** — replace hardcoded "0" with actual liability accounts/transactions
- [ ] **Budgeting module** — set monthly category budgets, track overspend
- [ ] **Recurring transactions** — auto-create transactions on schedule (cron job or client-side)
- [ ] **Multi-currency support** — exchange rate API integration, per-account currency
- [ ] **Notifications** — due loan reminders, low balance alerts (via Supabase or push)

### P3 — Technical Debt

- [ ] **Split 11 files over 300 LOC** into smaller modules
- [ ] **Replace `any` types** with proper interfaces
- [ ] **Add Vitest tests** — start with API route integration tests
- [ ] **Add structured logging** (pino or winston)
- [ ] **Add database indexes** for SQLite (especially `user_id`, `account_id`, `loan_id`)
- [ ] **Make cacheService respect TTL** — evict stale entries

### P4 — Enhancements

- [ ] **Dark mode micro-interactions** — theme transition animations (Phase 3.7 in PROJECTPLAN)
- [ ] **Typography audit** — verify Inter/JetBrains Mono in CSS (Phase 3.8)
- [ ] **PWA push notifications** for loan due dates
- [ ] **CSV import** for bulk transactions
- [ ] **Dashboard charts** — spending by category pie chart, balance trend line
- [ ] **Data export formats** — add Excel (.xlsx) support alongside PDF/CSV
- [ ] **Search improvements** — full-text search across all transactions/particulars

---

## Refresh GitNexus After Changes

```bash
npx gitnexus analyze --force
```