# FinTrack Pro — Implementation Plan

**Source**: Audit Report (`AUDIT_REPORT.md`) — 22 issues identified  
**Cross-ref**: `PROJECTPLAN.md` Phase 7 for existing backlog alignment  
**Priority defs**: P0=immediate, P1=quick win, P2=structured, P3=tech debt

---

## Phase 0 — Critical Bug Fixes

| # | Issue | Audit Ref | Effort |
|---|-------|-----------|--------|
| 0.1 | Add `requireAuth` to `/api/import` | #1 (HIGH) | <1h |
| 0.2 | Fix `timerRef` in FloatingActionButton — proper `useRef` typing | #2 (MED) | <30m |
| 0.3 | Fix `offlineService` syncQueue — use `queue.filter(item => item.id !== a.id)` instead of `indexOf` | #3 (MED) | <30m |

**Dependency**: None. Straightforward isolated fixes.

---

## Phase 1 — Data Layer Extraction (Architecture)

| # | Issue | Audit Ref | Effort |
|---|-------|-----------|--------|
| 1.1 | Create `api/db/queries.ts` — unified query interface over Supabase + SQLite | #7, #18 | 4-6h |
| 1.2 | Route-by-route migration: transactions, accounts, loans, members, groups | #7, #18 | 8-12h |
| 1.3 | Add SQLite indexes on `user_id`, `account_id`, `loan_id` | #15 | 30m |
| 1.4 | Make `cacheService` respect TTL timestamps | #16 | 1h |
| 1.5 | Swap `supabaseAdmin` for `supabase` client in loans.ts queries | #17 | 30m |

**Dependency**: Do 1.1 first; 1.2 depends on 1.1 ready. 1.3-1.5 independent.

---

## Phase 2 — Validation & Sanitization

| # | Issue | Audit Ref | Effort |
|---|-------|-----------|--------|
| 2.1 | Create shared Zod schemas (`shared/validation/`) | #9, #13 | 2-3h |
| 2.2 | Apply Zod schemas to all POST/PUT/PATCH route handlers | #9, #13 | 3-4h |
| 2.3 | Add pagination to GET endpoints (`?limit=50&offset=0`) for transactions, accounts, loans | #12 | 2-3h |
| 2.4 | Wrap `/api/import` DELETE+INSERT in a transaction | #14 | 1h |

**Dependency**: 2.2 depends on 2.1. 2.3-2.4 independent.

---

## Phase 3 — Error & Observability Infrastructure

| # | Issue | Audit Ref | Effort |
|---|-------|-----------|--------|
| 3.1 | Standardized error response format (`{ error, code, details }`) across all routes | #19 | 2-3h |
| 3.2 | Add structured logging (pino) — replace `console.error` | #20 | 1-2h |
| 3.3 | Add request ID tracing (via middleware or `req.id`) | #22 | 1h |
| 3.4 | Fix `requireQuota` middleware — use `req.user` instead of re-extracting token | #4 | 30m |

**Dependency**: None. Can be done in parallel with Phase 2.

---

## Phase 4 — File Splitting (LOC < 300)

| # | File | Current LOC | Split Plan |
|---|------|-------------|------------|
| 4.1 | LoanManager (580) → `LoanForm`, `LoanList`, `LoanDetail` | 580 | 3 files |
| 4.2 | Ledger (459) → `LedgerTable`, `LedgerFilters`, `LedgerSummary` | 459 | 3 files |
| 4.3 | AdminPanel (445) → `UserManager`, `SystemHealth` | 445 | 2 files |
| 4.4 | AccountManager (398) → `AccountForm`, `AccountList` | 398 | 2 files |
| 4.5 | Dashboard (391) → `DashboardHero`, `DashboardGrid`, `DashboardCards` | 391 | 3 files |
| 4.6 | `api/routes/transactions.ts` (403) → split by feature (`income`, `expense`, `transfer`) | 403 | 3 files |
| 4.7 | `api/routes/loans.ts` (400) → `loans/crud.ts`, `loans/payments.ts`, `loans/interest.ts` | 400 | 3 files |
| 4.8 | GroupManager (341) → `GroupForm`, `GroupList`, `GroupMembers` | 341 | 3 files |
| 4.9 | Settings (319) → already has subnav — split into section files | 319 | 3-4 files |
| 4.10 | InvestmentTracker (311) → split from Dashboard | 311 | 2 files |
| 4.11 | ReportGenerator (303) — just under limit, defer | 303 | — |

**Dependency**: Ideally after data layer (Phase 1) to avoid duplicating DB logic. Can start on frontend-only files (4.5, 4.8, 4.9, 4.10) immediately.

---

## Phase 5 — Type Safety & Cleanup

| # | Issue | Audit Ref | Effort |
|---|-------|-----------|--------|
| 5.1 | Replace `any` types across API layer with proper interfaces | #8 | 4-6h |
| 5.2 | Replace `any` types across frontend components | #8 | 4-6h |
| 5.3 | Remove hardcoded "0" in liabilities card — wire to real data | #5 | 1-2h |
| 5.4 | Audit localStorage token usage — document HttpOnly cookie path | #21 | 1h |

**Dependency**: Aligns well after Phase 1 (data layer) to have clear types.

---

## Phase 6 — Testing

| # | Issue | Audit Ref | Effort |
|---|-------|-----------|--------|
| 6.1 | Vitest + supertest setup for API route integration tests | #10 | 2h |
| 6.2 | Smoke tests for all GET endpoints | #10 | 2-3h |
| 6.3 | CRUD operation tests for transactions, accounts, loans | #10 | 3-4h |
| 6.4 | Auth middleware tests | #10 | 1-2h |

**Dependency**: After data layer (Phase 1) so tests work against extracted queries.

---

## Phase 7 — Enhancements (Future Backlog)

Items from audit P2/P4 not blocking stability. Cross-ref PROJECTPLAN Phase 6.2-6.3 (Recycle Bin).

| # | Item | Audit Ref | Notes |
|---|------|-----------|-------|
| 7.1 | Recycle bin / soft-delete | P2 | Aligns with PROJECTPLAN Phase 6.2-6.3 |
| 7.2 | Rate limiting middleware | #11 | All endpoints |
| 7.3 | Liability tracking | #5 (upgrade) | Replace hardcoded "0" with real model |
| 7.4 | Budgeting module | P2 | New feature |
| 7.5 | Recurring transactions | P2 | Cron-based |
| 7.6 | Multi-currency support | P2 | Exchange rate API |
| 7.7 | Notifications | P2 | Loan reminders, low balance |
| 7.8 | Dark mode micro-interactions | P4 | PROJECTPLAN Phase 3.7 |
| 7.9 | Typography audit | P4 | PROJECTPLAN Phase 3.8 |
| 7.10 | PWA push notifications | P4 | Due dates |
| 7.11 | CSV import | P4 | Bulk transactions |
| 7.12 | Dashboard charts | P4 | Pie/trend |
| 7.13 | Excel export | P4 | .xlsx support |
| 7.14 | Full-text search | P4 | Transactions/particulars |

---

## Effort Summary

| Phase | Est. Effort | Risk |
|-------|-------------|------|
| Phase 0 — Critical Bug Fixes | 2h | None |
| Phase 1 — Data Layer | 14-20h | Medium (touches all routes) |
| Phase 2 — Validation | 7-10h | Low |
| Phase 3 — Observability | 4-6h | Low |
| Phase 4 — File Splitting | 10-16h | Low-Medium |
| Phase 5 — Type Safety | 10-14h | Low |
| Phase 6 — Testing | 8-11h | None |
| Phase 7 — Enhancements | Varies | N/A |

**Total core (Phases 0-6)**: ~55-79h

---

## Post-Implementation

```bash
npx gitnexus analyze --force
```
