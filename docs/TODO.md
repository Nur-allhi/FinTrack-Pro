# TODO — Offline Reliability + Background Sync Overhaul

> **Plan**: `plans/OFFLINE_SYNC_OVERHAUL.md`
> **Branch**: `fix/offline-sync-overhaul`

---

- [x] **T-001** Auth timeout — add 3s timeout to `refreshSession()`, 5s to `init()` — `📄 plans/OFFLINE_SYNC_OVERHAUL.md:§Step-1`
- [x] **T-002** Register Background Sync + 60s fallback timer — `📄 plans/OFFLINE_SYNC_OVERHAUL.md:§Step-2`
- [x] **T-003** Retry queue with exponential backoff — `📄 plans/OFFLINE_SYNC_OVERHAUL.md:§Step-3`
- [x] **T-004** FetchData cleanup + `client_id` dedup fix — `📄 plans/OFFLINE_SYNC_OVERHAUL.md:§Step-4`
- [x] **T-005** Periodic balance reconciliation — `📄 plans/OFFLINE_SYNC_OVERHAUL.md:§Step-5`
- [x] **T-006** SW mutation queue for failed POST/PUT/DELETE — `📄 plans/OFFLINE_SYNC_OVERHAUL.md:§Step-6`
- [x] **T-007** Verify (tests, lint, typecheck) + update docs — `📄 plans/OFFLINE_SYNC_OVERHAUL.md:§Step-7`
