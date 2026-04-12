// src/cad/engine/snapEngine.ts

import type { Sketch, SketchEntity, SketchPoint } from "./types";
import {
  pointToSegmentDistance,
  pointToCircleDistance,
  lineLineIntersection,
  lineCircleIntersection,
  circleCircleIntersection,
  type Point2D,
} from "./sketchUtils";

// ── Types ──

export type SnapType =
  | "grid"
  | "endpoint"
  | "midpoint"
  | "center"
  | "intersection"
  | "perpendicular"
  | "nearest"
  | "none";

export interface SnapResult {
  snapped: boolean;
  point: { x: number; y: number };
  type: SnapType;
  entityId?: string;
  pointId?: string;
}

export interface SnapConfig {
  gridEnabled: boolean;
  entityEnabled: boolean;
  gridSize: number;
  snapDistance: number; // in sketch units, how close cursor needs to be
}

export const DEFAULT_SNAP_CONFIG: SnapConfig = {
  gridEnabled: true,
  entityEnabled: true,
  gridSize: 1,
  snapDistance: 1.0,
};

const NO_SNAP: SnapResult = {
  snapped: false,
  point: { x: 0, y: 0 },
  type: "none",
};

// ── Snap priority (lower = higher priority) ──
const SNAP_PRIORITY: Record<SnapType, number> = {
  endpoint: 0,
  midpoint: 1,
  center: 2,
  intersection: 3,
  perpendicular: 4,
  nearest: 5,
  grid: 6,
  none: 99,
};

// ── Helper ──

function dist2D(a: Point2D, b: Point2D): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Grid Snap ──

export function snapToGrid(
  point: Point2D,
  gridSize: number
): SnapResult {
  const snappedX = Math.round(point.x / gridSize) * gridSize;
  const snappedY = Math.round(point.y / gridSize) * gridSize;
  return {
    snapped: true,
    point: { x: snappedX, y: snappedY },
    type: "grid",
  };
}

// ── Entity Snap ──

interface SnapCandidate {
  point: Point2D;
  type: SnapType;
  distance: number;
  entityId?: string;
  pointId?: string;
}

/**
 * Gather all rectangle corners for a rectangle entity.
 */
function getRectangleCorners(
  entity: SketchEntity & { type: "rectangle" },
  ptMap: Map<string, SketchPoint>
): { point: Point2D; pointId?: string }[] {
  const origin = ptMap.get(entity.originId);
  if (!origin) return [];
  const w = typeof entity.width === "number" ? entity.width : parseFloat(String(entity.width)) || 0;
  const h = typeof entity.height === "number" ? entity.height : parseFloat(String(entity.height)) || 0;
  return [
    { point: { x: origin.x, y: origin.y }, pointId: entity.originId },
    { point: { x: origin.x + w, y: origin.y } },
    { point: { x: origin.x + w, y: origin.y + h } },
    { point: { x: origin.x, y: origin.y + h } },
  ];
}

/**
 * Get all rectangle edges as line segments.
 */
function getRectangleEdges(
  entity: SketchEntity & { type: "rectangle" },
  ptMap: Map<string, SketchPoint>
): [Point2D, Point2D][] {
  const origin = ptMap.get(entity.originId);
  if (!origin) return [];
  const w = typeof entity.width === "number" ? entity.width : parseFloat(String(entity.width)) || 0;
  const h = typeof entity.height === "number" ? entity.height : parseFloat(String(entity.height)) || 0;
  const c0: Point2D = { x: origin.x, y: origin.y };
  const c1: Point2D = { x: origin.x + w, y: origin.y };
  const c2: Point2D = { x: origin.x + w, y: origin.y + h };
  const c3: Point2D = { x: origin.x, y: origin.y + h };
  return [
    [c0, c1],
    [c1, c2],
    [c2, c3],
    [c3, c0],
  ];
}

export function snapToEntity(
  point: Point2D,
  sketch: Sketch,
  snapDistance: number
): SnapResult {
  const ptMap = new Map(sketch.points.map((p) => [p.id, p]));
  const candidates: SnapCandidate[] = [];

  for (const entity of sketch.entities) {
    switch (entity.type) {
      case "line": {
        const s = ptMap.get(entity.startId);
        const e = ptMap.get(entity.endId);
        if (!s || !e) break;

        // Endpoints
        const dStart = dist2D(point, s);
        if (dStart <= snapDistance) {
          candidates.push({ point: { x: s.x, y: s.y }, type: "endpoint", distance: dStart, entityId: entity.id, pointId: entity.startId });
        }
        const dEnd = dist2D(point, e);
        if (dEnd <= snapDistance) {
          candidates.push({ point: { x: e.x, y: e.y }, type: "endpoint", distance: dEnd, entityId: entity.id, pointId: entity.endId });
        }

        // Midpoint
        const mid: Point2D = { x: (s.x + e.x) / 2, y: (s.y + e.y) / 2 };
        const dMid = dist2D(point, mid);
        if (dMid <= snapDistance) {
          candidates.push({ point: mid, type: "midpoint", distance: dMid, entityId: entity.id });
        }

        // Nearest point on segment
        const seg = pointToSegmentDistance(point, s, e);
        if (seg.distance <= snapDistance) {
          candidates.push({ point: seg.closest, type: "nearest", distance: seg.distance, entityId: entity.id });
        }
        break;
      }

      case "circle": {
        const c = ptMap.get(entity.centerId);
        if (!c) break;
        const r = typeof entity.radius === "number" ? entity.radius : parseFloat(String(entity.radius)) || 0;

        // Center
        const dCenter = dist2D(point, c);
        if (dCenter <= snapDistance) {
          candidates.push({ point: { x: c.x, y: c.y }, type: "center", distance: dCenter, entityId: entity.id, pointId: entity.centerId });
        }

        // Nearest point on circle
        const dCircle = pointToCircleDistance(point, c, r);
        if (dCircle <= snapDistance && dCenter > 0.001) {
          const angle = Math.atan2(point.y - c.y, point.x - c.x);
          const nearPt: Point2D = { x: c.x + r * Math.cos(angle), y: c.y + r * Math.sin(angle) };
          candidates.push({ point: nearPt, type: "nearest", distance: dCircle, entityId: entity.id });
        }
        break;
      }

      case "arc": {
        const c = ptMap.get(entity.centerId);
        const s = ptMap.get(entity.startId);
        const e = ptMap.get(entity.endId);
        if (!c) break;
        const r = typeof entity.radius === "number" ? entity.radius : parseFloat(String(entity.radius)) || 0;

        // Center
        const dCenter = dist2D(point, c);
        if (dCenter <= snapDistance) {
          candidates.push({ point: { x: c.x, y: c.y }, type: "center", distance: dCenter, entityId: entity.id, pointId: entity.centerId });
        }

        // Start / End endpoints
        if (s) {
          const dS = dist2D(point, s);
          if (dS <= snapDistance) {
            candidates.push({ point: { x: s.x, y: s.y }, type: "endpoint", distance: dS, entityId: entity.id, pointId: entity.startId });
          }
        }
        if (e) {
          const dE = dist2D(point, e);
          if (dE <= snapDistance) {
            candidates.push({ point: { x: e.x, y: e.y }, type: "endpoint", distance: dE, entityId: entity.id, pointId: entity.endId });
          }
        }

        // Nearest point on arc (approximate — project onto circle)
        const dArc = pointToCircleDistance(point, c, r);
        if (dArc <= snapDistance && dCenter > 0.001) {
          const angle = Math.atan2(point.y - c.y, point.x - c.x);
          const nearPt: Point2D = { x: c.x + r * Math.cos(angle), y: c.y + r * Math.sin(angle) };
          candidates.push({ point: nearPt, type: "nearest", distance: dArc, entityId: entity.id });
        }
        break;
      }

      case "rectangle": {
        // Rectangle corners (endpoints)
        const corners = getRectangleCorners(entity, ptMap);
        for (const corner of corners) {
          const d = dist2D(point, corner.point);
          if (d <= snapDistance) {
            candidates.push({ point: corner.point, type: "endpoint", distance: d, entityId: entity.id, pointId: corner.pointId });
          }
        }

        // Rectangle edge midpoints
        const edges = getRectangleEdges(entity, ptMap);
        for (const [a, b] of edges) {
          const mid: Point2D = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
          const dMid = dist2D(point, mid);
          if (dMid <= snapDistance) {
            candidates.push({ point: mid, type: "midpoint", distance: dMid, entityId: entity.id });
          }
        }

        // Rectangle center
        if (corners.length === 4) {
          const cx = (corners[0].point.x + corners[2].point.x) / 2;
          const cy = (corners[0].point.y + corners[2].point.y) / 2;
          const center: Point2D = { x: cx, y: cy };
          const dC = dist2D(point, center);
          if (dC <= snapDistance) {
            candidates.push({ point: center, type: "center", distance: dC, entityId: entity.id });
          }
        }

        // Nearest point on edges
        for (const [a, b] of edges) {
          const seg = pointToSegmentDistance(point, a, b);
          if (seg.distance <= snapDistance) {
            candidates.push({ point: seg.closest, type: "nearest", distance: seg.distance, entityId: entity.id });
          }
        }
        break;
      }
    }
  }

  // ── Intersections between entities ──
  collectIntersections(sketch, ptMap, point, snapDistance, candidates);

  if (candidates.length === 0) return { ...NO_SNAP, point };

  // Sort by priority first, then by distance
  candidates.sort((a, b) => {
    const pa = SNAP_PRIORITY[a.type];
    const pb = SNAP_PRIORITY[b.type];
    if (pa !== pb) return pa - pb;
    return a.distance - b.distance;
  });

  const best = candidates[0];
  return {
    snapped: true,
    point: best.point,
    type: best.type,
    entityId: best.entityId,
    pointId: best.pointId,
  };
}

/**
 * Collect intersection snap points between all pairs of entities.
 */
function collectIntersections(
  sketch: Sketch,
  ptMap: Map<string, SketchPoint>,
  point: Point2D,
  snapDistance: number,
  candidates: SnapCandidate[]
): void {
  const entities = sketch.entities;

  for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      const a = entities[i];
      const b = entities[j];
      const intersections = getEntityIntersections(a, b, ptMap);

      for (const ip of intersections) {
        const d = dist2D(point, ip);
        if (d <= snapDistance) {
          candidates.push({
            point: ip,
            type: "intersection",
            distance: d,
            entityId: a.id,
          });
        }
      }
    }
  }
}

/**
 * Compute intersection points between two entities.
 */
function getEntityIntersections(
  a: SketchEntity,
  b: SketchEntity,
  ptMap: Map<string, SketchPoint>
): Point2D[] {
  const aSegments = getEntitySegments(a, ptMap);
  const bSegments = getEntitySegments(b, ptMap);
  const aCircles = getEntityCircles(a, ptMap);
  const bCircles = getEntityCircles(b, ptMap);

  const results: Point2D[] = [];

  // line-line
  for (const [as, ae] of aSegments) {
    for (const [bs, be] of bSegments) {
      const ip = lineLineIntersection(as, ae, bs, be);
      if (ip) {
        // Check that the intersection lies on both segments
        const ta = paramOnSegment(ip, as, ae);
        const tb = paramOnSegment(ip, bs, be);
        if (ta >= -0.01 && ta <= 1.01 && tb >= -0.01 && tb <= 1.01) {
          results.push(ip);
        }
      }
    }
  }

  // line-circle
  for (const [ls, le] of aSegments) {
    for (const { center, radius } of bCircles) {
      results.push(...lineCircleIntersection(ls, le, center, radius));
    }
  }
  for (const [ls, le] of bSegments) {
    for (const { center, radius } of aCircles) {
      results.push(...lineCircleIntersection(ls, le, center, radius));
    }
  }

  // circle-circle
  for (const ac of aCircles) {
    for (const bc of bCircles) {
      results.push(...circleCircleIntersection(ac.center, ac.radius, bc.center, bc.radius));
    }
  }

  return results;
}

function paramOnSegment(p: Point2D, a: Point2D, b: Point2D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-14) return 0;
  return ((p.x - a.x) * dx + (p.y - a.y) * dy) / lenSq;
}

function getEntitySegments(
  entity: SketchEntity,
  ptMap: Map<string, SketchPoint>
): [Point2D, Point2D][] {
  switch (entity.type) {
    case "line": {
      const s = ptMap.get(entity.startId);
      const e = ptMap.get(entity.endId);
      if (!s || !e) return [];
      return [[s, e]];
    }
    case "rectangle": {
      return getRectangleEdges(entity, ptMap);
    }
    default:
      return [];
  }
}

function getEntityCircles(
  entity: SketchEntity,
  ptMap: Map<string, SketchPoint>
): { center: Point2D; radius: number }[] {
  switch (entity.type) {
    case "circle":
    case "arc": {
      const c = ptMap.get(entity.centerId);
      if (!c) return [];
      const r = typeof entity.radius === "number" ? entity.radius : parseFloat(String(entity.radius)) || 0;
      return [{ center: c, radius: r }];
    }
    default:
      return [];
  }
}

// ── Combined snap ──

export function findBestSnap(
  point: Point2D,
  sketch: Sketch | null,
  config: SnapConfig
): SnapResult {
  let entitySnap: SnapResult | null = null;
  let gridSnap: SnapResult | null = null;

  // Entity snapping (higher priority)
  if (config.entityEnabled && sketch) {
    const result = snapToEntity(point, sketch, config.snapDistance);
    if (result.snapped) {
      entitySnap = result;
    }
  }

  // Grid snapping
  if (config.gridEnabled) {
    const result = snapToGrid(point, config.gridSize);
    const d = dist2D(point, result.point);
    // Only snap to grid if within snap distance
    if (d <= config.snapDistance) {
      gridSnap = result;
    }
  }

  // Entity snaps always take precedence over grid
  if (entitySnap) return entitySnap;
  if (gridSnap) return gridSnap;

  return { ...NO_SNAP, point };
}
