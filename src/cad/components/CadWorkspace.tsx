"use client";

import { useEffect, useState, useCallback } from "react";
import { AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { useCad } from "../context/CadContext";
import { OcctLoadingScreen } from "./OcctLoadingScreen";
import { TopToolbar } from "./TopToolbar";
import { SketchToolbar } from "./SketchToolbar";
import { CadViewport } from "./CadViewport";
import { StatusBar } from "./StatusBar";
import { ShortcutHelp } from "./ShortcutHelp";
import { AiChatPanel } from "./AiChatPanel";
import { useAiChat } from "../hooks/useAiChat";
import {
  createExtrude,
  createFillet,
} from "../engine/featureTree";
import type { SketchFeature, ViewPreset } from "../engine/types";

export function CadWorkspace() {
  const cad = useCad();
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);

  const aiChat = useAiChat({
    project: cad.project,
    addFeature: cad.addFeature,
    updateFeature: cad.updateFeature,
    removeFeature: cad.removeFeature,
  });

  // Listen for custom event to open shortcut help (from toolbar)
  useEffect(() => {
    const handler = () => setShowShortcutHelp(true);
    window.addEventListener("cad-show-shortcut-help", handler);
    return () => window.removeEventListener("cad-show-shortcut-help", handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      // Modifier combos first
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault(); cad.undo(); return;
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault(); cad.redo(); return;
      }
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); cad.save(); return;
      }

      // Don't process single-key shortcuts if modifiers are held
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // Escape
      if (e.key === "Escape") {
        if (showShortcutHelp) { setShowShortcutHelp(false); return; }
        if (cad.uiState.sketchModeActive) cad.setSketchModeActive(false);
        else cad.setSelectedFeatureId(null);
        return;
      }

      // Delete / Backspace
      if (e.key === "Delete" || e.key === "Backspace") {
        if (cad.uiState.selectedFeatureId) {
          cad.removeFeature(cad.uiState.selectedFeatureId);
          cad.setSelectedFeatureId(null);
        }
        return;
      }

      // ? — shortcut help
      if (e.key === "?") {
        e.preventDefault();
        setShowShortcutHelp((prev) => !prev);
        return;
      }

      // ---- View shortcuts (always active) ----
      const viewMap: Record<string, ViewPreset> = {
        "1": "front",
        "2": "back",
        "3": "left",
        "4": "right",
        "5": "top",
        "6": "bottom",
        "0": "iso",
      };
      if (viewMap[e.key]) {
        window.dispatchEvent(
          new CustomEvent("cad-set-view", { detail: { preset: viewMap[e.key] } })
        );
        return;
      }

      if (e.key.toLowerCase() === "g") {
        cad.toggleGrid();
        return;
      }
      if (e.key === " ") {
        e.preventDefault();
        cad.toggleSnap();
        return;
      }

      // ---- Sketch-mode-only shortcuts ----
      if (cad.uiState.sketchModeActive) {
        const toolMap: Record<string, any> = {
          l: "line",
          c: "circle",
          r: "rectangle",
          a: "arc",
          t: "trim",
          m: "mirror",
          o: "offset",
          s: "select",
          p: "polygon",
          e: "ellipse",
          n: "slot",
        };
        const key = e.key.toLowerCase();
        if (toolMap[key]) {
          cad.setActiveTool(toolMap[key]);
          return;
        }
        if (key === "x") {
          window.dispatchEvent(new CustomEvent("cad-toggle-construction-mode"));
          return;
        }
        return; // Don't fall through to feature shortcuts while in sketch mode
      }

      // ---- Feature shortcuts (only outside sketch mode) ----
      const key = e.key.toLowerCase();
      if (key === "e") {
        // Extrude
        const sketches = cad.project.features.filter(
          (f): f is SketchFeature => f.type === "sketch"
        );
        if (sketches.length === 0) {
          alert("Create a sketch first before extruding.");
          return;
        }
        const lastSketch = sketches[sketches.length - 1];
        const extrude = createExtrude(
          `Extrude ${cad.project.features.filter((f) => f.type === "extrude").length + 1}`,
          lastSketch.id,
          10,
          "add"
        );
        cad.addFeature(extrude);
        cad.setSelectedFeatureId(extrude.id);
        return;
      }
      if (key === "f") {
        // Fillet
        const hasSolid = cad.project.features.some(
          (f) => (f.type === "extrude" || f.type === "revolve") && !f.suppressed
        );
        if (!hasSolid) {
          alert("Create a solid feature first.");
          return;
        }
        const fillet = createFillet(2);
        cad.addFeature(fillet);
        cad.setSelectedFeatureId(fillet.id);
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cad, showShortcutHelp]);

  if (cad.occtStatus === "loading" || cad.occtStatus === "idle") {
    return <OcctLoadingScreen progress={cad.occtLoadProgress} message={cad.occtLoadMessage} error={null} />;
  }
  if (cad.occtStatus === "error") {
    return <OcctLoadingScreen progress={0} message="" error={cad.occtError} />;
  }

  return (
    <div className="flex h-full flex-col">
      <TopToolbar />
      <SketchToolbar />

      <div className="flex flex-1 overflow-hidden relative">
        {/* Feature tree — left */}
        <div className="cad-panel w-56 overflow-y-auto border-r border-gray-800/50 bg-[#0f0f24]/95 p-2 text-xs backdrop-blur-sm">
          <div className="cad-panel-header text-indigo-300">Feature Tree</div>
          {cad.project.features.length === 0 ? (
            <p className="text-gray-600">No features yet.</p>
          ) : (
            cad.project.features.map((feature, featureIndex) => {
              const isRolledBack = cad.uiState.rollbackIndex >= 0 && featureIndex > cad.uiState.rollbackIndex;
              return (
              <div
                key={feature.id}
                className={`cad-tree-item mb-0.5 flex items-center rounded ${
                  isRolledBack ? "opacity-30" :
                  cad.uiState.selectedFeatureId === feature.id
                    ? "selected text-white"
                    : feature.suppressed ? "text-gray-600"
                    : "text-gray-300"
                }`}
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    cad.updateFeature(feature.id, { suppressed: !feature.suppressed });
                  }}
                  className={`flex-shrink-0 px-1 py-1 ${
                    feature.suppressed
                      ? "text-gray-600 hover:text-gray-400"
                      : "text-gray-400 hover:text-white"
                  }`}
                  title={feature.suppressed ? "Unsuppress feature" : "Suppress feature"}
                >
                  {feature.suppressed ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                      <line x1="1" y1="1" x2="23" y2="23" />
                    </svg>
                  ) : (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
                <span
                  onClick={() => cad.setSelectedFeatureId(feature.id)}
                  className={`cursor-pointer flex-1 py-1 pr-2 ${
                    feature.suppressed ? "line-through" : ""
                  }`}
                >
                  {feature.type === "sketch" ? "✏" : feature.type === "extrude" ? "⬆" : feature.type === "revolve" ? "↻" : feature.type === "fillet" ? "◠" : feature.type === "chamfer" ? "◇" : feature.type === "loft" ? "⋈" : feature.type === "sweep" ? "↝" : feature.type === "shell" ? "☐" : feature.type === "linearPattern" ? "⫼" : feature.type === "circularPattern" ? "◎" : feature.type === "mirrorBody" ? "⟺" : feature.type === "hole" ? "⊙" : feature.type === "boolean" ? "⊕" : feature.type === "primitive" ? "⊞" : feature.type === "thread" ? "⏚" : feature.type === "rib" ? "▤" : feature.type === "dome" ? "⌓" : "●"} {feature.name}
                </span>
              </div>
              );
            })
          )}
          {/* Rollback bar */}
          {cad.project.features.length > 0 && (
            <div className="mt-3 mb-2 rounded-lg bg-gradient-to-b from-indigo-950/30 to-transparent p-2">
              <div className="flex items-center justify-between mb-2">
                <span className="cad-label">Rollback</span>
                {cad.uiState.rollbackIndex >= 0 && (
                  <button
                    onClick={() => cad.setRollbackIndex(-1)}
                    className="cad-toolbar-btn rounded px-2 py-0.5 text-[10px] text-indigo-400 hover:text-indigo-300 hover:bg-indigo-900/30"
                  >
                    Reset
                  </button>
                )}
              </div>
              <input
                type="range"
                min={0}
                max={cad.project.features.length - 1}
                value={cad.uiState.rollbackIndex >= 0 ? cad.uiState.rollbackIndex : cad.project.features.length - 1}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  cad.setRollbackIndex(val === cad.project.features.length - 1 ? -1 : val);
                }}
                className="cad-slider w-full"
              />
              <div className="mt-1 text-[10px] text-indigo-400/60">
                {cad.uiState.rollbackIndex >= 0
                  ? `Showing ${cad.uiState.rollbackIndex + 1} of ${cad.project.features.length} features`
                  : `All ${cad.project.features.length} features`}
              </div>
            </div>
          )}
          <div className="cad-panel-header mt-4 text-indigo-300">Parameters</div>
          {Object.entries(cad.project.parameters).map(([name, param]) => (
            <div key={name} className="flex justify-between px-2 py-0.5 text-gray-400">
              <span>{name}</span>
              <span className="text-green-400">{param.value} {param.unit}</span>
            </div>
          ))}
        </div>

        {/* 3D Viewport */}
        <div className="relative flex-1 bg-[#0d0d1a]">
          <CadViewport />
        </div>

        {/* Properties — right */}
        <div className="cad-panel w-52 overflow-y-auto border-l border-gray-800/50 bg-[#0f0f24]/95 p-2 text-xs backdrop-blur-sm">
          <div className="cad-panel-header text-indigo-300">Properties</div>
          {cad.uiState.selectedFeatureId ? (
            (() => {
              const feature = cad.project.features.find((f) => f.id === cad.uiState.selectedFeatureId);
              if (!feature) return <p className="text-gray-600">Not found</p>;
              return (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-gray-400">{feature.type}: {feature.name}</p>
                    <span className={`cad-badge ${feature.suppressed ? 'suppressed' : 'active'}`}>
                      {feature.suppressed ? 'Suppressed' : 'Active'}
                    </span>
                  </div>
                  {/* Editable name */}
                  <div className="mb-3">
                    <label className="cad-label">Name</label>
                    <input
                      className="cad-input mt-1 w-full"
                      value={feature.name}
                      onChange={(e) => cad.updateFeature(feature.id, { name: e.target.value })}
                    />
                  </div>
                  {/* Per-feature color override */}
                  {feature.type !== "sketch" && (
                    <div className="mb-3">
                      <label className="cad-label">Color Override</label>
                      <div className="mt-1 flex items-center gap-2">
                        <input
                          type="color"
                          className="cad-color-picker h-7 w-9 bg-transparent"
                          value={(feature as any).colorOverride || cad.project.metadata.material?.color || "#6366f1"}
                          onChange={(e) => cad.updateFeature(feature.id, { colorOverride: e.target.value } as any)}
                        />
                        <span className="text-indigo-300/60 text-[10px]">{(feature as any).colorOverride || "Default"}</span>
                        {(feature as any).colorOverride && (
                          <button
                            onClick={() => cad.updateFeature(feature.id, { colorOverride: undefined } as any)}
                            className="cad-toolbar-btn rounded px-1.5 py-0.5 text-[10px] text-red-400 hover:text-red-300 hover:bg-red-900/20"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  {feature.type === "sketch" && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-gray-400">
                        <span>Plane</span><span className="text-green-400">{feature.sketch.plane}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Entities</span><span>{feature.sketch.entities.length}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Points</span><span>{feature.sketch.points.length}</span>
                      </div>
                      <button
                        onClick={() => {
                          cad.setSelectedFeatureId(feature.id);
                          cad.setSketchModeActive(true, feature.id);
                        }}
                        className="cad-toolbar-btn mt-3 w-full rounded-lg border border-indigo-600/40 bg-gradient-to-r from-indigo-800/60 to-indigo-700/40 px-2 py-1.5 text-indigo-100 hover:from-indigo-700/60 hover:to-indigo-600/50"
                      >
                        Edit Sketch
                      </button>
                    </div>
                  )}
                  {feature.type === "extrude" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Depth</label>
                        <input
                          type="number"
                          className="cad-input mt-1 w-full"
                          value={typeof feature.depth === 'number' ? feature.depth : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { depth: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="cad-label">Direction</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.direction}
                          onChange={(e) => cad.updateFeature(feature.id, { direction: e.target.value as any })}
                        >
                          <option value="normal">Normal</option>
                          <option value="reverse">Reverse</option>
                          <option value="symmetric">Symmetric</option>
                        </select>
                      </div>
                      <div>
                        <label className="cad-label">Operation</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.operation}
                          onChange={(e) => cad.updateFeature(feature.id, { operation: e.target.value as any })}
                        >
                          <option value="add">Add (Union)</option>
                          <option value="cut">Cut (Subtract)</option>
                        </select>
                      </div>
                      <div>
                        <label className="cad-label">Draft Angle (deg)</label>
                        <input
                          type="number"
                          step="0.5"
                          className="cad-input mt-1 w-full"
                          value={feature.draftAngle ?? 0}
                          onChange={(e) => cad.updateFeature(feature.id, { draftAngle: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}
                  {feature.type === "revolve" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Angle (degrees)</label>
                        <input
                          type="number"
                          className="cad-input mt-1 w-full"
                          value={typeof feature.angle === 'number' ? feature.angle : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { angle: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="cad-label">Axis</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.axis}
                          onChange={(e) => cad.updateFeature(feature.id, { axis: e.target.value as any })}
                        >
                          <option value="x">X Axis</option>
                          <option value="y">Y Axis</option>
                          <option value="z">Z Axis</option>
                          <option value="sketch-x">Sketch X</option>
                          <option value="sketch-y">Sketch Y</option>
                        </select>
                      </div>
                      <div>
                        <label className="cad-label">Direction</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.direction}
                          onChange={(e) => cad.updateFeature(feature.id, { direction: e.target.value as any })}
                        >
                          <option value="normal">Normal</option>
                          <option value="reverse">Reverse</option>
                          <option value="symmetric">Symmetric</option>
                        </select>
                      </div>
                      <div>
                        <label className="cad-label">Operation</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.operation}
                          onChange={(e) => cad.updateFeature(feature.id, { operation: e.target.value as any })}
                        >
                          <option value="add">Add (Union)</option>
                          <option value="cut">Cut (Subtract)</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {feature.type === "fillet" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Radius</label>
                        <input
                          type="number"
                          step="0.1"
                          className="cad-input mt-1 w-full"
                          value={typeof feature.radius === 'number' ? feature.radius : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { radius: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Edges</span><span className="text-green-400">{feature.edgeIds[0] === 'all' ? 'All edges' : `${feature.edgeIds.length} edges`}</span>
                      </div>
                    </div>
                  )}
                  {feature.type === "chamfer" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Distance</label>
                        <input
                          type="number"
                          step="0.1"
                          className="cad-input mt-1 w-full"
                          value={typeof feature.distance === 'number' ? feature.distance : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { distance: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Edges</span><span className="text-green-400">{feature.edgeIds[0] === 'all' ? 'All edges' : `${feature.edgeIds.length} edges`}</span>
                      </div>
                    </div>
                  )}
                  {feature.type === "loft" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-gray-400">
                        <span>Profiles</span><span className="text-green-400">{feature.sketchIds.length} sketches</span>
                      </div>
                      <div>
                        <label className="cad-label">Solid</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.solid ? "true" : "false"}
                          onChange={(e) => cad.updateFeature(feature.id, { solid: e.target.value === "true" })}
                        >
                          <option value="true">Solid</option>
                          <option value="false">Surface</option>
                        </select>
                      </div>
                      <div>
                        <label className="cad-label">Operation</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.operation}
                          onChange={(e) => cad.updateFeature(feature.id, { operation: e.target.value as any })}
                        >
                          <option value="add">Add (Union)</option>
                          <option value="cut">Cut (Subtract)</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {feature.type === "sweep" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-gray-400">
                        <span>Profile</span><span className="text-green-400">Sketch</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Path</span><span className="text-green-400">Sketch</span>
                      </div>
                      <div>
                        <label className="cad-label">Operation</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.operation}
                          onChange={(e) => cad.updateFeature(feature.id, { operation: e.target.value as any })}
                        >
                          <option value="add">Add (Union)</option>
                          <option value="cut">Cut (Subtract)</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {feature.type === "shell" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Wall Thickness</label>
                        <input
                          type="number"
                          step="0.1"
                          className="cad-input mt-1 w-full"
                          value={typeof feature.thickness === 'number' ? feature.thickness : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { thickness: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}
                  {feature.type === "linearPattern" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Count</label>
                        <input
                          type="number"
                          min="2"
                          className="cad-input mt-1 w-full"
                          value={feature.count}
                          onChange={(e) => cad.updateFeature(feature.id, { count: parseInt(e.target.value) || 2 })}
                        />
                      </div>
                      <div>
                        <label className="cad-label">Spacing</label>
                        <input
                          type="number"
                          step="0.5"
                          className="cad-input mt-1 w-full"
                          value={typeof feature.spacing === 'number' ? feature.spacing : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { spacing: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="cad-label">Direction</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.direction}
                          onChange={(e) => cad.updateFeature(feature.id, { direction: e.target.value as any })}
                        >
                          <option value="x">X Axis</option>
                          <option value="y">Y Axis</option>
                          <option value="z">Z Axis</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {feature.type === "circularPattern" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Count</label>
                        <input
                          type="number"
                          min="2"
                          className="cad-input mt-1 w-full"
                          value={feature.count}
                          onChange={(e) => cad.updateFeature(feature.id, { count: parseInt(e.target.value) || 2 })}
                        />
                      </div>
                      <div>
                        <label className="cad-label">Angle (total)</label>
                        <input
                          type="number"
                          className="cad-input mt-1 w-full"
                          value={typeof feature.angle === 'number' ? feature.angle : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { angle: parseFloat(e.target.value) || 360 })}
                        />
                      </div>
                      <div>
                        <label className="cad-label">Axis</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.axis}
                          onChange={(e) => cad.updateFeature(feature.id, { axis: e.target.value as any })}
                        >
                          <option value="x">X Axis</option>
                          <option value="y">Y Axis</option>
                          <option value="z">Z Axis</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {feature.type === "mirrorBody" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Mirror Plane</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.plane}
                          onChange={(e) => cad.updateFeature(feature.id, { plane: e.target.value as any })}
                        >
                          <option value="XY">XY Plane</option>
                          <option value="XZ">XZ Plane</option>
                          <option value="YZ">YZ Plane</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {feature.type === "hole" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Hole Type</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.holeType}
                          onChange={(e) => cad.updateFeature(feature.id, { holeType: e.target.value as any })}
                        >
                          <option value="simple">Simple</option>
                          <option value="counterbore">Counterbore</option>
                          <option value="countersink">Countersink</option>
                        </select>
                      </div>
                      <div>
                        <label className="cad-label">Diameter</label>
                        <input
                          type="number"
                          step="0.5"
                          className="cad-input mt-1 w-full"
                          value={typeof feature.diameter === 'number' ? feature.diameter : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { diameter: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="cad-label">Depth</label>
                        <input
                          type="number"
                          step="0.5"
                          className="cad-input mt-1 w-full"
                          value={typeof feature.depth === 'number' ? feature.depth : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { depth: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="cad-label">Position X</label>
                        <input
                          type="number"
                          step="1"
                          className="cad-input mt-1 w-full"
                          value={feature.position.x}
                          onChange={(e) => cad.updateFeature(feature.id, { position: { ...feature.position, x: parseFloat(e.target.value) || 0 } } as any)}
                        />
                      </div>
                      <div>
                        <label className="cad-label">Position Y</label>
                        <input
                          type="number"
                          step="1"
                          className="cad-input mt-1 w-full"
                          value={feature.position.y}
                          onChange={(e) => cad.updateFeature(feature.id, { position: { ...feature.position, y: parseFloat(e.target.value) || 0 } } as any)}
                        />
                      </div>
                      <div>
                        <label className="cad-label">Plane</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.plane}
                          onChange={(e) => cad.updateFeature(feature.id, { plane: e.target.value as any })}
                        >
                          <option value="XY">XY</option>
                          <option value="XZ">XZ</option>
                          <option value="YZ">YZ</option>
                        </select>
                      </div>
                      {feature.holeType === "counterbore" && (
                        <>
                          <div>
                            <label className="cad-label">CB Diameter</label>
                            <input
                              type="number"
                              step="0.5"
                              className="cad-input mt-1 w-full"
                              value={feature.counterboreDiameter ?? 10}
                              onChange={(e) => cad.updateFeature(feature.id, { counterboreDiameter: parseFloat(e.target.value) || 0 } as any)}
                            />
                          </div>
                          <div>
                            <label className="cad-label">CB Depth</label>
                            <input
                              type="number"
                              step="0.5"
                              className="cad-input mt-1 w-full"
                              value={feature.counterboreDepth ?? 3}
                              onChange={(e) => cad.updateFeature(feature.id, { counterboreDepth: parseFloat(e.target.value) || 0 } as any)}
                            />
                          </div>
                        </>
                      )}
                      {feature.holeType === "countersink" && (
                        <>
                          <div>
                            <label className="cad-label">CS Diameter</label>
                            <input
                              type="number"
                              step="0.5"
                              className="cad-input mt-1 w-full"
                              value={feature.countersinkDiameter ?? 10}
                              onChange={(e) => cad.updateFeature(feature.id, { countersinkDiameter: parseFloat(e.target.value) || 0 } as any)}
                            />
                          </div>
                          <div>
                            <label className="cad-label">CS Angle (deg)</label>
                            <input
                              type="number"
                              step="1"
                              className="cad-input mt-1 w-full"
                              value={feature.countersinkAngle ?? 82}
                              onChange={(e) => cad.updateFeature(feature.id, { countersinkAngle: parseFloat(e.target.value) || 82 } as any)}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}
                  {feature.type === "boolean" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Operation</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.operation}
                          onChange={(e) => cad.updateFeature(feature.id, { operation: e.target.value as any })}
                        >
                          <option value="union">Union</option>
                          <option value="subtract">Subtract</option>
                          <option value="intersect">Intersect</option>
                        </select>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Target</span><span className="text-green-400 truncate max-w-20">{feature.targetFeatureId.slice(-6)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Tool</span><span className="text-green-400 truncate max-w-20">{feature.toolFeatureId.slice(-6)}</span>
                      </div>
                    </div>
                  )}
                  {feature.type === "primitive" && (
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-gray-400">
                        <span>Shape</span><span className="text-green-400">{feature.primitiveType}</span>
                      </div>
                      <div>
                        <label className="cad-label">Operation</label>
                        <select
                          className="cad-select mt-1 w-full"
                          value={feature.operation}
                          onChange={(e) => cad.updateFeature(feature.id, { operation: e.target.value as any })}
                        >
                          <option value="add">Add (Union)</option>
                          <option value="cut">Cut (Subtract)</option>
                        </select>
                      </div>
                      {(feature.primitiveType === "box" || feature.primitiveType === "wedge") && (
                        <>
                          <div>
                            <label className="cad-label">Width</label>
                            <input type="number" step="1" className="cad-input mt-1 w-full" value={feature.width ?? 20} onChange={(e) => cad.updateFeature(feature.id, { width: parseFloat(e.target.value) || 0 } as any)} />
                          </div>
                          <div>
                            <label className="cad-label">Height</label>
                            <input type="number" step="1" className="cad-input mt-1 w-full" value={feature.height ?? 20} onChange={(e) => cad.updateFeature(feature.id, { height: parseFloat(e.target.value) || 0 } as any)} />
                          </div>
                          <div>
                            <label className="cad-label">Length</label>
                            <input type="number" step="1" className="cad-input mt-1 w-full" value={feature.length ?? 20} onChange={(e) => cad.updateFeature(feature.id, { length: parseFloat(e.target.value) || 0 } as any)} />
                          </div>
                          {feature.primitiveType === "wedge" && (
                            <div>
                              <label className="cad-label">Top Length (ltx)</label>
                              <input type="number" step="1" className="cad-input mt-1 w-full" value={feature.ltx ?? 10} onChange={(e) => cad.updateFeature(feature.id, { ltx: parseFloat(e.target.value) || 0 } as any)} />
                            </div>
                          )}
                        </>
                      )}
                      {(feature.primitiveType === "cylinder" || feature.primitiveType === "cone" || feature.primitiveType === "pipe") && (
                        <>
                          <div>
                            <label className="cad-label">Radius</label>
                            <input type="number" step="0.5" className="cad-input mt-1 w-full" value={feature.radius ?? 10} onChange={(e) => cad.updateFeature(feature.id, { radius: parseFloat(e.target.value) || 0 } as any)} />
                          </div>
                          <div>
                            <label className="cad-label">Depth</label>
                            <input type="number" step="1" className="cad-input mt-1 w-full" value={feature.depth ?? 20} onChange={(e) => cad.updateFeature(feature.id, { depth: parseFloat(e.target.value) || 0 } as any)} />
                          </div>
                          {(feature.primitiveType === "cone" || feature.primitiveType === "pipe") && (
                            <div>
                              <label className="cad-label">{feature.primitiveType === "cone" ? "Top Radius" : "Inner Radius"}</label>
                              <input type="number" step="0.5" className="cad-input mt-1 w-full" value={feature.radius2 ?? 0} onChange={(e) => cad.updateFeature(feature.id, { radius2: parseFloat(e.target.value) || 0 } as any)} />
                            </div>
                          )}
                        </>
                      )}
                      {feature.primitiveType === "sphere" && (
                        <div>
                          <label className="cad-label">Radius</label>
                          <input type="number" step="0.5" className="cad-input mt-1 w-full" value={feature.radius ?? 10} onChange={(e) => cad.updateFeature(feature.id, { radius: parseFloat(e.target.value) || 0 } as any)} />
                        </div>
                      )}
                      {feature.primitiveType === "torus" && (
                        <>
                          <div>
                            <label className="cad-label">Major Radius</label>
                            <input type="number" step="0.5" className="cad-input mt-1 w-full" value={feature.radius ?? 15} onChange={(e) => cad.updateFeature(feature.id, { radius: parseFloat(e.target.value) || 0 } as any)} />
                          </div>
                          <div>
                            <label className="cad-label">Minor Radius</label>
                            <input type="number" step="0.5" className="cad-input mt-1 w-full" value={feature.radius2 ?? 5} onChange={(e) => cad.updateFeature(feature.id, { radius2: parseFloat(e.target.value) || 0 } as any)} />
                          </div>
                        </>
                      )}
                      <div>
                        <label className="cad-label">Position X</label>
                        <input type="number" step="1" className="cad-input mt-1 w-full" value={feature.position.x} onChange={(e) => cad.updateFeature(feature.id, { position: { ...feature.position, x: parseFloat(e.target.value) || 0 } } as any)} />
                      </div>
                      <div>
                        <label className="cad-label">Position Y</label>
                        <input type="number" step="1" className="cad-input mt-1 w-full" value={feature.position.y} onChange={(e) => cad.updateFeature(feature.id, { position: { ...feature.position, y: parseFloat(e.target.value) || 0 } } as any)} />
                      </div>
                      <div>
                        <label className="cad-label">Position Z</label>
                        <input type="number" step="1" className="cad-input mt-1 w-full" value={feature.position.z} onChange={(e) => cad.updateFeature(feature.id, { position: { ...feature.position, z: parseFloat(e.target.value) || 0 } } as any)} />
                      </div>
                    </div>
                  )}
                  {feature.type === "thread" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Diameter</label>
                        <input type="number" step="0.5" className="cad-input mt-1 w-full" value={feature.diameter} onChange={(e) => cad.updateFeature(feature.id, { diameter: parseFloat(e.target.value) || 0 } as any)} />
                      </div>
                      <div>
                        <label className="cad-label">Pitch</label>
                        <input type="number" step="0.25" className="cad-input mt-1 w-full" value={feature.pitch} onChange={(e) => cad.updateFeature(feature.id, { pitch: parseFloat(e.target.value) || 0 } as any)} />
                      </div>
                      <div>
                        <label className="cad-label">Length</label>
                        <input type="number" step="1" className="cad-input mt-1 w-full" value={feature.length} onChange={(e) => cad.updateFeature(feature.id, { length: parseFloat(e.target.value) || 0 } as any)} />
                      </div>
                      <div>
                        <label className="cad-label">Axis</label>
                        <select className="cad-select mt-1 w-full" value={feature.axis} onChange={(e) => cad.updateFeature(feature.id, { axis: e.target.value as any })}>
                          <option value="x">X</option>
                          <option value="y">Y</option>
                          <option value="z">Z</option>
                        </select>
                      </div>
                      <div>
                        <label className="cad-label">Type</label>
                        <select className="cad-select mt-1 w-full" value={feature.internal ? "internal" : "external"} onChange={(e) => cad.updateFeature(feature.id, { internal: e.target.value === "internal" } as any)}>
                          <option value="external">External</option>
                          <option value="internal">Internal</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {feature.type === "rib" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Thickness</label>
                        <input type="number" step="0.5" className="cad-input mt-1 w-full" value={typeof feature.thickness === 'number' ? feature.thickness : ''} onChange={(e) => cad.updateFeature(feature.id, { thickness: parseFloat(e.target.value) || 0 })} />
                      </div>
                      <div>
                        <label className="cad-label">Direction</label>
                        <select className="cad-select mt-1 w-full" value={feature.direction} onChange={(e) => cad.updateFeature(feature.id, { direction: e.target.value as any })}>
                          <option value="normal">Normal</option>
                          <option value="reverse">Reverse</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {feature.type === "dome" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="cad-label">Height</label>
                        <input type="number" step="0.5" className="cad-input mt-1 w-full" value={feature.height} onChange={(e) => cad.updateFeature(feature.id, { height: parseFloat(e.target.value) || 0 })} />
                      </div>
                    </div>
                  )}
                  {/* Delete button */}
                  <button
                    onClick={() => {
                      cad.removeFeature(feature.id);
                      cad.setSelectedFeatureId(null);
                    }}
                    className="cad-delete-btn mt-4 w-full rounded-lg border border-red-800/50 bg-gradient-to-r from-red-950/60 to-red-900/40 px-2 py-1.5 text-red-300 hover:from-red-900/60 hover:to-red-800/50 hover:text-red-200"
                  >
                    Delete Feature
                  </button>
                </div>
              );
            })()
          ) : <p className="text-gray-600">Select a feature</p>}
        </div>
      </div>

      {/* AI Panel — animated slide-in from right */}
      <AnimatePresence>
        {showAiPanel && (
          <div className="absolute right-0 top-0 bottom-0 z-20 flex">
            <AiChatPanel
              messages={aiChat.messages}
              isStreaming={aiChat.isStreaming}
              input={aiChat.input}
              setInput={aiChat.setInput}
              sendMessage={aiChat.sendMessage}
              stop={aiChat.stop}
              clearHistory={aiChat.clearHistory}
              onClose={() => setShowAiPanel(false)}
            />
          </div>
        )}
      </AnimatePresence>

      <StatusBar />

      {/* AI toggle button — floating bottom-right */}
      <button
        onClick={() => setShowAiPanel((prev) => !prev)}
        title="AI CAD Assistant"
        className={`absolute bottom-10 right-4 z-30 flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-medium shadow-lg transition-all duration-200 ${
          showAiPanel
            ? "bg-indigo-600 text-white border border-indigo-400/50 shadow-indigo-900/40"
            : "bg-[#0f0f24]/90 text-indigo-400 border border-indigo-500/30 hover:bg-indigo-600/20 hover:text-indigo-300 animate-pulse-glow"
        }`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {showAiPanel ? "Close AI" : "AI Assistant"}
        {aiChat.isStreaming && (
          <span className="ml-1 h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
        )}
      </button>

      {showShortcutHelp && (
        <ShortcutHelp onClose={() => setShowShortcutHelp(false)} />
      )}
    </div>
  );
}
