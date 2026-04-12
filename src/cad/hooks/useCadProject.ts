"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import type {
  CadProject,
  Feature,
  Parameter,
  CadUIState,
  CadTool,
  ViewMode,
  RebuildResultPayload,
  TessellationResult,
  MaterialConfig,
} from "../engine/types";
import { DEFAULT_MATERIAL } from "../engine/materials";
import {
  createHistory,
  pushState,
  undo as undoHistory,
  redo as redoHistory,
  canUndo as canUndoHistory,
  canRedo as canRedoHistory,
  type OperationHistory,
} from "../engine/operationHistory";
import {
  createEmptyProject,
  saveToLocalStorage,
} from "../engine/projectSerializer";
import { removeFeature as removeFeatureFromTree } from "../engine/featureTree";

export interface CadProjectState {
  project: CadProject;
  uiState: CadUIState;
  meshes: TessellationResult[];
  isRebuilding: boolean;

  // Project actions
  setProjectName: (name: string) => void;
  setFeatures: (features: Feature[]) => void;
  setParameters: (params: Record<string, Parameter>) => void;
  addFeature: (feature: Feature) => void;
  removeFeature: (featureId: string) => void;
  updateFeature: (featureId: string, updates: Partial<Feature>) => void;

  // History
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // UI state
  setActiveTool: (tool: CadTool) => void;
  setViewMode: (mode: ViewMode) => void;
  setSelectedFeatureId: (id: string | null) => void;
  setSketchModeActive: (active: boolean, sketchId?: string) => void;
  toggleGrid: () => void;
  toggleSnap: () => void;

  // Rebuild trigger
  requestRebuild: () => void;

  // Mesh results (set by worker)
  setMeshes: (meshes: TessellationResult[]) => void;
  setIsRebuilding: (v: boolean) => void;

  // Material
  setMaterial: (material: MaterialConfig) => void;

  // Persistence
  save: () => void;
}

const defaultUI: CadUIState = {
  activeTool: "select",
  viewMode: "shaded",
  selectedFeatureId: null,
  sketchModeActive: false,
  activeSketchId: null,
  gridVisible: true,
  snapEnabled: true,
  snapValue: 1,
  units: "mm",
  constraintStatus: "under-constrained",
};

export function useCadProject(
  initialProject?: CadProject
): CadProjectState {
  const [project, setProject] = useState<CadProject>(() => {
    const proj = initialProject ?? createEmptyProject();
    // Ensure material is a MaterialConfig object (backward compat with old string format)
    if (!proj.metadata.material || typeof proj.metadata.material !== "object") {
      proj.metadata = { ...proj.metadata, material: DEFAULT_MATERIAL };
    }
    return proj;
  });
  const [uiState, setUiState] = useState<CadUIState>(defaultUI);
  const [meshes, setMeshes] = useState<TessellationResult[]>([]);
  const [isRebuilding, setIsRebuilding] = useState(false);
  const [needsRebuild, setNeedsRebuild] = useState(false);

  const historyRef = useRef<OperationHistory>(
    createHistory({
      features: project.features,
      parameters: project.parameters,
      selectedFeatureId: null,
    })
  );

  // Auto-save debounce
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const requestRebuild = useCallback(() => {
    setNeedsRebuild(true);
  }, []);

  // Debounced auto-save
  const scheduleSave = useCallback((proj: CadProject) => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToLocalStorage(proj);
    }, 2000);
  }, []);

  /**
   * Helper: update project state, commit the NEW state to history, and trigger rebuild.
   * This fixes the stale-state bug where commitToHistory() ran before setProject flushed.
   */
  const updateProjectWithHistory = useCallback(
    (updater: (prev: CadProject) => CadProject) => {
      setProject((prev) => {
        const next = updater(prev);
        historyRef.current = pushState(historyRef.current, {
          features: next.features,
          parameters: next.parameters,
          selectedFeatureId: uiState.selectedFeatureId,
        });
        scheduleSave(next);
        return next;
      });
      requestRebuild();
    },
    [uiState.selectedFeatureId, requestRebuild, scheduleSave]
  );

  const addFeature = useCallback(
    (feature: Feature) => {
      updateProjectWithHistory((prev) => ({
        ...prev,
        features: [...prev.features, feature],
      }));
    },
    [updateProjectWithHistory]
  );

  const removeFeature = useCallback(
    (featureId: string) => {
      updateProjectWithHistory((prev) => ({
        ...prev,
        // Use featureTree's removeFeature which cascades to dependent extrudes
        features: removeFeatureFromTree(prev.features, featureId),
      }));
    },
    [updateProjectWithHistory]
  );

  const updateFeature = useCallback(
    (featureId: string, updates: Partial<Feature>) => {
      updateProjectWithHistory((prev) => ({
        ...prev,
        features: prev.features.map((f) =>
          f.id === featureId ? ({ ...f, ...updates } as Feature) : f
        ),
      }));
    },
    [updateProjectWithHistory]
  );

  const undo = useCallback(() => {
    if (!canUndoHistory(historyRef.current)) return;
    historyRef.current = undoHistory(historyRef.current);
    const snap = historyRef.current.present;
    setProject((prev) => ({
      ...prev,
      features: snap.features,
      parameters: snap.parameters,
    }));
    setUiState((prev) => ({
      ...prev,
      selectedFeatureId: snap.selectedFeatureId,
    }));
    requestRebuild();
  }, [requestRebuild]);

  const redo = useCallback(() => {
    if (!canRedoHistory(historyRef.current)) return;
    historyRef.current = redoHistory(historyRef.current);
    const snap = historyRef.current.present;
    setProject((prev) => ({
      ...prev,
      features: snap.features,
      parameters: snap.parameters,
    }));
    setUiState((prev) => ({
      ...prev,
      selectedFeatureId: snap.selectedFeatureId,
    }));
    requestRebuild();
  }, [requestRebuild]);

  return {
    project,
    uiState,
    meshes,
    isRebuilding,
    setProjectName: (name) =>
      setProject((prev) => ({ ...prev, name })),
    setFeatures: (features) => {
      updateProjectWithHistory((prev) => ({ ...prev, features }));
    },
    setParameters: (parameters) => {
      updateProjectWithHistory((prev) => ({ ...prev, parameters }));
    },
    addFeature,
    removeFeature,
    updateFeature,
    undo,
    redo,
    canUndo: canUndoHistory(historyRef.current),
    canRedo: canRedoHistory(historyRef.current),
    setActiveTool: (tool) =>
      setUiState((prev) => ({ ...prev, activeTool: tool })),
    setViewMode: (mode) =>
      setUiState((prev) => ({ ...prev, viewMode: mode })),
    setSelectedFeatureId: (id) =>
      setUiState((prev) => ({ ...prev, selectedFeatureId: id })),
    setSketchModeActive: (active, sketchId) =>
      setUiState((prev) => ({
        ...prev,
        sketchModeActive: active,
        activeSketchId: sketchId ?? null,
        activeTool: active ? "line" : "select",
      })),
    toggleGrid: () =>
      setUiState((prev) => ({ ...prev, gridVisible: !prev.gridVisible })),
    toggleSnap: () =>
      setUiState((prev) => ({ ...prev, snapEnabled: !prev.snapEnabled })),
    requestRebuild,
    setMeshes,
    setIsRebuilding,
    setMaterial: (material: MaterialConfig) => {
      setProject((prev) => {
        const next = {
          ...prev,
          metadata: { ...prev.metadata, material },
        };
        scheduleSave(next);
        return next;
      });
    },
    save: () => {
      setProject((prev) => {
        saveToLocalStorage(prev);
        return prev;
      });
    },
  };
}
