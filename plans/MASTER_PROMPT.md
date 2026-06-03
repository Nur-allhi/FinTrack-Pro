# Master Prompt: Apply App X Performance & UX Patterns to FinTrack Pro

> **Instructions for AI coding agents:** Read this entire file before making any changes. The file `PROJECT_IMPROVEMENT_FINDINGS.md` in this directory contains the full analysis of what makes App X fast and responsive (sections are referenced below). Apply ALL findings to the FinTrack Pro project.

## Setup

1. Read `PROJECT_IMPROVEMENT_FINDINGS.md` in full — it is the reference document.
2. Work on the FinTrack Pro project at `/home/eftynurpc/projects/FinTrack-Pro/`.
3. Create a new branch named `performance/ai-improvements` from the current branch.
4. After each group of changes, commit with a clear message referencing what was fixed.
5. Do NOT break existing functionality — test that the app still builds (`npm run build`) after changes.

---

## Changes to Make (in Priority Order)

### 🔴 P0 — Must Fix (Mobile Responsiveness Basics)
*See PROJECT_IMPROVEMENT_FINDINGS.md sections 8.1, 8.4, 8.5*

**1. Add global touch + overscroll CSS**
- File: `src/index.css`
- Add at top level: `* { touch-action: manipulation; }`
- Add: `html, body { overscroll-behavior: none; }`
- Add on all scrollable containers (sidebar, modals, select dropdown, date picker): `overscroll-behavior: contain;`

**2. Make all scroll/touch event listeners passive**
- Search for every `window.addEventListener('scroll', ...)` and `window.addEventListener('touch*', ...)` in the codebase
- Add `{ passive: true }` (or `{ passive: true, capture: true }` if capture was used)
- Files known to have issues: `Select.tsx:44`, `DatePicker.tsx:59`, `FloatingActionButton.tsx:43`

**3. Add body scroll locking + Escape key to all modals**
- Every modal component (SettleModal, GroupSettleModal, TransferModal, TransactionModal, RenameModal) must:
  - Set `document.body.style.overflow = 'hidden'` on mount
  - Listen for `keydown` Escape to close
  - Clean up both on unmount
- Use the exact pattern from section 8.4 of PROJECT_IMPROVEMENT_FINDINGS.md

**4. Add font preconnect to index.html**
- File: `index.html` `<head>`
- Add: `<link rel="preconnect" href="https://fonts.googleapis.com" />`
- Add: `<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />`

### 🟡 P1 — Visual Responsiveness
*See PROJECT_IMPROVEMENT_FINDINGS.md sections 1.2, 1.3, 1.4, 1.5, 2.2, 2.4, 8.2, 8.3, 8.6*

**5. Add tactile press feedback to all interactive elements**
- Add `active:scale-[0.97]` to every `<button>`, clickable card (AccountCard, LoanGroupCard), FAB, toggle, and nav item
- Add `transition-transform duration-150` alongside the active scale
- Reference pattern: section 1.6 (CSS transform/opacity), section 8.2 of PROJECT_IMPROVEMENT_FINDINGS.md

**6. Add skeleton loading with min-height placeholders**
- Create a `SkeletonLoader.tsx` component with shimmer CSS animation (copy the pattern from sections 1.2 and 8.3)
- Add skeleton variants for: cards, table rows, charts, dashboard summary cards
- Use the RAF two-phase reveal pattern (section 2.4) to avoid skeleton flicker
- Apply to: Dashboard main sections, Ledger transaction list, AccountManager card grid

**7. Add focus-visible rings + ARIA attributes**
- Add `focus-visible:ring-2 focus-visible:ring-primary focus-visible:outline-none` to all interactive elements missing it (Select, DatePicker, FAB, toggle buttons, dashboard tabs)
- Add `aria-current="page"` to Sidebar active nav item
- Add `aria-pressed` to Dashboard grid/list toggle and LedgerToolbar date mode buttons
- Add `aria-label` to all icon-only buttons (FAB, sidebar icons, action buttons)
- Add `aria-hidden="true"` to decorative SVG logos and icons
- Add `role="button"` + `tabIndex={0}` + `onKeyDown` (Enter/Space) to clickable table rows in Ledger

**8. Add content-visibility to lazy-loaded sections**
- Add `content-visibility: auto` to the wrapper divs of lazy-loaded route components in `App.tsx`
- Add `contain-intrinsic-size: 1000px` as a rough estimate to prevent scrollbar jitter

### 🟢 P2 — Polish
*See PROJECT_IMPROVEMENT_FINDINGS.md sections 1.9, 8.1, 8.7*

**9. Add overscroll-behavior: contain to all scrollable areas**
- Sidebar (`overflow-y-auto`), Select dropdown (`max-h-[200px] overflow-y-auto`), DashboardTodos (`max-h-[180px] overflow-y-auto`)
- Any element with `overflow-y-auto` or `overflow-y-scroll`

**10. Throttle scroll/resize handlers with requestAnimationFrame**
- `Select.tsx` updateMenuPosition, `DatePicker.tsx` updatePos
- Use the RAF throttle pattern from section 1.9 of PROJECT_IMPROVEMENT_FINDINGS.md

**11. Add safe-area-inset-bottom to bottom-fixed elements**
- Add `style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}` to any fixed-position elements at the bottom
- Reference: section 8.1

**12. Add contain: layout style to motion.div animated elements**
- Add `style={{ contain: 'layout style' }}` or the equivalent Tailwind class to every `<motion.div>` that animates with opacity/transform
- This limits the paint area during animation to just that element

### 🎬 Animation Smoothness
*See PROJECT_IMPROVEMENT_FINDINGS.md sections 1.6, 1.7, 1.8, 7.1-7.7*

**13. Fix animation durations and easing**
- Change all `transition={{ duration: 0.15 }}` → `transition={{ duration: 0.35 }}`
- Change all `transition={{ duration: 0.2 }}` → `transition={{ duration: 0.4 }}`
- Replace `ease: 'easeInOut'` → `ease: [0.22, 1, 0.36, 1]` (custom cubic-bezier) on all motion.div transitions
- Replace `ease: 'easeOut'` → `ease: [0.16, 1, 0.3, 1]` (softer ease-out)

**14. Add will-change to all animated elements**
- Add `style={{ willChange: 'transform, opacity' }}` to every `<motion.div>` and `<motion.button>` that animates
- This promotes them to GPU compositor layers (section 7.3)

**15. Add prefers-reduced-motion support**
- Add to `src/index.css`:
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

**16. (Optional) Add staggered list animations**
- Copy the `.app-stagger-grid` CSS pattern from section 1.8
- Apply to: Ledger transaction list, AccountManager cards, GroupGridView cards

### 🗄️ Data Architecture (Cache-First)
*See PROJECT_IMPROVEMENT_FINDINGS.md sections 1.1, 6.3, 6.4*

**17. Refactor hooks to cache-first pattern**
- In `useAccounts`, `useTransactions`, `useMembers`, etc.:
  - Read from IndexedDB cache first, set state immediately
  - Then fetch from API in background, update cache + state when response arrives
- Use the exact pattern from section 6.4 of PROJECT_IMPROVEMENT_FINDINGS.md
- Do NOT remove the existing API calls — just add the cache-first layer on top

**18. Update cache after every successful write**
- After any POST / PUT / DELETE that succeeds, write the result to IndexedDB cache
- This ensures the next page load serves fresh data from cache

**19. Increase cache TTL to session-length**
- Change IndexedDB TTL from 5 minutes to `null` (no expiry within session)
- Add a "Last synced" timestamp indicator to the UI header

**20. (Optional) Add View Transitions API for page navigation**
- Reference the pattern in section 1.7 of PROJECT_IMPROVEMENT_FINDINGS.md
- Apply to navigation/tab changes in `App.tsx`

---

## Verification

After all changes:
1. Run `npm run build` — must succeed with no errors
2. Run `npm run lint` — must pass
3. Verify the app loads without any console errors in dev mode
4. Verify modals open/close smoothly without background scroll
5. Verify pull-to-refresh does NOT trigger on the main page
6. Verify font loading shows text immediately (no invisible text flash)

## Commit Strategy

Commit after each P0 group (4 commits), then each P1 group (4 commits), then P2 as a batch (1 commit), then animation fixes as a batch (1 commit), then data architecture (1 commit). Use clear messages like:
- `fix: add touch-action and overscroll-behavior for mobile responsiveness`
- `fix: make scroll event listeners passive to prevent mobile jank`
- `fix: add body scroll locking and Escape key to all modals`
- `fix: add font preconnect for faster font loading`
- `feat: add tactile press feedback (active:scale) to all interactive elements`
