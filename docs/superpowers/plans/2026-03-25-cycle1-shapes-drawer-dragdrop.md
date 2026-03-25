# Cycle 1: New Shapes + Shape Drawer + Drag-to-Place

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 10 new shape types, replace the toolbar primitives section with a categorized shape drawer panel, and add drag-to-place with ghost preview.

**Architecture:** Extend `cadStore.ts` with new types/geometry. Create a `ShapeDrawer.tsx` floating panel with categories and a Solid/Hole toggle. Add drag-to-place via pointer events + raycasting against the ground plane. Update AI tool schemas.

**Tech Stack:** React Three Fiber, Three.js, TypeScript, Next.js, three-stdlib (FontLoader, TextGeometry)

---

## Chunk 1: New Shape Types in cadStore

### Task 1: Add Font Manager for Text3D

**Files:**
- Create: `src/lib/fontManager.ts`

- [ ] **Step 1: Create the font manager singleton**

Create `src/lib/fontManager.ts`:

```typescript
import { Font } from 'three-stdlib';

let _font: Font | null = null;
let _loading = false;
const _listeners: Array<() => void> = [];

export function getFont(): Font | null {
  if (_font) return _font;
  if (!_loading) {
    _loading = true;
    // Dynamically import the font JSON to avoid blocking initial load
    import('three/examples/fonts/helvetiker_regular.typeface.json').then((fontData) => {
      _font = new Font(fontData);
      _listeners.forEach(fn => fn());
      _listeners.length = 0;
    }).catch(() => {
      _loading = false;
    });
  }
  return null;
}

/** Subscribe to font load. Returns unsubscribe function. */
export function onFontLoaded(callback: () => void): () => void {
  if (_font) {
    callback();
    return () => {};
  }
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
```

- [ ] **Step 2: Build and verify**

Run: `npx next build`
Expected: Compiles (font module might warn but should resolve).

- [ ] **Step 3: Commit**

```bash
git add src/lib/fontManager.ts
git commit -m "feat: add font manager singleton for text3d shapes"
```

### Task 2: Extend cadStore with 10 New Shape Types

**Files:**
- Modify: `src/lib/cadStore.ts`

All substeps below are a single atomic change — apply them all before building.

- [ ] **Step 1: Add new ShapeParams**

In `src/lib/cadStore.ts`, after the Star section (line 46, before `}`), add:

```typescript
  // Rounded Box
  cornerRadius?: number;
  rbWidth?: number;
  rbHeight?: number;
  rbDepth?: number;
  // Text3D
  textContent?: string;
  fontSize?: number;
  extrudeDepth?: number;
  bevelEnabled?: boolean;
  bevelSize?: number;
  // Half Sphere
  halfSphereRadius?: number;
  // Pyramid
  pyramidHeight?: number;
  pyramidBase?: number;
  // Heart
  heartSize?: number;
  heartDepth?: number;
  // Spring
  springCoils?: number;
  springRadius?: number;
  wireRadius?: number;
  // Screw
  screwLength?: number;
  screwRadius?: number;
  threadPitch?: number;
  // Roof
  roofWidth?: number;
  roofHeight?: number;
  roofDepth?: number;
  // Arrow
  arrowLength?: number;
  arrowHeadSize?: number;
  arrowDepth?: number;
  // Ring
  ringRadius?: number;
  ringThickness?: number;
```

- [ ] **Step 2: Update SceneObject type union**

Change line 52 from:
```typescript
  type: "box" | "sphere" | "cylinder" | "cone" | "torus" | "torusKnot" | "dodecahedron" | "octahedron" | "plane" | "capsule" | "imported" | "wedge" | "tube" | "star";
```
To:
```typescript
  type: "box" | "sphere" | "cylinder" | "cone" | "torus" | "torusKnot" | "dodecahedron" | "octahedron" | "plane" | "capsule" | "imported" | "wedge" | "tube" | "star" | "roundedBox" | "text3d" | "halfSphere" | "pyramid" | "heart" | "spring" | "screw" | "roof" | "arrow" | "ring";
```

- [ ] **Step 3: Add names to createObject map**

After `star: "Star",` (line 138), add:
```typescript
    roundedBox: "Rounded Box",
    text3d: "Text",
    halfSphere: "Half Sphere",
    pyramid: "Pyramid",
    heart: "Heart",
    spring: "Spring",
    screw: "Screw",
    roof: "Roof",
    arrow: "Arrow",
    ring: "Ring",
```

- [ ] **Step 4: Add new geometry cases to buildGeometry**

In `buildGeometry`, before the `default` case (line 228), add:

```typescript
    case "roundedBox": {
      const w = params.rbWidth || 1;
      const h = params.rbHeight || 1;
      const d = params.rbDepth || 1;
      const r = Math.min(params.cornerRadius || 0.1, Math.min(w, h) / 2 - 0.01);
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2 + r, -h / 2);
      shape.lineTo(w / 2 - r, -h / 2);
      shape.absarc(w / 2 - r, -h / 2 + r, r, -Math.PI / 2, 0, false);
      shape.lineTo(w / 2, h / 2 - r);
      shape.absarc(w / 2 - r, h / 2 - r, r, 0, Math.PI / 2, false);
      shape.lineTo(-w / 2 + r, h / 2);
      shape.absarc(-w / 2 + r, h / 2 - r, r, Math.PI / 2, Math.PI, false);
      shape.lineTo(-w / 2, -h / 2 + r);
      shape.absarc(-w / 2 + r, -h / 2 + r, r, Math.PI, Math.PI * 1.5, false);
      const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
      geo.translate(0, 0, -d / 2);
      return geo;
    }
    case "text3d": {
      // Dynamic import — see fontManager.ts
      const { getFont } = require('@/lib/fontManager');
      const font = getFont();
      if (!font) {
        // Font not loaded yet — return placeholder; SceneMesh will re-render
        return new THREE.BoxGeometry(1, 0.3, 0.1);
      }
      const { TextGeometry } = require('three-stdlib');
      const text = params.textContent || 'Text';
      const geo = new TextGeometry(text, {
        font,
        size: params.fontSize || 0.5,
        depth: params.extrudeDepth || 0.2,
        bevelEnabled: params.bevelEnabled ?? false,
        bevelSize: params.bevelSize || 0.02,
        bevelThickness: 0.01,
        curveSegments: 12,
      });
      geo.computeBoundingBox();
      if (geo.boundingBox) {
        const cx = -(geo.boundingBox.max.x + geo.boundingBox.min.x) / 2;
        const cy = -(geo.boundingBox.max.y + geo.boundingBox.min.y) / 2;
        const cz = -(geo.boundingBox.max.z + geo.boundingBox.min.z) / 2;
        geo.translate(cx, cy, cz);
      }
      return geo;
    }
    case "halfSphere": {
      return new THREE.SphereGeometry(
        params.halfSphereRadius || 0.5,
        params.widthSegs || 32,
        params.heightSegs || 16,
        0, Math.PI * 2,
        0, Math.PI / 2
      );
    }
    case "pyramid": {
      return new THREE.ConeGeometry(
        params.pyramidBase || 0.5,
        params.pyramidHeight || 1,
        4, 1, false, Math.PI / 4
      );
    }
    case "heart": {
      const s = params.heartSize || 0.5;
      const shape = new THREE.Shape();
      shape.moveTo(0, s * 0.4);
      shape.bezierCurveTo(0, s * 0.7, -s, s * 0.9, -s, s * 0.4);
      shape.bezierCurveTo(-s, -s * 0.2, 0, -s * 0.5, 0, -s * 0.8);
      shape.bezierCurveTo(0, -s * 0.5, s, -s * 0.2, s, s * 0.4);
      shape.bezierCurveTo(s, s * 0.9, 0, s * 0.7, 0, s * 0.4);
      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: params.heartDepth || 0.3,
        bevelEnabled: false,
      });
      geo.translate(0, 0, -(params.heartDepth || 0.3) / 2);
      return geo;
    }
    case "spring": {
      const coils = params.springCoils || 5;
      const sRadius = params.springRadius || 0.4;
      const wRadius = params.wireRadius || 0.05;
      class HelixCurve extends THREE.Curve<THREE.Vector3> {
        getPoint(t: number): THREE.Vector3 {
          const angle = t * Math.PI * 2 * coils;
          return new THREE.Vector3(
            Math.cos(angle) * sRadius,
            t * coils * wRadius * 8,
            Math.sin(angle) * sRadius
          );
        }
      }
      return new THREE.TubeGeometry(new HelixCurve(), coils * 32, wRadius, 8, false);
    }
    case "screw": {
      const len = params.screwLength || 1;
      const sRad = params.screwRadius || 0.1;
      const pitch = params.threadPitch || 0.15;
      const steps = Math.floor(len / pitch);
      const points: THREE.Vector2[] = [];
      // Create thread profile via lathe
      for (let i = 0; i <= steps * 8; i++) {
        const t = i / (steps * 8);
        const y = t * len - len / 2;
        const phase = (t * steps * Math.PI * 2) % (Math.PI * 2);
        const threadR = sRad + Math.max(0, Math.sin(phase)) * sRad * 0.4;
        points.push(new THREE.Vector2(threadR, y));
      }
      return new THREE.LatheGeometry(points, 24);
    }
    case "roof": {
      const rw = params.roofWidth || 1;
      const rh = params.roofHeight || 0.7;
      const rd = params.roofDepth || 1;
      const shape = new THREE.Shape();
      shape.moveTo(-rw / 2, 0);
      shape.lineTo(rw / 2, 0);
      shape.lineTo(0, rh);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: rd, bevelEnabled: false });
      geo.translate(0, 0, -rd / 2);
      return geo;
    }
    case "arrow": {
      const aLen = params.arrowLength || 1;
      const headSize = params.arrowHeadSize || 0.3;
      const depth = params.arrowDepth || 0.15;
      const shaftW = headSize * 0.4;
      const shaftLen = aLen - headSize;
      const shape = new THREE.Shape();
      shape.moveTo(-shaftW / 2, -aLen / 2);
      shape.lineTo(shaftW / 2, -aLen / 2);
      shape.lineTo(shaftW / 2, -aLen / 2 + shaftLen);
      shape.lineTo(headSize / 2, -aLen / 2 + shaftLen);
      shape.lineTo(0, aLen / 2);
      shape.lineTo(-headSize / 2, -aLen / 2 + shaftLen);
      shape.lineTo(-shaftW / 2, -aLen / 2 + shaftLen);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
      geo.translate(0, 0, -depth / 2);
      return geo;
    }
    case "ring": {
      const ringR = params.ringRadius || 0.4;
      const ringT = params.ringThickness || 0.06;
      return new THREE.TorusGeometry(ringR, ringT, 16, 48);
    }
```

- [ ] **Step 5: Build and verify**

Run: `npx next build`
Expected: Compiles successfully. The `text3d` case uses `require()` which is fine in a synchronous switch — the font may not be loaded yet, in which case a placeholder box is returned.

- [ ] **Step 6: Commit**

```bash
git add src/lib/cadStore.ts
git commit -m "feat: add 10 new shape types (roundedBox, text3d, halfSphere, pyramid, heart, spring, screw, roof, arrow, ring)"
```

### Task 3: Update AI Tool Schemas for New Shapes

**Files:**
- Modify: `src/app/api/generate/route.ts`

- [ ] **Step 1: Update add_object type enum**

Find line 14:
```typescript
        type: { type: 'string', enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'torusKnot', 'dodecahedron', 'octahedron', 'plane', 'capsule', 'wedge', 'tube', 'star'] },
```
Replace with:
```typescript
        type: { type: 'string', enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'torusKnot', 'dodecahedron', 'octahedron', 'plane', 'capsule', 'wedge', 'tube', 'star', 'roundedBox', 'text3d', 'halfSphere', 'pyramid', 'heart', 'spring', 'screw', 'roof', 'arrow', 'ring'] },
```

- [ ] **Step 2: Add new params to add_object**

After the Star params (line 52, before `},`), add:
```typescript
            // Rounded Box
            cornerRadius: { type: 'number' },
            rbWidth: { type: 'number' },
            rbHeight: { type: 'number' },
            rbDepth: { type: 'number' },
            // Text3D
            textContent: { type: 'string' },
            fontSize: { type: 'number' },
            extrudeDepth: { type: 'number' },
            bevelEnabled: { type: 'boolean' },
            bevelSize: { type: 'number' },
            // Pyramid
            pyramidHeight: { type: 'number' },
            pyramidBase: { type: 'number' },
            // Heart
            heartSize: { type: 'number' },
            heartDepth: { type: 'number' },
            // Spring
            springCoils: { type: 'number' },
            springRadius: { type: 'number' },
            wireRadius: { type: 'number' },
            // Screw
            screwLength: { type: 'number' },
            screwRadius: { type: 'number' },
            threadPitch: { type: 'number' },
            // Roof
            roofWidth: { type: 'number' },
            roofHeight: { type: 'number' },
            roofDepth: { type: 'number' },
            // Arrow
            arrowLength: { type: 'number' },
            arrowHeadSize: { type: 'number' },
            arrowDepth: { type: 'number' },
            // Ring
            ringRadius: { type: 'number' },
            ringThickness: { type: 'number' },
```

- [ ] **Step 3: Add new params to modify_object**

In the `modify_object` tool params section (after line 92), add the same param entries as Step 2. Also add the wedge/tube/star params that were previously missing:
```typescript
            // Wedge
            wedgeWidth: { type: 'number' },
            wedgeHeight: { type: 'number' },
            wedgeDepth: { type: 'number' },
            // Tube
            tubeOuterRadius: { type: 'number' },
            tubeInnerRadius: { type: 'number' },
            tubeHeight: { type: 'number' },
            // Star
            starPoints: { type: 'number' },
            starOuterRadius: { type: 'number' },
            starInnerRadius: { type: 'number' },
            starDepth: { type: 'number' },
            // Rounded Box
            cornerRadius: { type: 'number' },
            rbWidth: { type: 'number' },
            rbHeight: { type: 'number' },
            rbDepth: { type: 'number' },
            // Text3D
            textContent: { type: 'string' },
            fontSize: { type: 'number' },
            extrudeDepth: { type: 'number' },
            bevelEnabled: { type: 'boolean' },
            bevelSize: { type: 'number' },
            // Pyramid
            pyramidHeight: { type: 'number' },
            pyramidBase: { type: 'number' },
            // Heart
            heartSize: { type: 'number' },
            heartDepth: { type: 'number' },
            // Spring
            springCoils: { type: 'number' },
            springRadius: { type: 'number' },
            wireRadius: { type: 'number' },
            // Screw
            screwLength: { type: 'number' },
            screwRadius: { type: 'number' },
            threadPitch: { type: 'number' },
            // Roof
            roofWidth: { type: 'number' },
            roofHeight: { type: 'number' },
            roofDepth: { type: 'number' },
            // Arrow
            arrowLength: { type: 'number' },
            arrowHeadSize: { type: 'number' },
            arrowDepth: { type: 'number' },
            // Ring
            ringRadius: { type: 'number' },
            ringThickness: { type: 'number' },
```

- [ ] **Step 4: Update buildSystemPrompt**

Find line 125:
```
Available shape types: box, sphere, cylinder, cone, torus, torusKnot, dodecahedron, octahedron, plane, capsule, wedge, tube, star.
```
Replace with:
```
Available shape types: box, sphere, cylinder, cone, torus, torusKnot, dodecahedron, octahedron, plane, capsule, wedge, tube, star, roundedBox, text3d, halfSphere, pyramid, heart, spring, screw, roof, arrow, ring.
```

Find line 136:
```
- capsule, torusKnot, dodecahedron, octahedron, plane: use scale for sizing
```
Replace with:
```
- roundedBox: cornerRadius, rbWidth, rbHeight, rbDepth (box with rounded corners)
- text3d: textContent (the text string), fontSize, extrudeDepth, bevelEnabled, bevelSize
- halfSphere: halfSphereRadius (dome/hemisphere)
- pyramid: pyramidHeight, pyramidBase (4-sided pyramid)
- heart: heartSize, heartDepth (heart shape)
- spring: springCoils, springRadius, wireRadius (helix coil — NOT CSG compatible)
- screw: screwLength, screwRadius, threadPitch (threaded rod)
- roof: roofWidth, roofHeight, roofDepth (triangular prism)
- arrow: arrowLength, arrowHeadSize, arrowDepth (3D arrow)
- ring: ringRadius, ringThickness (thin torus ring)
- capsule, torusKnot, dodecahedron, octahedron, plane: use scale for sizing
```

- [ ] **Step 5: Build and verify**

Run: `npx next build`
Expected: Compiles successfully.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat: add 10 new shape types to AI tool schemas and system prompt"
```

## Chunk 2: Shape Drawer Panel + Drag-to-Place

### Task 4: Create ShapeDrawer Component

**Files:**
- Create: `src/components/ShapeDrawer.tsx`

- [ ] **Step 1: Create the shape drawer**

Create `src/components/ShapeDrawer.tsx`:

```tsx
"use client";

import { useState, useCallback } from "react";
import {
  Box, Circle, Triangle, Cylinder, Hexagon, Star,
  Heart, ArrowUp, Type, ChevronDown, ChevronRight,
  Diamond, Pentagon, Cone,
} from "lucide-react";
import type { SceneObject } from "@/lib/cadStore";

// Shape definitions by category
const SHAPE_CATEGORIES = [
  {
    name: "Basic",
    shapes: [
      { type: "box" as const, icon: Box, label: "Cube" },
      { type: "sphere" as const, icon: Circle, label: "Sphere" },
      { type: "cylinder" as const, icon: Cylinder, label: "Cylinder" },
      { type: "cone" as const, icon: Triangle, label: "Cone" },
      { type: "wedge" as const, icon: Triangle, label: "Wedge" },
      { type: "tube" as const, icon: Hexagon, label: "Tube" },
      { type: "star" as const, icon: Star, label: "Star" },
      { type: "torus" as const, icon: Circle, label: "Torus" },
      { type: "torusKnot" as const, icon: Circle, label: "Knot" },
      { type: "dodecahedron" as const, icon: Hexagon, label: "Dodeca" },
      { type: "octahedron" as const, icon: Diamond, label: "Octa" },
      { type: "plane" as const, icon: Box, label: "Plane" },
      { type: "capsule" as const, icon: Circle, label: "Capsule" },
    ],
  },
  {
    name: "Extended",
    shapes: [
      { type: "roundedBox" as const, icon: Box, label: "Rounded Box" },
      { type: "halfSphere" as const, icon: Circle, label: "Half Sphere" },
      { type: "pyramid" as const, icon: Triangle, label: "Pyramid" },
      { type: "roof" as const, icon: Triangle, label: "Roof" },
      { type: "ring" as const, icon: Circle, label: "Ring" },
      { type: "arrow" as const, icon: ArrowUp, label: "Arrow" },
    ],
  },
  {
    name: "Text & Mechanical",
    shapes: [
      { type: "text3d" as const, icon: Type, label: "Text" },
      { type: "heart" as const, icon: Heart, label: "Heart" },
      { type: "spring" as const, icon: Circle, label: "Spring" },
      { type: "screw" as const, icon: Cylinder, label: "Screw" },
    ],
  },
];

interface ShapeDrawerProps {
  onAddShape: (type: SceneObject["type"], asHole?: boolean) => void;
  onDragStart?: (type: SceneObject["type"], asHole: boolean) => void;
}

export default function ShapeDrawer({ onAddShape, onDragStart }: ShapeDrawerProps) {
  const [open, setOpen] = useState(true);
  const [holeMode, setHoleMode] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({
    Basic: true,
    Extended: false,
    "Text & Mechanical": false,
  });

  const toggleCategory = useCallback((name: string) => {
    setExpandedCategories(prev => ({ ...prev, [name]: !prev[name] }));
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="absolute top-2 right-2 z-20 bg-surface border border-surface-border rounded-lg px-3 py-1.5 text-xs text-gray-400 hover:text-white hover:bg-surface-lighter transition-all shadow-lg"
      >
        Shapes
      </button>
    );
  }

  return (
    <div className="absolute top-2 right-2 z-20 w-52 bg-surface border border-surface-border rounded-lg shadow-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border">
        <span className="text-xs font-bold text-gray-300 tracking-wider">SHAPES</span>
        <button
          onClick={() => setOpen(false)}
          className="text-gray-500 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>

      {/* Solid / Hole toggle */}
      <div className="flex mx-2 mt-2 mb-1 bg-surface-dark rounded-md overflow-hidden border border-surface-border">
        <button
          onClick={() => setHoleMode(false)}
          className={`flex-1 text-[10px] font-medium py-1.5 transition-all ${
            !holeMode ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          ● Solid
        </button>
        <button
          onClick={() => setHoleMode(true)}
          className={`flex-1 text-[10px] font-medium py-1.5 transition-all ${
            holeMode ? "bg-red-500/20 text-red-400" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          ○ Hole
        </button>
      </div>

      {/* Categories */}
      <div className="max-h-80 overflow-y-auto px-2 pb-2">
        {SHAPE_CATEGORIES.map(category => (
          <div key={category.name} className="mt-1.5">
            <button
              onClick={() => toggleCategory(category.name)}
              className="flex items-center gap-1 w-full text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider py-1 hover:text-gray-300"
            >
              {expandedCategories[category.name]
                ? <ChevronDown className="w-3 h-3" />
                : <ChevronRight className="w-3 h-3" />
              }
              {category.name}
            </button>

            {expandedCategories[category.name] && (
              <div className="grid grid-cols-3 gap-1">
                {category.shapes.map(shape => (
                  <button
                    key={shape.type}
                    onClick={() => onAddShape(shape.type, holeMode)}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/plain", shape.type);
                      onDragStart?.(shape.type, holeMode);
                    }}
                    title={`${holeMode ? "Hole: " : ""}${shape.label}`}
                    className={`flex flex-col items-center gap-0.5 p-1.5 rounded-md transition-all cursor-grab active:cursor-grabbing ${
                      holeMode
                        ? "hover:bg-red-500/10 text-gray-500 hover:text-red-400"
                        : "hover:bg-surface-lighter text-gray-500 hover:text-white"
                    }`}
                  >
                    <shape.icon className="w-4 h-4" />
                    <span className="text-[8px] leading-tight">{shape.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Build and verify**

Run: `npx next build`
Expected: Compiles. Some icons (Heart, ArrowUp, Type, Diamond, Pentagon) may not exist in lucide-react — if so, replace with available alternatives (use `Circle` as fallback).

- [ ] **Step 3: Commit**

```bash
git add src/components/ShapeDrawer.tsx
git commit -m "feat: create ShapeDrawer component with categories and solid/hole toggle"
```

### Task 5: Integrate ShapeDrawer into Generate Page

**Files:**
- Modify: `src/app/generate/page.tsx`

- [ ] **Step 1: Add imports**

After the ToolCallChip import (line 64), add:
```tsx
import ShapeDrawer from "@/components/ShapeDrawer";
```

- [ ] **Step 2: Add drag state**

After the existing state declarations (find `const [showRulers, setShowRulers]`), add:
```tsx
  const [draggingShape, setDraggingShape] = useState<{ type: SceneObject["type"]; asHole: boolean } | null>(null);
```

- [ ] **Step 3: Add handleAddFromDrawer function**

After the `addPrimitive` function (around line 205), add:
```tsx
  const addFromDrawer = useCallback((type: SceneObject["type"], asHole?: boolean) => {
    const count = objects.filter(o => o.visible && !o.groupId).length;
    const x = (count % 5) * 1.5 - 3;
    const z = Math.floor(count / 5) * 1.5;
    const obj = createObject(type, {
      position: [x, 0.5, z],
      isHole: asHole || false,
    });
    const newObjects = [...objects, obj];
    setObjects(newObjects);
    setSelectedIds([obj.id]);
    pushHistory(newObjects, obj.id);
  }, [objects, pushHistory]);
```

- [ ] **Step 4: Remove old primitives from toolbar**

Find lines 793-804 (the "ADD" section with `primitiveTypes.map`):
```tsx
        {/* Primitives */}
        <p className="text-[7px] text-gray-600 font-bold tracking-wider">ADD</p>
        {primitiveTypes.map(prim => (
          <button
            key={prim.type}
            onClick={() => addPrimitive(prim.type)}
            title={`Add ${prim.label}`}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-surface-lighter transition-all"
          >
            <prim.icon className="w-3.5 h-3.5" />
          </button>
        ))}
```

Replace with a single "Shapes" button (the drawer replaces the old toolbar section):
```tsx
        {/* Shapes drawer toggle (handled by ShapeDrawer floating panel) */}
        <p className="text-[7px] text-gray-600 font-bold tracking-wider">ADD</p>
        <button
          onClick={() => addPrimitive("box")}
          title="Quick Add Cube"
          className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-surface-lighter transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
```

- [ ] **Step 5: Add ShapeDrawer to viewport area**

Find the viewport section (the `<div>` that contains `<CADViewport>`). Inside the parent div that wraps the viewport, add the ShapeDrawer as a sibling positioned absolutely:

After `<CADViewport ... />` closing tag (or its wrapper), add:
```tsx
              <ShapeDrawer
                onAddShape={addFromDrawer}
                onDragStart={(type, asHole) => setDraggingShape({ type, asHole })}
              />
```

The ShapeDrawer is absolutely positioned (it has `absolute top-2 right-2 z-20` classes), so it floats over the viewport. It needs to be inside a `relative` parent — the viewport wrapper div should already have `relative` or needs it added.

- [ ] **Step 6: Build and verify**

Run: `npx next build`
Expected: Compiles successfully.

- [ ] **Step 7: Commit**

```bash
git add src/app/generate/page.tsx
git commit -m "feat: integrate ShapeDrawer panel, replace old toolbar primitives section"
```

### Task 6: Add Drag-to-Place with Ghost Preview

**Files:**
- Modify: `src/components/CADViewport.tsx`
- Modify: `src/app/generate/page.tsx`

- [ ] **Step 1: Add drag props to CADViewport**

In `src/components/CADViewport.tsx`, find the component props interface. Add:
```typescript
  draggingShape?: { type: SceneObject["type"]; asHole: boolean } | null;
  onDropShape?: (type: SceneObject["type"], position: [number, number, number], asHole: boolean) => void;
```

- [ ] **Step 2: Add drag-to-place ghost preview inside Canvas**

Inside the Canvas, after the SnapIndicator (around line 550), add a new component:

```tsx
        {/* Drag-to-place ghost preview */}
        {draggingShape && (
          <DragGhost
            type={draggingShape.type}
            onDrop={(pos) => onDropShape?.(draggingShape.type, pos, draggingShape.asHole)}
          />
        )}
```

And define the `DragGhost` component before the main `CADViewport` function:

```tsx
function DragGhost({ type, onDrop }: { type: SceneObject["type"]; onDrop: (pos: [number, number, number]) => void }) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const [position, setPosition] = useState<[number, number, number]>([0, 0.5, 0]);
  const [visible, setVisible] = useState(false);
  const groundPlane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), []);
  const geometry = useMemo(() => buildGeometry(type), [type]);

  useFrame(({ raycaster, pointer, camera }) => {
    raycaster.setFromCamera(pointer, camera);
    const hit = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(groundPlane, hit)) {
      // Snap to 0.5 grid
      const x = Math.round(hit.x * 2) / 2;
      const z = Math.round(hit.z * 2) / 2;
      setPosition([x, 0.5, z]);
      setVisible(true);
    }
  });

  useEffect(() => {
    const handleUp = () => {
      if (visible) onDrop(position);
    };
    window.addEventListener('pointerup', handleUp);
    return () => window.removeEventListener('pointerup', handleUp);
  }, [visible, position, onDrop]);

  if (!visible) return null;

  return (
    <mesh ref={meshRef} geometry={geometry} position={position}>
      <meshStandardMaterial
        color="#61afef"
        transparent
        opacity={0.4}
        wireframe={false}
      />
    </mesh>
  );
}
```

- [ ] **Step 3: Pass drag props from page.tsx to CADViewport**

In `page.tsx`, find the `<CADViewport` component usage. Add the new props:
```tsx
                draggingShape={draggingShape}
                onDropShape={(type, position, asHole) => {
                  const obj = createObject(type, { position, isHole: asHole });
                  const newObjects = [...objects, obj];
                  setObjects(newObjects);
                  setSelectedIds([obj.id]);
                  pushHistory(newObjects, obj.id);
                  setDraggingShape(null);
                }}
```

Also add a `onDragOver` and `onDrop` to the viewport wrapper div to prevent browser default drag behavior:
```tsx
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => setDraggingShape(null)}
```

- [ ] **Step 4: Build and verify**

Run: `npx next build`
Expected: Compiles successfully.

- [ ] **Step 5: Commit**

```bash
git add src/components/CADViewport.tsx src/app/generate/page.tsx
git commit -m "feat: add drag-to-place with ghost preview on ground plane"
```

### Task 7: Final Build Verification

- [ ] **Step 1: Full build**

Run: `npx next build`
Expected: All pages compile, no type errors.

- [ ] **Step 2: Verify all changes are committed**

Run: `git status`
Expected: Clean working tree.
