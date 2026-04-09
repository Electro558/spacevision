# CAD Phase 3: Professional Features Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate SpaceVision CAD from prototype to professional-grade parametric modeling tool by adding construction geometry, sketch trim/extend, sketch mirror/offset, loft, sweep, shell, patterns, measure tool, and section view.

**Architecture:** Extends existing OpenCASCADE.js worker with new OCCT operations. New sketch entity types and tools added to the existing discriminated-union type system. All new features follow the same patterns: type definition → factory function → OCCT operation → worker message → UI toolbar/properties. No new dependencies required — everything builds on OCCT and Three.js already in the project.

**Tech Stack:** Next.js 15, React 19, TypeScript, opencascade.js@beta (WASM), React Three Fiber 9, Three.js

---

## File Structure

New and modified files organized by task:

```
src/cad/
├── engine/
│   ├── types.ts                    # MODIFY: Add construction flag, new entity types, new feature types
│   ├── featureTree.ts              # MODIFY: Add factory functions for new features
│   └── sketchUtils.ts              # CREATE: Sketch geometry utilities (intersection, trim, mirror, offset)
├── worker/
│   └── occtOperations.ts           # MODIFY: Add loft, sweep, shell, pattern, mirror body operations
├── hooks/
│   └── useSketchMode.ts            # MODIFY: Add construction toggle, trim tool, mirror tool, offset tool
├── components/
│   ├── CadWorkspace.tsx            # MODIFY: Properties panel for new feature types
│   ├── SketchOverlay.tsx           # MODIFY: Render construction geometry with dashed lines
│   ├── SketchToolbar.tsx           # MODIFY: Add new tool buttons
│   ├── TopToolbar.tsx              # MODIFY: Add new feature menu items
│   ├── MeasureOverlay.tsx          # CREATE: Measure tool visualization (distance/angle labels)
│   └── SectionPlane.tsx            # CREATE: Section view clip plane visualization
├── context/
│   └── CadContext.tsx              # MODIFY: Add measure state, section state
```

---

## Chunk 1: Construction Geometry & Sketch Trim/Extend

### Task 1: Add Construction Flag to Sketch Entities

**Files:**
- Modify: `src/cad/engine/types.ts:7-44`
- Modify: `src/cad/hooks/useSketchMode.ts`
- Modify: `src/cad/components/SketchOverlay.tsx`
- Modify: `src/cad/components/SketchToolbar.tsx`
- Modify: `src/cad/worker/occtOperations.ts:26-132`

- [ ] **Step 1: Update SketchEntity types with construction flag**

In `src/cad/engine/types.ts`, add `construction?: boolean` to each entity type:

```typescript
export interface SketchLine {
  id: string;
  type: "line";
  startId: string;
  endId: string;
  construction?: boolean;
}

export interface SketchCircle {
  id: string;
  type: "circle";
  centerId: string;
  radius: number | string;
  construction?: boolean;
}

export interface SketchArc {
  id: string;
  type: "arc";
  centerId: string;
  startId: string;
  endId: string;
  radius: number | string;
  construction?: boolean;
}

export interface SketchRectangle {
  id: string;
  type: "rectangle";
  originId: string;
  width: number | string;
  height: number | string;
  construction?: boolean;
}
```

- [ ] **Step 2: Filter construction entities in wire builder**

In `src/cad/worker/occtOperations.ts`, at the start of the entity loop in `buildSketchWires` (around line 59), add:

```typescript
for (const entity of sketch.entities) {
  // Skip construction geometry — it's reference only
  if (entity.construction) continue;

  // ... existing entity handling
}
```

- [ ] **Step 3: Render construction geometry with dashed lines**

In `src/cad/components/SketchOverlay.tsx`, update the entity rendering loop (around line 97) to track which entities are construction. Then in the JSX rendering section (around line 225), use different styling:

```typescript
// In the linePoints memo, also build a parallel array:
const isConstruction: boolean[] = [];

// For each entity, push whether it's construction:
isConstruction.push(entity.construction ?? false);

// Then in rendering:
{linePoints.map((pts, i) => (
  <SketchLine
    key={i}
    points={pts}
    color={isConstruction[i] ? "#f59e0b" : "#22d3ee"}
    opacity={isConstruction[i] ? 0.5 : 1}
    dashed={isConstruction[i]}
  />
))}
```

Update the `SketchLine` component to support dashing:

```typescript
function SketchLine({ points, color, opacity = 1, dashed = false }: {
  points: THREE.Vector3[]; color: string; opacity?: number; dashed?: boolean
}) {
  const ref = useRef<THREE.BufferGeometry>(null);
  useEffect(() => {
    if (!ref.current) return;
    const positions = new Float32Array(points.flatMap((p) => [p.x, p.y, p.z]));
    ref.current.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [points]);

  return (
    <line>
      <bufferGeometry ref={ref} />
      {dashed ? (
        <lineDashedMaterial
          color={color}
          dashSize={0.5}
          gapSize={0.3}
          opacity={opacity}
          transparent={opacity < 1}
        />
      ) : (
        <lineBasicMaterial color={color} linewidth={2} opacity={opacity} transparent={opacity < 1} />
      )}
    </line>
  );
}
```

Note: For dashed materials, the line geometry needs `computeLineDistances()`. Add after setting position:
```typescript
if (dashed && ref.current) {
  const line = ref.current.parent as THREE.Line;
  if (line?.computeLineDistances) line.computeLineDistances();
}
```

- [ ] **Step 4: Add construction toggle to SketchToolbar**

In `src/cad/components/SketchToolbar.tsx`, add a construction toggle button after the tool buttons:

```typescript
// Add state for construction mode
const [constructionMode, setConstructionMode] = useState(false);

// Add toggle button after SKETCH_TOOLS map:
<button
  onClick={() => setConstructionMode(!constructionMode)}
  className={`mr-1 flex items-center gap-1 rounded px-2 py-0.5 ${
    constructionMode
      ? "bg-amber-700 text-amber-100"
      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
  }`}
  title="Toggle construction geometry (C)"
>
  <span>- - -</span>
  <span>Construction</span>
</button>
```

Dispatch a custom event so useSketchMode knows about construction mode:

```typescript
useEffect(() => {
  window.dispatchEvent(new CustomEvent("cad-construction-mode", { detail: { active: constructionMode } }));
}, [constructionMode]);
```

- [ ] **Step 5: Apply construction flag in useSketchMode**

In `src/cad/hooks/useSketchMode.ts`, listen for the construction mode event and apply to new entities:

```typescript
const constructionRef = useRef(false);

useEffect(() => {
  const handler = (e: Event) => {
    constructionRef.current = (e as CustomEvent).detail.active;
  };
  window.addEventListener("cad-construction-mode", handler);
  return () => window.removeEventListener("cad-construction-mode", handler);
}, []);
```

Then in each entity creation block (rectangle, circle, line, arc), add:
```typescript
const rect: SketchEntity = {
  id: newEntityId(),
  type: "rectangle",
  originId: originPt.id,
  width,
  height,
  construction: constructionRef.current || undefined,
};
```

Apply the same pattern to circle, line, and arc entity creation.

- [ ] **Step 6: Commit**

```bash
git add src/cad/engine/types.ts src/cad/worker/occtOperations.ts src/cad/components/SketchOverlay.tsx src/cad/components/SketchToolbar.tsx src/cad/hooks/useSketchMode.ts
git commit -m "feat(cad): add construction geometry support with dashed line rendering"
```

---

### Task 2: Sketch Geometry Utilities Module

**Files:**
- Create: `src/cad/engine/sketchUtils.ts`

- [ ] **Step 1: Create sketchUtils.ts with line-line intersection**

```typescript
// src/cad/engine/sketchUtils.ts

import type { SketchPoint, SketchEntity, Sketch } from "./types";

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Line-line intersection. Returns null if parallel.
 */
export function lineLineIntersection(
  p1: Point2D, p2: Point2D,
  p3: Point2D, p4: Point2D
): Point2D | null {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(d) < 1e-10) return null;
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
}

/**
 * Line-circle intersection. Returns 0, 1, or 2 points.
 */
export function lineCircleIntersection(
  lineStart: Point2D, lineEnd: Point2D,
  center: Point2D, radius: number
): Point2D[] {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const fx = lineStart.x - center.x;
  const fy = lineStart.y - center.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < -1e-10) return [];

  const results: Point2D[] = [];
  if (discriminant < 1e-10) {
    const t = -b / (2 * a);
    if (t >= -0.01 && t <= 1.01) {
      results.push({ x: lineStart.x + t * dx, y: lineStart.y + t * dy });
    }
  } else {
    const sqrtDisc = Math.sqrt(discriminant);
    for (const sign of [-1, 1]) {
      const t = (-b + sign * sqrtDisc) / (2 * a);
      if (t >= -0.01 && t <= 1.01) {
        results.push({ x: lineStart.x + t * dx, y: lineStart.y + t * dy });
      }
    }
  }
  return results;
}

/**
 * Circle-circle intersection. Returns 0, 1, or 2 points.
 */
export function circleCircleIntersection(
  c1: Point2D, r1: number,
  c2: Point2D, r2: number
): Point2D[] {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d > r1 + r2 + 1e-10 || d < Math.abs(r1 - r2) - 1e-10 || d < 1e-10) return [];

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h2 = r1 * r1 - a * a;
  if (h2 < -1e-10) return [];
  const h = Math.sqrt(Math.max(0, h2));

  const mx = c1.x + a * dx / d;
  const my = c1.y + a * dy / d;

  if (h < 1e-10) return [{ x: mx, y: my }];

  return [
    { x: mx + h * dy / d, y: my - h * dx / d },
    { x: mx - h * dy / d, y: my + h * dx / d },
  ];
}

/**
 * Distance from a point to a line segment.
 */
export function pointToSegmentDistance(
  point: Point2D, segStart: Point2D, segEnd: Point2D
): { distance: number; t: number; closest: Point2D } {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lenSq = dx * dx + dy * dy;

  let t = lenSq === 0 ? 0 : ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closest = { x: segStart.x + t * dx, y: segStart.y + t * dy };
  const ddx = point.x - closest.x;
  const ddy = point.y - closest.y;

  return { distance: Math.sqrt(ddx * ddx + ddy * ddy), t, closest };
}

/**
 * Distance from a point to a circle.
 */
export function pointToCircleDistance(
  point: Point2D, center: Point2D, radius: number
): number {
  const d = Math.sqrt((point.x - center.x) ** 2 + (point.y - center.y) ** 2);
  return Math.abs(d - radius);
}

/**
 * Mirror a point across a line defined by two points.
 */
export function mirrorPoint(
  point: Point2D, lineP1: Point2D, lineP2: Point2D
): Point2D {
  const dx = lineP2.x - lineP1.x;
  const dy = lineP2.y - lineP1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-10) return { ...point };

  const t = ((point.x - lineP1.x) * dx + (point.y - lineP1.y) * dy) / lenSq;
  const projX = lineP1.x + t * dx;
  const projY = lineP1.y + t * dy;

  return {
    x: 2 * projX - point.x,
    y: 2 * projY - point.y,
  };
}

/**
 * Mirror an entire sketch entity across a mirror line.
 * Returns new points and the mirrored entity.
 */
export function mirrorEntity(
  entity: SketchEntity,
  sketch: Sketch,
  mirrorLineP1: Point2D,
  mirrorLineP2: Point2D,
  newPointId: () => string,
  newEntityId: () => string
): { points: SketchPoint[]; entity: SketchEntity } {
  const pointMap = new Map<string, SketchPoint>();
  for (const p of sketch.points) {
    pointMap.set(p.id, p);
  }

  const mirroredPoints: SketchPoint[] = [];
  const idMap = new Map<string, string>(); // old point id → new point id

  function getMirroredPoint(originalId: string): string {
    if (idMap.has(originalId)) return idMap.get(originalId)!;
    const orig = pointMap.get(originalId);
    if (!orig) return originalId;
    const mirrored = mirrorPoint(orig, mirrorLineP1, mirrorLineP2);
    const newId = newPointId();
    mirroredPoints.push({ id: newId, x: mirrored.x, y: mirrored.y });
    idMap.set(originalId, newId);
    return newId;
  }

  let mirroredEntity: SketchEntity;

  switch (entity.type) {
    case "line":
      mirroredEntity = {
        id: newEntityId(),
        type: "line",
        startId: getMirroredPoint(entity.startId),
        endId: getMirroredPoint(entity.endId),
      };
      break;
    case "circle":
      mirroredEntity = {
        id: newEntityId(),
        type: "circle",
        centerId: getMirroredPoint(entity.centerId),
        radius: entity.radius,
      };
      break;
    case "arc":
      mirroredEntity = {
        id: newEntityId(),
        type: "arc",
        centerId: getMirroredPoint(entity.centerId),
        startId: getMirroredPoint(entity.endId),   // swap start/end for mirror
        endId: getMirroredPoint(entity.startId),
        radius: entity.radius,
      };
      break;
    case "rectangle":
      mirroredEntity = {
        id: newEntityId(),
        type: "rectangle",
        originId: getMirroredPoint(entity.originId),
        width: entity.width,
        height: entity.height,
      };
      break;
  }

  return { points: mirroredPoints, entity: mirroredEntity! };
}
```

- [ ] **Step 2: Commit**

```bash
git add src/cad/engine/sketchUtils.ts
git commit -m "feat(cad): add sketch geometry utilities — intersections, mirror, distance"
```

---

### Task 3: Sketch Trim Tool

**Files:**
- Modify: `src/cad/engine/types.ts:193` (add "trim" to CadTool)
- Modify: `src/cad/hooks/useSketchMode.ts`
- Modify: `src/cad/components/SketchToolbar.tsx`

- [ ] **Step 1: Add trim to CadTool type**

In `src/cad/engine/types.ts` line 193, change:
```typescript
export type CadTool = "select" | "line" | "circle" | "rectangle" | "arc" | "trim" | "mirror" | "offset";
```

- [ ] **Step 2: Add trim tool button to SketchToolbar**

In `src/cad/components/SketchToolbar.tsx`, add to the SKETCH_TOOLS array:
```typescript
{ tool: "trim" as CadTool, label: "Trim", icon: "✂" },
```

- [ ] **Step 3: Implement trim logic in useSketchMode**

The trim tool removes the segment of a line/arc that the user clicks on. In `src/cad/hooks/useSketchMode.ts`, add a new handler in `handleClick`:

```typescript
if (activeTool === "trim") {
  if (!sketch) return;
  // Find the closest entity to the click point
  const clickPt = { x, y };
  let closestEntity: SketchEntity | null = null;
  let closestDist = Infinity;

  for (const entity of sketch.entities) {
    if (entity.construction) continue;
    const dist = distanceToEntity(entity, clickPt, sketch.points);
    if (dist < closestDist && dist < 2.0) {
      closestDist = dist;
      closestEntity = entity;
    }
  }

  if (closestEntity) {
    // For lines and simple entities: just delete the clicked segment
    // For rectangles: explode into 4 lines, remove the clicked edge
    if (closestEntity.type === "rectangle") {
      // Explode rectangle into 4 lines, remove closest edge
      const origin = sketch.points.find(p => p.id === closestEntity!.originId);
      if (!origin) return;
      const w = typeof closestEntity.width === "number" ? closestEntity.width : 10;
      const h = typeof closestEntity.height === "number" ? closestEntity.height : 10;

      // Create 4 corner points
      const p1: SketchPoint = { id: newPointId(), x: origin.x, y: origin.y };
      const p2: SketchPoint = { id: newPointId(), x: origin.x + w, y: origin.y };
      const p3: SketchPoint = { id: newPointId(), x: origin.x + w, y: origin.y + h };
      const p4: SketchPoint = { id: newPointId(), x: origin.x, y: origin.y + h };

      // Create 4 lines
      const edges = [
        { start: p1, end: p2 }, // bottom
        { start: p2, end: p3 }, // right
        { start: p3, end: p4 }, // top
        { start: p4, end: p1 }, // left
      ];

      // Find which edge is closest to click
      let closestEdge = 0;
      let minEdgeDist = Infinity;
      for (let i = 0; i < edges.length; i++) {
        const d = pointToSegmentDistance(clickPt, edges[i].start, edges[i].end).distance;
        if (d < minEdgeDist) { minEdgeDist = d; closestEdge = i; }
      }

      // Create 3 lines (skip the closest edge)
      const newPoints: SketchPoint[] = [p1, p2, p3, p4];
      const newEntities: SketchEntity[] = edges
        .filter((_, i) => i !== closestEdge)
        .map(edge => ({
          id: newEntityId(),
          type: "line" as const,
          startId: edge.start.id,
          endId: edge.end.id,
        }));

      onUpdateSketch({
        ...sketch,
        points: [...sketch.points.filter(p => p.id !== closestEntity!.originId), ...newPoints],
        entities: [...sketch.entities.filter(e => e.id !== closestEntity!.id), ...newEntities],
      });
    } else {
      // For lines, circles, arcs: just remove the entity
      deleteEntity(closestEntity.id);
    }
  }
}
```

Add a helper function for distance-to-entity at the bottom of the file:

```typescript
function distanceToEntity(
  entity: SketchEntity,
  point: { x: number; y: number },
  points: SketchPoint[]
): number {
  const ptMap = new Map(points.map(p => [p.id, p]));

  switch (entity.type) {
    case "line": {
      const s = ptMap.get(entity.startId);
      const e = ptMap.get(entity.endId);
      if (!s || !e) return Infinity;
      return pointToSegmentDistance(point, s, e).distance;
    }
    case "circle": {
      const c = ptMap.get(entity.centerId);
      if (!c) return Infinity;
      const r = typeof entity.radius === "number" ? entity.radius : 5;
      return pointToCircleDistance(point, c, r);
    }
    case "rectangle": {
      const o = ptMap.get(entity.originId);
      if (!o) return Infinity;
      const w = typeof entity.width === "number" ? entity.width : 10;
      const h = typeof entity.height === "number" ? entity.height : 10;
      const edges = [
        [o, { x: o.x + w, y: o.y }],
        [{ x: o.x + w, y: o.y }, { x: o.x + w, y: o.y + h }],
        [{ x: o.x + w, y: o.y + h }, { x: o.x, y: o.y + h }],
        [{ x: o.x, y: o.y + h }, o],
      ] as [Point2D, Point2D][];
      return Math.min(...edges.map(([a, b]) => pointToSegmentDistance(point, a, b).distance));
    }
    case "arc": {
      const c = ptMap.get(entity.centerId);
      if (!c) return Infinity;
      const r = typeof entity.radius === "number" ? entity.radius : 5;
      return pointToCircleDistance(point, c, r);
    }
  }
}
```

Import `pointToSegmentDistance` and `pointToCircleDistance` from `../engine/sketchUtils`.

- [ ] **Step 4: Commit**

```bash
git add src/cad/engine/types.ts src/cad/hooks/useSketchMode.ts src/cad/components/SketchToolbar.tsx
git commit -m "feat(cad): add sketch trim tool — removes clicked entity segments"
```

---

### Task 4: Sketch Mirror Tool

**Files:**
- Modify: `src/cad/hooks/useSketchMode.ts`
- Modify: `src/cad/components/SketchToolbar.tsx`

- [ ] **Step 1: Add mirror tool button**

In `src/cad/components/SketchToolbar.tsx` SKETCH_TOOLS array:
```typescript
{ tool: "mirror" as CadTool, label: "Mirror", icon: "⟺" },
```

- [ ] **Step 2: Implement mirror tool in useSketchMode**

Mirror tool: Click 2 points to define mirror line, then all entities get duplicated across the line.

```typescript
if (activeTool === "mirror") {
  if (!startPointRef.current) {
    // First click: start of mirror line
    startPointRef.current = { x, y };
    setState(prev => ({ ...prev, isDrawing: true, currentPoints: [{ x, y }] }));
  } else {
    // Second click: end of mirror line — mirror all entities
    const p1 = startPointRef.current;
    const p2 = { x, y };

    if (Math.abs(p1.x - p2.x) > 0.01 || Math.abs(p1.y - p2.y) > 0.01) {
      let newPoints = [...sketch.points];
      let newEntities = [...sketch.entities];

      for (const entity of sketch.entities) {
        const result = mirrorEntity(entity, sketch, p1, p2, newPointId, newEntityId);
        newPoints = [...newPoints, ...result.points];
        newEntities = [...newEntities, result.entity];
      }

      onUpdateSketch({ ...sketch, points: newPoints, entities: newEntities });
    }

    startPointRef.current = null;
    setState({ isDrawing: false, currentPoints: [], previewEntity: null, selectedEntityIds: new Set() });
  }
}
```

Import `mirrorEntity` from `../engine/sketchUtils`.

- [ ] **Step 3: Add mirror line preview in handleMouseMove**

```typescript
if (activeTool === "mirror") {
  setState(prev => ({
    ...prev,
    currentPoints: [startPointRef.current!, { x, y }],
  }));
  return;
}
```

- [ ] **Step 4: Commit**

```bash
git add src/cad/hooks/useSketchMode.ts src/cad/components/SketchToolbar.tsx
git commit -m "feat(cad): add sketch mirror tool — reflects entities across a line"
```

---

### Task 5: Sketch Offset Tool

**Files:**
- Modify: `src/cad/hooks/useSketchMode.ts`
- Modify: `src/cad/components/SketchToolbar.tsx`

- [ ] **Step 1: Add offset tool button**

```typescript
{ tool: "offset" as CadTool, label: "Offset", icon: "⟐" },
```

- [ ] **Step 2: Implement offset tool**

Offset tool: Click an entity, then drag to set offset distance. Creates a parallel copy.

```typescript
if (activeTool === "offset") {
  if (!sketch) return;

  // Find closest entity
  const clickPt = { x, y };
  let closestEntity: SketchEntity | null = null;
  let closestDist = Infinity;

  for (const entity of sketch.entities) {
    const dist = distanceToEntity(entity, clickPt, sketch.points);
    if (dist < closestDist && dist < 5.0) {
      closestDist = dist;
      closestEntity = entity;
    }
  }

  if (!closestEntity) return;

  // Offset based on entity type
  const ptMap = new Map(sketch.points.map(p => [p.id, p]));
  let newPoints: SketchPoint[] = [];
  let newEntity: SketchEntity | null = null;

  if (closestEntity.type === "circle") {
    const c = ptMap.get(closestEntity.centerId);
    if (!c) return;
    const r = typeof closestEntity.radius === "number" ? closestEntity.radius : 5;
    const distFromCenter = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2);
    const newRadius = distFromCenter; // Offset to where user clicked
    if (Math.abs(newRadius - r) > 0.1) {
      const newCenter: SketchPoint = { id: newPointId(), x: c.x, y: c.y };
      newPoints = [newCenter];
      newEntity = {
        id: newEntityId(),
        type: "circle",
        centerId: newCenter.id,
        radius: newRadius,
      };
    }
  } else if (closestEntity.type === "rectangle") {
    const o = ptMap.get(closestEntity.originId);
    if (!o) return;
    const w = typeof closestEntity.width === "number" ? closestEntity.width : 10;
    const h = typeof closestEntity.height === "number" ? closestEntity.height : 10;

    // Determine offset direction (inward/outward) based on click position
    const cx = o.x + w / 2;
    const cy = o.y + h / 2;
    const dx = x - cx;
    const dy = y - cy;
    const offsetDist = Math.max(Math.abs(dx) - w / 2, Math.abs(dy) - h / 2);
    const sign = offsetDist > 0 ? 1 : -1;
    const dist = Math.abs(closestDist) * sign;

    const newOrigin: SketchPoint = { id: newPointId(), x: o.x - dist, y: o.y - dist };
    newPoints = [newOrigin];
    newEntity = {
      id: newEntityId(),
      type: "rectangle",
      originId: newOrigin.id,
      width: w + 2 * dist,
      height: h + 2 * dist,
    };
  } else if (closestEntity.type === "line") {
    const s = ptMap.get(closestEntity.startId);
    const e = ptMap.get(closestEntity.endId);
    if (!s || !e) return;
    // Offset perpendicular to line
    const ldx = e.x - s.x;
    const ldy = e.y - s.y;
    const len = Math.sqrt(ldx * ldx + ldy * ldy);
    if (len < 0.01) return;
    const nx = -ldy / len;
    const ny = ldx / len;
    // Determine side: dot product of click offset with normal
    const side = (x - s.x) * nx + (y - s.y) * ny > 0 ? 1 : -1;
    const dist = closestDist * side;

    const ns: SketchPoint = { id: newPointId(), x: s.x + nx * dist, y: s.y + ny * dist };
    const ne: SketchPoint = { id: newPointId(), x: e.x + nx * dist, y: e.y + ny * dist };
    newPoints = [ns, ne];
    newEntity = { id: newEntityId(), type: "line", startId: ns.id, endId: ne.id };
  }

  if (newEntity) {
    onUpdateSketch({
      ...sketch,
      points: [...sketch.points, ...newPoints],
      entities: [...sketch.entities, newEntity],
    });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/cad/hooks/useSketchMode.ts src/cad/components/SketchToolbar.tsx
git commit -m "feat(cad): add sketch offset tool — creates parallel entity copies"
```

---

## Chunk 2: New Solid Operations (Loft, Sweep, Shell, Pattern, Mirror Body)

### Task 6: Add New Feature Types

**Files:**
- Modify: `src/cad/engine/types.ts`
- Modify: `src/cad/engine/featureTree.ts`

- [ ] **Step 1: Add new feature interfaces to types.ts**

After the existing ChamferFeature interface (around line 113):

```typescript
export interface LoftFeature {
  id: string;
  type: "loft";
  name: string;
  suppressed: boolean;
  sketchIds: string[];      // 2+ sketches to blend between
  solid: boolean;           // true = solid loft, false = surface
  operation: "add" | "cut";
}

export interface SweepFeature {
  id: string;
  type: "sweep";
  name: string;
  suppressed: boolean;
  profileSketchId: string;  // sketch with the profile to sweep
  pathSketchId: string;     // sketch with the sweep path (a line/arc/spline)
  operation: "add" | "cut";
}

export interface ShellFeature {
  id: string;
  type: "shell";
  name: string;
  suppressed: boolean;
  thickness: number | string;
  // Empty = shell all faces (hollow box). Future: face selection.
  removeFaceIds: string[];
}

export interface LinearPatternFeature {
  id: string;
  type: "linearPattern";
  name: string;
  suppressed: boolean;
  sourceFeatureId: string;
  direction: "x" | "y" | "z";
  count: number;
  spacing: number | string;
}

export interface CircularPatternFeature {
  id: string;
  type: "circularPattern";
  name: string;
  suppressed: boolean;
  sourceFeatureId: string;
  axis: "x" | "y" | "z";
  count: number;
  angle: number | string;   // total angle span (360 = full circle)
}

export interface MirrorBodyFeature {
  id: string;
  type: "mirrorBody";
  name: string;
  suppressed: boolean;
  plane: "XY" | "XZ" | "YZ";
}
```

Update the Feature union:
```typescript
export type Feature =
  | SketchFeature
  | ExtrudeFeature
  | RevolveFeature
  | FilletFeature
  | ChamferFeature
  | LoftFeature
  | SweepFeature
  | ShellFeature
  | LinearPatternFeature
  | CircularPatternFeature
  | MirrorBodyFeature;
```

- [ ] **Step 2: Add factory functions to featureTree.ts**

```typescript
export function createLoft(sketchIds: string[]): LoftFeature {
  return {
    id: newFeatureId(),
    type: "loft",
    name: `Loft ${Date.now() % 1000}`,
    suppressed: false,
    sketchIds,
    solid: true,
    operation: "add",
  };
}

export function createSweep(profileSketchId: string, pathSketchId: string): SweepFeature {
  return {
    id: newFeatureId(),
    type: "sweep",
    name: `Sweep ${Date.now() % 1000}`,
    suppressed: false,
    profileSketchId,
    pathSketchId,
    operation: "add",
  };
}

export function createShell(thickness: number = 1): ShellFeature {
  return {
    id: newFeatureId(),
    type: "shell",
    name: `Shell ${Date.now() % 1000}`,
    suppressed: false,
    thickness,
    removeFaceIds: [],
  };
}

export function createLinearPattern(sourceFeatureId: string, direction: "x" | "y" | "z" = "x", count: number = 3, spacing: number = 10): LinearPatternFeature {
  return {
    id: newFeatureId(),
    type: "linearPattern",
    name: `Linear Pattern ${Date.now() % 1000}`,
    suppressed: false,
    sourceFeatureId,
    direction,
    count,
    spacing,
  };
}

export function createCircularPattern(sourceFeatureId: string, axis: "x" | "y" | "z" = "z", count: number = 6, angle: number = 360): CircularPatternFeature {
  return {
    id: newFeatureId(),
    type: "circularPattern",
    name: `Circular Pattern ${Date.now() % 1000}`,
    suppressed: false,
    sourceFeatureId,
    axis,
    count,
    angle,
  };
}

export function createMirrorBody(plane: "XY" | "XZ" | "YZ" = "XY"): MirrorBodyFeature {
  return {
    id: newFeatureId(),
    type: "mirrorBody",
    name: `Mirror ${Date.now() % 1000}`,
    suppressed: false,
    plane,
  };
}
```

Update `removeFeature` to cascade loft/sweep references:
```typescript
export function removeFeature(features: Feature[], featureId: string): Feature[] {
  const remaining = features.filter((f) => f.id !== featureId);
  return remaining.filter((f) => {
    if (f.type === "extrude" && f.sketchId === featureId) return false;
    if (f.type === "revolve" && f.sketchId === featureId) return false;
    if (f.type === "sweep" && (f.profileSketchId === featureId || f.pathSketchId === featureId)) return false;
    if (f.type === "loft" && f.sketchIds.includes(featureId)) return false;
    if (f.type === "linearPattern" && f.sourceFeatureId === featureId) return false;
    if (f.type === "circularPattern" && f.sourceFeatureId === featureId) return false;
    return true;
  });
}
```

- [ ] **Step 3: Commit**

```bash
git add src/cad/engine/types.ts src/cad/engine/featureTree.ts
git commit -m "feat(cad): add types and factories for loft, sweep, shell, pattern, mirror body"
```

---

### Task 7: Implement OCCT Operations for New Features

**Files:**
- Modify: `src/cad/worker/occtOperations.ts`

- [ ] **Step 1: Add performLoft**

```typescript
export function performLoft(
  oc: any,
  sketches: SketchFeature[],
  loft: LoftFeature,
  parameters: Record<string, Parameter>,
  currentShape: any | null
): any {
  if (sketches.length < 2) {
    throw new Error(`Loft "${loft.name}" requires at least 2 sketches`);
  }

  const loftBuilder = new oc.BRepOffsetAPI_ThruSections_1(loft.solid, false, 1e-6);

  for (const sketchFeature of sketches) {
    const wires = buildSketchWires(oc, sketchFeature.sketch, parameters);
    if (wires.length === 0) {
      throw new Error(`Loft sketch "${sketchFeature.name}" has no closed profiles`);
    }
    loftBuilder.AddWire(wires[0]);
  }

  loftBuilder.Build(new oc.Message_ProgressRange_1());
  let loftShape = loftBuilder.Shape();

  if (currentShape && loft.operation === "add") {
    const fuse = new oc.BRepAlgoAPI_Fuse_3(currentShape, loftShape, new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    return fuse.Shape();
  } else if (currentShape && loft.operation === "cut") {
    const cut = new oc.BRepAlgoAPI_Cut_3(currentShape, loftShape, new oc.Message_ProgressRange_1());
    cut.Build(new oc.Message_ProgressRange_1());
    return cut.Shape();
  }
  return loftShape;
}
```

- [ ] **Step 2: Add performSweep**

```typescript
export function performSweep(
  oc: any,
  profileSketch: SketchFeature,
  pathSketch: SketchFeature,
  sweep: SweepFeature,
  parameters: Record<string, Parameter>,
  currentShape: any | null
): any {
  const profileWires = buildSketchWires(oc, profileSketch.sketch, parameters);
  if (profileWires.length === 0) {
    throw new Error(`Sweep profile sketch "${profileSketch.name}" has no closed profiles`);
  }

  const pathWires = buildSketchWires(oc, pathSketch.sketch, parameters);
  if (pathWires.length === 0) {
    throw new Error(`Sweep path sketch "${pathSketch.name}" has no path curves`);
  }

  const profile = profileWires[0];
  const path = pathWires[0];

  const pipe = new oc.BRepOffsetAPI_MakePipe_1(path, new oc.BRepBuilderAPI_MakeFace_15(profile, true).Face());
  pipe.Build(new oc.Message_ProgressRange_1());
  let sweepShape = pipe.Shape();

  if (currentShape && sweep.operation === "add") {
    const fuse = new oc.BRepAlgoAPI_Fuse_3(currentShape, sweepShape, new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    return fuse.Shape();
  } else if (currentShape && sweep.operation === "cut") {
    const cut = new oc.BRepAlgoAPI_Cut_3(currentShape, sweepShape, new oc.Message_ProgressRange_1());
    cut.Build(new oc.Message_ProgressRange_1());
    return cut.Shape();
  }
  return sweepShape;
}
```

- [ ] **Step 3: Add performShell**

```typescript
export function performShell(
  oc: any,
  shell: ShellFeature,
  parameters: Record<string, Parameter>,
  currentShape: any
): any {
  if (!currentShape) {
    throw new Error(`Shell "${shell.name}" requires an existing solid shape`);
  }

  const thickness = resolveValue(shell.thickness, parameters);

  // Get all faces, remove the top face (largest Z normal) as default
  const facesToRemove = new oc.TopTools_ListOfShape_1();

  if (shell.removeFaceIds.length === 0) {
    // Auto-detect: remove the face with highest centroid Z (or Y/X depending on orientation)
    let bestFace: any = null;
    let bestZ = -Infinity;
    const explorer = new oc.TopExp_Explorer_2(
      currentShape,
      oc.TopAbs_ShapeEnum.TopAbs_FACE,
      oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );
    while (explorer.More()) {
      const face = oc.TopoDS.Face_1(explorer.Current());
      // Get face centroid via GProp
      const props = new oc.GProp_GProps_1();
      oc.BRepGProp.SurfaceProperties_1(face, props, 1e-6, false);
      const centroid = props.CentreOfMass();
      const z = centroid.Z();
      if (z > bestZ) {
        bestZ = z;
        bestFace = face;
      }
      explorer.Next();
    }
    if (bestFace) {
      facesToRemove.Append_1(bestFace);
    }
  }

  const shellMaker = new oc.BRepOffsetAPI_MakeThickSolid();
  shellMaker.MakeThickSolidByJoin(
    currentShape,
    facesToRemove,
    -thickness, // negative = inward offset
    1e-3,
    oc.BRepOffset_Mode.BRepOffset_Skin,
    false,
    false,
    oc.GeomAbs_JoinType.GeomAbs_Arc,
    false,
    new oc.Message_ProgressRange_1()
  );
  shellMaker.Build(new oc.Message_ProgressRange_1());
  return shellMaker.Shape();
}
```

- [ ] **Step 4: Add performLinearPattern**

```typescript
export function performLinearPattern(
  oc: any,
  pattern: LinearPatternFeature,
  parameters: Record<string, Parameter>,
  currentShape: any
): any {
  if (!currentShape) {
    throw new Error(`Linear Pattern "${pattern.name}" requires an existing solid shape`);
  }

  const spacing = resolveValue(pattern.spacing, parameters);
  let resultShape = currentShape;

  let dx = 0, dy = 0, dz = 0;
  switch (pattern.direction) {
    case "x": dx = spacing; break;
    case "y": dy = spacing; break;
    case "z": dz = spacing; break;
  }

  for (let i = 1; i < pattern.count; i++) {
    const trsf = new oc.gp_Trsf_1();
    trsf.SetTranslation_1(new oc.gp_Vec_4(dx * i, dy * i, dz * i));
    const transform = new oc.BRepBuilderAPI_Transform_2(currentShape, trsf, true);
    transform.Build(new oc.Message_ProgressRange_1());
    const copy = transform.Shape();

    const fuse = new oc.BRepAlgoAPI_Fuse_3(resultShape, copy, new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    resultShape = fuse.Shape();
  }

  return resultShape;
}
```

- [ ] **Step 5: Add performCircularPattern**

```typescript
export function performCircularPattern(
  oc: any,
  pattern: CircularPatternFeature,
  parameters: Record<string, Parameter>,
  currentShape: any
): any {
  if (!currentShape) {
    throw new Error(`Circular Pattern "${pattern.name}" requires an existing solid shape`);
  }

  const totalAngle = resolveValue(pattern.angle, parameters);
  const angleStep = (totalAngle / pattern.count) * Math.PI / 180;

  let axisDir: any;
  switch (pattern.axis) {
    case "x": axisDir = new oc.gp_Dir_4(1, 0, 0); break;
    case "y": axisDir = new oc.gp_Dir_4(0, 1, 0); break;
    case "z": axisDir = new oc.gp_Dir_4(0, 0, 1); break;
  }
  const origin = new oc.gp_Pnt_3(0, 0, 0);
  const axis = new oc.gp_Ax1_2(origin, axisDir);

  let resultShape = currentShape;

  for (let i = 1; i < pattern.count; i++) {
    const trsf = new oc.gp_Trsf_1();
    trsf.SetRotation_1(axis, angleStep * i);
    const transform = new oc.BRepBuilderAPI_Transform_2(currentShape, trsf, true);
    transform.Build(new oc.Message_ProgressRange_1());
    const copy = transform.Shape();

    const fuse = new oc.BRepAlgoAPI_Fuse_3(resultShape, copy, new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    resultShape = fuse.Shape();
  }

  return resultShape;
}
```

- [ ] **Step 6: Add performMirrorBody**

```typescript
export function performMirrorBody(
  oc: any,
  mirror: MirrorBodyFeature,
  currentShape: any
): any {
  if (!currentShape) {
    throw new Error(`Mirror Body "${mirror.name}" requires an existing solid shape`);
  }

  const trsf = new oc.gp_Trsf_1();
  let mirrorAxis: any;
  const origin = new oc.gp_Pnt_3(0, 0, 0);

  switch (mirror.plane) {
    case "XY":
      mirrorAxis = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(0, 0, 1));
      break;
    case "XZ":
      mirrorAxis = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(0, 1, 0));
      break;
    case "YZ":
      mirrorAxis = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(1, 0, 0));
      break;
  }

  trsf.SetMirror_3(mirrorAxis);
  const transform = new oc.BRepBuilderAPI_Transform_2(currentShape, trsf, true);
  transform.Build(new oc.Message_ProgressRange_1());
  const mirroredShape = transform.Shape();

  const fuse = new oc.BRepAlgoAPI_Fuse_3(currentShape, mirroredShape, new oc.Message_ProgressRange_1());
  fuse.Build(new oc.Message_ProgressRange_1());
  return fuse.Shape();
}
```

- [ ] **Step 7: Update rebuildFromFeatureTree to dispatch new types**

Add after the existing chamfer handler (around line 520):

```typescript
if (feature.type === "loft") {
  const sketches = feature.sketchIds
    .map(id => sketchMap.get(id))
    .filter((s): s is SketchFeature => !!s);
  currentShape = performLoft(oc, sketches, feature, parameters, currentShape);
}

if (feature.type === "sweep") {
  const profileSketch = sketchMap.get(feature.profileSketchId);
  const pathSketch = sketchMap.get(feature.pathSketchId);
  if (!profileSketch || !pathSketch) {
    throw new Error(`Sweep "${feature.name}" references missing sketches`);
  }
  currentShape = performSweep(oc, profileSketch, pathSketch, feature, parameters, currentShape);
}

if (feature.type === "shell") {
  currentShape = performShell(oc, feature, parameters, currentShape);
}

if (feature.type === "linearPattern") {
  currentShape = performLinearPattern(oc, feature, parameters, currentShape);
}

if (feature.type === "circularPattern") {
  currentShape = performCircularPattern(oc, feature, parameters, currentShape);
}

if (feature.type === "mirrorBody") {
  currentShape = performMirrorBody(oc, feature, currentShape);
}
```

- [ ] **Step 8: Commit**

```bash
git add src/cad/worker/occtOperations.ts
git commit -m "feat(cad): add OCCT operations for loft, sweep, shell, pattern, mirror body"
```

---

### Task 8: Wire New Features into UI (Toolbar + Properties)

**Files:**
- Modify: `src/cad/components/TopToolbar.tsx`
- Modify: `src/cad/components/CadWorkspace.tsx`

- [ ] **Step 1: Add handlers and menu items in TopToolbar.tsx**

Add imports at top:
```typescript
import {
  createSketch, createExtrude, createRevolve, createFillet, createChamfer,
  createLoft, createSweep, createShell, createLinearPattern, createCircularPattern, createMirrorBody,
} from "../engine/featureTree";
```

Add handlers:
```typescript
const handleLoft = () => {
  const sketches = cad.project.features.filter(f => f.type === "sketch" && !f.suppressed);
  if (sketches.length < 2) {
    alert("Loft requires at least 2 sketches. Create more sketches first.");
    return;
  }
  const sketchIds = sketches.slice(-2).map(s => s.id);
  const loft = createLoft(sketchIds);
  cad.addFeature(loft);
  cad.setSelectedFeatureId(loft.id);
  setOpenMenu(null);
};

const handleSweep = () => {
  const sketches = cad.project.features.filter(f => f.type === "sketch" && !f.suppressed);
  if (sketches.length < 2) {
    alert("Sweep requires a profile sketch and a path sketch. Create at least 2 sketches.");
    return;
  }
  const sweep = createSweep(sketches[sketches.length - 2].id, sketches[sketches.length - 1].id);
  cad.addFeature(sweep);
  cad.setSelectedFeatureId(sweep.id);
  setOpenMenu(null);
};

const handleShell = () => {
  const hasSolid = cad.project.features.some(
    f => (f.type === "extrude" || f.type === "revolve" || f.type === "loft" || f.type === "sweep") && !f.suppressed
  );
  if (!hasSolid) {
    alert("Shell requires an existing solid. Create an Extrude, Revolve, Loft, or Sweep first.");
    return;
  }
  const shell = createShell(1);
  cad.addFeature(shell);
  cad.setSelectedFeatureId(shell.id);
  setOpenMenu(null);
};

const handleLinearPattern = () => {
  const lastSolid = cad.project.features.filter(f => f.type !== "sketch" && !f.suppressed).pop();
  if (!lastSolid) {
    alert("Pattern requires an existing feature.");
    return;
  }
  const pattern = createLinearPattern(lastSolid.id);
  cad.addFeature(pattern);
  cad.setSelectedFeatureId(pattern.id);
  setOpenMenu(null);
};

const handleCircularPattern = () => {
  const lastSolid = cad.project.features.filter(f => f.type !== "sketch" && !f.suppressed).pop();
  if (!lastSolid) {
    alert("Pattern requires an existing feature.");
    return;
  }
  const pattern = createCircularPattern(lastSolid.id);
  cad.addFeature(pattern);
  cad.setSelectedFeatureId(pattern.id);
  setOpenMenu(null);
};

const handleMirrorBody = () => {
  const hasSolid = cad.project.features.some(f => f.type !== "sketch" && !f.suppressed);
  if (!hasSolid) {
    alert("Mirror requires an existing solid.");
    return;
  }
  const mirror = createMirrorBody("XY");
  cad.addFeature(mirror);
  cad.setSelectedFeatureId(mirror.id);
  setOpenMenu(null);
};
```

Update the Features menu items array:
```typescript
{
  id: "features",
  label: "Features",
  items: [
    { label: "Extrude", action: handleExtrude, shortcut: "E" },
    { label: "Revolve", action: handleRevolve, shortcut: "R" },
    { label: "Loft", action: handleLoft },
    { label: "Sweep", action: handleSweep },
    { label: "─────────", action: () => {} },  // separator
    { label: "Fillet", action: handleFillet },
    { label: "Chamfer", action: handleChamfer },
    { label: "Shell", action: handleShell },
    { label: "─────────", action: () => {} },  // separator
    { label: "Linear Pattern", action: handleLinearPattern },
    { label: "Circular Pattern", action: handleCircularPattern },
    { label: "Mirror Body", action: handleMirrorBody },
  ],
},
```

- [ ] **Step 2: Add properties panels for new features in CadWorkspace.tsx**

After the existing chamfer properties block, add:

```typescript
{feature.type === "loft" && (
  <div className="space-y-1.5">
    <div className="flex justify-between text-gray-400">
      <span>Profiles</span><span className="text-green-400">{feature.sketchIds.length} sketches</span>
    </div>
    <div>
      <label className="text-gray-500">Solid</label>
      <select
        className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
        value={feature.solid ? "true" : "false"}
        onChange={(e) => cad.updateFeature(feature.id, { solid: e.target.value === "true" })}
      >
        <option value="true">Solid</option>
        <option value="false">Surface</option>
      </select>
    </div>
    <div>
      <label className="text-gray-500">Operation</label>
      <select
        className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
        value={feature.operation}
        onChange={(e) => cad.updateFeature(feature.id, { operation: e.target.value as any })}
      >
        <option value="add">Add (Union)</option>
        <option value="cut">Cut (Subtract)</option>
      </select>
    </div>
  </div>
)}
{feature.type === "sweep" && (
  <div className="space-y-1.5">
    <div className="flex justify-between text-gray-400">
      <span>Profile</span><span className="text-green-400">Sketch</span>
    </div>
    <div className="flex justify-between text-gray-400">
      <span>Path</span><span className="text-green-400">Sketch</span>
    </div>
    <div>
      <label className="text-gray-500">Operation</label>
      <select
        className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
        value={feature.operation}
        onChange={(e) => cad.updateFeature(feature.id, { operation: e.target.value as any })}
      >
        <option value="add">Add (Union)</option>
        <option value="cut">Cut (Subtract)</option>
      </select>
    </div>
  </div>
)}
{feature.type === "shell" && (
  <div className="space-y-1.5">
    <div>
      <label className="text-gray-500">Wall Thickness</label>
      <input
        type="number"
        step="0.1"
        className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
        value={typeof feature.thickness === 'number' ? feature.thickness : ''}
        onChange={(e) => cad.updateFeature(feature.id, { thickness: parseFloat(e.target.value) || 0 })}
      />
    </div>
  </div>
)}
{feature.type === "linearPattern" && (
  <div className="space-y-1.5">
    <div>
      <label className="text-gray-500">Count</label>
      <input
        type="number"
        min="2"
        className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
        value={feature.count}
        onChange={(e) => cad.updateFeature(feature.id, { count: parseInt(e.target.value) || 2 })}
      />
    </div>
    <div>
      <label className="text-gray-500">Spacing</label>
      <input
        type="number"
        step="0.5"
        className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
        value={typeof feature.spacing === 'number' ? feature.spacing : ''}
        onChange={(e) => cad.updateFeature(feature.id, { spacing: parseFloat(e.target.value) || 0 })}
      />
    </div>
    <div>
      <label className="text-gray-500">Direction</label>
      <select
        className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
        value={feature.direction}
        onChange={(e) => cad.updateFeature(feature.id, { direction: e.target.value as any })}
      >
        <option value="x">X Axis</option>
        <option value="y">Y Axis</option>
        <option value="z">Z Axis</option>
      </select>
    </div>
  </div>
)}
{feature.type === "circularPattern" && (
  <div className="space-y-1.5">
    <div>
      <label className="text-gray-500">Count</label>
      <input
        type="number"
        min="2"
        className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
        value={feature.count}
        onChange={(e) => cad.updateFeature(feature.id, { count: parseInt(e.target.value) || 2 })}
      />
    </div>
    <div>
      <label className="text-gray-500">Angle (total)</label>
      <input
        type="number"
        className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
        value={typeof feature.angle === 'number' ? feature.angle : ''}
        onChange={(e) => cad.updateFeature(feature.id, { angle: parseFloat(e.target.value) || 360 })}
      />
    </div>
    <div>
      <label className="text-gray-500">Axis</label>
      <select
        className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
        value={feature.axis}
        onChange={(e) => cad.updateFeature(feature.id, { axis: e.target.value as any })}
      >
        <option value="x">X Axis</option>
        <option value="y">Y Axis</option>
        <option value="z">Z Axis</option>
      </select>
    </div>
  </div>
)}
{feature.type === "mirrorBody" && (
  <div className="space-y-1.5">
    <div>
      <label className="text-gray-500">Mirror Plane</label>
      <select
        className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
        value={feature.plane}
        onChange={(e) => cad.updateFeature(feature.id, { plane: e.target.value as any })}
      >
        <option value="XY">XY Plane</option>
        <option value="XZ">XZ Plane</option>
        <option value="YZ">YZ Plane</option>
      </select>
    </div>
  </div>
)}
```

Update feature tree icons:
```typescript
{feature.type === "sketch" ? "✏" : feature.type === "extrude" ? "⬆" : feature.type === "revolve" ? "↻" : feature.type === "fillet" ? "◠" : feature.type === "chamfer" ? "◇" : feature.type === "loft" ? "⋈" : feature.type === "sweep" ? "↝" : feature.type === "shell" ? "☐" : feature.type === "linearPattern" ? "⫼" : feature.type === "circularPattern" ? "◎" : feature.type === "mirrorBody" ? "⟺" : "●"} {feature.name}
```

- [ ] **Step 3: Commit**

```bash
git add src/cad/components/TopToolbar.tsx src/cad/components/CadWorkspace.tsx
git commit -m "feat(cad): wire loft/sweep/shell/pattern/mirror into UI menus and properties"
```

---

## Chunk 3: Measure Tool & Section View

### Task 9: Measure Tool

**Files:**
- Create: `src/cad/components/MeasureOverlay.tsx`
- Modify: `src/cad/engine/types.ts` (add measure state)
- Modify: `src/cad/hooks/useCadProject.ts` (add measure state)
- Modify: `src/cad/context/CadContext.tsx` (expose measure)
- Modify: `src/cad/components/CadViewport.tsx` (integrate measure)
- Modify: `src/cad/components/TopToolbar.tsx` (add View > Measure)

- [ ] **Step 1: Add measure state types**

In `src/cad/engine/types.ts`, add after CadUIState:
```typescript
export interface MeasureResult {
  type: "distance" | "angle";
  value: number;
  unit: string;
  points: [{ x: number; y: number; z: number }, { x: number; y: number; z: number }];
}
```

- [ ] **Step 2: Create MeasureOverlay.tsx**

```typescript
// src/cad/components/MeasureOverlay.tsx
"use client";

import { useRef, useEffect, useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import type { MeasureResult } from "../engine/types";

function MeasureLine({ result }: { result: MeasureResult }) {
  const ref = useRef<THREE.BufferGeometry>(null);
  const [p1, p2] = result.points;

  useEffect(() => {
    if (!ref.current) return;
    const positions = new Float32Array([p1.x, p1.y, p1.z, p2.x, p2.y, p2.z]);
    ref.current.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  }, [p1, p2]);

  const midpoint = useMemo(
    () => new THREE.Vector3((p1.x + p2.x) / 2, (p1.y + p2.y) / 2, (p1.z + p2.z) / 2),
    [p1, p2]
  );

  return (
    <group>
      <line>
        <bufferGeometry ref={ref} />
        <lineBasicMaterial color="#f59e0b" linewidth={2} />
      </line>
      {/* Endpoint markers */}
      <mesh position={[p1.x, p1.y, p1.z]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      <mesh position={[p2.x, p2.y, p2.z]}>
        <sphereGeometry args={[0.2, 8, 8]} />
        <meshBasicMaterial color="#f59e0b" />
      </mesh>
      {/* Label */}
      <Html position={midpoint} center>
        <div className="rounded bg-gray-900/90 px-2 py-1 text-xs font-mono text-amber-300 whitespace-nowrap">
          {result.value.toFixed(2)} {result.unit}
        </div>
      </Html>
    </group>
  );
}

export function MeasureOverlay({ results }: { results: MeasureResult[] }) {
  return (
    <group>
      {results.map((result, i) => (
        <MeasureLine key={i} result={result} />
      ))}
    </group>
  );
}
```

- [ ] **Step 3: Add measure mode to CadViewport**

In `src/cad/components/CadViewport.tsx`, add a measure click handler that records two click points on the 3D geometry and computes distance:

```typescript
// Inside CadScene, add state for measure mode
const [measurePoints, setMeasurePoints] = useState<THREE.Vector3[]>([]);

// Add measure click handler
useEffect(() => {
  if (cad.uiState.viewMode !== "measure") return;
  const canvas = gl.domElement;

  const handleMeasureClick = (e: MouseEvent) => {
    const rect = canvas.getBoundingClientRect();
    const mouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(mouse, camera);

    // Raycast against meshes in the scene
    const meshes: THREE.Object3D[] = [];
    scene.traverse(obj => { if ((obj as THREE.Mesh).isMesh) meshes.push(obj); });
    const intersects = raycaster.intersectObjects(meshes);

    if (intersects.length > 0) {
      const pt = intersects[0].point;
      setMeasurePoints(prev => {
        if (prev.length >= 2) return [pt]; // Reset after 2 points
        return [...prev, pt];
      });
    }
  };

  canvas.addEventListener("click", handleMeasureClick);
  return () => canvas.removeEventListener("click", handleMeasureClick);
}, [cad.uiState.viewMode, camera, gl, scene]);
```

Add the MeasureOverlay to the scene with computed results.

- [ ] **Step 4: Add View > Measure toggle in TopToolbar**

Add to the View menu items:
```typescript
{ label: "Measure Distance", action: () => { cad.setViewMode("measure" as any); setOpenMenu(null); } },
```

Update ViewMode type in types.ts:
```typescript
export type ViewMode = "shaded" | "wireframe" | "xray" | "measure";
```

- [ ] **Step 5: Commit**

```bash
git add src/cad/components/MeasureOverlay.tsx src/cad/engine/types.ts src/cad/components/CadViewport.tsx src/cad/components/TopToolbar.tsx
git commit -m "feat(cad): add measure tool with 3D distance calculation and labels"
```

---

### Task 10: Section View

**Files:**
- Create: `src/cad/components/SectionPlane.tsx`
- Modify: `src/cad/components/CadViewport.tsx`
- Modify: `src/cad/components/TopToolbar.tsx`

- [ ] **Step 1: Create SectionPlane component**

```typescript
// src/cad/components/SectionPlane.tsx
"use client";

import { useRef, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface SectionPlaneProps {
  plane: "XY" | "XZ" | "YZ";
  offset: number;
  visible: boolean;
}

export function SectionPlane({ plane, offset, visible }: SectionPlaneProps) {
  const { gl, scene } = useThree();

  useEffect(() => {
    if (!visible) {
      gl.clippingPlanes = [];
      gl.localClippingEnabled = false;
      return;
    }

    let normal: THREE.Vector3;
    switch (plane) {
      case "XY": normal = new THREE.Vector3(0, 0, -1); break;
      case "XZ": normal = new THREE.Vector3(0, -1, 0); break;
      case "YZ": normal = new THREE.Vector3(-1, 0, 0); break;
    }

    const clipPlane = new THREE.Plane(normal, offset);
    gl.clippingPlanes = [clipPlane];
    gl.localClippingEnabled = true;

    return () => {
      gl.clippingPlanes = [];
      gl.localClippingEnabled = false;
    };
  }, [visible, plane, offset, gl, scene]);

  if (!visible) return null;

  // Visual indicator of the section plane
  const rotation = plane === "XY"
    ? [0, 0, 0]
    : plane === "XZ"
    ? [-Math.PI / 2, 0, 0]
    : [0, Math.PI / 2, 0];

  const position = plane === "XY"
    ? [0, 0, offset]
    : plane === "XZ"
    ? [0, offset, 0]
    : [offset, 0, 0];

  return (
    <mesh rotation={rotation as any} position={position as any}>
      <planeGeometry args={[200, 200]} />
      <meshBasicMaterial
        color="#ef4444"
        transparent
        opacity={0.05}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}
```

- [ ] **Step 2: Wire section view into viewport and toolbar**

In `CadViewport.tsx` CadScene, add section state:
```typescript
const [sectionConfig, setSectionConfig] = useState<{ visible: boolean; plane: "XY" | "XZ" | "YZ"; offset: number }>({
  visible: false, plane: "XY", offset: 5,
});

// Listen for section toggle event
useEffect(() => {
  const handler = (e: Event) => {
    setSectionConfig(prev => ({ ...prev, visible: !prev.visible }));
  };
  window.addEventListener("cad-toggle-section", handler);
  return () => window.removeEventListener("cad-toggle-section", handler);
}, []);
```

Add `<SectionPlane {...sectionConfig} />` to the CadScene JSX.

In TopToolbar.tsx View menu:
```typescript
{ label: "Toggle Section View", action: () => { window.dispatchEvent(new Event("cad-toggle-section")); setOpenMenu(null); } },
```

- [ ] **Step 3: Commit**

```bash
git add src/cad/components/SectionPlane.tsx src/cad/components/CadViewport.tsx src/cad/components/TopToolbar.tsx
git commit -m "feat(cad): add section view with clip plane visualization"
```

---

## Summary

| Chunk | Tasks | Features |
|-------|-------|----------|
| **Chunk 1** | Tasks 1-5 | Construction geometry, sketch utils, trim, mirror, offset tools |
| **Chunk 2** | Tasks 6-8 | Loft, sweep, shell, linear pattern, circular pattern, mirror body |
| **Chunk 3** | Tasks 9-10 | Measure tool, section view |

**Total: 10 tasks, ~30 commits, covering 15 new features**

Each chunk is independently shippable — Chunk 1 makes sketching professional-grade, Chunk 2 adds the most-requested solid operations, Chunk 3 adds analysis/visualization tools.
