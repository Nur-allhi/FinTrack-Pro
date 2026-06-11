# Security Audit — FinTrack Pro

**Date**: 2026-06-11
**Scope**: Full codebase audit (Express API, React frontend, Supabase DB, Service Worker)
**Risk Scale**: 🟠 HIGH → 🟡 MEDIUM → 🟢 LOW

---

## Summary

| Severity | Count | Actionable |
|----------|-------|------------|
| 🟠 HIGH | 5 | Fix required |
| 🟡 MEDIUM | 5 | Fix recommended |
| 🟢 LOW | 2 | Informational |

---

## 🟠 HIGH

### H-1: Missing Security Headers (No Helmet)

**File**: `api/index.ts`
**Risk**: Missing `helmet` middleware leaves the app vulnerable to clickjacking, MIME sniffing, and XSS via missing headers.

**Missing headers**:
- `Content-Security-Policy`
- `Strict-Transport-Security`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection`

**Fix**: Install `helmet` and add `app.use(helmet())`.

### H-2: Investment Returns — Missing `user_id` Authorization

**Files**: `api/db/investments.ts:19-28`, `api/routes/investments.ts:20-24,44-49`

```typescript
// getInvestmentReturns — no user_id filter
async function getInvestmentReturns(investmentId: number) {
  return db().from("investment_returns").select("*").eq("investment_id", investmentId)
}
// createInvestmentReturn — no user_id in insert
async function createInvestmentReturn(investmentId, date, amount, percentage?) {
  return db().from("investment_returns").insert([{ investment_id, date, amount, percentage }])
}
```

- `getInvestmentReturns`: Any authenticated user can query returns for any investment ID — no `user_id` filter.
- `createInvestmentReturn`: No `user_id` field in the insert — will be **rejected by Supabase RLS** at runtime (policy: `WITH CHECK (auth.uid() = user_id)`).

**Fix**: Add `userId` parameter to both functions and filter/insert with `user_id`.

### H-3: Search Route — Supabase `.or()` Injection Risk

**File**: `api/routes/search.ts:26,34,56,73`

```typescript
const tsQuery = q.split(/\s+/).filter(Boolean).join(' & ');
.or(`fts.teq.${tsQuery},particulars.ilike.%${q}%`)
```

User input is directly interpolated into Supabase `.or()` filter strings. While Supabase's query builder provides partial protection, crafted input could manipulate the filter syntax.

**Fix**: Validate/sanitize input before interpolation, or use parameterized filter methods instead of raw `.or()` strings.

### H-4: Budget & Recurring Routes — No Zod Input Validation

**Files**: `api/routes/budgets.ts:28-30`, `api/routes/recurring.ts:31`

```typescript
// budgets POST — plain existence checks, no schema:
if (!category || !amount || !month) { ... }
// recurring POST — same:
if (!account_id || !particulars || !amount || !frequency || !next_date) { ... }
```

These routes accept raw body fields with no type/format validation and no `sanitizeHtml` transform. All other entity routes (transactions, accounts, loans, members, groups) use Zod schemas from `shared/validation.ts`.

**Fix**: Define Zod schemas for budget and recurring entities in `shared/validation.ts` and validate before DB operations.

### H-5: `/api/auth/config` Leaks Supabase Credentials

**File**: `api/index.ts:102-107`

```typescript
app.get("/api/auth/config", (_req, res) => {
  res.json({ supabaseUrl: process.env.SUPABASE_URL || "", supabaseAnonKey: process.env.SUPABASE_ANON_KEY || "" });
});
```

Unauthenticated endpoint exposes the Supabase project URL and anon key. While the anon key is technically public, exposing it alongside the project URL in an unauthenticated endpoint is unnecessary information disclosure.

**Fix**: Remove this endpoint — the frontend can get these from env vars injected at build time.

---

## 🟡 MEDIUM

### M-1: No Rate Limiting on `/api/auth/session`

**File**: `api/index.ts:77`

The `/api/auth/session` endpoint is registered before the global `apiLimiter` (line 113) and has no individual rate limiter. This allows token validation brute-force.

**Fix**: Apply `authLimiter` to `/api/auth/session`.

### M-2: No CSRF Protection

**File**: `api/middleware/auth.ts`

`SameSite=Strict` cookies mitigate browser-based CSRF but no explicit CSRF token is used. Non-browser clients or future cross-origin deployments would be vulnerable.

**Fix**: Add CSRF token generation and validation for state-changing requests.

### M-3: Cookie Secure Flag is Environment-Dependent

**File**: `api/middleware/auth.ts:36-38`

```typescript
const isProd = process.env.NODE_ENV === "production";
`${COOKIE_NAME}=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=3600${isProd ? "; Secure" : ""}`
```

The `Secure` flag is only applied when `NODE_ENV === "production"`. If misconfigured, cookies are sent over unencrypted HTTP.

**Fix**: Always set `Secure` when not on `localhost`, or set it unconditionally.

### M-4: IndexedDB Data Stored in Plaintext

**File**: `src/services/localDb.ts`

All local financial data (account balances, transactions, loans, investments) is stored unencrypted in the browser's IndexedDB. Any browser extension, compromised dependency, or XSS can read this data.

**Fix**: Encrypt sensitive fields before storing in IndexedDB, or rely on browser-level isolation.

### M-5: Investment Returns — IDOR via Route Parameter

**File**: `api/routes/investments.ts:22`

```typescript
router.get("/:id/returns", async (req, res) => {
  const data = await getInvestmentReturns(Number(req.params.id));
```

The route accepts an investment ID from the URL but never verifies the investment belongs to the authenticated user. (Mitigated by RLS if properly configured.)

**Fix**: Add a `user_id` check before returning returns.

---

## 🟢 LOW

### L-1: Error Messages Leak Internal Details

**File**: `api/index.ts:73`, various routes

```typescript
res.status(500).json({ error: message });
```

The `error.message` from exceptions is returned directly to the client. While Supabase generally returns safe messages, this could leak internal details.

### L-2: Guest Mode Authenticated via sessionStorage

**File**: `src/hooks/useAuth.ts:33`

```typescript
if (sessionStorage.getItem('guest_mode') === 'true') {
```

Client-side authentication for guest mode — trivially bypassable but server auth is properly enforced via JWT.

---

## Previously Fixed (from prior audits)

| Issue | Status |
|-------|--------|
| Token in localStorage → HttpOnly cookie | ✅ `api/middleware/auth.ts` |
| `supabaseAdmin` used for data queries | ✅ `api/db.ts` — per-request client via AsyncLocalStorage |
| Input sanitization (XSS) | ✅ `shared/validation.ts` — `sanitizeHtml` on all Zod fields |
| Rate limiting | ✅ `api/middleware/rateLimit.ts` — 300/min API, 10/15min auth |
| `/api/import` missing auth middleware | ✅ Fixed |
| Error standardization | ✅ `sendError()` + `errorHandler` |

---

## What's Done Well ✅

- **JWT auth** via HttpOnly, SameSite=Strict cookies
- **Row-Level Security** on ALL database tables (`007_enable_rls_all_tables.sql`)
- **Per-request Supabase client** with user's JWT for RLS enforcement
- **Rate limiting** on API (300/min) and auth endpoints (10/15min)
- **Zod validation + HTML sanitization** on most entity routes
- **`.env` excluded from git** via `.gitignore`
- **Unhandled rejection/exception handlers** registered
- **Error boundaries** on React frontend
- **No raw SQL queries** — all DB access via Supabase query builder
- **Cascade soft-deletes** with user_id scoping

---

## Recommended Fix Priority

1. **T-300** — Add `helmet` middleware — quick, high impact
2. **T-301** — Fix `investment_returns` queries (H-2) — broken auth, may fail at runtime
3. **T-303** — Add Zod validation to budgets and recurring routes (H-4) — missing sanitization
4. **T-302** — Fix search route `.or()` injection (H-3) — input sanitization gap
5. **T-305** — Add rate limiting to `/api/auth/session` (M-1) — brute-force vector
