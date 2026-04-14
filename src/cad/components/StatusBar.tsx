"use client";

import { useCad } from "../context/CadContext";

export function StatusBar() {
  const cad = useCad();

  return (
    <div className="flex h-7 items-center justify-between border-t border-gray-800/30 bg-gradient-to-r from-[#0d0d20] via-[#12122a] to-[#0d0d20] px-4 text-xs text-gray-500">
      <span className="flex items-center gap-1.5">
        {cad.isRebuilding ? (
          <>
            <span className="cad-status-dot loading" />
            <span className="text-amber-400/80">Rebuilding...</span>
          </>
        ) : (
          <>
            <span className="cad-status-dot ready" />
            <span className="text-green-400/70">Ready</span>
          </>
        )}
        <span className="text-gray-700 mx-1">|</span>
        <span className="text-indigo-400/50">
          {cad.project.features.length} Feature{cad.project.features.length !== 1 ? "s" : ""}
        </span>
        {cad.uiState.sketchModeActive && (
          <>
            <span className="text-gray-700 mx-1">|</span>
            <span className="text-amber-400/60">Sketch Mode</span>
          </>
        )}
      </span>
      <span className="text-indigo-400/40">
        {cad.project.name} <span className="text-gray-700 mx-1">|</span> {cad.project.units}
      </span>
    </div>
  );
}
