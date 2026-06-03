# Animation Changes

## Goal
Remove all "bounce" (scale-on-click) effects and replace entry/exit animations with clean slide-in/slide-out.

## Part 1: Remove bounce effects

| File | Change |
|------|--------|
| `src/index.css` | Remove `:where(button):active { scale: 0.96 }` |
| `src/index.css` | Remove `active:scale-[0.96]` from `.btn-pill`, `.btn-primary`, `.btn-secondary` |
| `src/components/FloatingActionButton.tsx:91` | Remove `active:scale-95` |
| `src/components/layout/Sidebar.tsx:92` | Remove `whileTap={{ scale: 0.97 }}` |

## Part 2: Replace entry/exit animations with slide

| File | Current | New |
|------|---------|-----|
| `TransactionModal.tsx` | `y:20, scale:0.97` | `y:40` |
| `TransferModal.tsx` | `y:20, scale:0.97` | `y:40` |
| `RenameModal.tsx` | `scale:0.95, y:10` | `y:20` |
| `Toast.tsx` | `y:20, scale:0.95` | `x:100` (slide from right) |
| `AccountManager.tsx` | `scale:0.95` | `y:12` |
| `GroupManager.tsx` | `opacity only` | `opacity + y:12` |
| `FloatingActionButton.tsx` | `scale:0.8` | remove scale |
| `Dashboard.tsx` | `scale:0.97` | `y:-8` |
| `App.tsx` | `y:10` | `y:20` |

## Status
- [x] index.css - global button scale removed
- [x] index.css - btn-pill active:scale removed
- [x] index.css - btn-primary active:scale removed  
- [x] index.css - btn-secondary active:scale removed
- [x] FloatingActionButton.tsx
- [x] Sidebar.tsx
- [x] TransactionModal.tsx
- [x] TransferModal.tsx
- [x] RenameModal.tsx
- [x] Toast.tsx
- [x] AccountManager.tsx
- [x] GroupManager.tsx
- [x] Dashboard.tsx
- [x] App.tsx
- [x] Build verification (passed)
