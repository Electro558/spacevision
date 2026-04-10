// src/cad/hooks/useSketchMode.ts

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type { Sketch, SketchPlane, SketchEntity, SketchPoint, CadTool } from "../engine/types";
import { newEntityId, newPointId } from "../engine/featureTree";
import {
  pointToSegmentDistance,
  pointToCircleDistance,
  mirrorEntity,
  type Point2D,
} from "../engine/sketchUtils";

interface SketchModeState {
  isDrawing: boolean;
  currentPoints: { x: number; y: number }[];
  previewEntity: SketchEntity | null;
  selectedEntityIds: Set<string>;
}

const RESET_STATE: SketchModeState = {
  isDrawing: false,
  currentPoints: [],
  previewEntity: null,
  selectedEntityIds: new Set(),
};

export function useSketchMode(
  sketch: Sketch | null,
  activeTool: CadTool,
  onUpdateSketch: (sketch: Sketch) => void
) {
  const [state, setState] = useState<SketchModeState>(RESET_STATE);

  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const arcPointsRef = useRef<{ x: number; y: number }[]>([]);
  const constructionRef = useRef(false);

  // Listen for construction mode toggle from SketchToolbar
  useEffect(() => {
    const handler = (e: Event) => {
      constructionRef.current = (e as CustomEvent).detail.active;
    };
    window.addEventListener("cad-construction-mode", handler);
    return () => window.removeEventListener("cad-construction-mode", handler);
  }, []);

  /**
   * Called when user clicks on the sketch plane.
   * Coordinates are in sketch-local 2D space.
   */
  const handleClick = useCallback(
    (x: number, y: number) => {
      if (!sketch) return;
      const conFlag = constructionRef.current || undefined;

      if (activeTool === "rectangle") {
        if (!startPointRef.current) {
          startPointRef.current = { x, y };
          setState((prev) => ({ ...prev, isDrawing: true, currentPoints: [{ x, y }] }));
        } else {
          const origin = startPointRef.current;
          const width = Math.abs(x - origin.x);
          const height = Math.abs(y - origin.y);
          const ox = Math.min(origin.x, x);
          const oy = Math.min(origin.y, y);

          if (width > 0.01 && height > 0.01) {
            const originPt: SketchPoint = { id: newPointId(), x: ox, y: oy };
            const rect: SketchEntity = {
              id: newEntityId(), type: "rectangle", originId: originPt.id, width, height,
              construction: conFlag,
            };
            onUpdateSketch({
              ...sketch,
              points: [...sketch.points, originPt],
              entities: [...sketch.entities, rect],
            });
          }
          startPointRef.current = null;
          setState(RESET_STATE);
        }
      }

      if (activeTool === "circle") {
        if (!startPointRef.current) {
          startPointRef.current = { x, y };
          setState((prev) => ({ ...prev, isDrawing: true, currentPoints: [{ x, y }] }));
        } else {
          const center = startPointRef.current;
          const dx = x - center.x;
          const dy = y - center.y;
          const radius = Math.sqrt(dx * dx + dy * dy);

          if (radius > 0.01) {
            const centerPt: SketchPoint = { id: newPointId(), x: center.x, y: center.y };
            const circle: SketchEntity = {
              id: newEntityId(), type: "circle", centerId: centerPt.id, radius,
              construction: conFlag,
            };
            onUpdateSketch({
              ...sketch,
              points: [...sketch.points, centerPt],
              entities: [...sketch.entities, circle],
            });
          }
          startPointRef.current = null;
          setState(RESET_STATE);
        }
      }

      if (activeTool === "line") {
        if (!startPointRef.current) {
          startPointRef.current = { x, y };
          setState((prev) => ({ ...prev, isDrawing: true, currentPoints: [{ x, y }] }));
        } else {
          const start = startPointRef.current;
          const startPt: SketchPoint = { id: newPointId(), x: start.x, y: start.y };
          const endPt: SketchPoint = { id: newPointId(), x, y };
          const line: SketchEntity = {
            id: newEntityId(), type: "line", startId: startPt.id, endId: endPt.id,
            construction: conFlag,
          };
          onUpdateSketch({
            ...sketch,
            points: [...sketch.points, startPt, endPt],
            entities: [...sketch.entities, line],
          });
          // Chain: next line starts from this endpoint
          startPointRef.current = { x, y };
          setState((prev) => ({ ...prev, currentPoints: [{ x, y }] }));
        }
      }

      if (activeTool === "arc") {
        const clickCount = arcPointsRef.current.length;

        if (clickCount === 0) {
          arcPointsRef.current = [{ x, y }];
          startPointRef.current = { x, y };
          setState((prev) => ({ ...prev, isDrawing: true, currentPoints: [{ x, y }] }));
        } else if (clickCount === 1) {
          arcPointsRef.current = [...arcPointsRef.current, { x, y }];
          setState((prev) => ({ ...prev, currentPoints: [...arcPointsRef.current, { x, y }] }));
        } else if (clickCount === 2) {
          const [p1, p2] = arcPointsRef.current;
          const p3 = { x, y };
          const x1 = p1.x, y1 = p1.y, x2 = p2.x, y2 = p2.y, x3 = p3.x, y3 = p3.y;
          const D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));

          if (Math.abs(D) > 1e-10) {
            const cx = ((x1*x1+y1*y1)*(y2-y3)+(x2*x2+y2*y2)*(y3-y1)+(x3*x3+y3*y3)*(y1-y2)) / D;
            const cy = ((x1*x1+y1*y1)*(x3-x2)+(x2*x2+y2*y2)*(x1-x3)+(x3*x3+y3*y3)*(x2-x1)) / D;
            const radius = Math.sqrt((x1 - cx) ** 2 + (y1 - cy) ** 2);

            if (radius > 0.01) {
              const centerPt: SketchPoint = { id: newPointId(), x: cx, y: cy };
              const startPt: SketchPoint = { id: newPointId(), x: x1, y: y1 };
              const endPt: SketchPoint = { id: newPointId(), x: x2, y: y2 };
              const arc: SketchEntity = {
                id: newEntityId(), type: "arc",
                centerId: centerPt.id, startId: startPt.id, endId: endPt.id, radius,
                construction: conFlag,
              };
              onUpdateSketch({
                ...sketch,
                points: [...sketch.points, centerPt, startPt, endPt],
                entities: [...sketch.entities, arc],
              });
            }
          }
          arcPointsRef.current = [];
          startPointRef.current = null;
          setState(RESET_STATE);
        }
      }

      // ── Trim Tool ──
      if (activeTool === "trim") {
        const clickPt = { x, y };
        let closestEntity: SketchEntity | null = null;
        let closestDist = Infinity;

        for (const entity of sketch.entities) {
          if (entity.construction) continue;
          const dist = distanceToEntity(entity, clickPt, sketch.points);
          if (dist < closestDist && dist < 2.0) {
            closestDist = dist;
            closestEntity = entity;
          }
        }

        if (closestEntity) {
          if (closestEntity.type === "rectangle") {
            // Explode rectangle into 4 lines, remove the clicked edge
            const origin = sketch.points.find(p => p.id === (closestEntity as any).originId);
            if (!origin) return;
            const w = typeof closestEntity.width === "number" ? closestEntity.width : 10;
            const h = typeof closestEntity.height === "number" ? closestEntity.height : 10;

            const corners = [
              { id: newPointId(), x: origin.x, y: origin.y },
              { id: newPointId(), x: origin.x + w, y: origin.y },
              { id: newPointId(), x: origin.x + w, y: origin.y + h },
              { id: newPointId(), x: origin.x, y: origin.y + h },
            ];
            const edges = [
              { start: corners[0], end: corners[1] },
              { start: corners[1], end: corners[2] },
              { start: corners[2], end: corners[3] },
              { start: corners[3], end: corners[0] },
            ];

            let closestEdge = 0;
            let minEdgeDist = Infinity;
            for (let i = 0; i < edges.length; i++) {
              const d = pointToSegmentDistance(clickPt, edges[i].start, edges[i].end).distance;
              if (d < minEdgeDist) { minEdgeDist = d; closestEdge = i; }
            }

            const newEntities: SketchEntity[] = edges
              .filter((_, i) => i !== closestEdge)
              .map(edge => ({
                id: newEntityId(), type: "line" as const,
                startId: edge.start.id, endId: edge.end.id,
              }));

            onUpdateSketch({
              ...sketch,
              points: [...sketch.points.filter(p => p.id !== (closestEntity as any).originId), ...corners],
              entities: [...sketch.entities.filter(e => e.id !== closestEntity!.id), ...newEntities],
            });
          } else {
            // For lines, circles, arcs: just remove the entity
            deleteEntity(closestEntity.id);
          }
        }
      }

      // ── Mirror Tool ──
      if (activeTool === "mirror") {
        if (!startPointRef.current) {
          startPointRef.current = { x, y };
          setState(prev => ({ ...prev, isDrawing: true, currentPoints: [{ x, y }] }));
        } else {
          const p1 = startPointRef.current;
          const p2 = { x, y };

          if (Math.abs(p1.x - p2.x) > 0.01 || Math.abs(p1.y - p2.y) > 0.01) {
            let newPoints = [...sketch.points];
            let newEntities = [...sketch.entities];

            for (const entity of sketch.entities) {
              const result = mirrorEntity(entity, sketch, p1, p2, newPointId, newEntityId);
              newPoints = [...newPoints, ...result.points];
              newEntities = [...newEntities, result.entity];
            }
            onUpdateSketch({ ...sketch, points: newPoints, entities: newEntities });
          }
          startPointRef.current = null;
          setState(RESET_STATE);
        }
      }

      // ── Offset Tool ──
      if (activeTool === "offset") {
        const clickPt = { x, y };
        let closestEntity: SketchEntity | null = null;
        let closestDist = Infinity;

        for (const entity of sketch.entities) {
          const dist = distanceToEntity(entity, clickPt, sketch.points);
          if (dist < closestDist && dist < 5.0) {
            closestDist = dist;
            closestEntity = entity;
          }
        }

        if (!closestEntity) return;

        const ptMap = new Map(sketch.points.map(p => [p.id, p]));
        let newPoints: SketchPoint[] = [];
        let newEntity: SketchEntity | null = null;

        if (closestEntity.type === "circle") {
          const c = ptMap.get(closestEntity.centerId);
          if (!c) return;
          const r = typeof closestEntity.radius === "number" ? closestEntity.radius : 5;
          const distFromCenter = Math.sqrt((x - c.x) ** 2 + (y - c.y) ** 2);
          if (Math.abs(distFromCenter - r) > 0.1) {
            const newCenter: SketchPoint = { id: newPointId(), x: c.x, y: c.y };
            newPoints = [newCenter];
            newEntity = { id: newEntityId(), type: "circle", centerId: newCenter.id, radius: distFromCenter };
          }
        } else if (closestEntity.type === "rectangle") {
          const o = ptMap.get(closestEntity.originId);
          if (!o) return;
          const w = typeof closestEntity.width === "number" ? closestEntity.width : 10;
          const h = typeof closestEntity.height === "number" ? closestEntity.height : 10;
          const cx = o.x + w / 2;
          const cy = o.y + h / 2;
          const offsetDist = Math.max(Math.abs(x - cx) - w / 2, Math.abs(y - cy) - h / 2);
          const sign = offsetDist > 0 ? 1 : -1;
          const dist = Math.abs(closestDist) * sign;

          const newW = w + 2 * dist;
          const newH = h + 2 * dist;
          if (newW > 0.1 && newH > 0.1) {
            const newOrigin: SketchPoint = { id: newPointId(), x: o.x - dist, y: o.y - dist };
            newPoints = [newOrigin];
            newEntity = { id: newEntityId(), type: "rectangle", originId: newOrigin.id, width: newW, height: newH };
          }
        } else if (closestEntity.type === "line") {
          const s = ptMap.get(closestEntity.startId);
          const e = ptMap.get(closestEntity.endId);
          if (!s || !e) return;
          const ldx = e.x - s.x;
          const ldy = e.y - s.y;
          const len = Math.sqrt(ldx * ldx + ldy * ldy);
          if (len < 0.01) return;
          const nx = -ldy / len;
          const ny = ldx / len;
          const side = (x - s.x) * nx + (y - s.y) * ny > 0 ? 1 : -1;
          const dist = closestDist * side;
          const ns: SketchPoint = { id: newPointId(), x: s.x + nx * dist, y: s.y + ny * dist };
          const ne: SketchPoint = { id: newPointId(), x: e.x + nx * dist, y: e.y + ny * dist };
          newPoints = [ns, ne];
          newEntity = { id: newEntityId(), type: "line", startId: ns.id, endId: ne.id };
        }

        if (newEntity) {
          onUpdateSketch({
            ...sketch,
            points: [...sketch.points, ...newPoints],
            entities: [...sketch.entities, newEntity],
          });
        }
      }

      if (activeTool === "select") {
        setState((prev) => ({ ...prev, selectedEntityIds: new Set() }));
      }
    },
    [sketch, activeTool, onUpdateSketch]
  );

  /**
   * Called on mouse move for live preview.
   */
  const handleMouseMove = useCallback(
    (x: number, y: number) => {
      if (!state.isDrawing || !startPointRef.current) return;

      if (activeTool === "arc") {
        const clickCount = arcPointsRef.current.length;
        if (clickCount === 1) {
          setState((prev) => ({ ...prev, currentPoints: [arcPointsRef.current[0], { x, y }] }));
        } else if (clickCount === 2) {
          setState((prev) => ({ ...prev, currentPoints: [arcPointsRef.current[0], arcPointsRef.current[1], { x, y }] }));
        }
        return;
      }

      if (activeTool === "mirror") {
        setState(prev => ({ ...prev, currentPoints: [startPointRef.current!, { x, y }] }));
        return;
      }

      setState((prev) => ({ ...prev, currentPoints: [startPointRef.current!, { x, y }] }));
    },
    [state.isDrawing, activeTool]
  );

  const cancel = useCallback(() => {
    startPointRef.current = null;
    arcPointsRef.current = [];
    setState(RESET_STATE);
  }, []);

  const deleteEntity = useCallback(
    (entityId: string) => {
      if (!sketch) return;
      const entity = sketch.entities.find((e) => e.id === entityId);
      if (!entity) return;

      const pointIdsToRemove = new Set<string>();
      const refs = getEntityPointIds(entity);
      for (const ref of refs) pointIdsToRemove.add(ref);

      for (const other of sketch.entities) {
        if (other.id === entityId) continue;
        for (const ref of getEntityPointIds(other)) pointIdsToRemove.delete(ref);
      }

      onUpdateSketch({
        ...sketch,
        entities: sketch.entities.filter((e) => e.id !== entityId),
        points: sketch.points.filter((p) => !pointIdsToRemove.has(p.id)),
      });
    },
    [sketch, onUpdateSketch]
  );

  const deleteSelectedEntities = useCallback(() => {
    if (!sketch || state.selectedEntityIds.size === 0) return;

    const pointIdsToRemove = new Set<string>();
    const entityIdsToRemove = state.selectedEntityIds;

    for (const entityId of entityIdsToRemove) {
      const entity = sketch.entities.find((e) => e.id === entityId);
      if (!entity) continue;
      for (const ref of getEntityPointIds(entity)) pointIdsToRemove.add(ref);
    }

    for (const other of sketch.entities) {
      if (entityIdsToRemove.has(other.id)) continue;
      for (const ref of getEntityPointIds(other)) pointIdsToRemove.delete(ref);
    }

    onUpdateSketch({
      ...sketch,
      entities: sketch.entities.filter((e) => !entityIdsToRemove.has(e.id)),
      points: sketch.points.filter((p) => !pointIdsToRemove.has(p.id)),
    });
    setState((prev) => ({ ...prev, selectedEntityIds: new Set() }));
  }, [sketch, state.selectedEntityIds, onUpdateSketch]);

  const toggleEntitySelection = useCallback((entityId: string) => {
    setState((prev) => {
      const next = new Set(prev.selectedEntityIds);
      if (next.has(entityId)) next.delete(entityId); else next.add(entityId);
      return { ...prev, selectedEntityIds: next };
    });
  }, []);

  const clearSelection = useCallback(() => {
    setState((prev) => ({ ...prev, selectedEntityIds: new Set() }));
  }, []);

  return {
    ...state,
    handleClick,
    handleMouseMove,
    cancel,
    deleteEntity,
    deleteSelectedEntities,
    toggleEntitySelection,
    clearSelection,
  };
}

// ── Helpers ──

function getEntityPointIds(entity: SketchEntity): string[] {
  switch (entity.type) {
    case "line": return [entity.startId, entity.endId];
    case "circle": return [entity.centerId];
    case "arc": return [entity.centerId, entity.startId, entity.endId];
    case "rectangle": return [entity.originId];
  }
}

function distanceToEntity(
  entity: SketchEntity,
  point: Point2D,
  points: SketchPoint[]
): number {
  const ptMap = new Map(points.map(p => [p.id, p]));

  switch (entity.type) {
    case "line": {
      const s = ptMap.get(entity.startId);
      const e = ptMap.get(entity.endId);
      if (!s || !e) return Infinity;
      return pointToSegmentDistance(point, s, e).distance;
    }
    case "circle": {
      const c = ptMap.get(entity.centerId);
      if (!c) return Infinity;
      const r = typeof entity.radius === "number" ? entity.radius : 5;
      return pointToCircleDistance(point, c, r);
    }
    case "rectangle": {
      const o = ptMap.get(entity.originId);
      if (!o) return Infinity;
      const w = typeof entity.width === "number" ? entity.width : 10;
      const h = typeof entity.height === "number" ? entity.height : 10;
      const edges: [Point2D, Point2D][] = [
        [o, { x: o.x + w, y: o.y }],
        [{ x: o.x + w, y: o.y }, { x: o.x + w, y: o.y + h }],
        [{ x: o.x + w, y: o.y + h }, { x: o.x, y: o.y + h }],
        [{ x: o.x, y: o.y + h }, o],
      ];
      return Math.min(...edges.map(([a, b]) => pointToSegmentDistance(point, a, b).distance));
    }
    case "arc": {
      const c = ptMap.get(entity.centerId);
      if (!c) return Infinity;
      const r = typeof entity.radius === "number" ? entity.radius : 5;
      return pointToCircleDistance(point, c, r);
    }
  }
}
