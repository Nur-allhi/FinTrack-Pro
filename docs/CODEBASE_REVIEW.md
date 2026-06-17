# FinTrack Pro — Full Codebase Review Report

**Date**: 2026-06-17 | **Version**: 2.0.0 | **Branch**: `main`

---

## Overview

Family finance tracker with offline-first architecture. React 19 + Express + Supabase + IndexedDB.

**Health**: ✅ Build passes | ✅ 37/37 tests pass | ⚠️ 1 TS error (test-only)

---

## Source Code Stats

| Area | Files | LOC |
|------|-------|-----|
| `src/` (frontend) | 74 | ~12,764 |
| `api/` (backend) | 37 | ~3,061 |
| `shared/` | 2 | ~323 |
| **Total** | **113** | **~15,825** |

---

## Current State

**Working tree**: 3 modified but unstaged files — `.opencode/opencode.json`, `AGENTS.md`, `CLAUDE.md` (agent config changes, not app code)

**Recent commits** (top 10): chore(docs): cleanup/consolidation → fix(ledger) → fix(sync) → fix(auth) → feat(security Phase 22) → feat(offline Phase 21) → fix(auth) → Phase 20 bug fixes.

**Local branches** (6): `dev`, `feat/local-first`, `feature/guest-mode-nudge`, `feature/onboarding-experience`, `feature/ui-ux-polish-improvement`, `fix/all-bugs`, `fix/security-audit`

**Unmerged remote branches**: `feat/liquid-glass-nav`, `feat/unified-write-modal`, `fix/dashboard-fix`

---

## Architecture

```
Frontend (React 19) → IndexedDB (localDb) → Sync Engine → Express API → Supabase
```

| Pattern | Detail |
|---------|--------|
| **Data flow** | local-first — all reads from IndexedDB, writes to localDb then async server sync |
| **Auth** | Supabase Auth (Google OAuth + Email/Password), HttpOnly cookies, CSRF double-submit |
| **Offline** | Full offline via IndexedDB + sync queue, PWA with StaleWhileRevalidate |
| **Security** | Helmet CSP, rate limiting (60/min API, 10/15min auth), Zod sanitization, investment ownership checks |
| **Code splitting** | 16 lazy-loaded route chunks, vendor splitting (supabase, charts, motion, html2canvas) |
| **Bundle** | Main 774 kB (206 kB gzip), SW precache 1,566 kB, lazy jspdf/xlsx ~850 kB combined |

---

## Issues Found

### 🔴 Critical / High
- **Working on `main` branch** — violates `.agent/rules/workflow.md` Section 1 ("NEVER code directly in main")

### 🟡 Medium
| # | Issue | File |
|---|-------|------|
| 1 | **8 files exceed 300 LOC rule** (max: 818) | syncEngine, WriteModal, localDb, WriteModalForms, GroupManager, useLocalData, App, AccountManager |
| 2 | **Unmerged feature branches** — liquid-glass-nav, unified-write-modal, dashboard-fix have changes not in `main` | remote branches |
| 3 | `plans/` directory has only `COMPLETED_PLANS.md` — DEAD link to `docs/TODO.md` in `.agent/rules/workflow.md` | workflow.md §4 |

### 🟢 Low
| # | Issue | Location |
|---|-------|----------|
| 4 | **TS error**: duplicate key in mock object | `api/tests/members.test.ts:23` |
| 5 | `selectedAccountId` type mismatch: `number \| null` vs `string` | `src/App.tsx` |
| 6 | Recharts `width/height = -1` warning | `src/components/InvestmentDetail.tsx` |
| 7 | Google Drive backup deferred (T-153/T-154/T-155) | needs manual GCP setup |
| 8 | No `React.memo` on page-level components (Dashboard, Ledger, etc.) | As per `PERFORMANCE_REPORT.md` |
| 9 | Google Fonts not preloaded via `<link rel="preload">` | Performance audit item |

### ✅ Fixed/Addressed
| Area | Status |
|------|--------|
| All 45 bugs (Phases 19-20) | ✅ Fixed |
| All 9 security issues (Phase 22) | ✅ Fixed |
| All 7 offline usability items (Phase 21) | ✅ Fixed |
| 17 schema mismatches (3-layer alignment) | ✅ Fixed |
| Stale docs deleted | ✅ 5 docs removed |
| Dead code (`SkeletonLoader.tsx`) | ✅ Deleted |

---

## Docs Status

| Doc | Status | Notes |
|-----|--------|-------|
| `docs/SESSIONLOG.md` | ✅ Active | 1282 lines, cumulative session history |
| `docs/AUDIT_REPORT.md` | ✅ Current | Last updated 2026-06-17 |
| `docs/PERFORMANCE_REPORT.md` | ✅ Current | Bundle metrics, memoization audit |
| `docs/USER_MANUAL.md` | ✅ Present | End-user docs |
| `plans/COMPLETED_PLANS.md` | ✅ Present | 11 consolidated plans |
| `docs/CODEBASE_REVIEW.md` | ✅ New | This file |

---

## Recommendations

1. **Move development off `main`** — create feature branches per AGENTS.md
2. **Merge or cleanup stale remote branches** — liquid-glass-nav, unified-write-modal, dashboard-fix
3. **Split 8 files over 300 LOC** — especially syncEngine.ts (818), WriteModal.tsx (683), localDb.ts (645)
4. **Fix the 1 TS error** in `api/tests/members.test.ts:23` (duplicate object key in mock)
