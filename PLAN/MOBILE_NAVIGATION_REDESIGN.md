# Mobile Navigation Redesign

> **Date:** 2026-06-03
> **Branch:** `mobile-navigation-redesign`
> **Status:** Planning → Implementation

---

## 0. Industry Standards & References

This design follows established mobile navigation patterns from platform guidelines and modern web best practices.

### Platform Guidelines

| Standard | Reference | Applied To |
|----------|-----------|------------|
| **Apple HIG — Tab Bars** | [developer.apple.com/design/human-interface-guidelines/tab-bars](https://developer.apple.com/design/human-interface-guidelines/tab-bars) | Bottom nav structure, 5-item max, icon-only design, safe area insets |
| **Apple HIG — Bottom Sheets** | [developer.apple.com/design/human-interface-guidelines/sheets](https://developer.apple.com/design/human-interface-guidelines/sheets#Modal-sheets) | MoreMenu modal sheet, drag-to-dismiss, backdrop behavior |
| **Apple HIG — Visual Effects** | [developer.apple.com/design/human-interface-guidelines/materials](https://developer.apple.com/design/human-interface-guidelines/materials) | Glassmorphic backdrop-blur, vibrancy, translucency |
| **Material Design 3 — Navigation Bar** | [m3.material.io/components/navigation-bar](https://m3.material.io/components/navigation-bar/overview) | 3-5 item nav, active indicator shape, label behavior |
| **Material Design 3 — Bottom Sheets** | [m3.material.io/components/bottom-sheets](https://m3.material.io/components/bottom-sheets/overview) | Modal bottom sheet behavior, drag semantics |
| **Material Design 3 — FAB** | [m3.material.io/components/floating-action-button](https://m3.material.io/components/floating-action-button/overview) | FAB positioning, size, morphing behavior |

### Web & Accessibility Standards

| Standard | Reference | Applied To |
|----------|-----------|------------|
| **WCAG 2.1 — Target Size** | [w3.org/WAI/WCAG21/Understanding/target-size.html](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html) | 44×44px minimum touch targets |
| **WCAG 2.1 — Motion** | [w3.org/WAI/WCAG21/Understanding/animation-from-interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions) | `prefers-reduced-motion` support |
| **web.dev — Scroll-driven animations** | [web.dev/articles/scroll-driven-animations](https://web.dev/articles/scroll-driven-animations) | RAF-throttled scroll detection, passive listeners |
| **web.dev — Touch and gestures** | [web.dev/articles/passive-event-listeners](https://web.dev/articles/passive-event-listeners) | `{ passive: true }` on all scroll handlers |
| **web.dev — Viewport units** | [web.dev/articles/viewport-units](https://web.dev/articles/viewport-units) | `100dvh`, `env(safe-area-inset-*)` for PWA |

### Design Patterns Applied

| Pattern | Source | Rationale |
|---------|--------|-----------|
| **Glassmorphism** | Apple HIG Materials, Material Design 3 Surface | Modern translucent design with backdrop-blur; consistent with iOS/Android system UI |
| **Scroll-to-hide nav** | iOS Safari, Chrome Android, Twitter/X, Instagram | Maximize content real estate; users discover nav via scroll-up gesture |
| **Bottom sheet for overflow** | iOS UIActivityViewController, Material Design 3 | Familiar pattern for secondary actions; keeps bottom nav clean |
| **Shared layout animation** | Apple HIG Motion, Material Design Motion | `layoutId` morphing provides spatial continuity between nav and FAB |
| **44px touch targets** | Apple HIG (44pt), WCAG 2.1 (24px min), Material (48dp) | Accessibility compliance; prevents mis-taps |
| **Safe area insets** | Apple Human Interface Guidelines | Proper spacing around Dynamic Island, home indicator |

### Performance Budget

| Metric | Target | Technique |
|--------|--------|-----------|
| **First Contentful Paint** | No regression | Glass effect via CSS only (no JS) |
| **Cumulative Layout Shift** | 0 | Fixed positioning; `pb-20` reserves space |
| **Interaction to Next Paint** | < 50ms | RAF-throttled scroll; passive listeners only |
| **Animation frame rate** | 60fps | `will-change: transform` only on animated elements; spring physics (no JS timers) |
| **Bundle size delta** | < 5KB gzipped | 3 small files; no new dependencies |

---

## 1. Overview

Redesign the mobile navigation from a slide-in sidebar drawer to a glassmorphic bottom tab bar with 5 icon-only buttons. The center `+` button morphs between an in-nav position and a floating FAB on the Ledger page. A bottom sheet "More" menu holds the remaining 6 items. The nav auto-hides on scroll-down and reappears on scroll-up.

### Goals
- Best-in-class mobile navigation UX
- Glassmorphic (frosted glass) design language
- Smooth motion-driven animations for all transitions
- Scroll-aware auto-hide for maximum content visibility
- Seamless `+` button morphing between nav and FAB positions
- WCAG 2.1 AA compliant (touch targets, motion preferences, focus management)

---

## 2. Architecture

### Current State
- **Mobile nav:** Slide-in sidebar drawer (`Sidebar.tsx`) + hamburger menu (`Header.tsx`) + standalone FAB (`FloatingActionButton.tsx`)
- **FAB actions:** "New Transaction" + "Inter-Account Transfer" expandable menu
- **No scroll detection:** Nav is always visible or toggled manually

### Target State
- **Bottom tab bar:** 5 items — Home, Groups, +, Loans, More (glass design, icon-only)
- **+ button:** In-nav on non-Ledger pages; morphs to floating FAB on Ledger page (opens New Transaction directly)
- **More menu:** Bottom sheet with Members, Accounts, Investments, Reports, Recycle Bin, Settings
- **Auto-hide:** Scroll down → nav hides; scroll up → nav reappears; tap bottom edge → nav reappears
- **Desktop:** Unchanged (existing sidebar remains)

---

## 3. Files

### New Files (3)

| # | File | Purpose | Est. LOC |
|---|------|---------|----------|
| 1 | `src/hooks/useScrollDirection.ts` | Scroll direction detection hook | ~60 |
| 2 | `src/components/layout/BottomNav.tsx` | Glassmorphic bottom tab bar | ~180 |
| 3 | `src/components/layout/MoreMenu.tsx` | Bottom sheet with remaining nav items | ~120 |

### Modified Files (4)

| # | File | Changes |
|---|------|---------|
| 1 | `src/App.tsx` | Import/render `BottomNav`, attach scroll ref, add `pb-20 md:pb-0`, remove old FAB wrapper |
| 2 | `src/index.css` | Add `.glass-nav` utility class for glassmorphic styling |
| 3 | `src/components/FloatingActionButton.tsx` | Delete — replaced by + button in `BottomNav` |
| 4 | `src/components/layout/Header.tsx` | Optional: keep hamburger for profile access, or remove on mobile |

---

## 4. Implementation Steps

### Step 1: `useScrollDirection` Hook

**File:** `src/hooks/useScrollDirection.ts`
**Industry refs:** `web.dev:scroll-driven-animations`, `web.dev:passive-event-listeners`, `WCAG:animation-from-interactions`

```ts
// Returns { visible: boolean, scrollRef: React.RefObject<HTMLDivElement> }
// - Attaches scroll listener to the ref'd container
// - Scrolling down → visible = false
// - Scrolling up → visible = true
// - At top (scrollTop < 10) → always visible
// - Only active on mobile (< 768px)
// - Uses requestAnimationFrame for throttling
// - Respects prefers-reduced-motion
```

**Key behaviors:**
- `lastScrollY` tracked in a `useRef`
- `direction` state drives `visible` return value
- RAF-throttled scroll handler for 60fps performance (`web.dev:passive-event-listeners`)
- Cleanup on unmount removes event listener
- `matchMedia` check for mobile breakpoint — always `true` on desktop
- Scroll event listener uses `{ passive: true }` to avoid blocking compositor thread (`WCAG:scroll-driven-animations`)

---

### Step 2: Glassmorphic CSS Utility

**File:** `src/index.css`
**Industry refs:** `Apple HIG:Materials`, `Material Design 3:Surface`, `web.dev:backdrop-filter`

```css
.glass-nav {
  background: rgba(255, 255, 255, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
}

:root.dark .glass-nav,
:root.dark-dim .glass-nav,
:root.dark-night .glass-nav {
  background: rgba(28, 24, 41, 0.72);
  border-top-color: rgba(255, 255, 255, 0.05);
}
```

> **Why 0.72 opacity:** Apple HIG recommends 60-80% opacity for glass materials over content. 0.72 balances readability with content visibility behind the nav. `saturate(180%)` prevents the frosted effect from desaturating content below.

---

### Step 3: `MoreMenu` Component

**File:** `src/components/layout/MoreMenu.tsx`
**Industry refs:** `Material Design 3:Bottom Sheets`, `Apple HIG:Sheets#Modal`, `WCAG:target-size`

**Props:**
```ts
interface MoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}
```

**Behavior:**
- Bottom sheet sliding up from bottom via `motion.div` + `AnimatePresence`
- Backdrop: `bg-black/30 backdrop-blur-sm` with fade animation
- Drag-to-dismiss: `drag="y"`, `dragConstraints={{ top: 0 }}`, close if `dragOffset.y > 100`
- Rounded top: `rounded-t-3xl` (Material Design 3 recommendation: 28px+ for modal sheets)
- Content: 2-column grid of 6 items
- **Touch targets:** Each item grid cell is min 44×44px (`WCAG:target-size`)
- **Focus trap:** When open, focus is trapped inside the sheet; Escape key closes it (`WCAG:keyboard-accessible`)

**Items:**
| Icon | Label | Tab ID |
|------|-------|--------|
| `Users` | Members | `members` |
| `Wallet` | Accounts | `accounts` |
| `TrendingUp` | Investments | `investments` |
| `FileText` | Reports | `reports` |
| `Trash2` | Recycle Bin | `recyclebin` |
| `Settings` | Settings | `settings` |

**Styling:** Each item is a glass-styled card with icon + label, active item highlighted with primary color.

---

### Step 4: `BottomNav` Component

**File:** `src/components/layout/BottomNav.tsx`
**Industry refs:** `Apple HIG:Tab Bars`, `Material Design 3:Navigation Bar`, `WCAG:target-size`, `WCAG:focus-appearance`

**Props:**
```ts
interface BottomNavProps {
  activeTab: string;
  selectedAccountId: number | null;
  onTabChange: (tab: string) => void;
  onNewTransaction: () => void;
  visible: boolean; // from useScrollDirection
}
```

**5 Nav Items (Apple HIG max: 5 tabs):**
| Position | Icon | Action | ARIA |
|----------|------|--------|------|
| 1 | `LayoutDashboard` (Home) | `onTabChange('dashboard')` | `aria-label="Home"`, `aria-current="page"` when active |
| 2 | `Layers` (Groups) | `onTabChange('groups')` | `aria-label="Groups"`, `aria-current="page"` when active |
| 3 | `Plus` (+ FAB) | Ledger: `onNewTransaction()` | `aria-label="New transaction"` |
| 4 | `Handshake` (Loans) | `onTabChange('loans')` | `aria-label="Loans"`, `aria-current="page"` when active |
| 5 | `MoreHorizontal` (More) | Opens `MoreMenu` | `aria-label="More options"`, `aria-haspopup="dialog"` |

**Glass Design (Apple HIG Materials):**
- Container: `.glass-nav` class + `fixed bottom-0 inset-x-0 z-50`
- Safe area: `padding-bottom: env(safe-area-inset-bottom, 0px)` (Apple: home indicator inset)
- Each icon: 44×44px minimum hit target (WCAG 2.1 §2.5.8), `rounded-full`, no text labels
- Active item: primary color ring/glow (Material Design 3 active indicator pattern)
- Inactive item: muted color
- Focus-visible ring for keyboard navigation (`WCAG:focus-appearance`)

**Scroll Hide Animation (iOS/Android pattern):**
```tsx
<motion.div
  animate={{ y: visible ? 0 : 100 }}
  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
>
```
- Hides on scroll-down, reappears on scroll-up (matches Twitter/X, Instagram, Chrome)
- `prefers-reduced-motion`: transition disabled, snap to visible state

**+ Button / FAB Morph (Shared Layout Animation):**
- Uses `layoutId="fab-plus"` from `motion/react` for shared layout animation
- **Non-Ledger pages:** Centered in bottom nav, 48×48px `bg-primary` circle
- **Ledger page:** Bottom nav hides via `AnimatePresence`; separate `motion.div` with same `layoutId` appears at `bottom-8 right-8` as 56×56px FAB
- Tapping FAB on Ledger calls `onNewTransaction()` directly (no expand menu)
- Reverse animation plays when leaving Ledger

> **Why `layoutId`:** Apple HIG Motion emphasizes spatial continuity — when an element moves between containers, it should animate smoothly to its new position rather than disappear/reappear. `layoutId` provides this with zero configuration.

```tsx
// In BottomNav (non-Ledger):
<motion.button layoutId="fab-plus" className="w-12 h-12 rounded-full bg-primary ...">
  <Plus className="w-6 h-6 text-white" />
</motion.button>

// In App.tsx (Ledger only):
<AnimatePresence>
  {selectedAccountId && (
    <motion.button
      layoutId="fab-plus"
      className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-primary shadow-2xl ..."
      onClick={() => setIsTransactionModalOpen(true)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <Plus className="w-7 h-7 text-white" />
    </motion.button>
  )}
</AnimatePresence>
```

---

### Step 5: Integrate in `App.tsx`

**Changes:**
1. Import `BottomNav` and `useScrollDirection`
2. Remove old `<FloatingActionButton>` wrapper (line 244)
3. Initialize hook:
   ```tsx
   const { visible, scrollRef } = useScrollDirection();
   ```
4. Attach scroll ref to content div (line 223):
   ```tsx
   <div ref={scrollRef} className="flex-1 p-4 md:p-8 md:pb-8 pb-20 overflow-y-auto">
   ```
5. Render `BottomNav` (mobile-only):
   ```tsx
   <div className="md:hidden">
     <BottomNav
       activeTab={activeTab}
       selectedAccountId={selectedAccountId}
       onTabChange={(tab) => {
         setActiveTab(tab as typeof activeTab);
         setSelectedAccountId(null);
       }}
       onNewTransaction={() => setIsTransactionModalOpen(true)}
       visible={visible}
     />
   </div>
   ```
6. Add Ledger FAB with `layoutId="fab-plus"` (rendered outside BottomNav, mobile-only):
   ```tsx
   <div className="md:hidden">
     <AnimatePresence>
       {selectedAccountId && (
         <motion.button
           layoutId="fab-plus"
           onClick={() => setIsTransactionModalOpen(true)}
           className="fixed bottom-8 right-8 z-50 w-14 h-14 rounded-full bg-primary shadow-2xl flex items-center justify-center"
           style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
           initial={{ opacity: 0, scale: 0.8 }}
           animate={{ opacity: 1, scale: 1 }}
           exit={{ opacity: 0, scale: 0.8 }}
           transition={{ type: 'spring', stiffness: 400, damping: 30 }}
         >
           <Plus className="w-7 h-7 text-white" />
         </motion.button>
       )}
     </AnimatePresence>
   </div>
   ```

---

### Step 6: Delete `FloatingActionButton.tsx`

- Remove file: `src/components/FloatingActionButton.tsx`
- Remove import from `App.tsx` (line 18)
- Remove the `<div className="md:hidden"><FloatingActionButton ... /></div>` wrapper (line 244)

---

### Step 7: Header Cleanup (Optional)

The hamburger menu button in `Header.tsx` (lines 101-106) can remain for profile/sign-out access, or be removed since the bottom nav handles primary navigation. **Recommendation:** Keep it — it provides quick access to the sidebar which contains the profile card and sign-out button.

---

## 5. Animation Reference

| Transition | Technique | Duration |
|------------|-----------|----------|
| Nav hide/show (scroll) | `y: 0 ↔ 100` spring | 0.3s spring (stiffness: 400, damping: 30) |
| + button morph (nav → FAB) | `layoutId="fab-plus"` shared layout | 0.4s spring |
| MoreMenu open/close | `y: 100% → 0` slide up | 0.35s ease-out |
| MoreMenu backdrop | opacity fade | 0.25s ease-out |
| Active tab indicator | `layoutId="activeNav"` | 0.3s spring |
| Tab icon press | `scale: 0.97` (existing) | 0.1s |

---

## 6. Edge Cases

| Case | Handling | Standard |
|------|----------|----------|
| Safe area insets (iPhone notch) | `env(safe-area-inset-bottom)` padding on bottom nav | `Apple HIG:Safe Area` |
| Dark mode | `.glass-nav` has dark variant via `:root.dark` selector | `Material Design 3:Color` |
| Reduced motion | `prefers-reduced-motion` media query in `index.css` disables all transitions | `WCAG:animation-from-interactions` |
| PWA standalone | Safe area insets already in `index.css:180-183` | `web.dev:PWA` |
| Tab restoration | Session storage already saves `activeTab` — bottom nav reads same state | — |
| Content behind nav | `pb-20` on mobile content area prevents hidden content | `Apple HIG:Tab Bars:content-overlap` |
| z-index stacking | Bottom nav: `z-50`, modals: `z-50+`, MoreMenu backdrop: `z-40` | — |
| Ledger page | Bottom nav hidden, FAB shown with `layoutId` morph | `Apple HIG:Tab Bars:hide-on-scroll` |
| Keyboard navigation | Focus-visible rings on all interactive elements; Escape closes MoreMenu | `WCAG:keyboard-accessible` |
| Screen readers | `aria-current="page"` on active tab; `aria-label` on all icons; `role="dialog"` on MoreMenu | `WCAG:aria` |
| Small screens (< 320px) | Icons scale down to 36px; FAB scales to 48px; grid becomes 1-column | `WCAG:resize-text` |

---

## 7. Execution Order

1. `src/hooks/useScrollDirection.ts` — new file, no dependencies
2. `src/index.css` — add `.glass-nav` utility
3. `src/components/layout/MoreMenu.tsx` — new file (lucide + motion)
4. `src/components/layout/BottomNav.tsx` — new file (depends on MoreMenu + useScrollDirection)
5. `src/App.tsx` — integrate BottomNav, add scroll ref, remove old FAB, add Ledger FAB
6. `src/components/FloatingActionButton.tsx` — delete
7. Run `npm run lint` to verify type correctness

---

## 8. Testing Checklist

### Functional

- [ ] Bottom nav renders on mobile (< 768px)
- [ ] Bottom nav hidden on desktop (>= 768px)
- [ ] All 5 icons are tappable (44×44px hit targets)
- [ ] Active tab highlighted correctly
- [ ] Scroll down hides nav, scroll up shows nav
- [ ] Nav always visible at top of page
- [ ] + button centered in nav on non-Ledger pages
- [ ] + button morphs to FAB on Ledger page with smooth animation
- [ ] Tapping FAB on Ledger opens New Transaction modal
- [ ] FAB morphs back to nav when leaving Ledger
- [ ] MoreMenu opens as bottom sheet
- [ ] MoreMenu contains all 6 items in grid
- [ ] Tapping MoreMenu item navigates to correct tab
- [ ] MoreMenu drag-to-dismiss works
- [ ] Desktop layout unchanged
- [ ] Hamburger menu still works on mobile (profile access)

### Visual & Design

- [ ] Glass effect visible (backdrop-blur)
- [ ] Dark mode glass variant works
- [ ] All dark mode themes (dark, dark-dim, dark-night) render correctly
- [ ] Active indicator animation smooth (spring physics)

### Accessibility (WCAG 2.1 AA)

- [ ] All touch targets >= 44×44px (`WCAG:§2.5.8`)
- [ ] `aria-current="page"` on active tab icon
- [ ] `aria-label` on all icon-only buttons
- [ ] `role="dialog"` + `aria-modal="true"` on MoreMenu
- [ ] Focus trap inside MoreMenu when open
- [ ] Escape key closes MoreMenu
- [ ] Focus-visible ring visible on keyboard navigation (`WCAG:§2.4.7`)
- [ ] `prefers-reduced-motion` disables all animations (`WCAG:§2.3.3`)
- [ ] Screen reader announces tab change

### Platform & PWA

- [ ] Safe area insets respected on iPhone (Dynamic Island, home indicator)
- [ ] PWA standalone mode renders correctly
- [ ] Bottom nav doesn't overlap status bar
- [ ] `100dvh` height works correctly on iOS Safari
