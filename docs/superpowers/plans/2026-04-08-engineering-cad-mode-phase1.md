# Engineering CAD Mode — Phase 1: Foundation Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the foundation of a parametric CAD system at `/cad` — OCCT WASM kernel in a Web Worker, 3D viewport, feature tree, basic sketch mode (line/circle/rectangle), extrude operation, and native .svcp save/load.

**Architecture:** OpenCascade.js (beta, WASM) runs in a dedicated Web Worker. The main thread sends CAD operation requests and receives tessellated mesh data back. React + React Three Fiber renders the tessellated geometry. A feature tree data model tracks ordered operations as JSON. All state managed via React hooks + context.

**Tech Stack:** Next.js 15, React 19, TypeScript, opencascade.js@beta (WASM), React Three Fiber 9, Three.js 0.183, Prisma 7 + Neon Postgres

**Spec:** `docs/superpowers/specs/2026-04-08-engineering-cad-mode-design.md`

---

## File Structure

```
src/
├── app/cad/
│   ├── page.tsx                    # /cad route — main CAD workspace page
│   └── layout.tsx                  # CAD-specific layout (no navbar/footer)
├── cad/
│   ├── engine/
│   │   ├── types.ts                # All CAD type definitions (Feature, Sketch, Parameter, etc.)
│   │   ├── featureTree.ts          # Feature tree CRUD operations (pure functions)
│   │   ├── parameterRegistry.ts    # Parameter table with expression evaluation
│   │   ├── operationHistory.ts     # Undo/redo stack
│   │   ├── projectSerializer.ts    # .svcp save/load (JSON serialize/deserialize)
│   │   └── occtWorker.ts           # Web Worker entry — loads OCCT WASM, handles messages
│   ├── worker/
│   │   ├── workerApi.ts            # Main-thread wrapper: postMessage/onmessage typed API
│   │   ├── occtOperations.ts       # OCCT operation implementations (extrude, makeBox, etc.)
│   │   └── tessellator.ts          # Shape → vertices/normals/indices extraction
│   ├── components/
│   │   ├── CadWorkspace.tsx        # Top-level layout: left panel + viewport + right panel (panels inline for Phase 1)
│   │   ├── CadViewport.tsx         # R3F Canvas with orbit controls, grid, view cube
│   │   ├── TessellatedMesh.tsx     # Renders tessellated BufferGeometry from worker
│   │   ├── SketchToolbar.tsx       # Contextual toolbar for sketch mode
│   │   ├── TopToolbar.tsx          # Menu bar (File, Edit, Sketch, Features, View)
│   │   ├── StatusBar.tsx           # Bottom bar: constraint status, save indicator
│   │   ├── OcctLoadingScreen.tsx   # Full-page WASM loading overlay with progress
│   │   ├── ViewCube.tsx            # 3D orientation cube (top-left of viewport)
│   │   └── SketchOverlay.tsx       # 2D sketch drawing overlay (lines, circles, rects)
│   ├── hooks/
│   │   ├── useCadProject.ts        # Project state: features, params, selected, history
│   │   ├── useOcctWorker.ts        # Worker lifecycle: init, send ops, receive meshes
│   │   └── useSketchMode.ts        # Sketch interaction state machine
│   └── context/
│       └── CadContext.tsx           # React context providing project state + worker API
```

---

## Chunk 1: OCCT Web Worker + WASM Loading

### Task 1: Install opencascade.js and configure Next.js webpack

**Files:**
- Modify: `package.json` (add opencascade.js dependency)
- Modify: `next.config.ts` (add webpack WASM + worker config)

- [ ] **Step 1: Install opencascade.js**

```bash
npm install opencascade.js@beta
```

- [ ] **Step 2: Update next.config.ts for WASM support**

Read the current `next.config.ts` first. Then add webpack config to handle WASM files and node polyfill fallbacks:

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },
      { hostname: "avatars.githubusercontent.com" },
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Handle .wasm files as assets
      config.module.rules.push({
        test: /\.wasm$/,
        type: "asset/resource",
      });

      // Node.js module fallbacks for opencascade.js
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        perf_hooks: false,
        os: false,
        worker_threads: false,
        crypto: false,
        stream: false,
      };
    }
    return config;
  },
};

export default nextConfig;
```

- [ ] **Step 3: Verify build doesn't break**

```bash
npm run build
```

Expected: Build succeeds with no errors. The WASM config is passive until we actually import opencascade.js.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json next.config.ts
git commit -m "feat(cad): install opencascade.js and configure webpack for WASM"
```

---

### Task 2: Create CAD type definitions

**Files:**
- Create: `src/cad/engine/types.ts`

- [ ] **Step 1: Create the types file**

```typescript
// src/cad/engine/types.ts

// ============================================================
// Sketch Entities — 2D primitives drawn on a sketch plane
// ============================================================

export interface SketchPoint {
  id: string;
  x: number;
  y: number;
}

export interface SketchLine {
  id: string;
  type: "line";
  startId: string; // ref to SketchPoint.id
  endId: string;
}

export interface SketchCircle {
  id: string;
  type: "circle";
  centerId: string; // ref to SketchPoint.id
  radius: number | string; // number or "$paramName" expression
}

export interface SketchArc {
  id: string;
  type: "arc";
  centerId: string;
  startId: string;
  endId: string;
  radius: number | string;
}

export interface SketchRectangle {
  id: string;
  type: "rectangle";
  originId: string; // bottom-left point
  width: number | string;
  height: number | string;
}

export type SketchEntity = SketchLine | SketchCircle | SketchArc | SketchRectangle;

// ============================================================
// Sketch Constraints (Phase 2 — stubs for now)
// ============================================================

export interface SketchConstraint {
  id: string;
  type: string;
  refs: string[]; // entity or point IDs
  value?: number | string;
}

// ============================================================
// Sketch — a 2D drawing on a plane
// ============================================================

export type SketchPlane = "XY" | "XZ" | "YZ";

export interface Sketch {
  id: string;
  name: string;
  plane: SketchPlane;
  points: SketchPoint[];
  entities: SketchEntity[];
  constraints: SketchConstraint[];
}

// ============================================================
// Features — ordered operations in the feature tree
// ============================================================

export interface SketchFeature {
  id: string;
  type: "sketch";
  name: string;
  suppressed: boolean;
  sketch: Sketch;
}

export interface ExtrudeFeature {
  id: string;
  type: "extrude";
  name: string;
  suppressed: boolean;
  sketchId: string; // ref to SketchFeature.id
  profiles: string[]; // entity IDs within the sketch to extrude (empty = all closed profiles)
  depth: number | string; // number or "$paramName"
  direction: "normal" | "reverse" | "symmetric";
  operation: "add" | "cut";
}

export type Feature = SketchFeature | ExtrudeFeature;

// Future features will be added as union members:
// | RevolveFeature | SweepFeature | LoftFeature | FilletFeature | ChamferFeature | ShellFeature | BooleanFeature | PatternFeature | MirrorFeature

// ============================================================
// Parameters — named values with optional expressions
// ============================================================

export interface Parameter {
  name: string;
  value: number;
  unit: string; // "mm", "in", "deg", etc.
  expression: string | null; // e.g., "width * 0.5"
}

// ============================================================
// Project — the complete .svcp file
// ============================================================

export interface CadProject {
  version: string; // "1.0"
  name: string;
  units: string; // "mm", "in"
  parameters: Record<string, Parameter>;
  features: Feature[];
  metadata: {
    created: string; // ISO timestamp
    modified: string;
    author: string;
    material: string;
  };
}

// ============================================================
// Worker Messages — main thread ↔ worker communication
// ============================================================

export interface WorkerRequest {
  id: string; // unique request ID for matching responses
  type: "init" | "rebuild" | "extrude" | "tessellate";
  payload: unknown;
}

export interface InitPayload {
  // no params needed — just load WASM
}

export interface RebuildPayload {
  features: Feature[];
  parameters: Record<string, Parameter>;
}

export interface TessellationResult {
  featureId: string;
  vertices: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

export interface WorkerResponse {
  id: string; // matches WorkerRequest.id
  type: "ready" | "progress" | "result" | "error";
  payload: unknown;
}

export interface ReadyPayload {
  version: string; // OCCT version
}

export interface ProgressPayload {
  percent: number; // 0-100
  message: string;
}

export interface RebuildResultPayload {
  meshes: TessellationResult[];
}

export interface ErrorPayload {
  message: string;
  featureId?: string;
}

// ============================================================
// UI State
// ============================================================

export type CadTool = "select" | "line" | "circle" | "rectangle" | "arc";
export type ViewMode = "shaded" | "wireframe" | "xray";
export type ViewPreset = "iso" | "front" | "back" | "top" | "bottom" | "left" | "right";

export interface CadUIState {
  activeTool: CadTool;
  viewMode: ViewMode;
  selectedFeatureId: string | null;
  sketchModeActive: boolean;
  activeSketchId: string | null;
  gridVisible: boolean;
  snapEnabled: boolean;
  snapValue: number; // in project units
  units: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/cad/engine/types.ts
git commit -m "feat(cad): add CAD type definitions — features, sketches, parameters, worker messages"
```

---

### Task 3: Create OCCT Web Worker

**Files:**
- Create: `src/cad/worker/tessellator.ts`
- Create: `src/cad/worker/occtOperations.ts`
- Create: `src/cad/engine/occtWorker.ts`

- [ ] **Step 1: Create tessellator — extracts triangle data from OCCT shapes**

```typescript
// src/cad/worker/tessellator.ts

/**
 * Converts an OCCT TopoDS_Shape into indexed triangle mesh data
 * suitable for Three.js BufferGeometry.
 *
 * @param oc - The initialized OpenCascade instance
 * @param shape - The OCCT shape to tessellate
 * @param linearDeflection - Mesh quality (smaller = finer, default 0.1)
 * @returns vertices, normals, indices arrays
 */
export function tessellateShape(
  oc: any,
  shape: any,
  linearDeflection = 0.1
): { vertices: number[]; normals: number[]; indices: number[] } {
  const vertices: number[] = [];
  const normals: number[] = [];
  const indices: number[] = [];

  // Tessellate
  new oc.BRepMesh_IncrementalMesh_2(
    shape,
    linearDeflection,
    false,
    linearDeflection * 5,
    false
  );

  // Iterate over all faces
  const explorer = new oc.TopExp_Explorer_2(
    shape,
    oc.TopAbs_ShapeEnum.TopAbs_FACE,
    oc.TopAbs_ShapeEnum.TopAbs_SHAPE
  );

  for (
    explorer.Init(
      shape,
      oc.TopAbs_ShapeEnum.TopAbs_FACE,
      oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );
    explorer.More();
    explorer.Next()
  ) {
    const face = oc.TopoDS.Face_1(explorer.Current());
    const location = new oc.TopLoc_Location_1();
    const triangulation = oc.BRep_Tool.Triangulation(face, location, 0);

    if (triangulation.IsNull()) continue;

    const isReversed =
      face.Orientation_1() === oc.TopAbs_Orientation.TopAbs_REVERSED;
    const flip = isReversed ? -1 : 1;

    const nbNodes = triangulation.get().NbNodes();
    const baseIndex = vertices.length / 3;

    // Extract vertices
    for (let i = 1; i <= nbNodes; i++) {
      const p = triangulation
        .get()
        .Node(i)
        .Transformed(location.Transformation());
      vertices.push(p.X(), p.Y(), p.Z());
    }

    // Extract normals
    if (!triangulation.get().HasNormals()) {
      triangulation.get().ComputeNormals();
    }
    for (let i = 1; i <= nbNodes; i++) {
      const n = triangulation
        .get()
        .Normal_1(i)
        .Transformed(location.Transformation());
      normals.push(flip * n.X(), flip * n.Y(), flip * n.Z());
    }

    // Extract triangle indices
    const nbTriangles = triangulation.get().NbTriangles();
    for (let t = 1; t <= nbTriangles; t++) {
      const tri = triangulation.get().Triangle(t);
      let n1 = tri.Value(1);
      let n2 = tri.Value(2);
      let n3 = tri.Value(3);
      if (isReversed) {
        [n1, n2] = [n2, n1]; // flip winding
      }
      indices.push(baseIndex + n1 - 1, baseIndex + n2 - 1, baseIndex + n3 - 1);
    }

    // Clean up
    location.delete();
  }

  explorer.delete();
  return { vertices, normals, indices };
}
```

- [ ] **Step 2: Create OCCT operations — builds shapes from features**

```typescript
// src/cad/worker/occtOperations.ts

import type { Feature, SketchFeature, ExtrudeFeature, Parameter } from "../engine/types";

/**
 * Resolves a value that may be a number or a "$paramName" reference.
 */
export function resolveValue(
  value: number | string,
  parameters: Record<string, Parameter>
): number {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.startsWith("$")) {
    const paramName = value.slice(1);
    const param = parameters[paramName];
    if (!param) throw new Error(`Unknown parameter: ${paramName}`);
    return param.value;
  }
  return Number(value);
}

/**
 * Builds an OCCT wire from sketch entities on the given plane.
 * Returns a TopoDS_Wire for each closed profile found.
 */
export function buildSketchWires(
  oc: any,
  sketch: SketchFeature["sketch"],
  parameters: Record<string, Parameter>
): any[] {
  const wires: any[] = [];
  const pointMap = new Map<string, { x: number; y: number }>();

  // Index points
  for (const pt of sketch.points) {
    pointMap.set(pt.id, { x: pt.x, y: pt.y });
  }

  // Helper: 2D sketch point → 3D gp_Pnt on the sketch plane
  function to3D(x: number, y: number): any {
    switch (sketch.plane) {
      case "XY": return new oc.gp_Pnt_3(x, y, 0);
      case "XZ": return new oc.gp_Pnt_3(x, 0, y);
      case "YZ": return new oc.gp_Pnt_3(0, x, y);
      default: return new oc.gp_Pnt_3(x, y, 0);
    }
  }

  // Helper: get the plane normal direction
  function planeNormal(): any {
    switch (sketch.plane) {
      case "XY": return new oc.gp_Dir_4(0, 0, 1);
      case "XZ": return new oc.gp_Dir_4(0, 1, 0);
      case "YZ": return new oc.gp_Dir_4(1, 0, 0);
      default: return new oc.gp_Dir_4(0, 0, 1);
    }
  }

  for (const entity of sketch.entities) {
    if (entity.type === "rectangle") {
      const origin = pointMap.get(entity.originId);
      if (!origin) continue;
      const w = resolveValue(entity.width, parameters);
      const h = resolveValue(entity.height, parameters);
      const x = origin.x;
      const y = origin.y;

      const p1 = to3D(x, y);
      const p2 = to3D(x + w, y);
      const p3 = to3D(x + w, y + h);
      const p4 = to3D(x, y + h);

      const e1 = new oc.BRepBuilderAPI_MakeEdge_3(p1, p2).Edge();
      const e2 = new oc.BRepBuilderAPI_MakeEdge_3(p2, p3).Edge();
      const e3 = new oc.BRepBuilderAPI_MakeEdge_3(p3, p4).Edge();
      const e4 = new oc.BRepBuilderAPI_MakeEdge_3(p4, p1).Edge();

      const wireMaker = new oc.BRepBuilderAPI_MakeWire_1();
      wireMaker.Add_1(e1);
      wireMaker.Add_1(e2);
      wireMaker.Add_1(e3);
      wireMaker.Add_1(e4);

      wires.push(wireMaker.Wire());
    } else if (entity.type === "circle") {
      const center = pointMap.get(entity.centerId);
      if (!center) continue;
      const r = resolveValue(entity.radius, parameters);
      const center3D = to3D(center.x, center.y);
      const axis = new oc.gp_Ax2_3(center3D, planeNormal());
      const circle = new oc.GC_MakeCircle_2(axis, r).Value();
      const circleEdge = new oc.BRepBuilderAPI_MakeEdge_8(
        new oc.Handle_Geom_Curve_2(circle.get())
      ).Edge();
      const circleWire = new oc.BRepBuilderAPI_MakeWire_2(circleEdge).Wire();
      wires.push(circleWire);
    } else if (entity.type === "line") {
      // Single lines don't form closed wires by themselves.
      // For Phase 1, we only extrude closed profiles (rectangles, circles).
      // Lines will be composed into wires in Phase 2 with the constraint solver.
    }
  }

  return wires;
}

/**
 * Performs an extrude operation on sketch profiles.
 * Returns the resulting OCCT shape.
 */
export function performExtrude(
  oc: any,
  sketch: SketchFeature["sketch"],
  extrude: ExtrudeFeature,
  parameters: Record<string, Parameter>,
  currentShape: any | null
): any {
  const wires = buildSketchWires(oc, sketch, parameters);
  if (wires.length === 0) {
    throw new Error(`No closed profiles found in sketch for extrude "${extrude.name}"`);
  }

  const depth = resolveValue(extrude.depth, parameters);

  // Determine extrude direction vector based on sketch plane
  let dirX = 0, dirY = 0, dirZ = 0;
  switch (sketch.plane) {
    case "XY": dirZ = 1; break;
    case "XZ": dirY = 1; break;
    case "YZ": dirX = 1; break;
  }
  if (extrude.direction === "reverse") {
    dirX *= -1; dirY *= -1; dirZ *= -1;
  }

  let resultShape = currentShape;

  for (const wire of wires) {
    // Create face from wire
    const face = new oc.BRepBuilderAPI_MakeFace_15(wire, true).Face();

    // Create extrude vector
    let extrudeDepth = depth;
    if (extrude.direction === "symmetric") {
      extrudeDepth = depth / 2;
    }

    const vec = new oc.gp_Vec_4(
      dirX * extrudeDepth,
      dirY * extrudeDepth,
      dirZ * extrudeDepth
    );

    const prism = new oc.BRepPrimAPI_MakePrism_1(face, vec, false, true);
    prism.Build(new oc.Message_ProgressRange_1());
    let extrudedShape = prism.Shape();

    // For symmetric, also extrude in the opposite direction and fuse
    if (extrude.direction === "symmetric") {
      const reverseVec = new oc.gp_Vec_4(
        -dirX * extrudeDepth,
        -dirY * extrudeDepth,
        -dirZ * extrudeDepth
      );
      const reversePrism = new oc.BRepPrimAPI_MakePrism_1(face, reverseVec, false, true);
      reversePrism.Build(new oc.Message_ProgressRange_1());
      const fuse = new oc.BRepAlgoAPI_Fuse_3(
        extrudedShape,
        reversePrism.Shape(),
        new oc.Message_ProgressRange_1()
      );
      fuse.Build(new oc.Message_ProgressRange_1());
      extrudedShape = fuse.Shape();
    }

    // Combine with existing shape
    if (resultShape && extrude.operation === "add") {
      const fuse = new oc.BRepAlgoAPI_Fuse_3(
        resultShape,
        extrudedShape,
        new oc.Message_ProgressRange_1()
      );
      fuse.Build(new oc.Message_ProgressRange_1());
      resultShape = fuse.Shape();
    } else if (resultShape && extrude.operation === "cut") {
      const cut = new oc.BRepAlgoAPI_Cut_3(
        resultShape,
        extrudedShape,
        new oc.Message_ProgressRange_1()
      );
      cut.Build(new oc.Message_ProgressRange_1());
      resultShape = cut.Shape();
    } else {
      resultShape = extrudedShape;
    }
  }

  return resultShape;
}

/**
 * Rebuilds the full OCCT shape from a feature tree.
 * Replays features in order, skipping suppressed ones.
 * Returns the final shape or null if no geometry was produced.
 */
export function rebuildFromFeatureTree(
  oc: any,
  features: Feature[],
  parameters: Record<string, Parameter>
): any | null {
  let currentShape: any | null = null;
  const sketchMap = new Map<string, SketchFeature>();

  for (const feature of features) {
    if (feature.suppressed) continue;

    if (feature.type === "sketch") {
      sketchMap.set(feature.id, feature);
      // Sketches don't produce geometry by themselves
      continue;
    }

    if (feature.type === "extrude") {
      const sketch = sketchMap.get(feature.sketchId);
      if (!sketch) {
        throw new Error(
          `Extrude "${feature.name}" references missing sketch "${feature.sketchId}"`
        );
      }
      currentShape = performExtrude(
        oc,
        sketch.sketch,
        feature,
        parameters,
        currentShape
      );
    }
  }

  return currentShape;
}
```

- [ ] **Step 3: Create the Web Worker entry point**

```typescript
// src/cad/engine/occtWorker.ts

/// <reference lib="webworker" />

import { tessellateShape } from "../worker/tessellator";
import { rebuildFromFeatureTree } from "../worker/occtOperations";
import type {
  WorkerRequest,
  WorkerResponse,
  RebuildPayload,
  RebuildResultPayload,
  Feature,
  Parameter,
} from "./types";

declare const self: DedicatedWorkerGlobalScope;

let oc: any = null;

function respond(msg: WorkerResponse, transfer?: Transferable[]) {
  self.postMessage(msg, { transfer: transfer ?? [] });
}

async function initOCCT() {
  // Dynamic import so the worker bundle doesn't include WASM inline
  const initOpenCascade = (await import("opencascade.js")).default;

  respond({
    id: "__init__",
    type: "progress",
    payload: { percent: 10, message: "Downloading OpenCASCADE kernel..." },
  });

  oc = await initOpenCascade();

  respond({
    id: "__init__",
    type: "ready",
    payload: { version: "7.5.2" },
  });
}

function handleRebuild(requestId: string, payload: RebuildPayload) {
  try {
    const shape = rebuildFromFeatureTree(oc, payload.features, payload.parameters);

    if (!shape) {
      respond({
        id: requestId,
        type: "result",
        payload: { meshes: [] } satisfies RebuildResultPayload,
      });
      return;
    }

    const mesh = tessellateShape(oc, shape, 0.1);

    // Convert to typed arrays for transfer
    const vertices = new Float32Array(mesh.vertices);
    const normals = new Float32Array(mesh.normals);
    const indices = new Uint32Array(mesh.indices);

    const result: RebuildResultPayload = {
      meshes: [
        {
          featureId: "final",
          vertices,
          normals,
          indices,
        },
      ],
    };

    respond({ id: requestId, type: "result", payload: result }, [
      vertices.buffer,
      normals.buffer,
      indices.buffer,
    ]);
  } catch (err: any) {
    respond({
      id: requestId,
      type: "error",
      payload: { message: err.message || String(err) },
    });
  }
}

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const { id, type, payload } = e.data;

  if (type === "init") {
    try {
      await initOCCT();
    } catch (err: any) {
      respond({
        id,
        type: "error",
        payload: { message: `OCCT init failed: ${err.message}` },
      });
    }
    return;
  }

  if (!oc) {
    respond({
      id,
      type: "error",
      payload: { message: "OCCT not initialized. Send 'init' first." },
    });
    return;
  }

  if (type === "rebuild") {
    handleRebuild(id, payload as RebuildPayload);
    return;
  }

  respond({
    id,
    type: "error",
    payload: { message: `Unknown request type: ${type}` },
  });
};
```

- [ ] **Step 4: Commit**

```bash
git add src/cad/worker/tessellator.ts src/cad/worker/occtOperations.ts src/cad/engine/occtWorker.ts
git commit -m "feat(cad): add OCCT Web Worker with tessellator and feature tree rebuild"
```

---

### Task 4: Create worker API wrapper (main thread side)

**Files:**
- Create: `src/cad/worker/workerApi.ts`
- Create: `src/cad/hooks/useOcctWorker.ts`

- [ ] **Step 1: Create typed worker API**

```typescript
// src/cad/worker/workerApi.ts

import type {
  WorkerRequest,
  WorkerResponse,
  RebuildPayload,
  RebuildResultPayload,
  ReadyPayload,
  ProgressPayload,
  ErrorPayload,
} from "../engine/types";

type RequestCallback = {
  resolve: (response: WorkerResponse) => void;
  reject: (error: Error) => void;
};

/**
 * Typed wrapper around the OCCT Web Worker.
 * Handles request/response matching via message IDs.
 */
export class OcctWorkerApi {
  private worker: Worker | null = null;
  private pending = new Map<string, RequestCallback>();
  private nextId = 0;
  private onProgress?: (percent: number, message: string) => void;
  private onReady?: (version: string) => void;

  constructor(opts?: {
    onProgress?: (percent: number, message: string) => void;
    onReady?: (version: string) => void;
  }) {
    this.onProgress = opts?.onProgress;
    this.onReady = opts?.onReady;
  }

  /**
   * Start the worker and initialize OCCT WASM.
   */
  async init(): Promise<void> {
    // Create worker from the worker entry file
    this.worker = new Worker(
      new URL("../engine/occtWorker.ts", import.meta.url),
      { type: "module" }
    );

    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      this.handleMessage(e.data);
    };

    this.worker.onerror = (err) => {
      console.error("[OcctWorker] Worker error:", err);
    };

    // Send init command and wait for ready
    return new Promise((resolve, reject) => {
      // Listen for the __init__ ready message
      const initHandler = (resp: WorkerResponse) => {
        if (resp.id === "__init__" && resp.type === "ready") {
          const payload = resp.payload as ReadyPayload;
          this.onReady?.(payload.version);
          resolve();
          return true; // handled
        }
        if (resp.id === "__init__" && resp.type === "progress") {
          const payload = resp.payload as ProgressPayload;
          this.onProgress?.(payload.percent, payload.message);
          return true;
        }
        if (resp.id === "__init__" && resp.type === "error") {
          const payload = resp.payload as ErrorPayload;
          reject(new Error(payload.message));
          return true;
        }
        return false;
      };

      // Temporarily intercept messages for init
      const originalHandler = this.worker!.onmessage;
      this.worker!.onmessage = (e: MessageEvent<WorkerResponse>) => {
        if (!initHandler(e.data)) {
          this.handleMessage(e.data);
        }
      };

      this.send({ id: "__init__", type: "init", payload: {} });
    });
  }

  /**
   * Rebuild geometry from the full feature tree.
   */
  async rebuild(payload: RebuildPayload): Promise<RebuildResultPayload> {
    const response = await this.request("rebuild", payload);
    if (response.type === "error") {
      const err = response.payload as ErrorPayload;
      throw new Error(err.message);
    }
    return response.payload as RebuildResultPayload;
  }

  /**
   * Terminate the worker.
   */
  dispose() {
    this.worker?.terminate();
    this.worker = null;
    this.pending.clear();
  }

  private request(type: string, payload: unknown): Promise<WorkerResponse> {
    const id = `req_${this.nextId++}`;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.send({ id, type, payload } as WorkerRequest);
    });
  }

  private send(msg: WorkerRequest) {
    if (!this.worker) throw new Error("Worker not initialized");
    this.worker.postMessage(msg);
  }

  private handleMessage(msg: WorkerResponse) {
    const callback = this.pending.get(msg.id);
    if (callback) {
      this.pending.delete(msg.id);
      callback.resolve(msg);
    }
  }
}
```

- [ ] **Step 2: Create useOcctWorker hook**

```typescript
// src/cad/hooks/useOcctWorker.ts

"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { OcctWorkerApi } from "../worker/workerApi";
import type { RebuildPayload, RebuildResultPayload } from "../engine/types";

export type OcctStatus = "idle" | "loading" | "ready" | "error";

export function useOcctWorker() {
  const apiRef = useRef<OcctWorkerApi | null>(null);
  const [status, setStatus] = useState<OcctStatus>("idle");
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadMessage, setLoadMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const api = new OcctWorkerApi({
      onProgress: (percent, message) => {
        setLoadProgress(percent);
        setLoadMessage(message);
      },
      onReady: () => {
        setStatus("ready");
        setLoadProgress(100);
        setLoadMessage("Ready");
      },
    });
    apiRef.current = api;
    setStatus("loading");

    api.init().catch((err) => {
      setStatus("error");
      setError(err.message);
    });

    return () => {
      api.dispose();
      apiRef.current = null;
    };
  }, []);

  const rebuild = useCallback(
    async (payload: RebuildPayload): Promise<RebuildResultPayload | null> => {
      if (!apiRef.current || status !== "ready") return null;
      try {
        return await apiRef.current.rebuild(payload);
      } catch (err: any) {
        setError(err.message);
        return null;
      }
    },
    [status]
  );

  return { status, loadProgress, loadMessage, error, rebuild };
}
```

- [ ] **Step 3: Commit**

```bash
git add src/cad/worker/workerApi.ts src/cad/hooks/useOcctWorker.ts
git commit -m "feat(cad): add typed worker API and useOcctWorker hook"
```

---

## Chunk 2: Feature Tree Engine + Project Serialization

### Task 5: Create feature tree manager

**Files:**
- Create: `src/cad/engine/featureTree.ts`

- [ ] **Step 1: Create feature tree pure functions**

```typescript
// src/cad/engine/featureTree.ts

import type { Feature, SketchFeature, ExtrudeFeature, Sketch, SketchPlane, SketchPoint, SketchEntity } from "./types";

let counter = 0;

export function newFeatureId(): string {
  return `feat_${Date.now()}_${counter++}`;
}

export function newEntityId(): string {
  return `ent_${Date.now()}_${counter++}`;
}

export function newPointId(): string {
  return `pt_${Date.now()}_${counter++}`;
}

/**
 * Creates a new empty sketch feature on the given plane.
 */
export function createSketch(
  name: string,
  plane: SketchPlane
): SketchFeature {
  return {
    id: newFeatureId(),
    type: "sketch",
    name,
    suppressed: false,
    sketch: {
      id: newEntityId(),
      name,
      plane,
      points: [],
      entities: [],
      constraints: [],
    },
  };
}

/**
 * Adds a rectangle entity to a sketch.
 * Creates the origin point and returns the updated sketch.
 */
export function addRectangleToSketch(
  sketch: Sketch,
  originX: number,
  originY: number,
  width: number | string,
  height: number | string
): Sketch {
  const originPt: SketchPoint = { id: newPointId(), x: originX, y: originY };
  const rect: SketchEntity = {
    id: newEntityId(),
    type: "rectangle",
    originId: originPt.id,
    width,
    height,
  };
  return {
    ...sketch,
    points: [...sketch.points, originPt],
    entities: [...sketch.entities, rect],
  };
}

/**
 * Adds a circle entity to a sketch.
 */
export function addCircleToSketch(
  sketch: Sketch,
  centerX: number,
  centerY: number,
  radius: number | string
): Sketch {
  const centerPt: SketchPoint = { id: newPointId(), x: centerX, y: centerY };
  const circle: SketchEntity = {
    id: newEntityId(),
    type: "circle",
    centerId: centerPt.id,
    radius,
  };
  return {
    ...sketch,
    points: [...sketch.points, centerPt],
    entities: [...sketch.entities, circle],
  };
}

/**
 * Adds a line entity to a sketch.
 */
export function addLineToSketch(
  sketch: Sketch,
  startX: number,
  startY: number,
  endX: number,
  endY: number
): Sketch {
  const startPt: SketchPoint = { id: newPointId(), x: startX, y: startY };
  const endPt: SketchPoint = { id: newPointId(), x: endX, y: endY };
  const line: SketchEntity = {
    id: newEntityId(),
    type: "line",
    startId: startPt.id,
    endId: endPt.id,
  };
  return {
    ...sketch,
    points: [...sketch.points, startPt, endPt],
    entities: [...sketch.entities, line],
  };
}

/**
 * Creates an extrude feature referencing a sketch.
 */
export function createExtrude(
  name: string,
  sketchId: string,
  depth: number | string,
  operation: "add" | "cut" = "add",
  direction: "normal" | "reverse" | "symmetric" = "normal"
): ExtrudeFeature {
  return {
    id: newFeatureId(),
    type: "extrude",
    name,
    suppressed: false,
    sketchId,
    profiles: [], // empty = all closed profiles
    depth,
    direction,
    operation,
  };
}

/**
 * Appends a feature to the end of the feature list.
 */
export function appendFeature(features: Feature[], feature: Feature): Feature[] {
  return [...features, feature];
}

/**
 * Removes a feature by ID. Also removes any features that reference it
 * (e.g., extrudes referencing a deleted sketch).
 */
export function removeFeature(features: Feature[], featureId: string): Feature[] {
  const remaining = features.filter((f) => f.id !== featureId);
  // Remove extrudes that referenced the deleted sketch
  return remaining.filter((f) => {
    if (f.type === "extrude" && f.sketchId === featureId) return false;
    return true;
  });
}

/**
 * Updates a feature by ID with partial changes.
 */
export function updateFeature(
  features: Feature[],
  featureId: string,
  updates: Partial<Feature>
): Feature[] {
  return features.map((f) =>
    f.id === featureId ? { ...f, ...updates } : f
  );
}

/**
 * Toggles the suppressed state of a feature.
 */
export function toggleSuppressed(features: Feature[], featureId: string): Feature[] {
  return features.map((f) =>
    f.id === featureId ? { ...f, suppressed: !f.suppressed } : f
  );
}

/**
 * Reorders a feature from one index to another.
 */
export function reorderFeature(
  features: Feature[],
  fromIndex: number,
  toIndex: number
): Feature[] {
  const result = [...features];
  const [moved] = result.splice(fromIndex, 1);
  result.splice(toIndex, 0, moved);
  return result;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/cad/engine/featureTree.ts
git commit -m "feat(cad): add feature tree manager with CRUD operations"
```

---

### Task 6: Create parameter registry

**Files:**
- Create: `src/cad/engine/parameterRegistry.ts`

- [ ] **Step 1: Create parameter registry with expression evaluation**

```typescript
// src/cad/engine/parameterRegistry.ts

import type { Parameter } from "./types";

/**
 * Creates a new parameter.
 */
export function createParameter(
  name: string,
  value: number,
  unit = "mm",
  expression: string | null = null
): Parameter {
  return { name, value, unit, expression };
}

/**
 * Sets a parameter value directly.
 */
export function setParameterValue(
  parameters: Record<string, Parameter>,
  name: string,
  value: number
): Record<string, Parameter> {
  const existing = parameters[name];
  if (!existing) throw new Error(`Parameter "${name}" not found`);
  return {
    ...parameters,
    [name]: { ...existing, value, expression: null },
  };
}

/**
 * Sets a parameter expression. The expression is evaluated immediately
 * and the resolved value is stored.
 */
export function setParameterExpression(
  parameters: Record<string, Parameter>,
  name: string,
  expression: string
): Record<string, Parameter> {
  const existing = parameters[name];
  if (!existing) throw new Error(`Parameter "${name}" not found`);
  const value = evaluateExpression(expression, parameters);
  return {
    ...parameters,
    [name]: { ...existing, value, expression },
  };
}

/**
 * Adds a new parameter.
 */
export function addParameter(
  parameters: Record<string, Parameter>,
  param: Parameter
): Record<string, Parameter> {
  if (parameters[param.name]) {
    throw new Error(`Parameter "${param.name}" already exists`);
  }
  return { ...parameters, [param.name]: param };
}

/**
 * Removes a parameter by name.
 */
export function removeParameter(
  parameters: Record<string, Parameter>,
  name: string
): Record<string, Parameter> {
  const { [name]: _, ...rest } = parameters;
  return rest;
}

/**
 * Evaluates all parameter expressions in dependency order.
 * Detects circular references.
 */
export function evaluateAll(
  parameters: Record<string, Parameter>
): Record<string, Parameter> {
  const result = { ...parameters };
  const visited = new Set<string>();
  const visiting = new Set<string>();

  function resolve(name: string): number {
    if (visiting.has(name)) {
      throw new Error(`Circular parameter reference detected: ${name}`);
    }
    if (visited.has(name)) {
      return result[name].value;
    }

    visiting.add(name);
    const param = result[name];
    if (param.expression) {
      param.value = evaluateExpression(param.expression, result, resolve);
    }
    visiting.delete(name);
    visited.add(name);
    return param.value;
  }

  for (const name of Object.keys(result)) {
    resolve(name);
  }

  return result;
}

/**
 * Evaluates a simple math expression with parameter references.
 * Supports: +, -, *, /, (), and parameter names.
 *
 * This is a safe evaluator — no arbitrary code execution.
 */
export function evaluateExpression(
  expression: string,
  parameters: Record<string, Parameter>,
  resolveParam?: (name: string) => number
): number {
  // Replace parameter references with their values
  let expr = expression;
  // Sort by length descending to avoid partial matches
  const paramNames = Object.keys(parameters).sort(
    (a, b) => b.length - a.length
  );

  for (const name of paramNames) {
    const regex = new RegExp(`\\b${escapeRegex(name)}\\b`, "g");
    if (regex.test(expr)) {
      const value = resolveParam
        ? resolveParam(name)
        : parameters[name].value;
      expr = expr.replace(regex, String(value));
    }
  }

  // Validate: only allow numbers, operators, parens, whitespace, decimal points
  if (!/^[\d\s+\-*/().]+$/.test(expr)) {
    throw new Error(`Invalid expression: ${expression}`);
  }

  // Evaluate using Function (safe since we validated the content)
  try {
    const result = new Function(`return (${expr})`)();
    if (typeof result !== "number" || !isFinite(result)) {
      throw new Error(`Expression "${expression}" did not produce a valid number`);
    }
    return result;
  } catch {
    throw new Error(`Failed to evaluate expression: ${expression}`);
  }
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/cad/engine/parameterRegistry.ts
git commit -m "feat(cad): add parameter registry with expression evaluation"
```

---

### Task 7: Create operation history (undo/redo)

**Files:**
- Create: `src/cad/engine/operationHistory.ts`

- [ ] **Step 1: Create undo/redo stack**

```typescript
// src/cad/engine/operationHistory.ts

import type { Feature, Parameter } from "./types";

export interface HistorySnapshot {
  features: Feature[];
  parameters: Record<string, Parameter>;
  selectedFeatureId: string | null;
}

export interface OperationHistory {
  past: HistorySnapshot[];
  present: HistorySnapshot;
  future: HistorySnapshot[];
}

/**
 * Creates a new history with an initial state.
 */
export function createHistory(initial: HistorySnapshot): OperationHistory {
  return {
    past: [],
    present: initial,
    future: [],
  };
}

/**
 * Pushes a new state, clearing the future (redo) stack.
 */
export function pushState(
  history: OperationHistory,
  state: HistorySnapshot
): OperationHistory {
  return {
    past: [...history.past, history.present],
    present: state,
    future: [], // clear redo stack
  };
}

/**
 * Undo: moves present to future, pops past into present.
 */
export function undo(history: OperationHistory): OperationHistory {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

/**
 * Redo: moves present to past, pops future into present.
 */
export function redo(history: OperationHistory): OperationHistory {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}

/**
 * Returns whether undo is available.
 */
export function canUndo(history: OperationHistory): boolean {
  return history.past.length > 0;
}

/**
 * Returns whether redo is available.
 */
export function canRedo(history: OperationHistory): boolean {
  return history.future.length > 0;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/cad/engine/operationHistory.ts
git commit -m "feat(cad): add undo/redo operation history"
```

---

### Task 8: Create project serializer (.svcp)

**Files:**
- Create: `src/cad/engine/projectSerializer.ts`

- [ ] **Step 1: Create .svcp serializer/deserializer**

```typescript
// src/cad/engine/projectSerializer.ts

import type { CadProject, Feature, Parameter } from "./types";

const CURRENT_VERSION = "1.0";

/**
 * Creates a new empty project.
 */
export function createEmptyProject(name = "Untitled"): CadProject {
  return {
    version: CURRENT_VERSION,
    name,
    units: "mm",
    parameters: {},
    features: [],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      author: "",
      material: "",
    },
  };
}

/**
 * Serializes a project to a JSON string (.svcp format).
 */
export function serializeProject(project: CadProject): string {
  const updated: CadProject = {
    ...project,
    metadata: {
      ...project.metadata,
      modified: new Date().toISOString(),
    },
  };
  return JSON.stringify(updated, null, 2);
}

/**
 * Deserializes a .svcp JSON string into a CadProject.
 * Validates the structure and migrates old versions if needed.
 */
export function deserializeProject(json: string): CadProject {
  let data: any;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("Invalid .svcp file: not valid JSON");
  }

  if (!data.version) {
    throw new Error("Invalid .svcp file: missing version field");
  }

  if (!data.features || !Array.isArray(data.features)) {
    throw new Error("Invalid .svcp file: missing or invalid features array");
  }

  // Version migration would go here for future versions

  return data as CadProject;
}

/**
 * Downloads a project as a .svcp file.
 */
export function downloadProject(project: CadProject): void {
  const json = serializeProject(project);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name.replace(/[^a-zA-Z0-9-_]/g, "_")}.svcp`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Reads a .svcp file from a File input.
 */
export async function loadProjectFromFile(file: File): Promise<CadProject> {
  const text = await file.text();
  return deserializeProject(text);
}

/**
 * Saves a project to localStorage (for Phase 1, before database).
 */
export function saveToLocalStorage(project: CadProject): void {
  const key = `svcp_${project.name}`;
  localStorage.setItem(key, serializeProject(project));
  // Update project index
  const index: string[] = JSON.parse(
    localStorage.getItem("svcp_index") || "[]"
  );
  if (!index.includes(key)) {
    index.push(key);
    localStorage.setItem("svcp_index", JSON.stringify(index));
  }
}

/**
 * Loads a project from localStorage.
 */
export function loadFromLocalStorage(name: string): CadProject | null {
  const json = localStorage.getItem(`svcp_${name}`);
  if (!json) return null;
  return deserializeProject(json);
}

/**
 * Lists all projects in localStorage.
 */
export function listLocalProjects(): string[] {
  const index: string[] = JSON.parse(
    localStorage.getItem("svcp_index") || "[]"
  );
  return index.map((key) => key.replace("svcp_", ""));
}
```

- [ ] **Step 2: Commit**

```bash
git add src/cad/engine/projectSerializer.ts
git commit -m "feat(cad): add .svcp project serializer with localStorage persistence"
```

---

## Chunk 3: React Context + CAD Workspace Layout

### Task 9: Create CAD context provider

**Files:**
- Create: `src/cad/context/CadContext.tsx`
- Create: `src/cad/hooks/useCadProject.ts`

- [ ] **Step 1: Create useCadProject hook (core state management)**

```typescript
// src/cad/hooks/useCadProject.ts

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  CadProject,
  Feature,
  Parameter,
  CadUIState,
  CadTool,
  ViewMode,
  RebuildResultPayload,
  TessellationResult,
} from "../engine/types";
import {
  createHistory,
  pushState,
  undo as undoHistory,
  redo as redoHistory,
  canUndo as canUndoHistory,
  canRedo as canRedoHistory,
  type OperationHistory,
} from "../engine/operationHistory";
import {
  createEmptyProject,
  saveToLocalStorage,
} from "../engine/projectSerializer";

export interface CadProjectState {
  project: CadProject;
  uiState: CadUIState;
  meshes: TessellationResult[];
  isRebuilding: boolean;

  // Project actions
  setProjectName: (name: string) => void;
  setFeatures: (features: Feature[]) => void;
  setParameters: (params: Record<string, Parameter>) => void;
  addFeature: (feature: Feature) => void;
  removeFeature: (featureId: string) => void;
  updateFeature: (featureId: string, updates: Partial<Feature>) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // UI state
  setActiveTool: (tool: CadTool) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedFeatureId: (id: string | null) => void;
  setSketchModeActive: (active: boolean, sketchId?: string) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;

  // Rebuild trigger
  requestRebuild: () => void;

  // Mesh results (set by worker)
  setMeshes: (meshes: TessellationResult[]) => void;
  setIsRebuilding: (v: boolean) => void;

  // Persistence
  save: () => void;
}

const defaultUI: CadUIState = {
  activeTool: "select",
  viewMode: "shaded",
  selectedFeatureId: null,
  sketchModeActive: false,
  activeSketchId: null,
  gridVisible: true,
  snapEnabled: true,
  snapValue: 1,
  units: "mm",
};

export function useCadProject(
  initialProject?: CadProject
): CadProjectState {
  const [project, setProject] = useState<CadProject>(
    initialProject ?? createEmptyProject()
  );
  const [uiState, setUiState] = useState<CadUIState>(defaultUI);
  const [meshes, setMeshes] = useState<TessellationResult[]>([]);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [needsRebuild, setNeedsRebuild] = useState(false);

  const historyRef = useRef<OperationHistory>(
    createHistory({
      features: project.features,
      parameters: project.parameters,
      selectedFeatureId: null,
    })
  );

  // Auto-save debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const commitToHistory = useCallback(() => {
    historyRef.current = pushState(historyRef.current, {
      features: project.features,
      parameters: project.parameters,
      selectedFeatureId: uiState.selectedFeatureId,
    });
  }, [project.features, project.parameters, uiState.selectedFeatureId]);

  const requestRebuild = useCallback(() => {
    setNeedsRebuild(true);
  }, []);

  // Debounced auto-save
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToLocalStorage(project);
    }, 2000);
  }, [project]);

  const addFeature = useCallback(
    (feature: Feature) => {
      setProject((prev) => ({
        ...prev,
        features: [...prev.features, feature],
      }));
      commitToHistory();
      requestRebuild();
      scheduleSave();
    },
    [commitToHistory, requestRebuild, scheduleSave]
  );

  const removeFeature = useCallback(
    (featureId: string) => {
      setProject((prev) => ({
        ...prev,
        features: prev.features.filter((f) => f.id !== featureId),
      }));
      commitToHistory();
      requestRebuild();
      scheduleSave();
    },
    [commitToHistory, requestRebuild, scheduleSave]
  );

  const updateFeature = useCallback(
    (featureId: string, updates: Partial<Feature>) => {
      setProject((prev) => ({
        ...prev,
        features: prev.features.map((f) =>
          f.id === featureId ? { ...f, ...updates } : f
        ),
      }));
      commitToHistory();
      requestRebuild();
      scheduleSave();
    },
    [commitToHistory, requestRebuild, scheduleSave]
  );

  const undo = useCallback(() => {
    if (!canUndoHistory(historyRef.current)) return;
    historyRef.current = undoHistory(historyRef.current);
    const snap = historyRef.current.present;
    setProject((prev) => ({
      ...prev,
      features: snap.features,
      parameters: snap.parameters,
    }));
    setUiState((prev) => ({
      ...prev,
      selectedFeatureId: snap.selectedFeatureId,
    }));
    requestRebuild();
  }, [requestRebuild]);

  const redo = useCallback(() => {
    if (!canRedoHistory(historyRef.current)) return;
    historyRef.current = redoHistory(historyRef.current);
    const snap = historyRef.current.present;
    setProject((prev) => ({
      ...prev,
      features: snap.features,
      parameters: snap.parameters,
    }));
    setUiState((prev) => ({
      ...prev,
      selectedFeatureId: snap.selectedFeatureId,
    }));
    requestRebuild();
  }, [requestRebuild]);

  return {
    project,
    uiState,
    meshes,
    isRebuilding,
    setProjectName: (name) =>
      setProject((prev) => ({ ...prev, name })),
    setFeatures: (features) => {
      setProject((prev) => ({ ...prev, features }));
      commitToHistory();
      requestRebuild();
      scheduleSave();
    },
    setParameters: (parameters) => {
      setProject((prev) => ({ ...prev, parameters }));
      commitToHistory();
      requestRebuild();
      scheduleSave();
    },
    addFeature,
    removeFeature,
    updateFeature,
    undo,
    redo,
    canUndo: canUndoHistory(historyRef.current),
    canRedo: canRedoHistory(historyRef.current),
    setActiveTool: (tool) =>
      setUiState((prev) => ({ ...prev, activeTool: tool })),
    setViewMode: (mode) =>
      setUiState((prev) => ({ ...prev, viewMode: mode })),
    setSelectedFeatureId: (id) =>
      setUiState((prev) => ({ ...prev, selectedFeatureId: id })),
    setSketchModeActive: (active, sketchId) =>
      setUiState((prev) => ({
        ...prev,
        sketchModeActive: active,
        activeSketchId: sketchId ?? null,
        activeTool: active ? "line" : "select",
      })),
    toggleGrid: () =>
      setUiState((prev) => ({ ...prev, gridVisible: !prev.gridVisible })),
    toggleSnap: () =>
      setUiState((prev) => ({ ...prev, snapEnabled: !prev.snapEnabled })),
    requestRebuild,
    setMeshes,
    setIsRebuilding,
    save: () => saveToLocalStorage(project),
  };
}
```

- [ ] **Step 2: Create CadContext**

```typescript
// src/cad/context/CadContext.tsx

"use client";

import { createContext, useContext, useEffect, type ReactNode } from "react";
import { useCadProject, type CadProjectState } from "../hooks/useCadProject";
import { useOcctWorker, type OcctStatus } from "../hooks/useOcctWorker";
import type { CadProject } from "../engine/types";

interface CadContextValue extends CadProjectState {
  occtStatus: OcctStatus;
  occtLoadProgress: number;
  occtLoadMessage: string;
  occtError: string | null;
}

const CadCtx = createContext<CadContextValue | null>(null);

export function CadProvider({
  children,
  initialProject,
}: {
  children: ReactNode;
  initialProject?: CadProject;
}) {
  const projectState = useCadProject(initialProject);
  const worker = useOcctWorker();

  // Auto-rebuild when features change and worker is ready
  useEffect(() => {
    if (worker.status !== "ready") return;

    let cancelled = false;
    projectState.setIsRebuilding(true);

    worker
      .rebuild({
        features: projectState.project.features,
        parameters: projectState.project.parameters,
      })
      .then((result) => {
        if (cancelled || !result) return;
        projectState.setMeshes(result.meshes);
      })
      .finally(() => {
        if (!cancelled) projectState.setIsRebuilding(false);
      });

    return () => {
      cancelled = true;
    };
    // Only rebuild when features or parameters change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    projectState.project.features,
    projectState.project.parameters,
    worker.status,
  ]);

  const value: CadContextValue = {
    ...projectState,
    occtStatus: worker.status,
    occtLoadProgress: worker.loadProgress,
    occtLoadMessage: worker.loadMessage,
    occtError: worker.error,
  };

  return <CadCtx.Provider value={value}>{children}</CadCtx.Provider>;
}

export function useCad(): CadContextValue {
  const ctx = useContext(CadCtx);
  if (!ctx) {
    throw new Error("useCad must be used within a CadProvider");
  }
  return ctx;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/cad/hooks/useCadProject.ts src/cad/context/CadContext.tsx
git commit -m "feat(cad): add CadContext provider with project state and auto-rebuild"
```

---

### Task 10: Create the /cad route and workspace layout

**Files:**
- Create: `src/app/cad/layout.tsx`
- Create: `src/app/cad/page.tsx`
- Create: `src/cad/components/CadWorkspace.tsx`
- Create: `src/cad/components/OcctLoadingScreen.tsx`

- [ ] **Step 1: Create CAD layout (no navbar/footer)**

```typescript
// src/app/cad/layout.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SpaceVision CAD — Engineering Mode",
  description: "Professional parametric CAD powered by OpenCASCADE",
};

export default function CadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#0d0d1a] text-white">
      {children}
    </div>
  );
}
```

- [ ] **Step 2: Create OCCT loading screen**

```typescript
// src/cad/components/OcctLoadingScreen.tsx

"use client";

interface OcctLoadingScreenProps {
  progress: number;
  message: string;
  error: string | null;
}

export function OcctLoadingScreen({
  progress,
  message,
  error,
}: OcctLoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0d1a]">
      <div className="flex flex-col items-center gap-6">
        {/* Logo / Title */}
        <h1 className="text-2xl font-bold text-white">
          SpaceVision <span className="text-indigo-400">CAD</span>
        </h1>
        <p className="text-sm text-gray-400">
          Loading OpenCASCADE geometry kernel...
        </p>

        {/* Progress bar */}
        <div className="h-2 w-64 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Status message */}
        <p className="text-xs text-gray-500">{message || "Initializing..."}</p>

        {/* Error state */}
        {error && (
          <div className="mt-4 max-w-md rounded-lg border border-red-800 bg-red-900/30 p-4 text-sm text-red-300">
            <p className="font-medium">Failed to load CAD engine</p>
            <p className="mt-1 text-xs text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded bg-red-800 px-3 py-1 text-xs text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create CadWorkspace layout shell**

This is created as a thin shell. The real viewport, toolbars, and status bar get imported later in Tasks 11, 13, 14. Write it now with placeholder divs that will be replaced:

```typescript
// src/cad/components/CadWorkspace.tsx

"use client";

import { useEffect } from "react";
import { useCad } from "../context/CadContext";
import { OcctLoadingScreen } from "./OcctLoadingScreen";

// These imports will be added as components are created in later tasks:
// import { TopToolbar } from "./TopToolbar";        // Task 13
// import { SketchToolbar } from "./SketchToolbar";  // Task 13
// import { CadViewport } from "./CadViewport";      // Task 11
// import { StatusBar } from "./StatusBar";           // Task 14

export function CadWorkspace() {
  const cad = useCad();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault(); cad.undo();
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault(); cad.redo();
      }
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); cad.save();
      }
      if (e.key === "Escape") {
        if (cad.uiState.sketchModeActive) cad.setSketchModeActive(false);
        else cad.setSelectedFeatureId(null);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (cad.uiState.selectedFeatureId) {
          cad.removeFeature(cad.uiState.selectedFeatureId);
          cad.setSelectedFeatureId(null);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cad]);

  if (cad.occtStatus === "loading" || cad.occtStatus === "idle") {
    return <OcctLoadingScreen progress={cad.occtLoadProgress} message={cad.occtLoadMessage} error={null} />;
  }
  if (cad.occtStatus === "error") {
    return <OcctLoadingScreen progress={0} message="" error={cad.occtError} />;
  }

  return (
    <div className="flex h-full flex-col">
      {/* TopToolbar — placeholder until Task 13 */}
      <div className="flex h-10 items-center border-b border-gray-800 bg-[#1a1a2e] px-4 text-xs">
        <span className="font-bold text-indigo-400">SpaceVision CAD</span>
        <span className="ml-auto rounded bg-green-900/50 px-2 py-0.5 text-green-400">● OCCT Ready</span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Feature tree — left */}
        <div className="w-56 overflow-y-auto border-r border-gray-800 bg-[#12122a] p-2 text-xs">
          <div className="mb-2 font-bold text-indigo-400">Feature Tree</div>
          {cad.project.features.length === 0 ? (
            <p className="text-gray-600">No features yet.</p>
          ) : (
            cad.project.features.map((feature) => (
              <div
                key={feature.id}
                onClick={() => cad.setSelectedFeatureId(feature.id)}
                className={`mb-0.5 cursor-pointer rounded px-2 py-1 ${
                  cad.uiState.selectedFeatureId === feature.id
                    ? "bg-indigo-900/50 text-white"
                    : feature.suppressed ? "text-gray-600 line-through"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                {feature.type === "sketch" ? "✏️" : "🔼"} {feature.name}
              </div>
            ))
          )}
          <div className="mb-2 mt-4 font-bold text-indigo-400">Parameters</div>
          {Object.entries(cad.project.parameters).map(([name, param]) => (
            <div key={name} className="flex justify-between px-2 py-0.5 text-gray-400">
              <span>{name}</span>
              <span className="text-green-400">{param.value} {param.unit}</span>
            </div>
          ))}
        </div>

        {/* Viewport — placeholder until Task 11 */}
        <div className="relative flex-1 bg-[#0d0d1a] flex items-center justify-center text-gray-600">
          <p>3D Viewport (will be replaced by CadViewport in Task 11)</p>
        </div>

        {/* Properties — right */}
        <div className="w-52 overflow-y-auto border-l border-gray-800 bg-[#12122a] p-2 text-xs">
          <div className="mb-2 font-bold text-indigo-400">Properties</div>
          {cad.uiState.selectedFeatureId ? (
            (() => {
              const feature = cad.project.features.find((f) => f.id === cad.uiState.selectedFeatureId);
              if (!feature) return <p className="text-gray-600">Not found</p>;
              return (
                <div>
                  <p className="text-gray-400">{feature.type}: {feature.name}</p>
                  {feature.type === "extrude" && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-gray-400">
                        <span>Depth</span><span className="text-green-400">{String(feature.depth)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Direction</span><span>{feature.direction}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Operation</span><span>{feature.operation}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : <p className="text-gray-600">Select a feature</p>}
        </div>
      </div>

      {/* StatusBar — placeholder until Task 14 */}
      <div className="flex h-6 items-center justify-between border-t border-gray-800 bg-[#1a1a2e] px-4 text-xs text-gray-500">
        <span>{cad.isRebuilding ? "Rebuilding..." : "Ready"} | {cad.project.features.length} Features</span>
        <span>{cad.project.name}</span>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create the /cad page**

```typescript
// src/app/cad/page.tsx

"use client";

import { CadProvider } from "@/cad/context/CadContext";
import { CadWorkspace } from "@/cad/components/CadWorkspace";

export default function CadPage() {
  return (
    <CadProvider>
      <CadWorkspace />
    </CadProvider>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add src/app/cad/layout.tsx src/app/cad/page.tsx src/cad/components/CadWorkspace.tsx src/cad/components/OcctLoadingScreen.tsx
git commit -m "feat(cad): add /cad route with workspace layout, loading screen, and panel shell"
```

---

## Chunk 4: 3D Viewport with R3F + Sketch Mode

### Task 11: Create the R3F CAD viewport

**Files:**
- Create: `src/cad/components/CadViewport.tsx`
- Create: `src/cad/components/TessellatedMesh.tsx`
- Create: `src/cad/components/ViewCube.tsx`

- [ ] **Step 1: Create TessellatedMesh component**

```typescript
// src/cad/components/TessellatedMesh.tsx

"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { TessellationResult } from "../engine/types";

interface TessellatedMeshProps {
  mesh: TessellationResult;
  viewMode: "shaded" | "wireframe" | "xray";
}

export function TessellatedMesh({ mesh, viewMode }: TessellatedMeshProps) {
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute(
      "position",
      new THREE.BufferAttribute(mesh.vertices, 3)
    );
    geo.setAttribute(
      "normal",
      new THREE.BufferAttribute(mesh.normals, 3)
    );
    geo.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
    return geo;
  }, [mesh]);

  return (
    <group>
      {/* Solid mesh */}
      <mesh geometry={geometry}>
        {viewMode === "xray" ? (
          <meshPhysicalMaterial
            color="#6366f1"
            metalness={0.1}
            roughness={0.4}
            transparent
            opacity={0.3}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial
            color="#a5b4fc"
            metalness={0.2}
            roughness={0.5}
            wireframe={viewMode === "wireframe"}
            side={THREE.DoubleSide}
          />
        )}
      </mesh>

      {/* Edge lines for shaded + xray modes */}
      {viewMode !== "wireframe" && (
        <lineSegments>
          <edgesGeometry args={[geometry, 15]} />
          <lineBasicMaterial color="#1e1b4b" opacity={0.3} transparent />
        </lineSegments>
      )}
    </group>
  );
}
```

- [ ] **Step 2: Create ViewCube**

```typescript
// src/cad/components/ViewCube.tsx

"use client";

import { useThree } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import type { ViewPreset } from "../engine/types";

const VIEW_ROTATIONS: Record<ViewPreset, [number, number, number]> = {
  front: [0, 0, 0],
  back: [0, Math.PI, 0],
  top: [-Math.PI / 2, 0, 0],
  bottom: [Math.PI / 2, 0, 0],
  left: [0, -Math.PI / 2, 0],
  right: [0, Math.PI / 2, 0],
  iso: [Math.PI / 6, Math.PI / 4, 0],
};

interface ViewCubeProps {
  onSetView: (preset: ViewPreset) => void;
}

export function ViewCubeOverlay({ onSetView }: ViewCubeProps) {
  return (
    <div className="absolute left-2 top-2 flex flex-col gap-1">
      {(["iso", "front", "top", "right"] as ViewPreset[]).map((preset) => (
        <button
          key={preset}
          onClick={() => onSetView(preset)}
          className="rounded bg-gray-800/80 px-2 py-1 text-xs capitalize text-gray-400 hover:bg-gray-700 hover:text-white"
        >
          {preset}
        </button>
      ))}
    </div>
  );
}

// Camera positions for view presets (distance 50 from origin)
export const VIEW_CAMERA_POSITIONS: Record<ViewPreset, [number, number, number]> = {
  front: [0, 0, 50],
  back: [0, 0, -50],
  top: [0, 50, 0],
  bottom: [0, -50, 0],
  left: [-50, 0, 0],
  right: [50, 0, 0],
  iso: [30, 30, 30],
};
```

- [ ] **Step 3: Create CadViewport**

```typescript
// src/cad/components/CadViewport.tsx

"use client";

import { useRef, useCallback, useEffect } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from "@react-three/drei";
import * as THREE from "three";
import { useCad } from "../context/CadContext";
import { TessellatedMesh } from "./TessellatedMesh";
import { SketchOverlay } from "./SketchOverlay";
import { ViewCubeOverlay, VIEW_CAMERA_POSITIONS } from "./ViewCube";
import type { ViewPreset, SketchFeature } from "../engine/types";

function CadScene() {
  const cad = useCad();
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  // Listen for view preset changes
  useEffect(() => {
    const handler = (e: Event) => {
      const preset = (e as CustomEvent).detail.preset as ViewPreset;
      const pos = VIEW_CAMERA_POSITIONS[preset];
      if (pos) {
        camera.position.set(pos[0], pos[1], pos[2]);
        camera.lookAt(0, 0, 0);
        controlsRef.current?.target.set(0, 0, 0);
        controlsRef.current?.update();
      }
    };
    window.addEventListener("cad-set-view", handler);
    return () => window.removeEventListener("cad-set-view", handler);
  }, [camera]);

  // Get active sketch for overlay rendering
  const activeSketch = cad.uiState.activeSketchId
    ? cad.project.features.find(
        (f) => f.id === cad.uiState.activeSketchId && f.type === "sketch"
      ) as SketchFeature | undefined
    : undefined;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[10, 20, 10]} intensity={0.8} />
      <directionalLight position={[-10, -5, -10]} intensity={0.3} />
      <hemisphereLight
        args={["#b1e1ff", "#b97a20", 0.3]}
      />

      {/* Grid */}
      {cad.uiState.gridVisible && (
        <Grid
          args={[200, 200]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#1a1a3e"
          sectionSize={10}
          sectionThickness={1}
          sectionColor="#2a2a4e"
          fadeDistance={100}
          infiniteGrid
        />
      )}

      {/* Origin planes (subtle) */}
      <axesHelper args={[5]} />

      {/* Tessellated meshes from OCCT */}
      {cad.meshes.map((mesh, i) => (
        <TessellatedMesh
          key={`${mesh.featureId}-${i}`}
          mesh={mesh}
          viewMode={cad.uiState.viewMode}
        />
      ))}

      {/* Sketch overlay (when in sketch mode) */}
      {activeSketch && (
        <SketchOverlay sketch={activeSketch.sketch} />
      )}

      {/* Orbit controls */}
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.1}
        minDistance={1}
        maxDistance={500}
      />

      {/* View gizmo */}
      <GizmoHelper alignment="top-right" margin={[60, 60]}>
        <GizmoViewport labelColor="white" axisHeadScale={0.8} />
      </GizmoHelper>
    </>
  );
}

export function CadViewport() {
  const cad = useCad();

  const handleSetView = useCallback((preset: ViewPreset) => {
    // NOTE: Direct camera manipulation requires accessing the R3F camera ref.
    // This will be passed down from CadScene. For now, we dispatch a custom event
    // that CadScene listens for.
    window.dispatchEvent(
      new CustomEvent("cad-set-view", { detail: { preset } })
    );
  }, []);

  return (
    <div className="relative h-full w-full">
      <Canvas
        camera={{
          position: [30, 30, 30],
          fov: 45,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.2,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(new THREE.Color("#0d0d1a"), 1);
        }}
      >
        <CadScene />
      </Canvas>

      {/* View preset buttons overlay */}
      <ViewCubeOverlay onSetView={handleSetView} />

      {/* Rebuilding indicator */}
      {cad.isRebuilding && (
        <div className="absolute left-1/2 top-4 -translate-x-1/2 rounded bg-indigo-900/80 px-3 py-1 text-xs text-indigo-200">
          Rebuilding geometry...
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Wire viewport into CadWorkspace**

In `src/cad/components/CadWorkspace.tsx`:

1. Add import at the top:
```typescript
import { CadViewport } from "./CadViewport";
```

2. Find and replace the viewport placeholder:
```typescript
// FIND this:
<div className="relative flex-1 bg-[#0d0d1a] flex items-center justify-center text-gray-600">
  <p>3D Viewport (will be replaced by CadViewport in Task 11)</p>
</div>

// REPLACE with:
<div className="relative flex-1">
  <CadViewport />
</div>
```

- [ ] **Step 5: Commit**

```bash
git add src/cad/components/CadViewport.tsx src/cad/components/TessellatedMesh.tsx src/cad/components/ViewCube.tsx src/cad/components/CadWorkspace.tsx
git commit -m "feat(cad): add R3F 3D viewport with tessellated mesh rendering and view controls"
```

---

### Task 12: Create sketch mode interaction

**Files:**
- Create: `src/cad/hooks/useSketchMode.ts`
- Create: `src/cad/components/SketchOverlay.tsx`

- [ ] **Step 1: Create useSketchMode hook**

```typescript
// src/cad/hooks/useSketchMode.ts

"use client";

import { useState, useCallback, useRef } from "react";
import type { Sketch, SketchPlane, SketchEntity, SketchPoint, CadTool } from "../engine/types";
import { newEntityId, newPointId } from "../engine/featureTree";

interface SketchModeState {
  isDrawing: boolean;
  currentPoints: { x: number; y: number }[];
  previewEntity: SketchEntity | null;
}

export function useSketchMode(
  sketch: Sketch | null,
  activeTool: CadTool,
  onUpdateSketch: (sketch: Sketch) => void
) {
  const [state, setState] = useState<SketchModeState>({
    isDrawing: false,
    currentPoints: [],
    previewEntity: null,
  });

  const startPointRef = useRef<{ x: number; y: number } | null>(null);

  /**
   * Called when user clicks on the sketch plane.
   * Coordinates are in sketch-local 2D space.
   */
  const handleClick = useCallback(
    (x: number, y: number) => {
      if (!sketch) return;

      if (activeTool === "rectangle") {
        if (!startPointRef.current) {
          // First click: set origin
          startPointRef.current = { x, y };
          setState((prev) => ({
            ...prev,
            isDrawing: true,
            currentPoints: [{ x, y }],
          }));
        } else {
          // Second click: finalize rectangle
          const origin = startPointRef.current;
          const width = Math.abs(x - origin.x);
          const height = Math.abs(y - origin.y);
          const ox = Math.min(origin.x, x);
          const oy = Math.min(origin.y, y);

          if (width > 0.01 && height > 0.01) {
            const originPt: SketchPoint = { id: newPointId(), x: ox, y: oy };
            const rect: SketchEntity = {
              id: newEntityId(),
              type: "rectangle",
              originId: originPt.id,
              width,
              height,
            };
            onUpdateSketch({
              ...sketch,
              points: [...sketch.points, originPt],
              entities: [...sketch.entities, rect],
            });
          }

          startPointRef.current = null;
          setState({ isDrawing: false, currentPoints: [], previewEntity: null });
        }
      }

      if (activeTool === "circle") {
        if (!startPointRef.current) {
          startPointRef.current = { x, y };
          setState((prev) => ({
            ...prev,
            isDrawing: true,
            currentPoints: [{ x, y }],
          }));
        } else {
          const center = startPointRef.current;
          const dx = x - center.x;
          const dy = y - center.y;
          const radius = Math.sqrt(dx * dx + dy * dy);

          if (radius > 0.01) {
            const centerPt: SketchPoint = {
              id: newPointId(),
              x: center.x,
              y: center.y,
            };
            const circle: SketchEntity = {
              id: newEntityId(),
              type: "circle",
              centerId: centerPt.id,
              radius,
            };
            onUpdateSketch({
              ...sketch,
              points: [...sketch.points, centerPt],
              entities: [...sketch.entities, circle],
            });
          }

          startPointRef.current = null;
          setState({ isDrawing: false, currentPoints: [], previewEntity: null });
        }
      }

      if (activeTool === "line") {
        if (!startPointRef.current) {
          startPointRef.current = { x, y };
          setState((prev) => ({
            ...prev,
            isDrawing: true,
            currentPoints: [{ x, y }],
          }));
        } else {
          const start = startPointRef.current;
          const startPt: SketchPoint = {
            id: newPointId(),
            x: start.x,
            y: start.y,
          };
          const endPt: SketchPoint = { id: newPointId(), x, y };
          const line: SketchEntity = {
            id: newEntityId(),
            type: "line",
            startId: startPt.id,
            endId: endPt.id,
          };
          onUpdateSketch({
            ...sketch,
            points: [...sketch.points, startPt, endPt],
            entities: [...sketch.entities, line],
          });

          // Chain: next line starts from this endpoint
          startPointRef.current = { x, y };
          setState((prev) => ({
            ...prev,
            currentPoints: [{ x, y }],
          }));
        }
      }
    },
    [sketch, activeTool, onUpdateSketch]
  );

  /**
   * Called on mouse move for live preview.
   */
  const handleMouseMove = useCallback(
    (x: number, y: number) => {
      if (!state.isDrawing || !startPointRef.current) return;

      setState((prev) => ({
        ...prev,
        currentPoints: [startPointRef.current!, { x, y }],
      }));
    },
    [state.isDrawing]
  );

  /**
   * Cancel current drawing operation (e.g., Escape key).
   */
  const cancel = useCallback(() => {
    startPointRef.current = null;
    setState({ isDrawing: false, currentPoints: [], previewEntity: null });
  }, []);

  return {
    ...state,
    handleClick,
    handleMouseMove,
    cancel,
  };
}
```

- [ ] **Step 2: Create SketchOverlay (2D sketch visualization in the 3D scene)**

```typescript
// src/cad/components/SketchOverlay.tsx

"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { Sketch, SketchPlane } from "../engine/types";

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
    return null;
  }, [previewPoints, activeTool, sketch.plane]);

  return (
    <group>
      {/* Existing sketch entities */}
      {linePoints.map((pts, i) => (
        <line key={i}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={pts.length}
              array={new Float32Array(pts.flatMap((p) => [p.x, p.y, p.z]))}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#22d3ee" linewidth={2} />
        </line>
      ))}

      {/* Preview during drawing */}
      {previewLine && (
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={previewLine.length}
              array={
                new Float32Array(
                  previewLine.flatMap((p) => [p.x, p.y, p.z])
                )
              }
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#f59e0b" linewidth={1} opacity={0.7} transparent />
        </line>
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
```

- [ ] **Step 3: Commit**

```bash
git add src/cad/hooks/useSketchMode.ts src/cad/components/SketchOverlay.tsx
git commit -m "feat(cad): add sketch mode interaction hook and 2D overlay rendering"
```

---

## Chunk 5: Wiring It All Together + Quick-Add UI

### Task 13: Add "New Sketch" and "Extrude" buttons to the workspace

**Files:**
- Modify: `src/cad/components/CadWorkspace.tsx`
- Create: `src/cad/components/SketchToolbar.tsx`
- Create: `src/cad/components/TopToolbar.tsx`

- [ ] **Step 1: Create TopToolbar with File/Sketch/Feature menus**

```typescript
// src/cad/components/TopToolbar.tsx

"use client";

import { useState, useRef, useEffect } from "react";
import { useCad } from "../context/CadContext";
import {
  createSketch,
  createExtrude,
} from "../engine/featureTree";
import { createParameter } from "../engine/parameterRegistry";
import { downloadProject, loadProjectFromFile } from "../engine/projectSerializer";
import type { SketchPlane, SketchFeature } from "../engine/types";

type MenuId = "file" | "sketch" | "features" | "view" | null;

export function TopToolbar() {
  const cad = useCad();
  const [openMenu, setOpenMenu] = useState<MenuId>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleNewSketch = (plane: SketchPlane) => {
    const sketchFeature = createSketch(`Sketch ${cad.project.features.length + 1}`, plane);
    cad.addFeature(sketchFeature);
    cad.setSelectedFeatureId(sketchFeature.id);
    cad.setSketchModeActive(true, sketchFeature.id);
    setOpenMenu(null);
  };

  const handleExtrude = () => {
    // Find the last sketch feature
    const sketches = cad.project.features.filter(
      (f): f is SketchFeature => f.type === "sketch"
    );
    if (sketches.length === 0) {
      alert("Create a sketch first before extruding.");
      return;
    }
    const lastSketch = sketches[sketches.length - 1];
    const extrude = createExtrude(
      `Extrude ${cad.project.features.filter((f) => f.type === "extrude").length + 1}`,
      lastSketch.id,
      10, // default 10mm depth
      "add"
    );
    cad.addFeature(extrude);
    cad.setSelectedFeatureId(extrude.id);
    setOpenMenu(null);
  };

  const handleSaveFile = () => {
    downloadProject(cad.project);
    setOpenMenu(null);
  };

  const handleOpenFile = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".svcp,.json";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      try {
        const project = await loadProjectFromFile(file);
        cad.setProjectName(project.name);
        cad.setFeatures(project.features);
        cad.setParameters(project.parameters);
      } catch (err: any) {
        alert(`Failed to open file: ${err.message}`);
      }
    };
    input.click();
    setOpenMenu(null);
  };

  const menus: { id: MenuId; label: string; items: { label: string; action: () => void; shortcut?: string }[] }[] = [
    {
      id: "file",
      label: "File",
      items: [
        { label: "New Project", action: () => { window.location.reload(); }, shortcut: "Ctrl+N" },
        { label: "Open .svcp...", action: handleOpenFile, shortcut: "Ctrl+O" },
        { label: "Save to File", action: handleSaveFile, shortcut: "Ctrl+S" },
      ],
    },
    {
      id: "sketch",
      label: "Sketch",
      items: [
        { label: "New Sketch on XY Plane", action: () => handleNewSketch("XY") },
        { label: "New Sketch on XZ Plane", action: () => handleNewSketch("XZ") },
        { label: "New Sketch on YZ Plane", action: () => handleNewSketch("YZ") },
        { label: "Finish Sketch", action: () => cad.setSketchModeActive(false) },
      ],
    },
    {
      id: "features",
      label: "Features",
      items: [
        { label: "Extrude", action: handleExtrude, shortcut: "E" },
      ],
    },
    {
      id: "view",
      label: "View",
      items: [
        { label: cad.uiState.gridVisible ? "Hide Grid" : "Show Grid", action: cad.toggleGrid },
        { label: cad.uiState.snapEnabled ? "Disable Snap" : "Enable Snap", action: cad.toggleSnap },
      ],
    },
  ];

  return (
    <div ref={menuRef} className="flex h-10 items-center border-b border-gray-800 bg-[#1a1a2e] px-4 text-xs">
      <span className="mr-4 font-bold text-indigo-400">SpaceVision CAD</span>

      {menus.map((menu) => (
        <div key={menu.id} className="relative">
          <button
            onClick={() => setOpenMenu(openMenu === menu.id ? null : menu.id)}
            className={`px-3 py-2 ${
              openMenu === menu.id
                ? "bg-gray-700 text-white"
                : "text-gray-400 hover:text-white"
            }`}
          >
            {menu.label}
          </button>

          {openMenu === menu.id && (
            <div className="absolute left-0 top-full z-50 min-w-48 rounded-b border border-gray-700 bg-[#1a1a2e] py-1 shadow-xl">
              {menu.items.map((item, i) => (
                <button
                  key={i}
                  onClick={item.action}
                  className="flex w-full items-center justify-between px-4 py-1.5 text-left text-gray-300 hover:bg-gray-700"
                >
                  <span>{item.label}</span>
                  {item.shortcut && (
                    <span className="ml-4 text-gray-500">{item.shortcut}</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      ))}

      <div className="flex-1" />

      {/* Undo/Redo */}
      <button
        onClick={cad.undo}
        disabled={!cad.canUndo}
        className="mr-1 rounded px-2 py-1 text-gray-400 hover:bg-gray-700 disabled:opacity-30"
        title="Undo (Ctrl+Z)"
      >
        ↩
      </button>
      <button
        onClick={cad.redo}
        disabled={!cad.canRedo}
        className="mr-4 rounded px-2 py-1 text-gray-400 hover:bg-gray-700 disabled:opacity-30"
        title="Redo (Ctrl+Shift+Z)"
      >
        ↪
      </button>

      <span className="rounded bg-green-900/50 px-2 py-0.5 text-green-400">
        ● OCCT Ready
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Create SketchToolbar (contextual)**

```typescript
// src/cad/components/SketchToolbar.tsx

"use client";

import { useCad } from "../context/CadContext";
import type { CadTool } from "../engine/types";

const SKETCH_TOOLS: { tool: CadTool; label: string; icon: string }[] = [
  { tool: "select", label: "Select", icon: "↖" },
  { tool: "line", label: "Line", icon: "╱" },
  { tool: "circle", label: "Circle", icon: "○" },
  { tool: "rectangle", label: "Rectangle", icon: "▭" },
  { tool: "arc", label: "Arc", icon: "⌒" },
];

export function SketchToolbar() {
  const cad = useCad();

  if (!cad.uiState.sketchModeActive) return null;

  return (
    <div className="flex h-8 items-center border-b border-gray-800/50 bg-[#16162a] px-4 text-xs">
      <span className="mr-3 text-amber-400">Sketch Tools:</span>
      {SKETCH_TOOLS.map(({ tool, label, icon }) => (
        <button
          key={tool}
          onClick={() => cad.setActiveTool(tool)}
          className={`mr-1 flex items-center gap-1 rounded px-2 py-0.5 ${
            cad.uiState.activeTool === tool
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}
      <div className="flex-1" />
      <button
        onClick={() => cad.setSketchModeActive(false)}
        className="rounded bg-green-800 px-3 py-0.5 text-green-200 hover:bg-green-700"
      >
        ✓ Finish Sketch
      </button>
    </div>
  );
}
```

- [ ] **Step 3: Update CadWorkspace to use TopToolbar and SketchToolbar**

In `src/cad/components/CadWorkspace.tsx`:

1. Add imports at the top:
```typescript
import { TopToolbar } from "./TopToolbar";
import { SketchToolbar } from "./SketchToolbar";
```

2. Find and replace the top toolbar placeholder:
```typescript
// FIND this:
{/* TopToolbar — placeholder until Task 13 */}
<div className="flex h-10 items-center border-b border-gray-800 bg-[#1a1a2e] px-4 text-xs">
  <span className="font-bold text-indigo-400">SpaceVision CAD</span>
  <span className="ml-auto rounded bg-green-900/50 px-2 py-0.5 text-green-400">● OCCT Ready</span>
</div>

// REPLACE with:
<TopToolbar />
<SketchToolbar />
```

- [ ] **Step 4: Commit**

```bash
git add src/cad/components/TopToolbar.tsx src/cad/components/SketchToolbar.tsx src/cad/components/CadWorkspace.tsx
git commit -m "feat(cad): add top toolbar with menus, sketch toolbar, and feature creation UI"
```

---

### Task 14: Create StatusBar component

**Files:**
- Create: `src/cad/components/StatusBar.tsx`
- Modify: `src/cad/components/CadWorkspace.tsx`

- [ ] **Step 1: Create StatusBar**

```typescript
// src/cad/components/StatusBar.tsx

"use client";

import { useCad } from "../context/CadContext";

export function StatusBar() {
  const cad = useCad();

  return (
    <div className="flex h-6 items-center justify-between border-t border-gray-800 bg-[#1a1a2e] px-4 text-xs text-gray-500">
      <span>
        {cad.isRebuilding ? "⟳ Rebuilding..." : "● Ready"} |{" "}
        {cad.project.features.length} Feature
        {cad.project.features.length !== 1 ? "s" : ""}
        {cad.uiState.sketchModeActive && " | Sketch Mode Active"}
      </span>
      <span>
        {cad.project.name} | {cad.project.units}
      </span>
    </div>
  );
}
```

- [ ] **Step 2: Wire StatusBar into CadWorkspace**

In `src/cad/components/CadWorkspace.tsx`:

1. Add import:
```typescript
import { StatusBar } from "./StatusBar";
```

2. Find and replace the status bar placeholder:
```typescript
// FIND this:
{/* StatusBar — placeholder until Task 14 */}
<div className="flex h-6 items-center justify-between border-t border-gray-800 bg-[#1a1a2e] px-4 text-xs text-gray-500">
  <span>{cad.isRebuilding ? "Rebuilding..." : "Ready"} | {cad.project.features.length} Features</span>
  <span>{cad.project.name}</span>
</div>

// REPLACE with:
<StatusBar />
```

- [ ] **Step 3: Commit**

```bash
git add src/cad/components/StatusBar.tsx src/cad/components/CadWorkspace.tsx
git commit -m "feat(cad): add status bar component"
```

---

### Task 15: Manual integration test — verify the full flow

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Navigate to http://localhost:3000/cad**

Expected:
- OCCT loading screen appears with progress bar
- After WASM loads (~5-15 seconds first time), workspace appears
- Feature tree panel on left (empty)
- 3D viewport with grid in center
- Properties panel on right
- Top toolbar with File, Sketch, Features, View menus
- Status bar at bottom

- [ ] **Step 3: Test the flow: Sketch → Extrude**

1. Click Sketch > New Sketch on XY Plane
2. Sketch toolbar appears, tool is "Line" by default
3. Switch to "Rectangle" tool
4. Click two points in the viewport to draw a rectangle
5. Click "Finish Sketch"
6. Click Features > Extrude
7. The rectangle should extrude into a 3D box in the viewport
8. Feature tree should show: Sketch 1, Extrude 1

- [ ] **Step 4: Test undo/redo**

1. Press Ctrl+Z — extrude disappears
2. Press Ctrl+Shift+Z — extrude reappears
3. Press Ctrl+S — project saves to localStorage

- [ ] **Step 5: Test save/load**

1. Click File > Save to File — downloads .svcp
2. Click File > Open .svcp — opens file picker
3. Select the downloaded file — project reloads

- [ ] **Step 6: Fix any issues found during testing**

Debug in browser DevTools. Common issues:
- WASM loading errors: check console for webpack/path issues
- Worker not initializing: check that `new Worker(new URL(...))` resolves correctly in Next.js
- Tessellation not rendering: verify mesh data is being transferred correctly (check Float32Array transfer)

- [ ] **Step 7: Commit any fixes**

```bash
git add -A
git commit -m "fix(cad): address issues found during integration testing"
```

---

## Summary

**Phase 1 delivers:**
- OCCT WASM running in a Web Worker with typed message API
- `/cad` route with full workspace layout (feature tree, viewport, properties, toolbars, status bar)
- R3F 3D viewport rendering OCCT-tessellated geometry
- Basic sketch mode (line, circle, rectangle on XY/XZ/YZ planes)
- Extrude operation (add/cut with blind depth)
- Feature tree data model with CRUD
- Parameter registry with expression evaluation
- Undo/redo history
- Native .svcp save/load (localStorage + file download/upload)
- Keyboard shortcuts (Ctrl+Z/Y/S, Escape, Delete)

**Phase 2 will add:** Constraint solver, all geometric/dimensional constraints, revolve/sweep/loft, fillet/chamfer/shell, booleans, sketch-on-face, DOF indicators.
