# TODO — FinTrack Pro

> Generated from `IMPLEMENTATION_PLAN.md` · 2026-06-02
> **72 completed**, **9 remaining** (Phases 0–9)

---

## Phase 0 — Critical Fixes ✅

- [x] **T-065** Fix 3 TypeScript errors (App.tsx, Settings.tsx, csvImport.ts) (1-2h)

## Phase 0 — In-Flight Issues ✅

- [x] **T-029** Typography audit (30m)
- [x] **T-030** Dark mode micro-interactions (1h)

## Phase 1 — Data Layer & Architecture ⏳

- [x] **T-031** Create unified query interface `api/db/queries.ts` (4-6h)
- [x] **T-032** Extract shared Zod schemas to `shared/validation.ts` (2-3h)
- [x] **T-033** Swap `supabaseAdmin` for regular client in data queries (1-2h) — AsyncLocalStorage per-request client
- [x] **T-034** Migrate token from `localStorage` to HttpOnly cookie (4-6h)

## Phase 2 — Type Safety & Cleanup ⏳

- [x] **T-035** Replace `any` types across API layer (1-2h) — 2 instances fixed
- [x] **T-036** Replace `any` types across frontend components (4-6h) — 10 instances fixed
- [x] **T-037** Wrap `/api/import` in a DB transaction (1h)
- [x] **T-038** Add rate limiting middleware (2-3h)
- [x] **T-066** Replace `any` types in frontend services (2-3h) — 12 instances fixed

## Phase 3 — File Splitting (<300 LOC) ⏳

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

---

## Phase 8 — Audit Leftovers ✅

- [x] **T-069** Input sanitization — sanitizeHtml transform on all user-input Zod fields (2-3h) — from audit #13

---

**Estimated remaining**: 0h — all tasks complete
