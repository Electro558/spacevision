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
    <div className="flex h-8 items-center border-b border-gray-800/50 bg-[#16162a] px-4 text-xs">
      <span className="mr-3 text-amber-400">Sketch Tools:</span>
      {SKETCH_TOOLS.map(({ tool, label, icon }) => (
        <button
          key={tool}
          onClick={() => cad.setActiveTool(tool)}
          className={`mr-1 flex items-center gap-1 rounded px-2 py-0.5 ${
            cad.uiState.activeTool === tool
              ? "bg-indigo-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          }`}
        >
          <span>{icon}</span>
          <span>{label}</span>
        </button>
      ))}

      {/* Construction mode toggle */}
      <button
        onClick={() => setConstructionMode(!constructionMode)}
        className={`mr-1 flex items-center gap-1 rounded px-2 py-0.5 ${
          constructionMode
            ? "bg-amber-700 text-amber-100"
            : "bg-gray-800 text-gray-400 hover:bg-gray-700"
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
          className="mr-1 flex items-center gap-1 rounded bg-red-800/80 px-2 py-0.5 text-red-200 hover:bg-red-700"
          title="Delete selected entities (Delete/Backspace)"
        >
          <span>&#x2716;</span>
          <span>Delete</span>
        </button>
      )}

      <div className="flex-1" />
      <button
        onClick={() => cad.setSketchModeActive(false)}
        className="rounded bg-green-800 px-3 py-0.5 text-green-200 hover:bg-green-700"
      >
        ✓ Finish Sketch
      </button>
    </div>
  );
}
