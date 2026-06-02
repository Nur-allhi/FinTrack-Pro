# FinTrack Pro

A complete family finance tracker that helps you manage money across multiple accounts, track loans, investments, and generate reports — all in one place. Built for families, small groups, or anyone who wants a clear picture of their finances.

## Features

### Core Finance Tracking
- **Multi-Account Management** — Track Cash, Bank, Mobile Wallets, Investments, Purpose Funds, and Expenses side by side
- **Ledger** — Detailed transaction history per account with running balance, debit/credit view, date and category filters
- **Inter-Account Transfers** — Move money between accounts with automatic double-entry (creates matching debit/credit)
- **Account Groups** — Group related accounts under a parent with accumulated balance (e.g., "My Bank Accounts")
- **Member-Based Organization** — Assign accounts to family members for individual tracking

### Loan Tracking
- **Two Loan Types**: Person loans (lend to someone outside the system) and Inter-account loans (between your own accounts)
- **Partial Settlement** — Record payments in any amount; remaining balance updates automatically
- **Auto-Generated Transactions** — Loans and settlements automatically create transactions on the linked accounts
- **Edit Reversal** — If you edit or delete a settlement transaction, the loan balance recalculates correctly

### Investment Tracking
- Track investment positions with principal amounts and start dates
- Log returns with yield percentages over time
- View cumulative ROI and yield history chart

### Reports
- **PDF Reports** — Professionally formatted financial reports with branding, running balance, and date range
- **CSV Export** — Raw transaction data for spreadsheet analysis
- **Excel Export** — `.xlsx` format alongside PDF/CSV
- **CSV Import** — Import transactions from CSV files (Date, Particulars, Category, Debit, Credit)
- **Ledger Export** — Download account ledger as bank-statement style PDF

### Budgeting & Recurring
- **Monthly Budgets** — Set category budgets per month with progress tracking
- **Recurring Transactions** — Auto-create transactions on daily, weekly, monthly, or yearly schedules
- **Recycle Bin** — Soft-delete transactions, accounts, and loans with restore and permanent-delete options

### Multi-Currency
- **Per-Account Currency** — Each account can have its own currency (15 currencies supported)
- **Exchange Rates** — Live exchange rates from open.er-api.com with hourly caching

### Dashboard
- **Spending Charts** — Pie chart showing spending by category (top 8)
- **Balance Trend** — Area chart showing running balance over recent transactions
- **Liability Tracking** — Real-time liability calculation from accounts with negative balances

### PWA & Offline
- **Install as App** — Works on desktop and mobile as a Progressive Web App
- **Offline Browsing** — Previously loaded data works without internet
- **Sync Queue** — Failed operations queue locally and retry when back online
- **Push Notifications** — Service worker push support with VAPID key configuration
- **Auto-Refresh** — Data refreshes every 30 seconds and on window focus

### Appearance & Customization
- **Dark Mode** — 3 variants: Deep, Dim, and Night
- **Accent Color** — Pick from 10 presets or set a custom color
- **Font Size** — Small, Normal, or Large scaling
- **Account Colors** — Custom colors per account type
- **Dashboard Layout** — Grid/List view toggle, filter by account type or member

### Data Management
- **Export/Import** — Full JSON backup and restore from Profile page
- **Category Management** — Rename categories across all transactions at once
- **Global Search** — Search accounts, transactions, loans, and members from the header; click a transaction to open its account ledger
- **Recycle Bin** — Soft-delete transactions, accounts, and loans with restore and permanent-delete options

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 6, Tailwind CSS v4 |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **CSV** | papaparse |
| **Excel** | xlsx |
| **Backend** | Node.js, Express, tsx |
| **Auth** | Supabase Auth (Google OAuth + Email/Password) |
| **Database** | Supabase (PostgreSQL) |
| **Offline Cache** | IndexedDB via idb |
| **PDF** | jsPDF (lazy-loaded) |
| **Deployment** | Vercel (static + serverless functions) |

## Getting Started

### Prerequisites

- Node.js (LTS version recommended)
- A Supabase project (free tier works)

### Installation

```bash
git clone <repository-url>
cd FinTrack-Pro
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Supabase (required)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Admin users (comma-separated emails)
ADMIN_EMAILS="admin@example.com"

# App URL
APP_URL="http://localhost:3001"
```

### Database Setup

1. **Enable auth providers** — Go to Supabase Dashboard → Authentication → Providers. Email/Password is on by default. Google OAuth is optional.
2. **Run migrations** — Open Supabase SQL Editor and run each file from `supabase/migrations/` in order:
   - `001_add_user_id.sql` — adds user_id column for data isolation
   - `002_add_loans.sql` — creates loans table
   - `003_add_loans_rls.sql` — row-level security for loans
   - `004_add_loan_person_fields.sql` — person loan support (borrower_name, remaining, loan_settlements)
   - `005_borrower_account_nullable.sql` — makes borrower_account_id nullable for person loans
   - `006_transaction_id_on_settlements.sql` — adds transaction_id to loan_settlements
   - `007_add_investments.sql` — creates investments and investment_returns tables
   - `008_add_groups.sql` — creates groups table for account organization
   - `009_add_deleted_at.sql` — adds soft-delete support (deleted_at column) to transactions, accounts, loans

### Run the App

```bash
npm run build
npm run dev
```

The app runs at `http://localhost:3001`.

> See `GUIDE.md` for detailed step-by-step auth setup instructions.

## Project Structure

```
api/                          # Express backend
├── index.ts                  # Server entry, route wiring
├── config.ts                 # Environment config
├── db.ts                     # Database setup (Supabase + SQLite)
├── db/                       # Data-access layer
│   ├── queries.ts            # Unified query interface (selectMany, insertOne, etc.)
│   ├── accounts.ts           # Account queries
│   ├── members.ts            # Member queries
│   ├── transactions.ts       # Transaction queries
│   ├── loans.ts              # Loan queries
│   ├── groups.ts             # Group queries
│   ├── investments.ts        # Investment queries
│   ├── transfers.ts          # Transfer queries
│   ├── recyclebin.ts         # Recycle bin queries (soft-delete, restore, permanent-delete)
│   └── export.ts             # Export/import queries
├── middleware/
│   ├── auth.ts               # JWT verification + admin check + cookie management
│   ├── quota.ts              # Storage quota enforcement
│   └── rateLimit.ts          # Rate limiting (60 req/min API, 10 req/15min auth)
├── routes/
│   ├── admin.ts              # User management, storage monitoring
│   ├── members.ts            # Family member CRUD
│   ├── accounts.ts           # Account CRUD
│   ├── transactions.ts       # Transaction CRUD, edits, linked reversal
│   ├── transfers.ts          # Inter-account transfers
│   ├── loans.ts              # Full loan lifecycle + settlement
│   ├── investments.ts        # Investment + return tracking
│   ├── groups.ts             # Account groups with aggregation
│   ├── search.ts             # Global search (transactions, accounts, loans)
│   ├── recyclebin.ts         # Recycle bin endpoints (list, restore, delete)
│   └── export.ts             # Data export/import/clear
└── tests/                    # API integration tests
    ├── helpers.ts            # Shared test mocks
    ├── smoke.test.ts         # Smoke tests for all GET endpoints
    ├── crud.test.ts          # CRUD tests for core entities
    ├── auth.test.ts          # Auth middleware tests
    └── members.test.ts       # Members data layer tests

shared/                       # Shared between frontend and backend
├── types.ts                  # TypeScript interfaces
└── validation.ts             # Zod schemas + validate() helper

src/                          # React frontend
├── App.tsx                   # Main app (routing, auth, data, settings)
├── main.tsx                  # Entry point + service worker registration
├── index.css                 # Global styles, theme, dark mode
├── hooks/
│   └── useTransactions.ts    # Transaction data hook (extracted from Ledger)
├── services/
│   ├── authService.ts        # Supabase auth client + fetch helper
│   ├── cacheService.ts       # IndexedDB offline cache
│   ├── offlineService.ts     # Offline queue + sync state
│   └── notificationService.ts # Browser notifications
├── utils/
│   ├── cn.ts                 # Tailwind class merge utility
│   ├── pdf.ts                # Shared PDF helpers
│   ├── ledgerPdf.ts          # Ledger PDF export
│   └── reportPdf.ts          # Report PDF/CSV generation
└── components/
    ├── layout/
    │   ├── Sidebar.tsx       # Navigation sidebar with profile
    │   └── Header.tsx        # Top bar with global search
    ├── Dashboard.tsx         # Main dashboard with filters, quick tasks
    ├── DashboardHero.tsx     # Dashboard summary cards (balance, assets, liabilities)
    ├── DashboardSettings.tsx # Dashboard visibility toggles
    ├── DashboardTodos.tsx    # Quick task items
    ├── Ledger.tsx            # Transaction ledger with running balance
    ├── LedgerToolbar.tsx     # Ledger filters and actions
    ├── AccountManager.tsx    # Account create/edit/archive
    ├── AccountForm.tsx       # Account creation/edit form
    ├── MemberManager.tsx     # Members with account drill-down
    ├── GroupManager.tsx      # Account groups management
    ├── GroupForm.tsx         # Group creation/edit form
    ├── InvestmentTracker.tsx # Investment positions & returns
    ├── InvestmentDetail.tsx  # Investment detail with yield chart
    ├── LoanManager.tsx       # Loan create/settle/view
    ├── LoanGroupCard.tsx     # Loan group display with table
    ├── LoanTable.tsx         # Loan listing table
    ├── ReportGenerator.tsx   # PDF/CSV financial reports
    ├── RecycleBin.tsx        # Soft-delete restore UI
    ├── Settings.tsx          # Appearance, dashboard, categories
    ├── UserProfile.tsx       # Profile, password, data management
    ├── Login.tsx             # Login with Google/Email
    ├── TransactionForm.tsx   # Transaction entry form
    ├── TransactionModal.tsx  # Quick transaction modal
    ├── TransferModal.tsx     # Inter-account transfer modal
    ├── FloatingActionButton.tsx  # Mobile speed-dial actions
    ├── OfflineIndicator.tsx  # Offline status banner
    ├── Toast.tsx             # Toast notifications
    ├── Select.tsx            # Custom dropdown selector
    ├── DatePicker.tsx        # Calendar date picker
    ├── DebitCreditToggle.tsx # Debit/credit toggle switch
    └── ErrorBoundary.tsx     # Error fallback boundary

sw.ts                         # Service worker (PWA offline cache)
```

## Navigation

| Tab | Description |
|-----|-------------|
| **Dashboard** | Overview of balances, account cards, quick tasks, filters |
| **Members** | Manage family members and view their accounts |
| **Accounts** | Create, edit, archive financial accounts |
| **Groups** | Organize accounts into parent groups |
| **Investments** | Track positions, log returns, view ROI |
| **Loans** | Create and settle person or inter-account loans |
| **Reports** | Generate PDF/CSV financial reports |
| **Recycle Bin** | Restore or permanently delete soft-deleted items |
| **Settings** | Appearance, dashboard toggles, categories |
| **Admin Panel** | User management, storage limits (admin only) |

## Database Schema

All tables include a `user_id` column for multi-tenant isolation.

| Table | Key Columns |
|-------|-------------|
| **accounts** | `id`, `name`, `type`, `member_id`, `parent_id`, `color`, `archived`, `initial_balance`, `currency`, `deleted_at` |
| **members** | `id`, `name`, `relationship` |
| **transactions** | `id`, `account_id`, `date`, `particulars`, `category`, `amount`, `type`, `linked_transaction_id`, `fts`, `deleted_at` |
| **investments** | `id`, `account_id`, `principal`, `date` |
| **investment_returns** | `id`, `investment_id`, `date`, `amount`, `percentage` |
| **loans** | `id`, `lender_account_id`, `borrower_account_id`, `borrower_name`, `amount`, `remaining`, `status`, `particulars`, `fts`, `deleted_at` |
| **loan_settlements** | `id`, `loan_id`, `amount`, `transaction_id` |
| **groups** | `id`, `name`, `member_id`, `color` |
| **budgets** | `id`, `user_id`, `category`, `amount`, `month` |
| **recurring_transactions** | `id`, `user_id`, `account_id`, `particulars`, `category`, `amount`, `frequency`, `next_date`, `active` |

## Auth Flow

```
Login (Google OAuth or Email/Password)
  → Supabase Auth returns JWT
  → Backend verifies JWT via supabaseAdmin.auth.getUser()
  → All API calls include Authorization: Bearer <token>
  → Backend filters queries by user_id from the verified token
  → Admin features available only to users in ADMIN_EMAILS list
```
