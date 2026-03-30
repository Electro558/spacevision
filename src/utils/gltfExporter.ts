"use client";

import * as THREE from "three";
import { GLTFExporter } from "three-stdlib";

/**
 * Export scene to GLB (binary GLTF) format
 */
export async function exportToGLTF(scene: THREE.Scene, filename: string = "model.glb"): Promise<void> {
  // Build export scene with only user meshes
  const exportScene = new THREE.Scene();

  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.userData.objId) {
      const clone = child.clone();
      // Apply world transforms
      clone.applyMatrix4(child.matrixWorld);
      clone.position.set(0, 0, 0);
      clone.rotation.set(0, 0, 0);
      clone.scale.set(1, 1, 1);

      // Apply Y-up to Z-up rotation
      const rotGroup = new THREE.Group();
      rotGroup.rotation.x = -Math.PI / 2;
      rotGroup.add(clone);
      exportScene.add(rotGroup);
    }
  });

  if (exportScene.children.length === 0) return;

  const exporter = new GLTFExporter();

  return new Promise((resolve, reject) => {
    exporter.parse(
      exportScene,
      (result) => {
        let blob: Blob;

        if (result instanceof ArrayBuffer) {
          // GLB binary
          blob = new Blob([result], { type: 'application/octet-stream' });
        } else {
          // GLTF JSON
          const output = JSON.stringify(result, null, 2);
          blob = new Blob([output], { type: 'application/json' });
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);

        // Cleanup
        exportScene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.geometry?.dispose();
          }
        });

        resolve();
      },
      (error) => reject(error),
      { binary: filename.endsWith('.glb') }
    );
  });
}
