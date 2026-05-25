# Grouped Loan Cards — Implementation Plan

## Goal
Group loans by counterparty into expandable cards with merged balance and group-level settlement. All frontend-only — no backend changes.

## Grouping Modes (toggle pills)

| Mode | Key | Example |
|------|-----|---------|
| By Pair | `lender_account_id` + `borrower_identifier` | "Savings → John" (3 loans) separate from "Wallet → John" (1 loan) |
| By Borrower | `borrower_identifier` only | All loans to John in one card |

`borrower_identifier` = `borrower_account_id` (inter-account) or `borrower_name` (person)

## Card Layout

```
┌──────────────────────────────────────────────────────┐
│  John Doe                          Active (2/3)       │
│  Lender: Savings Account                     (Pair)  │
│  Total Lent: $5,000 · Total Outstanding: $3,200       │
│  3 loans · Latest: 15 May 2026                        │
│  [Settle Group]                               [▼]     │
│  ──── expanded ────                                   │
│  │ Date     │ Lent    │ Remaining │ Due      │ Actions│
│  │ 15 May   │ $1,500  │ $200      │ 20 Jun   │ S E D │
│  │ 10 Apr   │ $1,000  │ $1,000    │ -        │ S E D │
│  └──────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────┘
```

- **Collapsed**: borrower name, lender (pair mode), total lent, total outstanding, loan count, latest date, status badge, Settle Group btn
- **Expanded**: mini table — same columns/actions as current, individual Settle still present
- **Status**: "Active" if any active loans; "All Settled" if all settled

## Group-Level Settle Flow

1. "Settle Group" button on card opens modal
2. Modal lists all **active loans** in group with `date | amount | remaining`
3. User picks one loan + enters settle amount
4. Recorded against that loan (existing backend endpoint)
5. Individual Settle buttons still available per row

## Data Flow

```
API → flat loans array → statusFilter (all/active/settled)
                        → useMemo groupBy(mode) 
                        → sort A-Z by borrower name
                        → render GroupCards
```

- `Total Outstanding` = `SUM(remaining)` of active loans in group
- Grouping is pure frontend — no API changes

## File Changes

| File | Lines | What |
|------|-------|------|
| `LoanGroupCard.tsx` | ~200 | New — card header + expandable mini table |
| `LoanForm.tsx` | ~200 | New — extracted create/edit form |
| `LoanManager.tsx` | ~380 | Rewritten — state, grouping logic, toggle, orchestration |

## Unchanged
- All API endpoints, data layer, DB schema
- Individual loan CRUD (create/edit/delete/settle)
- Settle modal for individual loans
- Mobile responsive behavior
