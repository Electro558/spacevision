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
