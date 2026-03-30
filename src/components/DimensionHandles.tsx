"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { SceneObject, buildGeometry } from "@/lib/cadStore";

export interface DimensionHandlesProps {
  obj: SceneObject;
  onScaleChange: (axis: "x" | "y" | "z", newScale: number) => void;
  visible: boolean;
}

const axisColors = {
  x: "#ef4444",
  y: "#22c55e",
  z: "#3b82f6",
} as const;

export default function DimensionHandles({
  obj,
  onScaleChange,
  visible,
}: DimensionHandlesProps) {
  const { dims, positions } = useMemo(() => {
    const geo = buildGeometry(obj.type, obj.params);
    geo.computeBoundingBox();
    const bbox = geo.boundingBox ?? new THREE.Box3();

    const width = (bbox.max.x - bbox.min.x) * obj.scale[0];
    const height = (bbox.max.y - bbox.min.y) * obj.scale[1];
    const depth = (bbox.max.z - bbox.min.z) * obj.scale[2];

    return {
      dims: { x: width, y: height, z: depth },
      positions: {
        x: [bbox.max.x * obj.scale[0], 0, 0] as [number, number, number],
        y: [0, bbox.max.y * obj.scale[1], 0] as [number, number, number],
        z: [0, 0, bbox.max.z * obj.scale[2]] as [number, number, number],
      },
    };
  }, [obj.type, obj.params, obj.scale]);

  if (!visible) return null;

  const labelStyle = (color: string): React.CSSProperties => ({
    background: color,
    color: "white",
    fontSize: "10px",
    padding: "1px 6px",
    borderRadius: "4px",
    cursor: "pointer",
    userSelect: "none",
    whiteSpace: "nowrap",
    pointerEvents: "auto",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  });

  const lineStyle = (axis: "x" | "y" | "z"): React.CSSProperties => ({
    width: axis === "x" ? "12px" : "1px",
    height: axis === "y" ? "12px" : "1px",
    background: axisColors[axis],
    opacity: 0.7,
    flexShrink: 0,
  });

  return (
    <group
      position={obj.position}
      rotation={obj.rotation}
    >
      {/* X dimension label */}
      <Html
        position={positions.x}
        center
        distanceFactor={8}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <div style={lineStyle("x")} />
          <div style={labelStyle(axisColors.x)}>
            {dims.x.toFixed(2)}
          </div>
        </div>
      </Html>

      {/* Y dimension label */}
      <Html
        position={positions.y}
        center
        distanceFactor={8}
      >
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "2px" }}>
          <div style={labelStyle(axisColors.y)}>
            {dims.y.toFixed(2)}
          </div>
          <div style={lineStyle("y")} />
        </div>
      </Html>

      {/* Z dimension label */}
      <Html
        position={positions.z}
        center
        distanceFactor={8}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
          <div style={lineStyle("z")} />
          <div style={labelStyle(axisColors.z)}>
            {dims.z.toFixed(2)}
          </div>
        </div>
      </Html>
    </group>
  );
}
