# TODO — Address Data Flow Concerns

> **Plan**: `plans/DATA_FLOW_CONCERNS.md`
> **Branch**: `fix/data-flow-concerns`

---

## Concern 3 — Visibility change triggers unnecessary push (Low)

- [x] **T-301** Change visibility handler to `pullChanges()` + keep `reconcileBalances()` — `📄 plans/DATA_FLOW_CONCERNS.md:§Concern-3`
- [x] **T-302** Remove redundant 5-minute `_reconcileInterval` from sync scheduler — `📄 plans/DATA_FLOW_CONCERNS.md:§Concern-3`

## Concern 2 — `fetchData()` redundant with sync pull (Low)

- [x] **T-201** Remove auto `fetchData()` call from initial load effect in `useLocalData.ts` — `📄 plans/DATA_FLOW_CONCERNS.md:§Concern-2`
- [x] **T-202** Add orphan purge pass to `pullChanges()` in `syncEngine.ts` — `📄 plans/DATA_FLOW_CONCERNS.md:§Concern-2`

## Concern 1 — Conflict stalemate (Medium)

- [x] **T-101** Add `getConflictCount()`, `getConflictRecords()`, `resolveConflict()` to `localDb.ts` — `📄 plans/DATA_FLOW_CONCERNS.md:§Concern-1`
- [x] **T-102** Add `conflictCount` to `SyncStatus`, wire `refreshConflictCount()` into auto-refresh in `syncEngine.ts` — `📄 plans/DATA_FLOW_CONCERNS.md:§Concern-1`
- [x] **T-103** Add conflict icon (`AlertTriangle`) to `TransactionRow.tsx` / `TransactionCard.tsx` — `📄 plans/DATA_FLOW_CONCERNS.md:§Concern-1`
- [x] **T-104** Add conflict resolution UI tabs + actions to `RecycleBin.tsx` — `📄 plans/DATA_FLOW_CONCERNS.md:§Concern-1`

---

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

---

# TODO — Fix Group Children Lost During Sync Pull

> **Plan**: `plans/FIX_GROUP_CHILDREN_LOST_ON_SYNC.md`
> **Branch**: `fix/group-children-lost-on-sync`

---

- [x] **T-001** Preserve group computed fields (children, child_count, accumulated_balance, member_name) during sync pull in `syncEngine.ts` — prevents data loss when sync/pull returns raw accounts records without computed group children
