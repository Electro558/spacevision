"use client";

import { useCad } from "../context/CadContext";

export function StatusBar() {
  const cad = useCad();

  return (
    <div className="flex h-6 items-center justify-between border-t border-gray-800 bg-[#1a1a2e] px-4 text-xs text-gray-500">
      <span>
        {cad.isRebuilding ? "⟳ Rebuilding..." : "● Ready"} |{" "}
        {cad.project.features.length} Feature
        {cad.project.features.length !== 1 ? "s" : ""}
        {cad.uiState.sketchModeActive && " | Sketch Mode Active"}
      </span>
      <span>
        {cad.project.name} | {cad.project.units}
      </span>
    </div>
  );
}
