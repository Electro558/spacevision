"use client";

import { useMemo } from "react";
import { Line, Html } from "@react-three/drei";
import * as THREE from "three";
import type { SceneObject } from "@/lib/cadStore";
import {
  computeDimensionLines,
  computeObjectDimensions,
  getWorldBounds,
  type DimensionLine,
} from "@/lib/dimensionHelpers";

const AXIS_COLORS: Record<string, string> = {
  x: "#ef4444",
  y: "#22c55e",
  z: "#3b82f6",
  diagonal: "#a855f7",
};

function DimensionLineRenderer({ line }: { line: DimensionLine }) {
  const color = AXIS_COLORS[line.axis] || "#ffffff";
  const midpoint = new THREE.Vector3()
    .addVectors(line.start, line.end)
    .multiplyScalar(0.5);

  return (
    <group>
      <Line
        points={[line.start, line.end]}
        color={color}
        lineWidth={1.5}
        dashed
        dashSize={0.08}
        gapSize={0.04}
      />
      {/* End caps */}
      <Line
        points={[
          new THREE.Vector3(line.start.x, line.start.y - 0.05, line.start.z),
          new THREE.Vector3(line.start.x, line.start.y + 0.05, line.start.z),
        ]}
        color={color}
        lineWidth={1.5}
      />
      <Line
        points={[
          new THREE.Vector3(line.end.x, line.end.y - 0.05, line.end.z),
          new THREE.Vector3(line.end.x, line.end.y + 0.05, line.end.z),
        ]}
        color={color}
        lineWidth={1.5}
      />
      <Html position={midpoint} center style={{ pointerEvents: "none" }}>
        <div
          style={{
            background: "rgba(15, 23, 42, 0.9)",
            color,
            border: `1px solid ${color}`,
            borderRadius: 4,
            padding: "2px 6px",
            fontSize: 11,
            fontFamily: "monospace",
            whiteSpace: "nowrap",
            userSelect: "none",
          }}
        >
          {line.label}
        </div>
      </Html>
    </group>
  );
}

function SingleObjectRulers({ obj }: { obj: SceneObject }) {
  const { dims, bounds } = useMemo(() => {
    const d = computeObjectDimensions(obj);
    const b = getWorldBounds(obj);
    return { dims: d, bounds: b };
  }, [obj]);

  const center = new THREE.Vector3();
  bounds.getCenter(center);
  const min = bounds.min;
  const max = bounds.max;

  const lines: DimensionLine[] = [];

  // Width (X) — line below the object along X axis
  if (dims.width > 0.001) {
    const y = min.y - 0.2;
    const z = max.z + 0.15;
    lines.push({
      start: new THREE.Vector3(min.x, y, z),
      end: new THREE.Vector3(max.x, y, z),
      distance: dims.width,
      axis: "x",
      label: `W: ${dims.width.toFixed(2)}`,
    });
  }

  // Height (Y) — line beside the object along Y axis
  if (dims.height > 0.001) {
    const x = max.x + 0.2;
    const z = max.z + 0.15;
    lines.push({
      start: new THREE.Vector3(x, min.y, z),
      end: new THREE.Vector3(x, max.y, z),
      distance: dims.height,
      axis: "y",
      label: `H: ${dims.height.toFixed(2)}`,
    });
  }

  // Depth (Z) — line below the object along Z axis
  if (dims.depth > 0.001) {
    const y = min.y - 0.2;
    const x = max.x + 0.15;
    lines.push({
      start: new THREE.Vector3(x, y, min.z),
      end: new THREE.Vector3(x, y, max.z),
      distance: dims.depth,
      axis: "z",
      label: `D: ${dims.depth.toFixed(2)}`,
    });
  }

  return (
    <group>
      {lines.map((line, i) => (
        <DimensionLineRenderer key={i} line={line} />
      ))}
    </group>
  );
}

function TwoObjectRulers({
  objA,
  objB,
}: {
  objA: SceneObject;
  objB: SceneObject;
}) {
  const lines = useMemo(
    () => computeDimensionLines(objA, objB),
    [objA, objB]
  );

  return (
    <group>
      {lines.map((line, i) => (
        <DimensionLineRenderer key={i} line={line} />
      ))}
    </group>
  );
}

interface SmartRulersProps {
  objects: SceneObject[];
  selectedIds: string[];
  visible: boolean;
}

export default function SmartRulers({
  objects,
  selectedIds,
  visible,
}: SmartRulersProps) {
  if (!visible || selectedIds.length === 0) return null;

  const selectedObjects = objects.filter((o) => selectedIds.includes(o.id));

  if (selectedObjects.length === 1) {
    return <SingleObjectRulers obj={selectedObjects[0]} />;
  }

  if (selectedObjects.length === 2) {
    return (
      <TwoObjectRulers objA={selectedObjects[0]} objB={selectedObjects[1]} />
    );
  }

  // For more than 2 selected, show rulers between the first two
  if (selectedObjects.length > 2) {
    return (
      <TwoObjectRulers objA={selectedObjects[0]} objB={selectedObjects[1]} />
    );
  }

  return null;
}
