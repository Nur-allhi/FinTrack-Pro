# FinTrack-Pro — Bug Report

**Date**: 2026-06-11
**Branch**: feat/local-first
**Codebase**: 169 files, 2,151 symbols, 4,212 edges
**Total Bugs Found**: 45 (1 CRITICAL, 10 HIGH, 18 MEDIUM, 16 LOW)

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| CRITICAL | 1 | Data loss / sync corruption |
| HIGH | 10 | Broken features / security issues |
| MEDIUM | 18 | Incorrect behavior / edge cases |
| LOW | 16 | Code smells / minor issues |

### Top 3 Most Urgent Fixes

1. **BUG-002 (CRITICAL)**: `markTableSynced` no-ops for 6 tables cause infinite re-push loops
2. **BUG-016 (CRITICAL)**: Token refresh retry sends stale credentials, potentially causing infinite 401 loops
3. **BUG-001/BUG-035 (HIGH)**: Sync engine race condition and stuck-pending-records make sync unreliable

---

## Fix Groups (Bugs to Fix Together)

### Group 1: Sync Engine Core — `src/services/syncEngine.ts`
**12 bugs** | All in the same file, deeply interconnected

| Bug | Severity | Issue |
|-----|----------|-------|
| BUG-002 | CRITICAL | `markTableSynced` no-ops for 6 tables |
| BUG-001 | HIGH | `_isSyncing` race condition |
| BUG-003 | HIGH | Pull drops records with untranslatable FKs |
| BUG-012 | HIGH | FK maps built before stale account reset |
| BUG-035 | HIGH | Unresolvable FK records stuck pending forever |
| BUG-017 | MEDIUM | Push errors silently swallowed |
| BUG-018 | MEDIUM | Pull errors silently swallowed |
| BUG-021 | MEDIUM | `as never[]` bypasses type checking |
| BUG-036 | MEDIUM | Sync timestamp not atomic with upsert |
| BUG-039 | MEDIUM | Malformed `updated_at` causes lost updates |
| BUG-009 | LOW | `deleted_at: null` leaked into local records |
| BUG-007 | LOW | Stale listeners on HMR |

**Why together**: All touch the same sync flow. Fixing one without the others can cause new bugs.

---

### Group 2: Auth Service — `src/services/authService.ts`
**4 bugs** | All auth-related issues

| Bug | Severity | Issue |
|-----|----------|-------|
| BUG-016 | CRITICAL | Token refresh retry sends stale request |
| BUG-005 | HIGH | `onAuthStateChange` leaks subscription |
| BUG-027 | HIGH | Missing explicit credentials in fetch |
| BUG-037 | MEDIUM | Guest mode silently fails API calls |

**Why together**: All modify the same `apiFetch` / auth flow.

---

### Group 3: Logout & Auth Flow — `src/hooks/useAuth.ts`
**3 bugs** | Logout cleanup issues

| Bug | Severity | Issue |
|-----|----------|-------|
| BUG-019 | MEDIUM | `localStorage.clear()` wipes all site data |
| BUG-020 | MEDIUM | Sync scheduler not stopped on logout |
| BUG-038 | MEDIUM | Server unreachable sets "authenticated" |

**Why together**: All in the same logout/auth state logic.

---

### Group 4: Local DB — `src/services/localDb.ts`
**5 bugs** | Local database issues

| Bug | Severity | Issue |
|-----|----------|-------|
| BUG-004 | MEDIUM | `emptyBin` flushPending can fail during active sync |
| BUG-015 | MEDIUM | `emptyBin` misses 3 entity types |
| BUG-014 | MEDIUM | Balance recalc triggers spurious notifications |
| BUG-010 | LOW | Shadowed `now()` function |
| BUG-034 | LOW | Full balance recalc on any transaction change |

**Why together**: All in the same localDb module.

---

### Group 5: API Cascade Deletes — `api/db/`
**3 bugs** | Missing cascade logic

| Bug | Severity | Issue |
|-----|----------|-------|
| BUG-030 | HIGH | Account delete doesn't cascade to transactions |
| BUG-031 | HIGH | Loan delete doesn't cascade to transactions |
| BUG-032 | MEDIUM | Group delete orphans child accounts |

**Why together**: All add cascade soft-delete logic to API routes.

---

### Group 6: useLocalData Hook — `src/hooks/useLocalData.ts`
**4 bugs** | Data fetching issues

| Bug | Severity | Issue |
|-----|----------|-------|
| BUG-040 | MEDIUM | Double data fetch on authentication |
| BUG-013 | MEDIUM | New accounts may lose member association |
| BUG-011 | LOW | member_name lookup can return undefined |
| BUG-006 | LOW | Polling interval recreated unnecessarily |

**Why together**: All in the same data fetching hook.

---

### Group 7: App.tsx State — `src/App.tsx`
**5 bugs** | UI state management issues

| Bug | Severity | Issue |
|-----|----------|-------|
| BUG-028 | MEDIUM | localDb exposed on window global |
| BUG-045 | MEDIUM | Concurrent sync triggers from multiple sources |
| BUG-041 | HIGH | `selectedAccountId` type mismatch with `account.id` |
| BUG-042 | LOW | NaN from corrupted sessionStorage |
| BUG-044 | LOW | Stale dashboard filter from previous session |

**Why together**: All modify App.tsx state management.

---

## Individual Fixes (Separate Tasks)

| Bug | Severity | File | Issue |
|-----|----------|------|-------|
| BUG-008 | MEDIUM | `src/components/layout/Header.tsx:198` | `userEmail[0]` crash on empty string |
| BUG-025 | MEDIUM | `api/index.ts:49-106` | No CSRF protection on auth endpoints |
| BUG-033 | MEDIUM | `api/db/loans.ts:161-237` | Settlement doesn't update local balances |
| BUG-029 | LOW | `api/middleware/rateLimit.ts:3-9` | Rate limiter may not work behind proxy |
| BUG-023 | LOW | `api/routes/transactions.ts:24` | accountId not validated as number |
| BUG-024 | LOW | `api/middleware/auth.ts:35-39` | No Secure flag in non-production |
| BUG-026 | LOW | `shared/validation.ts:4-6` | Naive HTML sanitizer |
| BUG-022 | LOW | `api/routes/recyclebin.ts:20` | Fragile type cast pattern |
| BUG-043 | LOW | `src/components/Toast.tsx:33-35` | setTimeout not cleared on unmount |

---

## Recommended Fix Order

### Batch 1: Sync Engine Core (Group 1) — CRITICAL + HIGH
**Est. time**: 4-6 hours
**Risk**: HIGH — core sync logic
**Test**: Run `npx vitest run`, test offline→online sync, test account/loan CRUD

### Batch 2: Auth Service (Group 2) — CRITICAL + HIGH
**Est. time**: 2-3 hours
**Risk**: MEDIUM — auth flow
**Test**: Login/logout, token refresh, guest mode

### Batch 3: API Cascade Deletes (Group 5) — HIGH
**Est. time**: 2-3 hours
**Risk**: MEDIUM — server-side only
**Test**: Delete account with transactions, delete loan with settlements

### Batch 4: Logout & Auth Flow (Group 3) — MEDIUM
**Est. time**: 1-2 hours
**Risk**: LOW — logout edge cases
**Test**: Logout while syncing, offline logout

### Batch 5: Local DB (Group 4) — MEDIUM
**Est. time**: 1-2 hours
**Risk**: LOW — local data operations
**Test**: Empty recycle bin, balance recalculation

### Batch 6: useLocalData (Group 6) — MEDIUM
**Est. time**: 1-2 hours
**Risk**: LOW — data fetching
**Test**: Login data load, member assignment

### Batch 7: App.tsx State (Group 7) — MEDIUM + HIGH
**Est. time**: 1-2 hours
**Risk**: MEDIUM — UI state
**Test**: Account selection, session storage

### Batch 8: Individual Fixes — MEDIUM + LOW
**Est. time**: 2-3 hours (all 9)
**Risk**: LOW — isolated fixes
**Test**: Each fix individually

---

## Verification

After each batch, run:
```bash
npx tsc --noEmit          # Type check
npx vitest run            # Run tests
npm run build             # Verify build
```

After all batches:
```bash
npx gitnexus analyze      # Re-index
```

---

*Generated by codebase analysis on 2026-06-11*
*Updated with fix groups on 2026-06-11*
