# Modeling Improvements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix snap indicator bug, STL export orientation, and add TinkerCAD-like modeling features (new primitives, opacity, random colors, smart placement).

**Architecture:** Modify cadStore.ts for new types/fields, update CADViewport for rendering changes, rewrite stlExporter for proper Z-up export, and update the generate page for new toolbar items and property controls.

**Tech Stack:** React Three Fiber, Three.js, TypeScript, Next.js

---

## Chunk 1: Bug Fixes + Core Data Model Changes

### Task 1: Fix Snap Indicator

**Files:**
- Modify: `src/components/SnapIndicator.tsx` (entire file)
- Modify: `src/components/CADViewport.tsx:540-544`

- [ ] **Step 1: Remove spinning animation from SnapIndicator**

Replace entire `src/components/SnapIndicator.tsx` with:

```tsx
"use client";

import { useMemo } from "react";
import * as THREE from "three";

interface SnapIndicatorProps {
  position: [number, number, number];
  normal: [number, number, number];
  visible: boolean;
}

export default function SnapIndicator({
  position,
  normal,
  visible,
}: SnapIndicatorProps) {
  const quaternion = useMemo(() => {
    const up = new THREE.Vector3(0, 1, 0);
    const n = new THREE.Vector3(...normal).normalize();
    return new THREE.Quaternion().setFromUnitVectors(up, n);
  }, [normal[0], normal[1], normal[2]]);

  if (!visible) return null;

  return (
    <group position={position} quaternion={quaternion}>
      {/* Static ring */}
      <mesh renderOrder={999}>
        <ringGeometry args={[0.18, 0.22, 32]} />
        <meshBasicMaterial
          color="#22d3ee"
          side={THREE.DoubleSide}
          transparent
          opacity={0.85}
          depthTest={false}
        />
      </mesh>

      {/* Center dot */}
      <mesh renderOrder={999}>
        <circleGeometry args={[0.04, 16]} />
        <meshBasicMaterial
          color="#22d3ee"
          side={THREE.DoubleSide}
          depthTest={false}
        />
      </mesh>
    </group>
  );
}
```

- [ ] **Step 2: Add selection guard to SnapIndicator visibility in CADViewport**

In `src/components/CADViewport.tsx`, find line 543:
```tsx
          visible={snapEnabled && snapTarget !== null}
```
Replace with:
```tsx
          visible={snapEnabled && snapTarget !== null && selectedIds.length > 0}
```

- [ ] **Step 3: Build and verify**

Run: `npx next build`
Expected: Compiles successfully.

- [ ] **Step 4: Commit**

```bash
git add src/components/SnapIndicator.tsx src/components/CADViewport.tsx
git commit -m "fix: make snap indicator static and only show when object selected"
```

### Task 2: Fix STL Export (Z-up + filter user meshes)

**Files:**
- Modify: `src/utils/stlExporter.ts` (entire file)

- [ ] **Step 1: Rewrite stlExporter.ts**

Replace entire `src/utils/stlExporter.ts` with:

```typescript
import * as THREE from "three";
import { STLExporter } from "three-stdlib";

/**
 * Build a temporary scene containing only user meshes (those with userData.objId),
 * rotated -90° on X to convert from Three.js Y-up to slicer-standard Z-up.
 */
function buildExportScene(scene: THREE.Scene): { exportScene: THREE.Scene; dispose: () => void } {
  const exportScene = new THREE.Scene();
  const wrapper = new THREE.Group();
  wrapper.rotation.x = -Math.PI / 2; // Y-up → Z-up
  const clones: THREE.Mesh[] = [];

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.userData?.objId) {
      const clone = child.clone();
      // Clone geometry to avoid mutating originals and for proper disposal
      clone.geometry = child.geometry.clone();
      // Bake the world transform so the clone is positioned correctly
      child.updateWorldMatrix(true, false);
      clone.applyMatrix4(child.matrixWorld);
      // Reset parent-relative transforms since we baked world matrix
      clone.position.set(0, 0, 0);
      clone.rotation.set(0, 0, 0);
      clone.scale.set(1, 1, 1);
      wrapper.add(clone);
      clones.push(clone);
    }
  });

  wrapper.updateMatrixWorld(true);
  exportScene.add(wrapper);

  return {
    exportScene,
    dispose: () => clones.forEach(c => { c.geometry.dispose(); }),
  };
}

function downloadBlob(data: DataView, filename: string) {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToSTL(scene: THREE.Scene, filename = "model.stl") {
  const { exportScene, dispose } = buildExportScene(scene);
  const exporter = new STLExporter();
  const result = exporter.parse(exportScene, { binary: true }) as DataView;
  downloadBlob(result, filename);
  dispose();
}

export async function validateAndExportSTL(
  scene: THREE.Scene,
  filename = "model.stl"
): Promise<{ success: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  const { exportScene, dispose } = buildExportScene(scene);

  try {
    const manifoldModule = await import(/* webpackIgnore: true */ "manifold-3d");
    const wasm = await (manifoldModule as any).default();
    const { Manifold, Mesh: ManifoldMesh } = wasm as any;

    exportScene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      if (!child.geometry) return;

      const name = child.userData?.objId || child.name || "unnamed mesh";

      try {
        const geo = child.geometry as THREE.BufferGeometry;
        const posAttr = geo.getAttribute("position");
        if (!posAttr) {
          warnings.push(`${name}: no position attribute, skipping validation`);
          return;
        }

        const vertProperties = new Float32Array(posAttr.count * 3);
        for (let i = 0; i < posAttr.count; i++) {
          vertProperties[i * 3] = posAttr.getX(i);
          vertProperties[i * 3 + 1] = posAttr.getY(i);
          vertProperties[i * 3 + 2] = posAttr.getZ(i);
        }

        let triVerts: Uint32Array;
        if (geo.index) {
          triVerts = new Uint32Array(geo.index.array);
        } else {
          triVerts = new Uint32Array(posAttr.count);
          for (let i = 0; i < posAttr.count; i++) {
            triVerts[i] = i;
          }
        }

        const mMesh = new ManifoldMesh({ numProp: 3, vertProperties, triVerts });
        const manifold = new Manifold(mMesh);

        const genus = manifold.genus();
        if (genus !== 0) {
          warnings.push(`${name}: non-zero genus (${genus}), mesh has holes or handles`);
        }

        manifold.delete();
        mMesh.delete();
      } catch {
        warnings.push(`${name}: non-manifold geometry (may cause issues with 3D printing)`);
      }
    });
  } catch {
    warnings.push("Manifold validation unavailable: could not load manifold-3d WASM module");
  }

  try {
    const exporter = new STLExporter();
    const result = exporter.parse(exportScene, { binary: true }) as DataView;
    downloadBlob(result, filename);
    dispose();
    return { success: true, warnings };
  } catch {
    dispose();
    warnings.push("STL export failed");
    return { success: false, warnings };
  }
}
```

Key changes from original:
- Shared `buildExportScene` extracts only `userData.objId` meshes
- Applies -90° X rotation for Z-up output
- Bakes world transforms on clones so positions are correct
- `validateAndExportSTL` no longer calls `exportToSTL` — it uses the exporter directly on the same scene to avoid double-rotation
- Properly disposes cloned geometry

- [ ] **Step 2: Build and verify**

Run: `npx next build`
Expected: Compiles successfully.

- [ ] **Step 3: Commit**

```bash
git add src/utils/stlExporter.ts
git commit -m "fix: STL export now uses Z-up orientation and filters non-user geometry"
```

### Task 3: Update cadStore Data Model

**Files:**
- Modify: `src/lib/cadStore.ts` (type union, ShapeParams, createObject, duplicateObject, buildGeometry, serializeScene)

- [ ] **Step 1: Add new shape types, opacity, randomColor, and update all functions**

In `src/lib/cadStore.ts`:

**a) Add new ShapeParams** after the Torus section (line 33):
```typescript
  // Wedge
  wedgeWidth?: number;
  wedgeHeight?: number;
  wedgeDepth?: number;
  // Tube
  tubeOuterRadius?: number;
  tubeInnerRadius?: number;
  tubeHeight?: number;
  // Star
  starPoints?: number;
  starOuterRadius?: number;
  starInnerRadius?: number;
  starDepth?: number;
```

**b) Update SceneObject type union** (line 39) to:
```typescript
  type: "box" | "sphere" | "cylinder" | "cone" | "torus" | "torusKnot" | "dodecahedron" | "octahedron" | "plane" | "capsule" | "imported" | "wedge" | "tube" | "star";
```

**c) Add `opacity` field** to SceneObject interface after `roughness` (line 46). Make it optional so existing object spreads don't break:
```typescript
  opacity?: number;
```

**d) Add color palette and randomColor** after the `_idCounter` section (after line 84):
```typescript
const PALETTE = [
  "#6b8caf", "#e06c75", "#98c379", "#e5c07b", "#61afef",
  "#c678dd", "#56b6c2", "#d19a66", "#be5046", "#7ec8e3",
  "#f5a623", "#50c878", "#ff6b6b", "#4ecdc4", "#45b7d1",
];

export function randomColor(): string {
  return PALETTE[Math.floor(Math.random() * PALETTE.length)];
}
```

**e) Update `createObject` names map** (lines 100-112) — add entries:
```typescript
    wedge: "Wedge",
    tube: "Tube",
    star: "Star",
```

**f) Update `createObject` defaults** (line 122) — change color and add opacity:
```typescript
    color: randomColor(),
```
And add after `roughness: 0.5,` (line 124):
```typescript
    opacity: 1,
```

**g) Update `duplicateObject`** (lines 134-141) to:
```typescript
export function duplicateObject(obj: SceneObject): SceneObject {
  const offsetX = Math.max(obj.scale[0], 0.5) * 1.2;
  return {
    ...obj,
    id: newId(),
    name: `${obj.name} Copy`,
    position: [obj.position[0] + offsetX, obj.position[1], obj.position[2]],
  };
}
```

**h) Add new geometry cases** to `buildGeometry` switch (before `default`, after capsule case at line 155):
```typescript
    case "wedge": {
      const w = params.wedgeWidth || 1;
      const h = params.wedgeHeight || 1;
      const d = params.wedgeDepth || 1;
      const shape = new THREE.Shape();
      shape.moveTo(-w / 2, -h / 2);
      shape.lineTo(w / 2, -h / 2);
      shape.lineTo(-w / 2, h / 2);
      shape.closePath();
      const geo = new THREE.ExtrudeGeometry(shape, { depth: d, bevelEnabled: false });
      geo.translate(0, 0, -d / 2); // Center along Z
      return geo;
    }
    case "tube": {
      const outer = params.tubeOuterRadius || 0.5;
      const inner = params.tubeInnerRadius || 0.35;
      const h = params.tubeHeight || 1;
      const points = [
        new THREE.Vector2(inner, -h / 2),
        new THREE.Vector2(outer, -h / 2),
        new THREE.Vector2(outer, h / 2),
        new THREE.Vector2(inner, h / 2),
      ];
      return new THREE.LatheGeometry(points, 32);
    }
    case "star": {
      const pts = params.starPoints || 5;
      const outerR = params.starOuterRadius || 0.5;
      const innerR = params.starInnerRadius || 0.25;
      const depth = params.starDepth || 0.3;
      const shape = new THREE.Shape();
      for (let i = 0; i < pts * 2; i++) {
        const angle = (i * Math.PI) / pts - Math.PI / 2;
        const r = i % 2 === 0 ? outerR : innerR;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) shape.moveTo(x, y);
        else shape.lineTo(x, y);
      }
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
    }
```

**i) Update `serializeScene`** — add opacity to the serialization (after the `IMPORTED_MESH` line):
```typescript
    if (obj.opacity < 1) line += `, opacity=${obj.opacity}`;
```

**Important:** All substeps (a through i) above must be applied as a single atomic change before building. They are interdependent — the type union expansion requires the names map entries, and so on.

- [ ] **Step 2: Build and verify**

Run: `npx next build`
Expected: Compiles successfully. Since `opacity` is optional (`opacity?: number`), existing code that spreads SceneObject without providing opacity will still work.

- [ ] **Step 3: Commit**

```bash
git add src/lib/cadStore.ts
git commit -m "feat: add wedge/tube/star types, opacity field, random colors, smarter duplication"
```

## Chunk 2: Rendering + UI Updates

### Task 4: Update CADViewport Rendering

**Files:**
- Modify: `src/components/CADViewport.tsx:69-87` (SceneMesh material)

- [ ] **Step 1: Add opacity to SceneMesh material**

In `src/components/CADViewport.tsx`, find the non-hole material (lines 79-87):
```tsx
        <meshStandardMaterial
          color={obj.color}
          wireframe={wireframe}
          roughness={obj.roughness}
          metalness={obj.metalness}
          flatShading
          emissive={isSelected ? obj.color : "#000000"}
          emissiveIntensity={isSelected ? 0.08 : 0}
        />
```

Replace with:
```tsx
        <meshStandardMaterial
          color={obj.color}
          wireframe={wireframe}
          roughness={obj.roughness}
          metalness={obj.metalness}
          transparent={obj.opacity < 1}
          opacity={obj.opacity}
          flatShading
          emissive={isSelected ? obj.color : "#000000"}
          emissiveIntensity={isSelected ? 0.08 : 0}
        />
```

- [ ] **Step 2: Enhance hole object visuals**

Find the hole material (lines 69-77):
```tsx
      {obj.isHole ? (
        <meshStandardMaterial
          color="#ff4444"
          wireframe
          transparent
          opacity={0.4}
          roughness={1}
          metalness={0}
        />
```

Replace with (just increase opacity and add a second color for better visibility):
```tsx
      {obj.isHole ? (
        <meshStandardMaterial
          color="#ff4444"
          wireframe
          transparent
          opacity={0.55}
          roughness={1}
          metalness={0}
        />
```

This is a simpler change than adding a nested mesh (which would cause memory leaks from `geometry.clone()` on every render). The increased opacity from 0.4 to 0.55 makes holes more visible.

- [ ] **Step 3: Add opacity to TransformGizmo material**

In `src/components/CADViewport.tsx`, find the TransformGizmo material (lines 177-184):
```tsx
        <meshStandardMaterial
          color={selectedObj.color}
          roughness={selectedObj.roughness}
          metalness={selectedObj.metalness}
          flatShading
          emissive={selectedObj.color}
          emissiveIntensity={0.08}
        />
```

Replace with:
```tsx
        <meshStandardMaterial
          color={selectedObj.color}
          roughness={selectedObj.roughness}
          metalness={selectedObj.metalness}
          transparent={(selectedObj.opacity ?? 1) < 1}
          opacity={selectedObj.opacity ?? 1}
          flatShading
          emissive={selectedObj.color}
          emissiveIntensity={0.08}
        />
```

- [ ] **Step 4: Build and verify**

Run: `npx next build`
Expected: Compiles successfully.

- [ ] **Step 5: Commit**

```bash
git add src/components/CADViewport.tsx
git commit -m "feat: add opacity rendering and enhanced hole visuals"
```

### Task 5: Update Generate Page (Toolbar, Properties, Smart Placement)

**Files:**
- Modify: `src/app/generate/page.tsx` (multiple sections)

- [ ] **Step 1: Add new icons import**

At line 3 in the lucide-react import, add `Star` and `Hexagon` to the imported icons:
```tsx
  Star,
  Hexagon,
```

(These are used for star and tube toolbar buttons. Wedge uses the existing `Triangle` icon.)

- [ ] **Step 2: Update primitiveTypes array**

Find line 692-697:
```tsx
  const primitiveTypes: { type: SceneObject["type"]; icon: any; label: string }[] = [
    { type: "box", icon: Box, label: "Cube" },
    { type: "sphere", icon: Circle, label: "Sphere" },
    { type: "cylinder", icon: Cylinder, label: "Cylinder" },
    { type: "cone", icon: Triangle, label: "Cone" },
  ];
```

Replace with:
```tsx
  const primitiveTypes: { type: SceneObject["type"]; icon: any; label: string }[] = [
    { type: "box", icon: Box, label: "Cube" },
    { type: "sphere", icon: Circle, label: "Sphere" },
    { type: "cylinder", icon: Cylinder, label: "Cylinder" },
    { type: "cone", icon: Triangle, label: "Cone" },
    { type: "wedge", icon: Triangle, label: "Wedge" },
    { type: "tube", icon: Hexagon, label: "Tube" },
    { type: "star", icon: Star, label: "Star" },
  ];
```

- [ ] **Step 3: Update addPrimitive for smart placement**

Find line 193-199:
```tsx
  const addPrimitive = useCallback((type: SceneObject["type"]) => {
    const obj = createObject(type);
    const newObjects = [...objects, obj];
    setObjects(newObjects);
    setSelectedIds([obj.id]);
    pushHistory(newObjects, obj.id);
  }, [objects, pushHistory]);
```

Replace with:
```tsx
  const addPrimitive = useCallback((type: SceneObject["type"]) => {
    const count = objects.filter(o => o.visible && !o.groupId).length;
    const x = (count % 5) * 1.5 - 3;
    const z = Math.floor(count / 5) * 1.5;
    const obj = createObject(type, { position: [x, 0.5, z] });
    const newObjects = [...objects, obj];
    setObjects(newObjects);
    setSelectedIds([obj.id]);
    pushHistory(newObjects, obj.id);
  }, [objects, pushHistory]);
```

- [ ] **Step 4: Add opacity slider to properties panel**

Find the roughness slider section (lines 1217-1226):
```tsx
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Roughness</span>
                          <span className="text-[10px] text-gray-500 font-mono">{selectedObj.roughness.toFixed(2)}</span>
                        </div>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          value={selectedObj.roughness}
                          onChange={(e) => updateSelectedProp("roughness", parseFloat(e.target.value))}
                          className="w-full h-1 accent-brand"
                        />
```

Add immediately after that block (before the closing `</div>` of the material section):
```tsx
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Opacity</span>
                          <span className="text-[10px] text-gray-500 font-mono">{(selectedObj.opacity ?? 1).toFixed(2)}</span>
                        </div>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          value={selectedObj.opacity ?? 1}
                          onChange={(e) => updateSelectedProp("opacity", parseFloat(e.target.value))}
                          className="w-full h-1 accent-brand"
                        />
```

The `?? 1` fallback handles any existing objects that don't have the opacity field yet.

- [ ] **Step 5: Build and verify**

Run: `npx next build`
Expected: Compiles successfully.

- [ ] **Step 6: Commit**

```bash
git add src/app/generate/page.tsx
git commit -m "feat: add new primitives toolbar, smart placement, and opacity slider"
```

### Task 6: Update AI Tool Schemas

**Files:**
- Modify: `src/app/api/generate/route.ts:14,50-55`

- [ ] **Step 1: Add new types and opacity to add_object tool**

In `src/app/api/generate/route.ts`, find the type enum (line 14):
```typescript
        type: { type: 'string', enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'torusKnot', 'dodecahedron', 'octahedron', 'plane', 'capsule'] },
```

Replace with:
```typescript
        type: { type: 'string', enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'torusKnot', 'dodecahedron', 'octahedron', 'plane', 'capsule', 'wedge', 'tube', 'star'] },
```

After the `roughness` property (line 20), add:
```typescript
        opacity: { type: 'number', description: '0-1 transparency. 1=opaque (default), 0=invisible' },
```

- [ ] **Step 2: Add opacity to modify_object tool**

Find the `modify_object` tool properties section (around line 50-55). After `roughness`:
```typescript
        opacity: { type: 'number', description: '0-1 transparency' },
```

- [ ] **Step 3: Update buildSystemPrompt with new types**

In `src/app/api/generate/route.ts`, find line 110:
```
Available shape types: box, sphere, cylinder, cone, torus, torusKnot, dodecahedron, octahedron, plane, capsule.
```

Replace with:
```
Available shape types: box, sphere, cylinder, cone, torus, torusKnot, dodecahedron, octahedron, plane, capsule, wedge, tube, star.
```

Find line 118:
```
- capsule, torusKnot, dodecahedron, octahedron, plane: use scale for sizing
```

Replace with:
```
- wedge: wedgeWidth, wedgeHeight, wedgeDepth (triangular prism / ramp)
- tube: tubeOuterRadius, tubeInnerRadius, tubeHeight (hollow cylinder)
- star: starPoints, starOuterRadius, starInnerRadius, starDepth (extruded star)
- capsule, torusKnot, dodecahedron, octahedron, plane: use scale for sizing
```

- [ ] **Step 4: Add new shape params to add_object**

In the `params.properties` object (lines 24-39), add:
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
```

- [ ] **Step 5: Build and verify**

Run: `npx next build`
Expected: Compiles successfully with no errors.

- [ ] **Step 6: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat: add new shape types and opacity to AI tool schemas"
```

### Task 7: Final Build Verification

- [ ] **Step 1: Full build**

Run: `npx next build`
Expected: All pages compile, no type errors.

- [ ] **Step 2: Verify all changes are committed**

Run: `git status`
Expected: Clean working tree (no uncommitted changes).
