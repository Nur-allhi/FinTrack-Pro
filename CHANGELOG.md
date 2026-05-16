# Changelog

## 2026-05-16

### Add
- PWA support — service worker with offline caching, web manifest, installable app at `vite.config.ts`, `sw.ts`, `index.html`
- SVG + PNG app icons with white background at all required sizes at `public/icons/`
- Offline indicator banner + offline service with sync queue at `src/components/OfflineIndicator.tsx`, `src/services/offlineService.ts`
- Dark mode flash prevention — inline script + critical CSS in `<head>` at `index.html`
- Three dark mode variants — Deep, Dim, Night with per-variant CSS variables at `src/index.css`
- Accent color picker — custom primary color with 10 presets, applies globally via CSS variables at `src/components/Settings.tsx`, `src/App.tsx`
- User Profile page — account info, name, password change, data export/import at `src/components/UserProfile.tsx`
- Settings reorganization — sidebar sub-navigation with 3 sections (Appearance, Dashboard, Categories) at `src/components/Settings.tsx`
- Quick Tasks visibility toggle — show/hide todo widget from Dashboard Banner settings at `src/components/Settings.tsx`, `src/components/Dashboard.tsx`
- Admin panel storage display — per-user usage bar + total database size at `src/components/AdminPanel.tsx`, `api/routes/admin.ts`
- Storage limit enforcement — 5MB default, admin override per user, quota check on writes at `api/middleware/quota.ts`, `api/routes/transactions.ts`
- One-time password modal + Reset Password action at `src/components/AdminPanel.tsx`, `api/routes/admin.ts`
- Name field + email validation on user creation at `src/components/AdminPanel.tsx`, `api/routes/admin.ts`
- Admin check cached in localStorage — Admin Panel nav item appears instantly on refresh at `src/App.tsx`
- Data refresh button with toast feedback in User Profile at `src/components/UserProfile.tsx`
- User name shown on sidebar profile card + dashboard welcome greeting at `src/components/layout/Sidebar.tsx`, `src/components/Dashboard.tsx`

### Change
- Login flow — removed redundant backend token validation (Supabase → dashboard direct), 30s timeout with AbortController
- Login — stale Supabase sessions cleared on refresh (no more auto-spinning buttons)
- Font — removed JetBrains Mono, Inter used everywhere with `tabular-nums` for numbers at `src/index.css`
- Typography audit — all `text-[10px]`/`text-[11px]` labels bumped to `text-xs` across 16 components
- Card titles — bumped from `text-sm` to `text-base` across Dashboard, AccountCard, AccountManager, GroupManager, MemberManager, InvestmentTracker
- Sidebar — removed Total Assets counter, profile card is now clickable leading to UserProfile at `src/components/layout/Sidebar.tsx`
- Admin nav item — renamed "Users" → "Admin Panel", placed below Settings at `src/App.tsx`
- Settings — removed dead "Audit Alerts" toggle, removed Export & Import section (moved to Profile) at `src/components/Settings.tsx`
- FAB — fixed race condition where options persisted after closing modal at `src/components/FloatingActionButton.tsx`
- Dark mode — removed `--color-primary` override, accent color persists across themes at `src/index.css`
- PWA SW — switched to `injectManifest` with `skipWaiting()` + `clients.claim()` for immediate updates at `vite.config.ts`, `sw.ts`
- Auth config — removed dead legacy auth credentials (`password123`) from code at `api/config.ts`, `.env.example`

### Fix
- Dark mode white flash — multi-layer: inline localStorage script + critical CSS + SW auto-reload at `index.html`, `src/main.tsx`
- FAB options not closing after modal dismiss — added `!isAnyModalOpen` render guard at `src/components/FloatingActionButton.tsx`
- Admin panel mobile layout — responsive padding, text size, button sizing at `src/components/AdminPanel.tsx`
- Storage display not showing — per-table error handling in storage endpoint at `api/routes/admin.ts`
- Accent color crash on existing users — fallback for cached settings without `accentColor` at `src/App.tsx`
- Auto data fetch on login — moved fetch to `handleLogin` + `[isAuthenticated]` effect at `src/App.tsx`
- Admin check on auth change — admin tab appears without page refresh at `src/App.tsx`
- Settings page crash — fixed duplicate state declarations, unused props cleanup at `src/components/Settings.tsx`
- Profile page blocking navigation — added `useEffect([activeTab])` to reset `showProfile` at `src/App.tsx`
- Profile page missing page transition — added `showProfile` to motion key at `src/App.tsx`

### Fix
- Ledger balance sync — restored `onUpdate()` calls after save/delete at `src/components/Ledger.tsx`
- Ledger category filter — `setCategoryFilter(null)` removed to preserve filter across re-fetches at `src/components/Ledger.tsx`
- Select dropdown — `mousedown` → `click` event to prevent premature close with portal at `src/components/Select.tsx`
- DatePicker navigation — clicks on month/day buttons no longer close calendar (portal ref check) at `src/components/DatePicker.tsx`
- DatePicker viewport clipping — right-edge and bottom-edge boundary detection + flip at `src/components/DatePicker.tsx`
- TypeScript types — `any[]` replaced with `(Transaction & { runningBalance: number })[]` at `src/components/Ledger.tsx`
- TransactionForm props — `newTx` typed with `TransactionFormState` interface at `src/components/TransactionForm.tsx`
- Truncation math — `> 32` → `> 30` to match `slice(0, 30)` at `src/components/Ledger.tsx`
- ReportGenerator — added "Show all" toggle for 10-row preview limit at `src/components/ReportGenerator.tsx`
- Category rename import error — shows server error message in toast at `src/components/Settings.tsx`

### Add
- Dashboard Quick Tasks widget — todo list with localStorage persistence at `src/components/Dashboard.tsx`
- Report CSV export — downloadable CSV alongside PDF at `src/components/ReportGenerator.tsx`
- Report Category column — included in both CSV and PDF exports at `src/components/ReportGenerator.tsx`
- Account member context dropdowns — member name shown in all account selectors at `src/components/ReportGenerator.tsx`, `src/components/TransferModal.tsx`, `src/components/TransactionModal.tsx`

### Change
- TransactionForm — redesigned with desktop 2-row 12-col grid and mobile stacked layout matching `Design/` spec at `src/components/TransactionForm.tsx`
- TransactionForm date input — styled to match Select component (rounded-pill, bg-surface-soft, Calendar icon) at `src/components/TransactionForm.tsx`
- DebitCreditToggle — removed max-width cap, fills available space at `src/components/DebitCreditToggle.tsx`
- Select button padding — `py-2` → `py-3` to match input heights at `src/components/Select.tsx`
- Select dropdown — `overflow-hidden` → `overflow-y-auto` with `max-h-[200px]` at `src/components/Select.tsx`
- FAB — unified speed-dial styling, click-outside auto-close, auto-close on modal open at `src/components/FloatingActionButton.tsx`
- FAB — hidden on desktop (`md:hidden`), visible on mobile only at `src/App.tsx`
- Dashboard banner — removed Transfer Funds / Generate Report buttons at `src/components/Dashboard.tsx`
- Dashboard quick filters — fallback color for "All" and "Others" pills at `src/components/Dashboard.tsx`
- Ledger — replaced CSV download with bank-statement PDF (pure jsPDF) at `src/components/Ledger.tsx`
- Ledger — smoother optimistic updates, removed full re-fetch on save/delete at `src/components/Ledger.tsx`
- Report PDF — bank-statement format with proper locale and currency fallback at `src/components/ReportGenerator.tsx`

### Fix
- PDF numbers not in English — forced `en-US` locale on all `toLocaleString()` calls
- PDF currency symbol `ó` — ASCII-safe fallback `Tk ` for non-ASCII symbols in jsPDF Helvetica
- FAB not closing after posting — click-outside handler + modal state watcher at `src/components/FloatingActionButton.tsx`

## 2026-05-14

### Fix
- Dashboard "Transfer Funds" and "Generate Report" buttons — wired onClick handlers at `src/components/Dashboard.tsx`
- Settings export data — implemented JSON export at `src/App.tsx`
- Ledger download button — wired CSV export at `src/components/Ledger.tsx`
- Report Generator — applied `memberId` filter to report data at `src/components/ReportGenerator.tsx`
- Dashboard liabilities card — removed hardcoded 0, hidden behind `showLiabilities` setting at `src/components/Dashboard.tsx`
- Dashboard visibility toggles — wired `showCurrentAssets` and `showLiabilities` at `src/components/Dashboard.tsx`
- Dashboard Grid/List toggle — made functional with grid/list view switch at `src/components/Dashboard.tsx`
- Gemini model name — moved to `GEMINI_MODEL` env var at `src/services/geminiService.ts`
- TransactionForm — fixed missing `cn` import at `src/components/TransactionForm.tsx`
- `other` quick filter — fixed inverted logic on Dashboard at `src/components/Dashboard.tsx`
- Duplicate Liabilities card — removed duplicate hero section block at `src/components/Dashboard.tsx`
- Empty state button alignment — centered "Add Transaction" button at `src/components/Ledger.tsx`

### Add
- Toast notification system — `ToastProvider` + `useToast` hook replacing all `alert()` calls at `src/components/Toast.tsx`
- Loading states — `saving` state on submit buttons in AccountManager and MemberManager
- Dark mode — CSS variable system with Settings toggle at `src/index.css`, `src/components/Settings.tsx`
- Account Groups feature — parent/child account hierarchy with dedicated Groups page at `api/routes/groups.ts`, `src/components/GroupManager.tsx`
- Groups nav item — `Layers` icon in sidebar between Accounts and Investments at `src/App.tsx`
- Parent group assignment — group dropdown in account create/edit form at `src/components/AccountManager.tsx`
- Custom Select component — styled dropdown replacing native `<select>` elements at `src/components/Select.tsx`
- Delete group — DELETE endpoint + UI button with confirmation at `api/routes/groups.ts`, `src/components/GroupManager.tsx`
- Inline edit forms — edit form replaces card in place with motion animation at `src/components/AccountManager.tsx`
- Mobile card views — all list views now show compact cards on mobile instead of horizontal scroll at `src/components/Dashboard.tsx`, `src/components/AccountManager.tsx`, `src/components/GroupManager.tsx`
- Responsive sizing — all components optimized per screen size (mobile/tablet/desktop) across all pages
- Font size setting — small/normal/large base font scaling in Settings at `src/App.tsx`, `src/components/Settings.tsx`
- Working search — global search for accounts and members with results dropdown at `src/components/layout/Header.tsx`
- Dashboard quick filters — type filter pills (All/Banks/Cash/Mobile/Investments/Others) at `src/components/Dashboard.tsx`
- Interactive Members page — click member to see accounts + balances, click account to open ledger at `src/components/MemberManager.tsx`
- Sidebar backdrop — animated overlay on mobile menu open at `src/components/layout/Sidebar.tsx`
- Account type colors — system-wide color customization in Settings with color pickers at `src/components/Settings.tsx`, applied across Dashboard, AccountManager, MemberManager

### Change
- Sidebar redesigned — card-based nav items with gradient active state and motion animation at `src/components/layout/Sidebar.tsx`
- Account cards — compact design with type icons and left color accent bar at `src/components/AccountManager.tsx`
- Dashboard AccountCard — type-colored icon backgrounds, responsive sizing at `src/components/Dashboard.tsx`
- Color palette — aligned with DESIGN.md Coinbase spec at `src/index.css`
- Dropdown selectors — pill shape, hover states, focus ring at `src/index.css`
- Font loading — added weight 300 for Inter at `src/index.css`
- .card-xl — reduced padding from 2rem to 1.25rem globally at `src/index.css`
- Database schema — added `parent_id` column to accounts at `api/db.ts`
- API — accounts route excludes `type='group'`, accepts `parent_id` at `api/routes/accounts.ts`

### Remove
- AI integration — removed `geminiService.ts`, `@google/genai` dependency, all AI categorization and insights
