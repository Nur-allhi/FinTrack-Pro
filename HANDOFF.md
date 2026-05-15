# Handoff — 15 May 2026

## Session Summary

Redesigned the transaction entry form to match `Design/Desktop_code.html` and `Design/Mobile_code.html` layouts. Updated the Floating Action Button, Dashboard banner, and export system.

## Changes

### Transaction Form (`src/components/TransactionForm.tsx`)
- Desktop: 2-row 12-column grid layout matching design spec (Date 2col | Description 7col | Amount 3col / Category 5col | Toggle 4col | Buttons 3col)
- Mobile: stacked layout with "Transaction Type" label above toggle
- Native `<select>` replaced with the app's custom `Select` component (pill-shaped, consistent with other dropdowns)
- Date input wrapped in styled container mimicking Select appearance (rounded-pill, bg-surface-soft, Calendar icon overlay)

### Select Component (`src/components/Select.tsx`)
- Button padding increased from `py-2` to `py-3` to match input heights
- Dropdown changed from `overflow-hidden` to `overflow-y-auto` with `max-h-[200px]` for scrollable category lists

### Debit/Credit Toggle (`src/components/DebitCreditToggle.tsx`)
- Removed `max-w-[220px]` constraint so toggle fills available width

### Floating Action Button (`src/components/FloatingActionButton.tsx`)
- Both speed-dial items unified to `rounded-pill` with consistent `px-6 py-3.5` padding
- Main button uses `bg-primary` for both open/closed states (was `bg-surface-dark` on open)
- Removed broken `-z-10` backdrop, replaced with proper click-outside handler via `useRef` + `mousedown` listener
- Auto-closes when TransactionModal or TransferModal opens (via `useEffect` watching modal state props)
- Wrapped in `<div className="md:hidden">` in App.tsx — hidden on desktop, visible on mobile only

### Dashboard (`src/components/Dashboard.tsx`)
- Removed "Transfer Funds" and "Generate Report" buttons from balance banner
- Restructured banner layout: left column (Total Balance + Assets/Liabilities below), right column (Quick Tasks widget)
- Quick Tasks widget: add/check/delete todos persisted to localStorage, pending count badge
- Added desktop-only action buttons below banner: "New Transaction" (btn-primary) and "Inter-Account Transfer" (btn-pill)
- Fixed type filter pills: "All" and "Others" now fall back to `#0052FF` color when selected

### Account Dropdowns
- ReportGenerator, TransferModal, TransactionModal: account labels now include member name (e.g., "Bkash · John (৳5,000)")

### PDF / CSV Export

#### Ledger (`src/components/Ledger.tsx`)
- Replaced CSV download with bank-statement PDF using pure jsPDF (no autotable)
- Columns: Date | Particulars | Debit | Credit | Balance
- Professional layout: branding header, opening balance card, alternating rows, total summary, closing balance, page numbers
- Fixed locale (`en-US`) and currency symbol fallback (`Tk ` for non-ASCII)

#### Report Generator (`src/components/ReportGenerator.tsx`)
- Added CSV export alongside existing PDF
- Both PDF and CSV now include Category column (Date | Particulars | Category | Debit | Credit)
- PDF uses same bank-statement layout as Ledger
- Fixed locale and currency symbol fallback

## Files Changed
- `src/components/TransactionForm.tsx` — complete layout rewrite
- `src/components/Ledger.tsx` — PDF export, smoother optimistic updates
- `src/components/Dashboard.tsx` — banner restructure, quick tasks, type filter fix
- `src/components/FloatingActionButton.tsx` — styling, click-outside, auto-close
- `src/components/Select.tsx` — padding, scrollable dropdown
- `src/components/DebitCreditToggle.tsx` — removed max-width
- `src/components/ReportGenerator.tsx` — CSV export, category column, PDF format
- `src/components/TransferModal.tsx` — member name in account labels
- `src/components/TransactionModal.tsx` — member name in account labels
- `src/App.tsx` — FAB hidden on desktop, onOpenTransaction pass-through
