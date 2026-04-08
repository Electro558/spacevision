// src/cad/hooks/useSketchMode.ts

"use client";

import { useState, useCallback, useRef } from "react";
import type { Sketch, SketchPlane, SketchEntity, SketchPoint, CadTool } from "../engine/types";
import { newEntityId, newPointId } from "../engine/featureTree";

interface SketchModeState {
  isDrawing: boolean;
  currentPoints: { x: number; y: number }[];
  previewEntity: SketchEntity | null;
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
  });

  const startPointRef = useRef<{ x: number; y: number } | null>(null);

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
          setState({ isDrawing: false, currentPoints: [], previewEntity: null });
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
          setState({ isDrawing: false, currentPoints: [], previewEntity: null });
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
    },
    [sketch, activeTool, onUpdateSketch]
  );

  /**
   * Called on mouse move for live preview.
   */
  const handleMouseMove = useCallback(
    (x: number, y: number) => {
      if (!state.isDrawing || !startPointRef.current) return;

      setState((prev) => ({
        ...prev,
        currentPoints: [startPointRef.current!, { x, y }],
      }));
    },
    [state.isDrawing]
  );

  /**
   * Cancel current drawing operation (e.g., Escape key).
   */
  const cancel = useCallback(() => {
    startPointRef.current = null;
    setState({ isDrawing: false, currentPoints: [], previewEntity: null });
  }, []);

  return {
    ...state,
    handleClick,
    handleMouseMove,
    cancel,
  };
}
