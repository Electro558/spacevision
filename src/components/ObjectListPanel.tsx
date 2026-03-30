"use client";

import { useState, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Circle,
  Layers,
  GripVertical,
} from "lucide-react";
import type { SceneObject, CSGGroup } from "@/lib/cadStore";

interface ObjectListPanelProps {
  objects: SceneObject[];
  csgGroups: CSGGroup[];
  selectedIds: string[];
  onSelect: (id: string, addToSelection?: boolean) => void;
  onToggleVisibility: (id: string) => void;
  onToggleLock: (id: string) => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (id: string, name: string) => void;
  onToggleHole: (id: string) => void;
}

export default function ObjectListPanel({
  objects,
  csgGroups,
  selectedIds,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onDelete,
  onDuplicate,
  onRename,
  onToggleHole,
}: ObjectListPanelProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    id: string;
    x: number;
    y: number;
  } | null>(null);

  const toggleGroupExpand = useCallback((groupId: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }, []);

  const startRename = useCallback((id: string, currentName: string) => {
    setEditingId(id);
    setEditName(currentName);
    setContextMenu(null);
  }, []);

  const commitRename = useCallback(() => {
    if (editingId && editName.trim()) {
      onRename(editingId, editName.trim());
    }
    setEditingId(null);
  }, [editingId, editName, onRename]);

  const handleContextMenu = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    setContextMenu({ id, x: e.clientX, y: e.clientY });
  }, []);

  // Separate grouped and ungrouped objects
  const groupedIds = new Set(csgGroups.flatMap(g => g.objectIds));
  const ungroupedObjects = objects.filter(o => !groupedIds.has(o.id));

  const renderObjectRow = (obj: SceneObject, indent: boolean = false) => {
    const isSelected = selectedIds.includes(obj.id);
    const isEditing = editingId === obj.id;

    return (
      <div
        key={obj.id}
        onClick={(e) => onSelect(obj.id, e.shiftKey)}
        onContextMenu={(e) => handleContextMenu(e, obj.id)}
        onDoubleClick={() => startRename(obj.id, obj.name)}
        className={`flex items-center gap-1 px-1.5 py-0.5 cursor-pointer transition-all group ${
          indent ? "pl-5" : ""
        } ${
          isSelected
            ? "bg-brand/15 text-brand"
            : "text-gray-400 hover:bg-surface-lighter hover:text-white"
        }`}
      >
        {/* Drag handle */}
        <GripVertical className="w-2.5 h-2.5 text-gray-600 opacity-0 group-hover:opacity-100 shrink-0" />

        {/* Color swatch */}
        <div
          className={`w-2.5 h-2.5 rounded-sm shrink-0 ${obj.isHole ? "border border-red-500 bg-transparent" : ""}`}
          style={{ backgroundColor: obj.isHole ? undefined : obj.color }}
        />

        {/* Name */}
        {isEditing ? (
          <input
            type="text"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitRename();
              if (e.key === "Escape") setEditingId(null);
            }}
            autoFocus
            className="flex-1 px-1 py-0 bg-surface-dark border border-brand/50 rounded text-[10px] text-white focus:outline-none min-w-0"
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span className="text-[10px] truncate flex-1 min-w-0">
            {obj.name}
            {obj.isHole && <span className="text-red-400 ml-1 text-[8px]">HOLE</span>}
          </span>
        )}

        {/* Quick actions */}
        <button
          onClick={(e) => { e.stopPropagation(); onToggleVisibility(obj.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-white shrink-0"
          title={obj.visible ? "Hide" : "Show"}
        >
          {obj.visible ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5 text-yellow-400" />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onToggleLock(obj.id); }}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 hover:text-white shrink-0"
          title={obj.locked ? "Unlock" : "Lock"}
        >
          {obj.locked ? <Lock className="w-2.5 h-2.5 text-red-400" /> : <Unlock className="w-2.5 h-2.5" />}
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full" onClick={() => setContextMenu(null)}>
      {/* Header */}
      <div className="h-7 border-b border-surface-border flex items-center justify-between px-2 shrink-0">
        <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
          <Layers className="w-3 h-3" /> Objects ({objects.length})
        </span>
      </div>

      {/* Object list */}
      <div className="flex-1 overflow-y-auto">
        {objects.length === 0 ? (
          <div className="p-3 text-center text-[10px] text-gray-600">
            No objects in scene
          </div>
        ) : (
          <>
            {/* CSG Groups */}
            {csgGroups.map(group => {
              const isExpanded = expandedGroups.has(group.id);
              const memberObjects = objects.filter(o => group.objectIds.includes(o.id));

              return (
                <div key={group.id}>
                  <div
                    onClick={() => toggleGroupExpand(group.id)}
                    className="flex items-center gap-1 px-1.5 py-0.5 cursor-pointer text-gray-400 hover:bg-surface-lighter hover:text-white"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-3 h-3 shrink-0" />
                    ) : (
                      <ChevronRight className="w-3 h-3 shrink-0" />
                    )}
                    <Layers className="w-2.5 h-2.5 text-purple-400 shrink-0" />
                    <span className="text-[10px] font-medium truncate flex-1">{group.name}</span>
                    <span className="text-[8px] text-gray-600">{memberObjects.length}</span>
                  </div>
                  {isExpanded && memberObjects.map(obj => renderObjectRow(obj, true))}
                </div>
              );
            })}

            {/* Ungrouped objects */}
            {ungroupedObjects.map(obj => renderObjectRow(obj))}
          </>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (() => {
        const obj = objects.find(o => o.id === contextMenu.id);
        if (!obj) return null;
        return (
          <div
            className="fixed bg-surface-lighter border border-surface-border rounded-md shadow-xl py-1 z-50"
            style={{ left: contextMenu.x, top: contextMenu.y }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => { startRename(obj.id, obj.name); }}
              className="w-full text-left px-3 py-1 text-[10px] text-gray-300 hover:bg-brand/20 hover:text-white"
            >
              Rename
            </button>
            <button
              onClick={() => { onDuplicate(obj.id); setContextMenu(null); }}
              className="w-full text-left px-3 py-1 text-[10px] text-gray-300 hover:bg-brand/20 hover:text-white flex items-center gap-2"
            >
              <Copy className="w-3 h-3" /> Duplicate
            </button>
            <button
              onClick={() => { onToggleHole(obj.id); setContextMenu(null); }}
              className="w-full text-left px-3 py-1 text-[10px] text-gray-300 hover:bg-brand/20 hover:text-white flex items-center gap-2"
            >
              <Circle className="w-3 h-3" /> {obj.isHole ? "Make Solid" : "Make Hole"}
            </button>
            <div className="border-t border-surface-border my-0.5" />
            <button
              onClick={() => { onDelete(obj.id); setContextMenu(null); }}
              className="w-full text-left px-3 py-1 text-[10px] text-red-400 hover:bg-red-500/20 flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        );
      })()}
    </div>
  );
}
