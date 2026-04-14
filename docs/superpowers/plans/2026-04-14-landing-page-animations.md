# Landing Page Animation Overhaul — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the SpaceVision landing page from static content blocks into a fluid, animated experience with scroll reveals, interactive hovers, typewriter text, animated counters, and ambient motion.

**Architecture:** 9 new reusable animation wrapper components in `src/components/animations/`, CSS keyframes in `globals.css`, then integrate into `page.tsx`, `Navbar.tsx`, `Footer.tsx`, and `layout.tsx`. All components use Framer Motion's `useReducedMotion()` for accessibility.

**Tech Stack:** Framer Motion v12.36 (installed), Tailwind CSS v3.4, CSS keyframes, React 19

**Spec:** `docs/superpowers/specs/2026-04-14-landing-page-animations-design.md`

---

## Chunk 1: CSS Keyframes + Foundation Components

### Task 1: Add CSS keyframes and utility classes to globals.css

**Files:**
- Modify: `src/app/globals.css` (append after line 294)

- [ ] **Step 1: Add keyframes and landing-page class**

Append to end of `src/app/globals.css`:

```css
/* ── Landing Page Animations ── */

.landing-page {
  scroll-behavior: smooth;
}

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

/* Ripple button base */
.btn-ripple {
  position: relative;
  overflow: hidden;
}
.btn-ripple::after {
  content: '';
  position: absolute;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.3);
  left: var(--ripple-x, 50%);
  top: var(--ripple-y, 50%);
  transform: translate(-50%, -50%) scale(0);
  pointer-events: none;
}
.btn-ripple.rippling::after {
  animation: ripple 0.4s ease-out forwards;
}

/* Float animation utility */
.animate-float {
  animation: float 3s ease-in-out infinite;
}

/* Pulse glow utility */
.animate-pulse-glow {
  animation: pulse-glow 3s ease-in-out infinite;
}

/* Gradient shift background */
.animate-gradient-shift {
  background-size: 200% 200%;
  animation: gradient-shift 8s ease-in-out infinite;
}

/* Shimmer skeleton */
.animate-shimmer {
  background: linear-gradient(90deg, rgba(99,102,241,0.05) 25%, rgba(99,102,241,0.1) 50%, rgba(99,102,241,0.05) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s linear infinite;
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: `✓ Generating static pages` — no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "style: add landing page animation keyframes and utility classes"
```

---

### Task 2: Create ScrollReveal component

**Files:**
- Create: `src/components/animations/ScrollReveal.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface ScrollRevealProps {
  children: ReactNode;
  direction?: "up" | "down" | "left" | "right";
  delay?: number;
  duration?: number;
  once?: boolean;
  scale?: number;
  className?: string;
}

const directionOffset = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 60 },
  right: { x: -60 },
};

export function ScrollReveal({
  children,
  direction = "up",
  delay = 0,
  duration = 0.6,
  once = true,
  scale,
  className,
}: ScrollRevealProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset = directionOffset[direction];

  return (
    <motion.div
      initial={{ opacity: 0, ...offset, ...(scale ? { scale } : {}) }}
      whileInView={{ opacity: 1, x: 0, y: 0, scale: 1 }}
      viewport={{ once, margin: "-100px" }}
      transition={{ duration, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/animations/ScrollReveal.tsx
git commit -m "feat: add ScrollReveal animation component"
```

---

### Task 3: Create StaggerContainer component

**Files:**
- Create: `src/components/animations/StaggerContainer.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { type ReactNode, Children } from "react";
import { motion, useReducedMotion } from "framer-motion";

interface StaggerContainerProps {
  children: ReactNode;
  stagger?: number;
  direction?: "up" | "down" | "left" | "right";
  className?: string;
}

const directionOffset = {
  up: { y: 40 },
  down: { y: -40 },
  left: { x: 60 },
  right: { x: -60 },
};

export function StaggerContainer({
  children,
  stagger = 0.08,
  direction = "up",
  className,
}: StaggerContainerProps) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset = directionOffset[direction];

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: stagger,
      },
    },
  };

  const childVariants = {
    hidden: { opacity: 0, ...offset },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-100px" }}
      className={className}
    >
      {Children.map(children, (child, i) => (
        <motion.div key={i} variants={childVariants}>
          {child}
        </motion.div>
      ))}
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/animations/StaggerContainer.tsx
git commit -m "feat: add StaggerContainer animation component"
```

---

### Task 4: Create TypewriterText component

**Files:**
- Create: `src/components/animations/TypewriterText.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useState, useEffect } from "react";
import { useReducedMotion } from "framer-motion";

interface TextSegment {
  text: string;
  className?: string;
}

interface TypewriterTextProps {
  segments: TextSegment[];
  speed?: number;
  delay?: number;
  onComplete?: () => void;
  className?: string;
}

export function TypewriterText({
  segments,
  speed = 50,
  delay = 500,
  onComplete,
  className,
}: TypewriterTextProps) {
  const shouldReduceMotion = useReducedMotion();
  const fullText = segments.map((s) => s.text).join("");
  const [charCount, setCharCount] = useState(shouldReduceMotion ? fullText.length : 0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) {
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => setStarted(true), delay);
    return () => clearTimeout(timer);
  }, [delay, shouldReduceMotion, onComplete]);

  useEffect(() => {
    if (!started || shouldReduceMotion) return;
    if (charCount >= fullText.length) {
      onComplete?.();
      return;
    }
    const timer = setTimeout(() => setCharCount((c) => c + 1), speed);
    return () => clearTimeout(timer);
  }, [started, charCount, fullText.length, speed, shouldReduceMotion, onComplete]);

  // Build visible text from segments
  let remaining = charCount;
  const rendered = segments.map((segment, i) => {
    if (remaining <= 0) return null;
    const visibleLen = Math.min(remaining, segment.text.length);
    remaining -= segment.text.length;
    const visibleText = segment.text.slice(0, visibleLen);

    if (segment.text === "\n") {
      return visibleLen > 0 ? <br key={i} /> : null;
    }

    return (
      <span key={i} className={segment.className}>
        {visibleText}
      </span>
    );
  });

  return (
    <span className={className} aria-label={fullText}>
      {rendered}
      {charCount < fullText.length && (
        <span className="inline-block w-[2px] h-[1em] bg-indigo-400 ml-0.5 animate-pulse align-middle" />
      )}
    </span>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/animations/TypewriterText.tsx
git commit -m "feat: add TypewriterText animation component"
```

---

### Task 5: Create AnimatedCounter component

**Files:**
- Create: `src/components/animations/AnimatedCounter.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useInView, useReducedMotion } from "framer-motion";

interface AnimatedCounterProps {
  end: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function AnimatedCounter({
  end,
  suffix = "",
  prefix = "",
  duration = 2,
  className,
}: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const shouldReduceMotion = useReducedMotion();
  const [value, setValue] = useState(shouldReduceMotion ? end : 0);

  useEffect(() => {
    if (!isInView || shouldReduceMotion) return;

    const startTime = performance.now();
    const durationMs = duration * 1000;

    function tick() {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / durationMs, 1);
      const eased = easeOutCubic(progress);
      setValue(Math.round(eased * end));

      if (progress < 1) {
        requestAnimationFrame(tick);
      }
    }

    requestAnimationFrame(tick);
  }, [isInView, end, duration, shouldReduceMotion]);

  return (
    <span ref={ref} className={className}>
      {prefix}{value.toLocaleString()}{suffix}
    </span>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/animations/AnimatedCounter.tsx
git commit -m "feat: add AnimatedCounter animation component"
```

---

### Task 6: Create TiltCard component

**Files:**
- Create: `src/components/animations/TiltCard.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { type ReactNode, useRef, useState, useCallback } from "react";
import { useReducedMotion } from "framer-motion";

interface TiltCardProps {
  children: ReactNode;
  maxTilt?: number;
  className?: string;
}

export function TiltCard({
  children,
  maxTilt = 8,
  className,
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [transform, setTransform] = useState("rotateX(0deg) rotateY(0deg)");

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const ratioX = (e.clientX - centerX) / (rect.width / 2);
      const ratioY = (e.clientY - centerY) / (rect.height / 2);
      const rotateY = ratioX * maxTilt;
      const rotateX = -ratioY * maxTilt;
      setTransform(`perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`);
    },
    [maxTilt, shouldReduceMotion]
  );

  const handleMouseLeave = useCallback(() => {
    setTransform("perspective(1000px) rotateX(0deg) rotateY(0deg)");
  }, []);

  // On touch devices, hover: hover media query is false — no tilt applied via CSS guard
  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        transform,
        transition: "transform 0.15s ease-out",
        willChange: "transform",
      }}
    >
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/animations/TiltCard.tsx
git commit -m "feat: add TiltCard animation component"
```

---

## Chunk 2: Remaining Components

### Task 7: Create MagneticButton component

**Files:**
- Create: `src/components/animations/MagneticButton.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { type ReactNode, useRef, useState, useCallback } from "react";
import { useReducedMotion } from "framer-motion";

interface MagneticButtonProps {
  children: ReactNode;
  strength?: number;
  radius?: number;
  className?: string;
}

export function MagneticButton({
  children,
  strength = 4,
  radius = 100,
  className,
}: MagneticButtonProps) {
  const ref = useRef<HTMLDivElement>(null);
  const shouldReduceMotion = useReducedMotion();
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (shouldReduceMotion) return;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const dx = e.clientX - centerX;
      const dy = e.clientY - centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        const factor = (1 - dist / radius) * strength;
        setOffset({ x: (dx / dist) * factor, y: (dy / dist) * factor });
      } else {
        setOffset({ x: 0, y: 0 });
      }
    },
    [strength, radius, shouldReduceMotion]
  );

  const handleMouseLeave = useCallback(() => {
    setOffset({ x: 0, y: 0 });
  }, []);

  return (
    <div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ display: "inline-block" }}
    >
      <div
        style={{
          transform: `translate(${offset.x}px, ${offset.y}px)`,
          transition: "transform 0.3s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/components/animations/MagneticButton.tsx
git commit -m "feat: add MagneticButton animation component"
```

---

### Task 8: Create GradientText component

**Files:**
- Create: `src/components/animations/GradientText.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { type ReactNode, type ElementType } from "react";
import { useReducedMotion } from "framer-motion";

interface GradientTextProps {
  children: ReactNode;
  colors?: string[];
  speed?: number;
  as?: ElementType;
  className?: string;
}

export function GradientText({
  children,
  colors = ["#6366f1", "#a855f7", "#6366f1"],
  speed = 3,
  as: Tag = "span",
  className,
}: GradientTextProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <Tag
      className={className}
      style={{
        background: `linear-gradient(90deg, ${colors.join(", ")})`,
        backgroundSize: "200% auto",
        backgroundClip: "text",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent",
        animation: shouldReduceMotion ? "none" : `gradient-text ${speed}s linear infinite`,
      }}
    >
      {children}
    </Tag>
  );
}
```

- [ ] **Step 2: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/components/animations/GradientText.tsx
git commit -m "feat: add GradientText animation component"
```

---

### Task 9: Create ScrollProgress component

**Files:**
- Create: `src/components/animations/ScrollProgress.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface ScrollProgressProps {
  color?: string;
  height?: number;
  zIndex?: number;
}

export function ScrollProgress({
  color = "linear-gradient(90deg, #4f46e5, #a855f7)",
  height = 2,
  zIndex = 9999,
}: ScrollProgressProps) {
  const [progress, setProgress] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) return;

    let ticking = false;

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        setProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);
        ticking = false;
      });
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [shouldReduceMotion]);

  if (shouldReduceMotion) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: `${height}px`,
        width: `${progress}%`,
        background: color,
        zIndex,
        transition: "width 0.1s linear",
        pointerEvents: "none",
      }}
    />
  );
}
```

- [ ] **Step 2: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/components/animations/ScrollProgress.tsx
git commit -m "feat: add ScrollProgress animation component"
```

---

### Task 10: Create CursorGlow component

**Files:**
- Create: `src/components/animations/CursorGlow.tsx`

- [ ] **Step 1: Create the component**

```tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";

interface CursorGlowProps {
  size?: number;
  color?: string;
  className?: string;
}

export function CursorGlow({
  size = 200,
  color = "rgba(99, 102, 241, 0.08)",
  className,
}: CursorGlowProps) {
  const shouldReduceMotion = useReducedMotion();
  const containerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (shouldReduceMotion) return;

    // Check hover capability
    if (typeof window !== "undefined" && !window.matchMedia("(hover: hover)").matches) {
      return;
    }

    const parent = containerRef.current?.parentElement;
    if (!parent) return;

    let rafId: number;

    function onMouseMove(e: MouseEvent) {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!glowRef.current || !parent) return;
        const rect = parent.getBoundingClientRect();
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        glowRef.current.style.transform = `translate(${x}px, ${y}px)`;
        setVisible(true);
      });
    }

    function onMouseLeave() {
      setVisible(false);
    }

    parent.addEventListener("mousemove", onMouseMove);
    parent.addEventListener("mouseleave", onMouseLeave);

    return () => {
      cancelAnimationFrame(rafId);
      parent.removeEventListener("mousemove", onMouseMove);
      parent.removeEventListener("mouseleave", onMouseLeave);
    };
  }, [shouldReduceMotion, size]);

  if (shouldReduceMotion) return null;

  return (
    <div ref={containerRef} className={className} style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
      <div
        ref={glowRef}
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          opacity: visible ? 1 : 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
```

- [ ] **Step 2: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/components/animations/CursorGlow.tsx
git commit -m "feat: add CursorGlow animation component"
```

---

### Task 11: Create barrel export for all animation components

**Files:**
- Create: `src/components/animations/index.ts`

- [ ] **Step 1: Create barrel export**

```ts
export { ScrollReveal } from "./ScrollReveal";
export { StaggerContainer } from "./StaggerContainer";
export { TypewriterText } from "./TypewriterText";
export { AnimatedCounter } from "./AnimatedCounter";
export { TiltCard } from "./TiltCard";
export { MagneticButton } from "./MagneticButton";
export { GradientText } from "./GradientText";
export { ScrollProgress } from "./ScrollProgress";
export { CursorGlow } from "./CursorGlow";
```

- [ ] **Step 2: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/components/animations/index.ts
git commit -m "feat: add barrel export for animation components"
```

---

## Chunk 3: Global Integration (Navbar, Footer, Layout)

### Task 12: Add ScrollProgress to layout.tsx

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Import and add ScrollProgress**

Add import near top of file:
```tsx
import { ScrollProgress } from "@/components/animations/ScrollProgress";
```

Add `<ScrollProgress />` inside the `<body>` tag, right after the opening `<Providers>`:

Find:
```tsx
<Providers>
```

Add immediately after:
```tsx
<ScrollProgress />
```

- [ ] **Step 2: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/app/layout.tsx
git commit -m "feat: add scroll progress bar to layout"
```

---

### Task 13: Add scroll-aware styles to Navbar

**Files:**
- Modify: `src/components/Navbar.tsx`

- [ ] **Step 1: Add scroll state**

Add `useState` and `useEffect` imports if not present. Add scroll detection state inside the `Navbar` component function, before the return statement:

```tsx
const [isScrolled, setIsScrolled] = useState(false);

useEffect(() => {
  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      setIsScrolled(window.scrollY > 50);
      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
  return () => window.removeEventListener("scroll", onScroll);
}, []);
```

- [ ] **Step 2: Update nav element classes**

On the `<nav>` element (line ~24), change:
```tsx
className="fixed top-0 left-0 right-0 z-50 bg-surface-dark/90 backdrop-blur-xl border-b border-surface-border"
```

To:
```tsx
className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
  isScrolled
    ? "bg-[rgba(15,15,36,0.8)] backdrop-blur-xl border-b border-indigo-500/10 shadow-lg shadow-indigo-900/5"
    : "bg-transparent border-b border-transparent"
}`}
```

- [ ] **Step 3: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/components/Navbar.tsx
git commit -m "feat: add scroll-aware blur transition to Navbar"
```

---

### Task 14: Add ScrollReveal to Footer

**Files:**
- Modify: `src/components/Footer.tsx`

- [ ] **Step 1: Import and wrap Footer**

Add import at top:
```tsx
import { ScrollReveal } from "@/components/animations/ScrollReveal";
```

Wrap the `<footer>` element in `<ScrollReveal direction="up" delay={0.1}>`:

```tsx
return (
  <ScrollReveal direction="up" delay={0.1}>
    <footer className="border-t border-surface-border bg-surface-dark">
      {/* ...existing content unchanged... */}
    </footer>
  </ScrollReveal>
);
```

- [ ] **Step 2: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/components/Footer.tsx
git commit -m "feat: add scroll reveal animation to Footer"
```

---

## Chunk 4: Landing Page Integration — Hero + Features + Beneficiaries

### Task 15: Integrate animations into Hero section

**Files:**
- Modify: `src/app/page.tsx` (lines 1-99)

- [ ] **Step 1: Add imports**

Add these imports near top of page.tsx:
```tsx
import { ScrollReveal } from "@/components/animations/ScrollReveal";
import { StaggerContainer } from "@/components/animations/StaggerContainer";
import { TypewriterText } from "@/components/animations/TypewriterText";
import { AnimatedCounter } from "@/components/animations/AnimatedCounter";
import { TiltCard } from "@/components/animations/TiltCard";
import { MagneticButton } from "@/components/animations/MagneticButton";
import { GradientText } from "@/components/animations/GradientText";
import { CursorGlow } from "@/components/animations/CursorGlow";
```

- [ ] **Step 2: Add landing-page class to root**

Find the outermost `<div>` or `<main>` wrapper in the page component. Add `className="landing-page"` to it (or append to existing className).

- [ ] **Step 3: Update Hero headline**

Replace the existing `<motion.h1>` headline (which contains the "From description to 3D model — instantly." text with the brand span) with:

```tsx
<motion.h1
  className="text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl"
  variants={fadeUp}
>
  <TypewriterText
    segments={[
      { text: "From description" },
      { text: "\n" },
      { text: "to 3D model", className: "text-brand" },
    ]}
    speed={40}
    delay={300}
  />
  <motion.span
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: 2.5, duration: 0.5 }}
  >
    {" "}&mdash; instantly.
  </motion.span>
</motion.h1>
```

- [ ] **Step 4: Add CursorGlow to Hero**

Inside the hero section wrapper (the one with the gradient background), add `position: relative` if not present, then add CursorGlow as a child:

```tsx
<CursorGlow size={250} color="rgba(99, 102, 241, 0.06)" />
```

- [ ] **Step 5: Add gradient-shift to hero background**

On the hero section's gradient background div, add the `animate-gradient-shift` class.

- [ ] **Step 6: Add pulse-glow to primary CTA button**

On the "Open Workspace" link/button, add the `animate-pulse-glow` class and `btn-ripple` class. Add an onClick handler for ripple:

```tsx
onClick={(e) => {
  const btn = e.currentTarget;
  const rect = btn.getBoundingClientRect();
  btn.style.setProperty("--ripple-x", `${e.clientX - rect.left}px`);
  btn.style.setProperty("--ripple-y", `${e.clientY - rect.top}px`);
  btn.classList.remove("rippling");
  requestAnimationFrame(() => btn.classList.add("rippling"));
  setTimeout(() => btn.classList.remove("rippling"), 400);
}}
```

- [ ] **Step 7: Add spring entrance to badge pills**

Wrap the three badge/pill items ("Free forever", "STL export", "Manual editing") in individual `motion.span` with spring stagger:

```tsx
{["Free forever", "STL export", "Manual editing"].map((badge, i) => (
  <motion.span
    key={badge}
    initial={{ opacity: 0, scale: 0.8, y: 10 }}
    animate={{ opacity: 1, scale: 1, y: 0 }}
    transition={{ type: "spring", stiffness: 300, damping: 20, delay: 2.8 + i * 0.15 }}
    className="..." // existing badge classes
  >
    {/* existing badge content */}
  </motion.span>
))}
```

- [ ] **Step 8: Verify build**

Run: `npx next build 2>&1 | tail -5`
Expected: No errors.

- [ ] **Step 9: Commit**

```bash
git add src/app/page.tsx
git commit -m "feat: add hero section animations — typewriter, cursor glow, badge springs"
```

---

### Task 16: Integrate animations into Features section

**Files:**
- Modify: `src/app/page.tsx` (features section, ~lines 101-147)

- [ ] **Step 1: Wrap features grid in StaggerContainer**

Replace the existing `motion.div` grid wrapper with `StaggerContainer`:

```tsx
<StaggerContainer stagger={0.08} direction="up" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-16">
```

- [ ] **Step 2: Wrap each feature card in TiltCard**

For each feature card in the grid, wrap the card content in `<TiltCard>`:

```tsx
<TiltCard className="p-6 rounded-2xl bg-white/[0.02] border border-surface-border hover:border-brand/30 hover:shadow-[0_0_20px_rgba(99,102,241,0.15)] transition-all duration-300">
  {/* existing card content */}
</TiltCard>
```

- [ ] **Step 3: Add float animation to feature icons**

On each feature icon element, add `animate-float` class with staggered delay:

```tsx
<div className="animate-float" style={{ animationDelay: `${i * 0.5}s` }}>
  <IconComponent ... />
</div>
```

Where `i` is the card index (0-5).

- [ ] **Step 4: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/app/page.tsx
git commit -m "feat: add features section animations — stagger, tilt, float icons"
```

---

### Task 17: Integrate animations into Beneficiaries section

**Files:**
- Modify: `src/app/page.tsx` (beneficiaries section, ~lines 149-192)

- [ ] **Step 1: Add stats row with AnimatedCounter**

Between the section heading and the cards grid, add:

```tsx
<div className="flex justify-center gap-12 mt-8 mb-12">
  {[
    { end: 10000, suffix: "+", label: "Models Created" },
    { end: 50, suffix: "+", label: "Countries" },
    { end: 4.9, suffix: "", label: "User Rating", prefix: "" },
  ].map((stat) => (
    <div key={stat.label} className="text-center">
      <div className="text-3xl font-bold text-white">
        <AnimatedCounter end={stat.end} suffix={stat.suffix} prefix={stat.prefix} duration={2} />
      </div>
      <div className="text-sm text-gray-400 mt-1">{stat.label}</div>
    </div>
  ))}
</div>
```

Note: For the 4.9 rating, AnimatedCounter works with integers. Instead use a static display or modify — simplest approach: show "4.9" as a static number with a fade-in via ScrollReveal.

- [ ] **Step 2: Wrap each beneficiary card in ScrollReveal with alternating direction**

Replace the existing card wrappers with:

```tsx
{beneficiaries.map((item, i) => (
  <ScrollReveal key={item.title} direction={i % 2 === 0 ? "left" : "right"} delay={i * 0.1}>
    <div className="text-center p-8 rounded-2xl bg-white/[0.02] border border-surface-border hover:-translate-y-1.5 hover:shadow-lg hover:shadow-indigo-900/10 transition-all duration-250">
      {/* existing card content */}
    </div>
  </ScrollReveal>
))}
```

- [ ] **Step 3: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/app/page.tsx
git commit -m "feat: add beneficiaries animations — counters, alternating slide-in, hover lift"
```

---

## Chunk 5: Landing Page Integration — Demo + Pricing + CTA

### Task 18: Integrate animations into Demo section

**Files:**
- Modify: `src/app/page.tsx` (demo section, ~lines 196-320)

- [ ] **Step 1: Wrap demo section in ScrollReveal**

Wrap the demo section container in:
```tsx
<ScrollReveal direction="up" delay={0.1}>
```

- [ ] **Step 2: Wrap Generate button in MagneticButton**

Find the "Generate" button and wrap it:
```tsx
<MagneticButton strength={4} radius={100}>
  <button className="... existing classes ... btn-ripple" onClick={...}>
    Generate
  </button>
</MagneticButton>
```

- [ ] **Step 3: Add focus glow to input**

On the text input element, add to its className:
```
focus:shadow-[0_0_0_2px_rgba(99,102,241,0.15),0_0_15px_rgba(99,102,241,0.1)] transition-shadow duration-300
```

- [ ] **Step 4: Add spring entrance to example suggestion pills**

Wrap the suggestion pills in a `StaggerContainer`:
```tsx
<StaggerContainer stagger={0.08} direction="up" className="flex flex-wrap gap-2 mt-3">
  {examples.map((example) => (
    <button key={example} className="...existing pill classes...">
      {example}
    </button>
  ))}
</StaggerContainer>
```

- [ ] **Step 5: Add shimmer to loading state**

In the loading/skeleton state of the demo viewer, add `animate-shimmer` class to the placeholder element:
```tsx
<div className="animate-shimmer rounded-xl h-64 w-full" />
```

- [ ] **Step 6: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/app/page.tsx
git commit -m "feat: add demo section animations — magnetic button, focus glow, shimmer"
```

---

### Task 19: Integrate animations into Pricing section

**Files:**
- Modify: `src/app/page.tsx` (pricing section, ~lines 322-405)

- [ ] **Step 1: Wrap pricing cards in ScrollReveal with scale**

Wrap each pricing card in:
```tsx
<ScrollReveal direction="up" delay={i * 0.1} scale={0.92}>
```

Where `i` is the card index (0, 1, 2).

- [ ] **Step 2: Add pulse-glow to Popular badge**

On the "Popular" badge element (line ~372), add:
```tsx
className="... existing classes ... animate-pulse-glow"
```

- [ ] **Step 3: Add stagger to feature list items**

Wrap the feature `<ul>` in a `StaggerContainer`:
```tsx
<StaggerContainer stagger={0.05} direction="up">
  {features.map((feature) => (
    <li key={feature} className="...">...</li>
  ))}
</StaggerContainer>
```

- [ ] **Step 4: Add ripple to pricing CTA buttons**

Add `btn-ripple` class to each pricing CTA button, plus the ripple onClick handler (same pattern as hero CTA in Task 15 Step 6).

- [ ] **Step 5: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/app/page.tsx
git commit -m "feat: add pricing section animations — scale reveal, badge pulse, stagger list"
```

---

### Task 20: Integrate animations into Final CTA section

**Files:**
- Modify: `src/app/page.tsx` (CTA section, ~lines 407-435)

- [ ] **Step 1: Wrap section in ScrollReveal**

```tsx
<ScrollReveal direction="up" delay={0.1}>
```

- [ ] **Step 2: Apply GradientText to headline**

Replace the CTA section headline with:
```tsx
<GradientText as="h2" colors={["#6366f1", "#a855f7", "#ec4899", "#6366f1"]} speed={4} className="text-3xl font-bold sm:text-4xl">
  Start building in 3D today
</GradientText>
```

(Adjust the text to match the actual headline content.)

- [ ] **Step 3: Add breathing glow to CTA button**

Add `animate-pulse-glow btn-ripple` classes to the final CTA button. Add ripple onClick handler.

- [ ] **Step 4: Verify build & commit**

```bash
npx next build 2>&1 | tail -3
git add src/app/page.tsx
git commit -m "feat: add CTA section animations — gradient text, breathing glow"
```

---

### Task 21: Final build verification and cleanup

- [ ] **Step 1: Full build check**

Run: `npx next build 2>&1 | tail -20`
Expected: All pages compile successfully with no errors.

- [ ] **Step 2: Visual verification**

Start dev server and manually verify in browser:
- Hero: typewriter types out, badges spring in, cursor glow follows mouse, CTA button pulses
- Features: cards cascade in, tilt on hover, icons float
- Beneficiaries: counters count up, cards slide from alternating sides
- Demo: section fades up, Generate button is magnetic, pills stagger in
- Pricing: cards scale in, Popular pulses, feature lists stagger
- CTA: gradient text shimmers, button glows
- Navbar: transparent at top, blurs on scroll
- Footer: fades up on scroll
- Scroll progress bar visible at top

- [ ] **Step 3: Final commit**

```bash
git add -A
git commit -m "feat: complete landing page animation overhaul

- 9 reusable animation components (ScrollReveal, StaggerContainer,
  TypewriterText, AnimatedCounter, TiltCard, MagneticButton,
  GradientText, ScrollProgress, CursorGlow)
- Hero: typewriter headline, cursor glow, spring badges, CTA glow
- Features: staggered cascade, 3D tilt hover, floating icons
- Beneficiaries: animated counters, alternating slide-ins
- Demo: magnetic button, focus glow, shimmer loader
- Pricing: scale-in cards, pulsing badge, staggered lists
- CTA: gradient text shimmer, breathing glow button
- Navbar: scroll-aware blur transition
- Footer: scroll reveal entrance
- Scroll progress bar in layout
- All animations respect prefers-reduced-motion"
```
