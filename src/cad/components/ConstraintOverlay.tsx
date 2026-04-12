// src/cad/components/ConstraintOverlay.tsx

"use client";

import { useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { Sketch, SketchConstraint, SketchPlane, SketchEntity } from "../engine/types";

interface ConstraintOverlayProps {
  sketch: Sketch;
  satisfied: Record<string, boolean>;
}

/**
 * Converts 2D sketch coordinates to 3D based on the sketch plane.
 */
function to3D(plane: SketchPlane, x: number, y: number): THREE.Vector3 {
  switch (plane) {
    case "XY": return new THREE.Vector3(x, y, 0);
    case "XZ": return new THREE.Vector3(x, 0, y);
    case "YZ": return new THREE.Vector3(0, x, y);
  }
}

/**
 * Get the visual label/icon for a constraint type.
 */
function getConstraintIcon(type: SketchConstraint["type"]): string {
  switch (type) {
    case "horizontal": return "H";
    case "vertical": return "V";
    case "perpendicular": return "\u22A5";
    case "parallel": return "\u2225";
    case "equal": return "=";
    case "fixed": return "\uD83D\uDCCC";
    case "coincident": return "";
    case "tangent": return "T";
    case "distance": return "";
    case "radius": return "";
    case "angle": return "";
  }
}

/**
 * Compute the 2D position where a constraint indicator should appear.
 */
function getConstraintPosition(
  constraint: SketchConstraint,
  pointMap: Map<string, { x: number; y: number }>,
  entityMap: Map<string, SketchEntity>
): { x: number; y: number } | null {
  switch (constraint.type) {
    case "horizontal":
    case "vertical": {
      const entity = entityMap.get(constraint.refs[0]);
      if (!entity || entity.type !== "line") return null;
      const s = pointMap.get(entity.startId);
      const e = pointMap.get(entity.endId);
      if (!s || !e) return null;
      return { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 + 0.8 };
    }

    case "coincident": {
      const p1 = pointMap.get(constraint.refs[0]);
      const p2 = pointMap.get(constraint.refs[1]);
      if (!p1 || !p2) return null;
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 };
    }

    case "fixed": {
      const p = pointMap.get(constraint.refs[0]);
      return p ? { x: p.x, y: p.y + 0.6 } : null;
    }

    case "perpendicular":
    case "parallel":
    case "equal":
    case "angle": {
      const e1 = entityMap.get(constraint.refs[0]);
      const e2 = entityMap.get(constraint.refs[1]);
      if (!e1 || !e2) return null;
      const p1 = getMidpoint(e1, pointMap);
      const p2 = getMidpoint(e2, pointMap);
      if (!p1 || !p2) return null;
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 + 0.8 };
    }

    case "tangent": {
      const lineEntity = entityMap.get(constraint.refs[0]);
      if (!lineEntity) return null;
      const mp = getMidpoint(lineEntity, pointMap);
      return mp ? { x: mp.x, y: mp.y + 0.8 } : null;
    }

    case "distance": {
      const p1 = pointMap.get(constraint.refs[0]);
      const p2 = pointMap.get(constraint.refs[1]);
      if (!p1 || !p2) return null;
      return { x: (p1.x + p2.x) / 2, y: (p1.y + p2.y) / 2 + 1.0 };
    }

    case "radius": {
      const entity = entityMap.get(constraint.refs[0]);
      if (!entity) return null;
      if (entity.type === "circle" || entity.type === "arc") {
        const c = pointMap.get(entity.centerId);
        if (!c) return null;
        const r = typeof entity.radius === "number" ? entity.radius : 5;
        return { x: c.x + r * 0.7, y: c.y + r * 0.7 };
      }
      return null;
    }
  }
}

function getMidpoint(
  entity: SketchEntity,
  pointMap: Map<string, { x: number; y: number }>
): { x: number; y: number } | null {
  switch (entity.type) {
    case "line": {
      const s = pointMap.get(entity.startId);
      const e = pointMap.get(entity.endId);
      if (!s || !e) return null;
      return { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 };
    }
    case "circle":
    case "arc": {
      const c = pointMap.get(entity.centerId);
      return c ?? null;
    }
    case "rectangle": {
      const o = pointMap.get(entity.originId);
      if (!o) return null;
      const w = typeof entity.width === "number" ? entity.width : 10;
      const h = typeof entity.height === "number" ? entity.height : 10;
      return { x: o.x + w / 2, y: o.y + h / 2 };
    }
    case "spline": {
      if (entity.controlPointIds.length === 0) return null;
      const midIdx = Math.floor(entity.controlPointIds.length / 2);
      const mid = pointMap.get(entity.controlPointIds[midIdx]);
      return mid ?? null;
    }
  }
}

/**
 * Renders a single constraint indicator.
 */
function ConstraintIndicator({
  constraint,
  position,
  plane,
  isSatisfied,
}: {
  constraint: SketchConstraint;
  position: { x: number; y: number };
  plane: SketchPlane;
  isSatisfied: boolean;
}) {
  const pos3D = to3D(plane, position.x, position.y);
  const color = isSatisfied ? "#22c55e" : "#ef4444";
  const bgColor = isSatisfied ? "rgba(34,197,94,0.15)" : "rgba(239,68,68,0.15)";

  // Coincident: render as a green/red dot
  if (constraint.type === "coincident") {
    return (
      <mesh position={pos3D}>
        <sphereGeometry args={[0.25, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>
    );
  }

  // Dimensional constraints: show value text
  if (constraint.type === "distance" || constraint.type === "radius" || constraint.type === "angle") {
    const value = constraint.value;
    const unit = constraint.type === "angle" ? "\u00B0" : "";
    const prefix = constraint.type === "radius" ? "R " : "";
    return (
      <Html position={pos3D} center>
        <div
          style={{
            background: bgColor,
            border: `1px solid ${color}`,
            color,
            padding: "1px 5px",
            borderRadius: "3px",
            fontSize: "10px",
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            userSelect: "none",
            pointerEvents: "none",
          }}
        >
          {prefix}{value.toFixed(1)}{unit}
        </div>
      </Html>
    );
  }

  // Geometric constraints: show icon label
  const icon = getConstraintIcon(constraint.type);
  if (!icon) return null;

  return (
    <Html position={pos3D} center>
      <div
        style={{
          background: bgColor,
          border: `1px solid ${color}`,
          color,
          padding: "0px 4px",
          borderRadius: "3px",
          fontSize: "10px",
          fontWeight: "bold",
          fontFamily: "monospace",
          whiteSpace: "nowrap",
          userSelect: "none",
          pointerEvents: "none",
          lineHeight: "16px",
        }}
      >
        {icon}
      </div>
    </Html>
  );
}

/**
 * Overlay that renders visual indicators for all constraints in a sketch.
 */
export function ConstraintOverlay({ sketch, satisfied }: ConstraintOverlayProps) {
  const pointMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const pt of sketch.points) map.set(pt.id, { x: pt.x, y: pt.y });
    return map;
  }, [sketch.points]);

  const entityMap = useMemo(() => {
    const map = new Map<string, SketchEntity>();
    for (const e of sketch.entities) map.set(e.id, e);
    return map;
  }, [sketch.entities]);

  const indicators = useMemo(() => {
    const result: {
      constraint: SketchConstraint;
      position: { x: number; y: number };
    }[] = [];

    for (const c of sketch.constraints) {
      const pos = getConstraintPosition(c, pointMap, entityMap);
      if (pos) result.push({ constraint: c, position: pos });
    }

    return result;
  }, [sketch.constraints, pointMap, entityMap]);

  if (indicators.length === 0) return null;

  return (
    <group>
      {indicators.map(({ constraint, position }) => (
        <ConstraintIndicator
          key={constraint.id}
          constraint={constraint}
          position={position}
          plane={sketch.plane}
          isSatisfied={satisfied[constraint.id] ?? true}
        />
      ))}
    </group>
  );
}
