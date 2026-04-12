// src/cad/components/DimensionOverlay.tsx
"use client";

import { useMemo } from "react";
import { Html } from "@react-three/drei";
import type { Sketch, SketchPlane } from "../engine/types";

function sketchTo3D(plane: SketchPlane, x: number, y: number): [number, number, number] {
  switch (plane) {
    case "XY": return [x, y, 0.05];
    case "XZ": return [x, 0.05, y];
    case "YZ": return [0.05, x, y];
  }
}

interface DimensionLabel {
  position: [number, number, number];
  text: string;
}

export function DimensionOverlay({ sketch }: { sketch: Sketch }) {
  const labels = useMemo(() => {
    const result: DimensionLabel[] = [];
    const ptMap = new Map(sketch.points.map(p => [p.id, p]));

    for (const entity of sketch.entities) {
      if (entity.construction) continue;

      if (entity.type === "line") {
        const s = ptMap.get(entity.startId);
        const e = ptMap.get(entity.endId);
        if (!s || !e) continue;
        const len = Math.sqrt((e.x - s.x) ** 2 + (e.y - s.y) ** 2);
        if (len < 0.1) continue;
        // Offset the label perpendicular to the line
        const mx = (s.x + e.x) / 2;
        const my = (s.y + e.y) / 2;
        const dx = e.x - s.x;
        const dy = e.y - s.y;
        const nx = -dy / len;
        const ny = dx / len;
        result.push({
          position: sketchTo3D(sketch.plane, mx + nx * 1.2, my + ny * 1.2),
          text: `${len.toFixed(2)}`,
        });
      }

      if (entity.type === "circle") {
        const c = ptMap.get(entity.centerId);
        if (!c) continue;
        const r = typeof entity.radius === "number" ? entity.radius : parseFloat(String(entity.radius)) || 0;
        result.push({
          position: sketchTo3D(sketch.plane, c.x + r * 0.7, c.y + r * 0.7),
          text: `R ${r.toFixed(2)}`,
        });
      }

      if (entity.type === "rectangle") {
        const o = ptMap.get(entity.originId);
        if (!o) continue;
        const w = typeof entity.width === "number" ? entity.width : parseFloat(String(entity.width)) || 0;
        const h = typeof entity.height === "number" ? entity.height : parseFloat(String(entity.height)) || 0;
        // Width label (bottom edge, below)
        result.push({
          position: sketchTo3D(sketch.plane, o.x + w / 2, o.y - 1.2),
          text: `${w.toFixed(2)}`,
        });
        // Height label (left edge, left)
        result.push({
          position: sketchTo3D(sketch.plane, o.x - 1.5, o.y + h / 2),
          text: `${h.toFixed(2)}`,
        });
      }

      if (entity.type === "arc") {
        const c = ptMap.get(entity.centerId);
        if (!c) continue;
        const r = typeof entity.radius === "number" ? entity.radius : parseFloat(String(entity.radius)) || 0;
        result.push({
          position: sketchTo3D(sketch.plane, c.x, c.y + r + 1.0),
          text: `R ${r.toFixed(2)}`,
        });
      }
    }

    return result;
  }, [sketch]);

  if (labels.length === 0) return null;

  return (
    <group>
      {labels.map((label, i) => (
        <Html key={i} position={label.position} center>
          <div className="pointer-events-none rounded bg-gray-900/70 px-1.5 py-0.5 text-[10px] font-mono text-gray-400 whitespace-nowrap">
            {label.text}
          </div>
        </Html>
      ))}
    </group>
  );
}
