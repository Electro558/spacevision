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
} from "../engine/types";
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
};

export function useCadProject(
  initialProject?: CadProject
): CadProjectState {
  const [project, setProject] = useState<CadProject>(
    initialProject ?? createEmptyProject()
  );
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
  const saveTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const commitToHistory = useCallback(() => {
    historyRef.current = pushState(historyRef.current, {
      features: project.features,
      parameters: project.parameters,
      selectedFeatureId: uiState.selectedFeatureId,
    });
  }, [project.features, project.parameters, uiState.selectedFeatureId]);

  const requestRebuild = useCallback(() => {
    setNeedsRebuild(true);
  }, []);

  // Debounced auto-save
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(() => {
      saveToLocalStorage(project);
    }, 2000);
  }, [project]);

  const addFeature = useCallback(
    (feature: Feature) => {
      setProject((prev) => ({
        ...prev,
        features: [...prev.features, feature],
      }));
      commitToHistory();
      requestRebuild();
      scheduleSave();
    },
    [commitToHistory, requestRebuild, scheduleSave]
  );

  const removeFeature = useCallback(
    (featureId: string) => {
      setProject((prev) => ({
        ...prev,
        features: prev.features.filter((f) => f.id !== featureId),
      }));
      commitToHistory();
      requestRebuild();
      scheduleSave();
    },
    [commitToHistory, requestRebuild, scheduleSave]
  );

  const updateFeature = useCallback(
    (featureId: string, updates: Partial<Feature>) => {
      setProject((prev) => ({
        ...prev,
        features: prev.features.map((f) =>
          f.id === featureId ? { ...f, ...updates } : f
        ),
      }));
      commitToHistory();
      requestRebuild();
      scheduleSave();
    },
    [commitToHistory, requestRebuild, scheduleSave]
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
      setProject((prev) => ({ ...prev, features }));
      commitToHistory();
      requestRebuild();
      scheduleSave();
    },
    setParameters: (parameters) => {
      setProject((prev) => ({ ...prev, parameters }));
      commitToHistory();
      requestRebuild();
      scheduleSave();
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
    save: () => saveToLocalStorage(project),
  };
}
