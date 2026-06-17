# FinTrack Pro — Performance Audit Report

**Date**: 2026-06-17
**Last Updated**: 2026-06-17
**Status**: Full codebase audit complete (Phases 1–22). Current metrics reflect all features: offline-first, security hardening, 45 bug fixes, recurring/budget/investment modules.

---

## Bundle Sizes (Current Build)

| Asset | Size | Gzip | Notes |
|-------|------|------|-------|
| Main entry (`index-*.js`) | **774 kB** | 206 kB | Core app: React, routing, hooks, types, shared logic |
| CSS (`index-*.css`) | 70 kB | 12 kB | Tailwind + global styles |
| **Vendor chunks** | | | Code-split via `manualChunks` |
| `vendor-supabase` | 174 kB | 46 kB | `@supabase/supabase-js` |
| `vendor-charts` | 387 kB | 115 kB | `recharts` — loaded on Dashboard visit |
| `vendor-motion` | 94 kB | 31 kB | `motion` — animation library |
| `vendor-html2canvas` | 202 kB | 48 kB | Screenshot export |
| `vendor-react` | 0 kB | 0 kB | Empty — tree-shaken into main entry |
| **Lazy chunks (on-demand)** | | | Dynamic `import()` |
| `jspdf` + autotable | 422 kB | 139 kB | Loaded on PDF export click |
| `xlsx` | 430 kB | 143 kB | Loaded on XLSX export click |
| `purify.es` | 23 kB | 9 kB | DOMPurify (sanitization) |
| **16 route-level page chunks** | 7–33 kB each | — | Every page is lazy-loaded (see below) |

### Comparison vs Phase 9

| Metric | Phase 9 (Jun 2) | Current (Jun 17) | Change |
|--------|------------------|-------------------|--------|
| Main entry | 733 kB (195 kB gzip) | 774 kB (206 kB gzip) | **+5.6%** — Phases 10–22 features |
| SW precache | 1,488 kB | 1,568 kB | **+5.4%** — new modules added |
| Pre-phase-9 baseline | 1,015 kB (276 kB gzip) | — | Baseline for comparison |

> The modest size increase is warranted: 45 bugs fixed, 9 security issues resolved, recurring transactions, budgets, offline sync engine, localDb, and IndexedDB persistence were all added in Phases 10–22.

---

## Route-Level Code Splitting

**16 components** lazy-loaded via `React.lazy()` in `src/App.tsx`:

| Route | Chunk Size | Gzip |
|-------|-----------|------|
| Dashboard | 20.5 kB | 5.8 kB |
| Ledger | 25.6 kB | 6.9 kB |
| Settings | 24.4 kB | 6.1 kB |
| AccountManager | 20.3 kB | 5.2 kB |
| GroupManager | 17.9 kB | 4.6 kB |
| LoanManager | 18.1 kB | 4.7 kB |
| MemberManager | 7.3 kB | 2.3 kB |
| InvestmentTracker | 8.3 kB | 2.7 kB |
| ReportGenerator | 11.9 kB | 3.9 kB |
| RecycleBin | 6.5 kB | 2.5 kB |
| WriteModal | 33.0 kB | 7.1 kB |
| Login | 7.0 kB | 2.3 kB |
| Signup | 6.8 kB | 2.2 kB |
| ForgotPassword | 4.9 kB | 1.5 kB |
| ResetPassword | 7.0 kB | 1.9 kB |
| SignupNudge | 2.8 kB | 1.3 kB |

All wrapped in `<Suspense>` with `<LoadingScreen />` fallbacks.

---

## React.memo / useMemo / useCallback Usage

### React.memo (3 components)
| Component | File | Notes |
|-----------|------|-------|
| `TransactionRow` | `src/components/TransactionRow.tsx:21` | ✅ Present since Phase 9 |
| `TransactionCard` | `src/components/TransactionCard.tsx:21` | ✅ Present since Phase 9 |
| `AccountCard` | `src/components/AccountCard.tsx:23` | ✅ Added in T-078 |

⚠️ **Missing**: `Dashboard`, `Ledger`, `Settings`, `GroupManager`, `LoanManager`, `AccountManager`, `MemberManager` — none wrapped in `React.memo`. These re-render when their parent re-renders.

### useMemo (12 calls in 3 files)
| File | Count | Usage |
|------|-------|-------|
| `Dashboard.tsx` | 7 | `typeFilters`, `activeAccounts`, `filteredAccounts`, `groupFilteredAccounts`, `groupedByMember`, `unassignedAccounts`, `totalBalance`, `totalLiabilities` |
| `LoanManager.tsx` | 1 | `groupedLoans` |
| `LoanGroupCard.tsx` | 1 | `uniqueBorrowers` |

### useCallback (25 calls in 11 files)
Widely used for event handlers, async data fetchers, and modal toggles across `App.tsx`, `WriteModal.tsx`, `Toast.tsx`, `BudgetManager.tsx`, `RecurringManager.tsx`, `DashboardCharts.tsx`, `RecycleBin.tsx`, `Modal.tsx`, `Select.tsx`, `DatePicker.tsx`, `RenameModal.tsx`.

---

## Service Worker & Caching

| Strategy | Target | Details |
|----------|--------|---------|
| `precacheAndRoute` | All build assets | 54 entries, 1,568 KiB — CSS, JS, HTML, fonts, icons |
| `StaleWhileRevalidate` | Documents (pages) | `pages` cache |
| `StaleWhileRevalidate` | `GET /api/*` | `api-cache`, max 50 entries, 5-min TTL |
| `ExpirationPlugin` | API responses | 5-minute max age, LRU eviction |
| `offlineFallback` | Navigation | Falls back to `/offline.html` |
| Background Sync | `sync-offline-queue` | Triggers `SYNC_OFFLINE_QUEUE` on reconnect |
| Push notifications | `showNotification` | Subscribes to server push events |

### Precache exclusions (lazy chunks)
```
vendor-charts*, vendor-html2canvas*, vendor-xlsx*,
jspdf*, xlsx*, AreaChart*, ReportGenerator*, html2canvas*
```

---

## API Call Patterns

### Startup Auth Flow (`useAuth.ts`)
| Path | # Calls | Scenario |
|------|---------|----------|
| Happy path (valid token) | **1× GET** `/api/auth/me` | Authenticated user with fresh token |
| Stale token recovery | 2× GET + 1× HEAD | Token refresh succeeds but /api/auth/me initially fails (400ms retry window) |
| Guest / no session | 1× HEAD + 1× GET | `isServerReachable()` probe, then final check |
| Offline startup | 1× HEAD (aborted 1.5s) | Falls to guest mode if server unreachable |

> **Before T-079**: 2× `/api/auth/me` on every startup. Now consolidated but with retry logic for stale token edge cases.

### Data Loading (`useLocalData.ts`)
All reads go through IndexedDB (`localDb`) first, then sync from server. This avoids waterfall API calls:
- `localDb.getMembers()` + `localDb.getAccounts()` + `localDb.getGroups()` — parallel IndexedDB reads
- Background sync pushes writes immediately via `syncEngine.syncNow()`

### Caching
- Cache-busting `?_=${Date.now()}` removed (T-075) — was defeating SW caching
- GET API routes use `StaleWhileRevalidate`: instant from cache, updated in background

---

## Font Loading

| Technique | Status |
|-----------|--------|
| `<link rel="preconnect">` to Google Fonts | ✅ `fonts.googleapis.com` + `fonts.gstatic.com` |
| `display=swap` | ✅ Via Tailwind utility classes |
| Dark mode flash prevention | ✅ Inline `<script>` before any `<link>` tags |
| `<link rel="preload">` for font files | ❌ **Missing** — fonts are discovered via Google Fonts CSS, not preloaded |

---

## Local-First Architecture (Performance Impact)

| Feature | Benefit |
|---------|---------|
| IndexedDB reads (`localDb`) | ✅ All data reads hit localDb first — instant, no network wait |
| IndexedDB indexes | ✅ `account_id` index on transactions for filtered queries |
| Sync engine | ✅ Incremental sync, pending queue, `syncNow()` on write |
| Write-through | ✅ Writes go to localDb immediately, sync to server in background |
| Guest mode | ✅ Works fully offline with local persistence |

---

## Potential Improvements (Low Priority)

| # | Issue | Impact | Effort |
|---|-------|--------|--------|
| 1 | No `React.memo` on page-level components (Dashboard, Ledger, Settings, etc.) | Low — route changes trigger full remount anyway | Low |
| 2 | `AccountCard` `onClick` inline arrow function creates new reference every render, defeating `memo` | Low — only affects Dashboard re-renders | Low |
| 3 | Google Fonts not preloaded — discovered via CSS `@import` equivalent | Low — preconnect already avoids DNS/conn latency | Low |
| 4 | `index.es` sub-chunk (159 kB) created by dependency module format — unactionable | Info | N/A |
| 5 | Main entry at 774 kB could be further split (e.g., extract `date-fns`, `idb`, `zod`) | Medium — delays initial paint | Medium |

---

## Bundle Breakdown by Category (Uncompressed)

```
Main entry         774 kB  (core app + shared)
vendor-supabase    174 kB  (Supabase client)
vendor-charts      387 kB  (recharts)
vendor-motion      94 kB   (animation)
vendor-html2canvas 202 kB  (screenshot export)
jspdf + autotable  422 kB  (PDF export - lazy)
xlsx               430 kB  (XLSX export - lazy)
16 route chunks    ~230 kB (pages - lazy)
CSS                70 kB   (Tailwind + global)

Total (all)       ~2,783 kB
Total (initial)   ~1,701 kB (precache)
```

---

## Previous Changes (Phase 9 — preserved for reference)

| Task | Change | Impact |
|------|--------|--------|
| T-070 | Server deps → devDependencies | Removed from frontend bundle |
| T-071 | Manual chunk splitting | 7 → 5 vendor chunks |
| T-072 | Font preconnect | Reduced font loading latency |
| T-073 | Dashboard useMemo | 8 memoization wrappers |
| T-074 | `defaultSettings` → module scope | Avoided inline object creation |
| T-075 | Removed cache-busting | Enabled SW caching |
| T-076 | Lazy-load jspdf/xlsx | Removed 780 kB from main bundle |
| T-078 | React.memo on AccountCard | Prevented unnecessary re-renders |
| T-079 | Consolidated auth calls | 2× → 1× on happy path |
| T-080 | SW precache exclusions | 2,677 kB → 1,488 kB |

---

## All Tasks Complete

All Phase 9-22 tasks complete. No deferred performance items remain beyond the low-priority improvements listed above.
