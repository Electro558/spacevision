"use client";

import { useState } from "react";
import {
  Combine,
  Minus,
  SquaresIntersect,
  Group,
  CircleDot,
  Ungroup,
} from "lucide-react";

interface BooleanToolbarProps {
  selectedCount: number;
  onGroup: () => void;
  onUngroup: (groupId: string) => void;
  onToggleHole: () => void;
  onUnion: () => void;
  onSubtract: () => void;
  onIntersect: () => void;
  hasHolesInSelection: boolean;
  isGroupSelected: boolean;
  selectedGroupId: string | null;
}

export default function BooleanToolbar({
  selectedCount,
  onGroup,
  onUngroup,
  onToggleHole,
  onUnion,
  onSubtract,
  onIntersect,
  hasHolesInSelection,
  isGroupSelected,
  selectedGroupId,
}: BooleanToolbarProps) {
  const [advancedMode, setAdvancedMode] = useState(false);
  const canBoolean = selectedCount >= 2;

  return (
    <div className="space-y-1.5">
      {/* Mode toggle */}
      <div className="flex items-center justify-between">
        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">
          Boolean
        </span>
        <button
          onClick={() => setAdvancedMode(!advancedMode)}
          className="text-[9px] text-gray-500 hover:text-white transition-colors px-1.5 py-0.5 rounded bg-surface-dark"
        >
          {advancedMode ? "Simple" : "Advanced"}
        </button>
      </div>

      {/* Selection count */}
      <p className="text-[10px] text-gray-500">
        {selectedCount} selected
      </p>

      {advancedMode ? (
        /* ─── Advanced Mode ─── */
        <div className="flex gap-1">
          <button
            onClick={onUnion}
            disabled={!canBoolean}
            title="Union (merge shapes)"
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Combine className="w-3 h-3" />
            Union
          </button>
          <button
            onClick={onSubtract}
            disabled={!canBoolean}
            title="Subtract (cut shapes)"
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Minus className="w-3 h-3" />
            Subtract
          </button>
          <button
            onClick={onIntersect}
            disabled={!canBoolean}
            title="Intersect (keep overlap)"
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <SquaresIntersect className="w-3 h-3" />
            Intersect
          </button>
        </div>
      ) : (
        /* ─── Simple (TinkerCAD) Mode ─── */
        <div className="flex flex-col gap-1">
          <div className="flex gap-1">
            <button
              onClick={onGroup}
              disabled={!canBoolean}
              title="Group selected (Ctrl+G)"
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Group className="w-3 h-3" />
              Group
            </button>
            <button
              onClick={() => selectedGroupId && onUngroup(selectedGroupId)}
              disabled={!isGroupSelected || !selectedGroupId}
              title="Ungroup (Ctrl+Shift+G)"
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-white text-[10px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <Ungroup className="w-3 h-3" />
              Ungroup
            </button>
          </div>
          <button
            onClick={onToggleHole}
            disabled={selectedCount < 1}
            title="Toggle Hole (H)"
            className={`flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
              hasHolesInSelection
                ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                : "bg-zinc-800 hover:bg-zinc-700 text-white"
            }`}
          >
            <CircleDot className="w-3 h-3" />
            {hasHolesInSelection ? "Solid" : "Hole"}
          </button>
        </div>
      )}
    </div>
  );
}
