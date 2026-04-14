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
