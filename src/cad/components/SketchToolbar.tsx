"use client";

import { useCad } from "../context/CadContext";
import type { CadTool } from "../engine/types";

const SKETCH_TOOLS: { tool: CadTool; label: string; icon: string }[] = [
  { tool: "select", label: "Select", icon: "↖" },
  { tool: "line", label: "Line", icon: "╱" },
  { tool: "circle", label: "Circle", icon: "○" },
  { tool: "rectangle", label: "Rectangle", icon: "▭" },
  { tool: "arc", label: "Arc", icon: "⌒" },
];

export function SketchToolbar() {
  const cad = useCad();

  if (!cad.uiState.sketchModeActive) return null;

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
