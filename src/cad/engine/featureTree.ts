// src/cad/engine/featureTree.ts

import type { Feature, SketchFeature, ExtrudeFeature, RevolveFeature, FilletFeature, ChamferFeature, LoftFeature, SweepFeature, ShellFeature, LinearPatternFeature, CircularPatternFeature, MirrorBodyFeature, Sketch, SketchPlane, SketchPoint, SketchEntity } from "./types";

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
 * Creates a revolve feature referencing a sketch.
 */
export function createRevolve(
  sketchId: string,
  angle: number = 360,
  axis: RevolveFeature["axis"] = "x"
): RevolveFeature {
  return {
    id: newFeatureId(),
    type: "revolve",
    name: `Revolve ${Date.now() % 1000}`,
    suppressed: false,
    sketchId,
    profiles: [],
    axis,
    angle,
    direction: "normal",
    operation: "add",
  };
}

/**
 * Creates a fillet feature that rounds edges.
 */
export function createFillet(radius: number = 2): FilletFeature {
  return {
    id: newFeatureId(),
    type: "fillet",
    name: `Fillet ${Date.now() % 1000}`,
    suppressed: false,
    edgeIds: ["all"],
    radius,
  };
}

/**
 * Creates a chamfer feature that bevels edges.
 */
export function createChamfer(distance: number = 1): ChamferFeature {
  return {
    id: newFeatureId(),
    type: "chamfer",
    name: `Chamfer ${Date.now() % 1000}`,
    suppressed: false,
    edgeIds: ["all"],
    distance,
  };
}

/**
 * Creates a loft feature blending between 2+ sketch profiles.
 */
export function createLoft(sketchIds: string[]): LoftFeature {
  return {
    id: newFeatureId(),
    type: "loft",
    name: `Loft ${Date.now() % 1000}`,
    suppressed: false,
    sketchIds,
    solid: true,
    operation: "add",
  };
}

/**
 * Creates a sweep feature that sweeps a profile along a path.
 */
export function createSweep(profileSketchId: string, pathSketchId: string): SweepFeature {
  return {
    id: newFeatureId(),
    type: "sweep",
    name: `Sweep ${Date.now() % 1000}`,
    suppressed: false,
    profileSketchId,
    pathSketchId,
    operation: "add",
  };
}

/**
 * Creates a shell feature that hollows a solid.
 */
export function createShell(thickness: number = 1): ShellFeature {
  return {
    id: newFeatureId(),
    type: "shell",
    name: `Shell ${Date.now() % 1000}`,
    suppressed: false,
    thickness,
    removeFaceIds: [],
  };
}

/**
 * Creates a linear pattern feature that repeats geometry along an axis.
 */
export function createLinearPattern(sourceFeatureId: string, direction: "x" | "y" | "z" = "x", count: number = 3, spacing: number = 10): LinearPatternFeature {
  return {
    id: newFeatureId(),
    type: "linearPattern",
    name: `Linear Pattern ${Date.now() % 1000}`,
    suppressed: false,
    sourceFeatureId,
    direction,
    count,
    spacing,
  };
}

/**
 * Creates a circular pattern feature that repeats geometry around an axis.
 */
export function createCircularPattern(sourceFeatureId: string, axis: "x" | "y" | "z" = "z", count: number = 6, angle: number = 360): CircularPatternFeature {
  return {
    id: newFeatureId(),
    type: "circularPattern",
    name: `Circular Pattern ${Date.now() % 1000}`,
    suppressed: false,
    sourceFeatureId,
    axis,
    count,
    angle,
  };
}

/**
 * Creates a mirror body feature that mirrors the entire solid across a plane.
 */
export function createMirrorBody(plane: "XY" | "XZ" | "YZ" = "XY"): MirrorBodyFeature {
  return {
    id: newFeatureId(),
    type: "mirrorBody",
    name: `Mirror ${Date.now() % 1000}`,
    suppressed: false,
    plane,
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
  // Remove features that referenced the deleted feature/sketch
  return remaining.filter((f) => {
    if (f.type === "extrude" && f.sketchId === featureId) return false;
    if (f.type === "revolve" && f.sketchId === featureId) return false;
    if (f.type === "sweep" && (f.profileSketchId === featureId || f.pathSketchId === featureId)) return false;
    if (f.type === "loft" && f.sketchIds.includes(featureId)) return false;
    if (f.type === "linearPattern" && f.sourceFeatureId === featureId) return false;
    if (f.type === "circularPattern" && f.sourceFeatureId === featureId) return false;
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
    f.id === featureId ? ({ ...f, ...updates } as Feature) : f
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
