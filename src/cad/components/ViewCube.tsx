// src/cad/components/ViewCube.tsx

"use client";

import type { ViewPreset } from "../engine/types";

const VIEW_ROTATIONS: Record<ViewPreset, [number, number, number]> = {
  front: [0, 0, 0],
  back: [0, Math.PI, 0],
  top: [-Math.PI / 2, 0, 0],
  bottom: [Math.PI / 2, 0, 0],
  left: [0, -Math.PI / 2, 0],
  right: [0, Math.PI / 2, 0],
  iso: [Math.PI / 6, Math.PI / 4, 0],
};

interface ViewCubeProps {
  onSetView: (preset: ViewPreset) => void;
}

export function ViewCubeOverlay({ onSetView }: ViewCubeProps) {
  return (
    <div className="absolute left-2 top-2 flex flex-col gap-1">
      {(["iso", "front", "top", "right"] as ViewPreset[]).map((preset) => (
        <button
          key={preset}
          onClick={() => onSetView(preset)}
          className="rounded bg-gray-800/80 px-2 py-1 text-xs capitalize text-gray-400 hover:bg-gray-700 hover:text-white"
        >
          {preset}
        </button>
      ))}
    </div>
  );
}

// Camera positions for view presets (distance 50 from origin)
export const VIEW_CAMERA_POSITIONS: Record<ViewPreset, [number, number, number]> = {
  front: [0, 0, 50],
  back: [0, 0, -50],
  top: [0, 50, 0],
  bottom: [0, -50, 0],
  left: [-50, 0, 0],
  right: [50, 0, 0],
  iso: [30, 30, 30],
};
