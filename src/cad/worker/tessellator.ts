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
