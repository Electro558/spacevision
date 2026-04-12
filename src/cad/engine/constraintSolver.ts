// src/cad/engine/constraintSolver.ts

import type {
  SketchPoint,
  SketchEntity,
  SketchConstraint,
  ConstraintStatus,
} from "./types";

/**
 * Result from the constraint solver — updated points and overall status.
 */
export interface SolverResult {
  points: SketchPoint[];
  status: ConstraintStatus;
  /** Per-constraint satisfaction: true = satisfied within tolerance */
  satisfied: Record<string, boolean>;
}

const MAX_ITERATIONS = 50;
const TOLERANCE = 0.01;
const RELAXATION_FACTOR = 0.5;

/**
 * Build a fast point-lookup map.
 */
function buildPointMap(points: SketchPoint[]): Map<string, { x: number; y: number }> {
  const map = new Map<string, { x: number; y: number }>();
  for (const p of points) map.set(p.id, { x: p.x, y: p.y });
  return map;
}

/**
 * Build a fast entity-lookup map.
 */
function buildEntityMap(entities: SketchEntity[]): Map<string, SketchEntity> {
  const map = new Map<string, SketchEntity>();
  for (const e of entities) map.set(e.id, e);
  return map;
}

/**
 * Iterative relaxation constraint solver.
 *
 * Runs up to MAX_ITERATIONS passes, adjusting point positions to satisfy
 * each constraint in turn. Simple but effective for typical sketch sizes.
 */
export function solveConstraints(
  inputPoints: SketchPoint[],
  entities: SketchEntity[],
  constraints: SketchConstraint[]
): SolverResult {
  if (constraints.length === 0) {
    return {
      points: inputPoints,
      status: "under-constrained",
      satisfied: {},
    };
  }

  // Deep copy points so we can mutate
  const pts = inputPoints.map((p) => ({ ...p }));
  const ptMap = buildPointMap(pts);
  const entityMap = buildEntityMap(entities);

  // Track which point ids are fixed (locked)
  const fixedPoints = new Set<string>();
  for (const c of constraints) {
    if (c.type === "fixed") fixedPoints.add(c.refs[0]);
  }

  const satisfied: Record<string, boolean> = {};

  for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
    let maxError = 0;

    for (const constraint of constraints) {
      const err = applyConstraint(constraint, ptMap, entityMap, fixedPoints, RELAXATION_FACTOR);
      if (err > maxError) maxError = err;
    }

    if (maxError < TOLERANCE) break;
  }

  // Check final satisfaction
  for (const constraint of constraints) {
    const err = measureError(constraint, ptMap, entityMap);
    satisfied[constraint.id] = err < TOLERANCE;
  }

  // Write mutated positions back into point objects
  const resultPoints = pts.map((p) => {
    const updated = ptMap.get(p.id);
    return updated ? { ...p, x: updated.x, y: updated.y } : p;
  });

  // Determine overall status
  const allSatisfied = Object.values(satisfied).every(Boolean);
  const anySatisfied = Object.values(satisfied).some(Boolean);

  // Count degrees of freedom heuristic:
  // 2 DOF per point, minus constraints that remove DOF
  const totalDOF = inputPoints.length * 2;
  let removedDOF = 0;
  for (const c of constraints) {
    switch (c.type) {
      case "horizontal":
      case "vertical":
        removedDOF += 1;
        break;
      case "fixed":
        removedDOF += 2;
        break;
      case "coincident":
        removedDOF += 2;
        break;
      case "distance":
      case "radius":
      case "angle":
        removedDOF += 1;
        break;
      case "perpendicular":
      case "parallel":
      case "tangent":
      case "equal":
        removedDOF += 1;
        break;
    }
  }

  let status: ConstraintStatus;
  if (!allSatisfied && removedDOF > totalDOF) {
    status = "over-constrained";
  } else if (allSatisfied && removedDOF >= totalDOF) {
    status = "fully-constrained";
  } else {
    status = "under-constrained";
  }

  return { points: resultPoints, status, satisfied };
}

/**
 * Apply a single constraint, returning the error magnitude.
 */
function applyConstraint(
  c: SketchConstraint,
  ptMap: Map<string, { x: number; y: number }>,
  entityMap: Map<string, SketchEntity>,
  fixedPoints: Set<string>,
  alpha: number
): number {
  switch (c.type) {
    case "horizontal": {
      const entity = entityMap.get(c.refs[0]);
      if (!entity || entity.type !== "line") return 0;
      const s = ptMap.get(entity.startId);
      const e = ptMap.get(entity.endId);
      if (!s || !e) return 0;
      const err = Math.abs(e.y - s.y);
      if (err < TOLERANCE) return err;
      const mid = (s.y + e.y) / 2;
      if (!fixedPoints.has(entity.startId)) s.y += (mid - s.y) * alpha;
      if (!fixedPoints.has(entity.endId)) e.y += (mid - e.y) * alpha;
      return err;
    }

    case "vertical": {
      const entity = entityMap.get(c.refs[0]);
      if (!entity || entity.type !== "line") return 0;
      const s = ptMap.get(entity.startId);
      const e = ptMap.get(entity.endId);
      if (!s || !e) return 0;
      const err = Math.abs(e.x - s.x);
      if (err < TOLERANCE) return err;
      const mid = (s.x + e.x) / 2;
      if (!fixedPoints.has(entity.startId)) s.x += (mid - s.x) * alpha;
      if (!fixedPoints.has(entity.endId)) e.x += (mid - e.x) * alpha;
      return err;
    }

    case "coincident": {
      const p1 = ptMap.get(c.refs[0]);
      const p2 = ptMap.get(c.refs[1]);
      if (!p1 || !p2) return 0;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const err = Math.sqrt(dx * dx + dy * dy);
      if (err < TOLERANCE) return err;
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      if (!fixedPoints.has(c.refs[0])) {
        p1.x += (midX - p1.x) * alpha;
        p1.y += (midY - p1.y) * alpha;
      }
      if (!fixedPoints.has(c.refs[1])) {
        p2.x += (midX - p2.x) * alpha;
        p2.y += (midY - p2.y) * alpha;
      }
      return err;
    }

    case "fixed": {
      // Fixed points don't move — nothing to apply
      return 0;
    }

    case "perpendicular": {
      const e1 = entityMap.get(c.refs[0]);
      const e2 = entityMap.get(c.refs[1]);
      if (!e1 || !e2 || e1.type !== "line" || e2.type !== "line") return 0;
      const s1 = ptMap.get(e1.startId);
      const end1 = ptMap.get(e1.endId);
      const s2 = ptMap.get(e2.startId);
      const end2 = ptMap.get(e2.endId);
      if (!s1 || !end1 || !s2 || !end2) return 0;

      const dx1 = end1.x - s1.x;
      const dy1 = end1.y - s1.y;
      const dx2 = end2.x - s2.x;
      const dy2 = end2.y - s2.y;
      const dot = dx1 * dx2 + dy1 * dy2;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (len1 < TOLERANCE || len2 < TOLERANCE) return 0;
      const err = Math.abs(dot) / (len1 * len2);
      if (err < TOLERANCE) return err;

      // Rotate line2's end point to make it perpendicular to line1
      const targetAngle = Math.atan2(dy1, dx1) + Math.PI / 2;
      const targetDx = Math.cos(targetAngle) * len2;
      const targetDy = Math.sin(targetAngle) * len2;
      if (!fixedPoints.has(e2.endId)) {
        end2.x += (s2.x + targetDx - end2.x) * alpha * 0.3;
        end2.y += (s2.y + targetDy - end2.y) * alpha * 0.3;
      }
      return err;
    }

    case "parallel": {
      const e1 = entityMap.get(c.refs[0]);
      const e2 = entityMap.get(c.refs[1]);
      if (!e1 || !e2 || e1.type !== "line" || e2.type !== "line") return 0;
      const s1 = ptMap.get(e1.startId);
      const end1 = ptMap.get(e1.endId);
      const s2 = ptMap.get(e2.startId);
      const end2 = ptMap.get(e2.endId);
      if (!s1 || !end1 || !s2 || !end2) return 0;

      const dx1 = end1.x - s1.x;
      const dy1 = end1.y - s1.y;
      const dx2 = end2.x - s2.x;
      const dy2 = end2.y - s2.y;
      const cross = dx1 * dy2 - dy1 * dx2;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (len1 < TOLERANCE || len2 < TOLERANCE) return 0;
      const err = Math.abs(cross) / (len1 * len2);
      if (err < TOLERANCE) return err;

      // Rotate line2 to match line1's direction
      const angle1 = Math.atan2(dy1, dx1);
      const targetDx = Math.cos(angle1) * len2;
      const targetDy = Math.sin(angle1) * len2;
      // Pick the closer of the two parallel orientations
      const altDx = -targetDx;
      const altDy = -targetDy;
      const d1 = (s2.x + targetDx - end2.x) ** 2 + (s2.y + targetDy - end2.y) ** 2;
      const d2 = (s2.x + altDx - end2.x) ** 2 + (s2.y + altDy - end2.y) ** 2;
      const useDx = d1 < d2 ? targetDx : altDx;
      const useDy = d1 < d2 ? targetDy : altDy;

      if (!fixedPoints.has(e2.endId)) {
        end2.x += (s2.x + useDx - end2.x) * alpha * 0.3;
        end2.y += (s2.y + useDy - end2.y) * alpha * 0.3;
      }
      return err;
    }

    case "equal": {
      const e1 = entityMap.get(c.refs[0]);
      const e2 = entityMap.get(c.refs[1]);
      if (!e1 || !e2) return 0;

      const len1 = getEntityLength(e1, ptMap);
      const len2 = getEntityLength(e2, ptMap);
      if (len1 === null || len2 === null) return 0;

      const err = Math.abs(len1 - len2);
      if (err < TOLERANCE) return err;

      // Scale line2 to match line1's length
      if (e2.type === "line") {
        const s = ptMap.get(e2.startId);
        const e = ptMap.get(e2.endId);
        if (!s || !e) return err;
        const dx = e.x - s.x;
        const dy = e.y - s.y;
        const curLen = Math.sqrt(dx * dx + dy * dy);
        if (curLen < TOLERANCE) return err;
        const scale = len1 / curLen;
        if (!fixedPoints.has(e2.endId)) {
          e.x += (s.x + dx * scale - e.x) * alpha * 0.3;
          e.y += (s.y + dy * scale - e.y) * alpha * 0.3;
        }
      }
      return err;
    }

    case "tangent": {
      // Simplified: push the closest point of the line toward the circle edge
      const lineEntity = entityMap.get(c.refs[0]);
      const circEntity = entityMap.get(c.refs[1]);
      if (!lineEntity || !circEntity) return 0;
      if (lineEntity.type !== "line") return 0;
      if (circEntity.type !== "circle" && circEntity.type !== "arc") return 0;

      const ls = ptMap.get(lineEntity.startId);
      const le = ptMap.get(lineEntity.endId);
      const cc = ptMap.get(circEntity.centerId);
      if (!ls || !le || !cc) return 0;

      const r = typeof circEntity.radius === "number" ? circEntity.radius : 5;

      // Distance from center to line
      const dx = le.x - ls.x;
      const dy = le.y - ls.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < TOLERANCE) return 0;
      const nx = -dy / len;
      const ny = dx / len;
      const dist = (cc.x - ls.x) * nx + (cc.y - ls.y) * ny;
      const err = Math.abs(Math.abs(dist) - r);
      if (err < TOLERANCE) return err;

      // Move line perpendicular to itself to be tangent
      const sign = dist >= 0 ? 1 : -1;
      const targetDist = sign * r;
      const correction = (targetDist - dist) * alpha * 0.3;
      if (!fixedPoints.has(lineEntity.startId)) {
        ls.x += nx * correction;
        ls.y += ny * correction;
      }
      if (!fixedPoints.has(lineEntity.endId)) {
        le.x += nx * correction;
        le.y += ny * correction;
      }
      return err;
    }

    case "distance": {
      const p1 = ptMap.get(c.refs[0]);
      const p2 = ptMap.get(c.refs[1]);
      if (!p1 || !p2) return 0;
      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;
      const curDist = Math.sqrt(dx * dx + dy * dy);
      const target = c.value;
      const err = Math.abs(curDist - target);
      if (err < TOLERANCE) return err;
      if (curDist < TOLERANCE) return err;

      const scale = target / curDist;
      const midX = (p1.x + p2.x) / 2;
      const midY = (p1.y + p2.y) / 2;
      if (!fixedPoints.has(c.refs[0])) {
        p1.x += (midX - dx * scale / 2 - p1.x) * alpha;
        p1.y += (midY - dy * scale / 2 - p1.y) * alpha;
      }
      if (!fixedPoints.has(c.refs[1])) {
        p2.x += (midX + dx * scale / 2 - p2.x) * alpha;
        p2.y += (midY + dy * scale / 2 - p2.y) * alpha;
      }
      return err;
    }

    case "radius": {
      const entity = entityMap.get(c.refs[0]);
      if (!entity) return 0;
      if (entity.type !== "circle" && entity.type !== "arc") return 0;
      // Radius constraints are dimensional — we don't move points,
      // we note the error. The entity's radius field should match.
      const curR = typeof entity.radius === "number" ? entity.radius : 5;
      return Math.abs(curR - c.value);
    }

    case "angle": {
      const e1 = entityMap.get(c.refs[0]);
      const e2 = entityMap.get(c.refs[1]);
      if (!e1 || !e2 || e1.type !== "line" || e2.type !== "line") return 0;
      const s1 = ptMap.get(e1.startId);
      const end1 = ptMap.get(e1.endId);
      const s2 = ptMap.get(e2.startId);
      const end2 = ptMap.get(e2.endId);
      if (!s1 || !end1 || !s2 || !end2) return 0;

      const dx1 = end1.x - s1.x;
      const dy1 = end1.y - s1.y;
      const dx2 = end2.x - s2.x;
      const dy2 = end2.y - s2.y;
      const angle1 = Math.atan2(dy1, dx1);
      const angle2 = Math.atan2(dy2, dx2);
      let curAngle = Math.abs(angle2 - angle1) * (180 / Math.PI);
      if (curAngle > 180) curAngle = 360 - curAngle;
      const err = Math.abs(curAngle - c.value);
      if (err < TOLERANCE) return err;

      // Rotate line2 to achieve the target angle
      const targetRad = (c.value * Math.PI) / 180;
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      const newAngle = angle1 + targetRad;
      if (!fixedPoints.has(e2.endId)) {
        end2.x += (s2.x + Math.cos(newAngle) * len2 - end2.x) * alpha * 0.3;
        end2.y += (s2.y + Math.sin(newAngle) * len2 - end2.y) * alpha * 0.3;
      }
      return err;
    }
  }
}

/**
 * Measure the current error for a constraint without modifying points.
 */
function measureError(
  c: SketchConstraint,
  ptMap: Map<string, { x: number; y: number }>,
  entityMap: Map<string, SketchEntity>
): number {
  switch (c.type) {
    case "horizontal": {
      const entity = entityMap.get(c.refs[0]);
      if (!entity || entity.type !== "line") return 0;
      const s = ptMap.get(entity.startId);
      const e = ptMap.get(entity.endId);
      if (!s || !e) return 0;
      return Math.abs(e.y - s.y);
    }
    case "vertical": {
      const entity = entityMap.get(c.refs[0]);
      if (!entity || entity.type !== "line") return 0;
      const s = ptMap.get(entity.startId);
      const e = ptMap.get(entity.endId);
      if (!s || !e) return 0;
      return Math.abs(e.x - s.x);
    }
    case "coincident": {
      const p1 = ptMap.get(c.refs[0]);
      const p2 = ptMap.get(c.refs[1]);
      if (!p1 || !p2) return 0;
      return Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    }
    case "fixed":
      return 0;
    case "perpendicular": {
      const e1 = entityMap.get(c.refs[0]);
      const e2 = entityMap.get(c.refs[1]);
      if (!e1 || !e2 || e1.type !== "line" || e2.type !== "line") return 0;
      const s1 = ptMap.get(e1.startId);
      const end1 = ptMap.get(e1.endId);
      const s2 = ptMap.get(e2.startId);
      const end2 = ptMap.get(e2.endId);
      if (!s1 || !end1 || !s2 || !end2) return 0;
      const dx1 = end1.x - s1.x, dy1 = end1.y - s1.y;
      const dx2 = end2.x - s2.x, dy2 = end2.y - s2.y;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (len1 < TOLERANCE || len2 < TOLERANCE) return 0;
      return Math.abs(dx1 * dx2 + dy1 * dy2) / (len1 * len2);
    }
    case "parallel": {
      const e1 = entityMap.get(c.refs[0]);
      const e2 = entityMap.get(c.refs[1]);
      if (!e1 || !e2 || e1.type !== "line" || e2.type !== "line") return 0;
      const s1 = ptMap.get(e1.startId);
      const end1 = ptMap.get(e1.endId);
      const s2 = ptMap.get(e2.startId);
      const end2 = ptMap.get(e2.endId);
      if (!s1 || !end1 || !s2 || !end2) return 0;
      const dx1 = end1.x - s1.x, dy1 = end1.y - s1.y;
      const dx2 = end2.x - s2.x, dy2 = end2.y - s2.y;
      const len1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const len2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);
      if (len1 < TOLERANCE || len2 < TOLERANCE) return 0;
      return Math.abs(dx1 * dy2 - dy1 * dx2) / (len1 * len2);
    }
    case "equal": {
      const e1 = entityMap.get(c.refs[0]);
      const e2 = entityMap.get(c.refs[1]);
      if (!e1 || !e2) return 0;
      const l1 = getEntityLength(e1, ptMap);
      const l2 = getEntityLength(e2, ptMap);
      if (l1 === null || l2 === null) return 0;
      return Math.abs(l1 - l2);
    }
    case "tangent": {
      const lineEntity = entityMap.get(c.refs[0]);
      const circEntity = entityMap.get(c.refs[1]);
      if (!lineEntity || !circEntity || lineEntity.type !== "line") return 0;
      if (circEntity.type !== "circle" && circEntity.type !== "arc") return 0;
      const ls = ptMap.get(lineEntity.startId);
      const le = ptMap.get(lineEntity.endId);
      const cc = ptMap.get(circEntity.centerId);
      if (!ls || !le || !cc) return 0;
      const r = typeof circEntity.radius === "number" ? circEntity.radius : 5;
      const dx = le.x - ls.x, dy = le.y - ls.y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len < TOLERANCE) return 0;
      const nx = -dy / len, ny = dx / len;
      const dist = (cc.x - ls.x) * nx + (cc.y - ls.y) * ny;
      return Math.abs(Math.abs(dist) - r);
    }
    case "distance": {
      const p1 = ptMap.get(c.refs[0]);
      const p2 = ptMap.get(c.refs[1]);
      if (!p1 || !p2) return 0;
      const d = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
      return Math.abs(d - c.value);
    }
    case "radius": {
      const entity = entityMap.get(c.refs[0]);
      if (!entity) return 0;
      if (entity.type !== "circle" && entity.type !== "arc") return 0;
      const curR = typeof entity.radius === "number" ? entity.radius : 5;
      return Math.abs(curR - c.value);
    }
    case "angle": {
      const e1 = entityMap.get(c.refs[0]);
      const e2 = entityMap.get(c.refs[1]);
      if (!e1 || !e2 || e1.type !== "line" || e2.type !== "line") return 0;
      const s1 = ptMap.get(e1.startId);
      const end1 = ptMap.get(e1.endId);
      const s2 = ptMap.get(e2.startId);
      const end2 = ptMap.get(e2.endId);
      if (!s1 || !end1 || !s2 || !end2) return 0;
      const a1 = Math.atan2(end1.y - s1.y, end1.x - s1.x);
      const a2 = Math.atan2(end2.y - s2.y, end2.x - s2.x);
      let curAngle = Math.abs(a2 - a1) * (180 / Math.PI);
      if (curAngle > 180) curAngle = 360 - curAngle;
      return Math.abs(curAngle - c.value);
    }
  }
}

/**
 * Get the "length" of an entity (line length or circle radius).
 */
function getEntityLength(
  entity: SketchEntity,
  ptMap: Map<string, { x: number; y: number }>
): number | null {
  switch (entity.type) {
    case "line": {
      const s = ptMap.get(entity.startId);
      const e = ptMap.get(entity.endId);
      if (!s || !e) return null;
      return Math.sqrt((e.x - s.x) ** 2 + (e.y - s.y) ** 2);
    }
    case "circle":
    case "arc":
      return typeof entity.radius === "number" ? entity.radius : null;
    default:
      return null;
  }
}
