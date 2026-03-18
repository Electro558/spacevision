"use client";

import { useState, useEffect, useCallback, useRef, Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Download,
  RotateCcw,
  Redo2,
  Undo2,
  Send,
  Loader2,
  Box,
  Circle,
  Triangle,
  Cylinder,
  Eye,
  EyeOff,
  Move,
  RotateCw,
  Maximize2,
  MessageSquare,
  Wrench,
  Lightbulb,
  Trash2,
  Copy,
  Lock,
  Unlock,
  EyeIcon,
  EyeOffIcon,
  Grid3x3,
  Magnet,
  ChevronRight,
  ChevronDown,
  Layers,
  Settings2,
  MousePointer,
  Plus,
  Ruler,
} from "lucide-react";
import * as THREE from "three";
import { exportToSTL } from "@/utils/stlExporter";
import {
  type SceneObject,
  type CSGGroup,
  type HistoryEntry,
  createObject,
  duplicateObject,
  newId,
  generateFromPrompt,
} from "@/lib/cadStore";
import { toggleSelection, canPerformBoolean, getSelectionCenter } from "@/lib/multiSelect";
import { performGroupCSG } from "@/lib/csgEngine";
import { alignObjects, distributeObjects, type AlignAxis, type AlignMode } from "@/lib/alignEngine";
import BooleanToolbar from "@/components/BooleanToolbar";
import AlignToolbar from "@/components/AlignToolbar";

const CADViewport = dynamic(() => import("@/components/CADViewport"), { ssr: false });

/* ─── Search Params Reader ─── */
function SearchParamsReader({ onPrompt }: { onPrompt: (p: string) => void }) {
  const searchParams = useSearchParams();
  useEffect(() => {
    const p = searchParams.get("prompt");
    if (p) onPrompt(p);
  }, [searchParams, onPrompt]);
  return null;
}

/* ─── Number Input Component ─── */
function NumInput({ label, value, onChange, step = 0.1, color }: {
  label: string; value: number; onChange: (v: number) => void; step?: number; color?: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`text-[10px] font-bold w-3 ${color || "text-gray-500"}`}>{label}</span>
      <input
        type="number"
        value={Number(value.toFixed(3))}
        onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
        step={step}
        className="w-full px-1.5 py-1 rounded bg-surface-dark border border-surface-border text-[11px] text-white text-center font-mono focus:outline-none focus:border-brand/50"
      />
    </div>
  );
}

/* ─── Color Presets ─── */
const COLOR_PRESETS = [
  "#dc2626", "#ea580c", "#ca8a04", "#16a34a", "#2563eb",
  "#7c3aed", "#db2777", "#e2e8f0", "#94a3b8", "#334155",
  "#78350f", "#6b8caf", "#22d3ee", "#f472b6", "#fbbf24",
];

export default function GeneratePage() {
  // ─── Scene State ───
  const [objects, setObjects] = useState<SceneObject[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [csgGroups, setCsgGroups] = useState<CSGGroup[]>([]);
  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null;
  const [transformMode, setTransformMode] = useState<"translate" | "rotate" | "scale">("translate");
  const [wireframe, setWireframe] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [snapValue] = useState(0.5);
  const [gridVisible, setGridVisible] = useState(true);
  const [showRulers, setShowRulers] = useState(true);

  // ─── UI State ───
  const [rightPanel, setRightPanel] = useState<"chat" | "properties">("properties");
  const [showOutliner, setShowOutliner] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "ai"; text: string }[]>([
    { role: "ai", text: "SpaceVision CAD Workspace ready.\n\nUse the prompt bar to generate models from text, or add primitives from the toolbar. Select objects to move, rotate, and scale them.\n\nKeyboard shortcuts:\nG — Move  |  R — Rotate  |  S — Scale\nDel — Delete  |  D — Duplicate\nCtrl+Z — Undo  |  Ctrl+Y — Redo" },
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── History (Undo/Redo) ───
  const [history, setHistory] = useState<HistoryEntry[]>([{ objects: [], selectedId: null }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const sceneRef = useRef<THREE.Scene | null>(null);

  // Derived state
  const selectedObj = useMemo(() => objects.find(o => o.id === selectedId) || null, [objects, selectedId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // ─── History Management ───
  const pushHistory = useCallback((newObjects: SceneObject[], newSelectedId: string | null) => {
    setHistory(prev => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, { objects: newObjects, selectedId: newSelectedId }];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const entry = history[historyIndex - 1];
    setObjects(entry.objects);
    setSelectedIds(entry.selectedId ? [entry.selectedId] : []);
    setHistoryIndex(prev => prev - 1);
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const entry = history[historyIndex + 1];
    setObjects(entry.objects);
    setSelectedIds(entry.selectedId ? [entry.selectedId] : []);
    setHistoryIndex(prev => prev + 1);
  }, [history, historyIndex]);

  // ─── Object Operations ───
  const updateObjects = useCallback((newObjects: SceneObject[], newSelectedId?: string | null) => {
    setObjects(newObjects);
    const sel = newSelectedId !== undefined ? newSelectedId : selectedId;
    if (newSelectedId !== undefined) setSelectedIds(sel ? [sel] : []);
    pushHistory(newObjects, sel);
  }, [selectedId, pushHistory]);

  const addPrimitive = useCallback((type: SceneObject["type"]) => {
    const obj = createObject(type);
    const newObjects = [...objects, obj];
    setObjects(newObjects);
    setSelectedIds([obj.id]);
    pushHistory(newObjects, obj.id);
  }, [objects, pushHistory]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    const newObjects = objects.filter(o => o.id !== selectedId);
    setObjects(newObjects);
    setSelectedIds([]);
    pushHistory(newObjects, null);
  }, [objects, selectedId, pushHistory]);

  const duplicateSelected = useCallback(() => {
    if (!selectedObj) return;
    const dupe = duplicateObject(selectedObj);
    const newObjects = [...objects, dupe];
    setObjects(newObjects);
    setSelectedIds([dupe.id]);
    pushHistory(newObjects, dupe.id);
  }, [objects, selectedObj, pushHistory]);

  const updateSelectedProp = useCallback((key: keyof SceneObject, value: any) => {
    if (!selectedId) return;
    const newObjects = objects.map(o => o.id === selectedId ? { ...o, [key]: value } : o);
    setObjects(newObjects);
    pushHistory(newObjects, selectedId);
  }, [objects, selectedId, pushHistory]);

  const handleTransformUpdate = useCallback((id: string, pos: [number, number, number], rot: [number, number, number], scl: [number, number, number]) => {
    const newObjects = objects.map(o =>
      o.id === id ? { ...o, position: pos, rotation: rot, scale: scl } : o
    );
    setObjects(newObjects);
    pushHistory(newObjects, id);
  }, [objects, pushHistory]);

  // ─── Generation ───
  const handleGenerate = useCallback(() => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setChatMessages(prev => [...prev, { role: "user", text: prompt }, { role: "ai", text: "Generating..." }]);

    setTimeout(() => {
      const newParts = generateFromPrompt(prompt);
      const newObjects = [...objects, ...newParts];
      setObjects(newObjects);
      setSelectedIds([]);
      pushHistory(newObjects, null);
      setIsGenerating(false);
      setChatMessages(prev => [
        ...prev.slice(0, -1),
        { role: "ai", text: `✅ Generated ${newParts.length} objects from: "${prompt}"\n\nClick any part to select it. Use Move/Rotate/Scale to edit. Each part is individually editable — full CAD control.` },
      ]);
    }, 800);
  }, [prompt, isGenerating, objects, pushHistory]);

  const handleIncomingPrompt = useCallback((p: string) => {
    setPrompt(p);
    setIsGenerating(true);
    setChatMessages(prev => [...prev, { role: "user", text: p }, { role: "ai", text: "Generating..." }]);
    setTimeout(() => {
      const newParts = generateFromPrompt(p);
      setObjects(newParts);
      setSelectedIds([]);
      pushHistory(newParts, null);
      setIsGenerating(false);
      setChatMessages(prev => [
        ...prev.slice(0, -1),
        { role: "ai", text: `✅ Generated ${newParts.length} objects from: "${p}"\n\nEach part is selectable. Click to select, then Move/Rotate/Scale to edit.` },
      ]);
    }, 800);
  }, [pushHistory]);

  const handleChatSend = useCallback(() => {
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: msg }]);

    // If it looks like a generation prompt
    if (/^(make|create|generate|build|model|design|add a|add an)\s/i.test(msg) || (objects.length === 0 && msg.length > 5)) {
      setPrompt(msg);
      setChatMessages(prev => [...prev, { role: "ai", text: "Generating..." }]);
      setTimeout(() => {
        const newParts = generateFromPrompt(msg);
        const newObjects = [...objects, ...newParts];
        setObjects(newObjects);
        setSelectedIds([]);
        pushHistory(newObjects, null);
        setChatMessages(prev => [
          ...prev.slice(0, -1),
          { role: "ai", text: `✅ Generated ${newParts.length} objects. Each part is individually selectable and editable.` },
        ]);
      }, 800);
    } else {
      setTimeout(() => {
        setChatMessages(prev => [...prev, { role: "ai", text: "Use the prompt bar to generate models, or add primitives from the left toolbar. Select objects to edit their properties in the right panel." }]);
      }, 300);
    }
  }, [chatInput, objects, pushHistory]);

  const handleExportSTL = useCallback(async () => {
    if (sceneRef.current) {
      try {
        const { validateAndExportSTL } = await import("@/utils/stlExporter");
        const result = await validateAndExportSTL(sceneRef.current, "spacevision_model.stl");
        if (result.warnings.length > 0) {
          setChatMessages(prev => [...prev, { role: "ai", text: `Exported spacevision_model.stl with warnings:\n${result.warnings.map(w => `- ${w}`).join("\n")}` }]);
        } else {
          setChatMessages(prev => [...prev, { role: "ai", text: "Exported spacevision_model.stl (all meshes validated)" }]);
        }
      } catch {
        // Fallback to basic export if dynamic import fails
        exportToSTL(sceneRef.current, "spacevision_model.stl");
        setChatMessages(prev => [...prev, { role: "ai", text: "Exported spacevision_model.stl" }]);
      }
    }
  }, []);

  const handleClearScene = useCallback(() => {
    setObjects([]);
    setSelectedIds([]);
    setPrompt("");
    pushHistory([], null);
    setChatMessages(prev => [...prev, { role: "ai", text: "Scene cleared." }]);
  }, [pushHistory]);

  // ─── Boolean / CSG Handlers ───
  const handleGroup = useCallback(() => {
    if (!canPerformBoolean(selectedIds)) return;
    const selectedObjs = objects.filter(o => selectedIds.includes(o.id));
    const center = getSelectionCenter(selectedObjs);
    const groupId = newId();
    const group: CSGGroup = {
      id: groupId,
      name: `Group ${csgGroups.length + 1}`,
      objectIds: [...selectedIds],
      operation: 'union',
      visible: true,
      locked: false,
      position: center,
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    };
    const newObjects = objects.map(o =>
      selectedIds.includes(o.id) ? { ...o, groupId } : o
    );
    setCsgGroups(prev => [...prev, group]);
    setObjects(newObjects);
    setSelectedIds([]);
    pushHistory(newObjects, null);
  }, [selectedIds, objects, csgGroups.length, pushHistory]);

  const handleUngroup = useCallback((groupId: string) => {
    const newObjects = objects.map(o =>
      o.groupId === groupId ? { ...o, groupId: null } : o
    );
    setCsgGroups(prev => prev.filter(g => g.id !== groupId));
    setObjects(newObjects);
    setSelectedIds([]);
    pushHistory(newObjects, null);
  }, [objects, pushHistory]);

  const handleToggleHole = useCallback(() => {
    if (selectedIds.length === 0) return;
    const newObjects = objects.map(o =>
      selectedIds.includes(o.id) ? { ...o, isHole: !o.isHole } : o
    );
    setObjects(newObjects);
    pushHistory(newObjects, selectedId);
  }, [selectedIds, objects, selectedId, pushHistory]);

  const handleExplicitBoolean = useCallback((op: 'union' | 'subtract' | 'intersect') => {
    if (!canPerformBoolean(selectedIds)) return;
    const selectedObjs = objects.filter(o => selectedIds.includes(o.id));
    const geometry = performGroupCSG(selectedObjs, 'explicit', op);
    if (!geometry) return;

    // Use the first selected object's appearance for the result
    const primary = selectedObjs[0];
    const center = getSelectionCenter(selectedObjs);
    const resultObj = createObject(primary.type, {
      name: `${op.charAt(0).toUpperCase() + op.slice(1)} Result`,
      position: center,
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: primary.color,
      metalness: primary.metalness,
      roughness: primary.roughness,
    });

    const newObjects = [
      ...objects.filter(o => !selectedIds.includes(o.id)),
      resultObj,
    ];
    setObjects(newObjects);
    setSelectedIds([resultObj.id]);
    pushHistory(newObjects, resultObj.id);
  }, [selectedIds, objects, pushHistory]);

  // Derived boolean state
  const selectedObjs = useMemo(() => objects.filter(o => selectedIds.includes(o.id)), [objects, selectedIds]);
  const hasHolesInSelection = useMemo(() => selectedObjs.some(o => o.isHole), [selectedObjs]);
  const selectedGroupId = useMemo(() => {
    const groupIds = selectedObjs.map(o => o.groupId).filter(Boolean);
    if (groupIds.length > 0) return groupIds[0]!;
    return null;
  }, [selectedObjs]);
  const isGroupSelected = selectedGroupId !== null;

  // ─── Align / Distribute Handlers ───
  const handleAlign = useCallback((axis: AlignAxis, mode: AlignMode) => {
    const selected = objects.filter(o => selectedIds.includes(o.id));
    if (selected.length < 2) return;
    const aligned = alignObjects(selected, axis, mode);
    const alignedMap = new Map(aligned.map(o => [o.id, o]));
    const newObjects = objects.map(o => alignedMap.get(o.id) ?? o);
    setObjects(newObjects);
    pushHistory(newObjects, selectedId);
  }, [objects, selectedIds, selectedId, pushHistory]);

  const handleDistribute = useCallback((axis: AlignAxis) => {
    const selected = objects.filter(o => selectedIds.includes(o.id));
    if (selected.length < 3) return;
    const distributed = distributeObjects(selected, axis);
    const distributedMap = new Map(distributed.map(o => [o.id, o]));
    const newObjects = objects.map(o => distributedMap.get(o.id) ?? o);
    setObjects(newObjects);
    pushHistory(newObjects, selectedId);
  }, [objects, selectedIds, selectedId, pushHistory]);

  // ─── Keyboard Shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "g" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { handleGroup(); e.preventDefault(); }
      else if (e.key === "G" && (e.ctrlKey || e.metaKey) && e.shiftKey) { if (selectedGroupId) handleUngroup(selectedGroupId); e.preventDefault(); }
      else if (e.key === "h" || e.key === "H") { handleToggleHole(); e.preventDefault(); }
      else if (e.key === "g" || e.key === "G") { setTransformMode("translate"); e.preventDefault(); }
      else if (e.key === "r" && !e.ctrlKey && !e.metaKey) { setTransformMode("rotate"); e.preventDefault(); }
      else if (e.key === "s" && !e.ctrlKey && !e.metaKey) { setTransformMode("scale"); e.preventDefault(); }
      else if (e.key === "Delete" || e.key === "Backspace") { deleteSelected(); e.preventDefault(); }
      else if (e.key === "d" || e.key === "D") { duplicateSelected(); e.preventDefault(); }
      else if (e.key === "z" && (e.ctrlKey || e.metaKey) && !e.shiftKey) { undo(); e.preventDefault(); }
      else if ((e.key === "y" && (e.ctrlKey || e.metaKey)) || (e.key === "z" && (e.ctrlKey || e.metaKey) && e.shiftKey)) { redo(); e.preventDefault(); }
      else if (e.key === "Escape") { setSelectedIds([]); e.preventDefault(); }
      else if (e.key === "a" && (e.ctrlKey || e.metaKey)) { setSelectedIds(objects.map(o => o.id)); e.preventDefault(); }
      else if (e.key === "x") { setSnapEnabled(prev => !prev); e.preventDefault(); }
      else if (e.key === "w") { setWireframe(prev => !prev); e.preventDefault(); }
      else if (e.key === "m" || e.key === "M") { setShowRulers(prev => !prev); e.preventDefault(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteSelected, duplicateSelected, undo, redo, objects, handleGroup, handleUngroup, handleToggleHole, selectedGroupId]);

  // ─── Primitives ───
  const primitiveTypes: { type: SceneObject["type"]; icon: any; label: string }[] = [
    { type: "box", icon: Box, label: "Cube" },
    { type: "sphere", icon: Circle, label: "Sphere" },
    { type: "cylinder", icon: Cylinder, label: "Cylinder" },
    { type: "cone", icon: Triangle, label: "Cone" },
  ];

  return (
    <div className="h-screen pt-14 bg-surface-dark flex overflow-hidden select-none">
      <Suspense fallback={null}>
        <SearchParamsReader onPrompt={handleIncomingPrompt} />
      </Suspense>

      {/* ─── Left Toolbar ─── */}
      <div className="w-11 bg-surface border-r border-surface-border flex flex-col items-center py-2 gap-0.5 shrink-0">
        {/* Select */}
        <button
          onClick={() => setSelectedIds([])}
          title="Select (Esc)"
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
            !selectedId ? "text-gray-500" : "text-gray-400 hover:text-white hover:bg-surface-lighter"
          }`}
        >
          <MousePointer className="w-3.5 h-3.5" />
        </button>

        <div className="w-5 border-t border-surface-border my-1" />

        {/* Transform tools */}
        {([
          { mode: "translate" as const, icon: Move, label: "Move (G)", key: "G" },
          { mode: "rotate" as const, icon: RotateCw, label: "Rotate (R)", key: "R" },
          { mode: "scale" as const, icon: Maximize2, label: "Scale (S)", key: "S" },
        ]).map(tool => (
          <button
            key={tool.mode}
            onClick={() => setTransformMode(tool.mode)}
            title={tool.label}
            className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
              transformMode === tool.mode
                ? "bg-brand text-white"
                : "text-gray-500 hover:text-white hover:bg-surface-lighter"
            }`}
          >
            <tool.icon className="w-3.5 h-3.5" />
          </button>
        ))}

        <div className="w-5 border-t border-surface-border my-1" />

        {/* View toggles */}
        <button
          onClick={() => setWireframe(!wireframe)}
          title={`Wireframe (W): ${wireframe ? "ON" : "OFF"}`}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
            wireframe ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-white hover:bg-surface-lighter"
          }`}
        >
          {wireframe ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        <button
          onClick={() => setSnapEnabled(!snapEnabled)}
          title={`Snap (X): ${snapEnabled ? "ON" : "OFF"}`}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
            snapEnabled ? "bg-yellow-500/20 text-yellow-400" : "text-gray-500 hover:text-white hover:bg-surface-lighter"
          }`}
        >
          <Magnet className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setGridVisible(!gridVisible)}
          title={`Grid: ${gridVisible ? "ON" : "OFF"}`}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
            gridVisible ? "text-gray-400" : "text-gray-600"
          } hover:text-white hover:bg-surface-lighter`}
        >
          <Grid3x3 className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={() => setShowRulers(!showRulers)}
          title={`Smart Rulers (M): ${showRulers ? "ON" : "OFF"}`}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
            showRulers ? "bg-blue-500/20 text-blue-400" : "text-gray-500 hover:text-white hover:bg-surface-lighter"
          }`}
        >
          <Ruler className="w-3.5 h-3.5" />
        </button>

        <div className="w-5 border-t border-surface-border my-1" />

        {/* Primitives */}
        <p className="text-[7px] text-gray-600 font-bold tracking-wider">ADD</p>
        {primitiveTypes.map(prim => (
          <button
            key={prim.type}
            onClick={() => addPrimitive(prim.type)}
            title={`Add ${prim.label}`}
            className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-surface-lighter transition-all"
          >
            <prim.icon className="w-3.5 h-3.5" />
          </button>
        ))}

        <div className="w-5 border-t border-surface-border my-1" />

        {/* Boolean section - compact vertical layout */}
        <p className="text-[7px] text-gray-600 font-bold tracking-wider">CSG</p>
        <button
          onClick={handleGroup}
          disabled={!canPerformBoolean(selectedIds)}
          title="Group (Ctrl+G)"
          className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-surface-lighter transition-all disabled:opacity-30 disabled:cursor-not-allowed"
        >
          <Layers className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleToggleHole}
          disabled={selectedIds.length < 1}
          title="Toggle Hole (H)"
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
            hasHolesInSelection
              ? "bg-red-500/20 text-red-400"
              : "text-gray-500 hover:text-white hover:bg-surface-lighter"
          }`}
        >
          <Circle className="w-3.5 h-3.5" />
        </button>

        <div className="flex-1" />

        {/* Actions at bottom */}
        {selectedId && (
          <>
            <button onClick={duplicateSelected} title="Duplicate (D)" className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-surface-lighter transition-all">
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button onClick={deleteSelected} title="Delete (Del)" className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-all">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* ─── Main Area ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="h-9 bg-surface border-b border-surface-border flex items-center justify-between px-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <Wrench className="w-3 h-3 text-brand" />
            <span className="font-semibold text-gray-300 text-[11px]">Workspace</span>
            <span className="text-gray-600">|</span>
            <span className="text-[11px] text-gray-500">{objects.length} objects</span>
            {selectedObj && (
              <>
                <span className="text-gray-600">→</span>
                <span className="text-[11px] text-brand font-medium">{selectedObj.name}</span>
              </>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button onClick={undo} disabled={historyIndex <= 0} title="Undo (Ctrl+Z)" className="p-1 rounded text-gray-500 hover:text-white hover:bg-surface-lighter disabled:opacity-30 transition-all">
              <Undo2 className="w-3.5 h-3.5" />
            </button>
            <button onClick={redo} disabled={historyIndex >= history.length - 1} title="Redo (Ctrl+Y)" className="p-1 rounded text-gray-500 hover:text-white hover:bg-surface-lighter disabled:opacity-30 transition-all">
              <Redo2 className="w-3.5 h-3.5" />
            </button>
            <div className="w-px h-4 bg-surface-border mx-1" />
            {objects.length > 0 && (
              <>
                <button onClick={handleExportSTL} className="flex items-center gap-1 px-2 py-1 rounded bg-brand hover:bg-brand-hover text-white text-[11px] font-medium transition-colors">
                  <Download className="w-3 h-3" />
                  Export STL
                </button>
                <button onClick={handleClearScene} className="flex items-center gap-1 px-2 py-1 rounded bg-surface-lighter hover:bg-surface-border text-gray-300 text-[11px] font-medium transition-colors">
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              </>
            )}
            <div className="w-px h-4 bg-surface-border mx-1" />
            <button
              onClick={() => setRightPanel(rightPanel === "properties" ? "chat" : "properties")}
              title={rightPanel === "properties" ? "Switch to Chat" : "Switch to Properties"}
              className="p-1 rounded text-gray-500 hover:text-white hover:bg-surface-lighter transition-all"
            >
              {rightPanel === "properties" ? <MessageSquare className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Viewport + Side Panels */}
        <div className="flex-1 flex min-h-0">

          {/* ─── Outliner (left side sub-panel) ─── */}
          {showOutliner && objects.length > 0 && (
            <div className="w-48 bg-surface border-r border-surface-border flex flex-col shrink-0 overflow-hidden">
              <div className="h-7 border-b border-surface-border flex items-center justify-between px-2 shrink-0">
                <span className="text-[10px] font-semibold text-gray-400 flex items-center gap-1">
                  <Layers className="w-3 h-3" /> Scene ({objects.length})
                </span>
                <button onClick={() => setShowOutliner(false)} className="text-gray-600 hover:text-gray-300 transition-colors">
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto">
                {objects.map(obj => (
                  <button
                    key={obj.id}
                    onClick={(e) => {
                      if (e.shiftKey) {
                        setSelectedIds(prev => toggleSelection(prev, obj.id));
                      } else {
                        setSelectedIds(prev => prev.length === 1 && prev[0] === obj.id ? [] : [obj.id]);
                      }
                    }}
                    className={`w-full flex items-center gap-1.5 px-2 py-1 text-left transition-all ${
                      selectedIds.includes(obj.id)
                        ? "bg-brand/15 text-brand"
                        : "text-gray-400 hover:bg-surface-lighter hover:text-white"
                    }`}
                  >
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: obj.color }} />
                    <span className="text-[10px] truncate flex-1">{obj.name}</span>
                    {!obj.visible && <EyeOffIcon className="w-2.5 h-2.5 text-gray-600 shrink-0" />}
                    {obj.locked && <Lock className="w-2.5 h-2.5 text-gray-600 shrink-0" />}
                  </button>
                ))}
              </div>
              {/* Boolean toolbar in outliner panel */}
              <div className="border-t border-surface-border p-2 shrink-0">
                <BooleanToolbar
                  selectedCount={selectedIds.length}
                  onGroup={handleGroup}
                  onUngroup={handleUngroup}
                  onToggleHole={handleToggleHole}
                  onUnion={() => handleExplicitBoolean('union')}
                  onSubtract={() => handleExplicitBoolean('subtract')}
                  onIntersect={() => handleExplicitBoolean('intersect')}
                  hasHolesInSelection={hasHolesInSelection}
                  isGroupSelected={isGroupSelected}
                  selectedGroupId={selectedGroupId}
                />
              </div>
              {/* Align toolbar in outliner panel */}
              <div className="border-t border-surface-border p-2 shrink-0">
                <AlignToolbar
                  selectedCount={selectedIds.length}
                  onAlign={handleAlign}
                  onDistribute={handleDistribute}
                />
              </div>
            </div>
          )}

          {/* Show outliner toggle when hidden */}
          {(!showOutliner || objects.length === 0) && objects.length > 0 && (
            <button
              onClick={() => setShowOutliner(true)}
              className="w-6 bg-surface border-r border-surface-border flex items-center justify-center text-gray-600 hover:text-gray-300 shrink-0 transition-colors"
              title="Show Scene Outliner"
            >
              <ChevronRight className="w-3 h-3" />
            </button>
          )}

          {/* ─── 3D Viewport ─── */}
          <div className="flex-1 relative cad-grid">
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-dark/70 z-10">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                <p className="text-xs text-gray-400">Generating geometry...</p>
              </div>
            )}

            {objects.length > 0 ? (
              <CADViewport
                objects={objects}
                selectedIds={selectedIds}
                csgGroups={csgGroups}
                transformMode={transformMode}
                wireframe={wireframe}
                snapEnabled={snapEnabled}
                snapValue={snapValue}
                gridVisible={gridVisible}
                showRulers={showRulers}
                onSelect={(id: string) => setSelectedIds([id])}
                onDeselect={() => setSelectedIds([])}
                onTransformUpdate={handleTransformUpdate}
                onSceneReady={(scene) => { sceneRef.current = scene; }}
                className="w-full h-full"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-surface-lighter/30 border border-surface-border flex items-center justify-center">
                  <Box className="w-8 h-8 text-gray-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-400 font-medium mb-1">Empty workspace</p>
                  <p className="text-xs text-gray-600 max-w-xs">Type a prompt below to generate a model, or add primitives from the toolbar</p>
                </div>
              </div>
            )}

            {/* Bottom prompt bar */}
            <div className="absolute bottom-0 left-0 right-0 p-2.5 z-20">
              <div className="max-w-xl mx-auto flex gap-2">
                <input
                  type="text"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") handleGenerate(); }}
                  placeholder="Describe a 3D model... (e.g. 'a house with a red roof')"
                  className="flex-1 px-3 py-2 rounded-lg bg-surface/95 backdrop-blur-sm border border-surface-border text-xs text-white placeholder-gray-500 focus:outline-none focus:border-brand/50 transition-colors shadow-lg"
                />
                <button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-lg"
                >
                  {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Generate
                </button>
              </div>
            </div>
          </div>

          {/* ─── Right Panel ─── */}
          <div className="w-64 bg-surface border-l border-surface-border flex flex-col shrink-0 overflow-hidden">
            {/* Panel tabs */}
            <div className="h-7 border-b border-surface-border flex shrink-0">
              <button
                onClick={() => setRightPanel("properties")}
                className={`flex-1 text-[10px] font-semibold transition-all ${
                  rightPanel === "properties" ? "text-brand bg-brand/5 border-b border-brand" : "text-gray-500 hover:text-white"
                }`}
              >
                Properties
              </button>
              <button
                onClick={() => setRightPanel("chat")}
                className={`flex-1 text-[10px] font-semibold transition-all ${
                  rightPanel === "chat" ? "text-brand bg-brand/5 border-b border-brand" : "text-gray-500 hover:text-white"
                }`}
              >
                AI Chat
              </button>
            </div>

            {rightPanel === "properties" ? (
              /* ─── Properties Panel ─── */
              <div className="flex-1 overflow-y-auto p-2.5 space-y-3">
                {selectedObj ? (
                  <>
                    {/* Object Name */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Name</label>
                      <input
                        type="text"
                        value={selectedObj.name}
                        onChange={(e) => updateSelectedProp("name", e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 rounded bg-surface-dark border border-surface-border text-[11px] text-white focus:outline-none focus:border-brand/50"
                      />
                    </div>

                    {/* Type */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Type</label>
                      <p className="text-[11px] text-gray-300 mt-1 capitalize">{selectedObj.type}</p>
                    </div>

                    {/* Position */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Position</label>
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        <NumInput label="X" color="text-red-400" value={selectedObj.position[0]} onChange={v => updateSelectedProp("position", [v, selectedObj.position[1], selectedObj.position[2]])} />
                        <NumInput label="Y" color="text-green-400" value={selectedObj.position[1]} onChange={v => updateSelectedProp("position", [selectedObj.position[0], v, selectedObj.position[2]])} />
                        <NumInput label="Z" color="text-blue-400" value={selectedObj.position[2]} onChange={v => updateSelectedProp("position", [selectedObj.position[0], selectedObj.position[1], v])} />
                      </div>
                    </div>

                    {/* Rotation */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Rotation (rad)</label>
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        <NumInput label="X" color="text-red-400" value={selectedObj.rotation[0]} step={0.05} onChange={v => updateSelectedProp("rotation", [v, selectedObj.rotation[1], selectedObj.rotation[2]])} />
                        <NumInput label="Y" color="text-green-400" value={selectedObj.rotation[1]} step={0.05} onChange={v => updateSelectedProp("rotation", [selectedObj.rotation[0], v, selectedObj.rotation[2]])} />
                        <NumInput label="Z" color="text-blue-400" value={selectedObj.rotation[2]} step={0.05} onChange={v => updateSelectedProp("rotation", [selectedObj.rotation[0], selectedObj.rotation[1], v])} />
                      </div>
                    </div>

                    {/* Scale */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Scale</label>
                      <div className="grid grid-cols-3 gap-1 mt-1">
                        <NumInput label="X" color="text-red-400" value={selectedObj.scale[0]} onChange={v => updateSelectedProp("scale", [v, selectedObj.scale[1], selectedObj.scale[2]])} />
                        <NumInput label="Y" color="text-green-400" value={selectedObj.scale[1]} onChange={v => updateSelectedProp("scale", [selectedObj.scale[0], v, selectedObj.scale[2]])} />
                        <NumInput label="Z" color="text-blue-400" value={selectedObj.scale[2]} onChange={v => updateSelectedProp("scale", [selectedObj.scale[0], selectedObj.scale[1], v])} />
                      </div>
                    </div>

                    {/* Color */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Color</label>
                      <div className="flex items-center gap-2 mt-1">
                        <input
                          type="color"
                          value={selectedObj.color}
                          onChange={(e) => updateSelectedProp("color", e.target.value)}
                          className="w-7 h-7 rounded border border-surface-border cursor-pointer bg-transparent"
                        />
                        <input
                          type="text"
                          value={selectedObj.color}
                          onChange={(e) => updateSelectedProp("color", e.target.value)}
                          className="flex-1 px-2 py-1 rounded bg-surface-dark border border-surface-border text-[10px] text-white font-mono focus:outline-none focus:border-brand/50"
                        />
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {COLOR_PRESETS.map(c => (
                          <button
                            key={c}
                            onClick={() => updateSelectedProp("color", c)}
                            className={`w-4 h-4 rounded-sm border transition-all ${
                              selectedObj.color === c ? "border-white scale-110" : "border-surface-border hover:border-gray-500"
                            }`}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Material */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Material</label>
                      <div className="space-y-1.5 mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Metalness</span>
                          <span className="text-[10px] text-gray-500 font-mono">{selectedObj.metalness.toFixed(2)}</span>
                        </div>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          value={selectedObj.metalness}
                          onChange={(e) => updateSelectedProp("metalness", parseFloat(e.target.value))}
                          className="w-full h-1 accent-brand"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Roughness</span>
                          <span className="text-[10px] text-gray-500 font-mono">{selectedObj.roughness.toFixed(2)}</span>
                        </div>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          value={selectedObj.roughness}
                          onChange={(e) => updateSelectedProp("roughness", parseFloat(e.target.value))}
                          className="w-full h-1 accent-brand"
                        />
                      </div>
                    </div>

                    {/* Visibility / Lock */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateSelectedProp("visible", !selectedObj.visible)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                          selectedObj.visible ? "bg-surface-lighter text-gray-300" : "bg-yellow-500/10 text-yellow-400"
                        }`}
                      >
                        {selectedObj.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {selectedObj.visible ? "Visible" : "Hidden"}
                      </button>
                      <button
                        onClick={() => updateSelectedProp("locked", !selectedObj.locked)}
                        className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-medium transition-all ${
                          selectedObj.locked ? "bg-red-500/10 text-red-400" : "bg-surface-lighter text-gray-300"
                        }`}
                      >
                        {selectedObj.locked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                        {selectedObj.locked ? "Locked" : "Unlocked"}
                      </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <button onClick={duplicateSelected} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-surface-lighter hover:bg-surface-border text-gray-300 text-[10px] font-medium transition-all">
                        <Copy className="w-3 h-3" /> Duplicate
                      </button>
                      <button onClick={deleteSelected} className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[10px] font-medium transition-all">
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center px-4">
                    <MousePointer className="w-6 h-6 text-gray-600 mb-2" />
                    <p className="text-[11px] text-gray-500 mb-1 font-medium">No object selected</p>
                    <p className="text-[10px] text-gray-600">Click an object in the viewport or outliner to edit its properties</p>
                    <div className="mt-4 space-y-1 text-left w-full">
                      <p className="text-[9px] font-bold text-gray-600 uppercase tracking-wider">Shortcuts</p>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[10px] text-gray-500">
                        <span><kbd className="text-brand">G</kbd> Move</span>
                        <span><kbd className="text-brand">R</kbd> Rotate</span>
                        <span><kbd className="text-brand">S</kbd> Scale</span>
                        <span><kbd className="text-brand">W</kbd> Wireframe</span>
                        <span><kbd className="text-brand">D</kbd> Duplicate</span>
                        <span><kbd className="text-brand">Del</kbd> Delete</span>
                        <span><kbd className="text-brand">X</kbd> Snap</span>
                        <span><kbd className="text-brand">M</kbd> Rulers</span>
                        <span><kbd className="text-brand">H</kbd> Hole</span>
                        <span><kbd className="text-brand">Esc</kbd> Deselect</span>
                        <span><kbd className="text-brand">⌘Z</kbd> Undo</span>
                        <span><kbd className="text-brand">⌘Y</kbd> Redo</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* ─── Chat Panel ─── */
              <>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-0">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[90%] px-2.5 py-2 rounded-lg text-[11px] leading-relaxed whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-brand/20 text-blue-100 rounded-br-sm"
                          : "bg-surface-lighter text-gray-300 rounded-bl-sm"
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-2 border-t border-surface-border shrink-0">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleChatSend(); }}
                      placeholder="Describe a model..."
                      className="flex-1 px-2.5 py-1.5 rounded bg-surface-lighter border border-surface-border text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-brand/50"
                    />
                    <button onClick={handleChatSend} disabled={!chatInput.trim()} className="p-1.5 rounded bg-brand hover:bg-brand-hover disabled:opacity-50 text-white transition-colors">
                      <Send className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Status bar */}
        <div className="h-5 bg-surface border-t border-surface-border flex items-center px-3 text-[9px] text-gray-600 gap-4 shrink-0">
          <span>Objects: {objects.length}</span>
          {selectedIds.length > 0 && <span className="text-brand">Selected: {selectedIds.length}</span>}
          <span>Mode: {transformMode}</span>
          {snapEnabled && <span className="text-yellow-500">Snap: {snapValue}</span>}
          {wireframe && <span className="text-blue-400">Wireframe</span>}
          {showRulers && <span className="text-blue-400">Rulers</span>}
          {csgGroups.length > 0 && <span>Groups: {csgGroups.length}</span>}
          {selectedObj && <span className="text-brand">{selectedObj.name} ({selectedObj.type})</span>}
          <span className="ml-auto">SpaceVision CAD</span>
        </div>
      </div>
    </div>
  );
}
