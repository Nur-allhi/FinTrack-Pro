# TODO — FinTrack Pro

> Generated from `IMPLEMENTATION_PLAN.md` · 2026-05-30
> **42 completed**, **22 remaining** (Phases 0–6)

---

## Phase 0 — In-Flight Issues ✅

- [x] **T-029** Typography audit (30m)
- [x] **T-030** Dark mode micro-interactions (1h)

## Phase 1 — Data Layer & Architecture ✅

- [x] **T-031** Create unified query interface `api/db/queries.ts` (4-6h)
- [x] **T-032** Extract shared Zod schemas to `shared/validation/` (2-3h)
- [x] **T-033** Swap `supabaseAdmin` for regular client in data queries (1-2h)
- [x] **T-034** Migrate token from `localStorage` to HttpOnly cookie (4-6h)

## Phase 2 — Type Safety & Cleanup ✅

- [x] **T-035** Replace `any` types across API layer (4-6h)
- [x] **T-036** Replace `any` types across frontend components (4-6h)
- [x] **T-037** Wrap `/api/import` in a DB transaction (1h)
- [x] **T-038** Add rate limiting middleware (2-3h)

## Phase 3 — File Splitting (<300 LOC) ✅

- [x] **T-039** Split `Ledger.tsx` (542→258) → `useTransactions`, `LedgerToolbar` (2-3h)
- [x] **T-040** ~~Split `AdminPanel.tsx` (444)~~ — file deleted (admin removed)
- [x] **T-041** Split `LoanManager.tsx` (403→171) → `SettleModal`, `LoanFilters` (2-3h)
- [x] **T-042** Split `AccountManager.tsx` (398→194) → `AccountForm`, `AccountListView` (1-2h)
- [x] **T-043** Split `Dashboard.tsx` (393→268) → `DashboardHero`, `DashboardTodos` (2-3h)
- [x] **T-044** Split `GroupManager.tsx` (341→296) → `GroupForm` (1-2h)
- [x] **T-045** Split `Settings.tsx` (319→136) → `AppearanceSettings`, `DashboardSettings`, `CategorySettings` (1-2h)
- [x] **T-046** Split `InvestmentTracker.tsx` (311→175) → `InvestmentDetail` (1h)
- [x] **T-047** Split `LoanGroupCard.tsx` (314→183) → `LoanTable`, `GroupSettleModal` (1h)
- [x] **T-048** Split `ReportGenerator.tsx` (303→205) → `utils/reportPdf.ts` (1h)

## Phase 4 — Testing

- [ ] **T-049** Vitest + supertest setup for API integration tests (1h)
- [ ] **T-050** Smoke tests for all GET endpoints (2-3h) ← depends T-049
- [ ] **T-051** CRUD tests for transactions, accounts, loans (3-4h) ← depends T-049
- [ ] **T-052** Auth middleware tests (1-2h) ← depends T-049
- [ ] **T-053** Offline queue sync tests (2-3h) ← depends T-049

## Phase 5 — Recycle Bin / Soft-Delete

- [ ] **T-054** Recycle bin backend — soft-delete, restore, permanent-delete (4-6h)
- [ ] **T-055** Recycle bin frontend — RecycleBin component (4-6h) ← depends T-054

## Phase 6 — Feature Enhancements

- [ ] **T-056** Liability tracking (medium)
- [ ] **T-057** Budgeting module (medium)
- [ ] **T-058** Recurring transactions (medium)
- [ ] **T-059** Multi-currency support (hard)
- [ ] **T-060** Dashboard charts — pie + trend line via Recharts (medium)
- [ ] **T-061** PWA push notifications (medium)
- [ ] **T-062** CSV import (easy)
- [ ] **T-063** Excel export — `.xlsx` alongside PDF/CSV (easy)
- [ ] **T-064** Full-text search — SQLite FTS index (medium)

---

**Estimated remaining (Phases 4–5)**: ~14–24h · **Phase 6**: varies
