"use client";

import { useEffect } from "react";
import { useCad } from "../context/CadContext";
import { OcctLoadingScreen } from "./OcctLoadingScreen";

// These imports will be added as components are created in later tasks:
// import { TopToolbar } from "./TopToolbar";        // Task 13
// import { SketchToolbar } from "./SketchToolbar";  // Task 13
// import { CadViewport } from "./CadViewport";      // Task 11
// import { StatusBar } from "./StatusBar";           // Task 14

export function CadWorkspace() {
  const cad = useCad();

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) return;

      if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) {
        e.preventDefault(); cad.undo();
      }
      if (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey) {
        e.preventDefault(); cad.redo();
      }
      if (e.key === "s" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault(); cad.save();
      }
      if (e.key === "Escape") {
        if (cad.uiState.sketchModeActive) cad.setSketchModeActive(false);
        else cad.setSelectedFeatureId(null);
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (cad.uiState.selectedFeatureId) {
          cad.removeFeature(cad.uiState.selectedFeatureId);
          cad.setSelectedFeatureId(null);
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [cad]);

  if (cad.occtStatus === "loading" || cad.occtStatus === "idle") {
    return <OcctLoadingScreen progress={cad.occtLoadProgress} message={cad.occtLoadMessage} error={null} />;
  }
  if (cad.occtStatus === "error") {
    return <OcctLoadingScreen progress={0} message="" error={cad.occtError} />;
  }

  return (
    <div className="flex h-full flex-col">
      {/* TopToolbar — placeholder until Task 13 */}
      <div className="flex h-10 items-center border-b border-gray-800 bg-[#1a1a2e] px-4 text-xs">
        <span className="font-bold text-indigo-400">SpaceVision CAD</span>
        <span className="ml-auto rounded bg-green-900/50 px-2 py-0.5 text-green-400">● OCCT Ready</span>
      </div>

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
                onClick={() => cad.setSelectedFeatureId(feature.id)}
                className={`mb-0.5 cursor-pointer rounded px-2 py-1 ${
                  cad.uiState.selectedFeatureId === feature.id
                    ? "bg-indigo-900/50 text-white"
                    : feature.suppressed ? "text-gray-600 line-through"
                    : "text-gray-300 hover:bg-gray-800"
                }`}
              >
                {feature.type === "sketch" ? "✏️" : "🔼"} {feature.name}
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

        {/* Viewport — placeholder until Task 11 */}
        <div className="relative flex-1 bg-[#0d0d1a] flex items-center justify-center text-gray-600">
          <p>3D Viewport (will be replaced by CadViewport in Task 11)</p>
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
                  <p className="text-gray-400">{feature.type}: {feature.name}</p>
                  {feature.type === "extrude" && (
                    <div className="mt-2 space-y-1">
                      <div className="flex justify-between text-gray-400">
                        <span>Depth</span><span className="text-green-400">{String(feature.depth)}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Direction</span><span>{feature.direction}</span>
                      </div>
                      <div className="flex justify-between text-gray-400">
                        <span>Operation</span><span>{feature.operation}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          ) : <p className="text-gray-600">Select a feature</p>}
        </div>
      </div>

      {/* StatusBar — placeholder until Task 14 */}
      <div className="flex h-6 items-center justify-between border-t border-gray-800 bg-[#1a1a2e] px-4 text-xs text-gray-500">
        <span>{cad.isRebuilding ? "Rebuilding..." : "Ready"} | {cad.project.features.length} Features</span>
        <span>{cad.project.name}</span>
      </div>
    </div>
  );
}
