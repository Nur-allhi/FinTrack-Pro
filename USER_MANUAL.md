# FinTrack Pro — User Manual

**Version:** 1.0  
**Last updated:** 2026-05-16

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Managing Members](#3-managing-members)
4. [Accounts](#4-accounts)
5. [Account Groups](#5-account-groups)
6. [Transactions & Ledger](#6-transactions--ledger)
7. [Inter-Account Transfers](#7-inter-account-transfers)
8. [Investments](#8-investments)
9. [Reports](#9-reports)
10. [Settings](#10-settings)
11. [Admin Panel (Users)](#11-admin-panel-users)
12. [Offline Mode](#12-offline-mode)
13. [Data Privacy & Security](#13-data-privacy--security)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Getting Started

### First-Time Login

1. Open FinTrack Pro in your browser.
2. You will see the **Login** screen with two options:
   - **Continue with Google** — uses your Google account (recommended)
   - **Email & Password** — sign in with credentials provided by your admin
3. After successful login, you will land on the **Dashboard**.

### Installing as an App (PWA)

FinTrack Pro is a Progressive Web App (PWA). You can install it on your device for a native-like experience:

- **Desktop (Chrome/Edge):** Click the install icon in the address bar.
- **Mobile (Android):** Tap "Add to Home Screen" from the browser menu.
- **Mobile (iOS):** Tap the Share button → "Add to Home Screen".

Once installed, FinTrack Pro works offline with previously loaded data.

### Navigation

The sidebar on the left provides access to all sections:

| Icon | Section | Description |
|------|---------|-------------|
| Dashboard | Overview of balances and quick tasks |
| Members | Manage family members |
| Accounts | Manage financial accounts |
| Groups | Organize accounts into groups |
| Investments | Track investment positions |
| Reports | Generate financial reports |
| Users | Admin only — manage user accounts |
| Settings | Configure your workspace |

On mobile, tap the hamburger menu (top-left) to open the sidebar.

---

## 2. Dashboard

The Dashboard is your financial command center.

### Total Balance (Hero Section)

The top section shows your **Total Balance** across all accounts. Below it:

- **Assets** — total liquid balance
- **Liabilities** — tracked liabilities (when enabled in Settings)

### Quick Tasks

The Quick Tasks widget lets you maintain a simple to-do list:

1. Type a task in the input field and press **Add**.
2. Click the checkbox to mark a task as complete.
3. Hover over a task and click the **X** to delete it.
4. Tasks are stored locally in your browser.

### Portfolio View

Your accounts are displayed in a **Grid** or **List** view:

- **Filter by type:** Use the pill buttons (All, Banks, Cash, Mobile, Investments, Others).
- **Filter by member:** Use the member filter dropdown.
- **Click an account card** to open its transaction ledger.

### Quick Actions

- **New Transaction** — opens a quick transaction entry modal.
- **Inter-Account Transfer** — opens the transfer modal.

---

## 3. Managing Members

Members represent people in your household or organization.

### Adding a Member

1. Navigate to **Members** in the sidebar.
2. Click the **Add** button.
3. Enter the member's name and relationship.
4. Click **Save**.

### Viewing a Member's Accounts

Click on a member to see all accounts assigned to them along with their balances.

### Deleting a Member

Click the delete button next to a member. This will remove the member but **will not delete** their associated accounts (accounts will become unassigned).

---

## 4. Accounts

Accounts are the core of FinTrack Pro. Each account represents a financial holding.

### Account Types

| Type | Description |
|------|-------------|
| **Cash** | Physical cash holdings |
| **Bank** | Bank accounts (savings, checking) |
| **Mobile Wallet** | Mobile money services |
| **Investment** | Investment/ brokerage accounts |
| **Purpose Fund** | Goal-specific savings |
| **Expenses** | Expense tracking accounts |

### Creating an Account

1. Go to **Accounts** in the sidebar.
2. Click **Add**.
3. Fill in:
   - **Name** — a label for the account
   - **Type** — select from the types above
   - **Member** — assign to a member (optional)
   - **Group** — assign to an account group (optional)
   - **Opening Balance** — initial balance
   - **Color** — pick a color for visual identification
4. Click **Create**.

### Editing an Account

Click the **Edit (pencil)** icon on an account card or row. Update the fields and click **Update**.

### Archiving an Account

Archiving hides an account from the Dashboard but preserves its data. Click the **Archive** icon to toggle. Archived accounts can be reactivated from the Accounts page.

### Account Filters

Use the member dropdown to filter accounts by member, including "Unassigned" accounts.

---

## 5. Account Groups

Groups let you organize multiple accounts under a single heading with an accumulated balance.

### Creating a Group

1. Navigate to **Groups**.
2. Click **New Group**.
3. Enter a name, assign a member (optional), and pick a color.
4. Click **Create**.

### Assigning Accounts to a Group

When creating or editing an account (see [Accounts](#4-accounts)), select the group from the **Group** dropdown.

### Viewing Group Balance

The group card shows:
- **Accumulated balance** — sum of all child account balances
- **Child account count** — number of accounts in the group
- Click **Show accounts** to expand the list of child accounts

### Deleting a Group

Click the delete button. Child accounts will be unlinked from the group but **not deleted**.

---

## 6. Transactions & Ledger

The Ledger is a professional-grade transaction register with running balance.

### Opening a Ledger

Click on any account from the Dashboard, Accounts page, or search to open its ledger.

### Adding a Transaction

1. Click **New** in the ledger toolbar.
2. Fill in:
   - **Date** — transaction date
   - **Particulars** — description
   - **Category** — select or type a new category
   - **Amount** — enter the amount
   - **Debit/Credit toggle** — switch between debit (outflow) and credit (inflow)
3. Press Enter or click submit.

### Editing a Transaction

Click the Edit icon on any transaction row. The form will populate with the existing data. Make your changes and save.

### Deleting a Transaction

Click the Delete icon. Confirm the deletion. The transaction is removed and the running balance recalculates.

### Filtering Transactions

The ledger offers multiple filter modes:

| Filter | How it works |
|--------|--------------|
| **Date: All** | Shows all transactions |
| **Date: Month** | Pick a month to view |
| **Date: Date** | Pick a specific date |
| **Date: Range** | Pick a start and end date |
| **Category** | Filter by a specific category |

### Running Balance

The ledger computes a running balance starting from the account's initial balance. Each transaction's amount is added sequentially by date.

### Exporting the Ledger

Click the **Download** icon in the ledger header to export a bank-statement style PDF of the current filtered view.

---

## 7. Inter-Account Transfers

Transfers move money between accounts using double-entry accounting.

### Creating a Transfer

1. Click **Inter-Account Transfer** from the Dashboard or open the transfer modal.
2. Select:
   - **From Account** — source account
   - **To Account** — destination account
   - **Amount** — transfer amount
   - **Date** — transfer date
   - **Note** — optional description
3. Click **Transfer**.

### How It Works

A transfer creates two linked transactions:
- A **debit** (negative amount) on the source account
- A **credit** (positive amount) on the destination account

Both are labeled with "Transfer to/from: [Account Name]" and categorized as "Transfer".

### Editing or Deleting a Transfer

Find either of the linked transactions in the respective ledger. Editing the amount will update both sides. Deleting removes both transactions.

---

## 8. Investments

The Investment Tracker monitors positions and their returns over time.

### Adding an Investment

1. Go to **Investments**.
2. Click **Add**.
3. Select the investment account, enter the principal amount and start date.
4. Click **Save**.

### Logging Returns

1. Select an investment from the portfolio list.
2. Click **Audit Yield**.
3. Enter the return amount, date, and yield percentage.
4. Click **Save Yield Entry**.

### Viewing Performance

The investment detail panel shows:
- **Cumulative Yield** — total returns to date
- **Portfolio ROI** — return on investment as a percentage
- **Yield Velocity Chart** — area chart of returns over time
- **Position Audit History** — detailed list of all return entries

---

## 9. Reports

Generate professional financial reports in PDF or CSV format.

### Generating a Report

1. Go to **Reports**.
2. Select:
   - **Account** — which account to report on
   - **Member** — filter by member (optional)
   - **Date Range** — start and end dates
   - **Format** — PDF or CSV
3. Click **Generate Report**.

### PDF Reports

The PDF report includes:
- Header with FinTrack Pro branding
- Account name and date range
- Transaction table with date, particulars, category, debit, credit, and balance columns
- Running balance
- Footer with generation timestamp

### CSV Reports

CSV export provides raw transaction data for analysis in spreadsheet software.

---

## 10. Settings

Configure your workspace in the Settings panel.

### Display Settings

| Setting | Description |
|---------|-------------|
| **Total Balance** | Show/hide the hero summary on Dashboard |
| **Liquid Assets** | Show/hide the asset card |
| **Total Liabilities** | Show/hide the liabilities card |

### System Preferences

| Setting | Description |
|---------|-------------|
| **Base Currency** | Currency symbol (BDT, USD, EUR, GBP, INR) |
| **Audit Alerts** | Enable/disable sync notifications |
| **Dark Mode** | Toggle between light and dark themes |
| **Font Size** | Small, Normal, or Large text |

### Account Colors

Customize the color associated with each account type (Cash, Bank, Mobile, Investment, Purpose, Expenses).

### Categories

View all transaction categories used across your data. Click the pencil icon to rename a category — this updates all transactions using that category.

### Data Management

| Action | Description |
|--------|-------------|
| **Refresh** | Re-fetch all data from the server (useful after external changes) |
| **Export** | Download all data as a JSON file |
| **Import** | Restore data from a previously exported JSON file |
| **Clear All Data** | Wipes all data from database and local storage (irreversible) |

---

## 11. Admin Panel (Users)

The Admin panel is only visible to users with admin privileges.

### Viewing Users

All registered users are listed with:
- **Name** (if provided) and email
- **Provider** (Google or Email/Password)
- **Created date** and **Last login**
- **Storage usage** — data usage bar showing MB used vs limit

### Creating a User

1. Click **Create User**.
2. Enter:
   - **Name** (optional)
   - **Email** (must be a valid email format)
   - **Password** (minimum 6 characters)
3. Click **Create User**.
4. A modal will show the password **once**. Copy it immediately — it will not be shown again.

### Resetting a Password

Click the **Key** icon next to a user. Enter a new password and save. The new password will be shown once in a modal.

### Setting Storage Limits

Click the storage limit value (e.g., "5 MB") next to a user. Set a value between 1 and 100 MB. Default for new users is 5 MB. This only applies when Supabase is active.

### Deleting a User

Click the **Trash** icon. Confirm the deletion. This permanently removes the user account and cannot be undone. Their data (members, accounts, transactions) remains orphaned in the database.

---

## 12. Offline Mode

FinTrack Pro caches data locally for offline access.

### How Offline Works

1. **While online:** Data is fetched from the server and stored in your browser's IndexedDB cache.
2. **Going offline:** The app detects the connection loss and shows an "Offline — showing cached data" banner.
3. **While offline:** You can browse all previously loaded data — Dashboard, Accounts, Transaction ledger, etc.
4. **Coming back online:** Data refreshes automatically. Any pending operations (if queued) will sync.

### What Works Offline

- ✅ Viewing Dashboard with cached balances
- ✅ Viewing Accounts and Members
- ✅ Viewing Transaction Ledgers
- ✅ Viewing Groups and Investments
- ✅ Settings (except Import/Export/Clear)

### What Requires Internet

- ❌ Creating, editing, or deleting transactions
- ❌ Creating or editing accounts and members
- ❌ Making transfers
- ❌ Importing or exporting data

### PWA Installation

For the best offline experience, install FinTrack Pro as an app (see [Getting Started](#1-getting-started)).

---

## 13. Data Privacy & Security

### Multi-Tenant Isolation

Every user's data is isolated by `user_id`. You can only see data that belongs to your account.

### Authentication

- Authentication is handled by **Supabase Auth**.
- Passwords are hashed and stored by Supabase — FinTrack Pro never stores plaintext passwords.
- Google OAuth uses Google's secure authentication flow.

### Admin Access

Admins can:
- View all registered users (email, name, provider, dates)
- Create and delete users
- Set storage limits
- Reset user passwords

Admins cannot view user data (transactions, accounts, etc.).

### Data Storage

- Primary database: **Supabase** (hosted PostgreSQL)
- Local cache: **IndexedDB** (your browser only)
- No data is sent to third parties.

### Account Deletion

When an admin deletes your user account:
- You lose access immediately
- Your data remains in the database (for potential recovery by admin)
- To fully remove data, use the **Clear All Data** option in Settings before your account is deleted

---

## 14. Troubleshooting

### "Data refreshed." toast appears repeatedly

This is normal — the app syncs data on reconnection. If it persists, try clearing your browser cache.

### Stale or incorrect balance

Try the **Refresh** button in Settings → Data Governance. This re-fetches all data from the server.

### Login not working

- Ensure you have the correct email and password.
- If using Google OAuth, make sure pop-ups are not blocked.
- Contact your admin to reset your password.

### PWA not installing

- **Chrome:** Ensure you are on HTTPS or localhost.
- **iOS:** Use Safari and look for "Add to Home Screen" in the Share menu.
- Clear the browser cache and reload the page.

### Users page not appearing

The Users tab is only visible to admin accounts. If you are an admin and it does not appear, try refreshing the page. Check with your system administrator that your email is listed in the `ADMIN_EMAILS` configuration.

### Storage limit reached

If you see a "Storage limit reached" error when creating transactions:
1. Free up space by deleting old or unnecessary data.
2. Ask your admin to increase your storage limit.

### Data not syncing across devices

FinTrack Pro does not support real-time multi-device sync. Data is fetched on page load. Use the **Refresh** button to manually sync.

---

*FinTrack Pro v1.0 — Smart Financial Management*
