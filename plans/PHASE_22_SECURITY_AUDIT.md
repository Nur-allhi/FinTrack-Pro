# Phase 22 — Security Audit Fixes

**Branch**: `fix/security-audit`  
**Source**: `docs/SECURITY_AUDIT.md`

## Tasks

1. **T-300** — Add `helmet` middleware for security headers
2. **T-301** — Fix `investment_returns` queries — add `userId` filter
3. **T-302** — Fix search route Supabase `.or()` injection
4. **T-303** — Add Zod validation schemas for budgets and recurring_transactions
5. **T-304** — Remove `/api/auth/config` endpoint
6. **T-305** — Add rate limiting to `/api/auth/session`
7. **T-306** — Add CSRF token validation for state-changing requests
8. **T-307** — Fix cookie `Secure` flag — use `localhost` check instead of `NODE_ENV`
9. **T-308** — Add user_id ownership check for investment_returns route

## Implementation Steps

### HIGH Priority

**T-300**: Install `helmet`, add `app.use(helmet())` at top of middleware chain in `api/index.ts`.

**T-301**: Update `getInvestmentReturns()` to accept `userId` and filter by `user_id`. Update `createInvestmentReturn()` to accept `userId` and include in insert. Update route handlers.

**T-302**: Replace `.or()` filter strings with safer parameterized `.textSearch()` and `.ilike()` methods. Validate input length/characters.

**T-303**: Add `budgetSchema` and `recurringSchema` to `shared/validation.ts`. Apply to POST routes in budgets and recurring.

**T-304**: Remove the `/api/auth/config` endpoint from `api/index.ts` (lines 102-107).

### MEDIUM Priority

**T-305**: Apply `authLimiter` to the `/api/auth/session` route.

**T-306**: Add CSRF protection using double-submit cookie pattern: GET endpoint returns token, POST/PUT/PATCH/DELETE middleware validates header matches cookie.

**T-307**: Change cookie `Secure` flag logic from `NODE_ENV === "production"` to checking `req.hostname !== "localhost"`.

**T-308**: Add `user_id` check in the `GET /:id/returns` route — verify the investment belongs to the authenticated user.
