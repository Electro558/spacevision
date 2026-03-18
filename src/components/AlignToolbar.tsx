"use client";

import {
  AlignStartVertical,
  AlignCenterVertical,
  AlignEndVertical,
  AlignStartHorizontal,
  AlignCenterHorizontal,
  AlignEndHorizontal,
} from "lucide-react";
import type { AlignAxis, AlignMode } from "@/lib/alignEngine";

interface AlignToolbarProps {
  selectedCount: number;
  onAlign: (axis: AlignAxis, mode: AlignMode) => void;
  onDistribute: (axis: AlignAxis) => void;
}

export default function AlignToolbar({
  selectedCount,
  onAlign,
  onDistribute,
}: AlignToolbarProps) {
  const canAlign = selectedCount >= 2;
  const canDistribute = selectedCount >= 3;

  const btnClass =
    "flex items-center justify-center p-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed";

  return (
    <div className="space-y-1.5">
      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
        Arrange
      </span>

      <p className="text-[10px] text-gray-500">
        {selectedCount} selected
      </p>

      {/* Align buttons: 3x2 grid */}
      <div className="grid grid-cols-3 gap-1">
        <button
          onClick={() => onAlign("x", "min")}
          disabled={!canAlign}
          title="Align Left (X min)"
          className={btnClass}
        >
          <AlignStartVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onAlign("x", "center")}
          disabled={!canAlign}
          title="Align Center X"
          className={btnClass}
        >
          <AlignCenterVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onAlign("x", "max")}
          disabled={!canAlign}
          title="Align Right (X max)"
          className={btnClass}
        >
          <AlignEndVertical className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onAlign("y", "min")}
          disabled={!canAlign}
          title="Align Bottom (Y min)"
          className={btnClass}
        >
          <AlignStartHorizontal className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onAlign("y", "center")}
          disabled={!canAlign}
          title="Align Center Y"
          className={btnClass}
        >
          <AlignCenterHorizontal className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onAlign("y", "max")}
          disabled={!canAlign}
          title="Align Top (Y max)"
          className={btnClass}
        >
          <AlignEndHorizontal className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Distribute buttons */}
      <div className="flex gap-1">
        <button
          onClick={() => onDistribute("x")}
          disabled={!canDistribute}
          title="Distribute X"
          className={`${btnClass} flex-1 text-[10px] font-medium gap-1`}
        >
          X
        </button>
        <button
          onClick={() => onDistribute("y")}
          disabled={!canDistribute}
          title="Distribute Y"
          className={`${btnClass} flex-1 text-[10px] font-medium gap-1`}
        >
          Y
        </button>
        <button
          onClick={() => onDistribute("z")}
          disabled={!canDistribute}
          title="Distribute Z"
          className={`${btnClass} flex-1 text-[10px] font-medium gap-1`}
        >
          Z
        </button>
      </div>
    </div>
  );
}
