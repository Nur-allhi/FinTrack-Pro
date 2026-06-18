# Fix: Group Children Lost During Sync Pull

## Problem Statement
Accounts that were previously assigned to groups (via `parent_id`) no longer appear as children under their groups. The groups show "No accounts in this group" despite accounts having `parent_id` set correctly on the server.

## Root Causes

### 1. Broken FK Translation for `parent_id` (Primary)
`parent_id` on accounts references a GROUP's server ID, but the FK translation code in both `fetchData()` and `pullChanges()` only built an `accountServerIdToLocalId` map (from the `accounts` store). Since groups are stored in a **separate** `groups` store (not the `accounts` store), the lookup always failed, setting `parent_id` to `null` on every data refresh or sync cycle.

### 2. `fetchData()` Never Called on Initial Auth Load
The auto `fetchData()` call was removed in Session 41 (T-201) because the sync engine was supposed to handle data synchronization. But `GET /api/groups` (the only endpoint that computes `children`) is only called via `fetchData()`, never through the sync/pull flow.

### 3. Sync/Pull Returns Raw Records Without Children
The sync/pull endpoint (`GET /api/sync/pull`) returns raw `accounts` table records. Groups are extracted from this stream but lack computed fields (`children`, `child_count`, `accumulated_balance`).

## Fix (Three Parts)

### Part 1: Fix `parent_id` FK Translation
In both `fetchData()` (`useLocalData.ts`) and `pullChanges()` post-loop (`syncEngine.ts`):
- Build a `groupServerIdToLocalId` map from the groups store
- Use it as a fallback when `parent_id` translation fails in `accountServerIdToLocalId`

### Part 2: `recomputeGroupChildren()` in `syncEngine.ts`
Rebuilds each group's `children` array from local accounts by matching `parent_id`. Handles all `parent_id` representations:
- Server number (e.g., `5`)
- String number (e.g., `"5"`)
- Account local UUID (e.g., `"abc-123"`)
- Group local UUID (e.g., `"group-xyz"`)

Called at the end of `pullChanges()` and in `loadFromLocal()`.

### Part 3: Wire into `loadFromLocal()`
`loadFromLocal()` calls `recomputeGroupChildren()` after loading members + accounts, ensuring groups have correct children on page load without a server round-trip.

## Risk Assessment
- **MEDIUM** — Touches FK translation in core data paths. Changes are additive (fallback lookups) and don't alter existing control flow.
- The `recomputeGroupChildren()` function is read-heavy and only writes when children data changes.

## Testing Strategy
- TypeScript compilation check
- Verify accounts show as group children on page load
- Verify accounts retain parent_id after `fetchData()` refresh
- Verify accounts retain parent_id after sync cycle
