# Changelog

## 2026-05-15

### Add
- Supabase Auth integration — Google OAuth + Email/Password sign-in at `src/services/authService.ts`, `src/components/Login.tsx`
- Admin panel — user management (create/list/delete) at `src/components/AdminPanel.tsx`, `api/routes/admin.ts`
- JWT auth middleware — validates Supabase tokens server-side at `api/middleware/auth.ts`
- Multi-tenant data isolation — `user_id` column on all tables, all queries filtered by authenticated user at all route files
- Setup guide at `GUIDE.md` — step-by-step configuration for Supabase Auth and admin panel

### Change
- Login — redesigned with both Google OAuth and Email/Password options at `src/components/Login.tsx`
- API auth — replaced hardcoded basic auth with Supabase JWT validation at `api/index.ts`, `api/middleware/auth.ts`
- All API routes — added `user_id` filtering for Supabase queries at `api/routes/*.ts`
- App component — auth check via Supabase session, admin status detection, conditional admin tab at `src/App.tsx`
- All frontend components — switched from raw `fetch()` to `authService.apiFetch()` which auto-attaches JWT Bearer token
- Config — added `ADMIN_EMAILS`, `SUPABASE_SERVICE_ROLE_KEY` at `api/config.ts`, `.env`
- Database — added `supabaseAdmin` client for JWT verification at `api/db.ts`

### Remove
- Guest login endpoint (`POST /api/login/guest`) — replaced by Supabase Auth
- Hardcoded login (`POST /api/login`) — replaced by `POST /api/auth/login` JWT validation

### Add
- Custom DatePicker component — calendar dropdown with day grid, month mode, portal rendering, viewport boundary detection at `src/components/DatePicker.tsx`
- Custom animated loading screen — sliding progress bar replacing "Loading..." text at `src/components/LoadingScreen.tsx`
- RenameModal component — styled modal for category renaming at `src/components/RenameModal.tsx`
- Guest login button — bypasses credential form on login page at `src/components/Login.tsx`, `api/index.ts`
- Category management in Settings — list + rename categories at `src/components/Settings.tsx`
- Data export via API — `GET /api/export` dumps all tables as JSON at `api/routes/export.ts`
- Data import via API — `POST /api/import` restores from exported JSON with Supabase support at `api/routes/export.ts`
- Clear All Data option — wipes database + localStorage at `api/routes/export.ts`, `src/components/Settings.tsx`

### Change
- Select component — portal-based dropdown to prevent overflow clipping at `src/components/Select.tsx`
- Ledger toolbar — consolidated 3 rows into 1 compact row on desktop, card-based filter panel on mobile at `src/components/Ledger.tsx`
- Ledger category filter — `prompt()` replaced with RenameModal at `src/components/Ledger.tsx`
- Ledger category rename — moved to Settings page at `src/components/Ledger.tsx`
- Ledger date view — custom DatePicker replaces native date inputs at `src/components/Ledger.tsx`
- Dashboard filters — mobile card-based filter panel behind Filters button at `src/components/Dashboard.tsx`
- TransactionForm — native date input replaced with DatePicker at `src/components/TransactionForm.tsx`
- TransactionModal — native date input replaced with DatePicker at `src/components/TransactionModal.tsx`
- TransferModal — native date input replaced with DatePicker at `src/components/TransferModal.tsx`
- InvestmentTracker — native date inputs replaced with DatePicker at `src/components/InvestmentTracker.tsx`
- ReportGenerator — native date inputs replaced with DatePicker at `src/components/ReportGenerator.tsx`
- GroupManager — now uses `lastUpdate` prop to avoid redundant fetches at `src/components/GroupManager.tsx`
- Sidebar — fixed positioning on desktop (`md:fixed`) with `md:pl-64` offset at `src/components/layout/Sidebar.tsx`, `src/App.tsx`
- Settings Data Governance — Export/Import/Clear All in 3-column grid at `src/components/Settings.tsx`
- All date inputs — replaced with custom DatePicker calendar across 6 files
- Loading screens — animated sliding bar replaces spinner and "Loading..." text at `src/components/LoadingScreen.tsx`, `src/App.tsx`

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
