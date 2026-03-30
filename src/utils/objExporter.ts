"use client";

import * as THREE from "three";

/**
 * Export scene to OBJ format with MTL material file
 */
export function exportToOBJ(scene: THREE.Scene, filename: string = "model.obj"): void {
  const meshes: THREE.Mesh[] = [];
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.userData.objId) {
      meshes.push(child);
    }
  });

  if (meshes.length === 0) return;

  let objContent = "# SpaceVision OBJ Export\n";
  objContent += `mtllib ${filename.replace('.obj', '.mtl')}\n\n`;

  let mtlContent = "# SpaceVision MTL Export\n\n";
  let vertexOffset = 0;

  meshes.forEach((mesh, idx) => {
    const materialName = `material_${idx}`;
    const geometry = mesh.geometry.clone();
    geometry.applyMatrix4(mesh.matrixWorld);

    // Apply Y-up to Z-up rotation for 3D printing
    const rotMatrix = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
    geometry.applyMatrix4(rotMatrix);

    const positions = geometry.getAttribute('position');
    const normals = geometry.getAttribute('normal');
    const index = geometry.getIndex();

    objContent += `o ${mesh.userData.objId || `object_${idx}`}\n`;
    objContent += `usemtl ${materialName}\n`;

    // Vertices
    for (let i = 0; i < positions.count; i++) {
      objContent += `v ${positions.getX(i).toFixed(6)} ${positions.getY(i).toFixed(6)} ${positions.getZ(i).toFixed(6)}\n`;
    }

    // Normals
    if (normals) {
      for (let i = 0; i < normals.count; i++) {
        objContent += `vn ${normals.getX(i).toFixed(6)} ${normals.getY(i).toFixed(6)} ${normals.getZ(i).toFixed(6)}\n`;
      }
    }

    // Faces
    if (index) {
      for (let i = 0; i < index.count; i += 3) {
        const a = index.getX(i) + 1 + vertexOffset;
        const b = index.getX(i + 1) + 1 + vertexOffset;
        const c = index.getX(i + 2) + 1 + vertexOffset;
        objContent += normals
          ? `f ${a}//${a} ${b}//${b} ${c}//${c}\n`
          : `f ${a} ${b} ${c}\n`;
      }
    } else {
      for (let i = 0; i < positions.count; i += 3) {
        const a = i + 1 + vertexOffset;
        const b = i + 2 + vertexOffset;
        const c = i + 3 + vertexOffset;
        objContent += normals
          ? `f ${a}//${a} ${b}//${b} ${c}//${c}\n`
          : `f ${a} ${b} ${c}\n`;
      }
    }

    vertexOffset += positions.count;
    objContent += "\n";

    // Material
    const mat = mesh.material as THREE.MeshStandardMaterial;
    const color = mat.color || new THREE.Color(0.5, 0.5, 0.5);
    mtlContent += `newmtl ${materialName}\n`;
    mtlContent += `Kd ${color.r.toFixed(4)} ${color.g.toFixed(4)} ${color.b.toFixed(4)}\n`;
    mtlContent += `Ks 0.5 0.5 0.5\n`;
    mtlContent += `Ns ${((1 - (mat.roughness || 0.5)) * 100).toFixed(1)}\n`;
    mtlContent += `d ${(mat.opacity ?? 1).toFixed(2)}\n`;
    mtlContent += `illum 2\n\n`;

    geometry.dispose();
  });

  // Download OBJ
  const objBlob = new Blob([objContent], { type: 'text/plain' });
  const objUrl = URL.createObjectURL(objBlob);
  const objLink = document.createElement('a');
  objLink.href = objUrl;
  objLink.download = filename;
  objLink.click();
  URL.revokeObjectURL(objUrl);

  // Download MTL
  const mtlBlob = new Blob([mtlContent], { type: 'text/plain' });
  const mtlUrl = URL.createObjectURL(mtlBlob);
  const mtlLink = document.createElement('a');
  mtlLink.href = mtlUrl;
  mtlLink.download = filename.replace('.obj', '.mtl');
  mtlLink.click();
  URL.revokeObjectURL(mtlUrl);
}
