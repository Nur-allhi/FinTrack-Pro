# Changelog

All the changes made to FinTrack Pro, written in plain English.

---

## May 18, 2026 — Loan Module (Part 2): Person Loans & Flexible Settlements

**What's new:**
- You can now lend money to people outside the system (Person Loans). Just type their name — no need to create an account for them.
- When you settle a loan, you can pay any amount, not just the full balance. The system tracks how much is still owed.
- If you edit or delete a settlement transaction from the ledger, the loan balance updates automatically. No more mismatched records.
- Inter-account loans now also record settlement history, just like person loans.

**Bugs fixed:**
- Deleting a settlement transaction now correctly finds and reverses the linked transaction in all cases.
- When editing a settlement amount, the linked transaction on the other account stays in sync.
- Numbers are handled with absolute values to prevent negative balance bugs.

---

## May 17, 2026 — Quality of Life Fixes

**What got better:**
- Dashboard data refreshes every 30 seconds and when you switch back to the browser tab — so mobile users see desktop changes automatically.
- If you refresh the page, your last viewed tab and account are remembered.
- Mobile back gesture no longer closes the app by accident.
- Offline mode is now more reliable. When a network error happens, the app catches it and queues the action for later instead of crashing.
- Categories no longer crash the app when the server returns an error.
- Service worker no longer intercepts API calls (was causing random network errors).
- Login feels smoother — you see a "successful" toast and the dashboard loads with a spinner while data loads in the background.
- The ledger now shows a "Loading entries..." spinner instead of an empty "No records found" message.
- Clicking sidebar nav items correctly closes the profile page.
- The "All Members" filter on the Dashboard now includes unassigned (general) accounts.

**Files touched:** App.tsx, Dashboard, Ledger, TransactionModal, TransferModal, Settings, Sidebar, sw.ts

---

## May 16, 2026 — PWA, Dark Mode, Admin Tools & Design Polish

### Major Additions

**PWA (Progressive Web App)**
- Install FinTrack Pro as an app on your phone or desktop.
- Works offline — you can browse cached data without internet.
- An "Offline" banner shows when you lose connection, and data syncs automatically when you're back online.
- Service worker auto-updates when a new version is deployed.

**Dark Mode (3 variants)**
- Choose between Deep, Dim, or Night themes.
- Pick from 10 accent colors or set a custom one.
- No white flash when loading — the theme applies before the page renders.

**User Profile Page**
- View your account info (name, email).
- Change your password.
- Export, import, refresh, or clear all your data.
- Your name shows on the sidebar and dashboard greeting.

**Settings Reorganization**
- Settings now has sub-navigation: Appearance, Dashboard, Categories.
- Quick Tasks can be hidden from the Dashboard banner settings.
- Dead "Audit Alerts" toggle removed (no notification system exists).

**Admin Panel Upgrades**
- View storage usage per user with a progress bar (in MB/KB).
- Set custom storage limits per user (default 5MB).
- One-time password shown on user creation (shown once, then gone).
- Reset passwords for any user.
- Name field and email validation on user creation.
- Admin check is cached — the Admin Panel nav item shows instantly on refresh.
- Database summary shows total size at the top of the panel.

**Login Improvements**
- Login is faster — removed an unnecessary backend validation step that added 2-5 seconds delay.
- Stale sessions are cleaned up automatically.
- 30-second timeout on all auth calls (shows "Request timed out" if something hangs).

### Design Polish
- All tiny text (`text-[10px]`/`text-[11px]`) bumped to `text-xs` (12px) across 16 components.
- Card titles are now larger (`text-sm` → `text-base`).
- FAB (Floating Action Button) no longer sticks open after closing a modal.
- Sidebar profile card is clickable — opens your profile page.
- Removed "Total Assets" from sidebar (was redundant).
- Removed JetBrains Mono font (Inter used everywhere).

### Housekeeping
- Removed old legacy auth credentials (`password123`) from code.
- Cleaned up environment variables.

---

## May 14, 2026 — Bug Fixes, Toast System, Dark Mode, Groups & Mobile Views

### Bug Fixes
- Dashboard "Transfer Funds" and "Generate Report" buttons now actually work (were missing click handlers).
- Settings "Export" button now downloads your data as JSON.
- Ledger "Download" button exports transactions as CSV.
- Report Generator now filters by the selected member.
- Liabilities card was showing a hardcoded "0" — now hidden behind a setting toggle.
- Dashboard visibility toggles (showCurrentAssets, showLiabilities) actually work now.
- Grid/List toggle on Dashboard now switches views correctly.
- Gemini AI model name is now configurable via environment variable.
- Fixed missing `cn` import in TransactionForm.
- Fixed inverted "other" quick filter logic on Dashboard.
- Removed duplicate Liabilities card in dashboard hero section.
- Centered "Add Transaction" button in empty ledger state.

### What's New
- **Toast Notifications** — A proper notification system replaces all `alert()` popups.
- **Loading States** — Buttons show a "saving..." state while submitting (AccountManager, MemberManager).
- **Dark Mode** — Full dark theme with CSS variables and a toggle in Settings.
- **Account Groups** — Create parent groups for your accounts (e.g., "Savings" or "Joint Accounts"). Groups show accumulated balance. Navigate via new Groups page.
- **Custom Select Component** — Styled dropdown replacing native `<select>` elements everywhere.
- **Inline Edit Forms** — Edit accounts directly on the page with smooth animations (no page jump).
- **Mobile Card Views** — All list views show compact cards on mobile instead of horizontal scroll.
- **Responsive Design** — All pages optimized for mobile, tablet, and desktop.
- **Font Size Setting** — Choose small, normal, or large text in Settings.
- **Global Search** — Search for accounts and members from the header; results show in a dropdown.
- **Dashboard Quick Filters** — Filter accounts by type: All, Banks, Cash, Mobile, Investments, Others.
- **Interactive Members Page** — Click a member to see their accounts and balances; click an account to open its ledger.
- **Sidebar Backdrop** — Mobile menu now has a dark overlay when open.
- **Account Type Colors** — Customize colors for each account type in Settings.

### Design Changes
- Sidebar redesigned with card-style nav items and gradient active states.
- Account cards are more compact with type icons and color accents.
- Dashboard AccountCards have type-colored icon backgrounds.
- Color palette follows the Coinbase-inspired DESIGN.md spec.
- All dropdowns are pill-shaped with hover states and focus rings.
- Card padding reduced for a tighter layout.
- Database schema updated: `parent_id` column added to accounts for groups.
- API now excludes `type='group'` accounts from regular account lists.

### Removed
- AI integration (Gemini service, AI categorization, insights) — removed entirely.

---

## Earlier Development

Earlier work includes:
- Initial project setup with React + Vite + Express
- SQLite database with Supabase support
- Basic account, member, and transaction CRUD
- Investment tracking
- Report generation (PDF + CSV)
- Data export/import
- Session 1-4 foundational features

See git log or HANDOFF.md for full historical details.
