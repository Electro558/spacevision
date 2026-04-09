// src/cad/hooks/useSketchMode.ts

"use client";

import { useState, useCallback, useRef } from "react";
import type { Sketch, SketchPlane, SketchEntity, SketchPoint, CadTool } from "../engine/types";
import { newEntityId, newPointId } from "../engine/featureTree";

interface SketchModeState {
  isDrawing: boolean;
  currentPoints: { x: number; y: number }[];
  previewEntity: SketchEntity | null;
  selectedEntityIds: Set<string>;
}

export function useSketchMode(
  sketch: Sketch | null,
  activeTool: CadTool,
  onUpdateSketch: (sketch: Sketch) => void
) {
  const [state, setState] = useState<SketchModeState>({
    isDrawing: false,
    currentPoints: [],
    previewEntity: null,
    selectedEntityIds: new Set(),
  });

  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const arcPointsRef = useRef<{ x: number; y: number }[]>([]);

  /**
   * Called when user clicks on the sketch plane.
   * Coordinates are in sketch-local 2D space.
   */
  const handleClick = useCallback(
    (x: number, y: number) => {
      if (!sketch) return;

      if (activeTool === "rectangle") {
        if (!startPointRef.current) {
          // First click: set origin
          startPointRef.current = { x, y };
          setState((prev) => ({
            ...prev,
            isDrawing: true,
            currentPoints: [{ x, y }],
          }));
        } else {
          // Second click: finalize rectangle
          const origin = startPointRef.current;
          const width = Math.abs(x - origin.x);
          const height = Math.abs(y - origin.y);
          const ox = Math.min(origin.x, x);
          const oy = Math.min(origin.y, y);

          if (width > 0.01 && height > 0.01) {
            const originPt: SketchPoint = { id: newPointId(), x: ox, y: oy };
            const rect: SketchEntity = {
              id: newEntityId(),
              type: "rectangle",
              originId: originPt.id,
              width,
              height,
            };
            onUpdateSketch({
              ...sketch,
              points: [...sketch.points, originPt],
              entities: [...sketch.entities, rect],
            });
          }

          startPointRef.current = null;
          setState({ isDrawing: false, currentPoints: [], previewEntity: null, selectedEntityIds: new Set() });
        }
      }

      if (activeTool === "circle") {
        if (!startPointRef.current) {
          startPointRef.current = { x, y };
          setState((prev) => ({
            ...prev,
            isDrawing: true,
            currentPoints: [{ x, y }],
          }));
        } else {
          const center = startPointRef.current;
          const dx = x - center.x;
          const dy = y - center.y;
          const radius = Math.sqrt(dx * dx + dy * dy);

          if (radius > 0.01) {
            const centerPt: SketchPoint = {
              id: newPointId(),
              x: center.x,
              y: center.y,
            };
            const circle: SketchEntity = {
              id: newEntityId(),
              type: "circle",
              centerId: centerPt.id,
              radius,
            };
            onUpdateSketch({
              ...sketch,
              points: [...sketch.points, centerPt],
              entities: [...sketch.entities, circle],
            });
          }

          startPointRef.current = null;
          setState({ isDrawing: false, currentPoints: [], previewEntity: null, selectedEntityIds: new Set() });
        }
      }

      if (activeTool === "line") {
        if (!startPointRef.current) {
          startPointRef.current = { x, y };
          setState((prev) => ({
            ...prev,
            isDrawing: true,
            currentPoints: [{ x, y }],
          }));
        } else {
          const start = startPointRef.current;
          const startPt: SketchPoint = {
            id: newPointId(),
            x: start.x,
            y: start.y,
          };
          const endPt: SketchPoint = { id: newPointId(), x, y };
          const line: SketchEntity = {
            id: newEntityId(),
            type: "line",
            startId: startPt.id,
            endId: endPt.id,
          };
          onUpdateSketch({
            ...sketch,
            points: [...sketch.points, startPt, endPt],
            entities: [...sketch.entities, line],
          });

          // Chain: next line starts from this endpoint
          startPointRef.current = { x, y };
          setState((prev) => ({
            ...prev,
            currentPoints: [{ x, y }],
          }));
        }
      }

      if (activeTool === "arc") {
        const clickCount = arcPointsRef.current.length;

        if (clickCount === 0) {
          // First click: start point
          arcPointsRef.current = [{ x, y }];
          startPointRef.current = { x, y };
          setState((prev) => ({
            ...prev,
            isDrawing: true,
            currentPoints: [{ x, y }],
          }));
        } else if (clickCount === 1) {
          // Second click: end point
          arcPointsRef.current = [...arcPointsRef.current, { x, y }];
          setState((prev) => ({
            ...prev,
            currentPoints: [...arcPointsRef.current, { x, y }],
          }));
        } else if (clickCount === 2) {
          // Third click: point on arc — compute circumscribed circle
          const [p1, p2] = arcPointsRef.current;
          const p3 = { x, y };

          const x1 = p1.x, y1 = p1.y;
          const x2 = p2.x, y2 = p2.y;
          const x3 = p3.x, y3 = p3.y;

          const D = 2 * (x1 * (y2 - y3) + x2 * (y3 - y1) + x3 * (y1 - y2));

          if (Math.abs(D) > 1e-10) {
            const cx =
              ((x1 * x1 + y1 * y1) * (y2 - y3) +
                (x2 * x2 + y2 * y2) * (y3 - y1) +
                (x3 * x3 + y3 * y3) * (y1 - y2)) / D;
            const cy =
              ((x1 * x1 + y1 * y1) * (x3 - x2) +
                (x2 * x2 + y2 * y2) * (x1 - x3) +
                (x3 * x3 + y3 * y3) * (x2 - x1)) / D;
            const radius = Math.sqrt((x1 - cx) * (x1 - cx) + (y1 - cy) * (y1 - cy));

            if (radius > 0.01) {
              const centerPt: SketchPoint = { id: newPointId(), x: cx, y: cy };
              const startPt: SketchPoint = { id: newPointId(), x: x1, y: y1 };
              const endPt: SketchPoint = { id: newPointId(), x: x2, y: y2 };
              const arc: SketchEntity = {
                id: newEntityId(),
                type: "arc",
                centerId: centerPt.id,
                startId: startPt.id,
                endId: endPt.id,
                radius,
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
          setState({ isDrawing: false, currentPoints: [], previewEntity: null, selectedEntityIds: new Set() });
        }
      }

      if (activeTool === "select") {
        // Selection is handled via entity proximity — for now, toggle selection based on closest entity
        // This is a placeholder; real hit-testing would use distance to entity geometry
        setState((prev) => ({
          ...prev,
          selectedEntityIds: new Set(),
        }));
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
          // Show line from start to cursor (picking end point)
          setState((prev) => ({
            ...prev,
            currentPoints: [arcPointsRef.current[0], { x, y }],
          }));
        } else if (clickCount === 2) {
          // Show arc preview: include all 3 points for the overlay to render
          setState((prev) => ({
            ...prev,
            currentPoints: [arcPointsRef.current[0], arcPointsRef.current[1], { x, y }],
          }));
        }
        return;
      }

      setState((prev) => ({
        ...prev,
        currentPoints: [startPointRef.current!, { x, y }],
      }));
    },
    [state.isDrawing, activeTool]
  );

  /**
   * Cancel current drawing operation (e.g., Escape key).
   */
  const cancel = useCallback(() => {
    startPointRef.current = null;
    arcPointsRef.current = [];
    setState({ isDrawing: false, currentPoints: [], previewEntity: null, selectedEntityIds: new Set() });
  }, []);

  /**
   * Delete a single entity by ID and its associated points.
   */
  const deleteEntity = useCallback(
    (entityId: string) => {
      if (!sketch) return;

      const entity = sketch.entities.find((e) => e.id === entityId);
      if (!entity) return;

      // Collect point IDs owned by this entity
      const pointIdsToRemove = new Set<string>();
      if (entity.type === "line") {
        pointIdsToRemove.add(entity.startId);
        pointIdsToRemove.add(entity.endId);
      } else if (entity.type === "circle") {
        pointIdsToRemove.add(entity.centerId);
      } else if (entity.type === "arc") {
        pointIdsToRemove.add(entity.centerId);
        pointIdsToRemove.add(entity.startId);
        pointIdsToRemove.add(entity.endId);
      } else if (entity.type === "rectangle") {
        pointIdsToRemove.add(entity.originId);
      }

      // Don't remove points that are still referenced by other entities
      for (const other of sketch.entities) {
        if (other.id === entityId) continue;
        const refs = getEntityPointIds(other);
        for (const ref of refs) {
          pointIdsToRemove.delete(ref);
        }
      }

      onUpdateSketch({
        ...sketch,
        entities: sketch.entities.filter((e) => e.id !== entityId),
        points: sketch.points.filter((p) => !pointIdsToRemove.has(p.id)),
      });
    },
    [sketch, onUpdateSketch]
  );

  /**
   * Delete all currently selected entities.
   */
  const deleteSelectedEntities = useCallback(() => {
    if (!sketch || state.selectedEntityIds.size === 0) return;

    // Collect all point IDs owned by selected entities
    const pointIdsToRemove = new Set<string>();
    const entityIdsToRemove = state.selectedEntityIds;

    for (const entityId of entityIdsToRemove) {
      const entity = sketch.entities.find((e) => e.id === entityId);
      if (!entity) continue;
      const refs = getEntityPointIds(entity);
      for (const ref of refs) {
        pointIdsToRemove.add(ref);
      }
    }

    // Don't remove points still referenced by remaining entities
    for (const other of sketch.entities) {
      if (entityIdsToRemove.has(other.id)) continue;
      const refs = getEntityPointIds(other);
      for (const ref of refs) {
        pointIdsToRemove.delete(ref);
      }
    }

    onUpdateSketch({
      ...sketch,
      entities: sketch.entities.filter((e) => !entityIdsToRemove.has(e.id)),
      points: sketch.points.filter((p) => !pointIdsToRemove.has(p.id)),
    });

    setState((prev) => ({ ...prev, selectedEntityIds: new Set() }));
  }, [sketch, state.selectedEntityIds, onUpdateSketch]);

  /**
   * Toggle selection of an entity by ID.
   */
  const toggleEntitySelection = useCallback((entityId: string) => {
    setState((prev) => {
      const next = new Set(prev.selectedEntityIds);
      if (next.has(entityId)) {
        next.delete(entityId);
      } else {
        next.add(entityId);
      }
      return { ...prev, selectedEntityIds: next };
    });
  }, []);

  /**
   * Clear all selections.
   */
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

/**
 * Returns all point IDs referenced by a sketch entity.
 */
function getEntityPointIds(entity: SketchEntity): string[] {
  switch (entity.type) {
    case "line":
      return [entity.startId, entity.endId];
    case "circle":
      return [entity.centerId];
    case "arc":
      return [entity.centerId, entity.startId, entity.endId];
    case "rectangle":
      return [entity.originId];
  }
}
