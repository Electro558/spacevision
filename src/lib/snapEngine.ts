import * as THREE from 'three'

export interface SnapResult {
  point: THREE.Vector3
  normal: THREE.Vector3
  faceIndex: number
  objectId: string
}

/**
 * Raycasts against the provided meshes to find the nearest face.
 * Returns the intersection point, face normal (in world space), face index, and object id.
 */
export function snapToFace(
  raycaster: THREE.Raycaster,
  meshes: THREE.Object3D[],
  objectIds: string[]
): SnapResult | null {
  const intersections = raycaster.intersectObjects(meshes, true)
  if (intersections.length === 0) return null

  const hit = intersections[0]
  if (!hit.face) return null

  // Find the matching object id from the hit object's ancestry
  let objectId = ''
  let current: THREE.Object3D | null = hit.object
  while (current) {
    if (current.userData?.objId) {
      objectId = current.userData.objId
      break
    }
    current = current.parent
  }

  // If we couldn't find an objectId from userData, try to match by mesh index
  if (!objectId && hit.object instanceof THREE.Mesh) {
    const idx = meshes.indexOf(hit.object)
    if (idx >= 0 && idx < objectIds.length) {
      objectId = objectIds[idx]
    }
  }

  // Transform face normal to world space
  const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld)
  const worldNormal = hit.face.normal.clone().applyMatrix3(normalMatrix).normalize()

  return {
    point: hit.point.clone(),
    normal: worldNormal,
    faceIndex: hit.faceIndex ?? -1,
    objectId,
  }
}

/**
 * Given a snap result, computes a position that places an object flush on the
 * snapped face, offset along the face normal by half the object's height.
 */
export function computeSnapPlacement(
  snap: SnapResult,
  objectHeight: number = 1
): [number, number, number] {
  const offset = snap.normal.clone().multiplyScalar(objectHeight / 2)
  const pos = snap.point.clone().add(offset)
  return [pos.x, pos.y, pos.z]
}

/**
 * Computes an Euler rotation (XYZ) that aligns an object's local up axis (+Y)
 * with the given face normal using quaternion math.
 */
export function computeSnapRotation(
  normal: THREE.Vector3
): [number, number, number] {
  const up = new THREE.Vector3(0, 1, 0)
  const quat = new THREE.Quaternion().setFromUnitVectors(up, normal.clone().normalize())
  const euler = new THREE.Euler().setFromQuaternion(quat, 'XYZ')
  return [euler.x, euler.y, euler.z]
}

/**
 * Rounds a single value to the nearest grid increment.
 */
export function snapToGrid(value: number, gridSize: number): number {
  if (gridSize <= 0) return value
  return Math.round(value / gridSize) * gridSize
}

/**
 * Snaps all 3 axes of a position to the nearest grid increment.
 */
export function snapPositionToGrid(
  position: [number, number, number],
  gridSize: number
): [number, number, number] {
  return [
    snapToGrid(position[0], gridSize),
    snapToGrid(position[1], gridSize),
    snapToGrid(position[2], gridSize),
  ]
}
