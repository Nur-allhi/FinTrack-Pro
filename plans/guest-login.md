# Guest Login — Anonymous Auth

## Problem

The current "Continue as Guest" mode is local-only (IndexedDB). All API calls are blocked with a fake 403 response, preventing guests from syncing data, using cloud features, or accessing any server-side functionality. Guest data is trapped in the browser.

## Solution

Use Supabase **Anonymous Auth** (`signInAnonymously()`) to give guests a real JWT token. This creates an actual `auth.users` entry with `is_anonymous = true`, allowing guests to use all API endpoints just like registered users. When they later sign up, `updateUser({ email, password })` converts the anonymous user to a permanent one — same UUID, no data migration needed.

### Prerequisite

Supabase project must have **Allow anonymous sign-ins** enabled:
- Supabase Dashboard → Authentication → Providers → Anonymous → Enable

## Implementation Steps

### Step 1 — Add `signInAnonymously()` to authService

**File**: `src/services/authService.ts`

- Add a `signInAnonymously()` method that calls `sb.auth.signInAnonymously()`
- Returns the session (same shape as `signInWithPassword`)

### Step 2 — Remove guest API blocking for anonymous auth users

**File**: `src/services/authService.ts`

- The `_guestMode` flag currently blocks ALL non-auth API calls with a 403
- Change: only block if `_guestMode && !_hasAnonymousSession` (or similar)
- After anonymous sign-in succeeds, set `_guestMode = false` and instead track that we're in anonymous mode

Actually simpler: remove the `_guestMode` blocking entirely and let auth handle it. If the user has a valid session cookie, API calls work. If not, they get a real 401.

### Step 3 — Wire `handleContinueAsGuest` to anonymous auth

**File**: `src/hooks/useAuth.ts`

- Modify `handleContinueAsGuest`:
  1. Call `authService.signInAnonymously()`
  2. Get `access_token` from response
  3. Call `await handleLogin(token)` — reuses existing session set + verify flow
  4. On failure, fall back to current local-only guest mode (offline fallback)

### Step 4 — Convert guest Signup to use `updateUser`

**File**: `src/components/Signup.tsx`

- Detect if the current Supabase session is anonymous (`session.user.is_anonymous`)
- If yes, call `authService.updateUser({ email, password })` instead of `authService.signUp()`
- This keeps the same user UUID — no data migration needed

**File**: `src/services/authService.ts`

- Add an `isAnonymousSession()` helper
- Add `updateUser()` method (wraps `sb.auth.updateUser()`)

### Step 5 — Sync local data after guest login

**File**: `src/hooks/useAuth.ts`

- After anonymous auth succeeds in `handleContinueAsGuest`, trigger `syncNow()` to push any existing local (IndexedDB) data to the server
- This ensures guest data created offline is preserved

### Step 6 — Update `/api/auth/me` to return `is_anonymous`

**File**: `api/index.ts`

- The `/api/auth/me` endpoint currently returns `{ user: { id, email } }`
- Add `is_anonymous` field from Supabase user metadata
- Allows frontend to know the session type for the Signup conversion UI

### Step 7 — Clean up stale `_guestMode` references

**File**: `src/services/authService.ts`, `src/hooks/useAuth.ts`

- Remove or repurpose `_guestMode` / `setGuestMode` — no longer blocks API
- Guest status is now derived from `session.user.is_anonymous` (on the backend) or `authStatus === 'guest'` (frontend state)

## Files Changed

| File | What |
|------|------|
| `src/services/authService.ts` | Add `signInAnonymously()`, `updateUser()`, `isAnonymousSession()` — modify `apiFetch()` guest blocking |
| `src/hooks/useAuth.ts` | Wire anonymous auth into `handleContinueAsGuest` — trigger sync after guest login |
| `src/components/Signup.tsx` | Detect anonymous session → use `updateUser()` instead of `signUp()` |
| `api/index.ts` | Add `is_anonymous` to `/api/auth/me` response |

## Risk Assessment

- **Low**: Existing email/password login flow is unchanged
- **Low**: Guest button becomes async (loading state needed)
- **Medium**: Supabase project must have anonymous auth enabled — add env check / error handling
- **Low**: Data migration — using `updateUser()` avoids the need for UUID transfer entirely

## Testing Strategy

1. Click "Continue as Guest" → should get a real session, API calls work
2. Create data as guest, refresh → data persists (synced to server)
3. Guest clicks "Sign Up" → email/password added to same user, data preserved
4. Logout → can log back in with email/password
5. Offline scenario → fall back to local-only guest mode gracefully
