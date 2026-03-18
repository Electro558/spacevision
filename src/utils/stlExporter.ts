import * as THREE from "three";
import { STLExporter } from "three-stdlib";

export function exportToSTL(scene: THREE.Scene, filename = "model.stl") {
  const exporter = new STLExporter();
  const result = exporter.parse(scene, { binary: true }) as DataView;
  const buffer = new ArrayBuffer(result.byteLength);
  new Uint8Array(buffer).set(new Uint8Array(result.buffer, result.byteOffset, result.byteLength));
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function validateAndExportSTL(
  scene: THREE.Scene,
  filename = "model.stl"
): Promise<{ success: boolean; warnings: string[] }> {
  const warnings: string[] = [];

  try {
    // Lazy-load manifold-3d to avoid loading WASM on page load
    // Use webpackIgnore to prevent webpack from bundling the WASM module statically
    const manifoldModule = await import(/* webpackIgnore: true */ "manifold-3d");
    const wasm = await (manifoldModule as any).default();
    const { Manifold, Mesh: ManifoldMesh } = wasm as any;

    // Traverse scene meshes and validate
    scene.traverse((child) => {
      if (!(child instanceof THREE.Mesh)) return;
      if (!child.geometry) return;

      const name = child.userData?.objId || child.name || "unnamed mesh";

      try {
        const geo = child.geometry as THREE.BufferGeometry;
        const posAttr = geo.getAttribute("position");
        if (!posAttr) {
          warnings.push(`${name}: no position attribute, skipping validation`);
          return;
        }

        // Build vertex and triangle arrays for Manifold
        const vertProperties = new Float32Array(posAttr.count * 3);
        for (let i = 0; i < posAttr.count; i++) {
          vertProperties[i * 3] = posAttr.getX(i);
          vertProperties[i * 3 + 1] = posAttr.getY(i);
          vertProperties[i * 3 + 2] = posAttr.getZ(i);
        }

        let triVerts: Uint32Array;
        if (geo.index) {
          triVerts = new Uint32Array(geo.index.array);
        } else {
          // Non-indexed geometry: sequential indices
          triVerts = new Uint32Array(posAttr.count);
          for (let i = 0; i < posAttr.count; i++) {
            triVerts[i] = i;
          }
        }

        // Attempt to create a Manifold from the mesh
        const mMesh = new ManifoldMesh({
          numProp: 3,
          vertProperties,
          triVerts,
        });
        const manifold = new Manifold(mMesh);

        // If we get here, it's valid. Check genus as extra info.
        const genus = manifold.genus();
        if (genus !== 0) {
          warnings.push(`${name}: non-zero genus (${genus}), mesh has holes or handles`);
        }

        manifold.delete();
        mMesh.delete();
      } catch {
        warnings.push(`${name}: non-manifold geometry (may cause issues with 3D printing)`);
      }
    });
  } catch {
    warnings.push("Manifold validation unavailable: could not load manifold-3d WASM module");
  }

  // Export regardless of validation results
  try {
    exportToSTL(scene, filename);
    return { success: true, warnings };
  } catch {
    warnings.push("STL export failed");
    return { success: false, warnings };
  }
}
