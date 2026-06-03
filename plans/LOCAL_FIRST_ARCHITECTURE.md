# Local-First Architecture — Implementation Plan

**Branch:** `feat/local-first`
**Date:** 2026-06-03
**Status:** Planning

---

## 0. Current Auth State (Important Context)

### What Exists
- **Login page** (`src/components/Login.tsx`): Has Google sign-in button + email/password sign-in
- **Supabase Auth**: Email/Password sign-in works (`authService.signInWithPassword()`)
- **Session management**: HttpOnly cookie (`sb-access-token`) + Supabase JS SDK localStorage tokens
- **Auth middleware** (`api/middleware/auth.ts`): Validates JWT, creates per-request Supabase client for RLS
- **Single active user**: Only the developer uses the app

### What Does NOT Exist
- **No signup system**: The Login page only has "Sign In" — no "Sign Up" or "Create Account"
- **Google OAuth not configured**: The Google sign-in button exists in UI but the OAuth provider is not set up in Supabase
- **No password reset**: No forgot password flow
- **No Google Drive backup**: Google Drive API integration not implemented
- **No local JSON export/import**: No manual backup option

### What We Need to Build
1. **Signup system** with email/password (Supabase `signUp` API)
2. **Password reset flow** (Supabase `resetPasswordForEmail` API)
3. **Configure Google OAuth** in Supabase + Google Cloud Console
4. **Google Drive backup** — automatic cloud backup to user's Google Drive
5. **Local JSON export/import** — manual backup as alternative to Google Drive

---

## 1. Vision & Goals

Transform FinTrack-Pro from a **server-first** (Supabase-dependent) app to a **local-first** app with optional cloud backups.

### Core Principles
- **Instant performance**: All reads/writes hit IndexedDB (~1-5ms) instead of Supabase (~200-500ms)
- **No signup barrier**: Guest users can use the full app without creating an account
- **Offline-first**: Every feature works without internet
- **Optional cloud backup**: Supabase is a backup layer, not a requirement

### User Experience Goals
- App renders instantly from local data (no splash screen blocking on network)
- Writes are instant — no double-click issues, no loading spinners for basic operations
- Slide in/out animations for data changes (no jarring refreshes)
- After ~5 entries, show a friendly signup nudge (not blocking)
- Guest data persists indefinitely in the browser
- Easy signup with email/password or Google OAuth
- Automatic cloud backup to Google Drive (if connected)
- Manual JSON export/import as alternative backup option

---

## 2. Architecture Overview

```
┌──────────────────────────────────────────────────┐
│                   UI Layer (React)                │
│  Renders instantly from IndexedDB                 │
│  Writes → IndexedDB (1-5ms) → instant UI update  │
└─────────────────────┬────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────┐
│           IndexedDB (Primary Store)               │
│  All entities: members, accounts, transactions... │
│  UUID IDs, sync_status, updated_at timestamps    │
└─────────────────────┬────────────────────────────┘
                      │ background sync (if authenticated)
┌─────────────────────▼────────────────────────────┐
│              Sync Engine (Background)             │
│  Push unsynced → Pull changes → Merge            │
│  Last-write-wins conflict resolution             │
└─────────────────────┬────────────────────────────┘
                      │
┌─────────────────────▼────────────────────────────┐
│         Supabase (Optional Cloud Backup)          │
│  Auth + PostgreSQL + RLS                          │
│  + client_id UUID column for sync mapping         │
└──────────────────────────────────────────────────┘
```

### Data Flow

**Guest User (no account):**
```
App load → read IndexedDB → render instantly
Write → IndexedDB (instant) → done
No server interaction
```

**Registered User (with account):**
```
App load → read IndexedDB → render instantly
                           → background sync to Supabase
Write → IndexedDB (instant) → render update → queue for sync
Sync engine → push unsynced to Supabase → pull server changes → merge
```

**Multi-Device (registered):**
```
Device A → write to IndexedDB → sync to Supabase
Device B ← read from Supabase ← sync to IndexedDB
Conflict: last-write-wins (based on updated_at timestamp)
```

---

## 3. IndexedDB Schema Design

### Database: `fintrack_local` (v1)

**Every entity store has these fields:**
- `id`: UUID string (client-generated via `crypto.randomUUID()`)
- `updated_at`: ISO 8601 timestamp of last local modification
- `sync_status`: `'pending'` | `'synced'` | `'conflict'`
- `_deleted`: Boolean (soft-delete flag, mirrors existing `deleted_at` pattern)

### Object Stores

```
members
  └─ key: id (UUID)
  └─ indexes: sync_status, _deleted

accounts
  └─ key: id (UUID)
  └─ indexes: member_id, parent_id, type, sync_status, _deleted

transactions
  └─ key: id (UUID)
  └─ indexes: account_id, date, category, sync_status, _deleted

loans
  └─ key: id (UUID)
  └─ indexes: lender_account_id, borrower_account_id, status, sync_status, _deleted

loan_settlements
  └─ key: id (UUID)
  └─ indexes: loan_id, sync_status

investments
  └─ key: id (UUID)
  └─ indexes: account_id, sync_status, _deleted

investment_returns
  └─ key: id (UUID)
  └─ indexes: investment_id, sync_status

groups
  └─ key: id (UUID)
  └─ indexes: member_id, sync_status, _deleted

budgets
  └─ key: id (UUID)
  └─ indexes: category, month, sync_status

recurring_transactions
  └─ key: id (UUID)
  └─ indexes: account_id, next_date, active, sync_status, _deleted

metadata
  └─ key: string (e.g., 'app_settings', 'guest_id', 'sync_timestamp', 'signup_nudge_count')

sync_log
  └─ key: id (auto-increment)
  └─ indexes: timestamp, direction, entity_type
```

### Migration from Current Cache

Current `cacheService.ts` stores arrays under single keys (`'list'`). The new schema stores individual records with UUID keys. On first load after update:

1. Read old array data from `members`, `accounts`, `transactions` stores
2. For each record, generate a UUID, set `sync_status = 'synced'`, `updated_at = now`
3. Write individual records to new schema
4. Delete old array entries
5. Bump DB version

---

## 4. UUID ID Strategy

### Local (IndexedDB)
- All new records use UUID v4 via `crypto.randomUUID()`
- No auto-increment integers

### Supabase (Server)
- Keep existing integer `id` columns (no migration of primary keys)
- Add new `client_id UUID UNIQUE` column to all tables
- Add new `updated_at TIMESTAMPTZ` column to all tables
- Create indexes on `client_id` for fast sync lookups

### Sync Mapping
```
Local Record:  { id: "a1b2c3d4-...", name: "Cash", ... }
                        ↕ (synced via client_id)
Server Record: { id: 42, client_id: "a1b2c3d4-...", name: "Cash", ... }
```

- `client_id` is the correlation key between local and server
- `id` (integer) remains the server primary key for RLS and foreign keys
- On first sync, server records get `client_id` assigned

---

## 5. Auth System (Signup + Login + Password Reset)

### 5.1 Signup System (New)

**File:** `src/components/Signup.tsx` (new)

**UI Flow:**
1. User clicks "Sign Up" on Login page
2. Signup form appears: Email, Password, Confirm Password
3. Submit → Supabase `signUp()` API → success → auto-login → redirect to app
4. If email already exists → show error "An account with this email already exists"

**Supabase API:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: email,
  password: password,
  options: {
    data: { display_name: name }  // optional
  }
});
```

**Validation Rules:**
- Email: valid format, required
- Password: minimum 8 characters, at least 1 letter and 1 number
- Confirm Password: must match password

**After Signup:**
- Supabase sends a confirmation email (if email confirmation is enabled)
- User can optionally verify email, but app works without verification
- Local guest data is migrated to the new account (see Section 7.3)

### 5.2 Login System (Modify Existing)

**File:** `src/components/Login.tsx` (modify)

**Changes:**
1. Remove Google sign-in button (OAuth not configured)
2. Add "Sign Up" link at bottom: "Don't have an account? Sign Up"
3. Add "Forgot Password?" link below password field
4. Keep email/password sign-in as-is

**Updated Login Flow:**
```
Login Page
  ├── Email + Password → Sign In → App
  ├── "Forgot Password?" → Password Reset Modal
  └── "Sign Up" → Signup Page
```

### 5.3 Password Reset (New)

**File:** `src/components/ForgotPassword.tsx` (new)

**UI Flow:**
1. User clicks "Forgot Password?" on Login page
2. Enter email address
3. Submit → Supabase `resetPasswordForEmail()` API → success → "Check your email" message
4. User clicks link in email → redirected to app with reset token
5. Enter new password → Supabase `updateUser()` API → success → redirect to login

**Supabase API:**
```typescript
// Send reset email
const { error } = await supabase.auth.resetPasswordForEmail(email, {
  redirectTo: `${window.location.origin}/reset-password`
});

// Update password (after redirect)
const { error } = await supabase.auth.updateUser({
  password: newPassword
});
```

### 5.4 Auth State Management

**File:** `src/hooks/useAuth.ts` (modify)

**Current State:**
```typescript
isAuthenticated: boolean | null  // null = loading, false = guest, true = authenticated
```

**New State:**
```typescript
type AuthState = 
  | { status: 'loading' }           // Checking auth state
  | { status: 'guest' }             // No account, using locally
  | { status: 'authenticated'; user: AuthUser }  // Logged in
```

**Auth Flow:**
```
App Load
  → Check Supabase session (existing token in localStorage)
  → If valid session → status: 'authenticated'
  → If no session → status: 'guest'
  → Render app immediately (don't block on auth check)
```

### 5.5 File Changes for Auth

| File | Change |
|------|--------|
| `src/components/Login.tsx` | Remove Google button, add "Sign Up" and "Forgot Password" links |
| `src/components/Signup.tsx` | **New** — Signup form with email/password |
| `src/components/ForgotPassword.tsx` | **New** — Password reset request form |
| `src/components/ResetPassword.tsx` | **New** — New password form (after email link) |
| `src/services/authService.ts` | Add `signUp()`, `resetPassword()`, `updatePassword()` methods |
| `src/hooks/useAuth.ts` | New auth state model, guest mode support |
| `src/App.tsx` | Route to Login/Signup/ResetPassword based on auth state |

---

## 6. Component Changes Summary

### Write Path Changes (All 26 endpoints)

| Component | Current Behavior | New Behavior |
|-----------|-----------------|--------------|
| `TransactionForm.tsx` | No loading state, no debounce | Instant local write, brief button disable |
| `TransactionModal.tsx` | Loading for online, none for offline | Always instant local write |
| `AccountForm.tsx` | Parent manages `saving` prop | Instant local write, `saving` = false immediately |
| `LoanManager.tsx` | Good loading states | Instant local write, sync in background |
| `TransferModal.tsx` | Loading for online, none for offline | Instant local write (creates 2 transactions) |
| `MemberManager.tsx` | Via `authService.apiFetch` | Instant local write |
| `GroupManager.tsx` | Via `authService.apiFetch` | Instant local write |
| `InvestmentTracker.tsx` | Via `authService.apiFetch` | Instant local write |
| `RecycleBin.tsx` | Via `authService.apiFetch` | Instant local write (set `_deleted = true`) |
| `Budgets` | Via `authService.apiFetch` | Instant local write |
| `RecurringTransactions` | Via `authService.apiFetch` | Instant local write |

### Read Path Changes

| Component | Current Behavior | New Behavior |
|-----------|-----------------|--------------|
| `App.tsx` | Blocks on `dataReady` until API responds | Renders immediately from IndexedDB |
| `useOfflineSync.ts` | Loads cache, then blocks on fetchData | Replaced by `useLocalData.ts` |
| `useTransactions.ts` | Fetches from API, merges offline queue | Reads directly from IndexedDB |
| `Dashboard.tsx` | Receives accounts from API | Receives accounts from local state |
| `Ledger.tsx` | Fetches transactions from API | Reads transactions from IndexedDB |
| Balance computation | Server sums all transactions | Local JS computation (~1-5ms) |

### Double-Click Fix

**Root cause:** `TransactionForm.tsx` has no loading state. `TransactionModal.tsx` and `TransferModal.tsx` lack loading protection on offline paths.

**Solution:** Since local writes are ~1-5ms, add a brief `isWriting` ref that disables the button during the write:

```typescript
const isWriting = useRef(false);

const handleSubmit = async (data) => {
  if (isWriting.current) return;
  isWriting.current = true;
  
  const record = { ...data, id: generateId(), updated_at: new Date().toISOString(), sync_status: 'pending' };
  await localDb.transactions.put(record);
  updateLocalState(record);
  
  isWriting.current = false;
};
```

---

## 7. Guest Mode Design

### 7.1 No Auth Required

- Guest users have no Supabase account
- All data stored in IndexedDB only
- Guest ID stored in `metadata` store (UUID generated on first visit)
- No API calls ever made (unless user signs up)

### 7.2 Signup Nudge

**Trigger:** After 5 transactions (configurable)

**File:** `src/components/SignupNudge.tsx` (new)

**Flow:**
1. User creates 5th transaction
2. Modal appears: "Your data is stored locally. Sign up to back up your data and access it from any device."
3. Options: "Sign Up" | "Maybe Later" | "Never Show Again"
4. Count stored in `metadata.signup_nudge_count`
5. "Never Show Again" sets `metadata.signup_nudge_dismissed = true`

### 7.3 Guest → Registered Migration

When a guest signs up:
1. All local data gets `user_id` assigned (from Supabase auth)
2. Sync engine pushes all local records to Supabase
3. Records get `sync_status = 'synced'`
4. Background sync begins

---

## 8. Data Backup (Google Drive + Local JSON)

Two backup options: **Google Drive** (automatic cloud backup) and **Local JSON** (manual download/upload).

### 8.1 Google Drive Backup (Automatic Cloud Backup)

**Files:** `src/services/googleDriveService.ts` (new)

**Prerequisites:**
1. Create Google Cloud Console project
2. Enable Google Drive API
3. Create OAuth 2.0 credentials
4. Configure Supabase Google provider with Client ID + Secret

**User Flow:**
1. Profile page → "Connect Google Drive" → Google OAuth consent screen
2. User authorizes → access token stored in Supabase `google_tokens` table
3. App automatically backs up data to Google Drive on every sync
4. Backup file: `FinTrack-Pro/backup-{userId}.json` in user's Google Drive

**Features:**
- Automatic backup after each sync (if authenticated)
- Restore from Google Drive backup on new device
- Manual "Backup Now" button in Profile
- Manual "Restore from Google Drive" button in Profile

**API Calls:**
- `files.create()` — create backup file in Google Drive
- `files.update()` — update existing backup
- `files.list()` — find backup file
- `files.get()` — download backup for restore

### 8.2 Local JSON Export/Import (Manual Backup)

**Files:** `src/services/exportService.ts`, `src/components/ImportModal.tsx`

**Export User Flow:**
- Profile page → "Export Data" → downloads JSON file to computer
- JSON contains all local data (members, accounts, transactions, etc.)

**Export Format:**
```json
{
  "version": "1.0",
  "exportedAt": "2026-06-03T12:00:00Z",
  "userId": "user-uuid-or-guest-id",
  "data": {
    "members": [...],
    "accounts": [...],
    "transactions": [...],
    "loans": [...],
    "investments": [...],
    "groups": [...],
    "budgets": [...],
    "recurring_transactions": [...]
  }
}
```

**Import User Flow:**
1. Profile page → "Import Data" → file picker appears
2. User selects JSON file → preview shows data summary
3. Confirm → data merged into IndexedDB (local wins for conflicts)
4. If authenticated, imported data is synced to Supabase

**Conflict Resolution:**
- Local data wins (imported data overwrites existing)
- User warned before import: "This will replace your current data"

### 8.3 Backup Button Location

**File:** `src/components/UserProfile.tsx` (modify)

Add buttons in Profile page:
- "Connect Google Drive" — initiates Google OAuth flow (or "Disconnect" if connected)
- "Backup Now" — manual backup to Google Drive (if connected)
- "Restore from Google Drive" — restore from cloud backup (if connected)
- "Export Data" — downloads JSON file
- "Import Data" — opens import modal

---

## 9. Sync Engine Design

### Push (Local → Server)

```typescript
async function pushUnsynced(): Promise<SyncResult> {
  const unsynced = await localDb.getUnsynced(); // all records with sync_status = 'pending'
  let pushed = 0, conflicts = 0;
  
  for (const record of unsynced) {
    // Check if server has a newer version
    const serverRecord = await fetchServerRecord(record.entity_type, record.id);
    
    if (serverRecord && serverRecord.updated_at > record.updated_at) {
      // Server wins — merge server data locally
      await localDb.upsertFromServer(record.entity_type, serverRecord);
      conflicts++;
    } else {
      // Local wins — push to server
      await upsertToServer(record.entity_type, record);
      await localDb.markSynced(record.entity_type, [record.id]);
      pushed++;
    }
  }
  
  return { pushed, conflicts };
}
```

### Pull (Server → Local)

```typescript
async function pullServerData(): Promise<number> {
  const lastSync = await localDb.getSyncTimestamp();
  const changes = await fetchServerChangesSince(lastSync);
  
  for (const change of changes) {
    await localDb.upsertFromServer(change.entity_type, change);
  }
  
  await localDb.setSyncTimestamp(Date.now());
  return changes.length;
}
```

### Sync Triggers

| Trigger | Frequency | Condition |
|---------|-----------|-----------|
| App load | Once | Authenticated + online |
| Tab visible | On each | Authenticated + online + pending changes |
| 30-second interval | Every 30s | Authenticated + online + pending changes |
| Online event | On reconnect | Authenticated + pending changes |
| After local write | Immediate | Authenticated + online (background) |

### Conflict Resolution

**Strategy: Last-Write-Wins (LWW)**

- Each record has an `updated_at` timestamp
- When pushing, if server has a newer `updated_at`, server wins
- When pulling, if local has a newer `updated_at`, local wins
- Conflicts are logged in `sync_log` store but not shown to user
- Sufficient for single-user or low-conflict family use

---

## 10. Supabase Migration

### Migration: `supabase/migrations/015_add_uuid_sync_fields.sql`

The migration file is stored at `supabase/migrations/015_add_uuid_sync_fields.sql`. It adds:

**Columns added to all 10 data tables:**
- `client_id UUID UNIQUE` — correlation key between local (UUID) and server (integer) records
- `updated_at TIMESTAMPTZ DEFAULT now()` — last-modified timestamp for conflict resolution

**Indexes (20 total):**
- `idx_{table}_client_id` on all 10 tables — fast sync lookups by client UUID
- `idx_{table}_updated_at` on all 10 tables — sync-since-timestamp queries

**Auto-update trigger:**
- `update_updated_at()` function + triggers on all 10 data tables
- Automatically sets `updated_at = now()` on every UPDATE, ensuring consistent timestamps without application-level bookkeeping

**Sync log table:**
- `sync_log` — server-side only, tracks sync operations per user
- RLS enabled with deny-all policy (`USING (false) WITH CHECK (false)`) — blocks anon/authenticated keys, service role bypasses RLS automatically

### RLS Notes

**Existing tables** (members, accounts, transactions, loans, etc.) already have RLS enabled via `007_enable_rls_all_tables.sql` with `auth.uid() = user_id` policies. The new `client_id` and `updated_at` columns don't need separate RLS policies — they sit on rows already protected by existing policies.

**sync_log** has RLS enabled with a deny-all policy because:
1. It's only accessed server-side via `supabaseAdmin` (which bypasses RLS)
2. The deny-all policy (`USING (false) WITH CHECK (false)`) blocks all anon/authenticated key access
3. This satisfies Supabase's safety check while maintaining zero client-side access

### New API Endpoint: `/api/sync`

**File:** `api/routes/sync.ts` (new)

**Endpoints:**
- `POST /api/sync/push` — Bulk upsert local changes
- `GET /api/sync/pull?since=<timestamp>` — Get changes since timestamp
- `POST /api/sync/initial` — Full download for first sync (guest → registered)

---

## 11. Animation Plan

### Slide In/Out for Data Changes

Using `framing-motion` (already in project):

**New transaction added:**
```tsx
<motion.div
  initial={{ opacity: 0, y: -20, height: 0 }}
  animate={{ opacity: 1, y: 0, height: 'auto' }}
  exit={{ opacity: 0, x: 100 }}
  transition={{ duration: 0.3 }}
>
  <TransactionRow />
</motion.div>
```

**Transaction deleted:**
```tsx
<motion.div
  exit={{ opacity: 0, x: 100, height: 0 }}
  transition={{ duration: 0.25 }}
>
  <TransactionRow />
</motion.div>
```

**Account balance updated:**
```tsx
<motion.span
  key={balance}
  initial={{ scale: 1.1, color: '#10B981' }}
  animate={{ scale: 1, color: 'inherit' }}
  transition={{ duration: 0.5 }}
>
  {formatCurrency(balance)}
</motion.span>
```

---

## 12. File Change Summary

### New Files

| File | Purpose |
|------|---------|
| `src/services/localDb.ts` | Primary IndexedDB database with CRUD operations |
| `src/services/syncEngine.ts` | Background sync to Supabase |
| `src/services/migrationService.ts` | One-time UUID migration for existing users |
| `src/services/exportService.ts` | JSON export for local backup |
| `src/services/googleDriveService.ts` | Google Drive backup/restore |
| `src/utils/ids.ts` | UUID generation utility |
| `src/hooks/useLocalData.ts` | Replaces `useOfflineSync.ts` |
| `src/components/Signup.tsx` | Signup form with email/password |
| `src/components/ForgotPassword.tsx` | Password reset request form |
| `src/components/ResetPassword.tsx` | New password form (after email link) |
| `src/components/SignupNudge.tsx` | Signup prompt popup |
| `src/components/ImportModal.tsx` | Import data from JSON file |
| `api/routes/sync.ts` | Bulk sync API endpoint |
| `supabase/migrations/015_add_uuid_sync_fields.sql` | UUID + updated_at columns |
| `supabase/migrations/016_add_google_tokens.sql` | Google OAuth tokens table |
| `public/offline.html` | Offline fallback page |

### Modified Files

| File | Change |
|------|--------|
| `src/App.tsx` | Remove `dataReady` gate, render from local data, add routes for auth pages |
| `src/components/Login.tsx` | Keep Google button (for OAuth), add "Sign Up" and "Forgot Password" links |
| `src/services/authService.ts` | Add `signUp()`, `resetPassword()`, `updatePassword()` methods |
| `src/hooks/useAuth.ts` | Guest mode state, no auth check for guests |
| `src/components/UserProfile.tsx` | Add Google Drive + Export/Import buttons |
| `src/services/cacheService.ts` | Delete (replaced by `localDb.ts`) |
| `src/services/offlineService.ts` | Merge into `syncEngine.ts` |
| `src/hooks/useOfflineSync.ts` | Delete (replaced by `useLocalData.ts`) |
| `shared/types.ts` | Add `sync_status`, `updated_at`, `client_id` fields |
| `api/db/queries.ts` | Support UUID `client_id` in queries |
| `api/index.ts` | Add sync route, make data routes conditional |
| All `api/routes/*.ts` | Accept `client_id` field, support sync |
| All `src/components/*.tsx` | Local-first writes, loading states, animations |
| `src/hooks/useTransactions.ts` | Read from localDb, not API |
| `sw.ts` | Update cache strategies for local-first |

---

## 13. Implementation Phases

### Phase 1: Auth System (Signup + Password Reset)
**Priority:** Critical | **Effort:** Medium | **Impact:** Foundation for user accounts

1. Create `src/components/Signup.tsx` — signup form
2. Create `src/components/ForgotPassword.tsx` — password reset request
3. Create `src/components/ResetPassword.tsx` — new password form
4. Update `src/services/authService.ts` — add `signUp()`, `resetPassword()`, `updatePassword()`
5. Update `src/components/Login.tsx` — remove Google button, add links
6. Update `src/hooks/useAuth.ts` — new auth state model
7. Update `src/App.tsx` — add routes for auth pages

### Phase 2: Local-First IndexedDB Core
**Priority:** Critical | **Effort:** Large | **Impact:** Foundation

1. Create `src/services/localDb.ts` with full IndexedDB schema
2. Create `src/utils/ids.ts` for UUID generation
3. Update `shared/types.ts` with new fields
4. Create `src/hooks/useLocalData.ts` to replace `useOfflineSync.ts`
5. Rewrite `src/App.tsx` to remove `dataReady` gate

### Phase 3: Component Write Path Migration
**Priority:** Critical | **Effort:** Large | **Impact:** Instant UI

1. Update `TransactionForm.tsx` — instant local write
2. Update `TransactionModal.tsx` — instant local write
3. Update `AccountForm.tsx` — instant local write
4. Update `LoanManager.tsx` — instant local write
5. Update `TransferModal.tsx` — instant local write
6. Update `MemberManager.tsx` — instant local write
7. Update `GroupManager.tsx` — instant local write
8. Update `InvestmentTracker.tsx` — instant local write
9. Update `RecycleBin.tsx` — instant local write
10. Fix double-click issues in all components

### Phase 4: Guest Mode + Signup Nudge
**Priority:** High | **Effort:** Medium | **Impact:** No signup barrier

1. Update `src/services/authService.ts` — make auth optional
2. Update `src/hooks/useAuth.ts` — guest mode state
3. Create `src/components/SignupNudge.tsx`
4. Test guest → registered migration flow

### Phase 5: Supabase Sync Engine
**Priority:** High | **Effort:** Large | **Impact:** Cloud backup

1. Create `supabase/migrations/015_add_uuid_sync_fields.sql`
2. Create `src/services/syncEngine.ts`
3. Create `api/routes/sync.ts`
4. Create `src/services/migrationService.ts` for existing users
5. Implement push/pull/merge logic
6. Test multi-device sync

### Phase 6: Data Backup (Google Drive + JSON)
**Priority:** Medium | **Effort:** Medium | **Impact:** Backup options

1. **Google OAuth Setup:**
   - Create Google Cloud Console project
   - Enable Google Drive API
   - Create OAuth 2.0 credentials
   - Configure Supabase Google provider
   - Create `supabase/migrations/016_add_google_tokens.sql`

2. **Google Drive Integration:**
   - Create `src/services/googleDriveService.ts`
   - Add "Connect Google Drive" button in Profile
   - Implement automatic backup on sync
   - Implement manual "Backup Now" button
   - Implement "Restore from Google Drive" button

3. **Local JSON Export/Import:**
   - Create `src/services/exportService.ts` — JSON export
   - Create `src/components/ImportModal.tsx` — JSON import
   - Update `src/components/UserProfile.tsx` — add Export/Import buttons

### Phase 7: Animations & Polish
**Priority:** Medium | **Effort:** Small | **Impact:** UX polish

1. Add slide-in animations for new transactions
2. Add slide-out animations for deleted transactions
3. Add balance update animations
4. Update `OfflineIndicator.tsx` with sync status
5. Create `public/offline.html`

---

## 14. Performance Comparison

| Operation | Current (Server-First) | Local-First | Improvement |
|-----------|----------------------|-------------|-------------|
| App load (first visit) | 500-1500ms | 50-150ms | **3-10x faster** |
| App load (returning, cached) | 500-1500ms (blocks on API) | 50-150ms (instant) | **10x faster** |
| Add transaction | 200-500ms + spinner | 1-5ms + instant UI | **50-100x faster** |
| Read ledger | 200-500ms or 50ms cache | 10-50ms always | **5-50x faster** |
| Offline support | Partial (cache read only) | Full (all reads/writes) | **Complete** |
| Signup required | Yes | No (guest mode) | **Barrier removed** |

---

## 15. Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|-----------|
| IndexedDB storage limit (~50% of disk) | Medium | Show storage usage in Settings; warn at 80% |
| Sync conflicts with multi-device | Medium | Last-write-wins is sufficient for family use |
| Existing user data loss during migration | High | One-time full backup before migration; test thoroughly |
| Guest data lost on browser clear | Medium | Show warning in Settings; encourage signup for backup |
| UUID migration breaks existing API consumers | High | Keep integer IDs as `id` in Supabase, add `client_id` as new column |
| Large data sets slow local queries | Low | IndexedDB indexes handle 10K+ records efficiently |
| Supabase email confirmation required | Low | Can disable in Supabase dashboard for testing |

---

## 16. Acceptance Criteria

- [ ] Signup with email/password works (creates Supabase account)
- [ ] Login with email/password works
- [ ] Password reset via email works
- [ ] App renders instantly from IndexedDB (no splash screen blocking on network)
- [ ] All writes complete in <10ms (no loading spinners for basic operations)
- [ ] Guest mode works without any API calls
- [ ] Double-click produces only one entry (never two)
- [ ] New transactions slide in smoothly
- [ ] Deleted transactions slide out smoothly
- [ ] Signup nudge appears after 5 transactions
- [ ] Registered users can sync data to Supabase in background
- [ ] Multi-device sync works with last-write-wins
- [ ] Export data downloads JSON file
- [ ] Import data merges from JSON file
- [ ] Google OAuth setup works (Supabase + Google Cloud Console)
- [ ] Connect Google Drive initiates OAuth flow
- [ ] Backup to Google Drive works
- [ ] Restore from Google Drive works
- [ ] Offline mode works for all features
- [ ] No data loss during guest → registered migration
- [ ] Existing users can migrate without data loss

---

## 17. Open Questions

1. Should we add email confirmation requirement or skip it for faster signup?
2. Should the sync engine run in a Web Worker for better performance?
3. Should we add a "Force Sync" button in Settings?
4. Should we require password confirmation on signup (confirm password field)?
5. Should we add rate limiting on signup endpoint?
6. Should Google Drive backup be automatic on every sync, or manual only?
7. Should we encrypt backup data before uploading to Google Drive?
8. Should we limit Google Drive backup file size or number of backups?

---

## Next Steps

1. Review this plan and provide feedback
2. Confirm open questions
3. Begin Phase 1 implementation (Auth System)
4. Set up feature branch `feat/local-first`
