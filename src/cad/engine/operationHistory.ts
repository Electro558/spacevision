// src/cad/engine/operationHistory.ts

import type { Feature, Parameter } from "./types";

export interface HistorySnapshot {
  features: Feature[];
  parameters: Record<string, Parameter>;
  selectedFeatureId: string | null;
}

export interface OperationHistory {
  past: HistorySnapshot[];
  present: HistorySnapshot;
  future: HistorySnapshot[];
}

/**
 * Creates a new history with an initial state.
 */
export function createHistory(initial: HistorySnapshot): OperationHistory {
  return {
    past: [],
    present: initial,
    future: [],
  };
}

/**
 * Pushes a new state, clearing the future (redo) stack.
 */
export function pushState(
  history: OperationHistory,
  state: HistorySnapshot
): OperationHistory {
  return {
    past: [...history.past, history.present],
    present: state,
    future: [], // clear redo stack
  };
}

/**
 * Undo: moves present to future, pops past into present.
 */
export function undo(history: OperationHistory): OperationHistory {
  if (history.past.length === 0) return history;
  const previous = history.past[history.past.length - 1];
  return {
    past: history.past.slice(0, -1),
    present: previous,
    future: [history.present, ...history.future],
  };
}

/**
 * Redo: moves present to past, pops future into present.
 */
export function redo(history: OperationHistory): OperationHistory {
  if (history.future.length === 0) return history;
  const next = history.future[0];
  return {
    past: [...history.past, history.present],
    present: next,
    future: history.future.slice(1),
  };
}

/**
 * Returns whether undo is available.
 */
export function canUndo(history: OperationHistory): boolean {
  return history.past.length > 0;
}

/**
 * Returns whether redo is available.
 */
export function canRedo(history: OperationHistory): boolean {
  return history.future.length > 0;
}
