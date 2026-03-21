import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';
import { OBJLoader } from 'three-stdlib';
import { GLTFLoader } from 'three-stdlib';

export type SupportedFormat = 'stl' | 'obj' | 'gltf' | 'glb';

export function detectFormat(filename: string): SupportedFormat | null {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'stl': return 'stl';
    case 'obj': return 'obj';
    case 'gltf': return 'gltf';
    case 'glb': return 'glb';
    default: return null;
  }
}

export async function loadFile(file: File): Promise<{ geometry: THREE.BufferGeometry; name: string }> {
  const format = detectFormat(file.name);
  if (!format) throw new Error(`Unsupported file format: ${file.name}`);

  const arrayBuffer = await file.arrayBuffer();
  const name = file.name.replace(/\.[^/.]+$/, ''); // Remove extension

  switch (format) {
    case 'stl': {
      const loader = new STLLoader();
      const geometry = loader.parse(arrayBuffer);
      centerAndScaleGeometry(geometry);
      return { geometry, name };
    }
    case 'obj': {
      const loader = new OBJLoader();
      const text = new TextDecoder().decode(arrayBuffer);
      const group = loader.parse(text);
      const geometry = extractGeometry(group);
      centerAndScaleGeometry(geometry);
      return { geometry, name };
    }
    case 'gltf':
    case 'glb': {
      const loader = new GLTFLoader();
      return new Promise((resolve, reject) => {
        loader.parse(arrayBuffer, '', (gltf) => {
          const geometry = extractGeometry(gltf.scene);
          centerAndScaleGeometry(geometry);
          resolve({ geometry, name });
        }, reject);
      });
    }
  }
}

function extractGeometry(object: THREE.Object3D): THREE.BufferGeometry {
  const geometries: THREE.BufferGeometry[] = [];

  object.traverse((child) => {
    if (child instanceof THREE.Mesh && child.geometry) {
      const geo = child.geometry.clone();
      // Apply the mesh's world transform to the geometry
      child.updateWorldMatrix(true, false);
      geo.applyMatrix4(child.matrixWorld);
      geometries.push(geo);
    }
  });

  if (geometries.length === 0) {
    throw new Error('No mesh data found in file');
  }

  if (geometries.length === 1) {
    return geometries[0];
  }

  // Merge all geometries into one
  return mergeGeometries(geometries);
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  // Simple merge: concatenate position attributes
  const positions: number[] = [];
  const normals: number[] = [];

  for (const geo of geometries) {
    const pos = geo.getAttribute('position');
    const norm = geo.getAttribute('normal');

    if (geo.index) {
      // Indexed geometry - expand
      const idx = geo.index;
      for (let i = 0; i < idx.count; i++) {
        const vi = idx.getX(i);
        positions.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
        if (norm) normals.push(norm.getX(vi), norm.getY(vi), norm.getZ(vi));
      }
    } else {
      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
        if (norm) normals.push(norm.getX(i), norm.getY(i), norm.getZ(i));
      }
    }
  }

  const merged = new THREE.BufferGeometry();
  merged.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (normals.length > 0) {
    merged.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  } else {
    merged.computeVertexNormals();
  }

  return merged;
}

function centerAndScaleGeometry(geometry: THREE.BufferGeometry): void {
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const center = new THREE.Vector3();
  const size = new THREE.Vector3();
  box.getCenter(center);
  box.getSize(size);

  // Center the geometry
  geometry.translate(-center.x, -center.y, -center.z);

  // Scale to fit within a 2x2x2 bounding box
  const maxDim = Math.max(size.x, size.y, size.z);
  if (maxDim > 0) {
    const scale = 2 / maxDim;
    geometry.scale(scale, scale, scale);
  }

  // Shift up so bottom sits at y=0
  geometry.computeBoundingBox();
  const newBox = geometry.boundingBox!;
  geometry.translate(0, -newBox.min.y, 0);

  geometry.computeVertexNormals();
}
