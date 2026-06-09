# Navigation Improvement Opportunities

> This document captures all current and potential navigation improvements across the app, particularly the clickable → Ledger drill-down pattern.

## Current Navigation to Ledger

| Source | Status | Implementation |
|--------|--------|----------------|
| Dashboard (AccountCard) | ✅ Done | `onClick={() => onSelectAccount(account.id)}` |
| MemberManager (account buttons) | ✅ Done | `onClick={() => onSelectAccount(acc.id)}` |
| Header search results | ✅ Done | Sets `selectedAccountId` directly |
| **Groups (card → modal → account)** | ✅ Done | Group card opens modal → account row opens Ledger |

## Improvements Applied in This Session

### 1. Groups — Clickable Card → Modal → Account → Ledger
- **Files**: `GroupGridView.tsx`, `GroupManager.tsx`, `App.tsx`
- **Flow**: Click group card → modal opens with account list → click account → Ledger view
- **Back navigation**: Pressing "Back" from Ledger returns to Groups tab; the modal re-opens automatically because `selectedGroupId` persists in `App.tsx` state
- **Pattern**: State lift — `selectedGroupId` lives in `App.tsx` so it survives component mount/unmount cycles

### 2. AccountManager — Clickable Cards/Rows → Ledger
- **Files**: `AccountManager.tsx`, `AccountListView.tsx`
- **Flow**: Click any account card (grid) or row (list) → opens that account's Ledger
- **Back navigation**: Returns to Accounts tab
- **Pattern**: Follows the same `onSelectAccount` prop already used by Dashboard and MemberManager

## Future Opportunities

### 3. InvestmentTracker — Click Investment → Ledger
- **Impact**: Medium
- **Rationale**: Investments are accounts with `type='investment'`. Clicking an investment card could open its transaction Ledger to show buy/sell/dividend entries.
- **Effort**: Low — follows the same `onSelectAccount` pattern

### 4. Reports → Drill-Down to Account → Ledger
- **Impact**: Lower
- **Rationale**: Clicking a chart segment or table cell for a specific account could open its Ledger
- **Effort**: Medium — reports are aggregate views; would need to map from aggregated data back to account IDs

### 5. Dashboard — Group Summary Cards
- **Impact**: Medium
- **Rationale**: If the Dashboard ever shows group-level summaries, clicking could open the group account list modal (reuse the pattern from GroupManager)
- **Effort**: Low (if group modal is already built)

### 6. Back-Navigation Context Preservation (Architectural)
- **Impact**: High (UX)
- **Rationale**: Currently, Ledger `onBack` always returns to the tab, losing any intermediate context (e.g., modals). The `selectedGroupId` pattern solves this for groups. The same pattern should be used for other entry points (e.g., tracked source tab when navigating from search, reports, etc.)
- **Effort**: Medium — requires a stack or history-aware navigation model

## Implementation Pattern (Reference)

```tsx
// App.tsx — lift state for context preservation
const [selectedGroupId, setSelectedGroupId] = useState<number | null>(null);

// Component receives both select and context state
<GroupManager
  onSelectAccount={setSelectedAccountId}
  selectedGroupId={selectedGroupId}
  onSelectGroup={setSelectedGroupId}
/>

// Inside component — modal re-opens on back navigation
{selectedGroupId !== null && selectedGroup && (
  <Modal open onClose={() => onSelectGroup(null)} title={selectedGroup.name}>
    {selectedGroup.children.map(child => (
      <button key={child.id} onClick={() => onSelectAccount(child.id)}>
        {child.name} — {currency}{child.current_balance}
      </button>
    ))}
  </Modal>
)}
```

## Design Principles
1. **Every account card should be clickable** — users should be able to drill into any account's Ledger from any view
2. **Back navigation should restore context** — if the user opened a modal before navigating to the Ledger, coming back should restore that modal state
3. **Stop propagation on action buttons** — within clickable cards, use `e.stopPropagation()` on edit/delete/archive buttons to prevent the card's click handler from firing
4. **Visual affordance** — clickable cards/rows should show `cursor-pointer` and hover styles to indicate interactivity
