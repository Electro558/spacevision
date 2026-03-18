import * as THREE from 'three'
import type { SceneObject } from './cadStore'
import { buildGeometry } from './cadStore'

export interface DimensionLine {
  start: THREE.Vector3
  end: THREE.Vector3
  distance: number
  axis: 'x' | 'y' | 'z' | 'diagonal'
  label: string
}

/**
 * Compute world-space bounding box for a SceneObject,
 * taking into account its geometry, position, rotation, and scale.
 */
export function getWorldBounds(obj: SceneObject): THREE.Box3 {
  const geometry = buildGeometry(obj.type)
  const mesh = new THREE.Mesh(geometry)
  mesh.position.set(...obj.position)
  mesh.rotation.set(...obj.rotation)
  mesh.scale.set(...obj.scale)
  mesh.updateMatrixWorld(true)

  const box = new THREE.Box3().setFromObject(mesh)
  geometry.dispose()
  return box
}

/**
 * Compute dimension lines showing X/Y/Z distances between two objects' centers.
 * Lines are offset slightly so they don't overlap the objects.
 */
export function computeDimensionLines(objA: SceneObject, objB: SceneObject): DimensionLine[] {
  const lines: DimensionLine[] = []

  const boundsA = getWorldBounds(objA)
  const boundsB = getWorldBounds(objB)

  const centerA = new THREE.Vector3()
  const centerB = new THREE.Vector3()
  boundsA.getCenter(centerA)
  boundsB.getCenter(centerB)

  const sizeA = new THREE.Vector3()
  const sizeB = new THREE.Vector3()
  boundsA.getSize(sizeA)
  boundsB.getSize(sizeB)

  const maxExtent = Math.max(sizeA.y, sizeB.y) / 2

  const dx = Math.abs(centerB.x - centerA.x)
  const dy = Math.abs(centerB.y - centerA.y)
  const dz = Math.abs(centerB.z - centerA.z)

  const offset = maxExtent + 0.3

  // X distance line (runs along X, offset below in Y)
  if (dx > 0.001) {
    const y = Math.min(centerA.y, centerB.y) - offset
    const z = (centerA.z + centerB.z) / 2
    lines.push({
      start: new THREE.Vector3(centerA.x, y, z),
      end: new THREE.Vector3(centerB.x, y, z),
      distance: dx,
      axis: 'x',
      label: `X: ${dx.toFixed(2)}`,
    })
  }

  // Y distance line (runs along Y, offset to the side in X)
  if (dy > 0.001) {
    const x = Math.max(centerA.x, centerB.x) + offset
    const z = (centerA.z + centerB.z) / 2
    lines.push({
      start: new THREE.Vector3(x, centerA.y, z),
      end: new THREE.Vector3(x, centerB.y, z),
      distance: dy,
      axis: 'y',
      label: `Y: ${dy.toFixed(2)}`,
    })
  }

  // Z distance line (runs along Z, offset below in Y)
  if (dz > 0.001) {
    const y = Math.min(centerA.y, centerB.y) - offset
    const x = (centerA.x + centerB.x) / 2
    lines.push({
      start: new THREE.Vector3(x, y, centerA.z),
      end: new THREE.Vector3(x, y, centerB.z),
      distance: dz,
      axis: 'z',
      label: `Z: ${dz.toFixed(2)}`,
    })
  }

  return lines
}

/**
 * Compute the width (X), height (Y), and depth (Z) of a single object's bounding box.
 */
export function computeObjectDimensions(obj: SceneObject): { width: number; height: number; depth: number } {
  const bounds = getWorldBounds(obj)
  const size = new THREE.Vector3()
  bounds.getSize(size)
  return {
    width: size.x,
    height: size.y,
    depth: size.z,
  }
}
