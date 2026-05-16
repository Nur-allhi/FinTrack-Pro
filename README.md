# FinTrack Pro

A comprehensive family financial tracker with multi-account management, investment tracking, account grouping, member-based organization, and **multi-tenant Supabase Auth**.

## Features

- **Multi-User Auth** — Sign in with Google OAuth or Email/Password via Supabase Auth; each user has isolated data
- **Admin Panel** — Designated admins can create/manage user accounts, set storage limits, view usage
- **PWA Support** — Installable as app, works offline with cached data, service worker auto-updates
- **Multi-Account Management** — Track Cash, Bank, Mobile Wallets, and Investments in one place
- **Member-Based Tracking** — Organize accounts and transactions by family members
- **Account Groups** — Group accounts under parent groups with accumulated balance
- **Investment Tracking** — Monitor principal amounts and track returns with cumulative ROI visualization
- **Professional Ledger** — Detailed transaction history per account with running balance, debit/credit view
- **Report Generation** — Generate PDF & CSV financial reports with transaction summaries
- **Bank Statement PDF** — Export ledger as professionally formatted PDF with opening/closing balance
- **Quick Tasks** — Built-in todo list widget on the dashboard with localStorage persistence
- **Dark Mode** — 3 variants (Deep, Dim, Night) with custom accent color picker
- **Customizable Appearance** — Accent color, dark mode style, font size, type colors
- **Global Search** — Search accounts and members from the header
- **Responsive Design** — Optimized for mobile, tablet, and desktop
- **Custom DatePicker** — Calendar UI dropdown for date selection
- **Category Management** — Rename categories via Settings
- **Data Export/Import** — Full backup and restore via JSON in Profile
- **Storage Limits** — Per-user quotas with admin override
- **Animated Loading Screen** — Sliding progress bar for content loading

## Tech Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Recharts, Framer Motion
- **Backend**: Node.js, Express, tsx
- **Auth**: Supabase Auth (Google OAuth + Email/Password)
- **Database**: Supabase (primary) / SQLite (fallback)
- **Deployment**: Vercel (static + serverless functions)

## Getting Started

### Prerequisites

- Node.js (LTS recommended)
- Supabase project (free tier works)

### Installation

```bash
git clone <repository-url>
cd FinTrack-Pro
npm install
```

### Environment Setup

Create a `.env` file in the root directory (see `.env.example`):

```env
# Supabase Configuration (required)
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Admin emails (comma-separated) — users who can access the admin panel
ADMIN_EMAILS="admin@example.com"

# App URL
APP_URL="http://localhost:3001"
```

### Supabase Setup

1. **Enable auth providers** in Supabase Dashboard → Authentication → Providers (Email/Password is on by default; Google OAuth optional)
2. **Run the migration** from `supabase/migrations/001_add_user_id.sql` in the Supabase SQL Editor
3. **Create your admin user** via Supabase Dashboard → Authentication → Add User

See `GUIDE.md` for full step-by-step instructions.

### Run

```bash
npm run build
npm run dev
```

The app will be available at `http://localhost:3001`.

## Project Structure

```
api/                    # Express backend
├── db.ts               # Database setup (Supabase + SQLite fallback)
├── config.ts           # Admin configuration
├── index.ts            # Server entry point
├── middleware/
│   ├── auth.ts         # JWT verification + admin check middleware
│   └── quota.ts        # Storage quota check middleware
└── routes/
    ├── admin.ts        # Admin user management (create/list/delete)
    ├── members.ts      # Member CRUD
    ├── accounts.ts     # Account CRUD
    ├── transactions.ts # Transaction CRUD + category rename
    ├── transfers.ts    # Inter-account transfers
    ├── investments.ts  # Investment tracking
    ├── groups.ts       # Account groups with accumulated balance
    └── export.ts       # Data export / import / clear-all

src/                    # React frontend
├── App.tsx             # Main app with routing, settings, auth, data fetching
├── main.tsx            # Entry point
├── types.ts            # TypeScript interfaces
├── index.css           # Global styles, theme, dark mode
├── services/
│   ├── cacheService.ts # IndexedDB cache
│   └── authService.ts  # Supabase Auth client + authenticated fetch helper
├── utils/
│   ├── cn.ts           # Tailwind class merge utility
│   ├── pdf.ts          # Shared PDF helpers
│   └── ledgerPdf.ts    # Ledger-specific PDF export
└── components/
    ├── layout/
    │   ├── Sidebar.tsx # Navigation sidebar
    │   └── Header.tsx  # Top header with search
    ├── AdminPanel.tsx  # User management UI (admin only)
    ├── Dashboard.tsx   # Main dashboard with filters
    ├── Ledger.tsx      # Transaction ledger per account
    ├── AccountManager.tsx  # Account CRUD with inline editing
    ├── MemberManager.tsx   # Members with account drill-down
    ├── GroupManager.tsx    # Account groups management
    ├── InvestmentTracker.tsx   # Investment positions & returns
    ├── ReportGenerator.tsx     # PDF/CSV report generation
    ├── Settings.tsx     # App settings & customization
    ├── Login.tsx        # Auth with Google OAuth + Email/Password
    ├── TransactionForm.tsx  # Transaction entry form
    ├── TransferModal.tsx    # Transfer between accounts
    ├── TransactionModal.tsx # Quick transaction modal
    ├── FloatingActionButton.tsx # FAB for quick actions
    ├── Toast.tsx            # Toast notification system
    └── ...                   # Supporting components
```

## Database Schema

Each table includes a `user_id UUID` column for multi-tenant data isolation.

**accounts** — `id`, `name`, `type`, `member_id`, `parent_id`, `color`, `archived`, `initial_balance`, `user_id`

**members** — `id`, `name`, `relationship`, `user_id`

**transactions** — `id`, `account_id`, `date`, `particulars`, `category`, `amount`, `type`, `linked_transaction_id`, `summary`, `user_id`

**investments** — `id`, `account_id`, `principal`, `date`, `user_id`

**investment_returns** — `id`, `investment_id`, `date`, `amount`, `percentage`, `user_id`

## Auth Flow

```
Login (Google OAuth or Email/Password)
  → Supabase Auth returns JWT (access_token)
  → Backend verifies JWT via supabaseAdmin.auth.getUser()
  → All subsequent API calls include Authorization: Bearer <token>
  → Backend filters all queries by user_id from the verified token
  → Admin panel visible only to users in ADMIN_EMAILS list
```

## Settings

- **Appearance** — Dark Mode (3 style variants), Accent Color (custom + 10 presets), Font Size, Currency, Account Colors
- **Dashboard Banner** — Toggle visibility of total balance, assets, liabilities, and quick tasks
- **Categories** — Rename transaction categories

## Profile

- **Account Info** — View email, edit display name
- **Security** — Change password
- **Data** — Refresh, Export JSON, Import JSON, Clear All Data
