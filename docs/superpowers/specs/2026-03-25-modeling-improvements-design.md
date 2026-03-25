# Modeling Improvements Design Spec

**Date:** 2026-03-25
**Status:** Draft
**Branch:** feat/modeling-improvements

## Problem Statement

SpaceVision's modeling experience has several bugs and lacks the polish and dynamism of tools like TinkerCAD:

1. **Snap indicator bug** — A spinning cyan ring ("Saturn cursor") shows on hover when snap mode is enabled, even when no object is selected. The spinning animation is distracting.
2. **STL export orientation** — Exports use Y-up (Three.js default) instead of Z-up (slicer standard), making models appear sideways in 3D printing software
3. **STL export includes non-user geometry** — Grid, lights, gizmos all get exported
4. **Limited modeling features** — Missing primitives, no transparency, objects all spawn at the same position with the same color

## Changes

### 1. Fix Snap Indicator

**File:** `src/components/SnapIndicator.tsx`, `src/components/CADViewport.tsx`

**Current behavior:** The snap indicator is already gated on `snapEnabled` (via `SnapRaycaster enabled={snapEnabled}` and `visible={snapEnabled && snapTarget !== null}`). However: (a) it shows even when no object is selected, and (b) it has a spinning animation via `useFrame` that looks like a "Saturn ring."

**New behavior:**
- Only render `SnapIndicator` when `snapEnabled === true` AND `selectedIds.length > 0`
- Remove the `useFrame` spinning animation — ring is static
- Keep the cyan color and ring+dot design, just no rotation

**Implementation:**
- In `CADViewport.tsx`: add `selectedIds.length > 0` guard to the `<SnapIndicator>` visibility prop. Keep `<SnapRaycaster>` gated only on `snapEnabled` (it just sets state, no visual output).
- In `SnapIndicator.tsx`: remove the `useFrame` hook and `ringRef`. The ring mesh stays but is static.

### 2. Fix STL Export Orientation

**File:** `src/utils/stlExporter.ts`

**Current behavior:** Exports raw Three.js scene (Y-up). Models appear vertical/sideways in slicers.

**New behavior:** Auto-rotate the export group -90° on X axis so output is Z-up. Only export user meshes (those with `userData.objId`).

**Implementation:**

Extract a shared helper `buildExportScene(scene)` used by both functions:

```typescript
function buildExportScene(scene: THREE.Scene): { exportScene: THREE.Scene; dispose: () => void } {
  const exportScene = new THREE.Scene();
  const wrapper = new THREE.Group();
  wrapper.rotation.x = -Math.PI / 2; // Y-up → Z-up
  const clones: THREE.Mesh[] = [];

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.userData?.objId) {
      const clone = child.clone();
      clone.geometry = child.geometry.clone();
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
```

- `exportToSTL`: calls `buildExportScene`, exports the result, then disposes
- `validateAndExportSTL`: calls `buildExportScene`, validates meshes in the export scene, then exports and disposes. It does NOT call `exportToSTL` internally anymore — it uses the exporter directly on the same export scene to avoid double-construction/double-rotation.

### 3. Random Color on Primitive Creation

**File:** `src/lib/cadStore.ts`

**Current behavior:** Every new primitive gets `#6b8caf` (gray-blue).

**New behavior:** Each new primitive gets a color from a curated palette.

**Implementation:**
- Add a `randomColor()` function using `Math.random()` to pick from the palette:
  ```typescript
  const PALETTE = [
    "#6b8caf", "#e06c75", "#98c379", "#e5c07b", "#61afef",
    "#c678dd", "#56b6c2", "#d19a66", "#be5046", "#7ec8e3",
    "#f5a623", "#50c878", "#ff6b6b", "#4ecdc4", "#45b7d1"
  ];

  export function randomColor(): string {
    return PALETTE[Math.floor(Math.random() * PALETTE.length)];
  }
  ```
- `createObject()` uses `randomColor()` as the default color instead of hardcoded `#6b8caf`

### 4. Smart Primitive Placement

**File:** `src/app/generate/page.tsx` (addPrimitive callback)

**Current behavior:** All primitives spawn at `[0, 0.5, 0]`, stacking on top of each other.

**New behavior:** New primitives spawn with an intelligent offset based on the count of visible, non-grouped objects.

**Implementation:**
- Count visible non-grouped objects: `const count = objects.filter(o => o.visible && !o.groupId).length`
- Offset: `x = (count % 5) * 1.5 - 3`, `z = Math.floor(count / 5) * 1.5`
- Y stays at 0.5 (sitting on ground plane)
- This creates a grid-like auto-layout for new objects

### 5. New Primitives: Wedge, Tube, Star

**Files:** `src/lib/cadStore.ts` (type union, createObject names map, buildGeometry), `src/app/generate/page.tsx` (toolbar buttons)

**New shape types added to the `SceneObject["type"]` union:**
- `"wedge"` — Triangular prism (ramp). Built with `THREE.ExtrudeGeometry` from a triangular `THREE.Shape` (3 vertices: (0,0), (1,0), (0,1)). Simpler and more robust than manual BufferGeometry.
- `"tube"` — Hollow cylinder. Built with `THREE.LatheGeometry` using a rectangular profile representing the tube wall cross-section:
  ```typescript
  // Rectangular profile for tube wall
  const points = [
    new THREE.Vector2(innerRadius, -height/2),
    new THREE.Vector2(outerRadius, -height/2),
    new THREE.Vector2(outerRadius, height/2),
    new THREE.Vector2(innerRadius, height/2),
  ];
  return new THREE.LatheGeometry(points, 32);
  ```
- `"star"` — Extruded star shape. Built with `THREE.ExtrudeGeometry` from a star `THREE.Shape` using alternating inner/outer radius points.

**Not adding Text** — font loading (opentype.js) adds significant complexity and bundle size.

**Names map additions** in `createObject()`:
```typescript
wedge: "Wedge",
tube: "Tube",
star: "Star",
```

**ShapeParams additions:**
```typescript
// Wedge
wedgeWidth?: number;   // default 1
wedgeHeight?: number;  // default 1
wedgeDepth?: number;   // default 1 (extrusion depth)
// Tube
tubeOuterRadius?: number; // default 0.5
tubeInnerRadius?: number; // default 0.35
tubeHeight?: number;      // default 1
// Star
starPoints?: number;       // default 5
starOuterRadius?: number;  // default 0.5
starInnerRadius?: number;  // default 0.25
starDepth?: number;        // default 0.3 (maps to ExtrudeGeometry depth option)
```

**Toolbar:** Add Wedge, Tube, Star buttons in the ADD section of the left toolbar. Use Triangle icon for Wedge, a custom ring SVG or Circle icon for Tube, Star icon for Star.

### 6. Smarter Duplication

**File:** `src/lib/cadStore.ts` (duplicateObject function)

**Current behavior:** Fixed offset of `[+0.5, 0, +0.5]` regardless of object size.

**New behavior:** Offset based on object scale so duplicates don't overlap.

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

### 7. Opacity/Transparency Slider

**Files:** `src/lib/cadStore.ts` (SceneObject interface, createObject default), `src/components/CADViewport.tsx` (material), `src/app/generate/page.tsx` (properties panel)

**Add `opacity` field to SceneObject:**
```typescript
opacity: number; // 0-1, default 1
```

**Default in createObject:** `opacity: 1`

**Material rendering in SceneMesh:**
```tsx
<meshStandardMaterial
  color={obj.color}
  metalness={obj.metalness}
  roughness={obj.roughness}
  transparent={obj.opacity < 1}
  opacity={obj.opacity}
/>
```

**Properties panel:** Add opacity slider (0-1, step 0.05) below roughness in the material section.

**serializeScene update:** Add opacity to the serialized output when it's not 1:
```typescript
if (obj.opacity < 1) line += `, opacity=${obj.opacity}`;
```

**AI tool schema update:** Add optional `opacity` parameter (number, 0-1) to the `add_object` and `modify_object` tool definitions in `src/app/api/generate/route.ts`.

### 8. Enhanced Hole Visual Feedback

**File:** `src/components/CADViewport.tsx` (SceneMesh component)

**Current behavior:** Hole objects render as red wireframe with opacity 0.4. This is functional but could be more visible.

**New behavior:** Enhance the existing hole rendering to be more distinctive:
- Increase wireframe opacity to 0.5
- Add a striped/dashed pattern by using a second wireframe mesh overlay at 0.98x scale with a different color (dark red `#7f1d1d`)
- This creates a "danger zone" visual without needing any animation or `useFrame` hooks

**No overlap detection.** The visual feedback is purely on the hole-marked objects themselves, not conditional on proximity to other objects. This keeps it simple and performant.

## Files Changed Summary

| File | Change |
|------|--------|
| `src/components/SnapIndicator.tsx` | Remove spinning, static ring |
| `src/components/CADViewport.tsx` | Conditional snap with selection guard, opacity material, enhanced hole visuals |
| `src/utils/stlExporter.ts` | Shared `buildExportScene` helper, Z-up rotation, filter user meshes, dispose geometry |
| `src/lib/cadStore.ts` | New types (wedge/tube/star), names map, randomColor, opacity field, smarter duplicate, new buildGeometry cases |
| `src/app/generate/page.tsx` | New toolbar buttons, smart placement, opacity slider, updated addPrimitive |
| `src/app/api/generate/route.ts` | Add opacity to add_object and modify_object tool schemas |

## Out of Scope

- 3D Text primitive (font loading too heavy)
- Undo/redo (already implemented)
- Multi-material per object
- Texture mapping
- Freeform mesh editing (vertex-level)
- Full CSG preview computation (too expensive for real-time)

## Testing

- Build verification (`npx next build`)
- Manual testing: add each new primitive (wedge, tube, star), verify rendering
- Export STL, open in a slicer (Cura/PrusaSlicer), verify Z-up orientation and no grid/gizmo artifacts
- Snap indicator: enable snap, select object, verify static ring appears on hover. Disable snap, verify it disappears. Deselect object with snap on, verify indicator gone.
- Opacity: slide to 0.5, verify object becomes transparent
- Duplicate: create large scaled object, duplicate, verify no overlap
- Random colors: add 5+ primitives, verify they get different colors
- Smart placement: add 6+ objects, verify they lay out in a grid pattern
