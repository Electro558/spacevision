// src/cad/engine/sketchUtils.ts

import type { SketchPoint, SketchEntity, Sketch } from "./types";

export interface Point2D {
  x: number;
  y: number;
}

/**
 * Line-line intersection. Returns null if parallel.
 */
export function lineLineIntersection(
  p1: Point2D, p2: Point2D,
  p3: Point2D, p4: Point2D
): Point2D | null {
  const d = (p1.x - p2.x) * (p3.y - p4.y) - (p1.y - p2.y) * (p3.x - p4.x);
  if (Math.abs(d) < 1e-10) return null;
  const t = ((p1.x - p3.x) * (p3.y - p4.y) - (p1.y - p3.y) * (p3.x - p4.x)) / d;
  return {
    x: p1.x + t * (p2.x - p1.x),
    y: p1.y + t * (p2.y - p1.y),
  };
}

/**
 * Line-circle intersection. Returns 0, 1, or 2 points.
 */
export function lineCircleIntersection(
  lineStart: Point2D, lineEnd: Point2D,
  center: Point2D, radius: number
): Point2D[] {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const fx = lineStart.x - center.x;
  const fy = lineStart.y - center.y;

  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - radius * radius;
  const discriminant = b * b - 4 * a * c;

  if (discriminant < -1e-10) return [];

  const results: Point2D[] = [];
  if (discriminant < 1e-10) {
    const t = -b / (2 * a);
    if (t >= -0.01 && t <= 1.01) {
      results.push({ x: lineStart.x + t * dx, y: lineStart.y + t * dy });
    }
  } else {
    const sqrtDisc = Math.sqrt(discriminant);
    for (const sign of [-1, 1]) {
      const t = (-b + sign * sqrtDisc) / (2 * a);
      if (t >= -0.01 && t <= 1.01) {
        results.push({ x: lineStart.x + t * dx, y: lineStart.y + t * dy });
      }
    }
  }
  return results;
}

/**
 * Circle-circle intersection. Returns 0, 1, or 2 points.
 */
export function circleCircleIntersection(
  c1: Point2D, r1: number,
  c2: Point2D, r2: number
): Point2D[] {
  const dx = c2.x - c1.x;
  const dy = c2.y - c1.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  if (d > r1 + r2 + 1e-10 || d < Math.abs(r1 - r2) - 1e-10 || d < 1e-10) return [];

  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h2 = r1 * r1 - a * a;
  if (h2 < -1e-10) return [];
  const h = Math.sqrt(Math.max(0, h2));

  const mx = c1.x + a * dx / d;
  const my = c1.y + a * dy / d;

  if (h < 1e-10) return [{ x: mx, y: my }];

  return [
    { x: mx + h * dy / d, y: my - h * dx / d },
    { x: mx - h * dy / d, y: my + h * dx / d },
  ];
}

/**
 * Distance from a point to a line segment.
 */
export function pointToSegmentDistance(
  point: Point2D, segStart: Point2D, segEnd: Point2D
): { distance: number; t: number; closest: Point2D } {
  const dx = segEnd.x - segStart.x;
  const dy = segEnd.y - segStart.y;
  const lenSq = dx * dx + dy * dy;

  let t = lenSq === 0 ? 0 : ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const closest = { x: segStart.x + t * dx, y: segStart.y + t * dy };
  const ddx = point.x - closest.x;
  const ddy = point.y - closest.y;

  return { distance: Math.sqrt(ddx * ddx + ddy * ddy), t, closest };
}

/**
 * Distance from a point to a circle.
 */
export function pointToCircleDistance(
  point: Point2D, center: Point2D, radius: number
): number {
  const d = Math.sqrt((point.x - center.x) ** 2 + (point.y - center.y) ** 2);
  return Math.abs(d - radius);
}

/**
 * Mirror a point across a line defined by two points.
 */
export function mirrorPoint(
  point: Point2D, lineP1: Point2D, lineP2: Point2D
): Point2D {
  const dx = lineP2.x - lineP1.x;
  const dy = lineP2.y - lineP1.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-10) return { ...point };

  const t = ((point.x - lineP1.x) * dx + (point.y - lineP1.y) * dy) / lenSq;
  const projX = lineP1.x + t * dx;
  const projY = lineP1.y + t * dy;

  return {
    x: 2 * projX - point.x,
    y: 2 * projY - point.y,
  };
}

/**
 * Mirror an entire sketch entity across a mirror line.
 * Returns new points and the mirrored entity.
 */
export function mirrorEntity(
  entity: SketchEntity,
  sketch: Sketch,
  mirrorLineP1: Point2D,
  mirrorLineP2: Point2D,
  newPointId: () => string,
  newEntityId: () => string
): { points: SketchPoint[]; entity: SketchEntity } {
  const pointMap = new Map<string, SketchPoint>();
  for (const p of sketch.points) {
    pointMap.set(p.id, p);
  }

  const mirroredPoints: SketchPoint[] = [];
  const idMap = new Map<string, string>(); // old point id -> new point id

  function getMirroredPoint(originalId: string): string {
    if (idMap.has(originalId)) return idMap.get(originalId)!;
    const orig = pointMap.get(originalId);
    if (!orig) return originalId;
    const mirrored = mirrorPoint(orig, mirrorLineP1, mirrorLineP2);
    const newId = newPointId();
    mirroredPoints.push({ id: newId, x: mirrored.x, y: mirrored.y });
    idMap.set(originalId, newId);
    return newId;
  }

  let mirroredEntity: SketchEntity;

  switch (entity.type) {
    case "line":
      mirroredEntity = {
        id: newEntityId(),
        type: "line",
        startId: getMirroredPoint(entity.startId),
        endId: getMirroredPoint(entity.endId),
      };
      break;
    case "circle":
      mirroredEntity = {
        id: newEntityId(),
        type: "circle",
        centerId: getMirroredPoint(entity.centerId),
        radius: entity.radius,
      };
      break;
    case "arc":
      mirroredEntity = {
        id: newEntityId(),
        type: "arc",
        centerId: getMirroredPoint(entity.centerId),
        startId: getMirroredPoint(entity.endId),   // swap start/end for mirror
        endId: getMirroredPoint(entity.startId),
        radius: entity.radius,
      };
      break;
    case "rectangle":
      mirroredEntity = {
        id: newEntityId(),
        type: "rectangle",
        originId: getMirroredPoint(entity.originId),
        width: entity.width,
        height: entity.height,
      };
      break;
  }

  return { points: mirroredPoints, entity: mirroredEntity! };
}
