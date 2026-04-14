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
