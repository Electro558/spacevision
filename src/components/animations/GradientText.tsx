"use client";

import { type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";

interface GradientTextProps {
  children: ReactNode;
  colors?: string[];
  speed?: number;
  as?: "span" | "h1" | "h2" | "h3" | "h4" | "p" | "div";
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

  const style: React.CSSProperties = {
    background: `linear-gradient(90deg, ${colors.join(", ")})`,
    backgroundSize: "200% auto",
    backgroundClip: "text",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    animation: shouldReduceMotion ? "none" : `gradient-text ${speed}s linear infinite`,
  };

  return (
    <Tag className={className} style={style}>
      {children}
    </Tag>
  );
}
