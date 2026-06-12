# Guest Mode — Sign-up Nudge Enhancement

## Problem

Guest mode is local-only (IndexedDB, API calls blocked). Users who enter as guests often forget to sign up, risking data loss if they clear their browser data or switch devices. There is already a `SignupNudge` component, but it only triggers after 5+ transactions.

## Requirement

Show a sign-up prompt to guest users:
1. **On return** — Every time a guest comes back to the app (each session)
2. **Before close** — When the guest tries to close or reload the app
3. Keep guest mode **local-only** — no server-side changes

## Solution

Minimum changes to trigger the existing `SignupNudge` modal more aggressively.

### Implementation

#### Step 1 — Show nudge on every guest session start

**File**: `src/App.tsx`

- Remove the transaction-count threshold condition in `checkSignupNudge`
- Show the nudge every time `authStatus === 'guest'` (if not permanently dismissed)

#### Step 2 — Show nudge before closing/reloading

**File**: `src/App.tsx`

- Add a `beforeunload` event listener when user is guest
- On `beforeunload`, show the nudge modal instead of the browser's default prompt
- Use `e.preventDefault()` + `e.returnValue = ''` to trigger the browser's native leave confirmation as a fallback

#### Step 3 — Track session-based dismissal (per session, not permanent)

**File**: `src/App.tsx` or `src/hooks/useAuth.ts`

- Use `sessionStorage` to track "dismissed this session" so the nudge doesn't re-appear mid-session after dismissing
- The permanent dismissal via "Never Show Again" persists in IndexedDB (`signup_nudge_dismissed`)

### Minimal diff approach

The existing `SignupNudge` component UI is fine as-is. Only the trigger logic in `App.tsx` changes:

| Change | File | Lines |
|--------|------|-------|
| Nudge on every guest session | `src/App.tsx` | Modify `checkSignupNudge` — remove count check |
| Session-level dismissal tracking | `src/App.tsx` | Add `sessionStorage` check |
| Beforeunload nudge | `src/App.tsx` | Add `beforeunload` effect for guests |

No backend changes. No changes to auth flow.

## Risk Assessment

- **Low**: Minimal code changes, existing SignupNudge component unchanged
- **Low**: "Never Show Again" persists in IndexedDB and is respected
- **Low**: Session dismissal prevents mid-session annoyance
- **Low**: `beforeunload` handler only added for guests

## Testing

1. Open app as guest → nudge appears (if not permanently dismissed)
2. Dismiss → continue using app → nudge doesn't reappear this session
3. Close tab → browser leave confirmation shows (native dialog)
4. Re-open → nudge appears again (new session)
5. Click "Never Show Again" → nudge never appears on return
