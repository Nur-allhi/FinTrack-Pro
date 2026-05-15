# Handoff — 15 May 2026 (Session 3)

## Session Summary

Replaced hardcoded single-user auth with Supabase Auth (Google OAuth + Email/Password), multi-tenant data isolation via `user_id` column, and admin panel for user management. Removed old basic auth and guest login.

## Changes

### Supabase Auth Integration
- **JWT auth middleware** (`api/middleware/auth.ts`) — verifies Supabase access tokens via `supabaseAdmin.auth.getUser()`, attaches `req.user` with `id` and `email`
- **`requireAdmin` middleware** — checks `req.user.email` against `ADMIN_EMAILS` config list
- **Login endpoints** (`api/index.ts`) — `POST /api/auth/login` validates JWT, `GET /api/auth/me` returns user + admin status, `GET /api/auth/config` exposes Supabase URL/key to frontend
- **Config** (`api/config.ts`) — added `ADMIN_EMAILS` parsing

### Admin Panel
- **`api/routes/admin.ts`** — `GET /api/admin/users` lists Supabase Auth users, `POST /api/admin/users` creates user (email + password, auto-confirmed), `DELETE /api/admin/users/:id` removes user
- **`src/components/AdminPanel.tsx`** — User management UI: create user form, user list with provider/date info, delete action
- Admin tab (`Shield` icon) shown in sidebar only for users whose email is in `ADMIN_EMAILS`

### Multi-Tenant Data Isolation
- All 5 Supabase tables: added `user_id UUID` column
- Every Supabase query in all route files now filters by `.eq("user_id", req.user!.id)`
- Every INSERT includes `user_id: req.user!.id`
- SQLite fallback remains single-user (no multi-tenancy)

### Frontend Auth
- **`src/services/authService.ts`** — Supabase client init via `/api/auth/config`, `signInWithGoogle()`, `signInWithPassword()`, `getSession()`, `apiFetch()` helper auto-attaches Bearer token
- **`src/components/Login.tsx`** — Two-step UI: choose Google OAuth or Email/Password. Handles OAuth redirect, session recovery
- **`src/App.tsx`** — Auth check via localStorage token + `/api/auth/me` admin status fetch
- All 9 components that make API calls — switched from `fetch()` to `authService.apiFetch()`

### Database Migration
- `supabase/migrations/001_add_user_id.sql` — adds `user_id UUID` column + indexes to all 5 tables, with optional RLS policies

### Old Auth Removed
- `POST /api/login` (hardcoded admin/password123) — removed
- `POST /api/login/guest` — removed
- `AUTH_USERNAME`/`AUTH_PASSWORD`/`AUTH_TOKEN_PREFIX` — demoted to fallback only
- Guest login button — removed from Login UI

## New Files
- `api/middleware/auth.ts` — JWT verification + admin check middleware
- `api/routes/admin.ts` — admin user management endpoints
- `src/services/authService.ts` — frontend Supabase Auth client + apiFetch helper
- `src/components/AdminPanel.tsx` — admin user management UI
- `src/components/Login.tsx` — rewritten with Google OAuth + Email/Password
- `supabase/migrations/001_add_user_id.sql` — multi-tenant migration
- `GUIDE.md` — step-by-step setup guide

## Files Changed
- `api/config.ts` — added ADMIN_EMAILS config
- `api/db.ts` — added supabaseAdmin client
- `api/index.ts` — auth endpoints, admin routes, requireAuth on all data routes
- `api/routes/members.ts` — user_id filtering
- `api/routes/accounts.ts` — user_id filtering
- `api/routes/transactions.ts` — user_id filtering
- `api/routes/transfers.ts` — user_id filtering
- `api/routes/investments.ts` — user_id filtering
- `api/routes/groups.ts` — user_id filtering
- `api/routes/export.ts` — user_id filtering
- `src/App.tsx` — auth flow, admin detection, admin tab
- `src/components/AccountManager.tsx` — authService.apiFetch
- `src/components/GroupManager.tsx` — authService.apiFetch
- `src/components/InvestmentTracker.tsx` — authService.apiFetch
- `src/components/Ledger.tsx` — authService.apiFetch
- `src/components/MemberManager.tsx` — authService.apiFetch
- `src/components/ReportGenerator.tsx` — authService.apiFetch
- `src/components/Settings.tsx` — authService.apiFetch
- `src/components/TransactionModal.tsx` — authService.apiFetch
- `src/components/TransferModal.tsx` — authService.apiFetch
- `.env.example` — added SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAILS
