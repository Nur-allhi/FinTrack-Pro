# FinTrack Pro — Implementation Plan

**Cross-ref**: `PROJECTPLAN.md` for full project roadmap  
**Priority defs**: P0=immediate, P1=quick win, P2=structured, P3=tech debt

---

## ✅ Completed (from PROJECTPLAN.md Phases 7–10)

These have been shipped and are **not** part of this implementation plan:

| Phase | Key Deliverables |
|-------|-----------------|
| **Phase 7 — Code Audit & Architecture** | `requireAuth` fix, timerRef typing, syncQueue fix, requireQuota fix, data-access layer (`api/db/*.ts`), SQLite indexes, cache TTL, Zod validation, pagination, error standardization, pino logging, request ID tracing, shared types |
| **Phase 8 — Animation Overhaul** | Removed global bounce, replaced all scale animations with slide-in/slide-out across 10+ components |
| **Phase 9 — Offline Mode** | SW API caching, offline fallback page, IndexedDB queue, Background Sync, reactive sync state, optimistic offline delete, pending count, offline-aware TTL, 13 fixes |
| **Phase 10 — Branding & UI Polish** | Sidebar logo rebrand (Wallet → bar-chart SVG + Roboto Slab wordmark), logo clickable to refresh, docs moved to `PLAN/` |

---

## 📋 Remaining Work

---

## Phase 0 — In-Flight Issues (P0) ⬜

| # | Issue | Location | Effort |
|---|-------|----------|--------|
| 0.1 | Typography audit — verify Inter/JetBrains Mono in CSS | `src/index.css`, DESIGN.md | 30m |
| 0.2 | Dark mode micro-interactions — theme transition animations | `src/index.css` | 1h |

**Dependency**: None. Isolated CSS fixes.

---

## Phase 1 — Data Layer & Architecture (P1) ⬜

| # | Issue | Details | Effort |
|---|-------|---------|--------|
| 1.1 | Create `api/db/queries.ts` — unified query interface over Supabase + SQLite | Currently per-entity modules exist but no single unified interface | 4-6h |
| 1.2 | Extract shared Zod schemas to `shared/validation/` | Validation exists inline in routes; move to shared location for frontend reuse | 2-3h |
| 1.3 | Swap `supabaseAdmin` for `supabase` client in data queries | Service role key used for regular SELECT/INSERT | 1-2h |
| 1.4 | Migrate token from localStorage to HttpOnly cookie | Supabase auth refactor required | 4-6h |

**Dependency**: 1.1 → 1.2, 1.3 independent

---

## Phase 2 — Type Safety & Cleanup (P2) ⬜

| # | Issue | Details | Effort |
|---|-------|---------|--------|
| 2.1 | Replace remaining `any` types across API layer | `shared/types.ts` exists, members & accounts typed, rest pending | 4-6h |
| 2.2 | Replace remaining `any` types across frontend components | Heavy `any` usage in most components | 4-6h |
| 2.3 | Wrap `/api/import` DELETE+INSERT in a transaction | Prevents partial failure data corruption | 1h |
| 2.4 | Add rate limiting middleware | All endpoints unprotected | 2-3h |

**Dependency**: None.

---

## Phase 3 — File Splitting (< 300 LOC) (P2) ⬜

| # | File | Current LOC | Split Plan |
|---|------|-------------|------------|
| 3.1 | Ledger (542) → `LedgerTable`, `LedgerFilters`, `LedgerSummary` | 542 | 3 files |
| 3.2 | AdminPanel (444) → `UserManager`, `SystemHealth` | 444 | 2 files |
| 3.3 | LoanManager (403) → `LoanForm`, `LoanList`, `LoanDetail` | 403 | 3 files |
| 3.4 | AccountManager (398) → `AccountForm`, `AccountList` | 398 | 2 files |
| 3.5 | Dashboard (391) → `DashboardHero`, `DashboardGrid`, `DashboardCards` | 391 | 3 files |
| 3.6 | GroupManager (341) → `GroupForm`, `GroupList`, `GroupMembers` | 341 | 3 files |
| 3.7 | Settings (319) → split into section files | 319 | 3-4 files |
| 3.8 | InvestmentTracker (311) → split from Dashboard | 311 | 2 files |
| 3.9 | ReportGenerator (303) — just under limit, defer | 303 | — |
| 3.10 | LoanGroupCard (314) → extract sub-components | 314 | 2 files |

**Dependency**: None. Can start immediately.

---

## Phase 4 — Testing (P2) ⬜

| # | Issue | Details | Effort |
|---|-------|---------|--------|
| 4.1 | Vitest + supertest setup for API route integration tests | Already has `vitest.config.ts`, 3 existing tests | 1h |
| 4.2 | Smoke tests for all GET endpoints | Health check for every route | 2-3h |
| 4.3 | CRUD operation tests for transactions, accounts, loans | Core business logic | 3-4h |
| 4.4 | Auth middleware tests | requireAuth, requireQuota, requireAdmin | 1-2h |
| 4.5 | Offline queue sync tests | queueAction, syncQueue, retry logic | 2-3h |

**Dependency**: None.

---

## Phase 5 — Recycle Bin / Soft-Delete (P2) ⬜

See PROJECTPLAN Phase 6.2-6.3 for detailed breakdown.

| # | Item | Effort |
|---|------|--------|
| 5.1 | Backend: `deleted_at` column, soft-delete logic, restore/permanent-delete endpoints | 4-6h |
| 5.2 | Frontend: RecycleBin component with item display, restore, permanent delete, auto-purge | 4-6h |

**Dependency**: None.

---

## Phase 6 — Feature Enhancements (P3) ⬜

Cross-ref PROJECTPLAN Phase 11.

| # | Feature | Difficulty | Notes |
|---|---------|-----------|-------|
| 6.1 | Liability tracking — replace hardcoded "0" with real model | Medium | New account type + ledger |
| 6.2 | Budgeting module — monthly category budgets, overspend tracking | Medium | New feature |
| 6.3 | Recurring transactions — cron-based auto-creation | Medium | SW + API |
| 6.4 | Multi-currency support — exchange rate API, per-account currency | Hard | Affects all number displays |
| 6.5 | Dashboard charts — spending by category pie, balance trend line | Medium | Recharts already installed |
| 6.6 | PWA push notifications — loan due dates, low balance | Medium | SW push API |
| 6.7 | CSV import for bulk transactions | Easy | File upload + parse |
| 6.8 | Excel (.xlsx) export alongside PDF/CSV | Easy | xlsx library |
| 6.9 | Full-text search across transactions/particulars | Medium | SQLite FTS |

**Dependency**: None.

---

## Effort Summary

| Phase | Status | Est. Effort | Risk |
|-------|--------|-------------|------|
| Phase 0 — In-Flight Issues | ⬜ Not started | 1.5h | None |
| Phase 1 — Data Layer & Architecture | ⬜ Not started | 11-17h | Medium |
| Phase 2 — Type Safety & Cleanup | ⬜ Not started | 11-16h | Low |
| Phase 3 — File Splitting | ⬜ Not started | 8-14h | Low-Medium |
| Phase 4 — Testing | ⬜ Not started (3 tests exist) | 9-13h | None |
| Phase 5 — Recycle Bin | ⬜ Not started | 8-12h | Low |
| Phase 6 — Feature Enhancements | ⬜ Not started | Varies | N/A |

**Total remaining (Phases 0-5)**: ~48-73h

---

## Post-Implementation

```bash
npx gitnexus analyze --force
```
