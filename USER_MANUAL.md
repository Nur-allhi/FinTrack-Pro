# FinTrack Pro — User Manual

**Version:** 1.3  
**Last updated:** 2026-06-02

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard](#2-dashboard)
3. [Managing Members](#3-managing-members)
4. [Accounts](#4-accounts)
5. [Account Groups](#5-account-groups)
6. [Transactions & Ledger](#6-transactions--ledger)
7. [Inter-Account Transfers](#7-inter-account-transfers)
8. [Loans](#8-loans)
9. [Investments](#9-investments)
10. [Reports](#10-reports)
11. [Settings](#11-settings)
12. [User Profile](#12-user-profile)
13. [Admin Panel](#13-admin-panel)
14. [Offline Mode & PWA](#14-offline-mode--pwa)
15. [Data Privacy & Security](#15-data-privacy--security)
16. [Troubleshooting](#16-troubleshooting)

---

## 1. Getting Started

### First-Time Login

1. Open FinTrack Pro in your browser.
2. You will see the **Login** screen with two options:
   - **Continue with Google** — uses your Google account (recommended)
   - **Email & Password** — sign in with credentials provided by your admin
3. After successful login, you land on the **Dashboard** where all your finances are shown.

### Navigation

The sidebar on the left gives you access to all sections:

| Icon | Section | What you can do there |
|------|---------|----------------------|
| Dashboard | See your total balance, account cards, and quick tasks |
| Members | Add and manage family members |
| Accounts | Create and edit financial accounts |
| Groups | Organize accounts into groups |
| Investments | Track investments and returns |
| Loans | Manage loans you've given out |
| Reports | Generate PDF or CSV reports |
| Settings | Customize appearance and preferences |
| Admin Panel | Manage users (admin only) |

On mobile, tap the hamburger menu (three lines, top-left) to open the sidebar.

---

## 2. Dashboard

The Dashboard is your financial command center. It shows everything at a glance.

### Total Balance (Top Section)

The top area shows your combined balance across all accounts. Below it:
- **Assets** — total money you have (liquid balance)
- **Liabilities** — tracked debts (only shown if you enable it in Settings)

You can hide any of these cards from Settings → Dashboard.

### Quick Tasks Widget

A simple to-do list that lives on your Dashboard:
1. Type a task and press **Add**.
2. Click the checkbox to mark it done.
3. Hover over a task and click the **X** to delete it.
4. Tasks are saved in your browser (not sent to the server).
5. You can hide this widget from Settings → Dashboard.

### Account Cards

Your accounts are displayed as cards in either **Grid** or **List** view:
- **Filter by type** — click the pill buttons: All, Banks, Cash, Mobile, Investments, Others
- **Filter by member** — use the member dropdown to see only one person's accounts
- **Click any account card** to open its transaction ledger

### Quick Action Buttons

- **New Transaction** — opens a quick form to add a transaction
- **Inter-Account Transfer** — opens the transfer form to move money between accounts

---

## 3. Managing Members

Members are the people in your household or organization. You can assign accounts to them.

### Adding a Member
1. Go to **Members** in the sidebar.
2. Click **Add**.
3. Enter their name and relationship (e.g., "Spouse", "Child").
4. Click **Save**.

### Viewing a Member's Accounts
Click on any member to see all accounts assigned to them, along with each account's balance.

### Deleting a Member
Click the delete button next to a member. This removes the member but **keeps their accounts** (they become unassigned).

---

## 4. Accounts

Accounts are the core of FinTrack Pro. Each one represents a place where you keep money.

### Account Types

| Type | Example |
|------|---------|
| **Cash** | Physical cash you hold |
| **Bank** | Savings or checking account |
| **Mobile Wallet** | Mobile money service |
| **Investment** | Brokerage or trading account |
| **Purpose Fund** | Money saved for a specific goal |
| **Expenses** | For tracking what you spend |

### Creating an Account
1. Go to **Accounts** in the sidebar.
2. Click **Add**.
3. Fill in:
   - **Name** — a label (e.g., "My Savings")
   - **Type** — pick from the list above
   - **Member** — who does this belong to? (optional)
   - **Group** — assign to a group (optional)
   - **Opening Balance** — how much is in it right now
   - **Color** — pick a color for easy visual识别
4. Click **Create**.

### Editing an Account
Click the **pencil icon** on any account card. Update what you need and click **Update**.

### Archiving an Account
Archiving hides the account from the Dashboard but keeps its data safe. Click the **archive icon** to toggle. You can unarchive it later from the Accounts page.

### Filtering Accounts
Use the member dropdown to filter accounts by owner. You can also see "Unassigned" accounts (those with no member).

---

## 5. Account Groups

Groups let you bundle multiple accounts under one heading. For example, you could create a group called "My Bank Accounts" and put all your bank accounts in it.

### Creating a Group
1. Go to **Groups**.
2. Click **New Group**.
3. Give it a name, assign a member (optional), and pick a color.
4. Click **Create**.

### Assigning Accounts to a Group
When you create or edit an account (see [Accounts](#4-accounts)), select the group from the **Group** dropdown.

### Viewing Group Balance
Each group card shows:
- **Accumulated balance** — the total of all accounts inside the group
- **Account count** — how many accounts are in the group
- Click **Show accounts** to expand and see each account

### Deleting a Group
Click the delete button. The accounts inside are **not deleted** — they just become ungrouped.

---

## 6. Transactions & Ledger

The Ledger is like a bank statement for each account. It keeps a running balance so you always know where you stand.

### Opening a Ledger
Click on any account card — from the Dashboard, Accounts page, or Search results — to open its ledger.

### Adding a Transaction
1. Click **New** in the ledger toolbar.
2. Fill in:
   - **Date** — when the transaction happened
   - **Particulars** — a short description (e.g., "Groceries")
   - **Category** — pick from the list or type a new one
   - **Amount** — how much money
   - **Debit/Credit** — switch to choose money out (debit) or money in (credit)
3. Press Enter or click submit.

### Editing a Transaction
Click the **pencil icon** on any transaction row. The form fills in with the current data. Make your changes and save.

### Deleting a Transaction
Click the **trash icon**. Confirm and it's gone. The running balance recalculates automatically.

### Filtering Transactions
The ledger has several filter options:

| Filter | What it does |
|--------|-------------|
| **Date: All** | Shows everything |
| **Date: Month** | Pick a month to view |
| **Date: Date** | Pick a specific day |
| **Date: Range** | Pick a start and end date |
| **Category** | Show only one category |

### Running Balance
The ledger starts from the account's opening balance and adds/subtracts each transaction in date order. The running balance updates if you edit or delete anything.

### Exporting the Ledger
Click the **Download icon** in the ledger header to get a bank-statement style PDF of whatever you're currently viewing.

---

## 7. Inter-Account Transfers

Transfers let you move money between accounts. The system handles both sides automatically.

### Creating a Transfer
1. Click **Inter-Account Transfer** from the Dashboard or open it from the FAB menu.
2. Select:
   - **From Account** — where the money comes from
   - **To Account** — where the money goes to
   - **Amount** — how much
   - **Date** — when
   - **Note** — optional description
3. Click **Transfer**.

### How It Works
A transfer creates two matching transactions:
- Money **leaves** the source account (shown as a debit)
- Money **enters** the destination account (shown as a credit)

Both are labeled "Transfer to/from: [Account Name]" and categorized as "Transfer".

### Editing or Deleting a Transfer
Find either side of the transfer in the respective ledger. If you edit the amount, the other side updates automatically. If you delete it, both sides are removed.

---

## 8. Loans

The Loans module helps you track money you've lent to others. It supports two types of loans.

### Understanding Loan Types

**Person Loan** — You lend money to someone outside the system (a friend, family member, etc.). You just type their name. This is the most common type.

**Inter-Account Loan** — You lend money between two of your own accounts. For example, moving money from your Savings account to your Investment account as a loan.

### Creating a Loan

1. Go to **Loans** in the sidebar.
2. Click **Add**.
3. Choose the loan type:
   - **Person Loan**: Select the lender account (where money comes from), type the borrower's name, enter the amount and date.
   - **Inter-Account Loan**: Select both the lender and borrower accounts.
4. Optionally set a due date, interest rate, and notes.
5. Click **Create**.

When you create a loan, the system automatically adds a transaction to the lender's account showing the money going out. For inter-account loans, it also adds a matching credit to the borrower's account.

### Viewing Loans

The loan list shows all your loans with:
- Borrower name or account
- Original amount and remaining balance
- Status: Active (still owed) or Settled (paid back)
- Use the filter to show All, Active, or Settled loans

### Settling a Loan (Partial or Full)

When someone pays you back:

1. Click the **Settle** button on a loan.
2. Enter the amount they paid (can be less than the full remaining balance).
3. Click **Confirm**.

The system:
- Creates a credit transaction on the lender account
- Reduces the remaining balance
- Marks the loan as "Settled" only when the balance reaches zero

For partial payments, the loan stays "Active" with the new remaining balance shown.

### Editing a Loan
You can update the amount, due date, interest rate, notes, and borrower name. The original date and amount are locked after creation.

### Editing or Deleting Settlement Transactions

If you edit or delete a settlement transaction from the account's ledger, the loan system adapts:
- The remaining balance recalculates
- If the loan was fully settled but you remove a payment, it reverts to "Active"
- If you increase a settlement amount, the remaining balance goes down further

This keeps your loan records accurate even when making corrections.

### Deleting a Loan
Click the **trash icon** and confirm. This deletes the loan record but **keeps the transactions** in the ledger.

---

## 9. Investments

Track your investments and their returns over time.

### Adding an Investment
1. Go to **Investments**.
2. Click **Add**.
3. Select the investment account, enter the principal (initial amount) and start date.
4. Click **Save**.

### Logging Returns
1. Select an investment from the list.
2. Click **Audit Yield**.
3. Enter the return amount, date, and yield percentage.
4. Click **Save Yield Entry**.

### Viewing Performance
Each investment shows:
- **Cumulative Yield** — total returns so far
- **Portfolio ROI** — return on investment as a percentage
- **Yield Velocity Chart** — an area chart of returns over time
- **Position Audit History** — a detailed list of all return entries

---

## 10. Reports

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
The PDF includes:
- Header with FinTrack Pro branding
- Account name and date range
- Transaction table with date, particulars, category, debit, credit, and running balance
- Footer with generation timestamp

### CSV Reports
CSV export gives you raw transaction data you can open in Excel, Google Sheets, or any spreadsheet program.

---

## 11. Settings

Customize how FinTrack Pro looks and works.

### Appearance

| Setting | What it does |
|---------|-------------|
| **Dark Mode** | Switch between Light, Deep Dark, Dim Dark, or Night Dark |
| **Accent Color** | Pick from 10 preset colors or set your own |
| **Font Size** | Choose Small, Normal, or Large |
| **Base Currency** | Set your currency symbol (BDT, USD, EUR, GBP, INR) |
| **Account Colors** | Assign colors to each account type |

### Dashboard

| Setting | What it does |
|---------|-------------|
| **Show Total Balance** | Show/hide the big balance number at the top |
| **Show Assets** | Show/hide the total assets card |
| **Show Liabilities** | Show/hide the total liabilities card |
| **Show Quick Tasks** | Show/hide the to-do list widget |

### Categories

View all transaction categories you've used. Click the **pencil icon** to rename a category — this updates all transactions that use that category at once.

---

## 12. User Profile

Your profile page is where you manage your account. Click your name/email at the bottom of the sidebar to open it.

### Account Info
See your email and change your display name.

### Security
Change your password from here.

### Data Management

| Action | What it does |
|--------|-------------|
| **Refresh** | Re-fetch all data from the server (useful after external changes) |
| **Export** | Download all your data as a JSON file (backup) |
| **Import** | Restore data from a previously exported JSON file |
| **Clear All Data** | Wipes everything (irreversible — use with care) |

---

## 13. Admin Panel

The Admin Panel is only visible to users whose email is listed as an admin. It lets you manage all user accounts.

### Viewing Users
The user list shows:
- Name and email
- Sign-in method (Google or Email/Password)
- When they joined and last logged in
- Storage usage bar (how much data they're using vs. their limit)

### Creating a User
1. Click **Create User**.
2. Enter their name (optional), email, and a password.
3. Click **Create User**.
4. A modal shows the password **once**. Copy it immediately — you won't see it again.

### Resetting a Password
Click the **key icon** next to a user. Enter a new password and save. Again, the new password is shown once.

### Managing Storage Limits
Each user has a default limit of 5 MB. Click the storage value (e.g., "5 MB") next to a user to set a custom limit between 1 and 100 MB.

### Deleting a User
Click the **trash icon**. Confirm to permanently remove the user account. Their data (transactions, accounts etc.) stays in the database but becomes inaccessible.

---

## 14. Offline Mode & PWA

### Installing as an App (PWA)

FinTrack Pro is a Progressive Web App. You can install it on your device:

- **Desktop (Chrome/Edge):** Click the install icon in the address bar.
- **Android:** Tap "Add to Home Screen" from the browser menu.
- **iPhone/iPad:** Tap the Share button → "Add to Home Screen".

Once installed, it works like a native app with its own window and icon.

### How Offline Works

1. **While online:** Data is fetched from the server and saved in your browser's local cache.
2. **Going offline:** You'll see an "Offline — showing cached data" banner.
3. **While offline:** You can browse all previously loaded data.
4. **Coming back online:** Data refreshes automatically. Any queued actions will sync.

### What Works Offline

- Viewing Dashboard, Accounts, Members, Ledgers, Groups, Investments, Loans
- Viewing Settings

### What Requires Internet

- Creating, editing, or deleting anything (transactions, accounts, members, loans, etc.)
- Transfers, reports, import/export

---

## 15. Data Privacy & Security

### Your Data Is Yours
Every user's data is completely isolated. You can only see what belongs to your account. Nobody else (not even an admin) can view your transactions or balances.

### Authentication
- Login is handled by **Supabase Auth** (secure, industry-standard).
- Passwords are hashed — FinTrack Pro never stores plaintext passwords.
- Google OAuth uses Google's secure login flow.

### What Admins Can See
Admins can see:
- User email, name, sign-in method, and join date
- How much storage each user is using

Admins **cannot** see:
- Your transactions, accounts, members, or any financial data

### Data Storage
- **Primary database:** Supabase (hosted PostgreSQL)
- **Local cache:** Your browser's IndexedDB (only on your device)
- No data is sent to third parties.

### Account Deletion
If your account is deleted:
- You lose access immediately
- Your data remains in the database (an admin could restore it)
- To fully remove your data, use **Clear All Data** in your Profile before deletion

---

## 16. Troubleshooting

### "Data refreshed" toast appears repeatedly
This is normal — the app syncs data when you reconnect. If it keeps happening, try clearing your browser cache.

### Balance looks wrong
Click the **Refresh** button in Profile → Data. This re-fetches everything from the server.

### Can't log in
- Check your email and password are correct.
- If using Google, make sure pop-ups aren't blocked.
- Ask your admin to reset your password.

### PWA won't install
- **Chrome:** You need HTTPS or localhost.
- **iPhone:** Use Safari, look for "Add to Home Screen" in the Share menu.
- Try clearing your browser cache and reloading.

### Admin Panel not showing
The Admin Panel only shows for admin accounts. If you should be an admin:
- Refresh the page
- Check with your system admin that your email is in the `ADMIN_EMAILS` list

### Storage limit reached
You'll see this error when creating transactions if you've hit your limit. To fix it:
1. Delete old or unnecessary data to free up space.
2. Ask your admin to increase your storage limit.

### Data not syncing between devices
FinTrack Pro doesn't sync in real-time. Data is fetched when you load the page. Use the **Refresh** button in Profile to manually sync.

### Loan balance not updating after editing a transaction
The loan system recalculates when you edit or delete settlement transactions. If the balance seems wrong, try refreshing the loans page.

---

*FinTrack Pro — Smart Financial Management*
