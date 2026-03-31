# Interaction Modes & Tutorial System Design

## Problem

1. **Off-center visuals:** DimensionHandles and SmartRulers both display object dimensions, creating cluttered overlapping labels that look misaligned.
2. **Hard-to-use gizmo:** The current TransformControls gizmo (tiny RGB arrows) is the only way to move objects. New users expect to click and drag objects directly like in TinkerCAD.
3. **No onboarding:** New users have no way to learn the controls without trial and error.

## Solution

### 1. Remove DimensionHandles (duplicate dimension display)

Remove the `DimensionHandles` component from the viewport rendering. `SmartRulers` already displays W/H/D with clean dashed lines and labels. Having both creates visual noise.

Note: DimensionHandles has `onScaleChange` interactive callbacks. This capability is intentionally dropped — scale changes are available via the properties panel (always) and advanced mode gizmo. The file `DimensionHandles.tsx` is left in place but unused; it can be deleted later.

**Files changed:** `CADViewport.tsx` — remove `DimensionHandles` rendering (keep import for now).

### 2. Two Interaction Modes

New state: `interactionMode: "simple" | "advanced"` (default: `"simple"`).

#### Simple Mode (TinkerCAD-style)

- No TransformControls gizmo rendered.
- **Click** an object to select it (blue outline highlight, same as now).
- **Click+drag** a selected object to move it on the XZ ground plane (at the object's current Y height).
- A small **Y-axis lift handle** (cone arrow, fixed screen-size via `<Html>`, not occluded) appears above the selected object's bounding box. Dragging it moves the object up/down only.
- OrbitControls work normally when clicking empty space or right-click/middle-mouse anywhere.
- Snap-to-grid is respected when `snapEnabled` is true (same rounding as DragGhost).
- Multi-select: dragging one selected object moves ALL selected objects by the same delta.

**Mesh rendering in simple mode:** The selected object remains in the regular `objects.filter()` render loop (no exclusion). `SimpleDragControls` finds the mesh via `scene.traverse()` matching `userData.objId`, same pattern used by `BackgroundClick`. This avoids duplicating material/texture logic.

**Implementation — `SimpleDragControls` component:**
- Lives inside the Canvas, receives `selectedObj`, `selectedIds`, `objects`, `orbitRef`, `snapEnabled`, `snapValue`, `onTransformUpdate(id, pos, rot, scl)`.
- On `pointerdown` over a mesh with `userData.objId` matching a selected ID: disables OrbitControls, records start positions for all selected objects, creates a horizontal `THREE.Plane` at the primary object's Y height.
- On `pointermove`: raycasts pointer to the plane, computes XZ delta from start, applies delta to all selected objects' positions (with optional snap rounding).
- On `pointerup`: commits final positions via `onTransformUpdate` for each moved object, re-enables OrbitControls.
- The Y-lift handle: a `<Html>` element (arrow icon) positioned at `[objCenter.x, bboxMax.y + 0.3, objCenter.z]`. On drag, raycasts to a vertical plane (camera-facing) to compute Y delta. Updates all selected objects.

#### Advanced Mode (current behavior)

- TransformControls gizmo renders as it does now (primary selected object rendered inside TransformGizmo, excluded from regular loop).
- Supports translate/rotate/scale modes via G/R/S keys.
- No changes to current behavior.

#### Switching Between Modes

- **Toolbar button:** New icon in the left toolbar (between Select and Transform tools section). Shows current mode with tooltip.
- **Keyboard shortcut:** `Q` key toggles between simple and advanced. (Avoids collision with `V` being close to `Ctrl+V` paste.)
- When switching from simple to advanced, the current transform mode defaults to translate.
- Status bar shows current mode (e.g., "Mode: simple" or "Mode: advanced").

### 3. Tutorial System

An interactive step-by-step overlay that teaches new users the controls.

#### Trigger
- Auto-shows on first visit (tracked via `localStorage` key `spacevision-tutorial-completed`).
- Can be re-triggered from a help button (?) in the toolbar.
- Keyboard shortcut: `Shift+/` (which produces `?`). Guarded against firing when focus is in an input/textarea (same guard as existing shortcuts).

#### Tutorial Steps

Each step consists of:
- A **spotlight highlight** on the relevant UI element (dark overlay with cutout).
- A **tooltip popup** with title, description, and Next/Skip buttons.
- Final step has a "Done" button.

For steps targeting 3D viewport elements (steps 3-5), the spotlight highlights the entire canvas area and the tooltip describes the action with an illustration/icon rather than spotlighting a specific 3D object. Tutorial auto-adds a demo cube via `onAddDemoCube` callback prop if workspace is empty (steps 3-5 need an object).

**Step sequence:**

1. **Welcome** — "Welcome to SpaceVision! Let's learn the basics." (centered modal, no spotlight)
2. **Adding shapes** — Highlights the Shapes button (data-tutorial="shapes"). "Click here to add 3D shapes."
3. **Selecting** — Highlights canvas area. "Click any object to select it. A blue outline shows it's selected."
4. **Simple drag** — Highlights canvas area. "Drag a selected object to slide it around."
5. **Lift handle** — Highlights canvas area. "Use the arrow above to lift objects up or down."
6. **Mode toggle** — Highlights mode button (data-tutorial="mode-toggle"). "Switch to Advanced mode for precise axis controls. Press Q to toggle."
7. **Transform tools** — Highlights G/R/S buttons (data-tutorial="transform-tools"). "Move (G), Rotate (R), Scale (S) for different transforms."
8. **Properties panel** — Highlights right panel (data-tutorial="properties"). "Edit exact values, colors, and materials here."
9. **Export** — Highlights Export button (data-tutorial="export"). "Export as STL, OBJ, or GLTF."
10. **Done** — "You're all set! Press ? anytime to replay this tutorial."

#### Implementation — `TutorialOverlay` component

- Renders as a fixed-position overlay (`z-50`) above the entire page.
- Props: `isActive`, `onClose`, `onAddDemoCube`.
- Internal state: `currentStep: number`.
- Each step defined as: `{ targetSelector: string, title: string, description: string, position: "center" | "right" | "left" | "bottom" }`.
- Uses `getBoundingClientRect()` on `document.querySelector(step.targetSelector)` to position spotlight.
- Dark backdrop (`bg-black/60`) with a box-shadow inset cutout around the target rect.
- Tooltip positioned adjacent to the cutout.
- On close/done: sets `localStorage.setItem('spacevision-tutorial-completed', 'true')`.
- File: `src/components/TutorialOverlay.tsx`.

## Architecture

```
page.tsx
  ├── interactionMode state ("simple" | "advanced")
  ├── tutorialActive state (+ localStorage check on mount)
  ├── Q key handler (toggle mode)
  ├── Shift+/ key handler (show tutorial, guarded for inputs)
  │
  ├── CADViewport
  │   ├── [simple mode]: selected object stays in regular render loop
  │   ├── SimpleDragControls (when mode="simple" && selectedIds.length > 0)
  │   │   ├── pointerdown/move/up on selected meshes → XZ plane drag
  │   │   ├── snap-to-grid support
  │   │   └── Y-lift handle (Html element above bbox)
  │   ├── [advanced mode]: primary object rendered inside TransformGizmo (excluded from loop)
  │   ├── TransformGizmo (when mode="advanced" && selectedObj && !locked)
  │   ├── SmartRulers (kept)
  │   └── DimensionHandles (REMOVED from render)
  │
  ├── Left Toolbar
  │   └── Mode toggle button (data-tutorial="mode-toggle")
  │
  └── TutorialOverlay (when tutorialActive)
      └── Step-by-step spotlight + tooltip system
```

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/components/SimpleDragControls.tsx` | **Create** — XZ drag + Y-lift handle for simple mode |
| `src/components/TutorialOverlay.tsx` | **Create** — Step-by-step tutorial overlay |
| `src/components/CADViewport.tsx` | **Modify** — Add interactionMode prop, conditionally render SimpleDragControls vs TransformGizmo, remove DimensionHandles from render, change object filter logic based on mode |
| `src/app/generate/page.tsx` | **Modify** — Add interactionMode state, Q/? key handlers, tutorial state + localStorage, mode toggle in toolbar, data-tutorial attributes on key elements, pass mode to viewport |
| `src/components/DimensionHandles.tsx` | **No change** — left in place, just unused |

## Edge Cases

- **Simple mode + locked object:** Drag is disabled. Object shows selection highlight but no drag or lift handle.
- **Simple mode + grouped object:** Drag the group as a whole (not individual members).
- **Simple mode + multi-select:** Dragging any selected object moves ALL selected objects by the same delta.
- **Switching modes while dragging:** Ignore mode switch if a drag is in progress.
- **Tutorial + empty workspace:** Steps 3-5 call `onAddDemoCube` to auto-add a cube so the user has something to interact with.
- **Tutorial on canvas steps:** Spotlight covers entire canvas area since we cannot CSS-highlight individual 3D objects.
- **Snap in simple mode:** When `snapEnabled`, round XZ positions to nearest `snapValue` increment (same as DragGhost).
- **DimensionInput component:** Unaffected by mode changes, continues to work as-is.
