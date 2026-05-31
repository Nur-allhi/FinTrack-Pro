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
- **Ledger Export** — Download account ledger as bank-statement style PDF

### Multi-User & Admin
- **Supabase Auth** — Login with Google or Email/Password; each user's data is fully isolated
- **Admin Panel** — Designated admins can create/manage users, set storage limits, view usage
- **Storage Quotas** — Per-user limits (default 5MB) with admin override

### PWA & Offline
- **Install as App** — Works on desktop and mobile as a Progressive Web App
- **Offline Browsing** — Previously loaded data works without internet
- **Sync Queue** — Failed operations queue locally and retry when back online
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

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite 6, Tailwind CSS v4 |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Backend** | Node.js, Express, tsx |
| **Auth** | Supabase Auth (Google OAuth + Email/Password) |
| **Database** | Supabase (PostgreSQL) with SQLite fallback |
| **Offline Cache** | IndexedDB via idb |
| **PDF** | jsPDF + jspdf-autotable |
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
├── middleware/
│   ├── auth.ts               # JWT verification + admin check
│   └── quota.ts              # Storage quota enforcement
└── routes/
    ├── admin.ts              # User management, storage monitoring
    ├── members.ts            # Family member CRUD
    ├── accounts.ts           # Account CRUD
    ├── transactions.ts       # Transaction CRUD, edits, linked reversal
    ├── transfers.ts          # Inter-account transfers
    ├── loans.ts              # Full loan lifecycle + settlement
    ├── investments.ts        # Investment + return tracking
    ├── groups.ts             # Account groups with aggregation
    ├── search.ts             # Global search (transactions, accounts, loans)
    └── export.ts             # Data export/import/clear

src/                          # React frontend
├── App.tsx                   # Main app (routing, auth, data, settings)
├── main.tsx                  # Entry point + service worker registration
├── types.ts                  # TypeScript interfaces
├── index.css                 # Global styles, theme, dark mode
├── services/
│   ├── authService.ts        # Supabase auth client + fetch helper
│   └── cacheService.ts       # IndexedDB offline cache
├── utils/
│   ├── cn.ts                 # Tailwind class merge utility
│   ├── pdf.ts                # Shared PDF helpers
│   └── ledgerPdf.ts          # Ledger PDF export
└── components/
    ├── layout/
    │   ├── Sidebar.tsx       # Navigation sidebar with profile
    │   └── Header.tsx        # Top bar with global search
    ├── Dashboard.tsx         # Main dashboard with filters, quick tasks
    ├── Ledger.tsx            # Transaction ledger with running balance
    ├── AccountManager.tsx    # Account create/edit/archive
    ├── MemberManager.tsx     # Members with account drill-down
    ├── GroupManager.tsx      # Account groups management
    ├── InvestmentTracker.tsx # Investment positions & returns
    ├── LoanManager.tsx       # Loan create/settle/view
    ├── ReportGenerator.tsx   # PDF/CSV financial reports
    ├── Settings.tsx          # Appearance, dashboard, categories
    ├── UserProfile.tsx       # Profile, password, data management
    ├── AdminPanel.tsx        # User management (admin only)
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
| **Settings** | Appearance, dashboard toggles, categories |
| **Admin Panel** | User management, storage limits (admin only) |

## Database Schema

All tables include a `user_id` column for multi-tenant isolation.

| Table | Key Columns |
|-------|-------------|
| **accounts** | `id`, `name`, `type`, `member_id`, `parent_id`, `color`, `archived`, `initial_balance` |
| **members** | `id`, `name`, `relationship` |
| **transactions** | `id`, `account_id`, `date`, `particulars`, `category`, `amount`, `type`, `linked_transaction_id` |
| **investments** | `id`, `account_id`, `principal`, `date` |
| **investment_returns** | `id`, `investment_id`, `date`, `amount`, `percentage` |
| **loans** | `id`, `lender_account_id`, `borrower_account_id`, `borrower_name`, `amount`, `remaining`, `status`, `particulars` |
| **loan_settlements** | `id`, `loan_id`, `amount`, `transaction_id` |
| **groups** | `id`, `name`, `member_id`, `color` |

## Auth Flow

```
Login (Google OAuth or Email/Password)
  → Supabase Auth returns JWT
  → Backend verifies JWT via supabaseAdmin.auth.getUser()
  → All API calls include Authorization: Bearer <token>
  → Backend filters queries by user_id from the verified token
  → Admin features available only to users in ADMIN_EMAILS list
```
