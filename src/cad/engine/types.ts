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

export type SketchEntity = SketchLine | SketchCircle | SketchArc | SketchRectangle;

export interface SketchConstraint {
  id: string;
  type: string;
  refs: string[];
  value?: number | string;
}

export type SketchPlane = "XY" | "XZ" | "YZ";

export interface Sketch {
  id: string;
  name: string;
  plane: SketchPlane;
  points: SketchPoint[];
  entities: SketchEntity[];
  constraints: SketchConstraint[];
}

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
  sketchId: string;
  profiles: string[];
  depth: number | string;
  direction: "normal" | "reverse" | "symmetric";
  operation: "add" | "cut";
}

export interface RevolveFeature {
  id: string;
  type: "revolve";
  name: string;
  suppressed: boolean;
  sketchId: string;
  profiles: string[];
  axis: "x" | "y" | "z" | "sketch-x" | "sketch-y";
  angle: number | string; // degrees, can be param ref
  direction: "normal" | "reverse" | "symmetric";
  operation: "add" | "cut";
}

export interface FilletFeature {
  id: string;
  type: "fillet";
  name: string;
  suppressed: boolean;
  edgeIds: string[]; // "all" for all edges, or specific edge indices
  radius: number | string; // can be param ref
}

export interface ChamferFeature {
  id: string;
  type: "chamfer";
  name: string;
  suppressed: boolean;
  edgeIds: string[];
  distance: number | string; // can be param ref
}

export interface LoftFeature {
  id: string;
  type: "loft";
  name: string;
  suppressed: boolean;
  sketchIds: string[];
  solid: boolean;
  operation: "add" | "cut";
}

export interface SweepFeature {
  id: string;
  type: "sweep";
  name: string;
  suppressed: boolean;
  profileSketchId: string;
  pathSketchId: string;
  operation: "add" | "cut";
}

export interface ShellFeature {
  id: string;
  type: "shell";
  name: string;
  suppressed: boolean;
  thickness: number | string;
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
  angle: number | string;
}

export interface MirrorBodyFeature {
  id: string;
  type: "mirrorBody";
  name: string;
  suppressed: boolean;
  plane: "XY" | "XZ" | "YZ";
}

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

export interface Parameter {
  name: string;
  value: number;
  unit: string;
  expression: string | null;
}

export interface CadProject {
  version: string;
  name: string;
  units: string;
  parameters: Record<string, Parameter>;
  features: Feature[];
  metadata: {
    created: string;
    modified: string;
    author: string;
    material: string;
  };
}

export interface WorkerRequest {
  id: string;
  type: "init" | "rebuild" | "extrude" | "tessellate" | "export";
  payload: unknown;
}

export interface ExportPayload {
  format: "step" | "stl";
  features: Feature[];
  parameters: Record<string, Parameter>;
}

export interface ExportResultPayload {
  data: ArrayBuffer;
  filename: string;
}

export interface InitPayload {}

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
  id: string;
  type: "ready" | "progress" | "result" | "error";
  payload: unknown;
}

export interface ReadyPayload {
  version: string;
}

export interface ProgressPayload {
  percent: number;
  message: string;
}

export interface RebuildResultPayload {
  meshes: TessellationResult[];
}

export interface ErrorPayload {
  message: string;
  featureId?: string;
}

export type CadTool = "select" | "line" | "circle" | "rectangle" | "arc" | "trim" | "mirror" | "offset";
export type ViewMode = "shaded" | "wireframe" | "xray" | "measure";

export interface MeasureResult {
  type: "distance" | "angle";
  value: number;
  unit: string;
  points: [{ x: number; y: number; z: number }, { x: number; y: number; z: number }];
}
export type ViewPreset = "iso" | "front" | "back" | "top" | "bottom" | "left" | "right";

export interface CadUIState {
  activeTool: CadTool;
  viewMode: ViewMode;
  selectedFeatureId: string | null;
  sketchModeActive: boolean;
  activeSketchId: string | null;
  gridVisible: boolean;
  snapEnabled: boolean;
  snapValue: number;
  units: string;
}
