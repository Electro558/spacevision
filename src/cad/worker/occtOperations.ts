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
