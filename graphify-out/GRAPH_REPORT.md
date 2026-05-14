# Graph Report - FinTrack-Pro  (2026-05-14)

## Corpus Check
- 34 files · ~33,463 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 237 nodes · 293 edges · 27 communities (24 shown, 3 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

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

## God Nodes (most connected - your core abstractions)
1. `cn()` - 19 edges
2. `Account` - 10 edges
3. `Components` - 10 edges
4. `AGENTS.md - Working Conventions` - 7 edges
5. `Member` - 6 edges
6. `db` - 6 edges
7. `💰 FinTrack Pro` - 6 edges
8. `Colors` - 6 edges
9. `Transaction` - 5 edges
10. `Installation` - 5 edges

## Surprising Connections (you probably didn't know these)
- `TransactionCard()` --calls--> `cn()`  [EXTRACTED]
  src/components/TransactionCard.tsx → src/utils/cn.ts
- `ReportGenerator()` --calls--> `cn()`  [EXTRACTED]
  src/components/ReportGenerator.tsx → src/utils/cn.ts
- `TransactionModal()` --calls--> `cn()`  [EXTRACTED]
  src/components/TransactionModal.tsx → src/utils/cn.ts
- `TransactionRow()` --calls--> `cn()`  [EXTRACTED]
  src/components/TransactionRow.tsx → src/utils/cn.ts
- `Settings()` --calls--> `cn()`  [EXTRACTED]
  src/components/Settings.tsx → src/utils/cn.ts

## Communities (27 total, 3 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.22
Nodes (8): categorizeTransaction(), getAI(), getFinancialInsights(), fetchTransactions(), handleAddOrUpdateTransaction(), handleDelete(), loadCacheAndFetch(), generateReport()

### Community 1 - "Community 1"
Cohesion: 0.1
Nodes (23): LedgerProps, ReportGenerator(), ReportGeneratorProps, AppSettings, Settings(), SettingsProps, TransactionCard(), TransactionCardProps (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.6
Nodes (4): fetchInvestments(), fetchReturns(), handleAddReturn(), handleCreateInv()

### Community 16 - "Community 16"
Cohesion: 0.08
Nodes (27): config, db, dbDir, __dirname, __filename, initDb(), app, __dirname (+19 more)

### Community 17 - "Community 17"
Cohesion: 0.07
Nodes (29): Border Radius Scale, Brand & Accent, Breakpoints, Collapsing Strategy, Colors, Decorative Depth, Do, Do's and Don'ts (+21 more)

### Community 18 - "Community 18"
Cohesion: 0.12
Nodes (11): AccountManagerProps, colors, DashboardProps, typeIcons, InvestmentTrackerProps, MemberManagerProps, TransferModalProps, Account (+3 more)

### Community 19 - "Community 19"
Cohesion: 0.12
Nodes (12): HeaderProps, AccountManager, Dashboard, FloatingActionButton, InvestmentTracker, Ledger, Login, MemberManager (+4 more)

### Community 20 - "Community 20"
Cohesion: 0.15
Nodes (12): 📊 Codebase Graph, code:bash (git clone <repository-url>), code:bash (npm install), code:env (GEMINI_API_KEY=your_gemini_api_key_here), code:bash (npm run dev), 💰 FinTrack Pro, 🚀 Getting Started, Installation (+4 more)

### Community 21 - "Community 21"
Cohesion: 0.17
Nodes (11): deleteTx, formatted, info, linkedIds, linkedMap, linkedUpdate, router, transaction (+3 more)

### Community 22 - "Community 22"
Cohesion: 0.2
Nodes (9): 1) Language, 2) Core Principles (Non-negotiable), 3) Decision Order & Clarification Gate, 4) Context Discovery & File Reading, 5) Execution Discipline, 6) Auto-Documentation (Conditional), AGENTS.md - Working Conventions, Core Directives (+1 more)

### Community 23 - "Community 23"
Cohesion: 0.2
Nodes (10): Buttons, Cards, Components, CTA / Footer, Forms, Hero Bands, Pricing, Tags & Badges (+2 more)

## Knowledge Gaps
- **114 isolated node(s):** `env`, `Dashboard`, `MemberManager`, `AccountManager`, `Ledger` (+109 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Community 1` to `Community 18`, `Community 19`?**
  _High betweenness centrality (0.024) - this node is a cross-community bridge._
- **Why does `Components` connect `Community 23` to `Community 17`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `Account` connect `Community 18` to `Community 1`, `Community 19`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `env`, `Dashboard`, `MemberManager` to the rest of the system?**
  _114 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.1 - nodes in this community are weakly interconnected._
- **Should `Community 16` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._
- **Should `Community 17` be split into smaller, more focused modules?**
  _Cohesion score 0.07 - nodes in this community are weakly interconnected._