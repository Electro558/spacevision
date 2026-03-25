import * as THREE from "three";
import { STLExporter } from "three-stdlib";

/**
 * Build a temporary scene containing only user meshes (those with userData.objId),
 * rotated -90° on X to convert from Three.js Y-up to slicer-standard Z-up.
 */
function buildExportScene(scene: THREE.Scene): { exportScene: THREE.Scene; dispose: () => void } {
  const exportScene = new THREE.Scene();
  const wrapper = new THREE.Group();
  wrapper.rotation.x = -Math.PI / 2; // Y-up → Z-up
  const clones: THREE.Mesh[] = [];

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.userData?.objId) {
      const clone = child.clone();
      clone.geometry = child.geometry.clone();
      child.updateWorldMatrix(true, false);
      clone.applyMatrix4(child.matrixWorld);
      clone.position.set(0, 0, 0);
      clone.rotation.set(0, 0, 0);
      clone.scale.set(1, 1, 1);
      wrapper.add(clone);
      clones.push(clone);
    }
  });

  wrapper.updateMatrixWorld(true);
  exportScene.add(wrapper);

  return {
    exportScene,
    dispose: () => clones.forEach(c => { c.geometry.dispose(); }),
  };
}

function downloadBlob(data: DataView, filename: string) {
  const buffer = new ArrayBuffer(data.byteLength);
  new Uint8Array(buffer).set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength));
  const blob = new Blob([buffer], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToSTL(scene: THREE.Scene, filename = "model.stl") {
  const { exportScene, dispose } = buildExportScene(scene);
  const exporter = new STLExporter();
  const result = exporter.parse(exportScene, { binary: true }) as DataView;
  downloadBlob(result, filename);
  dispose();
}

export async function validateAndExportSTL(
  scene: THREE.Scene,
  filename = "model.stl"
): Promise<{ success: boolean; warnings: string[] }> {
  const warnings: string[] = [];
  const { exportScene, dispose } = buildExportScene(scene);

  try {
    const manifoldModule = await import(/* webpackIgnore: true */ "manifold-3d");
    const wasm = await (manifoldModule as any).default();
    const { Manifold, Mesh: ManifoldMesh } = wasm as any;

    exportScene.traverse((child) => {
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
          triVerts = new Uint32Array(posAttr.count);
          for (let i = 0; i < posAttr.count; i++) {
            triVerts[i] = i;
          }
        }

        const mMesh = new ManifoldMesh({ numProp: 3, vertProperties, triVerts });
        const manifold = new Manifold(mMesh);

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

  try {
    const exporter = new STLExporter();
    const result = exporter.parse(exportScene, { binary: true }) as DataView;
    downloadBlob(result, filename);
    dispose();
    return { success: true, warnings };
  } catch {
    dispose();
    warnings.push("STL export failed");
    return { success: false, warnings };
  }
}
