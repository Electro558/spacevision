// src/cad/components/SnapIndicator.tsx

"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import type { SnapType } from "../engine/snapEngine";
import type { SketchPlane } from "../engine/types";

interface SnapIndicatorProps {
  point: { x: number; y: number };
  type: SnapType;
  plane: SketchPlane;
  visible: boolean;
}

/**
 * Converts 2D sketch coordinates to 3D based on the sketch plane.
 */
function to3D(plane: SketchPlane, x: number, y: number): THREE.Vector3 {
  switch (plane) {
    case "XY": return new THREE.Vector3(x, y, 0.01);
    case "XZ": return new THREE.Vector3(x, 0.01, y);
    case "YZ": return new THREE.Vector3(0.01, x, y);
  }
}

const SNAP_STYLES: Record<SnapType, { icon: string; color: string; label: string }> = {
  grid:          { icon: "+",  color: "#ffffff", label: "Grid" },
  endpoint:      { icon: "\u25AA",  color: "#4ade80", label: "Endpoint" },
  midpoint:      { icon: "\u25B2",  color: "#60a5fa", label: "Midpoint" },
  center:        { icon: "\u25CB",  color: "#f87171", label: "Center" },
  intersection:  { icon: "\u00D7",  color: "#facc15", label: "Intersection" },
  perpendicular: { icon: "\u22A5",  color: "#a78bfa", label: "Perpendicular" },
  nearest:       { icon: "\u25C6",  color: "#22d3ee", label: "Nearest" },
  none:          { icon: "",   color: "#666666", label: "" },
};

export function SnapIndicator({ point, type, plane, visible }: SnapIndicatorProps) {
  const position = useMemo(() => to3D(plane, point.x, point.y), [plane, point.x, point.y]);
  const style = SNAP_STYLES[type];

  if (!visible || type === "none") return null;

  return (
    <Html
      position={position}
      center
      zIndexRange={[100, 0]}
      style={{
        pointerEvents: "none",
        transition: "opacity 0.15s ease",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "2px",
          pointerEvents: "none",
          userSelect: "none",
        }}
      >
        {/* Snap icon */}
        <div
          style={{
            fontSize: type === "grid" ? "18px" : "16px",
            fontWeight: "bold",
            color: style.color,
            textShadow: `0 0 4px ${style.color}80, 0 0 8px rgba(0,0,0,0.8)`,
            lineHeight: 1,
          }}
        >
          {style.icon}
        </div>
        {/* Label */}
        <div
          style={{
            fontSize: "9px",
            color: style.color,
            backgroundColor: "rgba(0,0,0,0.7)",
            padding: "1px 4px",
            borderRadius: "2px",
            whiteSpace: "nowrap",
            letterSpacing: "0.3px",
          }}
        >
          {style.label}
        </div>
      </div>
    </Html>
  );
}
