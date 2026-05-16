# Handoff — 16 May 2026 (Session 4)

## Session Summary

PWA support, dark mode overhaul, settings reorganization, User Profile page, admin panel enhancements, and extensive UX stability improvements. Branch `dev` ready for merge to `main`.

## Changes

### PWA & Offline
- **Service worker** (`sw.ts`, `vite.config.ts`) — switched to `injectManifest` strategy with `skipWaiting()` + `clients.claim()`
- **Web manifest** — icons at all sizes, theme color, standalone display
- **Offline service** (`src/services/offlineService.ts`) — online/offline detection, sync queue for pending writes
- **OfflineIndicator** (`src/components/OfflineIndicator.tsx`) — banner when offline
- **App icons** — SVG + 192px/512px PNG generated from logo via `sharp`

### Dark Mode
- **Flash fix** (`index.html`) — inline script reads localStorage + critical CSS before first paint
- **3 variants** (`src/index.css`) — `dark` (Deep), `dark-dim`, `dark-night` with custom CSS classes
- **Style selector** (`src/components/Settings.tsx`) — pill selector visible when dark mode on
- **Accent color** (`src/App.tsx`, `src/components/Settings.tsx`) — custom primary color, 10 presets, updates CSS variables + theme-color meta tag
- **Persistence** — `darkModeStyle` saved to localStorage + IndexedDB

### Settings & Profile
- **Settings reorganized** (`src/components/Settings.tsx`) — sub-navigation with 3 sections: Appearance, Dashboard, Categories. Desktop sidebar nav, mobile pill tabs.
- **User Profile page** (`src/components/UserProfile.tsx`) — Account Info (name, email), Security (change password), Data (export/import/refresh/clear)
- **Export/Import moved** — from Settings to Profile page
- **Dead toggle removed** — "Audit Alerts" removed (no notification backend)
- **Quick Tasks toggle** — `showTodos` setting controls dashboard todo widget visibility
- **Sidebar profile card** — clickable entire card opens User Profile, shows name + email, no separate Settings link

### Admin Panel
- **Storage usage** — per-user MB/KB display with progress bar at `src/components/AdminPanel.tsx`, `api/routes/admin.ts`
- **Storage limits** — 5MB default, admin override per user, quota check on transaction POST at `api/middleware/quota.ts`
- **One-time password** — password shown in modal on creation, not stored. Reset Password flow with new endpoint at `api/routes/admin.ts`
- **Name field + email validation** on user creation at `src/components/AdminPanel.tsx`, `api/routes/admin.ts`
- **Admin check cached** — `is_admin` in localStorage, Admin Panel nav appears instantly on refresh
- **Database summary** — `GET /api/admin/storage/summary` shows total DB size at top of Users page
- **Renamed** "Users" → "Admin Panel", moved below Settings in nav

### Login
- **Removed backend validation step** — `validateAndLogin` eliminated, token trusted directly from Supabase (was adding 2-5s delay)
- **Stale session cleanup** — Supabase sessions without matching `auth_token` are cleared on mount
- **Timeout safety** — 30s AbortController on all auth calls, "Request timed out" error shown

### Auth & Config
- **Removed dead credentials** — `AUTH_USERNAME`/`AUTH_PASSWORD`/`AUTH_TOKEN_PREFIX` deleted from `api/config.ts` and `.env.example`
- **Service worker auto-update** — SW registration in `main.tsx` sends `SKIP_WAITING`, reloads on activate

### UI Audit
- **Typography standardized** — all `text-[10px]`/`text-[11px]` changed to `text-xs` (12px) across 16 components
- **Card titles** — bumped from `text-sm` to `text-base` for better readability
- **FAB** — fixed sticky options after modal close with `isAnyModalOpen` render guard

## New Files
- `sw.ts` — custom service worker with precaching + skipWaiting
- `src/components/UserProfile.tsx` — user profile page
- `src/components/OfflineIndicator.tsx` — offline banner
- `src/services/offlineService.ts` — offline detection + sync queue
- `api/middleware/quota.ts` — storage quota check middleware
- `USER_MANUAL.md` — comprehensive user documentation

## Files Changed
- `index.html` — PWA meta tags, inline dark mode script + critical CSS, manifest link
- `vite.config.ts` — VitePWA plugin with injectManifest
- `src/App.tsx` — showProfile state, UserProfile render, accent color effect, admin cache, dark mode style
- `src/main.tsx` — SW registration with SKIP_WAITING + auto-reload
- `src/index.css` — dark-dim + dark-night CSS classes, removed JetBrains Mono
- `src/components/layout/Sidebar.tsx` — profile card as clickable button, removed Total Assets
- `src/components/Settings.tsx` — sub-navigation, 3 sections, removed export/import, removed audit alerts
- `src/components/Dashboard.tsx` — showTodos toggle support
- `src/components/FloatingActionButton.tsx` — isAnyModalOpen render guard
- `src/components/Login.tsx` — simplified flow, stale session cleanup
- `src/components/AdminPanel.tsx` — storage display, password modal, reset password, name field, responsive
- `src/components/AccountCard.tsx` — bumped title size
- `src/components/AccountManager.tsx` — bumped title size
- `src/components/GroupManager.tsx` — bumped title size
- `src/components/MemberManager.tsx` — bumped title size
- `src/components/InvestmentTracker.tsx` — bumped title size
- `api/config.ts` — removed dead auth credentials
- `api/routes/admin.ts` — storage endpoint, reset password, name field, PATCH user metadata
- `api/routes/transactions.ts` — quota middleware on POST
- `.env.example` — removed old AUTH_USERNAME/PASSWORD
- `supabase/migrations/001_add_user_id.sql` — added `IF NOT EXISTS` for idempotent re-runs

## Environment
- `SUPABASE_SERVICE_ROLE_KEY` required for admin features (user management, storage queries)
- Admin users set via `ADMIN_EMAILS` env var
- Supabase migration must be run: `supabase/migrations/001_add_user_id.sql`

### Latest (2026-05-16 cont.)
- **User name display** — name from Profile shown on sidebar card + Dashboard welcome greeting
- **Nav routing fix** — `useEffect([activeTab])` clears `showProfile` so nav items work after visiting Profile
- **Page animation** — Profile now has the same fade/slide transition as other pages
- **Sidebar profile card** — reads `localStorage.getItem('user_name')` with email prefix fallback

---

## Session 5 — 16 May 2026 (fixes)

### Vercel Deployment Fixes

- **FAB white screen crash** (root cause: `FloatingActionButton`, `TransactionModal`, `TransferModal` shared one `<Suspense fallback={null}>` — lazy-loading a modal would replace ALL children with `null`, and any chunk-load error crashed the whole app since there was no error boundary)
  - Imported `FloatingActionButton` **eagerly** (it's tiny, no need for lazy)
  - Wrapped each modal in its own `<Suspense>` boundary
  - Wrapped modals in `<ErrorBoundary>` to catch chunk-load failures gracefully
  - Moved FAB outside the modal Suspense boundaries entirely
- **ErrorBoundary** (`src/components/ErrorBoundary.tsx`) — class-based boundary that logs errors and renders fallback instead of crashing the React tree
- **Admin panel not showing** (root cause: `/api/auth/me` API call fails silently on Vercel cold start, `.catch(() => {})` swallows errors, `isAdmin` stays `false`)
  - Added `console.warn` logging for the admin check failure
  - Added auto-retry after 3 seconds on failure

## Branch
- Current: `dev`
- Ready to merge to `main`
