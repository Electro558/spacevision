# Landing Page Animation Overhaul — Design Spec

**Date:** 2026-04-14
**Scope:** Landing page (`src/app/page.tsx`) + shared components (Navbar, Footer)
**Style:** Sleek SaaS with dynamic energy throughout — every section has its own animation signature
**Stack:** Framer Motion (already installed v12.36), Tailwind CSS, CSS keyframes

---

## 1. Goals

- Transform the landing page from static content blocks into a fluid, animated experience
- Every section should reveal dynamically on scroll with its own character
- Add interactive hover effects (tilt, glow, magnetic) that feel premium
- Add ambient motion (floating icons, gradient shifts) for visual life
- Maintain performance — lazy-load heavy animations, use `will-change` hints, respect `prefers-reduced-motion`

## 2. Architecture

### 2.1 New Files

| File | Purpose |
|------|---------|
| `src/components/animations/ScrollReveal.tsx` | Reusable scroll-triggered fade/slide wrapper using Framer Motion `whileInView` |
| `src/components/animations/StaggerContainer.tsx` | Container that staggers children entrance with configurable delay |
| `src/components/animations/TypewriterText.tsx` | Typewriter effect component — types out text segments with inline styling |
| `src/components/animations/AnimatedCounter.tsx` | Number counter that counts up when scrolled into view |
| `src/components/animations/TiltCard.tsx` | Card wrapper with 3D perspective tilt on mouse move |
| `src/components/animations/MagneticButton.tsx` | Button that subtly follows cursor when nearby |
| `src/components/animations/GradientText.tsx` | Text with animated gradient shimmer sliding across |
| `src/components/animations/ScrollProgress.tsx` | Thin progress bar at top of viewport showing scroll position |
| `src/components/animations/CursorGlow.tsx` | Radial gradient that follows cursor within a container |
| `src/app/globals.css` (additions) | New keyframe animations, utility classes |

### 2.2 Modified Files

| File | Changes |
|------|---------|
| `src/app/page.tsx` | Wrap sections in animation components, restructure hero |
| `src/components/Navbar.tsx` | Remove existing static `bg-surface-dark/90 backdrop-blur-xl border-b border-surface-border` styles from nav element. Replace with scroll-conditional classes: transparent when scrollY < 50, blurred/opaque when scrollY >= 50. |
| `src/components/Footer.tsx` | Wrap in ScrollReveal for fade-up entrance |
| `src/app/layout.tsx` | Import `ScrollProgress` as a client component island (not converting layout to client). Add `<ScrollProgress />` inside the body before other content. |
| `src/app/globals.css` | Add keyframes: shimmer, float, pulse-glow, gradient-shift. Add `scroll-behavior: smooth` scoped to landing page only via `.landing-page` class selector. |

## 3. Section-by-Section Spec

### 3.1 Hero Section

**Animations:**
- **Typewriter headline:** Uses `TypewriterText` with a `segments` prop (see Section 6). Segments: `[{ text: "From description", className: "" }, { text: "\n" }, { text: "to 3D model", className: "text-brand" }]` — typed over ~2s. The second line " — instantly." fades in after typing completes with `motion.span` and `opacity: 0 → 1`.
- **Subtitle fade-up:** Description paragraph fades up with 0.5s delay after headline finishes.
- **CTA stagger:** Two buttons stagger in (100ms apart) with `y: 20 → 0` and `opacity: 0 → 1`.
- **Badge pills:** "Free forever", "STL export", "Manual editing" pop in one-by-one with spring physics (`type: "spring", stiffness: 300, damping: 20`).
- **Gradient pulse:** Hero background gradient subtly shifts hue via CSS keyframe (`gradient-shift`, 8s infinite).
- **CTA glow:** Primary button has a `box-shadow` animation that breathes (`pulse-glow`, 3s infinite). On click, a JS-triggered CSS ripple: onClick handler sets `--ripple-x` and `--ripple-y` CSS custom properties on the button, which position a `::after` pseudo-element that scales from 0 to 4 and fades out over 0.4s.
- **Cursor glow:** `CursorGlow` renders a 200px radial gradient that follows `mousemove` within its parent container, using `requestAnimationFrame` for smooth tracking.
- **3D scene parallax:** The existing `Scene3D` component gets a subtle `translateY` offset based on scroll position (CSS `transform` driven by scroll listener, throttled).

### 3.2 Features Grid (6 cards)

**Animations:**
- **Staggered scroll-in:** Wrap grid in `StaggerContainer` with `staggerChildren: 0.08`. Each child is automatically wrapped in a `motion.div` with stagger variants (see Section 6 StaggerContainer API).
- **3D tilt hover:** Wrap each card in `TiltCard` — on `mousemove`, calculate rotation from cursor position relative to card center. Max tilt: 8deg. Uses `perspective: 1000px` and `transform: rotateX/rotateY`. Hover effects are no-op on touch devices (`@media (hover: hover)` guard).
- **Glow border:** On hover, card border transitions to `rgba(99, 102, 241, 0.4)` with `box-shadow: 0 0 20px rgba(99, 102, 241, 0.15)`. Transition: 0.3s ease.
- **Icon float:** Each feature icon has a CSS `float` animation — `translateY(0) → translateY(-4px) → translateY(0)` over 3s, with each icon offset by `animation-delay` to prevent sync.

### 3.3 Beneficiaries Section (4 audience cards)

**Animations:**
- **Alternating slide-in:** Odd cards slide in from left (`x: -60 → 0`), even from right (`x: 60 → 0`). All use `ScrollReveal` with `whileInView`.
- **Animated counters:** Add a hardcoded stats row between the section heading and the cards. Three stats: "10K+" (label: "Models Created"), "50+" (label: "Countries"), "4.9" (label: "User Rating"). Horizontal flex layout, centered, with `AnimatedCounter` for each number. Values are hardcoded marketing numbers.
- **Hover lift:** Cards translate `y: -6px` with `box-shadow` deepening on hover. Transition: 0.25s ease.

### 3.4 Live Demo Section

**Animations:**
- **Section reveal:** Entire demo block fades up via `ScrollReveal`.
- **Magnetic button:** `MagneticButton` wraps the Generate button. On `mousemove` within 100px radius, button shifts up to 4px toward cursor. Springs back on `mouseleave`.
- **Suggestion pills:** Example prompts use spring entrance — `scale: 0.8 → 1`, `opacity: 0 → 1` with `type: "spring"` and 80ms stagger.
- **Input focus glow:** Text input gets an animated `box-shadow` on focus — indigo glow that expands via CSS transition.
- **Skeleton shimmer:** Loading state uses a CSS shimmer animation (`shimmer` keyframe — linear gradient sliding left-to-right over 1.5s infinite).

### 3.5 Pricing Section

**Animations:**
- **Scale-in on scroll:** Cards use `ScrollReveal` with `scale: 0.92 → 1`, `opacity: 0 → 1`, staggered 100ms.
- **Popular badge pulse:** "Popular" badge has a `pulse-glow` animation — `box-shadow` breathing between small and large indigo glow, 2s infinite.
- **Feature list stagger:** Individual feature items within each card stagger in with `y: 10 → 0`, 50ms delay between items, triggered by card entering viewport.
- **CTA ripple:** On click, JS onClick handler sets `--ripple-x` and `--ripple-y` CSS custom properties on the button, positioning a `::after` pseudo-element that scales from 0 to 4 and fades out over 0.4s via the `ripple` keyframe.

### 3.6 Final CTA Section

**Animations:**
- **Gradient text shimmer:** Headline uses `GradientText` — `background-size: 200%` with `background-position` animated left-to-right over 3s infinite. Colors: indigo → purple → indigo.
- **Button breathing glow:** Same `pulse-glow` as hero CTA.
- **Section reveal:** Fade-up on scroll.

### 3.7 Footer

**Animations:**
- **Fade-up group:** Entire footer wrapped in `ScrollReveal` with `y: 30 → 0`. Column groups stagger with 100ms delay.

## 4. Global / Shared Animations

### 4.1 Navbar Scroll Effect
- **Remove** existing static styles: `bg-surface-dark/90 backdrop-blur-xl border-b border-surface-border` from the `<nav>` element.
- Add a `useScrolled` state using `useEffect` with a `scroll` listener (throttled via `requestAnimationFrame`).
- Below 50px scroll: transparent background, no border, no blur.
- Above 50px scroll: `backdrop-filter: blur(12px)`, `background: rgba(15, 15, 36, 0.8)`, `border-bottom: 1px solid rgba(99, 102, 241, 0.1)` — all with 0.3s CSS transition.
- Classes are toggled conditionally based on `isScrolled` state.

### 4.2 Scroll Progress Bar
- `ScrollProgress` is a `"use client"` component imported into `layout.tsx` as a client island (layout.tsx remains a Server Component).
- Fixed `top: 0`, `height: 2px`, `z-index: 9999`.
- Width = `(scrollY / (documentHeight - viewportHeight)) * 100%`.
- Background: `linear-gradient(90deg, #4f46e5, #a855f7)`.
- Updated via `scroll` listener with `requestAnimationFrame`.

### 4.3 Smooth Scroll
- Add `scroll-behavior: smooth` scoped to `.landing-page` class on the landing page's root element — NOT applied globally to `html` to avoid interfering with programmatic scrolling in other pages (CAD workspace, etc.).

## 5. New CSS Keyframes (globals.css)

```css
@keyframes shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-4px); }
}

@keyframes pulse-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(99, 102, 241, 0.3); }
  50% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.5), 0 0 40px rgba(99, 102, 241, 0.15); }
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes gradient-text {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

@keyframes ripple {
  0% { transform: scale(0); opacity: 0.5; }
  100% { transform: scale(4); opacity: 0; }
}
```

## 6. Reusable Component APIs

### ScrollReveal
```tsx
<ScrollReveal direction="up" delay={0.2} duration={0.6}>
  <div>Content that reveals on scroll</div>
</ScrollReveal>
```
Props: `direction` ("up"|"down"|"left"|"right"), `delay` (seconds), `duration` (seconds), `once` (default true), `scale` (optional initial scale, e.g. 0.92), `className` (optional).

Uses Framer Motion `useReducedMotion()` hook — if reduced motion preferred, renders children immediately with no animation.

### StaggerContainer
```tsx
<StaggerContainer stagger={0.08} direction="up">
  <div>Child 1</div>
  <div>Child 2</div>
</StaggerContainer>
```
Props: `stagger` (seconds between children), `direction` ("up"|"down"|"left"|"right"), `className` (optional).

**Implementation:** Uses `React.Children.map` to automatically wrap each child in a `motion.div` with child variants. The container is a `motion.div` with parent variants containing `staggerChildren`. Consumers pass plain `<div>` children — the wrapping is automatic.

### TypewriterText
```tsx
<TypewriterText
  segments={[
    { text: "From description", className: "" },
    { text: "\n" },
    { text: "to 3D model", className: "text-brand" },
  ]}
  speed={50}
  delay={500}
  onComplete={() => {}}
/>
```
Props: `segments` (array of `{ text: string, className?: string }`), `speed` (ms per character), `delay` (ms before starting), `onComplete` (callback when finished).

**Accessibility:** Full text is rendered in the DOM immediately with `aria-label` on the container. The visual typewriter effect is decorative — a hidden `<span>` contains the complete text for screen readers, while the visible text is progressively revealed with `overflow: hidden` and width animation.

### AnimatedCounter
```tsx
<AnimatedCounter end={10000} suffix="+" duration={2} />
```
Props: `end` (target number), `suffix` (string appended after number), `duration` (seconds), `prefix` (optional string before number).

Counts from 0 to `end` using easeOut interpolation. Triggered when scrolled into view via `useInView`. Uses `useReducedMotion` — if true, shows final number immediately.

### TiltCard
```tsx
<TiltCard maxTilt={8}>
  <div>Card content</div>
</TiltCard>
```
Props: `maxTilt` (degrees, default 8), `className` (optional).

Wraps content in a `div` with `perspective: 1000px`. On `mousemove` (guarded by `@media (hover: hover)` — no-op on touch), calculates cursor position relative to card center and applies `rotateX`/`rotateY` transforms. On `mouseleave`, springs back to `rotateX(0) rotateY(0)` with 0.3s transition.

### MagneticButton
```tsx
<MagneticButton strength={4} radius={100}>
  <button>Generate</button>
</MagneticButton>
```
Props: `strength` (max pixel displacement), `radius` (activation distance in px), `children`.

On `mousemove` within `radius` pixels of center, translates child by up to `strength` pixels toward cursor. On `mouseleave`, springs back to origin with `transition: transform 0.3s ease`.

### GradientText
```tsx
<GradientText colors={["#6366f1", "#a855f7", "#6366f1"]} speed={3}>
  Headline text
</GradientText>
```
Props: `colors` (array of CSS color strings), `speed` (seconds for one cycle), `children` (text content), `as` (element type, default "span").

Renders text with `background: linear-gradient(...)`, `background-clip: text`, `color: transparent`, `background-size: 200%`, animated via `gradient-text` keyframe.

### ScrollProgress
```tsx
<ScrollProgress color="linear-gradient(90deg, #4f46e5, #a855f7)" height={2} />
```
Props: `color` (CSS background value), `height` (px, default 2), `zIndex` (default 9999).

`"use client"` component. Fixed positioning at viewport top. Width computed from scroll ratio. Uses `requestAnimationFrame`-throttled scroll listener. Cleans up listener on unmount.

### CursorGlow
```tsx
<CursorGlow size={200} color="rgba(99, 102, 241, 0.08)" />
```
Props: `size` (diameter in px), `color` (CSS color for radial gradient), `className` (optional).

Renders as `position: absolute; pointer-events: none` within its parent (parent must be `position: relative`). Tracks `mousemove` events on the parent element using `requestAnimationFrame` throttling. Sets `transform: translate(x, y)` on a `div` with `radial-gradient` background. Cleans up listeners on unmount.

## 7. Performance Considerations

- All scroll listeners use `requestAnimationFrame` throttling
- `whileInView` animations use `once: true` to fire only once
- `will-change: transform` applied via Framer Motion's built-in handling (it adds/removes `will-change` automatically around animations)
- `TiltCard` mousemove is guarded by `@media (hover: hover)` — no listeners on touch devices
- `CursorGlow` attaches to parent element only, destroys listener on unmount
- `CursorGlow` is lazily mounted — only rendered on desktop via `@media (hover: hover)` check
- All animation components use Framer Motion's `useReducedMotion()` hook to check `prefers-reduced-motion` and fall back to instant rendering
- 3D scene parallax uses CSS transforms only (GPU-accelerated), no React re-renders

## 8. Accessibility

- All animation components use Framer Motion's `useReducedMotion()` hook. When reduced motion is preferred, all motion is disabled — content renders in its final state immediately.
- `TypewriterText` renders full text in DOM immediately via `aria-label` for screen readers (visual effect is decorative only).
- No content is hidden behind animations — everything is visible in the DOM from page load.
- Focus states remain visible and unaffected by hover animations.
- Hover-dependent effects (TiltCard, MagneticButton, CursorGlow) use `@media (hover: hover)` guards and degrade gracefully on touch devices.

## 9. Testing

- Testing is deferred for this phase. Animation components are visual-only wrappers with no business logic. Visual verification will be done manually in the browser during implementation.
- Future: consider Storybook stories for each animation component to enable visual regression testing.

## 10. Out of Scope

- Other pages (Dashboard, Gallery, Pricing standalone, etc.) — will adopt the same component library later
- CAD workspace animations — already handled separately
- Mobile-specific animation variants — animations work on mobile via scroll, hover effects gracefully degrade to no-op on touch
- Bundle size optimization / lazy loading of animation components — all are small (<2KB each) and co-located with the landing page bundle
