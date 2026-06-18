# TODO — Fix Blank Screen When Offline (PWA)

> **Plan**: `plans/OFFLINE_BLANK_SCREEN_FIX.md`
> **Branch**: `fix/offline-sync-overhaul`

---

- [ ] **T-001** Offline auth fast path — skip server checks when offline, trust cached session — `📄 plans/OFFLINE_BLANK_SCREEN_FIX.md:§Step-1`
- [ ] **T-002** Offline guest data loading in `useLocalData` — load from IndexedDB regardless of auth; add `hasLocalData` flag; add 3s loading timeout — `📄 plans/OFFLINE_BLANK_SCREEN_FIX.md:§Step-2`
- [ ] **T-003** Render app for offline guests with local data in `App.tsx` — bypass Login page when offline + data exists — `📄 plans/OFFLINE_BLANK_SCREEN_FIX.md:§Step-3`
- [ ] **T-004** Verify (lint, typecheck, manual offline scenarios) — `📄 plans/OFFLINE_BLANK_SCREEN_FIX.md:§Step-4`
