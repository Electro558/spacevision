# TinkerCAD-Style 3D Modeling Framework Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add TinkerCAD-level 3D modeling to SpaceVision — CSG boolean operations (union/subtract/intersect), multi-select + grouping, snap-to-face workplanes, align/distribute tools, and smart rulers with dimension inputs.

**Architecture:** Multi-select enables selecting 2+ objects for boolean ops. CSG is handled by `three-bvh-csg` for real-time preview and `manifold-3d` for validated export. A new `BooleanToolbar` provides both TinkerCAD-style (Group/Hole) and Advanced (Union/Subtract/Intersect) workflows. Snapping is enhanced with raycaster-based snap-to-face, alignment helpers, and dimension overlays rendered via `@react-three/drei`'s `Html` component.

**Tech Stack:** three-bvh-csg, manifold-3d, @react-three/drei (Html, Line), React Three Fiber, Three.js, TypeScript

---

## File Structure

### New Files
| File | Responsibility |
|------|---------------|
| `src/lib/csgEngine.ts` | CSG operations: union, subtract, intersect using three-bvh-csg. Manifold validation on export. |
| `src/lib/multiSelect.ts` | Multi-selection state helpers: toggle, range-select, select-all, deselect-all |
| `src/lib/snapEngine.ts` | Snap-to-face raycasting, workplane creation, grid snap enhancement |
| `src/lib/alignEngine.ts` | Align (left/center/right/top/middle/bottom) and distribute (horizontal/vertical) computations |
| `src/lib/dimensionHelpers.ts` | Distance measurement between objects, bounding box calculations |
| `src/components/BooleanToolbar.tsx` | UI for Group/Hole (TinkerCAD mode) + Union/Subtract/Intersect (Advanced mode) |
| `src/components/AlignToolbar.tsx` | Align & distribute button bar |
| `src/components/SmartRulers.tsx` | 3D dimension lines rendered in the viewport between selected objects |
| `src/components/SnapIndicator.tsx` | Visual indicator when snap-to-face is active (highlight target face) |
| `src/components/DimensionInput.tsx` | Floating input that appears during drag for typing exact values |

### Modified Files
| File | Changes |
|------|---------|
| `package.json` | Add three-bvh-csg, manifold-3d dependencies |
| `src/lib/cadStore.ts` | Add `isHole` property to SceneObject, add `CSGGroup` type, export `buildGeometry()` |
| `src/app/generate/page.tsx` | Multi-select state, integrate BooleanToolbar, AlignToolbar, SmartRulers, new keyboard shortcuts |
| `src/components/CADViewport.tsx` | Multi-select outlines, snap-to-face raycaster, dimension overlays, CSG group rendering |
| `src/utils/stlExporter.ts` | Use manifold-3d for validated geometry before export |

---

## Chunk 1: Foundation — Dependencies + Multi-Select + SceneObject Updates

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install CSG and geometry packages**

```bash
cd /Users/electro/Desktop/code/spacevision
npm install three-bvh-csg manifold-3d
```

Note: `three-bvh-csg` is used directly for maximum control over CSG operations. `manifold-3d` provides WASM-based manifold validation.

- [ ] **Step 2: Verify installation**

```bash
cd /Users/electro/Desktop/code/spacevision
node -e "require('three-bvh-csg'); console.log('three-bvh-csg OK')"
node -e "require('manifold-3d'); console.log('manifold-3d OK')"
```

Expected: Both print OK without errors.

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "feat: add three-bvh-csg and manifold-3d dependencies for CSG modeling"
```

---

### Task 2: Update SceneObject Type + Multi-Select State

**Files:**
- Modify: `src/lib/cadStore.ts` (lines 5-32, 49-81)
- Create: `src/lib/multiSelect.ts`

- [ ] **Step 1: Update SceneObject interface in cadStore.ts**

Add `isHole` and `groupId` properties to the SceneObject interface at line 18 (after `locked: boolean`):

```typescript
// In SceneObject interface, add after "locked: boolean":
isHole: boolean       // TinkerCAD-style: marks object as a hole (subtraction)
groupId: string | null // ID of the CSG group this object belongs to
```

Add a new `CSGGroup` interface after the SceneObject interface (after line 19):

```typescript
export interface CSGGroup {
  id: string
  name: string
  objectIds: string[]  // IDs of SceneObject members
  operation: 'union' | 'subtract' | 'intersect'
  visible: boolean
  locked: boolean
  position: [number, number, number]  // group center
  rotation: [number, number, number]
  scale: [number, number, number]
}
```

- [ ] **Step 2: Update createObject() to include new properties**

In `createObject()` (line 49), add defaults in the returned object:

```typescript
isHole: false,
groupId: null,
```

- [ ] **Step 3: Create multiSelect.ts**

```typescript
// src/lib/multiSelect.ts

/**
 * Toggle an ID in the selection set.
 * If already selected, remove it. Otherwise, add it.
 */
export function toggleSelection(
  selectedIds: string[],
  id: string
): string[] {
  if (selectedIds.includes(id)) {
    return selectedIds.filter((s) => s !== id)
  }
  return [...selectedIds, id]
}

/**
 * Range select: select all objects between two indices (inclusive).
 */
export function rangeSelect(
  allIds: string[],
  anchorId: string,
  targetId: string
): string[] {
  const anchorIdx = allIds.indexOf(anchorId)
  const targetIdx = allIds.indexOf(targetId)
  if (anchorIdx === -1 || targetIdx === -1) return [targetId]
  const start = Math.min(anchorIdx, targetIdx)
  const end = Math.max(anchorIdx, targetIdx)
  return allIds.slice(start, end + 1)
}

/**
 * Check if enough objects are selected for a boolean operation.
 */
export function canPerformBoolean(selectedIds: string[]): boolean {
  return selectedIds.length >= 2
}

/**
 * Get the bounding box center of multiple objects (for group positioning).
 */
export function getSelectionCenter(
  objects: { position: [number, number, number] }[]
): [number, number, number] {
  if (objects.length === 0) return [0, 0, 0]
  const sum = objects.reduce(
    (acc, obj) => [
      acc[0] + obj.position[0],
      acc[1] + obj.position[1],
      acc[2] + obj.position[2],
    ] as [number, number, number],
    [0, 0, 0] as [number, number, number]
  )
  return [
    sum[0] / objects.length,
    sum[1] / objects.length,
    sum[2] / objects.length,
  ]
}
```

- [ ] **Step 4: Update generate/page.tsx for multi-select state**

Replace `selectedId` state (line 90 of generate/page.tsx) with:

```typescript
const [selectedIds, setSelectedIds] = useState<string[]>([])
// Backward-compat helper:
const selectedId = selectedIds.length === 1 ? selectedIds[0] : null
```

Add a `csgGroups` state:

```typescript
const [csgGroups, setCsgGroups] = useState<CSGGroup[]>([])
```

Update the click handler for SceneMesh to support Shift+Click multi-select and Ctrl+Click toggle:

```typescript
const handleObjectClick = useCallback((id: string, event: React.MouseEvent | ThreeEvent<MouseEvent>) => {
  const nativeEvent = 'nativeEvent' in event ? event.nativeEvent : event
  if (nativeEvent.shiftKey) {
    // Shift+Click: toggle in selection
    setSelectedIds(prev => toggleSelection(prev, id))
  } else {
    // Normal click: single select
    setSelectedIds([id])
  }
  pushHistory()
}, [pushHistory])
```

Update keyboard handler (line 287) — Escape deselects all:

```typescript
case 'Escape':
  setSelectedIds([])
  break
```

Add Ctrl+A for select all:

```typescript
if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
  e.preventDefault()
  setSelectedIds(objects.map(o => o.id))
}
```

- [ ] **Step 5: Update CADViewport.tsx for multi-select outlines**

Modify the SceneMesh component (line 38-69) to accept `isSelected` and `isInSelection` props:

```typescript
interface SceneMeshProps {
  obj: SceneObject
  isSelected: boolean      // primary selection (last clicked)
  isInSelection: boolean   // part of multi-selection
  onSelect: (id: string, event: ThreeEvent<MouseEvent>) => void
  onTransformUpdate: (id: string, position: [number, number, number], rotation: [number, number, number], scale: [number, number, number]) => void
}
```

Update the selection outline (lines 62-67) to show different colors:
- Primary selected: blue (#3b82f6)
- Multi-selected: cyan (#06b6d4)

```typescript
{(isSelected || isInSelection) && (
  <mesh scale={[1.02, 1.02, 1.02]}>
    <primitive object={geo} attach="geometry" />
    <meshBasicMaterial
      color={isSelected ? '#3b82f6' : '#06b6d4'}
      wireframe
      transparent
      opacity={0.4}
    />
  </mesh>
)}
```

- [ ] **Step 6: Commit**

```bash
git add src/lib/cadStore.ts src/lib/multiSelect.ts src/app/generate/page.tsx src/components/CADViewport.tsx
git commit -m "feat: add multi-select system with Shift+Click toggle and CSGGroup type"
```

---

## Chunk 2: CSG Boolean Engine

### Task 3: Create CSG Engine

**Files:**
- Create: `src/lib/csgEngine.ts`

- [ ] **Step 1: Create the CSG engine module**

```typescript
// src/lib/csgEngine.ts
import * as THREE from 'three'
import { ADDITION, SUBTRACTION, INTERSECTION, Evaluator, Brush } from 'three-bvh-csg'
import { buildGeometry, type SceneObject } from './cadStore'

const evaluator = new Evaluator()

/**
 * Convert a SceneObject to a three-bvh-csg Brush.
 * A Brush is a THREE.Mesh subclass that the Evaluator can process.
 */
export function objectToBrush(obj: SceneObject): Brush {
  const geo = buildGeometry(obj)
  const mat = new THREE.MeshStandardMaterial({ color: obj.color })
  const brush = new Brush(geo, mat)
  brush.position.set(...obj.position)
  brush.rotation.set(...obj.rotation)
  brush.scale.set(...obj.scale)
  brush.updateMatrixWorld(true)
  return brush
}

/**
 * Perform a CSG operation on two brushes.
 */
export function performCSG(
  brushA: Brush,
  brushB: Brush,
  operation: 'union' | 'subtract' | 'intersect'
): Brush {
  const opMap = {
    union: ADDITION,
    subtract: SUBTRACTION,
    intersect: INTERSECTION,
  }
  return evaluator.evaluate(brushA, brushB, opMap[operation])
}

/**
 * Apply CSG across multiple objects.
 * - For "union": sequentially union all objects together
 * - For "subtract": subtract all hole objects from the first non-hole object
 * - For "intersect": sequentially intersect all objects
 *
 * TinkerCAD mode: objects with isHole=true are subtracted, others are unioned.
 */
export function performGroupCSG(
  objects: SceneObject[],
  mode: 'tinkercad' | 'explicit',
  explicitOp?: 'union' | 'subtract' | 'intersect'
): THREE.BufferGeometry | null {
  if (objects.length < 2) return null

  if (mode === 'tinkercad') {
    // TinkerCAD mode: union all non-holes, then subtract all holes
    const solids = objects.filter((o) => !o.isHole)
    const holes = objects.filter((o) => o.isHole)

    if (solids.length === 0) return null

    // Union all solid objects
    let result = objectToBrush(solids[0])
    for (let i = 1; i < solids.length; i++) {
      const brush = objectToBrush(solids[i])
      result = performCSG(result, brush, 'union')
    }

    // Subtract all holes
    for (const hole of holes) {
      const brush = objectToBrush(hole)
      result = performCSG(result, brush, 'subtract')
    }

    return result.geometry
  }

  // Explicit mode
  const op = explicitOp || 'union'
  let result = objectToBrush(objects[0])
  for (let i = 1; i < objects.length; i++) {
    const brush = objectToBrush(objects[i])
    result = performCSG(result, brush, op)
  }
  return result.geometry
}

/**
 * Preview CSG result as a mesh (for real-time display in viewport).
 */
export function createCSGPreviewMesh(
  objects: SceneObject[],
  mode: 'tinkercad' | 'explicit',
  explicitOp?: 'union' | 'subtract' | 'intersect'
): THREE.Mesh | null {
  const geometry = performGroupCSG(objects, mode, explicitOp)
  if (!geometry) return null

  // Use the color of the first non-hole object
  const primaryObj = objects.find((o) => !o.isHole) || objects[0]
  const material = new THREE.MeshStandardMaterial({
    color: primaryObj.color,
    metalness: primaryObj.metalness,
    roughness: primaryObj.roughness,
  })

  return new THREE.Mesh(geometry, material)
}
```

- [ ] **Step 2: Verify the module compiles**

```bash
cd /Users/electro/Desktop/code/spacevision
npx tsc --noEmit src/lib/csgEngine.ts 2>&1 | head -20
```

Fix any type errors if they appear. Common issue: `buildGeometry` might not be exported from cadStore — add `export` keyword to it.

- [ ] **Step 3: Commit**

```bash
git add src/lib/csgEngine.ts
git commit -m "feat: add CSG engine with union/subtract/intersect and TinkerCAD mode"
```

---

### Task 4: Create Boolean Toolbar UI

**Files:**
- Create: `src/components/BooleanToolbar.tsx`
- Modify: `src/app/generate/page.tsx`

- [ ] **Step 1: Create BooleanToolbar component**

```typescript
// src/components/BooleanToolbar.tsx
'use client'

import React, { useState } from 'react'
import {
  Combine,
  Minus,
  Intersect,
  Group,
  CircleDot,
  Ungroup,
} from 'lucide-react'

interface BooleanToolbarProps {
  selectedCount: number
  onGroup: () => void          // TinkerCAD: group (union non-holes, subtract holes)
  onUngroup: (groupId: string) => void
  onToggleHole: () => void     // TinkerCAD: mark/unmark as hole
  onUnion: () => void          // Advanced: explicit union
  onSubtract: () => void       // Advanced: explicit subtract
  onIntersect: () => void      // Advanced: explicit intersect
  hasHolesInSelection: boolean
  isGroupSelected: boolean
  selectedGroupId: string | null
}

export default function BooleanToolbar({
  selectedCount,
  onGroup,
  onUngroup,
  onToggleHole,
  onUnion,
  onSubtract,
  onIntersect,
  hasHolesInSelection,
  isGroupSelected,
  selectedGroupId,
}: BooleanToolbarProps) {
  const [advancedMode, setAdvancedMode] = useState(false)
  const canOperate = selectedCount >= 2

  return (
    <div className="flex flex-col gap-1">
      {/* Mode toggle */}
      <div className="flex items-center gap-1 mb-1">
        <button
          onClick={() => setAdvancedMode(false)}
          className={`px-2 py-1 text-xs rounded ${
            !advancedMode
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
          title="TinkerCAD mode: Group/Hole"
        >
          Simple
        </button>
        <button
          onClick={() => setAdvancedMode(true)}
          className={`px-2 py-1 text-xs rounded ${
            advancedMode
              ? 'bg-blue-600 text-white'
              : 'bg-zinc-800 text-zinc-400 hover:text-white'
          }`}
          title="Advanced mode: Union/Subtract/Intersect"
        >
          Advanced
        </button>
      </div>

      {!advancedMode ? (
        /* TinkerCAD mode */
        <div className="flex flex-col gap-1">
          <button
            onClick={onGroup}
            disabled={!canOperate}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-white"
            title="Group selected objects (Ctrl+G)"
          >
            <Group size={16} />
            Group
          </button>

          {isGroupSelected && selectedGroupId && (
            <button
              onClick={() => onUngroup(selectedGroupId)}
              className="flex items-center gap-2 px-3 py-2 rounded text-sm bg-zinc-800 hover:bg-zinc-700 text-white"
              title="Ungroup (Ctrl+Shift+G)"
            >
              <Ungroup size={16} />
              Ungroup
            </button>
          )}

          <button
            onClick={onToggleHole}
            disabled={selectedCount === 0}
            className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
              hasHolesInSelection
                ? 'bg-red-900/50 text-red-300 hover:bg-red-900/70'
                : 'bg-zinc-800 hover:bg-zinc-700 text-white'
            } disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Toggle Hole (H) — holes are subtracted when grouped"
          >
            <CircleDot size={16} />
            {hasHolesInSelection ? 'Solid' : 'Hole'}
          </button>
        </div>
      ) : (
        /* Advanced mode */
        <div className="flex flex-col gap-1">
          <button
            onClick={onUnion}
            disabled={!canOperate}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-white"
            title="Union — combine shapes (Ctrl+Shift+U)"
          >
            <Combine size={16} />
            Union
          </button>

          <button
            onClick={onSubtract}
            disabled={!canOperate}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-white"
            title="Subtract — cut second from first (Ctrl+Shift+S)"
          >
            <Minus size={16} />
            Subtract
          </button>

          <button
            onClick={onIntersect}
            disabled={!canOperate}
            className="flex items-center gap-2 px-3 py-2 rounded text-sm bg-zinc-800 hover:bg-zinc-700 disabled:opacity-30 disabled:cursor-not-allowed text-white"
            title="Intersect — keep overlap only (Ctrl+Shift+I)"
          >
            <Intersect size={16} />
            Intersect
          </button>
        </div>
      )}

      {selectedCount > 0 && (
        <div className="text-xs text-zinc-500 mt-1 px-1">
          {selectedCount} selected
          {canOperate ? '' : ' (select 2+ for boolean ops)'}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Wire up BooleanToolbar in generate/page.tsx**

Add import at top of generate/page.tsx:

```typescript
import BooleanToolbar from '@/components/BooleanToolbar'
import { performGroupCSG } from '@/lib/csgEngine'
import { toggleSelection, canPerformBoolean, getSelectionCenter } from '@/lib/multiSelect'
import type { CSGGroup } from '@/lib/cadStore'
```

Add boolean operation handlers after the existing `handleTransformUpdate`:

```typescript
// --- Boolean Operations ---
const handleGroup = useCallback(() => {
  if (selectedIds.length < 2) return
  const groupId = `grp_${Date.now()}`
  const selectedObjs = objects.filter(o => selectedIds.includes(o.id))
  const center = getSelectionCenter(selectedObjs)

  const newGroup: CSGGroup = {
    id: groupId,
    name: `Group ${csgGroups.length + 1}`,
    objectIds: [...selectedIds],
    operation: 'union', // TinkerCAD mode: auto-detects holes
    visible: true,
    locked: false,
    position: center,
    rotation: [0, 0, 0],
    scale: [1, 1, 1],
  }

  // Mark objects as belonging to this group
  const updatedObjects = objects.map(o =>
    selectedIds.includes(o.id) ? { ...o, groupId } : o
  )

  setObjects(updatedObjects)
  setCsgGroups(prev => [...prev, newGroup])
  setSelectedIds([])
  pushHistory()
}, [selectedIds, objects, csgGroups, pushHistory])

const handleUngroup = useCallback((groupId: string) => {
  const updatedObjects = objects.map(o =>
    o.groupId === groupId ? { ...o, groupId: null } : o
  )
  setObjects(updatedObjects)
  setCsgGroups(prev => prev.filter(g => g.id !== groupId))
  pushHistory()
}, [objects, pushHistory])

const handleToggleHole = useCallback(() => {
  const updatedObjects = objects.map(o =>
    selectedIds.includes(o.id) ? { ...o, isHole: !o.isHole } : o
  )
  setObjects(updatedObjects)
  pushHistory()
}, [selectedIds, objects, pushHistory])

const handleExplicitBoolean = useCallback((op: 'union' | 'subtract' | 'intersect') => {
  if (selectedIds.length < 2) return
  const selectedObjs = objects.filter(o => selectedIds.includes(o.id))
  const resultGeo = performGroupCSG(selectedObjs, 'explicit', op)
  if (!resultGeo) return

  // Create a new object from the CSG result
  const center = getSelectionCenter(selectedObjs)
  const primaryObj = selectedObjs[0]
  const newObj = {
    ...primaryObj,
    id: `obj_${Date.now()}_csg`,
    name: `${op.charAt(0).toUpperCase() + op.slice(1)} Result`,
    position: center as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
    isHole: false,
    groupId: null,
  }

  // Remove source objects, add result
  const remaining = objects.filter(o => !selectedIds.includes(o.id))
  setObjects([...remaining, newObj])
  setSelectedIds([newObj.id])
  pushHistory()
}, [selectedIds, objects, pushHistory])
```

Add the BooleanToolbar to the left sidebar (after the primitives section, around line 405):

```typescript
{/* Boolean Operations */}
<div className="border-t border-zinc-800 pt-3 mt-3">
  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2 px-1">
    Boolean
  </div>
  <BooleanToolbar
    selectedCount={selectedIds.length}
    onGroup={handleGroup}
    onUngroup={handleUngroup}
    onToggleHole={handleToggleHole}
    onUnion={() => handleExplicitBoolean('union')}
    onSubtract={() => handleExplicitBoolean('subtract')}
    onIntersect={() => handleExplicitBoolean('intersect')}
    hasHolesInSelection={objects.some(o => selectedIds.includes(o.id) && o.isHole)}
    isGroupSelected={selectedIds.length === 1 && objects.some(o => o.id === selectedIds[0] && o.groupId !== null)}
    selectedGroupId={
      selectedIds.length === 1
        ? objects.find(o => o.id === selectedIds[0])?.groupId ?? null
        : null
    }
  />
</div>
```

- [ ] **Step 3: Add keyboard shortcuts for boolean ops**

In the keyboard handler (around line 275), add:

```typescript
// Boolean shortcuts
if ((e.ctrlKey || e.metaKey) && e.key === 'g' && !e.shiftKey) {
  e.preventDefault()
  handleGroup()
}
if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'G') {
  e.preventDefault()
  // Ungroup: find group of first selected object
  const obj = objects.find(o => o.id === selectedIds[0])
  if (obj?.groupId) handleUngroup(obj.groupId)
}
if (e.key === 'h' || e.key === 'H') {
  handleToggleHole()
}
```

- [ ] **Step 4: Verify the app compiles and renders**

```bash
cd /Users/electro/Desktop/code/spacevision
npm run build 2>&1 | tail -20
```

Expected: Build succeeds. Fix any type errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/BooleanToolbar.tsx src/app/generate/page.tsx
git commit -m "feat: add BooleanToolbar with TinkerCAD Group/Hole and Advanced Union/Subtract/Intersect"
```

---

### Task 5: CSG Group Rendering in Viewport

**Files:**
- Modify: `src/components/CADViewport.tsx`

- [ ] **Step 1: Add CSGGroupMesh component to CADViewport.tsx**

Add a new component that renders the CSG result for a group, replacing individual meshes:

```typescript
import { performGroupCSG } from '@/lib/csgEngine'
import type { CSGGroup } from '@/lib/cadStore'

interface CSGGroupMeshProps {
  group: CSGGroup
  objects: SceneObject[]
  isSelected: boolean
  onSelect: (id: string, event: ThreeEvent<MouseEvent>) => void
}

function CSGGroupMesh({ group, objects, isSelected, onSelect }: CSGGroupMeshProps) {
  const memberObjects = objects.filter(o => group.objectIds.includes(o.id))

  const resultGeometry = useMemo(() => {
    if (memberObjects.length < 2) return null
    try {
      return performGroupCSG(memberObjects, 'tinkercad')
    } catch (e) {
      console.warn('CSG operation failed:', e)
      return null
    }
  }, [memberObjects])

  if (!resultGeometry) return null

  const primaryObj = memberObjects.find(o => !o.isHole) || memberObjects[0]

  return (
    <mesh
      geometry={resultGeometry}
      position={group.position}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(group.id, e)
      }}
      userData={{ objId: group.id, isGroup: true }}
    >
      <meshStandardMaterial
        color={primaryObj.color}
        metalness={primaryObj.metalness}
        roughness={primaryObj.roughness}
      />
      {isSelected && (
        <mesh scale={[1.02, 1.02, 1.02]}>
          <primitive object={resultGeometry} attach="geometry" />
          <meshBasicMaterial color="#3b82f6" wireframe transparent opacity={0.4} />
        </mesh>
      )}
    </mesh>
  )
}
```

- [ ] **Step 2: Update the main scene rendering logic**

In the CADViewport scene render (around line 265-290), hide individual objects that belong to a group and render CSGGroupMesh instead:

```typescript
{/* Render ungrouped objects normally */}
{objects.filter(o => !o.groupId && o.visible).map((obj) => (
  <SceneMesh
    key={obj.id}
    obj={obj}
    isSelected={selectedIds[selectedIds.length - 1] === obj.id}
    isInSelection={selectedIds.includes(obj.id)}
    onSelect={onSelect}
    onTransformUpdate={onTransformUpdate}
  />
))}

{/* Render CSG groups */}
{csgGroups.filter(g => g.visible).map((group) => (
  <CSGGroupMesh
    key={group.id}
    group={group}
    objects={objects}
    isSelected={selectedIds.includes(group.id)}
    onSelect={onSelect}
  />
))}
```

- [ ] **Step 3: Add hole visualization (striped/transparent material for holes)**

Update SceneMesh to show objects marked as holes with a distinctive look:

```typescript
// In SceneMesh, modify the material:
<meshStandardMaterial
  color={obj.isHole ? '#ff4444' : obj.color}
  metalness={obj.isHole ? 0 : obj.metalness}
  roughness={obj.isHole ? 1 : obj.roughness}
  transparent={obj.isHole}
  opacity={obj.isHole ? 0.4 : 1}
  wireframe={obj.isHole || wireframe}
/>
```

- [ ] **Step 4: Commit**

```bash
git add src/components/CADViewport.tsx
git commit -m "feat: render CSG groups in viewport with hole visualization"
```

---

## Chunk 3: Snap-to-Face & Workplane System

### Task 6: Create Snap Engine

**Files:**
- Create: `src/lib/snapEngine.ts`

- [ ] **Step 1: Create the snap engine**

```typescript
// src/lib/snapEngine.ts
import * as THREE from 'three'

export interface SnapResult {
  point: THREE.Vector3      // snapped world position
  normal: THREE.Vector3      // face normal at snap point
  faceIndex: number          // which face was hit
  objectId: string           // which object was snapped to
}

/**
 * Raycast from cursor to find the nearest face on scene objects.
 * Returns snap point and face normal for workplane alignment.
 */
export function snapToFace(
  raycaster: THREE.Raycaster,
  meshes: THREE.Mesh[],
  objectIds: string[]
): SnapResult | null {
  const intersects = raycaster.intersectObjects(meshes, false)
  if (intersects.length === 0) return null

  const hit = intersects[0]
  if (!hit.face || hit.faceIndex === undefined) return null

  const meshIndex = meshes.indexOf(hit.object as THREE.Mesh)
  if (meshIndex === -1) return null

  return {
    point: hit.point.clone(),
    normal: hit.face.normal
      .clone()
      .transformDirection(hit.object.matrixWorld)
      .normalize(),
    faceIndex: hit.faceIndex,
    objectId: objectIds[meshIndex],
  }
}

/**
 * Given a snap result, compute the position to place a new object
 * so it sits flush on the snapped face.
 *
 * @param snap - The snap result from snapToFace
 * @param objectHeight - Height of the object to place (for centering)
 */
export function computeSnapPlacement(
  snap: SnapResult,
  objectHeight: number = 1
): [number, number, number] {
  // Place object at snap point, offset along normal by half its height
  const offset = snap.normal.clone().multiplyScalar(objectHeight / 2)
  const pos = snap.point.clone().add(offset)
  return [pos.x, pos.y, pos.z]
}

/**
 * Compute rotation to align an object's up-axis with a face normal.
 * This makes objects "sit" on angled surfaces naturally.
 */
export function computeSnapRotation(
  normal: THREE.Vector3
): [number, number, number] {
  const up = new THREE.Vector3(0, 1, 0)
  const quat = new THREE.Quaternion().setFromUnitVectors(up, normal)
  const euler = new THREE.Euler().setFromQuaternion(quat)
  return [euler.x, euler.y, euler.z]
}

/**
 * Grid snap: round a value to the nearest grid increment.
 */
export function snapToGrid(value: number, gridSize: number): number {
  return Math.round(value / gridSize) * gridSize
}

/**
 * Snap a 3D position to grid.
 */
export function snapPositionToGrid(
  position: [number, number, number],
  gridSize: number
): [number, number, number] {
  return [
    snapToGrid(position[0], gridSize),
    snapToGrid(position[1], gridSize),
    snapToGrid(position[2], gridSize),
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/snapEngine.ts
git commit -m "feat: add snap engine with snap-to-face raycasting and grid snapping"
```

---

### Task 7: Snap-to-Face Indicator Component

**Files:**
- Create: `src/components/SnapIndicator.tsx`
- Modify: `src/components/CADViewport.tsx`

- [ ] **Step 1: Create SnapIndicator component**

```typescript
// src/components/SnapIndicator.tsx
'use client'

import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface SnapIndicatorProps {
  position: [number, number, number]
  normal: [number, number, number]
  visible: boolean
}

/**
 * Visual indicator showing where an object will snap to.
 * Renders a glowing circle on the target face with a normal arrow.
 */
export default function SnapIndicator({
  position,
  normal,
  visible,
}: SnapIndicatorProps) {
  const ringRef = useRef<THREE.Mesh>(null)

  useFrame((_, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 2
    }
  })

  if (!visible) return null

  // Compute rotation to align ring with face normal
  const up = new THREE.Vector3(0, 0, 1)
  const normalVec = new THREE.Vector3(...normal)
  const quat = new THREE.Quaternion().setFromUnitVectors(up, normalVec)
  const euler = new THREE.Euler().setFromQuaternion(quat)

  return (
    <group position={position} rotation={[euler.x, euler.y, euler.z]}>
      {/* Snap target ring */}
      <mesh ref={ringRef}>
        <ringGeometry args={[0.15, 0.2, 32]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Center dot */}
      <mesh>
        <circleGeometry args={[0.05, 16]} />
        <meshBasicMaterial
          color="#22d3ee"
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
```

- [ ] **Step 2: Integrate snap indicator into CADViewport**

Add snap state and pointer move handler to CADViewport.tsx:

```typescript
import SnapIndicator from './SnapIndicator'
import { snapToFace } from '@/lib/snapEngine'

// Inside the scene component, add state:
const [snapTarget, setSnapTarget] = useState<{
  position: [number, number, number]
  normal: [number, number, number]
} | null>(null)

// Add snap-to-face raycasting on pointer move:
const handlePointerMove = useCallback((event: ThreeEvent<PointerEvent>) => {
  if (!snapEnabled) {
    setSnapTarget(null)
    return
  }
  const intersects = event.intersections
  if (intersects.length > 0 && intersects[0].face) {
    const hit = intersects[0]
    const normal = hit.face!.normal
      .clone()
      .transformDirection(hit.object.matrixWorld)
      .normalize()
    setSnapTarget({
      position: [hit.point.x, hit.point.y, hit.point.z],
      normal: [normal.x, normal.y, normal.z],
    })
  } else {
    setSnapTarget(null)
  }
}, [snapEnabled])

// In JSX, add SnapIndicator:
<SnapIndicator
  position={snapTarget?.position || [0, 0, 0]}
  normal={snapTarget?.normal || [0, 1, 0]}
  visible={snapTarget !== null}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SnapIndicator.tsx src/components/CADViewport.tsx
git commit -m "feat: add snap-to-face indicator with raycasting in viewport"
```

---

## Chunk 4: Align & Distribute Tools

### Task 8: Create Align Engine

**Files:**
- Create: `src/lib/alignEngine.ts`

- [ ] **Step 1: Create align engine**

```typescript
// src/lib/alignEngine.ts
import * as THREE from 'three'
import type { SceneObject } from './cadStore'
import { buildGeometry } from './cadStore'

interface BoundsInfo {
  id: string
  min: THREE.Vector3
  max: THREE.Vector3
  center: THREE.Vector3
  size: THREE.Vector3
}

/**
 * Compute world-space bounding box for a SceneObject.
 */
function getObjectBounds(obj: SceneObject): BoundsInfo {
  const geo = buildGeometry(obj)
  geo.computeBoundingBox()
  const box = geo.boundingBox!.clone()

  // Apply object transform
  const matrix = new THREE.Matrix4()
  matrix.compose(
    new THREE.Vector3(...obj.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...obj.rotation)),
    new THREE.Vector3(...obj.scale)
  )
  box.applyMatrix4(matrix)

  const center = new THREE.Vector3()
  const size = new THREE.Vector3()
  box.getCenter(center)
  box.getSize(size)

  return { id: obj.id, min: box.min, max: box.max, center, size }
}

export type AlignAxis = 'x' | 'y' | 'z'
export type AlignMode = 'min' | 'center' | 'max'

/**
 * Align objects along an axis.
 * - 'min': align to the leftmost/lowest object's edge
 * - 'center': align to the center of the bounding box of all objects
 * - 'max': align to the rightmost/highest object's edge
 */
export function alignObjects(
  objects: SceneObject[],
  axis: AlignAxis,
  mode: AlignMode
): SceneObject[] {
  if (objects.length < 2) return objects

  const bounds = objects.map(getObjectBounds)

  let target: number
  if (mode === 'min') {
    target = Math.min(...bounds.map((b) => b.min[axis]))
  } else if (mode === 'max') {
    target = Math.max(...bounds.map((b) => b.max[axis]))
  } else {
    // center
    const allMin = Math.min(...bounds.map((b) => b.min[axis]))
    const allMax = Math.max(...bounds.map((b) => b.max[axis]))
    target = (allMin + allMax) / 2
  }

  return objects.map((obj, i) => {
    const b = bounds[i]
    let offset: number
    if (mode === 'min') {
      offset = target - b.min[axis]
    } else if (mode === 'max') {
      offset = target - b.max[axis]
    } else {
      offset = target - b.center[axis]
    }

    const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2
    const newPos: [number, number, number] = [...obj.position]
    newPos[axisIndex] += offset
    return { ...obj, position: newPos }
  })
}

/**
 * Distribute objects evenly along an axis.
 * Objects are spaced so that the gaps between them are equal.
 */
export function distributeObjects(
  objects: SceneObject[],
  axis: AlignAxis
): SceneObject[] {
  if (objects.length < 3) return objects

  const bounds = objects.map(getObjectBounds)
  const axisIndex = axis === 'x' ? 0 : axis === 'y' ? 1 : 2

  // Sort by center position along axis
  const sorted = bounds
    .map((b, i) => ({ bounds: b, index: i }))
    .sort((a, b) => a.bounds.center[axis] - b.bounds.center[axis])

  const first = sorted[0].bounds.center[axis]
  const last = sorted[sorted.length - 1].bounds.center[axis]
  const step = (last - first) / (sorted.length - 1)

  const result = [...objects]
  sorted.forEach((item, sortIdx) => {
    const targetCenter = first + step * sortIdx
    const offset = targetCenter - item.bounds.center[axis]
    const newPos: [number, number, number] = [...result[item.index].position]
    newPos[axisIndex] += offset
    result[item.index] = { ...result[item.index], position: newPos }
  })

  return result
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/alignEngine.ts
git commit -m "feat: add align and distribute engine for multi-selected objects"
```

---

### Task 9: Align Toolbar Component

**Files:**
- Create: `src/components/AlignToolbar.tsx`
- Modify: `src/app/generate/page.tsx`

- [ ] **Step 1: Create AlignToolbar**

```typescript
// src/components/AlignToolbar.tsx
'use client'

import React from 'react'
import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
} from 'lucide-react'
import type { AlignAxis, AlignMode } from '@/lib/alignEngine'

interface AlignToolbarProps {
  selectedCount: number
  onAlign: (axis: AlignAxis, mode: AlignMode) => void
  onDistribute: (axis: AlignAxis) => void
}

export default function AlignToolbar({
  selectedCount,
  onAlign,
  onDistribute,
}: AlignToolbarProps) {
  const canAlign = selectedCount >= 2
  const canDistribute = selectedCount >= 3

  const btnClass = (disabled: boolean) =>
    `p-2 rounded ${
      disabled
        ? 'opacity-30 cursor-not-allowed'
        : 'bg-zinc-800 hover:bg-zinc-700 text-white cursor-pointer'
    }`

  return (
    <div className="flex flex-col gap-2">
      {/* Align X axis */}
      <div className="text-xs text-zinc-500 uppercase tracking-wider px-1">
        Align
      </div>
      <div className="grid grid-cols-3 gap-1">
        <button
          onClick={() => onAlign('x', 'min')}
          disabled={!canAlign}
          className={btnClass(!canAlign)}
          title="Align Left (X min)"
        >
          <AlignStartVertical size={14} />
        </button>
        <button
          onClick={() => onAlign('x', 'center')}
          disabled={!canAlign}
          className={btnClass(!canAlign)}
          title="Align Center X"
        >
          <AlignCenterVertical size={14} />
        </button>
        <button
          onClick={() => onAlign('x', 'max')}
          disabled={!canAlign}
          className={btnClass(!canAlign)}
          title="Align Right (X max)"
        >
          <AlignEndVertical size={14} />
        </button>
        <button
          onClick={() => onAlign('y', 'min')}
          disabled={!canAlign}
          className={btnClass(!canAlign)}
          title="Align Bottom (Y min)"
        >
          <AlignStartHorizontal size={14} />
        </button>
        <button
          onClick={() => onAlign('y', 'center')}
          disabled={!canAlign}
          className={btnClass(!canAlign)}
          title="Align Center Y"
        >
          <AlignCenterHorizontal size={14} />
        </button>
        <button
          onClick={() => onAlign('y', 'max')}
          disabled={!canAlign}
          className={btnClass(!canAlign)}
          title="Align Top (Y max)"
        >
          <AlignEndHorizontal size={14} />
        </button>
      </div>

      {/* Distribute */}
      <div className="text-xs text-zinc-500 uppercase tracking-wider px-1 mt-1">
        Distribute
      </div>
      <div className="grid grid-cols-3 gap-1">
        <button
          onClick={() => onDistribute('x')}
          disabled={!canDistribute}
          className={btnClass(!canDistribute)}
          title="Distribute X"
        >
          <span className="text-xs">X</span>
        </button>
        <button
          onClick={() => onDistribute('y')}
          disabled={!canDistribute}
          className={btnClass(!canDistribute)}
          title="Distribute Y"
        >
          <span className="text-xs">Y</span>
        </button>
        <button
          onClick={() => onDistribute('z')}
          disabled={!canDistribute}
          className={btnClass(!canDistribute)}
          title="Distribute Z"
        >
          <span className="text-xs">Z</span>
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire AlignToolbar into generate/page.tsx**

Add import:

```typescript
import AlignToolbar from '@/components/AlignToolbar'
import { alignObjects, distributeObjects, type AlignAxis, type AlignMode } from '@/lib/alignEngine'
```

Add handlers:

```typescript
const handleAlign = useCallback((axis: AlignAxis, mode: AlignMode) => {
  const selected = objects.filter(o => selectedIds.includes(o.id))
  const aligned = alignObjects(selected, axis, mode)
  const updatedObjects = objects.map(o => {
    const alignedObj = aligned.find(a => a.id === o.id)
    return alignedObj || o
  })
  setObjects(updatedObjects)
  pushHistory()
}, [selectedIds, objects, pushHistory])

const handleDistribute = useCallback((axis: AlignAxis) => {
  const selected = objects.filter(o => selectedIds.includes(o.id))
  const distributed = distributeObjects(selected, axis)
  const updatedObjects = objects.map(o => {
    const distObj = distributed.find(d => d.id === o.id)
    return distObj || o
  })
  setObjects(updatedObjects)
  pushHistory()
}, [selectedIds, objects, pushHistory])
```

Add to left sidebar (after Boolean section):

```typescript
{/* Align & Distribute */}
<div className="border-t border-zinc-800 pt-3 mt-3">
  <div className="text-xs text-zinc-500 uppercase tracking-wider mb-2 px-1">
    Arrange
  </div>
  <AlignToolbar
    selectedCount={selectedIds.length}
    onAlign={handleAlign}
    onDistribute={handleDistribute}
  />
</div>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/AlignToolbar.tsx src/app/generate/page.tsx
git commit -m "feat: add align and distribute toolbar for arranging multi-selected objects"
```

---

## Chunk 5: Smart Rulers & Dimension Inputs

### Task 10: Dimension Helpers

**Files:**
- Create: `src/lib/dimensionHelpers.ts`

- [ ] **Step 1: Create dimension helpers module**

```typescript
// src/lib/dimensionHelpers.ts
import * as THREE from 'three'
import type { SceneObject } from './cadStore'
import { buildGeometry } from './cadStore'

export interface DimensionLine {
  start: THREE.Vector3
  end: THREE.Vector3
  distance: number
  axis: 'x' | 'y' | 'z' | 'diagonal'
  label: string
}

/**
 * Get the world-space bounding box of an object.
 */
export function getWorldBounds(obj: SceneObject): THREE.Box3 {
  const geo = buildGeometry(obj)
  geo.computeBoundingBox()
  const box = geo.boundingBox!.clone()
  const matrix = new THREE.Matrix4()
  matrix.compose(
    new THREE.Vector3(...obj.position),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(...obj.rotation)),
    new THREE.Vector3(...obj.scale)
  )
  box.applyMatrix4(matrix)
  return box
}

/**
 * Compute dimension lines between two objects.
 * Returns lines for X, Y, Z distances between centers.
 */
export function computeDimensionLines(
  objA: SceneObject,
  objB: SceneObject
): DimensionLine[] {
  const boxA = getWorldBounds(objA)
  const boxB = getWorldBounds(objB)
  const centerA = new THREE.Vector3()
  const centerB = new THREE.Vector3()
  boxA.getCenter(centerA)
  boxB.getCenter(centerB)

  const lines: DimensionLine[] = []

  // X distance
  const dx = Math.abs(centerA.x - centerB.x)
  if (dx > 0.01) {
    lines.push({
      start: new THREE.Vector3(centerA.x, Math.min(boxA.min.y, boxB.min.y) - 0.3, centerA.z),
      end: new THREE.Vector3(centerB.x, Math.min(boxA.min.y, boxB.min.y) - 0.3, centerA.z),
      distance: dx,
      axis: 'x',
      label: `${dx.toFixed(2)}`,
    })
  }

  // Y distance
  const dy = Math.abs(centerA.y - centerB.y)
  if (dy > 0.01) {
    lines.push({
      start: new THREE.Vector3(Math.max(boxA.max.x, boxB.max.x) + 0.3, centerA.y, centerA.z),
      end: new THREE.Vector3(Math.max(boxA.max.x, boxB.max.x) + 0.3, centerB.y, centerA.z),
      distance: dy,
      axis: 'y',
      label: `${dy.toFixed(2)}`,
    })
  }

  // Z distance
  const dz = Math.abs(centerA.z - centerB.z)
  if (dz > 0.01) {
    lines.push({
      start: new THREE.Vector3(centerA.x, Math.min(boxA.min.y, boxB.min.y) - 0.3, centerA.z),
      end: new THREE.Vector3(centerA.x, Math.min(boxA.min.y, boxB.min.y) - 0.3, centerB.z),
      distance: dz,
      axis: 'z',
      label: `${dz.toFixed(2)}`,
    })
  }

  return lines
}

/**
 * Compute the dimensions of a single object (width, height, depth).
 */
export function computeObjectDimensions(
  obj: SceneObject
): { width: number; height: number; depth: number } {
  const box = getWorldBounds(obj)
  const size = new THREE.Vector3()
  box.getSize(size)
  return { width: size.x, height: size.y, depth: size.z }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/dimensionHelpers.ts
git commit -m "feat: add dimension helpers for measuring distances between objects"
```

---

### Task 11: Smart Rulers Component

**Files:**
- Create: `src/components/SmartRulers.tsx`
- Modify: `src/components/CADViewport.tsx`

- [ ] **Step 1: Create SmartRulers component**

```typescript
// src/components/SmartRulers.tsx
'use client'

import React, { useMemo } from 'react'
import { Line, Html } from '@react-three/drei'
import type { SceneObject } from '@/lib/cadStore'
import { computeDimensionLines, computeObjectDimensions } from '@/lib/dimensionHelpers'

interface SmartRulersProps {
  objects: SceneObject[]
  selectedIds: string[]
  visible: boolean
}

const AXIS_COLORS = {
  x: '#ef4444', // red
  y: '#22c55e', // green
  z: '#3b82f6', // blue
  diagonal: '#a855f7', // purple
}

export default function SmartRulers({
  objects,
  selectedIds,
  visible,
}: SmartRulersProps) {
  const dimensionLines = useMemo(() => {
    if (!visible || selectedIds.length < 1) return []

    const selectedObjs = objects.filter((o) => selectedIds.includes(o.id))

    if (selectedIds.length === 1) {
      // Single selection: show object dimensions
      const obj = selectedObjs[0]
      if (!obj) return []
      const dims = computeObjectDimensions(obj)
      const pos = obj.position

      return [
        // Width (X)
        {
          start: [pos[0] - dims.width / 2, pos[1] - dims.height / 2 - 0.2, pos[2]] as [number, number, number],
          end: [pos[0] + dims.width / 2, pos[1] - dims.height / 2 - 0.2, pos[2]] as [number, number, number],
          label: `W: ${dims.width.toFixed(2)}`,
          color: AXIS_COLORS.x,
        },
        // Height (Y)
        {
          start: [pos[0] + dims.width / 2 + 0.2, pos[1] - dims.height / 2, pos[2]] as [number, number, number],
          end: [pos[0] + dims.width / 2 + 0.2, pos[1] + dims.height / 2, pos[2]] as [number, number, number],
          label: `H: ${dims.height.toFixed(2)}`,
          color: AXIS_COLORS.y,
        },
        // Depth (Z)
        {
          start: [pos[0] - dims.width / 2 - 0.2, pos[1] - dims.height / 2 - 0.2, pos[2] - dims.depth / 2] as [number, number, number],
          end: [pos[0] - dims.width / 2 - 0.2, pos[1] - dims.height / 2 - 0.2, pos[2] + dims.depth / 2] as [number, number, number],
          label: `D: ${dims.depth.toFixed(2)}`,
          color: AXIS_COLORS.z,
        },
      ]
    }

    // Multi-selection: show distances between pairs
    if (selectedIds.length === 2) {
      const [a, b] = selectedObjs
      if (!a || !b) return []
      const lines = computeDimensionLines(a, b)
      return lines.map((line) => ({
        start: [line.start.x, line.start.y, line.start.z] as [number, number, number],
        end: [line.end.x, line.end.y, line.end.z] as [number, number, number],
        label: line.label,
        color: AXIS_COLORS[line.axis],
      }))
    }

    return []
  }, [objects, selectedIds, visible])

  if (!visible || dimensionLines.length === 0) return null

  return (
    <group>
      {dimensionLines.map((line, i) => (
        <group key={i}>
          <Line
            points={[line.start, line.end]}
            color={line.color}
            lineWidth={1.5}
            dashed
            dashSize={0.05}
            gapSize={0.03}
          />

          {/* End caps */}
          <Line
            points={[
              [line.start[0], line.start[1] - 0.05, line.start[2]],
              [line.start[0], line.start[1] + 0.05, line.start[2]],
            ]}
            color={line.color}
            lineWidth={2}
          />
          <Line
            points={[
              [line.end[0], line.end[1] - 0.05, line.end[2]],
              [line.end[0], line.end[1] + 0.05, line.end[2]],
            ]}
            color={line.color}
            lineWidth={2}
          />

          {/* Label */}
          <Html
            position={[
              (line.start[0] + line.end[0]) / 2,
              (line.start[1] + line.end[1]) / 2,
              (line.start[2] + line.end[2]) / 2,
            ]}
            center
            style={{ pointerEvents: 'none' }}
          >
            <div
              className="px-1.5 py-0.5 rounded text-xs font-mono whitespace-nowrap"
              style={{
                backgroundColor: 'rgba(0,0,0,0.8)',
                color: line.color,
                border: `1px solid ${line.color}40`,
              }}
            >
              {line.label}
            </div>
          </Html>
        </group>
      ))}
    </group>
  )
}
```

- [ ] **Step 2: Add SmartRulers to CADViewport**

Import and add to the scene:

```typescript
import SmartRulers from './SmartRulers'

// In the Canvas, add:
<SmartRulers
  objects={objects}
  selectedIds={selectedIds}
  visible={true}
/>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/SmartRulers.tsx src/components/CADViewport.tsx
git commit -m "feat: add smart rulers showing dimensions and distances in viewport"
```

---

### Task 12: Dimension Input Component

**Files:**
- Create: `src/components/DimensionInput.tsx`
- Modify: `src/components/CADViewport.tsx`

- [ ] **Step 1: Create DimensionInput component**

```typescript
// src/components/DimensionInput.tsx
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Html } from '@react-three/drei'

interface DimensionInputProps {
  position: [number, number, number]
  axis: 'x' | 'y' | 'z'
  currentValue: number
  onSubmit: (value: number) => void
  onCancel: () => void
  visible: boolean
}

const AXIS_LABELS: Record<string, { label: string; color: string }> = {
  x: { label: 'X', color: '#ef4444' },
  y: { label: 'Y', color: '#22c55e' },
  z: { label: 'Z', color: '#3b82f6' },
}

/**
 * Floating input that appears in the viewport for typing exact dimension values.
 * Triggered by double-clicking a dimension ruler or pressing Tab during transform.
 */
export default function DimensionInput({
  position,
  axis,
  currentValue,
  onSubmit,
  onCancel,
  visible,
}: DimensionInputProps) {
  const [value, setValue] = useState(currentValue.toFixed(3))
  const inputRef = useRef<HTMLInputElement>(null)
  const { label, color } = AXIS_LABELS[axis]

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [visible])

  useEffect(() => {
    setValue(currentValue.toFixed(3))
  }, [currentValue])

  if (!visible) return null

  const handleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === 'Enter') {
      const num = parseFloat(value)
      if (!isNaN(num)) {
        onSubmit(num)
      }
    } else if (e.key === 'Escape') {
      onCancel()
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const num = parseFloat(value)
      if (!isNaN(num)) {
        onSubmit(num)
      }
    }
  }

  return (
    <Html position={position} center style={{ pointerEvents: 'auto' }}>
      <div
        className="flex items-center gap-1 rounded shadow-lg"
        style={{
          backgroundColor: 'rgba(0,0,0,0.9)',
          border: `1px solid ${color}`,
          padding: '2px 6px',
        }}
      >
        <span
          className="text-xs font-bold"
          style={{ color }}
        >
          {label}
        </span>
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => onCancel()}
          className="w-16 bg-transparent text-white text-xs font-mono outline-none border-none"
          style={{ caretColor: color }}
        />
      </div>
    </Html>
  )
}
```

- [ ] **Step 2: Integrate DimensionInput into CADViewport**

Add state for dimension input visibility:

```typescript
import DimensionInput from './DimensionInput'

// State for dimension input
const [dimInput, setDimInput] = useState<{
  visible: boolean
  axis: 'x' | 'y' | 'z'
  position: [number, number, number]
  currentValue: number
  objectId: string
} | null>(null)

// Handler for submitting dimension value
const handleDimSubmit = useCallback((value: number) => {
  if (!dimInput) return
  const obj = objects.find(o => o.id === dimInput.objectId)
  if (!obj) return

  const axisIndex = dimInput.axis === 'x' ? 0 : dimInput.axis === 'y' ? 1 : 2
  const newPos: [number, number, number] = [...obj.position]
  newPos[axisIndex] = value
  onTransformUpdate(obj.id, newPos, obj.rotation, obj.scale)
  setDimInput(null)
}, [dimInput, objects, onTransformUpdate])

// In JSX:
{dimInput && (
  <DimensionInput
    position={dimInput.position}
    axis={dimInput.axis}
    currentValue={dimInput.currentValue}
    onSubmit={handleDimSubmit}
    onCancel={() => setDimInput(null)}
    visible={true}
  />
)}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/DimensionInput.tsx src/components/CADViewport.tsx
git commit -m "feat: add floating dimension input for typing exact values in viewport"
```

---

## Chunk 6: STL Export with Manifold Validation + Final Integration

### Task 13: Update STL Export to Use Manifold

**Files:**
- Modify: `src/utils/stlExporter.ts`

- [ ] **Step 1: Update stlExporter to validate with manifold-3d**

```typescript
// src/utils/stlExporter.ts
import * as THREE from 'three'
import { STLExporter } from 'three-stdlib'

/**
 * Export scene to STL.
 */
export function exportToSTL(scene: THREE.Scene, filename?: string) {
  const exporter = new STLExporter()
  const result = exporter.parse(scene, { binary: true })
  const blob = new Blob([result], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename || 'spacevision_model.stl'
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Validate geometry is manifold before export (watertight check).
 * Uses manifold-3d WASM for validation.
 */
export async function validateAndExportSTL(
  scene: THREE.Scene,
  filename?: string
): Promise<{ success: boolean; warnings: string[] }> {
  const warnings: string[] = []

  try {
    const Module = await import('manifold-3d')
    const wasm = await Module.default()
    const { Manifold, Mesh: ManifoldMesh } = wasm

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geo = child.geometry as THREE.BufferGeometry
        const posAttr = geo.getAttribute('position')
        const indexAttr = geo.getIndex()

        if (!posAttr || !indexAttr) {
          warnings.push(`Mesh "${child.name || 'unnamed'}": missing position or index data`)
          return
        }

        try {
          const mesh = new ManifoldMesh({
            numProp: 3,
            vertProperties: new Float32Array(posAttr.array),
            triVerts: new Uint32Array(indexAttr.array),
          })
          const manifold = new Manifold(mesh)
          const status = manifold.status()
          if (status !== 0) {
            warnings.push(
              `Mesh "${child.name || 'unnamed'}": not manifold (status ${status}). May have holes or self-intersections.`
            )
          }
        } catch {
          warnings.push(
            `Mesh "${child.name || 'unnamed'}": could not validate — may not be watertight`
          )
        }
      }
    })
  } catch {
    warnings.push('Manifold validation unavailable — exporting without validation')
  }

  exportToSTL(scene, filename)
  return { success: true, warnings }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/utils/stlExporter.ts
git commit -m "feat: add manifold validation to STL export for watertight geometry checks"
```

---

### Task 14: Final Integration — Wire Everything Together

**Files:**
- Modify: `src/components/CADViewport.tsx` — pass all new props
- Modify: `src/app/generate/page.tsx` — final prop wiring and keyboard shortcuts
- Modify: `src/lib/cadStore.ts` — ensure buildGeometry is exported

- [ ] **Step 1: Ensure buildGeometry is exported from cadStore.ts**

At line 93, verify `buildGeometry` has the `export` keyword:

```typescript
export function buildGeometry(obj: SceneObject): THREE.BufferGeometry {
```

- [ ] **Step 2: Update CADViewport props interface**

Update the CADViewport component to accept all new props:

```typescript
interface CADViewportProps {
  objects: SceneObject[]
  selectedIds: string[]        // Changed from selectedId
  csgGroups: CSGGroup[]        // NEW
  transformMode: 'translate' | 'rotate' | 'scale'
  wireframe: boolean
  snapEnabled: boolean
  snapValue: number
  gridVisible: boolean
  showRulers: boolean          // NEW
  onSelect: (id: string, event: ThreeEvent<MouseEvent>) => void
  onTransformUpdate: (id: string, pos: [number, number, number], rot: [number, number, number], scl: [number, number, number]) => void
  onDeselect: () => void
  onSnapToFace?: (position: [number, number, number], rotation: [number, number, number]) => void  // NEW
}
```

- [ ] **Step 3: Add ruler toggle to toolbar in generate/page.tsx**

Add state:

```typescript
const [showRulers, setShowRulers] = useState(true)
```

Add toolbar button (near the wireframe/snap toggles):

```typescript
<button
  onClick={() => setShowRulers(!showRulers)}
  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
    showRulers ? 'bg-blue-600 text-white' : 'bg-zinc-800 text-zinc-400 hover:text-white'
  }`}
  title="Smart Rulers (M)"
>
  <Ruler size={18} />
</button>
```

Add keyboard shortcut:

```typescript
case 'm':
case 'M':
  setShowRulers(prev => !prev)
  break
```

- [ ] **Step 4: Update status bar with new info**

```typescript
<div className="flex items-center gap-4 px-4 py-1.5 bg-zinc-900 border-t border-zinc-800 text-xs text-zinc-500">
  <span>{objects.length} objects</span>
  <span>{selectedIds.length} selected</span>
  <span>Mode: {transformMode}</span>
  {snapEnabled && <span>Snap: {snapValue}</span>}
  {wireframe && <span>Wireframe</span>}
  {showRulers && <span>Rulers</span>}
  {csgGroups.length > 0 && <span>{csgGroups.length} groups</span>}
</div>
```

- [ ] **Step 5: Verify full build**

```bash
cd /Users/electro/Desktop/code/spacevision
npm run build 2>&1 | tail -30
```

Expected: Build succeeds with no errors.

- [ ] **Step 6: Manual testing checklist**

1. Open `/generate` page
2. Add 2+ shapes (Box, Sphere)
3. Shift+Click to multi-select both
4. Click "Hole" on one shape — verify it turns red/transparent
5. Click "Group" — verify CSG result renders (sphere hole cut from box)
6. Ungroup — verify individual shapes return
7. Try Advanced mode: Union, Subtract, Intersect
8. Select 3+ objects → test Align Left, Center, Right
9. Test Distribute X with 3+ objects
10. Verify smart rulers show dimensions on single select
11. Select 2 objects — verify distance measurements appear
12. Toggle rulers with M key
13. Export STL — verify download works
14. Test Ctrl+Z undo after boolean operations

- [ ] **Step 7: Final commit**

```bash
git add -A
git commit -m "feat: complete TinkerCAD-style modeling framework — CSG booleans, multi-select, align/distribute, smart rulers"
```

---

## Keyboard Shortcuts Summary

| Shortcut | Action |
|----------|--------|
| G | Move (translate) |
| R | Rotate |
| S | Scale |
| W | Wireframe toggle |
| X | Snap toggle |
| M | Smart Rulers toggle |
| H | Toggle Hole |
| D | Duplicate |
| Del/Backspace | Delete |
| Ctrl+G | Group (TinkerCAD mode) |
| Ctrl+Shift+G | Ungroup |
| Ctrl+A | Select All |
| Shift+Click | Multi-select toggle |
| Ctrl+Z | Undo |
| Ctrl+Y | Redo |
| Esc | Deselect all |
