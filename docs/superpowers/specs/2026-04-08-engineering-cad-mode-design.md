# Engineering CAD Mode — Design Specification

## Overview

A professional parametric CAD system built into SpaceVision as a dedicated `/cad` route. Powered by OpenCascade.js (OCCT compiled to WebAssembly) as the geometry kernel, with a sketch-based parametric workflow modeled after Fusion 360, SolidWorks, and Onshape. Includes AI-assisted modeling via Claude tool-use, version control with branching, and comprehensive file format support.

## Decisions

- **Architecture**: OpenCascade.js (WASM) as the core BREP geometry kernel — provides battle-tested boolean operations, fillets, chamfers, sweeps, lofts, and native STEP/IGES support.
- **Route**: Separate `/cad` page with purpose-built UI, independent from Creative Studio. The existing Creative Studio (`/generate`) and its CSG system (`cadStore.ts`, `csgEngine.ts`, `CADViewport.tsx`) remain untouched — they serve artistic/visual 3D work. The new `/cad` route is a completely separate system with its own components, state, and OCCT kernel. No code is shared between them initially; shared utilities (e.g., R3F helpers) can be extracted later if patterns converge.
- **Workflow**: Sketch-based parametric modeling — select plane → draw 2D sketch → add constraints → apply 3D feature → modify.
- **File formats**: Full import/export suite — STEP, IGES, STL, OBJ, GLB, DXF, PDF, plus native `.svcp` project format.
- **AI**: Claude tool-use integration — reads feature tree JSON, has tools to create sketches, add constraints, apply operations.
- **Version control**: Auto-save snapshots, named versions, branching, visual diff. Stored per-user in database.
- **No simulation in v1**: Stress analysis, interference detection deferred to future work.

## System Architecture

Three layers:

### 1. UI Layer (React + React Three Fiber)

- **CAD Viewport**: R3F canvas rendering OCCT-tessellated geometry via Three.js. Orbit controls, zoom-to-fit, orthographic view presets (Front/Top/Right/Iso), view cube, render modes (Shaded/Wireframe/X-Ray).
- **Feature Tree Panel** (left sidebar): Ordered list of operations. Click to select/edit. Drag to reorder. Right-click for rollback-to-here. Shows constraint status icons. Parameters section below with name/value/expression columns.
- **Sketch Mode Overlay**: Activates when user enters sketch mode on a plane or face. Camera snaps to normal view. 2D drawing tools appear in contextual toolbar. Constraint indicators rendered as overlay symbols.
- **Properties Inspector** (right sidebar): Context-sensitive. Shows selected feature's editable properties — dimensions, references, material. Includes AI chat input at bottom.
- **Top Toolbar**: Menu bar (File, Edit, Sketch, Features, View) + contextual sketch tools strip. (Assembly mode is a future feature — not in scope for v1.)
- **OCCT Loading Screen**: Full-page overlay on first `/cad` visit while the ~15-25MB WASM bundle downloads. Shows progress bar, estimated time, and caches aggressively so subsequent visits load instantly.
- **Status Bar**: Constraint solve status, auto-save indicator, version name, feature count.

### 2. CAD Engine (TypeScript)

- **Feature Tree Manager**: Maintains ordered list of features as JSON. Each feature stores its type, parameters, sketch references, and OCCT shape handle. Supports insert, delete, reorder, and rollback (suppress features after a point).
- **Constraint Solver**: Custom 2D solver for sketch constraints. Newton-Raphson iteration with Levenberg-Marquardt fallback. Reports DOF count per sketch. Color-codes constraint status (green = fully constrained, yellow = under-constrained, red = over-constrained).
- **Parameter Registry**: Global parameter table. Each parameter has a name, value, unit, and optional expression. Expressions can reference other parameters (e.g., `hole_d = width * 0.1`). Evaluated with a dependency graph — circular references detected and rejected.
- **Operation History**: Undo/redo stack operating on feature tree snapshots. Each operation is a reversible delta (add feature, modify parameter, delete feature, reorder).
- **Version Control Manager**: Creates named snapshots of the full project state (feature tree JSON + parameter table). Supports branching (fork current state into new branch) and merging (apply feature tree diff from one branch onto another). Visual diff shows added/removed/modified features highlighted in the viewport.

### 3. Geometry Kernel (OpenCascade.js WASM)

Loaded lazily on first visit to `/cad`. ~15-25MB WASM bundle, cached by browser after first load. All OCCT operations run in a **Web Worker** to avoid blocking the UI thread — this covers BREP rebuilds (which replay the entire feature tree), HLR for technical drawings, and STEP/IGES import parsing. The main thread sends operation requests to the worker and receives tessellated geometry back for rendering.

**BREP Operations**:
- **Extrude** (BRepPrimAPI_MakePrism): Blind depth, through-all, up-to-face, mid-plane. Add or cut.
- **Revolve** (BRepPrimAPI_MakeRevol): Full 360°, angle, mid-plane. Around sketch axis or custom axis.
- **Sweep** (BRepOffsetAPI_MakePipe): Profile along path curve.
- **Loft** (BRepOffsetAPI_ThruSections): Between 2+ profiles, with optional guide curves.
- **Boolean** (BRepAlgoAPI_Fuse/Cut/Common): Union, subtract, intersect between bodies.
- **Fillet** (BRepFilletAPI_MakeFillet): Variable-radius support, edge selection.
- **Chamfer** (BRepFilletAPI_MakeChamfer): Distance or distance+angle.
- **Shell** (BRepOffsetAPI_MakeThickSolid): Hollow body with specified wall thickness, removing selected faces.
- **Linear Pattern**: Repeat feature N times along vector with spacing.
- **Circular Pattern**: Repeat feature N times around axis with angular spacing.
- **Mirror**: Reflect feature across a plane.

**Import/Export**:
- STEP read/write via STEPControl_Reader/Writer — lossless BREP interchange.
- IGES read/write via IGESControl_Reader/Writer.
- STL export via StlAPI_Writer with configurable mesh density.
- OBJ/GLB export via tessellation to indexed triangle mesh, then serialized.
- DXF export via HLR (Hidden Line Removal) projection to 2D, written with a DXF serializer.
- PDF export via same HLR projection, rendered to PDF with annotations.

**Tessellation**: OCCT shapes tessellated via BRepMesh_IncrementalMesh, then converted to Three.js BufferGeometry for rendering. Tessellation parameters (linear deflection, angular deflection) configurable for quality vs performance tradeoff.

**Geometry Queries**: Distance between entities, surface area, volume, center of mass, bounding box — all via OCCT's BRepGProp and BRepExtrema APIs.

## Constraint System

### Geometric Constraints (2D Sketch)

| Constraint | Description | Entities |
|---|---|---|
| Coincident | Point on point, or point on curve | 2 points, or point + line/arc |
| Parallel | Lines have same direction | 2 lines |
| Perpendicular | Lines are 90° apart | 2 lines |
| Tangent | Smooth transition at junction | Line + arc, or arc + arc |
| Concentric | Arcs/circles share center | 2 arcs/circles |
| Equal | Same length or radius | 2 lines, or 2 arcs |
| Symmetric | Mirror about a line | 2 points + symmetry line |
| Horizontal | Line is horizontal | 1 line |
| Vertical | Line is vertical | 1 line |
| Midpoint | Point at midpoint of segment | Point + line |
| Fix | Lock absolute position | 1 point or entity |

### Dimensional Constraints

| Constraint | Description |
|---|---|
| Linear Distance | Distance between two points or point-to-line |
| Radius | Fixed or parametric radius for arc/circle |
| Diameter | Fixed or parametric diameter |
| Angle | Angle between two lines |
| Ordinate | Distance from a datum point along an axis |

All dimensional constraints accept expressions referencing parameters (e.g., `= width / 2`).

### Solver

- Newton-Raphson iteration with Levenberg-Marquardt fallback for robustness.
- Jacobian computed analytically for each constraint type.
- DOF (degrees of freedom) tracked per sketch: `DOF = 2 * num_points - num_constraints`.
- Real-time solve on entity drag — solver runs on each mouse move, repositioning geometry to satisfy constraints.
- Status indicators: fully constrained (green), under-constrained (yellow, shows remaining DOF), over-constrained (red, highlights conflicting constraints).

### Error Handling & Recovery

- **Max iterations exceeded**: If solver fails to converge after 200 iterations, the sketch is marked as "unsolved." The last valid state is preserved, the offending constraint is highlighted in red, and a toast notification explains the issue. User can undo the constraint or adjust values.
- **Contradictory constraints**: When adding a constraint that creates an over-constrained state, the system detects it immediately (DOF < 0), rejects the constraint, and shows an error indicating which constraints conflict.
- **Recovery**: User can always undo to the last solved state. The "constraint status" panel in the properties inspector lists all constraints with their status, letting users identify and delete problematic ones.

## Native Project Format (.svcp)

SpaceVision CAD Project — JSON-based, stores complete parametric state:

```json
{
  "version": "1.0",
  "name": "Mounting Bracket",
  "units": "mm",
  "parameters": {
    "width": { "value": 60, "unit": "mm" },
    "height": { "value": 40, "unit": "mm" },
    "thickness": { "value": 3, "unit": "mm" },
    "hole_d": { "value": 4.2, "unit": "mm", "expression": null },
    "edge_offset": { "value": 5, "unit": "mm" }
  },
  "features": [
    {
      "id": "feat_001",
      "type": "sketch",
      "name": "Base Profile",
      "plane": "XY",
      "entities": [
        { "type": "rectangle", "origin": [0, 0], "width": "$width", "height": "$height" },
        { "type": "circle", "center": ["$edge_offset", "$edge_offset"], "diameter": "$hole_d" }
      ],
      "constraints": [
        { "type": "coincident", "refs": ["rect.corner_bl", "origin"] },
        { "type": "horizontal", "refs": ["rect.edge_bottom"] }
      ]
    },
    {
      "id": "feat_002",
      "type": "extrude",
      "name": "Base Body",
      "sketch": "feat_001",
      "profiles": ["rect"],
      "depth": "$thickness",
      "direction": "normal",
      "operation": "add"
    },
    {
      "id": "feat_003",
      "type": "extrude",
      "name": "Mounting Holes",
      "sketch": "feat_001",
      "profiles": ["circle_*"],
      "depth": "$thickness",
      "direction": "normal",
      "operation": "cut"
    },
    {
      "id": "feat_004",
      "type": "fillet",
      "name": "Edge Rounds",
      "edges": "all_outer",
      "radius": 1.0
    }
  ],
  "metadata": {
    "created": "2026-04-08T12:00:00Z",
    "modified": "2026-04-08T14:30:00Z",
    "author": "user@example.com",
    "material": "Aluminum 6061-T6"
  },
  "versionHistory": "stored in database (CadVersion table), not embedded in .svcp files"
}
```

## AI Integration

Claude operates on the feature tree via tool-use, identical to the existing Creative Studio pattern but with CAD-specific tools.

### Tools Available to Claude

| Tool | Parameters | Description |
|---|---|---|
| `create_sketch` | plane, entities[] | Create a new sketch on a plane or face |
| `add_constraint` | sketch_id, type, refs[], value? | Add geometric or dimensional constraint |
| `extrude` | sketch_id, profiles[], depth, direction, operation | Extrude sketch profiles |
| `revolve` | sketch_id, profiles[], axis, angle | Revolve sketch profiles |
| `sweep` | profile_sketch, path_sketch | Sweep profile along path |
| `loft` | profile_sketches[] | Loft between profiles |
| `fillet` | edges[], radius | Add fillet to edges |
| `chamfer` | edges[], distance | Add chamfer to edges |
| `shell` | faces_to_remove[], thickness | Shell a solid body |
| `boolean` | operation, body_a, body_b | Boolean operation |
| `add_pattern` | feature_id, type, params | Linear or circular pattern |
| `mirror` | feature_id, plane | Mirror feature |
| `set_parameter` | name, value, expression? | Set or create parameter |
| `create_drawing` | views[], annotations | Generate technical drawing |

### Context

Claude receives the full `.svcp` JSON as context when the user sends a message. This gives it complete understanding of the current design state — parameters, features, constraints, and their relationships.

### Interaction Pattern

1. User types natural language request in AI chat panel
2. System sends current feature tree JSON + user message to Claude API
3. Claude responds with tool calls to modify the feature tree
4. CAD engine executes each tool call sequentially, rebuilding OCCT geometry
5. Viewport updates after each operation
6. Claude's text response appears in chat explaining what was done

### AI Error Handling

When a tool call fails mid-sequence (e.g., Claude issues 5 operations but #3 produces invalid geometry):

1. **Stop execution** at the failing operation. Do not continue with subsequent tool calls since they likely depend on the failed one.
2. **Roll back** all operations from the current AI sequence — restore the feature tree to the state before the AI started.
3. **Report the error** to Claude with the failure details (which operation, what went wrong, the OCCT error message).
4. **Claude retries** with a corrected approach, having learned from the failure.
5. **User sees** a notification: "AI operation failed — rolled back. Retrying..." If the retry also fails, the user is shown the error and can intervene manually.

## Version Control

### Auto-Save

- Snapshot created after every feature operation (debounced 2s).
- Stored as full feature tree JSON snapshots (matching CadVersion schema — simpler than diffs, enables instant rollback without replay).
- Unlimited undo/redo navigates snapshot history.
- Snapshots stored in database, associated with user and project.

### Named Versions

- User manually creates named versions at meaningful milestones.
- Each version stores full project state (not a diff).
- Version list shown in a panel/dropdown with timestamps and names.

### Branching

- Fork current state into a named branch.
- Each branch has independent feature tree and version history.
- Default branch is "main."
- Compare branches: side-by-side viewport rendering, feature tree diff view.
- Merge: apply feature additions/modifications from source branch onto target. Conflicts (same feature modified differently) resolved via a merge dialog that shows: the feature in both branches side-by-side, options to "keep source," "keep target," or "keep both" (appends source feature after target's version). User must resolve all conflicts before merge completes. Can abort merge at any time. Detailed merge conflict UX will be specified in Phase 4's own spec.

### Storage

- Projects and versions stored in Postgres via Prisma.
- Project table: id, userId, name, currentBranch, createdAt, updatedAt.
- Version table: id, projectId, branch, name, featureTreeJson, parentVersionId, createdAt.
- Large BREP data (STEP cache) stored as blobs or in object storage if needed.

## Technical Drawing Generation

### Process

1. User selects "Create Drawing" from menu or AI generates via tool.
2. Choose views: Front, Top, Right, Isometric, Section views (user defines cut plane).
3. OCCT's HLRBRep_Algo computes hidden line removal for each view direction.
4. Visible and hidden edges extracted as 2D line segments.
5. Auto-dimensioning: system places dimensions for all constrained parameters, matching the parametric feature tree.
6. User can manually add/remove/reposition dimensions.
7. Title block filled from project metadata (name, material, scale, author, date).

### Annotation Types

- Linear dimensions with tolerance (e.g., 50.0 ±0.1)
- Radius/diameter callouts
- Angle dimensions
- Hole callouts (e.g., 4x Ø4.2 THRU)
- Surface finish symbols
- Section indicators (A-A, B-B)
- Notes and leaders

### Standards

- ISO (default), ASME, DIN projection methods.
- First-angle (ISO/DIN) or third-angle (ASME) projection configurable.

### Export

- **PDF**: Vector output with title block, suitable for printing.
- **DXF**: Standard CAD interchange for CNC/laser cutting workflows.
- **SVG**: Web-friendly vector format.

## Page Layout

```
┌──────────────────────────────────────────────────────────────┐
│ SpaceVision CAD │ File Edit Sketch Features View             │ ● OCCT Ready │ AI Assist │
├──────────────────────────────────────────────────────────────┤
│ Sketch: Line │ Arc │ Circle │ Rect │ Spline ││ Dim │ Constraint │ Trim │ Mirror │ Pattern │
├────────────┬─────────────────────────────────┬───────────────┤
│            │                                 │               │
│  Feature   │        3D Viewport              │  Properties   │
│  Tree      │        (R3F Canvas)             │  Inspector    │
│            │                                 │               │
│  ─────     │   [View Cube]     [Iso/F/T/R]  │  Selected:    │
│  Origin    │                                 │  Extrude 1    │
│  Sketch 1  │                                 │  Depth: =h    │
│  Extrude 1 │                                 │  Dir: Normal  │
│  Fillet 1  │                                 │               │
│            │                                 │  ─────────    │
│  ─────     │                                 │  Material:    │
│  Params    │   Grid: 1mm  Snap: ON           │  AL 6061      │
│  width=50  │                      [Shaded]   │               │
│  height=20 │                      [Wire]     │  ─────────    │
│            │                      [X-Ray]    │  AI Chat      │
│            │                                 │  [input...]   │
├────────────┴─────────────────────────────────┴───────────────┤
│ Ready │ 4 Features │ 3 Constraints Solved    │ Auto-saved 2s │
└──────────────────────────────────────────────────────────────┘
```

## Implementation Phases

### Phase 1: Foundation
- OCCT WASM integration (lazy loading, caching)
- `/cad` route with layout shell (feature tree, viewport, properties panel)
- R3F viewport with orbit controls, grid, view cube, orthographic presets
- Feature tree data model and UI
- Basic sketch mode (line, circle, rectangle on XY/XZ/YZ planes)
- Extrude operation (add/cut, blind depth)
- Native `.svcp` save/load (localStorage initially, then database)
- Basic undo/redo

### Phase 2: Constraints + Advanced Features
- 2D constraint solver (Newton-Raphson + LM)
- All geometric constraints (coincident, parallel, perpendicular, tangent, etc.)
- Dimensional constraints with parameter references
- Parameter table UI with expression evaluation
- Revolve, sweep, loft operations
- Fillet, chamfer, shell operations
- Boolean operations (union, cut, intersect)
- Sketch on face (not just origin planes)
- DOF indicator and constraint status coloring

### Phase 3: AI + Import/Export
- Claude tool-use integration with CAD-specific tools
- AI chat panel in properties sidebar
- STEP import/export via OCCT
- IGES import/export via OCCT
- STL/OBJ/GLB mesh export
- Linear and circular pattern features
- Mirror feature
- Material assignment (visual + metadata)

### Phase 4: Drawings + Version Control
- Technical drawing generation via HLR
- Auto-dimensioning from feature tree
- Manual dimension/annotation editing
- DXF, PDF, SVG export
- Title block with project metadata
- Version history with named snapshots
- Branching and merging
- Visual diff between versions
- Database storage for projects/versions

## Dependencies

- **opencascade.js**: OCCT WASM build (~15-25MB). npm package `opencascade.js`.
- **React Three Fiber + Three.js**: Already in project for Creative Studio.
- **Prisma + Postgres**: Already in project for user data. Extend schema for CAD projects.
- **Claude API**: Already integrated for Creative Studio AI. Extend with CAD tools.
- **jsPDF or pdfkit**: For PDF technical drawing export.
- **dxf-writer**: For DXF export.

## Database Schema Additions

```prisma
// Add to existing User model:
//   cadProjects CadProject[]

model CadProject {
  id            String       @id @default(cuid())
  userId        String
  name          String
  units         String       @default("mm")
  currentBranch String       @default("main")
  featureTree   Json
  parameters    Json
  metadata      Json?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt
  user          User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  versions      CadVersion[]

  @@index([userId])
}

model CadVersion {
  id              String       @id @default(cuid())
  projectId       String
  branch          String       @default("main")
  name            String?
  featureTreeJson Json
  parentVersionId String?
  createdAt       DateTime     @default(now())
  project         CadProject   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  parent          CadVersion?  @relation("VersionParent", fields: [parentVersionId], references: [id], onDelete: SetNull)
  children        CadVersion[] @relation("VersionParent")

  @@index([projectId])
  @@index([branch])
}
```

## Key Technical Risks

1. **OCCT WASM bundle size**: 15-25MB initial download. Mitigated by lazy loading, aggressive caching, and a loading screen with progress indicator.
2. **Constraint solver robustness**: Newton-Raphson can diverge on poorly-conditioned systems. LM fallback helps. May need to limit maximum iterations and report unsolvable states gracefully.
3. **HLR for technical drawings**: OCCT's hidden line removal can be slow on complex models even in the Web Worker. May need progress indication and cancellation support for large models.
4. **STEP/IGES fidelity**: Some STEP files from other CAD systems use advanced surface types that OCCT handles well, but edge cases exist. Testing with real-world files essential.
5. **Feature tree rebuild performance**: Modifying an early feature requires replaying all subsequent features through OCCT. For complex models (50+ features), this could take seconds. Consider caching intermediate BREP states.
