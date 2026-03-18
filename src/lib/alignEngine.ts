/* ─── Align & Distribute Engine ─── */

import * as THREE from "three";
import type { SceneObject } from "./cadStore";
import { buildGeometry } from "./cadStore";

export type AlignAxis = "x" | "y" | "z";
export type AlignMode = "min" | "center" | "max";

/**
 * Compute world-space bounding box for a scene object,
 * applying its position, rotation, and scale transforms.
 */
export function getObjectBounds(obj: SceneObject): THREE.Box3 {
  const geometry = buildGeometry(obj.type);
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!.clone();

  const matrix = new THREE.Matrix4();
  matrix.compose(
    new THREE.Vector3(...obj.position),
    new THREE.Quaternion().setFromEuler(
      new THREE.Euler(...obj.rotation)
    ),
    new THREE.Vector3(...obj.scale)
  );
  box.applyMatrix4(matrix);
  geometry.dispose();

  return box;
}

const axisIndex: Record<AlignAxis, number> = { x: 0, y: 1, z: 2 };

/**
 * Align objects along a given axis using the specified mode.
 * - 'min': align all objects' minimum edge to the overall minimum
 * - 'center': align all objects' centers to the overall center
 * - 'max': align all objects' maximum edge to the overall maximum
 * Returns a new array of SceneObjects with updated positions.
 */
export function alignObjects(
  objects: SceneObject[],
  axis: AlignAxis,
  mode: AlignMode
): SceneObject[] {
  if (objects.length < 2) return objects;

  const idx = axisIndex[axis];
  const boundsArr = objects.map((obj) => getObjectBounds(obj));

  let target: number;

  if (mode === "min") {
    target = Math.min(...boundsArr.map((b) => b.min.getComponent(idx)));
  } else if (mode === "max") {
    target = Math.max(...boundsArr.map((b) => b.max.getComponent(idx)));
  } else {
    // center: average of all centers
    const centers = boundsArr.map((b) => {
      const center = new THREE.Vector3();
      b.getCenter(center);
      return center.getComponent(idx);
    });
    target = centers.reduce((a, b) => a + b, 0) / centers.length;
  }

  return objects.map((obj, i) => {
    const bounds = boundsArr[i];
    const pos = [...obj.position] as [number, number, number];

    if (mode === "min") {
      const objMin = bounds.min.getComponent(idx);
      pos[idx] += target - objMin;
    } else if (mode === "max") {
      const objMax = bounds.max.getComponent(idx);
      pos[idx] += target - objMax;
    } else {
      const center = new THREE.Vector3();
      bounds.getCenter(center);
      const objCenter = center.getComponent(idx);
      pos[idx] += target - objCenter;
    }

    return { ...obj, position: pos };
  });
}

/**
 * Evenly distribute 3+ objects along a given axis.
 * Sorts objects by their center position on that axis,
 * then spaces them with equal steps between first and last.
 * Returns a new array of SceneObjects with updated positions.
 */
export function distributeObjects(
  objects: SceneObject[],
  axis: AlignAxis
): SceneObject[] {
  if (objects.length < 3) return objects;

  const idx = axisIndex[axis];

  // Pair each object with its center on the axis
  const withCenter = objects.map((obj) => {
    const bounds = getObjectBounds(obj);
    const center = new THREE.Vector3();
    bounds.getCenter(center);
    return { obj, center: center.getComponent(idx) };
  });

  // Sort by center position
  withCenter.sort((a, b) => a.center - b.center);

  const first = withCenter[0].center;
  const last = withCenter[withCenter.length - 1].center;
  const step = (last - first) / (withCenter.length - 1);

  const updated = withCenter.map((item, i) => {
    const targetCenter = first + step * i;
    const offset = targetCenter - item.center;
    const pos = [...item.obj.position] as [number, number, number];
    pos[idx] += offset;
    return { ...item.obj, position: pos };
  });

  return updated;
}
