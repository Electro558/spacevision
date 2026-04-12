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

export interface SketchSpline {
  id: string;
  type: "spline";
  controlPointIds: string[];
  closed?: boolean;
  construction?: boolean;
}

export type SketchEntity = SketchLine | SketchCircle | SketchArc | SketchRectangle | SketchSpline;

// ── Sketch Constraints — discriminated union ──

export interface HorizontalConstraint {
  id: string;
  type: "horizontal";
  refs: [string]; // [lineId]
}

export interface VerticalConstraint {
  id: string;
  type: "vertical";
  refs: [string]; // [lineId]
}

export interface CoincidentConstraint {
  id: string;
  type: "coincident";
  refs: [string, string]; // [pointId1, pointId2]
}

export interface PerpendicularConstraint {
  id: string;
  type: "perpendicular";
  refs: [string, string]; // [lineId1, lineId2]
}

export interface EqualConstraint {
  id: string;
  type: "equal";
  refs: [string, string]; // [entityId1, entityId2]
}

export interface FixedConstraint {
  id: string;
  type: "fixed";
  refs: [string]; // [pointId]
}

export interface ParallelConstraint {
  id: string;
  type: "parallel";
  refs: [string, string]; // [lineId1, lineId2]
}

export interface TangentConstraint {
  id: string;
  type: "tangent";
  refs: [string, string]; // [lineId, circleId]
}

export interface DistanceConstraint {
  id: string;
  type: "distance";
  refs: [string, string]; // [pointId1, pointId2]
  value: number;
}

export interface RadiusConstraint {
  id: string;
  type: "radius";
  refs: [string]; // [entityId]
  value: number;
}

export interface AngleConstraint {
  id: string;
  type: "angle";
  refs: [string, string]; // [lineId1, lineId2]
  value: number;
}

export type SketchConstraint =
  | HorizontalConstraint
  | VerticalConstraint
  | CoincidentConstraint
  | PerpendicularConstraint
  | EqualConstraint
  | FixedConstraint
  | ParallelConstraint
  | TangentConstraint
  | DistanceConstraint
  | RadiusConstraint
  | AngleConstraint;

export type SketchConstraintType = SketchConstraint["type"];

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
  draftAngle?: number; // degrees, for tapered extrusions
  thinExtrude?: { enabled: boolean; thickness: number }; // for thin-walled extrusions
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

export interface BooleanFeature {
  id: string;
  type: "boolean";
  name: string;
  suppressed: boolean;
  operation: "union" | "subtract" | "intersect";
  targetFeatureId: string; // first body
  toolFeatureId: string;   // second body
}

export interface HoleFeature {
  id: string;
  type: "hole";
  name: string;
  suppressed: boolean;
  holeType: "simple" | "counterbore" | "countersink";
  diameter: number | string;
  depth: number | string;
  position: { x: number; y: number }; // on sketch plane
  plane: "XY" | "XZ" | "YZ";
  // Counterbore specific
  counterboreDiameter?: number;
  counterboreDepth?: number;
  // Countersink specific
  countersinkDiameter?: number;
  countersinkAngle?: number; // degrees
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
  | MirrorBodyFeature
  | BooleanFeature
  | HoleFeature;

export interface Parameter {
  name: string;
  value: number;
  unit: string;
  expression: string | null;
}

export interface MaterialConfig {
  color: string;        // hex color like "#6366f1"
  metalness: number;    // 0-1
  roughness: number;    // 0-1
  opacity: number;      // 0-1
  preset: string;       // preset name or "Custom"
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
    material: MaterialConfig;
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

export type CadTool =
  | "select" | "line" | "circle" | "rectangle" | "arc" | "trim" | "mirror" | "offset"
  | "spline" | "sketch-fillet" | "sketch-chamfer"
  | "constraint-horizontal" | "constraint-vertical" | "constraint-perpendicular"
  | "constraint-parallel" | "constraint-equal" | "constraint-fixed";
export type ViewMode = "shaded" | "wireframe" | "xray" | "measure";

export interface MeasureResult {
  type: "distance" | "angle";
  value: number;
  unit: string;
  points: [{ x: number; y: number; z: number }, { x: number; y: number; z: number }];
}
export type ViewPreset = "iso" | "front" | "back" | "top" | "bottom" | "left" | "right";

export type ConstraintStatus = "fully-constrained" | "under-constrained" | "over-constrained";

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
  constraintStatus: ConstraintStatus;
  rollbackIndex: number; // -1 means no rollback (use all features)
}
