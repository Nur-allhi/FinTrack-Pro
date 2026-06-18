# TODO — Fix Blank Screen When Offline (PWA)

> **Plan**: `plans/OFFLINE_BLANK_SCREEN_FIX.md`
> **Branch**: `fix/offline-sync-overhaul`

---

- [x] **T-001** Offline auth fast path — skip server checks when offline, trust cached session — `📄 plans/OFFLINE_BLANK_SCREEN_FIX.md:§Step-1`
- [x] **T-002** Offline guest data loading in `useLocalData` — load from IndexedDB regardless of auth; add `hasLocalData` flag; add 3s loading timeout — `📄 plans/OFFLINE_BLANK_SCREEN_FIX.md:§Step-2`
- [x] **T-003** Render app for offline guests with local data in `App.tsx` — bypass Login page when offline + data exists — `📄 plans/OFFLINE_BLANK_SCREEN_FIX.md:§Step-3`
- [x] **T-004** Verify (lint, typecheck, manual offline scenarios) — `📄 plans/OFFLINE_BLANK_SCREEN_FIX.md:§Step-4`
- [x] **T-017** PWA double-load fix — capture isUpdate at register time, willReplace guard, reg.installing race handling — `📄 src/main.tsx`
- [x] **T-018** API error normalization — asError() helper wrapping plain Supabase errors into Error instances — `📄 api/db/queries.ts, api/db/*.ts, api/routes/*.ts`
- [x] **T-019** Fix AbortError orphans in withTimeout — swallow loser promise rejections in Promise.race — `📄 api/db.ts`
- [x] **T-020** Add reachability cache to fetchWithTimeout — 30s cooldown on AbortError, markDbFailure/markDbSuccess — `📄 api/db.ts`
- [x] **T-021** Add requireDbReachable middleware to all 11 data GET routes — instant 503 when DB unreachable — `📄 api/routes/*.ts`
