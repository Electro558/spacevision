// src/cad/components/SketchOverlay.tsx

"use client";

import { useMemo, useRef, useEffect } from "react";
import * as THREE from "three";
import type { Sketch, SketchPlane } from "../engine/types";

/**
 * Helper component that renders a line from an array of Vector3 points.
 * Uses imperative geometry updates to avoid R3F bufferAttribute typing issues.
 */
function SketchLine({ points, color, opacity = 1 }: { points: THREE.Vector3[]; color: string; opacity?: number }) {
  const ref = useRef<THREE.BufferGeometry>(null);

  useEffect(() => {
    if (!ref.current) return;
    const positions = new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]));
    ref.current.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [points]);

  return (
    <line>
      <bufferGeometry ref={ref} />
      <lineBasicMaterial color={color} linewidth={2} opacity={opacity} transparent={opacity < 1} />
    </line>
  );
}

interface SketchOverlayProps {
  sketch: Sketch;
  previewPoints?: { x: number; y: number }[];
  activeTool?: string;
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
 * Generates points along an arc for rendering.
 * Sweeps from startAngle to endAngle around center with given radius.
 * Always sweeps in the shorter direction unless the arc is nearly a full circle.
 */
function generateArcPoints(
  center: { x: number; y: number },
  radius: number,
  startAngle: number,
  endAngle: number,
  plane: import("../engine/types").SketchPlane,
  segmentCount = 64
): THREE.Vector3[] {
  let sweep = endAngle - startAngle;
  // Normalize sweep to (-2PI, 2PI) and pick shorter path
  while (sweep > Math.PI) sweep -= 2 * Math.PI;
  while (sweep < -Math.PI) sweep += 2 * Math.PI;

  const pts: THREE.Vector3[] = [];
  for (let i = 0; i <= segmentCount; i++) {
    const t = i / segmentCount;
    const angle = startAngle + sweep * t;
    pts.push(
      to3D(
        plane,
        center.x + Math.cos(angle) * radius,
        center.y + Math.sin(angle) * radius
      )
    );
  }
  return pts;
}

/**
 * Renders sketch entities as 2D line overlays in the 3D scene.
 */
export function SketchOverlay({
  sketch,
  previewPoints,
  activeTool,
}: SketchOverlayProps) {
  const pointMap = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    for (const pt of sketch.points) {
      map.set(pt.id, { x: pt.x, y: pt.y });
    }
    return map;
  }, [sketch.points]);

  // Build line segments for all entities
  const linePoints = useMemo(() => {
    const segments: THREE.Vector3[][] = [];

    for (const entity of sketch.entities) {
      if (entity.type === "rectangle") {
        const origin = pointMap.get(entity.originId);
        if (!origin) continue;
        const w = typeof entity.width === "number" ? entity.width : 10;
        const h = typeof entity.height === "number" ? entity.height : 10;
        const { x, y } = origin;
        segments.push([
          to3D(sketch.plane, x, y),
          to3D(sketch.plane, x + w, y),
          to3D(sketch.plane, x + w, y + h),
          to3D(sketch.plane, x, y + h),
          to3D(sketch.plane, x, y), // close
        ]);
      } else if (entity.type === "circle") {
        const center = pointMap.get(entity.centerId);
        if (!center) continue;
        const r = typeof entity.radius === "number" ? entity.radius : 5;
        const pts: THREE.Vector3[] = [];
        const segments_count = 64;
        for (let i = 0; i <= segments_count; i++) {
          const angle = (i / segments_count) * Math.PI * 2;
          pts.push(
            to3D(
              sketch.plane,
              center.x + Math.cos(angle) * r,
              center.y + Math.sin(angle) * r
            )
          );
        }
        segments.push(pts);
      } else if (entity.type === "arc") {
        const center = pointMap.get(entity.centerId);
        const start = pointMap.get(entity.startId);
        const end = pointMap.get(entity.endId);
        if (!center || !start || !end) continue;
        const r = typeof entity.radius === "number" ? entity.radius : 5;
        const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
        const endAngle = Math.atan2(end.y - center.y, end.x - center.x);
        const pts = generateArcPoints(center, r, startAngle, endAngle, sketch.plane);
        segments.push(pts);
      } else if (entity.type === "line") {
        const start = pointMap.get(entity.startId);
        const end = pointMap.get(entity.endId);
        if (!start || !end) continue;
        segments.push([
          to3D(sketch.plane, start.x, start.y),
          to3D(sketch.plane, end.x, end.y),
        ]);
      }
    }

    return segments;
  }, [sketch, pointMap]);

  // Preview line (during drawing)
  const previewLine = useMemo(() => {
    if (!previewPoints || previewPoints.length < 2) return null;
    if (activeTool === "rectangle") {
      const [p1, p2] = previewPoints;
      return [
        to3D(sketch.plane, p1.x, p1.y),
        to3D(sketch.plane, p2.x, p1.y),
        to3D(sketch.plane, p2.x, p2.y),
        to3D(sketch.plane, p1.x, p2.y),
        to3D(sketch.plane, p1.x, p1.y),
      ];
    }
    if (activeTool === "circle") {
      const [center, edge] = previewPoints;
      const dx = edge.x - center.x;
      const dy = edge.y - center.y;
      const r = Math.sqrt(dx * dx + dy * dy);
      const pts: THREE.Vector3[] = [];
      for (let i = 0; i <= 64; i++) {
        const angle = (i / 64) * Math.PI * 2;
        pts.push(
          to3D(
            sketch.plane,
            center.x + Math.cos(angle) * r,
            center.y + Math.sin(angle) * r
          )
        );
      }
      return pts;
    }
    if (activeTool === "line") {
      return previewPoints.map((p) => to3D(sketch.plane, p.x, p.y));
    }
    if (activeTool === "arc") {
      if (previewPoints.length === 2) {
        // During second click: show line from start to cursor
        return previewPoints.map((p) => to3D(sketch.plane, p.x, p.y));
      }
      if (previewPoints.length === 3) {
        // During third click: show arc preview using circumscribed circle
        const [p1, p2, p3] = previewPoints;
        const x1 = p1.x, y1 = p1.y;
        const x2 = p2.x, y2 = p2.y;
        const x3 = p3.x, y3 = p3.y;
        const D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));
        if (Math.abs(D) < 1e-10) {
          // Degenerate (collinear) — just show a line
          return previewPoints.map((p) => to3D(sketch.plane, p.x, p.y));
        }
        const cx =
          ((x1 * x1 + y1 * y1) * (y2 - y3) +
            (x2 * x2 + y2 * y2) * (y3 - y1) +
            (x3 * x3 + y3 * y3) * (y1 - y2)) / D;
        const cy =
          ((x1 * x1 + y1 * y1) * (x3 - x2) +
            (x2 * x2 + y2 * y2) * (x1 - x3) +
            (x3 * x3 + y3 * y3) * (x2 - x1)) / D;
        const r = Math.sqrt((x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy));
        const startAngle = Math.atan2(y1 - cy, x1 - cx);
        const endAngle = Math.atan2(y2 - cy, x2 - cx);
        return generateArcPoints({ x: cx, y: cy }, r, startAngle, endAngle, sketch.plane);
      }
    }
    return null;
  }, [previewPoints, activeTool, sketch.plane]);

  return (
    <group>
      {/* Existing sketch entities */}
      {linePoints.map((pts, i) => (
        <SketchLine key={i} points={pts} color="#22d3ee" />
      ))}

      {/* Preview during drawing */}
      {previewLine && (
        <SketchLine points={previewLine} color="#f59e0b" opacity={0.7} />
      )}

      {/* Sketch points */}
      {sketch.points.map((pt) => {
        const pos = to3D(sketch.plane, pt.x, pt.y);
        return (
          <mesh key={pt.id} position={pos}>
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshBasicMaterial color="#22d3ee" />
          </mesh>
        );
      })}
    </group>
  );
}
