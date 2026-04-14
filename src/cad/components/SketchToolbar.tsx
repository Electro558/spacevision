"use client";

import { useState, useEffect } from "react";
import { useCad } from "../context/CadContext";
import type { CadTool } from "../engine/types";

const SKETCH_TOOLS: { tool: CadTool; label: string; icon: string }[] = [
  { tool: "select", label: "Select", icon: "↖" },
  { tool: "line", label: "Line", icon: "╱" },
  { tool: "circle", label: "Circle", icon: "○" },
  { tool: "rectangle", label: "Rectangle", icon: "▭" },
  { tool: "arc", label: "Arc", icon: "⌒" },
  { tool: "trim", label: "Trim", icon: "✂" },
  { tool: "mirror", label: "Mirror", icon: "⟺" },
  { tool: "offset", label: "Offset", icon: "⟐" },
  { tool: "spline", label: "Spline", icon: "〰" },
  { tool: "sketch-fillet", label: "Fillet", icon: "◠" },
  { tool: "sketch-chamfer", label: "Chamfer", icon: "◇" },
  { tool: "polygon", label: "Polygon", icon: "⬡" },
  { tool: "ellipse", label: "Ellipse", icon: "⬮" },
  { tool: "slot", label: "Slot", icon: "⊖" },
];

export function SketchToolbar() {
  const cad = useCad();
  const [constructionMode, setConstructionMode] = useState(false);

  // Broadcast construction mode to useSketchMode via custom event
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("cad-construction-mode", { detail: { active: constructionMode } }));
  }, [constructionMode]);

  if (!cad.uiState.sketchModeActive) return null;

  const isSelectMode = cad.uiState.activeTool === "select";

  const handleDeleteSelected = () => {
    window.dispatchEvent(new CustomEvent("cad-delete-selected-entities"));
  };

  return (
    <div className="flex h-9 items-center border-b border-indigo-900/30 bg-gradient-to-r from-[#11112a] via-[#16163a] to-[#11112a] px-4 text-xs backdrop-blur-sm">
      <span className="mr-3 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent font-medium">Sketch Tools:</span>
      {SKETCH_TOOLS.map(({ tool, label, icon }) => (
        <button
          key={tool}
          onClick={() => cad.setActiveTool(tool)}
          className={`cad-sketch-btn mr-1 flex items-center gap-1 rounded-md px-2 py-1 ${
            cad.uiState.activeTool === tool
              ? "active bg-indigo-700/60 text-white"
              : "bg-indigo-950/30 text-gray-400 hover:text-indigo-200"
          }`}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}

      {/* Construction mode toggle */}
      <button
        onClick={() => setConstructionMode(!constructionMode)}
        className={`cad-sketch-btn mr-1 flex items-center gap-1 rounded-md px-2 py-1 ${
          constructionMode
            ? "active border-amber-600/40 bg-amber-800/40 text-amber-200"
            : "bg-indigo-950/30 text-gray-400 hover:text-amber-300"
        }`}
        title="Toggle construction geometry (C)"
      >
        <span>- - -</span>
        <span>Construction</span>
      </button>

      {/* Delete button — visible when in select mode */}
      {isSelectMode && (
        <button
          onClick={handleDeleteSelected}
          className="cad-delete-btn mr-1 flex items-center gap-1 rounded-md border border-red-800/30 bg-red-950/40 px-2 py-1 text-red-300 hover:text-red-200"
          title="Delete selected entities (Delete/Backspace)"
        >
          <span>&#x2716;</span>
          <span>Delete</span>
        </button>
      )}

      <div className="flex-1" />
      <button
        onClick={() => cad.setSketchModeActive(false)}
        className="cad-toolbar-btn rounded-lg border border-green-700/30 bg-gradient-to-r from-green-900/50 to-green-800/30 px-3 py-1 text-green-300 hover:from-green-800/50 hover:to-green-700/40 hover:text-green-200"
      >
        ✓ Finish Sketch
      </button>
    </div>
  );
}
