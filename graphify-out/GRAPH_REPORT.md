# Graph Report - FinTrack-Pro  (2026-05-18)

## Corpus Check
- 70 files · ~73,435 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 569 nodes · 763 edges · 63 communities (61 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `4d9c28e1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]
- [[_COMMUNITY_Community 51|Community 51]]
- [[_COMMUNITY_Community 52|Community 52]]
- [[_COMMUNITY_Community 53|Community 53]]
- [[_COMMUNITY_Community 54|Community 54]]
- [[_COMMUNITY_Community 55|Community 55]]
- [[_COMMUNITY_Community 56|Community 56]]
- [[_COMMUNITY_Community 57|Community 57]]
- [[_COMMUNITY_Community 58|Community 58]]
- [[_COMMUNITY_Community 59|Community 59]]
- [[_COMMUNITY_Community 60|Community 60]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 35 edges
2. `useToast()` - 21 edges
3. `FinTrack Pro — User Manual` - 18 edges
4. `authService` - 15 edges
5. `Handoff — 16 May 2026 (Session 7)` - 14 edges
6. `Account` - 13 edges
7. `FinTrack Pro — Auth Setup Guide` - 12 edges
8. `FinTrack Pro` - 12 edges
9. `Components` - 10 edges
10. `16. Troubleshooting` - 9 edges

## Surprising Connections (you probably didn't know these)
- `Dashboard()` --calls--> `cn()`  [EXTRACTED]
  src/components/Dashboard.tsx → src/utils/cn.ts
- `ReportGenerator()` --calls--> `cn()`  [EXTRACTED]
  src/components/ReportGenerator.tsx → src/utils/cn.ts
- `DatePicker()` --calls--> `cn()`  [EXTRACTED]
  src/components/DatePicker.tsx → src/utils/cn.ts
- `Settings()` --calls--> `cn()`  [EXTRACTED]
  src/components/Settings.tsx → src/utils/cn.ts
- `Select()` --calls--> `cn()`  [EXTRACTED]
  src/components/Select.tsx → src/utils/cn.ts

## Communities (63 total, 2 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.22
Nodes (8): categorizeTransaction(), getAI(), getFinancialInsights(), fetchTransactions(), handleAddOrUpdateTransaction(), handleDelete(), loadCacheAndFetch(), generateReport()

### Community 1 - "Community 1"
Cohesion: 0.15
Nodes (15): DebitCreditToggle(), DebitCreditToggleProps, TransactionCard(), TransactionCardProps, TransactionForm(), TransactionFormProps, TransactionFormState, TransactionRow() (+7 more)

### Community 2 - "Community 2"
Cohesion: 0.6
Nodes (4): fetchInvestments(), fetchReturns(), handleAddReturn(), handleCreateInv()

### Community 16 - "Community 16"
Cohesion: 0.22
Nodes (9): config, app, __dirname, __filename, startup, AuthUser, Request, requireAdmin() (+1 more)

### Community 17 - "Community 17"
Cohesion: 0.05
Nodes (39): Border Radius Scale, Brand & Accent, Breakpoints, Buttons, Cards, Collapsing Strategy, Colors, Components (+31 more)

### Community 18 - "Community 18"
Cohesion: 0.14
Nodes (13): AccountCardProps, typeIcons, Dashboard(), DashboardProps, typeIcons, InvestmentTrackerProps, MemberManager(), MemberManagerProps (+5 more)

### Community 19 - "Community 19"
Cohesion: 0.07
Nodes (19): ErrorBoundary, Props, State, FloatingActionButtonProps, OfflineIndicatorProps, AccountManager, AdminPanel, Dashboard (+11 more)

### Community 20 - "Community 20"
Cohesion: 0.07
Nodes (30): Appearance & Customization, Auth Flow, 📊 Codebase Graph, code:bash (git clone <repository-url>), code:env (# Supabase (required)), code:bash (npm run build), code:block4 (api/                          # Express backend), code:block5 (Login (Google OAuth or Email/Password)) (+22 more)

### Community 21 - "Community 21"
Cohesion: 0.09
Nodes (22): requireQuota(), ROW_ESTIMATES, TABLES, absAmount, categories, deleteTx, formatted, info (+14 more)

### Community 22 - "Community 22"
Cohesion: 0.18
Nodes (10): 1) Language, 2) Core Principles (Non-negotiable), 3) Decision Order & Clarification Gate, 4) Context Discovery & File Reading, 5) Execution Discipline, 6) Auto-Documentation (Conditional), AGENTS.md - Working Conventions, Core Directives (+2 more)

### Community 23 - "Community 23"
Cohesion: 0.05
Nodes (39): Admin Panel, Auth & Config, Branch, Changes, Changes, Changes, Changes, Changes (+31 more)

### Community 24 - "Community 24"
Cohesion: 0.1
Nodes (19): Admin Panel Features, code:block1 (SUPABASE_URL="https://your-project.supabase.co"), code:bash (npm install), code:bash (curl -X POST http://localhost:3001/api/auth/login \), code:block4 (┌──────────────────────┐), Email/Password (Required), FinTrack Pro — Auth Setup Guide, Google OAuth (Optional) (+11 more)

### Community 25 - "Community 25"
Cohesion: 0.13
Nodes (16): AdminPanel(), AuthUser, colors, Group, GroupChild, GroupManager(), Ledger(), LoanManager() (+8 more)

### Community 27 - "Community 27"
Cohesion: 0.12
Nodes (15): FinTrack Pro — Project Update Plan, P0 — Immediate, P1 — High Priority, P2 — Medium Priority, Phase 1: Bug Fixes ✅, Phase 2: Refactoring ✅, Phase 3: UI Redesign, Phase 4: PWA & UX Stability (+7 more)

### Community 28 - "Community 28"
Cohesion: 0.28
Nodes (11): ReportGenerator(), ReportGeneratorProps, categorizeTransaction(), getAI(), getFinancialInsights(), Transaction, exportLedgerPDF(), drawFooter() (+3 more)

### Community 29 - "Community 29"
Cohesion: 0.14
Nodes (13): Bug Fixes, Changelog, Design Changes, Design Polish, Earlier Development, Housekeeping, Major Additions, May 14, 2026 — Bug Fixes, Toast System, Dark Mode, Groups & Mobile Views (+5 more)

### Community 30 - "Community 30"
Cohesion: 0.15
Nodes (12): accMap, accountIds, accountMap, borrowerAcc, existing, formatted, insertData, lenderAcc (+4 more)

### Community 31 - "Community 31"
Cohesion: 0.24
Nodes (7): LedgerProps, TransferModal(), TransferModalProps, cacheService, LedgerDB, OfflineAction, offlineService

### Community 32 - "Community 32"
Cohesion: 0.18
Nodes (7): RenameModalProps, Option, Select(), SelectProps, AppSettings, Settings(), SettingsProps

### Community 33 - "Community 33"
Cohesion: 0.22
Nodes (8): accounts, doClear, doImport, investmentReturns, investments, members, router, transactions

### Community 34 - "Community 34"
Cohesion: 0.22
Nodes (9): 16. Troubleshooting, Admin Panel not showing, Balance looks wrong, Can't log in, Data not syncing between devices, "Data refreshed" toast appears repeatedly, Loan balance not updating after editing a transaction, PWA won't install (+1 more)

### Community 35 - "Community 35"
Cohesion: 0.25
Nodes (7): balances, groups, info, result, router, update, withChildren

### Community 36 - "Community 36"
Cohesion: 0.25
Nodes (6): DatePicker(), DatePickerProps, dayHeaders, months, TransactionModal(), TransactionModalProps

### Community 37 - "Community 37"
Cohesion: 0.25
Nodes (8): 6. Transactions & Ledger, Adding a Transaction, Deleting a Transaction, Editing a Transaction, Exporting the Ledger, Filtering Transactions, Opening a Ledger, Running Balance

### Community 38 - "Community 38"
Cohesion: 0.25
Nodes (8): 8. Loans, Creating a Loan, Deleting a Loan, Editing a Loan, Editing or Deleting Settlement Transactions, Settling a Loan (Partial or Full), Understanding Loan Types, Viewing Loans

### Community 39 - "Community 39"
Cohesion: 0.29
Nodes (5): bytes, results, router, tableDefs, users

### Community 40 - "Community 40"
Cohesion: 0.33
Nodes (5): Toast, ToastContext, ToastContextValue, ToastProvider(), ToastType

### Community 41 - "Community 41"
Cohesion: 0.4
Nodes (5): dbDir, __dirname, __filename, initDb(), initSqlite()

### Community 42 - "Community 42"
Cohesion: 0.33
Nodes (5): accounts, formatted, info, router, update

### Community 43 - "Community 43"
Cohesion: 0.33
Nodes (5): formatted, info, investments, returns, router

### Community 44 - "Community 44"
Cohesion: 0.33
Nodes (5): amount, fromAcc, router, toAcc, transfer

### Community 45 - "Community 45"
Cohesion: 0.33
Nodes (6): 13. Admin Panel, Creating a User, Deleting a User, Managing Storage Limits, Resetting a Password, Viewing Users

### Community 46 - "Community 46"
Cohesion: 0.33
Nodes (6): 15. Data Privacy & Security, Account Deletion, Authentication, Data Storage, What Admins Can See, Your Data Is Yours

### Community 47 - "Community 47"
Cohesion: 0.33
Nodes (5): 1. Getting Started, FinTrack Pro — User Manual, First-Time Login, Navigation, Table of Contents

### Community 48 - "Community 48"
Cohesion: 0.33
Nodes (6): 4. Accounts, Account Types, Archiving an Account, Creating an Account, Editing an Account, Filtering Accounts

### Community 49 - "Community 49"
Cohesion: 0.4
Nodes (4): db, info, members, router

### Community 50 - "Community 50"
Cohesion: 0.4
Nodes (4): AccountManager(), AccountManagerProps, colors, typeIcons

### Community 51 - "Community 51"
Cohesion: 0.4
Nodes (5): 14. Offline Mode & PWA, How Offline Works, Installing as an App (PWA), What Requires Internet, What Works Offline

### Community 52 - "Community 52"
Cohesion: 0.4
Nodes (5): 2. Dashboard, Account Cards, Quick Action Buttons, Quick Tasks Widget, Total Balance (Top Section)

### Community 53 - "Community 53"
Cohesion: 0.4
Nodes (5): 5. Account Groups, Assigning Accounts to a Group, Creating a Group, Deleting a Group, Viewing Group Balance

### Community 54 - "Community 54"
Cohesion: 0.5
Nodes (4): 10. Reports, CSV Reports, Generating a Report, PDF Reports

### Community 55 - "Community 55"
Cohesion: 0.5
Nodes (4): 11. Settings, Appearance, Categories, Dashboard

### Community 56 - "Community 56"
Cohesion: 0.5
Nodes (4): 12. User Profile, Account Info, Data Management, Security

### Community 57 - "Community 57"
Cohesion: 0.5
Nodes (4): 3. Managing Members, Adding a Member, Deleting a Member, Viewing a Member's Accounts

### Community 58 - "Community 58"
Cohesion: 0.5
Nodes (4): 7. Inter-Account Transfers, Creating a Transfer, Editing or Deleting a Transfer, How It Works

### Community 59 - "Community 59"
Cohesion: 0.5
Nodes (4): 9. Investments, Adding an Investment, Logging Returns, Viewing Performance

## Knowledge Gaps
- **333 isolated node(s):** `env`, `Dashboard`, `MemberManager`, `AccountManager`, `Ledger` (+328 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `FinTrack Pro — User Manual` connect `Community 47` to `Community 34`, `Community 37`, `Community 38`, `Community 45`, `Community 46`, `Community 48`, `Community 51`, `Community 52`, `Community 53`, `Community 54`, `Community 55`, `Community 56`, `Community 57`, `Community 58`, `Community 59`?**
  _High betweenness centrality (0.022) - this node is a cross-community bridge._
- **Why does `cn()` connect `Community 1` to `Community 32`, `Community 36`, `Community 40`, `Community 18`, `Community 19`, `Community 50`, `Community 25`, `Community 28`, `Community 31`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `useToast()` connect `Community 25` to `Community 36`, `Community 40`, `Community 18`, `Community 19`, `Community 50`, `Community 31`?**
  _High betweenness centrality (0.005) - this node is a cross-community bridge._
- **What connects `env`, `Dashboard`, `MemberManager` to the rest of the system?**
  _333 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 17` be split into smaller, more focused modules?**
  _Cohesion score 0.05 - nodes in this community are weakly interconnected._
- **Should `Community 18` be split into smaller, more focused modules?**
  _Cohesion score 0.14 - nodes in this community are weakly interconnected._
- **Should `Community 19` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._