# FinTrack Pro

A comprehensive family financial tracker with multi-account management, investment tracking, account grouping, and member-based organization.

## Features

- **Multi-Account Management** — Track Cash, Bank, Mobile Wallets, and Investments in one place
- **Member-Based Tracking** — Organize accounts and transactions by family members
- **Account Groups** — Group accounts under parent groups (e.g., "HK Bank" containing Savings, Current, Fixed accounts) with accumulated balance
- **Investment Tracking** — Monitor principal amounts and track returns with cumulative ROI visualization
- **Professional Ledger** — Detailed transaction history per account with running balance, debit/credit view
- **Report Generation** — Generate PDF & CSV financial reports with transaction summaries
- **Bank Statement PDF** — Export ledger as professionally formatted PDF with opening/closing balance
- **Quick Tasks** — Built-in todo list widget on the dashboard with localStorage persistence
- **Dark Mode** — Institutional dark theme with CSS variable system
- **Type Color Customization** — System-wide colors per account type (Bank, Cash, Mobile, etc.)
- **Global Search** — Search accounts and members from the header
- **Quick Filters** — Filter dashboard by account type (Banks, Cash, Mobile, Investments)
- **Responsive Design** — Optimized for mobile, tablet, and desktop with card-based layouts
- **Font Size Scaling** — Adjust base font size (small/normal/large) in Settings

## Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Recharts, Framer Motion
- **Backend**: Node.js, Express, tsx
- **Database**: SQLite (local) / Supabase (production)
- **Deployment**: Vercel (static + serverless functions)

## Getting Started

### Prerequisites

- Node.js (LTS recommended)

### Installation

```bash
git clone <repository-url>
cd FinTrack-Pro
npm install
```

### Environment Setup

Create a `.env` file in the root directory:

```env
# Database (SQLite by default)
DATABASE_URL="data.db"

# Optional: Supabase for cloud database
SUPABASE_URL="your_supabase_url"
SUPABASE_ANON_KEY="your_supabase_key"

# Authentication (change defaults for production!)
AUTH_USERNAME="admin"
AUTH_PASSWORD="password123"

# Optional: Gemini AI (for transaction categorization)
GEMINI_API_KEY="your_gemini_key"
GEMINI_MODEL="gemini-2.0-flash"

# App URL
APP_URL="http://localhost:3001"
```

### Run

```bash
npm run dev
```

The app will be available at `http://localhost:3001`.

Default login: `admin` / `password123`

## Project Structure

```
api/                    # Express backend
├── db.ts               # Database setup (SQLite / Supabase)
├── config.ts           # Auth configuration
├── index.ts            # Server entry point
└── routes/
    ├── members.ts      # Member CRUD
    ├── accounts.ts     # Account CRUD
    ├── transactions.ts # Transaction CRUD
    ├── transfers.ts    # Inter-account transfers
    ├── investments.ts  # Investment tracking
    └── groups.ts       # Account groups with accumulated balance

src/                    # React frontend
├── App.tsx             # Main app with routing, settings, data fetching
├── main.tsx            # Entry point
├── types.ts            # TypeScript interfaces
├── index.css           # Global styles, theme, dark mode
├── services/
│   └── cacheService.ts # IndexedDB cache
├── utils/
│   └── cn.ts           # Tailwind class merge utility
└── components/
    ├── layout/
    │   ├── Sidebar.tsx # Navigation sidebar
    │   └── Header.tsx  # Top header with search
    ├── Dashboard.tsx   # Main dashboard with filters
    ├── Ledger.tsx      # Transaction ledger per account
    ├── AccountManager.tsx  # Account CRUD with inline editing
    ├── MemberManager.tsx   # Members with account drill-down
    ├── GroupManager.tsx    # Account groups management
    ├── InvestmentTracker.tsx   # Investment positions & returns
    ├── ReportGenerator.tsx     # PDF report generation
    ├── Settings.tsx     # App settings & customization
    ├── Login.tsx        # Authentication
    ├── TransactionForm.tsx  # Transaction entry form
    ├── TransactionRow.tsx   # Desktop ledger row
    ├── TransactionCard.tsx  # Mobile ledger card
    ├── TransferModal.tsx    # Transfer between accounts
    ├── TransactionModal.tsx # Quick transaction modal
    ├── FloatingActionButton.tsx # FAB for quick actions
    ├── DebitCreditToggle.tsx    # Shared debit/credit toggle
    ├── Select.tsx           # Custom styled select
    └── Toast.tsx            # Toast notification system
```

## Database Schema

**accounts** — `id`, `name`, `type` (cash/bank/mobile/investment/purpose/home_exp/group), `member_id`, `parent_id`, `color`, `archived`, `initial_balance`

**members** — `id`, `name`, `relationship`

**transactions** — `id`, `account_id`, `date`, `particulars`, `category`, `amount`, `type` (normal/transfer), `linked_transaction_id`, `summary`

**investments** — `id`, `account_id`, `principal`, `date`

**investment_returns** — `id`, `investment_id`, `date`, `amount`, `percentage`

## Account Groups

Groups allow you to create parent containers that aggregate child account balances:

1. Navigate to **Groups** in the sidebar
2. Click **New Group** to create a group (e.g., "HK Bank")
3. Go to **Accounts** and assign accounts to the group via the "Group" dropdown
4. The Groups page shows the accumulated balance for each group
5. Expand a group to see its child accounts with individual balances

## Settings

- **Display** — Toggle visibility of total balance, assets, and liabilities cards
- **Dark Mode** — Toggle institutional dark theme
- **Font Size** — Small / Normal / Large base text scaling
- **Currency** — BDT, USD, EUR, GBP, INR
- **Account Colors** — Customize colors per account type (Bank, Cash, Mobile, Investment, etc.)
- **Data Export** — Download all data as JSON
- **Clear Cache** — Reset local IndexedDB cache
