// src/cad/worker/occtOperations.ts

import type { Feature, SketchFeature, ExtrudeFeature, RevolveFeature, FilletFeature, ChamferFeature, LoftFeature, SweepFeature, ShellFeature, LinearPatternFeature, CircularPatternFeature, MirrorBodyFeature, BooleanFeature, HoleFeature, PrimitiveFeature, ThreadFeature, RibFeature, DomeFeature, Parameter } from "../engine/types";

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
    // Skip construction geometry — reference only, not solid geometry
    if (entity.construction) continue;

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
    } else if (entity.type === "arc") {
      const center = pointMap.get(entity.centerId);
      const start = pointMap.get(entity.startId);
      const end = pointMap.get(entity.endId);
      if (!center || !start || !end) continue;
      const r = resolveValue(entity.radius, parameters);

      // Compute a midpoint on the arc for GC_MakeArcOfCircle
      const startAngle = Math.atan2(start.y - center.y, start.x - center.x);
      const endAngle = Math.atan2(end.y - center.y, end.x - center.x);
      let sweep = endAngle - startAngle;
      while (sweep > Math.PI) sweep -= 2 * Math.PI;
      while (sweep < -Math.PI) sweep += 2 * Math.PI;
      const midAngle = startAngle + sweep / 2;
      const midX = center.x + Math.cos(midAngle) * r;
      const midY = center.y + Math.sin(midAngle) * r;

      const startPt = to3D(start.x, start.y);
      const midPt = to3D(midX, midY);
      const endPt = to3D(end.x, end.y);

      const arcCurve = new oc.GC_MakeArcOfCircle_1(startPt, midPt, endPt).Value();
      const arcEdge = new oc.BRepBuilderAPI_MakeEdge_8(
        new oc.Handle_Geom_Curve_2(arcCurve.get())
      ).Edge();
      const arcWire = new oc.BRepBuilderAPI_MakeWire_2(arcEdge).Wire();
      wires.push(arcWire);
    } else if (entity.type === "spline") {
      const pts = entity.controlPointIds
        .map(id => pointMap.get(id))
        .filter((p): p is { x: number; y: number } => !!p);
      if (pts.length < 2) continue;

      // Build wire from polyline segments through control points
      // (True B-spline would use Geom_BSplineCurve, but polyline approximation works)
      const wireMaker = new oc.BRepBuilderAPI_MakeWire_1();
      for (let i = 0; i < pts.length - 1; i++) {
        const p1 = to3D(pts[i].x, pts[i].y);
        const p2 = to3D(pts[i + 1].x, pts[i + 1].y);
        const edge = new oc.BRepBuilderAPI_MakeEdge_3(p1, p2).Edge();
        wireMaker.Add_1(edge);
      }
      if (entity.closed && pts.length >= 3) {
        const pLast = to3D(pts[pts.length - 1].x, pts[pts.length - 1].y);
        const pFirst = to3D(pts[0].x, pts[0].y);
        const closingEdge = new oc.BRepBuilderAPI_MakeEdge_3(pLast, pFirst).Edge();
        wireMaker.Add_1(closingEdge);
      }
      if (entity.closed) {
        wires.push(wireMaker.Wire());
      }
    } else if (entity.type === "polygon") {
      const center = pointMap.get(entity.centerId);
      if (!center) continue;
      const r = entity.radius;
      const sides = entity.sides;
      const wireMaker = new oc.BRepBuilderAPI_MakeWire_1();
      for (let i = 0; i < sides; i++) {
        const a1 = (2 * Math.PI * i) / sides;
        const a2 = (2 * Math.PI * (i + 1)) / sides;
        const p1 = to3D(center.x + Math.cos(a1) * r, center.y + Math.sin(a1) * r);
        const p2 = to3D(center.x + Math.cos(a2) * r, center.y + Math.sin(a2) * r);
        const edge = new oc.BRepBuilderAPI_MakeEdge_3(p1, p2).Edge();
        wireMaker.Add_1(edge);
      }
      wires.push(wireMaker.Wire());
    } else if (entity.type === "ellipse") {
      const center = pointMap.get(entity.centerId);
      if (!center) continue;
      // Approximate ellipse as polyline
      const wireMaker = new oc.BRepBuilderAPI_MakeWire_1();
      const segments = 64;
      for (let i = 0; i < segments; i++) {
        const a1 = (2 * Math.PI * i) / segments;
        const a2 = (2 * Math.PI * (i + 1)) / segments;
        const p1 = to3D(center.x + Math.cos(a1) * entity.radiusX, center.y + Math.sin(a1) * entity.radiusY);
        const p2 = to3D(center.x + Math.cos(a2) * entity.radiusX, center.y + Math.sin(a2) * entity.radiusY);
        const edge = new oc.BRepBuilderAPI_MakeEdge_3(p1, p2).Edge();
        wireMaker.Add_1(edge);
      }
      wires.push(wireMaker.Wire());
    } else if (entity.type === "slot") {
      const start = pointMap.get(entity.startId);
      const end = pointMap.get(entity.endId);
      if (!start || !end) continue;
      const hw = entity.width / 2;
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < 0.01) continue;
      const nx = -dy / len * hw;
      const ny = dx / len * hw;
      // Slot = rectangle with semicircles on ends
      const wireMaker = new oc.BRepBuilderAPI_MakeWire_1();
      // Top straight edge
      const p1 = to3D(start.x + nx, start.y + ny);
      const p2 = to3D(end.x + nx, end.y + ny);
      wireMaker.Add_1(new oc.BRepBuilderAPI_MakeEdge_3(p1, p2).Edge());
      // End semicircle
      const endCenter3D = to3D(end.x, end.y);
      const endAx2 = new oc.gp_Ax2_3(endCenter3D, planeNormal());
      const endCircle = new oc.GC_MakeCircle_2(endAx2, hw).Value();
      const endArcEdge = new oc.BRepBuilderAPI_MakeEdge_10(
        new oc.Handle_Geom_Curve_2(endCircle.get()),
        to3D(end.x + nx, end.y + ny),
        to3D(end.x - nx, end.y - ny)
      ).Edge();
      wireMaker.Add_1(endArcEdge);
      // Bottom straight edge
      const p3 = to3D(end.x - nx, end.y - ny);
      const p4 = to3D(start.x - nx, start.y - ny);
      wireMaker.Add_1(new oc.BRepBuilderAPI_MakeEdge_3(p3, p4).Edge());
      // Start semicircle
      const startCenter3D = to3D(start.x, start.y);
      const startAx2 = new oc.gp_Ax2_3(startCenter3D, planeNormal());
      const startCircle = new oc.GC_MakeCircle_2(startAx2, hw).Value();
      const startArcEdge = new oc.BRepBuilderAPI_MakeEdge_10(
        new oc.Handle_Geom_Curve_2(startCircle.get()),
        to3D(start.x - nx, start.y - ny),
        to3D(start.x + nx, start.y + ny)
      ).Edge();
      wireMaker.Add_1(startArcEdge);
      wires.push(wireMaker.Wire());
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

    // Apply draft angle if specified (tapered extrusion)
    if (extrude.draftAngle && extrude.draftAngle !== 0) {
      try {
        const draftAngleRad = (extrude.draftAngle * Math.PI) / 180;
        const draftMaker = new oc.BRepOffsetAPI_DraftAngle(extrudedShape);
        const draftDir = new oc.gp_Dir_4(dirX, dirY, dirZ);
        const explorer = new oc.TopExp_Explorer_2(
          extrudedShape,
          oc.TopAbs_ShapeEnum.TopAbs_FACE,
          oc.TopAbs_ShapeEnum.TopAbs_SHAPE
        );
        while (explorer.More()) {
          const draftFace = oc.TopoDS.Face_1(explorer.Current());
          try {
            draftMaker.Add(draftFace, draftDir, draftAngleRad, new oc.gp_Pln_1());
          } catch { /* skip faces that can't be drafted */ }
          explorer.Next();
        }
        draftMaker.Build(new oc.Message_ProgressRange_1());
        if (draftMaker.IsDone()) {
          extrudedShape = draftMaker.Shape();
        }
      } catch {
        // BRepOffsetAPI_DraftAngle may not be available in opencascade.js
        // Fall back to standard prism shape
      }
    }

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
 * Performs a revolve operation on sketch profiles around an axis.
 * Returns the resulting OCCT shape.
 */
export function performRevolve(
  oc: any,
  sketch: SketchFeature["sketch"],
  revolve: RevolveFeature,
  parameters: Record<string, Parameter>,
  currentShape: any | null
): any {
  const wires = buildSketchWires(oc, sketch, parameters);
  if (wires.length === 0) {
    throw new Error(`No closed profiles found in sketch for revolve "${revolve.name}"`);
  }

  const angleDeg = resolveValue(revolve.angle, parameters);
  const angleRad = (angleDeg * Math.PI) / 180;

  // Determine the revolution axis origin and direction
  const origin = new oc.gp_Pnt_3(0, 0, 0);
  let axisDir: any;

  switch (revolve.axis) {
    case "x":
      axisDir = new oc.gp_Dir_4(1, 0, 0);
      break;
    case "y":
      axisDir = new oc.gp_Dir_4(0, 1, 0);
      break;
    case "z":
      axisDir = new oc.gp_Dir_4(0, 0, 1);
      break;
    case "sketch-x":
      // Local X axis on the sketch plane
      switch (sketch.plane) {
        case "XY": axisDir = new oc.gp_Dir_4(1, 0, 0); break;
        case "XZ": axisDir = new oc.gp_Dir_4(1, 0, 0); break;
        case "YZ": axisDir = new oc.gp_Dir_4(0, 1, 0); break;
        default: axisDir = new oc.gp_Dir_4(1, 0, 0); break;
      }
      break;
    case "sketch-y":
      // Local Y axis on the sketch plane
      switch (sketch.plane) {
        case "XY": axisDir = new oc.gp_Dir_4(0, 1, 0); break;
        case "XZ": axisDir = new oc.gp_Dir_4(0, 0, 1); break;
        case "YZ": axisDir = new oc.gp_Dir_4(0, 0, 1); break;
        default: axisDir = new oc.gp_Dir_4(0, 1, 0); break;
      }
      break;
    default:
      axisDir = new oc.gp_Dir_4(1, 0, 0);
      break;
  }

  if (revolve.direction === "reverse") {
    axisDir = new oc.gp_Dir_4(
      -axisDir.X(),
      -axisDir.Y(),
      -axisDir.Z()
    );
  }

  const revolveAxis = new oc.gp_Ax1_2(origin, axisDir);

  let resultShape = currentShape;

  for (const wire of wires) {
    const face = new oc.BRepBuilderAPI_MakeFace_15(wire, true).Face();

    let revolveAngle = angleRad;
    if (revolve.direction === "symmetric") {
      revolveAngle = angleRad / 2;
    }

    const revolver = new oc.BRepPrimAPI_MakeRevol_1(face, revolveAxis, revolveAngle, true);
    revolver.Build(new oc.Message_ProgressRange_1());
    let revolvedShape = revolver.Shape();

    // For symmetric, also revolve in the opposite direction and fuse
    if (revolve.direction === "symmetric") {
      const reverseDir = new oc.gp_Dir_4(
        -axisDir.X(),
        -axisDir.Y(),
        -axisDir.Z()
      );
      const reverseAxis = new oc.gp_Ax1_2(origin, reverseDir);
      const reverseRevolver = new oc.BRepPrimAPI_MakeRevol_1(face, reverseAxis, revolveAngle, true);
      reverseRevolver.Build(new oc.Message_ProgressRange_1());
      const fuse = new oc.BRepAlgoAPI_Fuse_3(
        revolvedShape,
        reverseRevolver.Shape(),
        new oc.Message_ProgressRange_1()
      );
      fuse.Build(new oc.Message_ProgressRange_1());
      revolvedShape = fuse.Shape();
    }

    // Combine with existing shape
    if (resultShape && revolve.operation === "add") {
      const fuse = new oc.BRepAlgoAPI_Fuse_3(
        resultShape,
        revolvedShape,
        new oc.Message_ProgressRange_1()
      );
      fuse.Build(new oc.Message_ProgressRange_1());
      resultShape = fuse.Shape();
    } else if (resultShape && revolve.operation === "cut") {
      const cut = new oc.BRepAlgoAPI_Cut_3(
        resultShape,
        revolvedShape,
        new oc.Message_ProgressRange_1()
      );
      cut.Build(new oc.Message_ProgressRange_1());
      resultShape = cut.Shape();
    } else {
      resultShape = revolvedShape;
    }
  }

  return resultShape;
}

/**
 * Performs a fillet (edge rounding) on all or specific edges of the current shape.
 * Returns the modified OCCT shape.
 */
export function performFillet(
  oc: any,
  fillet: FilletFeature,
  parameters: Record<string, Parameter>,
  currentShape: any
): any {
  if (!currentShape) {
    throw new Error(`Fillet "${fillet.name}" requires an existing solid shape`);
  }

  const radius = resolveValue(fillet.radius, parameters);

  const filletMaker = new oc.BRepFilletAPI_MakeFillet_1(
    currentShape,
    oc.ChFi3d_FilletShape.ChFi3d_Rational
  );

  if (fillet.edgeIds.length === 1 && fillet.edgeIds[0] === "all") {
    // Add all edges
    const explorer = new oc.TopExp_Explorer_2(
      currentShape,
      oc.TopAbs_ShapeEnum.TopAbs_EDGE,
      oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );
    while (explorer.More()) {
      const edge = oc.TopoDS.Edge_1(explorer.Current());
      filletMaker.Add_2(radius, edge);
      explorer.Next();
    }
  } else {
    // Add specific edges by index
    const edges: any[] = [];
    const explorer = new oc.TopExp_Explorer_2(
      currentShape,
      oc.TopAbs_ShapeEnum.TopAbs_EDGE,
      oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );
    while (explorer.More()) {
      edges.push(oc.TopoDS.Edge_1(explorer.Current()));
      explorer.Next();
    }
    for (const edgeId of fillet.edgeIds) {
      const idx = parseInt(edgeId, 10);
      if (idx >= 0 && idx < edges.length) {
        filletMaker.Add_2(radius, edges[idx]);
      }
    }
  }

  filletMaker.Build(new oc.Message_ProgressRange_1());
  return filletMaker.Shape();
}

/**
 * Performs a chamfer (edge bevel) on all or specific edges of the current shape.
 * Returns the modified OCCT shape.
 */
export function performChamfer(
  oc: any,
  chamfer: ChamferFeature,
  parameters: Record<string, Parameter>,
  currentShape: any
): any {
  if (!currentShape) {
    throw new Error(`Chamfer "${chamfer.name}" requires an existing solid shape`);
  }

  const distance = resolveValue(chamfer.distance, parameters);

  const chamferMaker = new oc.BRepFilletAPI_MakeChamfer_1(currentShape);

  if (chamfer.edgeIds.length === 1 && chamfer.edgeIds[0] === "all") {
    // Add all edges
    const explorer = new oc.TopExp_Explorer_2(
      currentShape,
      oc.TopAbs_ShapeEnum.TopAbs_EDGE,
      oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );
    while (explorer.More()) {
      const edge = oc.TopoDS.Edge_1(explorer.Current());
      chamferMaker.Add_2(distance, edge);
      explorer.Next();
    }
  } else {
    // Add specific edges by index
    const edges: any[] = [];
    const explorer = new oc.TopExp_Explorer_2(
      currentShape,
      oc.TopAbs_ShapeEnum.TopAbs_EDGE,
      oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );
    while (explorer.More()) {
      edges.push(oc.TopoDS.Edge_1(explorer.Current()));
      explorer.Next();
    }
    for (const edgeId of chamfer.edgeIds) {
      const idx = parseInt(edgeId, 10);
      if (idx >= 0 && idx < edges.length) {
        chamferMaker.Add_2(distance, edges[idx]);
      }
    }
  }

  chamferMaker.Build(new oc.Message_ProgressRange_1());
  return chamferMaker.Shape();
}

/**
 * Performs a loft operation blending between 2+ sketch profiles.
 */
export function performLoft(
  oc: any,
  sketches: SketchFeature[],
  loft: LoftFeature,
  parameters: Record<string, Parameter>,
  currentShape: any | null
): any {
  if (sketches.length < 2) {
    throw new Error(`Loft "${loft.name}" requires at least 2 sketches`);
  }

  const loftBuilder = new oc.BRepOffsetAPI_ThruSections_1(loft.solid, false, 1e-6);

  for (const sketchFeature of sketches) {
    const wires = buildSketchWires(oc, sketchFeature.sketch, parameters);
    if (wires.length === 0) {
      throw new Error(`Loft sketch "${sketchFeature.name}" has no closed profiles`);
    }
    loftBuilder.AddWire(wires[0]);
  }

  loftBuilder.Build(new oc.Message_ProgressRange_1());
  let loftShape = loftBuilder.Shape();

  if (currentShape && loft.operation === "add") {
    const fuse = new oc.BRepAlgoAPI_Fuse_3(currentShape, loftShape, new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    return fuse.Shape();
  } else if (currentShape && loft.operation === "cut") {
    const cut = new oc.BRepAlgoAPI_Cut_3(currentShape, loftShape, new oc.Message_ProgressRange_1());
    cut.Build(new oc.Message_ProgressRange_1());
    return cut.Shape();
  }
  return loftShape;
}

/**
 * Performs a sweep operation — sweeps a profile along a path.
 */
export function performSweep(
  oc: any,
  profileSketch: SketchFeature,
  pathSketch: SketchFeature,
  sweep: SweepFeature,
  parameters: Record<string, Parameter>,
  currentShape: any | null
): any {
  const profileWires = buildSketchWires(oc, profileSketch.sketch, parameters);
  if (profileWires.length === 0) {
    throw new Error(`Sweep profile sketch "${profileSketch.name}" has no closed profiles`);
  }

  const pathWires = buildSketchWires(oc, pathSketch.sketch, parameters);
  if (pathWires.length === 0) {
    throw new Error(`Sweep path sketch "${pathSketch.name}" has no path curves`);
  }

  const profile = profileWires[0];
  const path = pathWires[0];

  const pipe = new oc.BRepOffsetAPI_MakePipe_1(path, new oc.BRepBuilderAPI_MakeFace_15(profile, true).Face());
  pipe.Build(new oc.Message_ProgressRange_1());
  let sweepShape = pipe.Shape();

  if (currentShape && sweep.operation === "add") {
    const fuse = new oc.BRepAlgoAPI_Fuse_3(currentShape, sweepShape, new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    return fuse.Shape();
  } else if (currentShape && sweep.operation === "cut") {
    const cut = new oc.BRepAlgoAPI_Cut_3(currentShape, sweepShape, new oc.Message_ProgressRange_1());
    cut.Build(new oc.Message_ProgressRange_1());
    return cut.Shape();
  }
  return sweepShape;
}

/**
 * Performs a shell operation — hollows out a solid by removing a face and offsetting.
 */
export function performShell(
  oc: any,
  shell: ShellFeature,
  parameters: Record<string, Parameter>,
  currentShape: any
): any {
  if (!currentShape) {
    throw new Error(`Shell "${shell.name}" requires an existing solid shape`);
  }

  const thickness = resolveValue(shell.thickness, parameters);

  // Get all faces, remove the top face (largest Z normal) as default
  const facesToRemove = new oc.TopTools_ListOfShape_1();

  if (shell.removeFaceIds.length === 0) {
    // Auto-detect: remove the face with highest centroid Z
    let bestFace: any = null;
    let bestZ = -Infinity;
    const explorer = new oc.TopExp_Explorer_2(
      currentShape,
      oc.TopAbs_ShapeEnum.TopAbs_FACE,
      oc.TopAbs_ShapeEnum.TopAbs_SHAPE
    );
    while (explorer.More()) {
      const face = oc.TopoDS.Face_1(explorer.Current());
      const props = new oc.GProp_GProps_1();
      oc.BRepGProp.SurfaceProperties_1(face, props, 1e-6, false);
      const centroid = props.CentreOfMass();
      const z = centroid.Z();
      if (z > bestZ) {
        bestZ = z;
        bestFace = face;
      }
      explorer.Next();
    }
    if (bestFace) {
      facesToRemove.Append_1(bestFace);
    }
  }

  const shellMaker = new oc.BRepOffsetAPI_MakeThickSolid();
  shellMaker.MakeThickSolidByJoin(
    currentShape,
    facesToRemove,
    -thickness, // negative = inward offset
    1e-3,
    oc.BRepOffset_Mode.BRepOffset_Skin,
    false,
    false,
    oc.GeomAbs_JoinType.GeomAbs_Arc,
    false,
    new oc.Message_ProgressRange_1()
  );
  shellMaker.Build(new oc.Message_ProgressRange_1());
  return shellMaker.Shape();
}

/**
 * Performs a linear pattern — repeats the shape along an axis.
 */
export function performLinearPattern(
  oc: any,
  pattern: LinearPatternFeature,
  parameters: Record<string, Parameter>,
  currentShape: any
): any {
  if (!currentShape) {
    throw new Error(`Linear Pattern "${pattern.name}" requires an existing solid shape`);
  }

  const spacing = resolveValue(pattern.spacing, parameters);
  let resultShape = currentShape;

  let dx = 0, dy = 0, dz = 0;
  switch (pattern.direction) {
    case "x": dx = spacing; break;
    case "y": dy = spacing; break;
    case "z": dz = spacing; break;
  }

  for (let i = 1; i < pattern.count; i++) {
    const trsf = new oc.gp_Trsf_1();
    trsf.SetTranslation_1(new oc.gp_Vec_4(dx * i, dy * i, dz * i));
    const transform = new oc.BRepBuilderAPI_Transform_2(currentShape, trsf, true);
    transform.Build(new oc.Message_ProgressRange_1());
    const copy = transform.Shape();

    const fuse = new oc.BRepAlgoAPI_Fuse_3(resultShape, copy, new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    resultShape = fuse.Shape();
  }

  return resultShape;
}

/**
 * Performs a circular pattern — repeats the shape around an axis.
 */
export function performCircularPattern(
  oc: any,
  pattern: CircularPatternFeature,
  parameters: Record<string, Parameter>,
  currentShape: any
): any {
  if (!currentShape) {
    throw new Error(`Circular Pattern "${pattern.name}" requires an existing solid shape`);
  }

  const totalAngle = resolveValue(pattern.angle, parameters);
  const angleStep = (totalAngle / pattern.count) * Math.PI / 180;

  let axisDir: any;
  switch (pattern.axis) {
    case "x": axisDir = new oc.gp_Dir_4(1, 0, 0); break;
    case "y": axisDir = new oc.gp_Dir_4(0, 1, 0); break;
    case "z": axisDir = new oc.gp_Dir_4(0, 0, 1); break;
  }
  const origin = new oc.gp_Pnt_3(0, 0, 0);
  const axis = new oc.gp_Ax1_2(origin, axisDir);

  let resultShape = currentShape;

  for (let i = 1; i < pattern.count; i++) {
    const trsf = new oc.gp_Trsf_1();
    trsf.SetRotation_1(axis, angleStep * i);
    const transform = new oc.BRepBuilderAPI_Transform_2(currentShape, trsf, true);
    transform.Build(new oc.Message_ProgressRange_1());
    const copy = transform.Shape();

    const fuse = new oc.BRepAlgoAPI_Fuse_3(resultShape, copy, new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    resultShape = fuse.Shape();
  }

  return resultShape;
}

/**
 * Mirrors the entire body across a plane and fuses with the original.
 */
export function performMirrorBody(
  oc: any,
  mirror: MirrorBodyFeature,
  currentShape: any
): any {
  if (!currentShape) {
    throw new Error(`Mirror Body "${mirror.name}" requires an existing solid shape`);
  }

  const trsf = new oc.gp_Trsf_1();
  let mirrorAxis: any;
  const origin = new oc.gp_Pnt_3(0, 0, 0);

  switch (mirror.plane) {
    case "XY":
      mirrorAxis = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(0, 0, 1));
      break;
    case "XZ":
      mirrorAxis = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(0, 1, 0));
      break;
    case "YZ":
      mirrorAxis = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(1, 0, 0));
      break;
  }

  trsf.SetMirror_3(mirrorAxis);
  const transform = new oc.BRepBuilderAPI_Transform_2(currentShape, trsf, true);
  transform.Build(new oc.Message_ProgressRange_1());
  const mirroredShape = transform.Shape();

  const fuse = new oc.BRepAlgoAPI_Fuse_3(currentShape, mirroredShape, new oc.Message_ProgressRange_1());
  fuse.Build(new oc.Message_ProgressRange_1());
  return fuse.Shape();
}

/**
 * Performs a hole operation — cuts a hole (simple, counterbore, or countersink) from the current shape.
 */
export function performHole(
  oc: any,
  hole: HoleFeature,
  parameters: Record<string, Parameter>,
  currentShape: any
): any {
  if (!currentShape) {
    throw new Error(`Hole "${hole.name}" requires an existing solid shape`);
  }

  const diameter = resolveValue(hole.diameter, parameters);
  const depth = resolveValue(hole.depth, parameters);
  const radius = diameter / 2;

  // Create position on the plane
  let cx: number, cy: number, cz: number;
  let dirX = 0, dirY = 0, dirZ = 0;

  switch (hole.plane) {
    case "XY":
      cx = hole.position.x; cy = hole.position.y; cz = 100; // start from above
      dirZ = -1;
      break;
    case "XZ":
      cx = hole.position.x; cy = 100; cz = hole.position.y;
      dirY = -1;
      break;
    case "YZ":
      cx = 100; cy = hole.position.x; cz = hole.position.y;
      dirX = -1;
      break;
  }

  const center = new oc.gp_Pnt_3(cx, cy, cz);
  const dir = new oc.gp_Dir_4(dirX, dirY, dirZ);
  const axis = new oc.gp_Ax2_3(center, dir);

  // Create cylinder for the hole
  const cylinder = new oc.BRepPrimAPI_MakeCylinder_3(axis, radius, depth + 200);
  cylinder.Build(new oc.Message_ProgressRange_1());
  let holeShape = cylinder.Shape();

  // For counterbore: add a larger cylinder on top
  if (hole.holeType === "counterbore" && hole.counterboreDiameter && hole.counterboreDepth) {
    const cbRadius = hole.counterboreDiameter / 2;
    const cbCylinder = new oc.BRepPrimAPI_MakeCylinder_3(axis, cbRadius, hole.counterboreDepth + 200);
    cbCylinder.Build(new oc.Message_ProgressRange_1());
    const fuse = new oc.BRepAlgoAPI_Fuse_3(holeShape, cbCylinder.Shape(), new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    holeShape = fuse.Shape();
  }

  // For countersink: add a cone-approximation on top
  if (hole.holeType === "countersink" && hole.countersinkDiameter && hole.countersinkAngle) {
    const csRadius = hole.countersinkDiameter / 2;
    const csAngleRad = ((hole.countersinkAngle / 2) * Math.PI) / 180;
    const csDepth = (csRadius - radius) / Math.tan(csAngleRad);
    // Create a larger cylinder for the countersink area
    const csCylinder = new oc.BRepPrimAPI_MakeCylinder_3(axis, csRadius, csDepth + 200);
    csCylinder.Build(new oc.Message_ProgressRange_1());
    const fuse = new oc.BRepAlgoAPI_Fuse_3(holeShape, csCylinder.Shape(), new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    holeShape = fuse.Shape();
  }

  // Cut the hole from the current shape
  const cut = new oc.BRepAlgoAPI_Cut_3(currentShape, holeShape, new oc.Message_ProgressRange_1());
  cut.Build(new oc.Message_ProgressRange_1());
  return cut.Shape();
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

    if (feature.type === "revolve") {
      const sketch = sketchMap.get(feature.sketchId);
      if (!sketch) {
        throw new Error(
          `Revolve "${feature.name}" references missing sketch "${feature.sketchId}"`
        );
      }
      currentShape = performRevolve(
        oc,
        sketch.sketch,
        feature,
        parameters,
        currentShape
      );
    }

    if (feature.type === "fillet") {
      currentShape = performFillet(oc, feature, parameters, currentShape);
    }

    if (feature.type === "chamfer") {
      currentShape = performChamfer(oc, feature, parameters, currentShape);
    }

    if (feature.type === "loft") {
      const sketches = feature.sketchIds
        .map(id => sketchMap.get(id))
        .filter((s): s is SketchFeature => !!s);
      currentShape = performLoft(oc, sketches, feature, parameters, currentShape);
    }

    if (feature.type === "sweep") {
      const profileSketch = sketchMap.get(feature.profileSketchId);
      const pathSketch = sketchMap.get(feature.pathSketchId);
      if (!profileSketch || !pathSketch) {
        throw new Error(`Sweep "${feature.name}" references missing sketches`);
      }
      currentShape = performSweep(oc, profileSketch, pathSketch, feature, parameters, currentShape);
    }

    if (feature.type === "shell") {
      currentShape = performShell(oc, feature, parameters, currentShape);
    }

    if (feature.type === "linearPattern") {
      currentShape = performLinearPattern(oc, feature, parameters, currentShape);
    }

    if (feature.type === "circularPattern") {
      currentShape = performCircularPattern(oc, feature, parameters, currentShape);
    }

    if (feature.type === "mirrorBody") {
      currentShape = performMirrorBody(oc, feature, currentShape);
    }

    if (feature.type === "boolean") {
      // In single-body mode, boolean doesn't make sense without multi-body.
      // For now, this is a placeholder for when multi-body is added.
      // Skip gracefully.
    }

    if (feature.type === "hole") {
      currentShape = performHole(oc, feature, parameters, currentShape);
    }

    if (feature.type === "primitive") {
      currentShape = performPrimitive(oc, feature, parameters, currentShape);
    }

    if (feature.type === "thread") {
      currentShape = performThread(oc, feature, parameters, currentShape);
    }

    if (feature.type === "rib") {
      const sketch = sketchMap.get(feature.sketchId);
      if (sketch) {
        currentShape = performRib(oc, sketch.sketch, feature, parameters, currentShape);
      }
    }

    if (feature.type === "dome") {
      currentShape = performDome(oc, feature, parameters, currentShape);
    }
  }

  return currentShape;
}

// ── Primitive Solids ──

function performPrimitive(
  oc: any,
  feature: PrimitiveFeature,
  parameters: Record<string, Parameter>,
  currentShape: any | null
): any {
  const pos = feature.position;
  let shape: any;

  switch (feature.primitiveType) {
    case "box": {
      const w = feature.width ?? 20;
      const h = feature.height ?? 20;
      const l = feature.length ?? 20;
      const origin = new oc.gp_Pnt_3(pos.x - w/2, pos.y - h/2, pos.z - l/2);
      const ax2 = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(0, 0, 1));
      const maker = new oc.BRepPrimAPI_MakeBox_3(ax2, w, h, l);
      maker.Build(new oc.Message_ProgressRange_1());
      shape = maker.Shape();
      break;
    }
    case "cylinder": {
      const r = feature.radius ?? 10;
      const d = feature.depth ?? 20;
      const origin = new oc.gp_Pnt_3(pos.x, pos.y, pos.z);
      const ax2 = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(0, 0, 1));
      const maker = new oc.BRepPrimAPI_MakeCylinder_3(ax2, r, d);
      maker.Build(new oc.Message_ProgressRange_1());
      shape = maker.Shape();
      break;
    }
    case "sphere": {
      const r = feature.radius ?? 10;
      const origin = new oc.gp_Pnt_3(pos.x, pos.y, pos.z);
      const maker = new oc.BRepPrimAPI_MakeSphere_3(origin, r);
      maker.Build(new oc.Message_ProgressRange_1());
      shape = maker.Shape();
      break;
    }
    case "cone": {
      const r1 = feature.radius ?? 10;
      const r2 = feature.radius2 ?? 0;
      const d = feature.depth ?? 20;
      const origin = new oc.gp_Pnt_3(pos.x, pos.y, pos.z);
      const ax2 = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(0, 0, 1));
      const maker = new oc.BRepPrimAPI_MakeCone_3(ax2, r1, Math.max(r2, 0.001), d);
      maker.Build(new oc.Message_ProgressRange_1());
      shape = maker.Shape();
      break;
    }
    case "torus": {
      const r1 = feature.radius ?? 15;
      const r2 = feature.radius2 ?? 5;
      const origin = new oc.gp_Pnt_3(pos.x, pos.y, pos.z);
      const ax2 = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(0, 0, 1));
      const maker = new oc.BRepPrimAPI_MakeTorus_3(ax2, r1, r2);
      maker.Build(new oc.Message_ProgressRange_1());
      shape = maker.Shape();
      break;
    }
    case "wedge": {
      const w = feature.width ?? 20;
      const h = feature.height ?? 20;
      const l = feature.length ?? 20;
      const ltx = feature.ltx ?? 10;
      const origin = new oc.gp_Pnt_3(pos.x, pos.y, pos.z);
      const ax2 = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(0, 0, 1));
      const maker = new oc.BRepPrimAPI_MakeWedge_3(ax2, w, h, l, ltx);
      maker.Build(new oc.Message_ProgressRange_1());
      shape = maker.Shape();
      break;
    }
    case "pipe": {
      // Pipe = outer cylinder - inner cylinder
      const r1 = feature.radius ?? 10;
      const r2 = feature.radius2 ?? 8;
      const d = feature.depth ?? 20;
      const origin = new oc.gp_Pnt_3(pos.x, pos.y, pos.z);
      const ax2 = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(0, 0, 1));
      const outer = new oc.BRepPrimAPI_MakeCylinder_3(ax2, r1, d);
      outer.Build(new oc.Message_ProgressRange_1());
      const inner = new oc.BRepPrimAPI_MakeCylinder_3(ax2, Math.min(r2, r1 - 0.1), d);
      inner.Build(new oc.Message_ProgressRange_1());
      const cut = new oc.BRepAlgoAPI_Cut_3(outer.Shape(), inner.Shape(), new oc.Message_ProgressRange_1());
      cut.Build(new oc.Message_ProgressRange_1());
      shape = cut.Shape();
      break;
    }
  }

  if (!currentShape) return shape;

  if (feature.operation === "cut") {
    const cut = new oc.BRepAlgoAPI_Cut_3(currentShape, shape, new oc.Message_ProgressRange_1());
    cut.Build(new oc.Message_ProgressRange_1());
    return cut.Shape();
  } else {
    const fuse = new oc.BRepAlgoAPI_Fuse_3(currentShape, shape, new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    return fuse.Shape();
  }
}

// ── Thread (cosmetic — rendered as helical cut for visual representation) ──

function performThread(
  oc: any,
  feature: ThreadFeature,
  _parameters: Record<string, Parameter>,
  currentShape: any | null
): any {
  // Thread is cosmetic: create a cylinder at the thread location
  // A proper thread would use a helical sweep, but that's expensive.
  // For visual representation, we create a cylinder with slightly reduced radius for external
  // or a hole for internal threads.
  const pos = feature.position;
  const r = feature.diameter / 2;
  const len = feature.length;

  let dirX = 0, dirY = 0, dirZ = 0;
  switch (feature.axis) {
    case "x": dirX = 1; break;
    case "y": dirY = 1; break;
    case "z": dirZ = 1; break;
  }

  const origin = new oc.gp_Pnt_3(pos.x, pos.y, pos.z);
  const ax2 = new oc.gp_Ax2_3(origin, new oc.gp_Dir_4(dirX, dirY, dirZ));

  if (feature.internal) {
    // Internal thread = cut a cylinder
    const cyl = new oc.BRepPrimAPI_MakeCylinder_3(ax2, r, len);
    cyl.Build(new oc.Message_ProgressRange_1());
    if (!currentShape) return currentShape;
    const cut = new oc.BRepAlgoAPI_Cut_3(currentShape, cyl.Shape(), new oc.Message_ProgressRange_1());
    cut.Build(new oc.Message_ProgressRange_1());
    return cut.Shape();
  } else {
    // External thread = add a cylinder
    const cyl = new oc.BRepPrimAPI_MakeCylinder_3(ax2, r, len);
    cyl.Build(new oc.Message_ProgressRange_1());
    if (!currentShape) return cyl.Shape();
    const fuse = new oc.BRepAlgoAPI_Fuse_3(currentShape, cyl.Shape(), new oc.Message_ProgressRange_1());
    fuse.Build(new oc.Message_ProgressRange_1());
    return fuse.Shape();
  }
}

// ── Rib (thin extrusion from a sketch profile) ──

function performRib(
  oc: any,
  sketch: SketchFeature["sketch"],
  feature: RibFeature,
  parameters: Record<string, Parameter>,
  currentShape: any | null
): any {
  const thickness = resolveValue(feature.thickness, parameters);
  const wires = buildSketchWires(oc, sketch, parameters);
  if (wires.length === 0) return currentShape;

  const wire = wires[0];
  const face = new oc.BRepBuilderAPI_MakeFace_15(wire, true);
  face.Build(new oc.Message_ProgressRange_1());

  let dirVec: any;
  switch (sketch.plane) {
    case "XY": dirVec = new oc.gp_Vec_4(0, 0, feature.direction === "reverse" ? -thickness : thickness); break;
    case "XZ": dirVec = new oc.gp_Vec_4(0, feature.direction === "reverse" ? -thickness : thickness, 0); break;
    case "YZ": dirVec = new oc.gp_Vec_4(feature.direction === "reverse" ? -thickness : thickness, 0, 0); break;
  }

  const prism = new oc.BRepPrimAPI_MakePrism_1(face.Face(), dirVec, false, true);
  prism.Build(new oc.Message_ProgressRange_1());
  const ribShape = prism.Shape();

  if (!currentShape) return ribShape;
  const fuse = new oc.BRepAlgoAPI_Fuse_3(currentShape, ribShape, new oc.Message_ProgressRange_1());
  fuse.Build(new oc.Message_ProgressRange_1());
  return fuse.Shape();
}

// ── Dome (hemisphere added to top face) ──

function performDome(
  oc: any,
  feature: DomeFeature,
  _parameters: Record<string, Parameter>,
  currentShape: any | null
): any {
  if (!currentShape) return currentShape;

  // Create a hemisphere on top of the current shape
  const h = feature.height;
  const origin = new oc.gp_Pnt_3(0, 0, 0);
  // Create a sphere and cut it in half
  const sphere = new oc.BRepPrimAPI_MakeSphere_3(origin, h * 2);
  sphere.Build(new oc.Message_ProgressRange_1());
  // Cut the bottom half
  const boxOrigin = new oc.gp_Pnt_3(-h * 3, -h * 3, -h * 6);
  const ax2 = new oc.gp_Ax2_3(boxOrigin, new oc.gp_Dir_4(0, 0, 1));
  const cutter = new oc.BRepPrimAPI_MakeBox_3(ax2, h * 6, h * 6, h * 6);
  cutter.Build(new oc.Message_ProgressRange_1());
  const half = new oc.BRepAlgoAPI_Cut_3(sphere.Shape(), cutter.Shape(), new oc.Message_ProgressRange_1());
  half.Build(new oc.Message_ProgressRange_1());

  const fuse = new oc.BRepAlgoAPI_Fuse_3(currentShape, half.Shape(), new oc.Message_ProgressRange_1());
  fuse.Build(new oc.Message_ProgressRange_1());
  return fuse.Shape();
}
