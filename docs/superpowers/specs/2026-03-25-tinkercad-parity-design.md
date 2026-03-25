# TinkerCAD Parity — Full Design Spec

## Goal

Bring SpaceVision to full TinkerCAD feature parity: complete shape library, material/texture system, workplane-based workflow, drag-to-place, and polished CSG operations. Four implementation cycles ordered by technical dependency.

## Current State

SpaceVision has: 14 primitive types (7 in toolbar), CSG boolean operations, multi-select with alignment, snap-to-face, smart rulers, AI-powered generation, STL/OBJ/GLTF import, STL export with manifold validation, undo/redo, opacity, random colors.

**Missing:** Rich shape library, material presets/textures, workplane, drag-to-place, flatten-to-ground, copy/paste, mirror, dimension drag handles, object list panel, CSG UX polish, additional export formats.

---

## Cycle 1: New Shapes + Shape Drawer + Drag-to-Place

### 1.1 New Shape Types

Add 10 new primitives to `cadStore.ts`:

| Shape | Type Key | Geometry Approach | Parametric Controls |
|---|---|---|---|
| Rounded Box | `roundedBox` | `THREE.ExtrudeGeometry` from rounded rectangle `THREE.Shape` with `absarc` corners | `cornerRadius`, `rbWidth`, `rbHeight`, `rbDepth` |
| Text | `text3d` | `THREE.ExtrudeGeometry` from font glyphs via `THREE.FontLoader` + bundled Helvetiker font | `textContent`, `fontSize`, `extrudeDepth`, `bevelEnabled`, `bevelSize` |
| Half Sphere | `halfSphere` | `THREE.SphereGeometry` with `thetaLength = Math.PI / 2` | `radius`, `widthSegs`, `heightSegs` |
| Pyramid | `pyramid` | `THREE.ConeGeometry` with `radialSegments = 4` | `pyramidHeight`, `pyramidBase` |
| Heart | `heart` | Custom `THREE.Shape` (two arcs + point) extruded | `heartSize`, `heartDepth` |
| Spring | `spring` | `THREE.TubeGeometry` along parametric helix `THREE.Curve` | `springCoils`, `springRadius`, `wireRadius` |
| Screw | `screw` | Spring geometry + cylinder shaft merged | `screwLength`, `screwRadius`, `threadPitch` |
| Roof | `roof` | `THREE.ExtrudeGeometry` from equilateral triangle | `roofWidth`, `roofHeight`, `roofDepth` |
| Arrow | `arrow` | `THREE.ExtrudeGeometry` from arrow-shaped `THREE.Shape` (shaft + head) | `arrowLength`, `arrowHeadSize`, `arrowDepth` |
| Ring (thin torus) | `ring` | `THREE.TorusGeometry` with thin tubeRadius | `ringRadius`, `ringThickness` |

**ShapeParams additions:** Each shape's parametric controls added to the `ShapeParams` interface.

**SceneObject type union:** Extended with all 10 new type keys.

**buildGeometry switch:** 10 new cases with full parametric geometry construction.

**createObject names map:** 10 new entries.

### 1.2 Shape Drawer Panel

Replace the small icon toolbar section ("ADD" with 7 buttons) with a collapsible shape drawer:

**Location:** Right side of toolbar, expands into a floating panel or slides out.

**Structure:**
```
┌─────────────────────┐
│ Shapes          [×] │
│─────────────────────│
│ ▼ Basic             │
│ [□][○][⬡][△][▽]   │
│ [Wedge][Tube][Star] │
│ ▼ Extended          │
│ [Rounded][Half○]    │
│ [Pyramid][Roof]     │
│ [Ring][Arrow]       │
│ ▼ Text & Mech.     │
│ [Text][Spring]      │
│ [Screw][Heart]      │
│─────────────────────│
│ ▼ Holes             │
│ [□][○][⬡] (hole)   │
│ Pre-toggled isHole  │
└─────────────────────┘
```

**Categories:**
- **Basic:** box, sphere, cylinder, cone, wedge, tube, star, torus, torusKnot, dodecahedron, octahedron, plane, capsule
- **Extended:** roundedBox, halfSphere, pyramid, roof, ring, arrow
- **Text & Mechanical:** text3d, spring, screw, heart
- **Holes:** Duplicates of common shapes but pre-set with `isHole: true` (TinkerCAD's hole shapes panel)

**Implementation:** New `ShapeDrawer.tsx` component. Each shape tile shows a small SVG icon and label. Click = add at smart position. Drag = drag-to-place (see 1.3).

### 1.3 Drag-to-Place

**Behavior:**
1. User starts dragging a shape tile from the drawer
2. A ghost preview (semi-transparent mesh) follows the cursor in the viewport
3. Raycast from cursor to workplane (default: y=0 ground plane) determines placement position
4. On drop, create the object at that position
5. If cursor is not over viewport, cancel (no placement)

**Implementation:**
- `onDragStart` on shape tile sets a `draggingShape` state with type info
- Viewport listens for `onPointerMove` when `draggingShape` is set
- Render a ghost mesh at the raycast hit point (same geometry, transparent material, opacity 0.4)
- `onPointerUp` in viewport creates the object and clears `draggingShape`
- `onDragEnd` outside viewport cancels

**Workplane raycasting:** Raycast against an invisible `THREE.Plane` at the current workplane position/normal. Default = `new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)` (ground).

### 1.4 AI Tool Schema Updates

Update `route.ts` tool definitions:
- Add all 10 new type keys to `add_object` enum
- Add new parametric properties to `params`
- Update `buildSystemPrompt` with new shape descriptions

---

## Cycle 2: Material Presets + Textures + Enhanced Controls

### 2.1 Material Preset System

**New field on SceneObject:** `materialPreset?: string` — one of: `"custom"`, `"wood"`, `"metal"`, `"glass"`, `"brick"`, `"plastic"`, `"stone"`, `"rubber"`, `"gold"`.

**New field on SceneObject:** `texture?: string` — texture key or `"none"`.

**Preset definitions** (stored in new `src/lib/materialPresets.ts`):

```typescript
interface MaterialPreset {
  name: string;
  metalness: number;
  roughness: number;
  color: string;
  opacity: number;
  texture: string | null; // texture key
}
```

| Preset | Metal | Rough | Color | Opacity | Texture |
|---|---|---|---|---|---|
| Wood | 0 | 0.85 | #d19a66 | 1 | `"wood"` |
| Metal | 0.9 | 0.2 | #c0c0c0 | 1 | `"brushedMetal"` |
| Glass | 0.1 | 0.05 | #a8d8ea | 0.3 | null |
| Brick | 0 | 0.95 | #b5523c | 1 | `"brick"` |
| Plastic | 0 | 0.4 | (keep current) | 1 | null |
| Stone | 0 | 0.9 | #888888 | 1 | `"stone"` |
| Rubber | 0 | 1.0 | #333333 | 1 | null |
| Gold | 1.0 | 0.1 | #ffd700 | 1 | null |

**When user selects a preset:** Override metalness, roughness, color, opacity, and texture fields. User can still manually adjust after applying.

**UI:** Horizontal row of circular preset swatches above the color picker in the properties panel. Each swatch shows a mini material preview (colored circle with appropriate shading).

### 2.2 Texture System

**Texture assets:** Bundle 4 small (256×256) tileable textures as static assets in `public/textures/`:
- `wood.jpg` — wood grain
- `brushedMetal.jpg` — brushed metal pattern
- `brick.jpg` — brick pattern
- `stone.jpg` — stone/concrete

**Texture loading:** New `src/lib/textureManager.ts`:
- Singleton `THREE.TextureLoader` instance
- `getTexture(key: string): THREE.Texture | null` — loads and caches textures
- Textures use `RepeatWrapping` with appropriate repeat scale per texture

**Rendering:** In `SceneMesh` (CADViewport.tsx):
- If `obj.texture` is set and not `"none"`, load texture and apply to `map` property of `meshStandardMaterial`
- Texture applied alongside existing color (color tints the texture)

### 2.3 Enhanced Shape Controls

**Smoothness control (universal):**
- Add a "Smoothness" slider to the properties panel (visible for all shapes)
- Maps to segment count: Low (8 segments) → Medium (32) → High (64) → Ultra (128)
- Stored as `smoothness?: number` (0-3 integer) on SceneObject
- Applied in `buildGeometry` by multiplying base segment counts

**Sides control (for cylinder, cone, tube):**
- "Sides" slider: 3 (triangle) → 4 (square) → 5 (pentagon) → 6 (hexagon) → ... → 32 (circle)
- Replaces `radialSegments` param with a more intuitive UI
- Shows the polygon name (Triangle, Square, Pentagon, Hexagon, Circle)

### 2.4 Dimension Handles

**When an object is selected, render 3 dimension labels in the viewport:**
- Width (X) label on the right edge
- Height (Y) label on the top edge
- Depth (Z) label on the front edge

**Each label:**
- Shows the current dimension as text (e.g., "1.50")
- Clickable → opens inline input field to type exact value
- Draggable → resize the object along that axis in real-time

**Implementation:** New `DimensionHandles.tsx` R3F component rendered inside Canvas when an object is selected. Uses `Html` from `@react-three/drei` for the labels (screen-space text anchored to 3D positions). Bounding box computed from geometry.

---

## Cycle 3: Workflow Features

### 3.1 Workplane

**State:** `workplane: { origin: [number,number,number], normal: [number,number,number], rotation: [number,number,number] }` — defaults to `{ origin: [0,0,0], normal: [0,1,0], rotation: [0,0,0] }`.

**Setting a workplane:**
- Select an object → right-click a face → "Set as Workplane"
- Or: toolbar button "Workplane" → click any face
- The workplane grid visual moves to that face
- New objects placed relative to the workplane

**Visual:** Semi-transparent grid overlay (`THREE.GridHelper` rotated/positioned to match workplane).

**Reset:** "Reset Workplane" button returns to ground plane.

### 3.2 Flatten to Ground

- Keyboard shortcut: **F**
- Toolbar button with down-arrow icon
- Computes bounding box min Y of selected object(s)
- Translates so min Y = workplane origin Y (default 0)
- Works on multi-select

### 3.3 Copy/Paste/Cut

- **Ctrl+C:** Serialize selected objects to internal clipboard (array of SceneObject, stripped of IDs)
- **Ctrl+V:** Deserialize from clipboard, assign new IDs, offset position by [0.5, 0, 0.5], add to scene
- **Ctrl+X:** Copy + delete selected
- Clipboard stored in `useRef` (component-level, not system clipboard)

### 3.4 Mirror/Flip

**Two modes:**
- **Flip:** Negate scale on one axis (e.g., scale.x *= -1). Keyboard: Shift+X / Shift+Y / Shift+Z
- **Mirror:** Create a duplicate reflected across the selected axis. Toolbar buttons.

### 3.5 Marquee Select (Box Select)

- Click and drag on empty viewport space → draw a 2D selection rectangle
- All objects whose screen-space bounding boxes intersect the rectangle are selected
- Shift+drag to add to existing selection
- Implementation: `onPointerDown` on background starts rectangle, `onPointerMove` updates, `onPointerUp` resolves selection via frustum culling or screen-space AABB test

### 3.6 Object List Panel

**New component:** `ObjectListPanel.tsx`

**Location:** Right sidebar, collapsible. Shows below or instead of the properties panel when nothing is selected.

**Structure:**
```
┌─────────────────────┐
│ Objects (12)    [±]  │
│─────────────────────│
│ 👁 🔒 📦 House Wall  │
│ 👁 🔒 📦 House Roof  │
│ 👁 🔓 ⭕ Window (hole)│
│ ▼ Group "House"     │
│   👁 📦 Wall Left    │
│   👁 📦 Wall Right   │
│ 👁 🔓 📦 Tree Trunk  │
└─────────────────────┘
```

**Features:**
- Click row to select object
- Eye icon toggles visibility
- Lock icon toggles locked state
- Groups shown as expandable tree nodes
- Drag rows to reorder (optional, nice-to-have)
- Right-click context menu: Rename, Duplicate, Delete, Toggle Hole, Flatten

---

## Cycle 4: CSG UX Polish + Export + Snapping

### 4.1 Hole Styling

Replace current red wireframe with TinkerCAD-style hole rendering:
- **Color:** Dark grey (#444444) with diagonal stripe pattern
- **Material:** Transparent (opacity 0.5) with a custom stripe shader or repeating texture
- **Label:** Small "HOLE" badge floating above the object

### 4.2 Smart Group

TinkerCAD's core operation: select objects → click "Group" → all solids union, all holes subtract.

**Implementation:**
- New function `smartGroup(objects: SceneObject[]): CSGGroup`
- Separates objects into holes (`isHole === true`) and solids
- Creates a CSG group with operation: first union all solids, then subtract all holes
- This is the DEFAULT group behavior. Current manual union/subtract/intersect kept as "Advanced" options.

### 4.3 Boolean Preview

Before committing a group:
- Show semi-transparent preview of the resulting geometry
- "Apply" button confirms, "Cancel" reverts
- Uses existing `performGroupCSG` from `csgEngine.ts` to compute preview geometry

### 4.4 Export Upgrades

**OBJ Export:**
- New `src/utils/objExporter.ts`
- Uses `three-stdlib` `OBJExporter`
- Includes material colors in companion `.mtl` file

**GLTF/GLB Export:**
- New `src/utils/gltfExporter.ts`
- Uses `three-stdlib` `GLTFExporter`
- Preserves materials, colors, textures, opacity
- Binary GLB format for smaller file size

**Export menu:** Replace single "Export STL" button with dropdown: STL / OBJ / GLTF

### 4.5 Snap Improvements

**Object-to-object edge snapping:**
- When dragging an object, detect proximity to other objects' edges/faces
- Show alignment guide lines (thin colored lines) when within snap threshold
- Snap to edge/center/face of nearby objects

**Alignment guides (Figma-style):**
- When moving an object, show red/blue guide lines when it aligns with other objects' centers or edges
- Implementation: compute all object bounding boxes, check if current position aligns within threshold on any axis

---

## Data Model Changes Summary

**New SceneObject fields:**
```typescript
  materialPreset?: string;  // "wood", "metal", "glass", etc.
  texture?: string;         // texture key or "none"
  smoothness?: number;      // 0-3 (low to ultra)
```

**New SceneObject type union additions:**
```
"roundedBox" | "text3d" | "halfSphere" | "pyramid" | "heart" | "spring" | "screw" | "roof" | "arrow" | "ring"
```

**New ShapeParams additions:**
```typescript
  // Rounded Box
  cornerRadius?: number;
  rbWidth?: number;
  rbHeight?: number;
  rbDepth?: number;
  // Text
  textContent?: string;
  fontSize?: number;
  extrudeDepth?: number;
  bevelEnabled?: boolean;
  bevelSize?: number;
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

---

## New Files

| File | Purpose |
|---|---|
| `src/components/ShapeDrawer.tsx` | Shape panel with categories and drag support |
| `src/components/ObjectListPanel.tsx` | Object hierarchy list |
| `src/components/DimensionHandles.tsx` | 3D dimension labels and drag handles |
| `src/components/BooleanPreview.tsx` | CSG preview overlay |
| `src/components/AlignmentGuides.tsx` | Figma-style alignment guide lines |
| `src/components/MarqueeSelect.tsx` | Box selection overlay |
| `src/lib/materialPresets.ts` | Material preset definitions and helpers |
| `src/lib/textureManager.ts` | Texture loading and caching |
| `src/lib/workplane.ts` | Workplane math (raycast to plane, project point) |
| `src/lib/clipboard.ts` | Copy/paste serialization |
| `src/utils/objExporter.ts` | OBJ export |
| `src/utils/gltfExporter.ts` | GLTF/GLB export |
| `public/textures/wood.jpg` | Wood grain texture |
| `public/textures/brushedMetal.jpg` | Brushed metal texture |
| `public/textures/brick.jpg` | Brick texture |
| `public/textures/stone.jpg` | Stone texture |

## Modified Files

| File | Changes |
|---|---|
| `src/lib/cadStore.ts` | New types, params, fields, geometry cases |
| `src/components/CADViewport.tsx` | Texture rendering, dimension handles, workplane grid, alignment guides, marquee select, hole styling |
| `src/app/generate/page.tsx` | Shape drawer integration, object list, copy/paste/mirror shortcuts, flatten, export menu, workplane UI |
| `src/app/api/generate/route.ts` | New shape types in tool schemas and system prompt |
| `src/lib/csgEngine.ts` | Smart group logic |
