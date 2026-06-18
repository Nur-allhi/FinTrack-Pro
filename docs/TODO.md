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
