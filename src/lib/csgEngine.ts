/* ─── CSG Engine ─── */

import * as THREE from 'three'
import { ADDITION, SUBTRACTION, INTERSECTION, Evaluator, Brush } from 'three-bvh-csg'
import { buildGeometry, type SceneObject } from './cadStore'

const evaluator = new Evaluator()

/**
 * Convert a SceneObject into a three-bvh-csg Brush,
 * applying position, rotation, and scale as a baked matrix.
 */
export function objectToBrush(obj: SceneObject): Brush {
  const geometry = buildGeometry(obj.type)
  const brush = new Brush(geometry)

  // Apply the object's transform to the brush
  brush.position.set(...obj.position)
  brush.rotation.set(...obj.rotation)
  brush.scale.set(...obj.scale)
  brush.updateMatrixWorld(true)

  return brush
}

/**
 * Perform a single CSG operation on two brushes.
 */
export function performCSG(
  brushA: Brush,
  brushB: Brush,
  operation: 'union' | 'subtract' | 'intersect'
): Brush {
  const opMap = {
    union: ADDITION,
    subtract: SUBTRACTION,
    intersect: INTERSECTION,
  }
  return evaluator.evaluate(brushA, brushB, opMap[operation])
}

/**
 * Perform CSG across multiple SceneObjects.
 *
 * mode='tinkercad': union all non-holes, then subtract all holes
 * mode='explicit': apply the given operation sequentially left-to-right
 */
export function performGroupCSG(
  objects: SceneObject[],
  mode: 'tinkercad' | 'explicit',
  explicitOp?: 'union' | 'subtract' | 'intersect'
): THREE.BufferGeometry | null {
  if (objects.length === 0) return null

  try {
    if (mode === 'tinkercad') {
      const solids = objects.filter(o => !o.isHole)
      const holes = objects.filter(o => o.isHole)

      if (solids.length === 0) return null

      // Union all solids
      let resultBrush = objectToBrush(solids[0])
      for (let i = 1; i < solids.length; i++) {
        const nextBrush = objectToBrush(solids[i])
        resultBrush = evaluator.evaluate(resultBrush, nextBrush, ADDITION)
      }

      // Subtract all holes
      for (const hole of holes) {
        const holeBrush = objectToBrush(hole)
        resultBrush = evaluator.evaluate(resultBrush, holeBrush, SUBTRACTION)
      }

      return resultBrush.geometry
    } else {
      // Explicit mode
      const op = explicitOp || 'union'
      const opConst = op === 'union' ? ADDITION : op === 'subtract' ? SUBTRACTION : INTERSECTION

      if (objects.length < 2) {
        return objectToBrush(objects[0]).geometry
      }

      let resultBrush = objectToBrush(objects[0])
      for (let i = 1; i < objects.length; i++) {
        const nextBrush = objectToBrush(objects[i])
        resultBrush = evaluator.evaluate(resultBrush, nextBrush, opConst)
      }

      return resultBrush.geometry
    }
  } catch (e) {
    console.error('CSG operation failed:', e)
    return null
  }
}

/**
 * Create a preview mesh from CSG result.
 * Uses the first non-hole object's material properties.
 */
export function createCSGPreviewMesh(
  objects: SceneObject[],
  mode: 'tinkercad' | 'explicit',
  explicitOp?: 'union' | 'subtract' | 'intersect'
): THREE.Mesh | null {
  const geometry = performGroupCSG(objects, mode, explicitOp)
  if (!geometry) return null

  // Use the primary (first non-hole) object's appearance
  const primary = objects.find(o => !o.isHole) || objects[0]
  const material = new THREE.MeshStandardMaterial({
    color: primary.color,
    metalness: primary.metalness,
    roughness: primary.roughness,
    flatShading: true,
  })

  return new THREE.Mesh(geometry, material)
}
