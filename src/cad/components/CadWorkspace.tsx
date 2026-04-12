"use client";

import { useEffect, useState, useCallback } from "react";
import { useCad } from "../context/CadContext";
import { OcctLoadingScreen } from "./OcctLoadingScreen";
import { TopToolbar } from "./TopToolbar";
import { SketchToolbar } from "./SketchToolbar";
import { CadViewport } from "./CadViewport";
import { StatusBar } from "./StatusBar";
import { ShortcutHelp } from "./ShortcutHelp";
import {
  createExtrude,
  createFillet,
} from "../engine/featureTree";
import type { SketchFeature, ViewPreset } from "../engine/types";

export function CadWorkspace() {
  const cad = useCad();
  const [showShortcutHelp, setShowShortcutHelp] = useState(false);

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

      <div className="flex flex-1 overflow-hidden">
        {/* Feature tree — left */}
        <div className="w-56 overflow-y-auto border-r border-gray-800 bg-[#12122a] p-2 text-xs">
          <div className="mb-2 font-bold text-indigo-400">Feature Tree</div>
          {cad.project.features.length === 0 ? (
            <p className="text-gray-600">No features yet.</p>
          ) : (
            cad.project.features.map((feature) => (
              <div
                key={feature.id}
                className={`mb-0.5 flex items-center rounded ${
                  cad.uiState.selectedFeatureId === feature.id
                    ? "bg-indigo-900/50 text-white"
                    : feature.suppressed ? "text-gray-600"
                    : "text-gray-300 hover:bg-gray-800"
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
                  {feature.type === "sketch" ? "✏" : feature.type === "extrude" ? "⬆" : feature.type === "revolve" ? "↻" : feature.type === "fillet" ? "◠" : feature.type === "chamfer" ? "◇" : feature.type === "loft" ? "⋈" : feature.type === "sweep" ? "↝" : feature.type === "shell" ? "☐" : feature.type === "linearPattern" ? "⫼" : feature.type === "circularPattern" ? "◎" : feature.type === "mirrorBody" ? "⟺" : "●"} {feature.name}
                </span>
              </div>
            ))
          )}
          <div className="mb-2 mt-4 font-bold text-indigo-400">Parameters</div>
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
        <div className="w-52 overflow-y-auto border-l border-gray-800 bg-[#12122a] p-2 text-xs">
          <div className="mb-2 font-bold text-indigo-400">Properties</div>
          {cad.uiState.selectedFeatureId ? (
            (() => {
              const feature = cad.project.features.find((f) => f.id === cad.uiState.selectedFeatureId);
              if (!feature) return <p className="text-gray-600">Not found</p>;
              return (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-gray-400">{feature.type}: {feature.name}</p>
                    <span className={`rounded px-1.5 py-0.5 text-[10px] ${feature.suppressed ? 'bg-gray-700 text-gray-500' : 'bg-indigo-900/50 text-indigo-300'}`}>
                      {feature.suppressed ? 'Suppressed' : 'Active'}
                    </span>
                  </div>
                  {/* Editable name */}
                  <div className="mb-2">
                    <label className="text-gray-500">Name</label>
                    <input
                      className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                      value={feature.name}
                      onChange={(e) => cad.updateFeature(feature.id, { name: e.target.value })}
                    />
                  </div>
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
                        className="mt-2 w-full rounded bg-indigo-700 px-2 py-1 text-indigo-100 hover:bg-indigo-600"
                      >
                        Edit Sketch
                      </button>
                    </div>
                  )}
                  {feature.type === "extrude" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-gray-500">Depth</label>
                        <input
                          type="number"
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          value={typeof feature.depth === 'number' ? feature.depth : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { depth: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500">Direction</label>
                        <select
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
                          value={feature.direction}
                          onChange={(e) => cad.updateFeature(feature.id, { direction: e.target.value as any })}
                        >
                          <option value="normal">Normal</option>
                          <option value="reverse">Reverse</option>
                          <option value="symmetric">Symmetric</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-500">Operation</label>
                        <select
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
                          value={feature.operation}
                          onChange={(e) => cad.updateFeature(feature.id, { operation: e.target.value as any })}
                        >
                          <option value="add">Add (Union)</option>
                          <option value="cut">Cut (Subtract)</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {feature.type === "revolve" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-gray-500">Angle (degrees)</label>
                        <input
                          type="number"
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          value={typeof feature.angle === 'number' ? feature.angle : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { angle: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500">Axis</label>
                        <select
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
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
                        <label className="text-gray-500">Direction</label>
                        <select
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
                          value={feature.direction}
                          onChange={(e) => cad.updateFeature(feature.id, { direction: e.target.value as any })}
                        >
                          <option value="normal">Normal</option>
                          <option value="reverse">Reverse</option>
                          <option value="symmetric">Symmetric</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-500">Operation</label>
                        <select
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
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
                        <label className="text-gray-500">Radius</label>
                        <input
                          type="number"
                          step="0.1"
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
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
                        <label className="text-gray-500">Distance</label>
                        <input
                          type="number"
                          step="0.1"
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
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
                        <label className="text-gray-500">Solid</label>
                        <select
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
                          value={feature.solid ? "true" : "false"}
                          onChange={(e) => cad.updateFeature(feature.id, { solid: e.target.value === "true" })}
                        >
                          <option value="true">Solid</option>
                          <option value="false">Surface</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-gray-500">Operation</label>
                        <select
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
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
                        <label className="text-gray-500">Operation</label>
                        <select
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
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
                        <label className="text-gray-500">Wall Thickness</label>
                        <input
                          type="number"
                          step="0.1"
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          value={typeof feature.thickness === 'number' ? feature.thickness : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { thickness: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  )}
                  {feature.type === "linearPattern" && (
                    <div className="space-y-1.5">
                      <div>
                        <label className="text-gray-500">Count</label>
                        <input
                          type="number"
                          min="2"
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          value={feature.count}
                          onChange={(e) => cad.updateFeature(feature.id, { count: parseInt(e.target.value) || 2 })}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500">Spacing</label>
                        <input
                          type="number"
                          step="0.5"
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          value={typeof feature.spacing === 'number' ? feature.spacing : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { spacing: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500">Direction</label>
                        <select
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
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
                        <label className="text-gray-500">Count</label>
                        <input
                          type="number"
                          min="2"
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          value={feature.count}
                          onChange={(e) => cad.updateFeature(feature.id, { count: parseInt(e.target.value) || 2 })}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500">Angle (total)</label>
                        <input
                          type="number"
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none focus:ring-1 focus:ring-indigo-500"
                          value={typeof feature.angle === 'number' ? feature.angle : ''}
                          onChange={(e) => cad.updateFeature(feature.id, { angle: parseFloat(e.target.value) || 360 })}
                        />
                      </div>
                      <div>
                        <label className="text-gray-500">Axis</label>
                        <select
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
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
                        <label className="text-gray-500">Mirror Plane</label>
                        <select
                          className="mt-0.5 w-full rounded bg-gray-800 px-2 py-1 text-white outline-none"
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
                  {/* Delete button */}
                  <button
                    onClick={() => {
                      cad.removeFeature(feature.id);
                      cad.setSelectedFeatureId(null);
                    }}
                    className="mt-3 w-full rounded bg-red-900/60 px-2 py-1 text-red-300 hover:bg-red-800"
                  >
                    Delete Feature
                  </button>
                </div>
              );
            })()
          ) : <p className="text-gray-600">Select a feature</p>}
        </div>
      </div>

      <StatusBar />

      {showShortcutHelp && (
        <ShortcutHelp onClose={() => setShowShortcutHelp(false)} />
      )}
    </div>
  );
}
