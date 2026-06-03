# App X Performance & Architecture Report

> **Stack:** Vite 7.2 + React 19.2 + TypeScript 5.9 + Tailwind CSS v4.1  
> **Router:** react-router-dom v6 (client-side SPA)  
> **State:** React useState + Context (no external lib)  
> **Persistence:** localStorage (primary) + Firebase Firestore (opt-in backup)  

---

## 1. What Makes App X Feel Fast

### 1.1 localStorage-first Architecture (Zero Network)

Data loads from `localStorage` on every page refresh — there is **zero network dependency** for primary data access. The app renders instantly even on slow connections.

```
App mounts → read localStorage → render UI
           ↕ (optional background sync to Firebase)
```

**To implement in your project:**
- Use `localStorage`/`IndexedDB` as your primary store
- Make cloud sync a background concern, not a loading gate
- Cache computed summaries (e.g., `BalanceSummary`) separately so you don't recompute on every load

### 1.2 Skeleton Overlay with requestAnimationFrame

When the home page loads, there's a clever two-phase reveal:

```tsx
// Phase 1: Render content invisible + skeleton overlay
// Phase 2: requestAnimationFrame → fade in content
// Phase 3: setTimeout(320ms) → remove skeleton
const rafId = window.requestAnimationFrame(() => setIsContentVisible(true));
const timerId = window.setTimeout(() => setShowSkeletonOverlay(false), 320);
```

The content renders **before** it's visible, so the browser paints both skeleton and content in the same frame. The 320ms delay gives the skeleton just enough time to show before content fades in via CSS `transition-opacity duration-500`.

**Key insight:** A skeleton that appears + disappears too fast (>200ms) creates visual flicker. The staggered reveal masks loading and feels smooth even though the data is already in localStorage.

### 1.3 UseMemo for All Derived Data (Zero Recomputation)

`App.tsx` is a 1724-line component that uses `useMemo` for **every** derived value:

```tsx
const validTransactions = useMemo(() => ..., [financeData, visibleAccountIds]);
const filteredTransactions = useMemo(() => ..., [validTransactions, activeMonthYear, dateRange]);
const reportTrendTransactions = useMemo(() => ..., [dateRange, filteredTransactions, validTransactions, ...]);
```

This ensures that when a modal opens/closes (state change), the expensive transaction filtering/sorting doesn't rerun — only the minimal affected branches recompute.

**To implement in your project:**
- Chain `useMemo` dependencies so a change in one value cascades correctly
- Avoid inline `.filter()/.sort()` in JSX — wrap in `useMemo`

### 1.4 useCallback for All Handlers (Stable Refs)

Every event handler is wrapped in `useCallback`:

```tsx
const handleDeleteTransaction = useCallback((transactionId: string) => {
    ...
}, [financeData, storageUserId]);
```

This prevents child components from re-rendering when the parent re-renders for unrelated state changes.

### 1.5 useRef for Mutable Cross-Render State

The `shouldMarkNextLocalSaveModifiedRef` ref avoids unnecessary re-renders during rapid state changes (creating multiple transactions in sequence):

```tsx
const shouldMarkNextLocalSaveModifiedRef = useRef(false);
```

Setting a ref has **zero rendering cost** — no React reconciliation triggered.

### 1.6 CSS Animation Optimization

All animations use `transform` and `opacity` only (GPU-composited properties):

```css
.app-modal-panel {
    will-change: opacity, transform;
    transform-origin: center top;
}

@keyframes section-rise {
    from { opacity: 0; transform: translate3d(0, 22px, 0) scale(0.985); }
    to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}
```

Custom easings (`cubic-bezier(0.22, 1, 0.36, 1)`) feel more natural than CSS defaults.

**Accessibility:** Every animation is disabled via `@media (prefers-reduced-motion: reduce)`.

### 1.7 View Transitions API (Native Browser Navigation)

Page transitions use the modern View Transitions API with CSS fallback:

```tsx
const documentWithViewTransition = document as Document & { startViewTransition?: ... };
if (documentWithViewTransition.startViewTransition) {
    documentWithViewTransition.startViewTransition(() => completeNavigation());
}
```

CSS:
```css
::view-transition-old(root), ::view-transition-new(root) {
    animation-duration: 420ms;
    animation-timing-function: var(--app-motion-soft);
}
```

Pages animate directionally (forward/backward) based on nav order — this creates a **native-feeling navigation stack**.

### 1.8 Staggered Grid Animations

The `app-stagger-grid` class applies sequential entrance animations to children with increasing delays (40ms increments):

```css
.app-stagger-grid > * { animation: section-pop 0.7s ... both; }
.app-stagger-grid > :nth-child(1) { animation-delay: 40ms; }
.app-stagger-grid > :nth-child(2) { animation-delay: 90ms; }
/* ... up to 12 children */
```

This makes lists feel alive — items "pop" in one by one.

### 1.9 Scroll Throttling with requestAnimationFrame

The mobile nav auto-hide uses `requestAnimationFrame` instead of `setTimeout`:

```tsx
const handleScroll = () => {
    if (scrollFrameRef.current !== null) return; // Already scheduled
    scrollFrameRef.current = window.requestAnimationFrame(syncMobileNav);
};
```

This syncs to the browser's paint cycle — no redundant checks, no layout thrashing.

### 1.10 useAnimatedOpen Hook (Deferred Render)

Modal content doesn't mount until needed:

```tsx
export const useAnimatedOpen = (isOpen: boolean, duration = 220) => {
    const [shouldRender, setShouldRender] = useState(isOpen);
    const [isVisible, setIsVisible] = useState(isOpen);

    useEffect(() => {
        if (isOpen) {
            setShouldRender(true);
            requestAnimationFrame(() => setIsVisible(true)); // Defer to next frame
        } else {
            setIsVisible(false);
            setTimeout(() => setShouldRender(false), duration); // Keep mounted for exit animation
        }
    }, [isOpen]);
    return { shouldRender, isVisible };
};
```

**Two key tricks:**
1. `requestAnimationFrame` to defer making content visible (lets the DOM mount first)
2. `setTimeout(duration)` to keep content mounted during exit animation

---

## 2. Quick Wins to Copy

### 2.1 localStorage Caching Strategy

```ts
// Save all data
localStorage.setItem(key, JSON.stringify(data));

// Save computed summary separately (load instantly without parsing all data)
localStorage.setItem(balanceKey, JSON.stringify(balanceSummary));

// Always cache the summary after save
return balanceSummary;
```

### 2.2 useMemo Chain Pattern (src/App.tsx:442-503)

```tsx
const validTransactions = useMemo(() => ..., [financeData, visibleAccountIds]);
const monthYearOptions = useMemo(() => ..., [validTransactions]);
const filteredTransactions = useMemo(() => ..., [validTransactions, activeMonthYear, dateRange]);
```

### 2.3 Zero-re-render Sync Queuing (src/App.tsx:228)

```tsx
const shouldMarkNextLocalSaveModifiedRef = useRef(false);
// ...modify ref...
// Later, in useEffect:
const markModified = shouldMarkNextLocalSaveModifiedRef.current;
shouldMarkNextLocalSaveModifiedRef.current = false;
saveToLocalStorage(..., { markModified });
```

### 2.4 Skeleton Overlay Pattern (src/App.tsx:1394-1400)

```tsx
// Render skeleton + content simultaneously
// Fade content in, remove skeleton after 320ms
const rafId = requestAnimationFrame(() => setIsContentVisible(true));
const timerId = setTimeout(() => setShowSkeletonOverlay(false), 320);
```

### 2.5 Tailwind CSS Performance Classes

```css
/* GPU-accelerated properties only */
will-change: opacity, transform;
translate3d(0, 0, 0);   /* Triggers GPU compositing */
```

---

## 3. Build Tool Performance

### 3.1 Vite Configuration

```ts
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { host: '0.0.0.0', port: 5173 },
});
```

- Vite uses **ESBuild** for dev (sub-second HMR) and **Rollup** for prod (tree-shaking, code splitting)
- Tailwind is now a Vite plugin (v4), not a PostCSS plugin — faster builds
- No custom Rollup config needed for most apps

### 3.2 TypeScript Strict Mode

```json
{
  "strict": true,
  "verbatimModuleSyntax": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true
}
```

Catches dead code at compile time, keeps bundles lean.

---

## 4. Summary: What to Implement in Your Project

| Priority | Technique | Effort | Impact |
|----------|-----------|--------|--------|
| 🔴 High | localStorage-first data loading | Low | Instant startup |
| 🔴 High | `useMemo` chain for derived data | Medium | No wasted recomputation |
| 🔴 High | `useCallback` for event handlers | Low | Fewer re-renders |
| 🟡 Medium | Skeleton overlay + RAF reveal | Low | Smooth perceived load |
| 🟡 Medium | CSS `transform`/`opacity` only | Low | 60fps animations |
| 🟡 Medium | `useRef` for mutable flags | Low | Zero-render state changes |
| 🟢 Low | View Transitions API | Medium | Native-feeling nav |
| 🟢 Low | Staggered list animations | Low | Polished UX |
| 🟢 Low | `requestAnimationFrame` scroll throttle | Low | Smooth scroll handlers |
| 🟢 Low | `useAnimatedOpen` for modals | Medium | Clean enter/exit |

---

## 5. Dark Mode Implementation

### 5.1 Architecture Overview

Two layers — **a blocking inline script** in `index.html` to prevent flash, and **a React context** for runtime toggling + OS sync.

### 5.2 Inline Script (`index.html:19-47`)

Runs **before React mounts** (blocks first paint). Reads `prefers-color-scheme: dark` immediately:

```html
<script>
(() => {
    const isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const themeColor = isDarkMode ? '#030712' : '#f8fafc';
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
    document.documentElement.style.backgroundColor = themeColor;
    // Update theme-color meta tags for browser chrome
})();
</script>
```

**Why inline + blocking:** If you wait for React/DOMContentLoaded, the user sees a white flash before React sets `class="dark"`. The inline script runs synchronously before the first paint.

### 5.3 DarkModeContext (`src/context/DarkModeContext.tsx`)

React context that:

1. **Initializes from OS preference** — no localStorage persistence (but easy to add)
2. **Listens for OS-level changes** — if user switches system theme, the app follows automatically via `MediaQueryListEvent`
3. **Syncs browser chrome** — updates `theme-color` meta, `color-scheme`, `backgroundColor` on both `<html>` and `<body>`

```tsx
const [isDarkMode, setIsDarkMode] = useState(() =>
    window.matchMedia('(prefers-color-scheme: dark)').matches
);

useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', (e) => setIsDarkMode(e.matches));
    return () => mq.removeEventListener('change', ...);
}, []);

const applyTheme = (isDarkMode: boolean) => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.style.colorScheme = isDarkMode ? 'dark' : 'light';
    // Update theme-color meta tags
};
```

### 5.4 Tailwind Integration (`tailwind.config.js`)

```js
darkMode: 'class',  // Must be 'class', not 'media'
```

All styles use `dark:` prefix:
```css
bg-white dark:bg-gray-900
text-gray-900 dark:text-gray-50
border-slate-200/80 dark:border-slate-700/65
```

CSS custom properties handle the root background:
```css
:root { --app-background: var(--app-background-light); }
html.dark { --app-background: var(--app-background-dark); }
```

### 5.5 What to Remember for Your Project

| # | Rule | Why |
|---|------|-----|
| 1 | **Inline blocking script in `<head>`** | Prevents white flash before React mounts |
| 2 | **`darkMode: 'class'` in Tailwind config** | Enables overriding OS preference manually later |
| 3 | **Set `color-scheme` on `<html>`** | Controls native form controls, scrollbars, browser chrome |
| 4 | **Update `theme-color` meta tags** | Changes browser toolbar/status bar color on mobile |
| 5 | **Listen for OS changes via `matchMedia` listener** | Keeps app in sync when user toggles system theme |
| 6 | **CSS custom property for root bg** | Ensures `<html>` background matches your `dark:` classes (prevents white flash at scroll overflow) |
| 7 | **Dual meta tags for light/dark `theme-color`** | Lets the OS pick the right one before JS runs (`media="(prefers-color-scheme: dark)"`) |

---

## 6. Database Choice & Offline Architecture

### 6.1 App X's Firebase Approach

Firebase (Firestore) is used as an **optional backup/sync target only** — the primary store is `localStorage`. This works because:

- **Single-user, single-device** — no cross-device sync conflicts
- **No server-side logic** — all calculations (balance, filtering, sorting) happen client-side
- **Manual sync** — user clicks "Backup" or data syncs only when explicitly triggered
- **Simple data model** — no joins, no aggregations, no transactions across entities

```ts
// config/firebase.ts — Firestore with persistent offline cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

**Firestore is enough here** because it's not the brain — it's a backup bucket. The app works fully offline with or without Firebase configured.

### 6.2 Firebase vs Supabase for Financial Apps

| Need | Firebase Firestore | Supabase (PostgreSQL) |
|------|-------------------|----------------------|
| ACID transactions | ❌ Eventual consistency | ✅ Full ACID |
| SQL queries (JOIN, GROUP BY, window functions) | ❌ Limited queries | ✅ Full SQL |
| Multi-user Row-Level Security | ✅ Security Rules (custom syntax) | ✅ RLS (SQL-based, standard) |
| Real-time | ✅ Firestore snapshots | ✅ Postgres replication |
| Offline support | ✅ Built-in persistent cache | ❌ Requires custom sync layer |
| Self-host / no vendor lock-in | ❌ Proprietary | ✅ Open source, self-hostable |
| Cost at scale | Per-read/write (unpredictable) | Compute + storage (predictable) |
| Data export | Manual (JSON) | ✅ `pg_dump`, direct SQL access |
| Complex aggregations | ❌ Client-side only | ✅ Server-side SQL |

**Verdict:** For a serious financial app with multi-user access, server-side calculations, or complex reporting, **Supabase/PostgreSQL is the better foundation** — ACID transactions and SQL aggregations are hard to live without. App X gets away with Firebase because its cloud layer is just a backup bucket, not the computational brain.

### 6.3 FinTrack Pro: localStorage-first + Background Supabase Sync

FinTrack Pro already has the right primitives (IndexedDB cache via `idb`, offline queue, service worker with background sync). The missing piece is making the **cache the first paint source** rather than a fallback.

**Recommended architecture:**

```
App mounts → load from IndexedDB → render instantly (zero network)
           ↕ (background: fetch from Supabase API → update IndexedDB → re-render)
           ↕ (offline: queue writes, show cached data, flush on reconnect)
```

**Key differences from App X's approach:**

| Aspect | App X (do NOT copy) | FinTrack Pro (recommended) |
|--------|---------------------|---------------------------|
| Source of truth | localStorage | Supabase (PostgreSQL) |
| Cache medium | localStorage (synchronous, 5-10MB limit) | IndexedDB (async, large storage) |
| Sync direction | Manual push/pull (user clicks) | Automatic background refresh |
| Multi-device | ❌ Not supported | ✅ Family members share data |
| Data integrity | App-level (no transactions) | ACID transactions in Postgres |

**Implementation steps:**

1. **Return cached data before network** — in every `useAccounts`, `useTransactions` etc. hook, read from IndexedDB first, then fetch from API in background
2. **Update cache after every successful write** — after any POST/PUT/DELETE to Supabase, write the result to IndexedDB immediately
3. **Increase IndexedDB TTL** — from 5 min to session-long (or until user explicitly refreshes)
4. **Remove polling** — replace the 30-second interval with cache-first + background refresh after mutations
5. **Add "Last synced" indicator** — show a small timestamp so users trust the cached data

**Do NOT make Supabase a "backup" like App X does with Firebase** — that would break multi-device sync for family members. Instead, treat it as **source of truth that you cache aggressively**. Users get instant load (IndexedDB) with the guarantee that data converges across devices (Supabase).

### 6.4 Typical Hook Pattern for FinTrack Pro

```tsx
function useAccounts() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isStale, setIsStale] = useState(true);

  useEffect(() => {
    let cancelled = false;

    // Step 1: Render from cache instantly
    cacheService.getAccounts().then((cached) => {
      if (!cancelled && cached) setAccounts(cached);
    });

    // Step 2: Fetch fresh data in background
    apiFetch('/api/accounts')
      .then(async (fresh) => {
        await cacheService.setAccounts(fresh);
        if (!cancelled) {
          setAccounts(fresh);
          setIsStale(false);
        }
      })
      .catch(() => setIsStale(false)); // Stay on cached data

    return () => { cancelled = true; };
  }, []);

  return { accounts, isStale };
}
```

### 6.5 What Not to Do

- ❌ **Don't block rendering** on API response — always show cached data first
- ❌ **Don't use localStorage** for complex data in a multi-user app (5-10MB limit, synchronous, no indexing)
- ❌ **Don't poll on a timer** — only re-fetch after user actions or on explicit refresh
- ❌ **Don't treat cloud as optional backup** in a multi-device app — it's the source of truth, cache is for speed

---

## 7. Animation: Why App X Is Smooth & FinTrack Pro Is Choppy

### 7.1 The Root Cause

FinTrack Pro uses **`motion` (framer-motion) JS animations** on 47 elements across 27 files. App X uses **zero JS animation libraries** — everything is pure CSS.

| Aspect | App X ✅ Smooth | FinTrack Pro ❌ Choppy |
|--------|-----------------|----------------------|
| Animation engine | Pure CSS (GPU-composited) | `motion` JS library (main thread) |
| Number of animated elements | ~12 CSS classes | 47+ JS-animated elements |
| GPU acceleration | `will-change: opacity, transform` + `translate3d(0,0,0)` | **None** — no will-change anywhere |
| Page transitions | View Transitions API (native browser) | AnimatePresence `mode="wait"` (JS-driven) |
| Duration | 420-960ms (leisurely, perceptible) | 150-200ms (rushed, feels stuttery) |
| Easing | Custom `cubic-bezier(0.22, 1, 0.36, 1)` | Default / `easeInOut` (mechanical) |
| List entrance | CSS stagger with 40ms delay increments | No stagger (all items fade at once) |
| Modal open/close | `useAnimatedOpen` hook (RAF-deferred) | motion.div with AnimatePresence |
| prefers-reduced-motion | ✅ Fully respected | ❌ Not handled |
| Skeleton loading | Shimmer + RAF two-phase reveal | Spinner only (no skeleton) |

### 7.2 The #1 Problem: JS-Driven Animations on Main Thread

Every `<motion.div>` in FinTrack Pro creates a JavaScript animation loop that runs on the **main thread**. When React is reconciling state changes, processing API responses, or computing derived data, these JS animations **compete for the same thread** — causing dropped frames.

App X's CSS animations run on the **GPU compositor thread**, which is completely independent of the main thread. React can be doing heavy work and the animations keep running at 60fps.

```tsx
// ❌ FinTrack Pro — JS-driven, main thread
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: -20 }}
  transition={{ duration: 0.2 }}
/>

// ✅ App X — CSS-driven, GPU compositor thread
<div className="app-section" />
/* CSS:
.app-section {
  animation: section-rise 0.72s var(--app-motion-ease) both;
}
@keyframes section-rise {
  from { opacity: 0; transform: translate3d(0, 22px, 0) scale(0.985); }
  to   { opacity: 1; transform: translate3d(0, 0, 0) scale(1); }
}
*/
```

### 7.3 The #2 Problem: No GPU Acceleration Hints

FinTrack Pro has **zero** `will-change`, `translate3d`, or GPU acceleration hints anywhere.

Without `will-change`, the browser treats animated elements as normal content — it repaints them on every frame. With `will-change: opacity, transform`, the browser **promotes the element to its own compositor layer** — painting happens once, then the GPU just moves pixels around.

```css
/* Add this to every animated element in FinTrack Pro */
will-change: opacity, transform;
transform: translate3d(0, 0, 0);
```

### 7.4 The #3 Problem: Animations Are Too Short

FinTrack Pro uses `duration: 0.2` (200ms) everywhere. At 200ms, the animation finishes **before the human eye can register smooth motion** — it feels like a stutter or flicker.

App X's page transitions are 620ms, section entrances are 720ms, stagger items are 700ms. These durations let the eye follow the motion naturally, creating a perception of smoothness.

| Animation type | App X | FinTrack Pro | Fix |
|---------------|--------|-------------|-----|
| Page enter | 620ms | 200ms | → 400-500ms |
| Section enter | 720ms | — | → 400-500ms |
| Modal enter | 420ms | 200ms | → 300-400ms |
| List item stagger | 700ms + 40ms delay | 200ms (no stagger) | → 400ms + stagger |
| Modal backdrop | 280ms | 150ms | → 250-300ms |

### 7.5 The #4 Problem: Easing Makes It Feel Mechanical

FinTrack Pro uses `easeInOut` (default) or `easeOut`. These are mathematical curves that feel robotic.

App X uses **custom cubic-bezier** curves designed to feel natural:
```css
--app-motion-ease: cubic-bezier(0.22, 1, 0.36, 1);   /* Custom ease-out */
--app-motion-soft: cubic-bezier(0.16, 1, 0.3, 1);    /* Softer ease-out */
```

These curves have a **slow start and a long tail** — mimics real-world physics (objects don't stop instantly).

### 7.6 The #5 Problem: No Stagger, No Skeleton, No RAF

- **No stagger** — 47 elements appear simultaneously, creating a wall of motion
- **No skeleton loading** — just a spinner; the user sees nothing then everything pops in
- **No `requestAnimationFrame`** — scroll-based animations (nav hide/show) use event listeners directly instead of RAF-throttling

### 7.7 Fix Plan for FinTrack Pro

| Step | What | Where | Effort |
|------|------|-------|--------|
| 1 | **Replace AnimatePresence with CSS animations** for page transitions | `App.tsx:224-228` | 1h |
| 2 | **Add `will-change: transform, opacity`** to every `<motion.div>` | All 27 files | 30min |
| 3 | **Replace `type:'tween'` with `type:'spring'`** or CSS equivalents | All 47 motion elements | 2h |
| 4 | **Increase durations** (200ms → 350-500ms) | All transition configs | 30min |
| 5 | **Replace `easeInOut` with custom cubic-bezier** `(0.22, 1, 0.36, 1)` | Global constant | 15min |
| 6 | **Add CSS staggered list animations** (`.app-stagger-grid` pattern) | Ledger, AccountManager, GroupManager | 1h |
| 7 | **Add skeleton loading** with RAF two-phase reveal | Dashboard, Ledger | 2h |
| 8 | **Add View Transitions API** with CSS fallback | App.tsx navigation handler | 1h |
| 9 | **Add `@media (prefers-reduced-motion: reduce)`** to disable all animations | Global CSS | 15min |
| 10 | **Remove `motion` dependency entirely** (optional, advanced) | All 27 files | 4h |
| **Total** | | | **~8h** |

### 7.8 The Ideal: Drop motion Entirely

The cleanest fix is to **remove `motion` (framer-music) from FinTrack Pro entirely** and replace all JS animations with pure CSS:

- **Page transitions** → View Transitions API + CSS fallback
- **Modal enter/exit** → `useAnimatedOpen` hook + CSS keyframes
- **List enter/exit** → CSS stagger classes
- **Layout animations** → CSS transitions (already have these)
- **Hover effects** → CSS (already have these)

The `motion` library adds ~30KB to the bundle and runs all animations on the main thread. CSS animations are free (no bundle cost), run on the GPU compositor thread, and don't jank during React renders.

**Minimum viable fix (1 day):** Keep `motion` but add `will-change` to all animated elements, increase durations, fix easing, add skeleton loaders, and respect `prefers-reduced-motion`. This solves 80% of the perceived choppiness without a rewrite.

---

## 8. Responsiveness: Beyond Animations

Animations alone don't make an app feel responsive. The following patterns from App X are **completely missing from FinTrack Pro** and directly impact how "snappy" the app feels to touch and use.

### 8.1 Touch & Mobile

| Pattern | App X | FinTrack Pro | Severity |
|---------|--------|-------------|----------|
| `touch-action: manipulation` on all interactive elements (eliminates 300ms tap delay) | ✅ | ❌ Not on any element | **HIGH** |
| `overscroll-behavior: none` on main container (prevents pull-to-refresh) | ✅ App.tsx:1328-1329 | ❌ Not set | **HIGH** |
| `overscroll-behavior: contain` on modals (prevents background scroll) | ✅ | ❌ All 5 modals | **HIGH** |
| `safe-area-inset-bottom` on bottom-fixed elements | ✅ AppNavigation.tsx:237 | ❌ Missing | **MEDIUM** |
| `passive: true` on scroll/touch event listeners | ✅ All listeners | ❌ No passive flag | **HIGH** |
| `requestAnimationFrame` throttle on scroll handlers | ✅ AppNavigation.tsx:133 | ❌ No throttle | **MEDIUM** |
| Pull-to-refresh prevention via touch event handlers | ✅ App.tsx:1310-1326 | ❌ Not implemented | **HIGH** |

**Fix:** Add to FinTrack Pro's `index.css`:
```css
* { touch-action: manipulation; }
html, body { overscroll-behavior: none; }
```

Add passive flag to all scroll listeners:
```tsx
// ❌ Current
window.addEventListener('scroll', handler, true);
// ✅ Fix
window.addEventListener('scroll', handler, { passive: true, capture: true });
```

### 8.2 Form Interaction Feedback

| Pattern | App X | FinTrack Pro | Severity |
|---------|--------|-------------|----------|
| `active:scale-[0.97]` on all clickables (tactile press feedback) | ✅ 11+ elements | ❌ Zero elements | **MEDIUM** |
| `focus-visible:ring` on custom buttons for keyboard users | ✅ | ❌ Missing on toggle/FAB/Select | **HIGH** |
| Loading spinner inside button during async | ✅ Text + disabled | ✅ Some, inconsistent | **LOW** |
| `disabled:cursor-not-allowed` | ✅ | ❌ Missing | **LOW** |

**Fix:** Add to every interactive element in FinTrack Pro:
```tsx
// Every button / card / clickable element
className={`... active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-primary ...`}
```

### 8.3 Layout Stability (CLS Prevention)

| Pattern | App X | FinTrack Pro | Severity |
|---------|--------|-------------|----------|
| `min-h-screen min-h-dvh` on all page wrappers | ✅ Every page | ✅ App.tsx | OK |
| Skeleton placeholders with `min-height` | ✅ SkeletonLoader.tsx | ❌ Spinner only (no reserved space) | **HIGH** |
| `content-visibility: auto` on offscreen sections | ❌ Not used | ❌ Not used | LOW |
| `aspect-ratio` on images/cards | ❌ Not used | ❌ Not used | LOW |
| `contain: layout style` on animated elements | ❌ Not used | ❌ Not used (would help motion elements) | **MEDIUM** |

**Fix:** Add skeleton loading with `min-height` placeholders in FinTrack Pro:
```tsx
// Instead of just showing a spinner:
<div style={{ minHeight: '200px' }}>
  {loading ? <SkeletonPlaceholder /> : <ActualContent />}
</div>
```

### 8.4 Modal / Overlay Focus Management

| Pattern | App X | FinTrack Pro | Severity |
|---------|--------|-------------|----------|
| `document.body.style.overflow = 'hidden'` when modal open | ✅ App.tsx:1288-1297 | ❌ All modals | **HIGH** |
| Escape key to close | ✅ PINManagement.tsx | ❌ All modals | **HIGH** |
| Focus trapping inside modal | ❌ Not implemented | ❌ Not implemented | **MEDIUM** |
| `aria-modal="true"`, `role="dialog"` | ❌ Not implemented | ❌ Not implemented | **HIGH** (a11y) |

**Fix for every modal in FinTrack Pro:**
```tsx
useEffect(() => {
  document.body.style.overflow = 'hidden';
  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onCancel();
  };
  window.addEventListener('keydown', handleKey);
  return () => {
    document.body.style.overflow = '';
    window.removeEventListener('keydown', handleKey);
  };
}, [onCancel]);
```

### 8.5 Font Loading Performance

| Pattern | App X | FinTrack Pro | Severity |
|---------|--------|-------------|----------|
| `display=swap` on Google Fonts URL | ✅ | ✅ | OK |
| `<link rel="preconnect">` to Google Fonts origins | ❌ | ❌ Not in index.html | **HIGH** |
| `<link rel="preload">` for font files | ❌ | ❌ Not in index.html | **MEDIUM** |

**Fix:** Add to FinTrack Pro's `index.html` `<head>`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="preload" as="style" href="https://fonts.googleapis.com/css2?family=Inter:...&display=swap" />
```

### 8.6 Keyboard Accessibility

| Pattern | App X | FinTrack Pro | Severity |
|---------|--------|-------------|----------|
| `aria-current="page"` on active nav | ✅ | ❌ Sidebar nav | **MEDIUM** |
| `aria-pressed` on toggle buttons | ✅ | ❌ Dashboard grid/list toggle | **MEDIUM** |
| `onKeyDown` (Enter/Space) on custom interactive elements | ✅ TransactionTable.tsx | ❌ Select/DatePicker/DebitCreditToggle | **HIGH** |
| `tabIndex` on clickable table rows | ✅ TransactionTable.tsx:137 | ❌ Ledger.tsx table rows | **MEDIUM** |
| `aria-label` on icon-only buttons | ✅ App.tsx, AppNavigation.tsx | ❌ FAB, sidebar icons | **MEDIUM** |
| `aria-hidden="true"` on decorative SVGs | ✅ | ❌ Logos, some icons | **MEDIUM** |

### 8.7 Window Event Listeners

| Pattern | App X | FinTrack Pro | Severity |
|---------|--------|-------------|----------|
| Scroll listener uses `{ passive: true }` | ✅ AppNavigation.tsx:136 | ❌ Select.tsx:44 | **HIGH** |
| Resize listener throttled | ❌ Not used | ❌ Select.tsx:45 | **MEDIUM** |
| Event cleanup in useEffect return | ✅ All listeners | ✅ Most listeners | OK |

### 8.8 Priority Fix Plan for FinTrack Pro

| Priority | Fix | Effort | Impact on Responsiveness |
|----------|-----|--------|-------------------------|
| 🔴 P0 | Add `touch-action: manipulation` + `overscroll-behavior: none` globally in CSS | 5 min | Stops pull-to-refresh, removes tap delay |
| 🔴 P0 | Make all scroll/touch listeners passive | 15 min | Eliminates scroll jank on mobile |
| 🔴 P0 | Add `body overflow: hidden` + Escape key to all modals | 1h | Stops background scroll, enables keyboard close |
| 🔴 P0 | Add `<link rel="preconnect">` for Google Fonts | 5 min | Saves 1 DNS lookup on page load |
| 🟡 P1 | Add `active:scale-[0.97]` to all buttons + clickable cards | 30 min | Tactile press feedback — feels snappier |
| 🟡 P1 | Add skeleton loading with `min-height` placeholders | 2h | Eliminates content pop-in / layout shift |
| 🟡 P1 | Add `focus-visible:ring` + `aria-*` to all interactive elements | 2h | Keyboard users get focus feedback |
| 🟡 P1 | Add `content-visibility: auto` to lazy-loaded route sections | 30 min | Browser skips offscreen rendering work |
| 🟢 P2 | Add `overscroll-behavior: contain` to all scrollable containers | 30 min | Prevents scroll chain to parent |
| 🟢 P2 | Throttle scroll/resize handlers with `requestAnimationFrame` | 30 min | Reduces layout thrashing |
| 🟢 P2 | Add `safe-area-inset-bottom` to bottom-fixed elements | 15 min | Proper spacing on notched phones |
| 🟢 P2 | Add `contain: layout style` to motion.div animated elements | 30 min | Reduces paint area during animations |
| **Total** | | **~8h** | |
