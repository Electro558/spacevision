"use client";

import { useRef, useEffect, useCallback } from "react";
import { Html } from "@react-three/drei";

const AXIS_COLORS: Record<string, string> = {
  x: "#ef4444",
  y: "#22c55e",
  z: "#3b82f6",
};

interface DimensionInputProps {
  position: [number, number, number];
  axis: "x" | "y" | "z";
  currentValue: number;
  onSubmit: (value: number) => void;
  onCancel: () => void;
  visible: boolean;
}

export default function DimensionInput({
  position,
  axis,
  currentValue,
  onSubmit,
  onCancel,
  visible,
}: DimensionInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.value = currentValue.toFixed(3);
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [visible, currentValue]);

  const handleSubmit = useCallback(() => {
    if (!inputRef.current) return;
    const val = parseFloat(inputRef.current.value);
    if (!isNaN(val)) {
      onSubmit(val);
    } else {
      onCancel();
    }
  }, [onSubmit, onCancel]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      e.stopPropagation();
      if (e.key === "Enter") {
        handleSubmit();
      } else if (e.key === "Escape") {
        onCancel();
      } else if (e.key === "Tab") {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit, onCancel]
  );

  if (!visible) return null;

  const color = AXIS_COLORS[axis] || "#ffffff";

  return (
    <Html position={position} center>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          background: "rgba(15, 23, 42, 0.95)",
          border: `1px solid ${color}`,
          borderRadius: 6,
          padding: "4px 8px",
          userSelect: "none",
        }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <span
          style={{
            color,
            fontFamily: "monospace",
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          {axis.toUpperCase()}:
        </span>
        <input
          ref={inputRef}
          type="text"
          defaultValue={currentValue.toFixed(3)}
          onKeyDown={handleKeyDown}
          onBlur={handleSubmit}
          style={{
            width: 64,
            background: "rgba(30, 41, 59, 0.9)",
            border: `1px solid ${color}44`,
            borderRadius: 3,
            color: "#e2e8f0",
            fontFamily: "monospace",
            fontSize: 12,
            padding: "2px 4px",
            outline: "none",
          }}
        />
      </div>
    </Html>
  );
}
