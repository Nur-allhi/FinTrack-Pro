# Sidebar Logo Rebrand

**Date:** 2026-05-30
**Status:** Completed

---

## Goal

Replace the old sidebar brand header (generic `Wallet` lucide icon + "FinTrack / Institutional" text) with a custom FinTrack Pro logo that matches the app's financial branding.

---

## Files Changed

| File | Change |
|---|---|
| `src/components/layout/Sidebar.tsx` | Replaced brand header with inline SVG icon + "FinTrack Pro" wordmark |
| `src/index.css` | Added Roboto Slab font from Google Fonts |

---

## Implementation Steps

### 1. Generate logo SVG
- Created `public/fintrack_pro_sidebarlogo.svg` — a combined horizontal lockup with bar-chart icon + "FinTrack Pro" wordmark + tagline.
- Later replaced with the square icon from `public/icons/icon.svg` (three ascending bars with green trend line/circles) + separate text.

### 2. Replace sidebar brand header
- Swapped out `<Wallet>` icon + `<h1>FinTrack</h1>` / `<p>Institutional</p>` for the new logo.

### 3. Fix visibility (light mode)
- Original SVG had near-white text (`rgb(232, 238, 248)`) — invisible on white sidebar.
- Replaced inline `style` overrides with proper `fill` attributes using project's `ink` color (`#0a0b0d`).

### 4. Inline SVG in component
- Moved from external file (`<img src="...">`) to inline JSX SVG to:
  - Bypass service worker caching issues
  - Eliminate extra network request

### 5. Switch to icon + text layout
- Removed the combined SVG lockup.
- Inlined the square bar-chart icon from `public/icons/icon.svg`.
- Added "FinTrack Pro" text beside it in a single line.

### 6. Typography
- Added Roboto Slab font via Google Fonts.
- Applied to wordmark with bold weight.
- "Pro" styled in green (`#34d399`) with normal weight for accent.

### 7. Responsive sizing
- Icon: `w-11 h-11` (44px) — fixed across breakpoints.
- Text: `text-base md:text-lg` (16px → 18px) — fits within 256px sidebar.
- Gap: `gap-0` — icon and text flush.

### 8. Clickable refresh
- Wrapped icon + text in a `<button>` that calls `window.location.reload()`.
- Lets users quickly refresh data by clicking the logo.

---

## Final Design

```
[▓▓▓ bar-chart icon ▓▓▓]FinTrack Pro
```

- Square icon with white rounded rect background, three navy bars, green trend dots/line.
- "FinTrack" in Roboto Slab bold, `#0a0b0d` (ink).
- "Pro" in Roboto Slab normal, `#34d399` (green accent).
- No gap between icon and text.
- Clicking the logo reloads the app.

---

## Notes

- The `public/fintrack_pro_sidebarlogo.svg` file remains untracked (not used in the final implementation).
- The old `Wallet` import was removed from Sidebar.tsx — no unused imports.
- All sizing was tuned iteratively via visual feedback annotations.
