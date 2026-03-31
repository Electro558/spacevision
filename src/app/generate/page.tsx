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
  Upload,
  Search as SearchIcon,
  Star,
  Hexagon,
  Hand,
  Crosshair,
  HelpCircle,
} from "lucide-react";
import * as THREE from "three";
import { exportToSTL } from "@/utils/stlExporter";
import { exportToOBJ } from "@/utils/objExporter";
import { exportToGLTF } from "@/utils/gltfExporter";
import { loadFile, detectFormat } from "@/utils/fileImporter";
import {
  type SceneObject,
  type CSGGroup,
  type HistoryEntry,
  createObject,
  duplicateObject,
  newId,
  serializeScene,
  buildGeometry,
} from "@/lib/cadStore";
import { toggleSelection, canPerformBoolean, getSelectionCenter } from "@/lib/multiSelect";
import { performGroupCSG } from "@/lib/csgEngine";
import { alignObjects, distributeObjects, type AlignAxis, type AlignMode } from "@/lib/alignEngine";
import { fuzzyFindObject, fuzzyFindObjects } from "@/lib/fuzzyMatch";
import BooleanToolbar from "@/components/BooleanToolbar";
import AlignToolbar from "@/components/AlignToolbar";
import SketchfabSearch from "@/components/SketchfabSearch";
import ToolCallChip from "@/components/ToolCallChip";
import ShapeDrawer from "@/components/ShapeDrawer";
import ObjectListPanel from "@/components/ObjectListPanel";
import TutorialOverlay from "@/components/TutorialOverlay";
import { MATERIAL_PRESETS, PRESET_KEYS, getPreset, SMOOTHNESS_LEVELS } from "@/lib/materialPresets";
import { AVAILABLE_TEXTURES } from "@/lib/textureManager";

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
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [draggingShape, setDraggingShape] = useState<{ type: SceneObject["type"]; asHole: boolean } | null>(null);
  const [interactionMode, setInteractionMode] = useState<"simple" | "advanced">("simple");
  const [tutorialActive, setTutorialActive] = useState(false);

  // ─── UI State ───
  const [rightPanel, setRightPanel] = useState<"chat" | "properties" | "search">("properties");
  const [showOutliner, setShowOutliner] = useState(true);
  const [prompt, setPrompt] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    role: "user" | "ai";
    text: string;
    id?: string;
    toolCalls?: Array<{ tool: string; input: Record<string, unknown> }>;
  }>>([
    { role: "ai", text: "Welcome to SpaceVision! Describe what you want to build or modify. I can see your entire scene and help you create, edit, or rearrange objects.\n\nTry: \"build a house\" or \"make the red cube taller\"" }
  ]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Conversation history in Anthropic API-native format
  const [conversationHistory, setConversationHistory] = useState<Array<Record<string, unknown>>>([]);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // ─── History (Undo/Redo) ───
  const [history, setHistory] = useState<HistoryEntry[]>([{ objects: [], selectedId: null }]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const sceneRef = useRef<THREE.Scene | null>(null);
  const importedGeometries = useRef<Map<string, THREE.BufferGeometry>>(new Map());

  // Derived state
  const selectedObj = useMemo(() => objects.find(o => o.id === selectedId) || null, [objects, selectedId]);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Auto-launch tutorial on first visit
  useEffect(() => {
    if (typeof window !== "undefined" && !localStorage.getItem("spacevision-tutorial-completed")) {
      setTutorialActive(true);
    }
  }, []);

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
    const count = objects.filter(o => o.visible && !o.groupId).length;
    const x = (count % 5) * 1.5;
    const z = Math.floor(count / 5) * 1.5;
    const obj = createObject(type, { position: [x, 0.5, z] });
    const newObjects = [...objects, obj];
    setObjects(newObjects);
    setSelectedIds([obj.id]);
    pushHistory(newObjects, obj.id);
  }, [objects, pushHistory]);

  const addFromDrawer = useCallback((type: SceneObject["type"], asHole?: boolean) => {
    const count = objects.filter(o => o.visible && !o.groupId).length;
    const x = (count % 5) * 1.5;
    const z = Math.floor(count / 5) * 1.5;
    const obj = createObject(type, {
      position: [x, 0.5, z],
      isHole: asHole || false,
    });
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

  const updateSelectedProps = useCallback((updates: Partial<SceneObject>) => {
    if (!selectedId) return;
    const newObjects = objects.map(o => o.id === selectedId ? { ...o, ...updates } : o);
    setObjects(newObjects);
    pushHistory(newObjects, selectedId);
  }, [objects, selectedId, pushHistory]);

  const applyPreset = useCallback((presetKey: string) => {
    if (!selectedId) return;
    const preset = getPreset(presetKey);
    const newObjects = objects.map(o =>
      o.id === selectedId
        ? {
            ...o,
            materialPreset: presetKey,
            metalness: preset.metalness,
            roughness: preset.roughness,
            opacity: preset.opacity,
            texture: preset.texture || undefined,
            color: presetKey !== 'custom' ? preset.color : o.color,
          }
        : o
    );
    setObjects(newObjects);
    pushHistory(newObjects, selectedId);
  }, [objects, selectedId, pushHistory]);

  const updateParam = useCallback((key: string, value: number | boolean) => {
    if (!selectedId) return;
    const newObjects = objects.map(o =>
      o.id === selectedId
        ? { ...o, params: { ...o.params, [key]: value } }
        : o
    );
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

  // ─── Clipboard ───
  const clipboardRef = useRef<Omit<SceneObject, 'id'>[]>([]);

  const copySelected = useCallback(() => {
    const sel = objects.filter(o => selectedIds.includes(o.id));
    if (sel.length === 0) return;
    clipboardRef.current = sel.map(({ id, ...rest }) => rest);
  }, [objects, selectedIds]);

  const pasteFromClipboard = useCallback(() => {
    if (clipboardRef.current.length === 0) return;
    const newObjs = clipboardRef.current.map(data => createObject(data.type, {
      ...data,
      name: `${data.name} Copy`,
      position: [data.position[0] + 0.5, data.position[1], data.position[2] + 0.5],
    }));
    const newObjects = [...objects, ...newObjs];
    setObjects(newObjects);
    setSelectedIds(newObjs.map(o => o.id));
    pushHistory(newObjects, newObjs[0]?.id || null);
  }, [objects, pushHistory]);

  const cutSelected = useCallback(() => {
    copySelected();
    if (selectedIds.length === 0) return;
    const newObjects = objects.filter(o => !selectedIds.includes(o.id));
    setObjects(newObjects);
    setSelectedIds([]);
    pushHistory(newObjects, null);
  }, [copySelected, objects, selectedIds, pushHistory]);

  // ─── Flatten to Ground ───
  const flattenSelected = useCallback(() => {
    if (selectedIds.length === 0) return;
    const newObjects = objects.map(o => {
      if (!selectedIds.includes(o.id)) return o;
      // Compute bounding box to find bottom
      const geo = buildGeometry(o.type, o.params);
      geo.computeBoundingBox();
      const minY = (geo.boundingBox?.min.y ?? -0.5) * o.scale[1];
      return { ...o, position: [o.position[0], -minY, o.position[2]] as [number, number, number] };
    });
    setObjects(newObjects);
    pushHistory(newObjects, selectedId);
  }, [objects, selectedIds, selectedId, pushHistory]);

  // ─── Mirror/Flip ───
  const flipSelected = useCallback((axis: 'x' | 'y' | 'z') => {
    if (selectedIds.length === 0) return;
    const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    const newObjects = objects.map(o => {
      if (!selectedIds.includes(o.id)) return o;
      const newScale: [number, number, number] = [...o.scale];
      newScale[idx] *= -1;
      return { ...o, scale: newScale };
    });
    setObjects(newObjects);
    pushHistory(newObjects, selectedId);
  }, [objects, selectedIds, selectedId, pushHistory]);

  const mirrorSelected = useCallback((axis: 'x' | 'y' | 'z') => {
    if (selectedIds.length === 0) return;
    const idx = axis === 'x' ? 0 : axis === 'y' ? 1 : 2;
    const sel = objects.filter(o => selectedIds.includes(o.id));
    const mirrored = sel.map(o => {
      const newPos: [number, number, number] = [...o.position];
      newPos[idx] *= -1;
      const newScale: [number, number, number] = [...o.scale];
      newScale[idx] *= -1;
      return createObject(o.type, {
        ...o,
        name: `${o.name} Mirror`,
        position: newPos,
        scale: newScale,
      });
    });
    const newObjects = [...objects, ...mirrored];
    setObjects(newObjects);
    setSelectedIds(mirrored.map(o => o.id));
    pushHistory(newObjects, mirrored[0]?.id || null);
  }, [objects, selectedIds, pushHistory]);

  // ─── AI Streaming Handler ───
  const handleAIChat = useCallback(async (userMessage: string) => {
    if (!userMessage.trim() || isStreaming) return;

    // Abort any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setIsStreaming(true);
    setIsGenerating(true);

    // Add user message to chat
    setChatMessages(prev => [...prev, { role: "user", text: userMessage }]);

    // Add placeholder AI message with stable ID
    const aiMessageId = `ai-${Date.now()}`;
    setChatMessages(prev => [...prev, { role: "ai", text: "", toolCalls: [], id: aiMessageId }]);

    try {
      const sceneState = serializeScene(objects);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: userMessage,
          conversationHistory,
          sceneState,
        }),
        signal: abortController.signal,
      });

      if (!response.ok || !response.body) {
        throw new Error('Stream connection failed');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulatedText = '';
      const accumulatedToolCalls: Array<{ tool: string; input: Record<string, unknown> }> = [];

      // Track objects state locally for mutations during stream
      let currentObjects = [...objects];

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr);

            switch (event.type) {
              case 'text_delta': {
                accumulatedText += event.text;
                const textSoFar = accumulatedText;
                const toolsSoFar = [...accumulatedToolCalls];
                setChatMessages(prev => prev.map(m =>
                  m.id === aiMessageId ? { ...m, text: textSoFar, toolCalls: toolsSoFar } : m
                ));
                break;
              }

              case 'tool_done': {
                const { tool, input } = event;
                accumulatedToolCalls.push({ tool, input });

                // Execute the tool call immediately
                switch (tool) {
                  case 'add_object': {
                    const newObj = createObject(input.type as SceneObject["type"], {
                      name: input.name as string,
                      position: (input.position as [number, number, number]) || [0, 0.5, 0],
                      rotation: (input.rotation as [number, number, number]) || [0, 0, 0],
                      scale: (input.scale as [number, number, number]) || [1, 1, 1],
                      color: (input.color as string) || '#6b8caf',
                      metalness: (input.metalness as number) ?? 0.3,
                      roughness: (input.roughness as number) ?? 0.5,
                      params: (input.params as Record<string, unknown>) || {},
                    });
                    currentObjects = [...currentObjects, newObj];
                    setObjects(currentObjects);
                    break;
                  }

                  case 'modify_object': {
                    const target = fuzzyFindObject(currentObjects, input.name as string);
                    if (target) {
                      currentObjects = currentObjects.map(obj => {
                        if (obj.id !== target.id) return obj;
                        const updates: Partial<SceneObject> = {};
                        if (input.position) updates.position = input.position as [number, number, number];
                        if (input.rotation) updates.rotation = input.rotation as [number, number, number];
                        if (input.scale) updates.scale = input.scale as [number, number, number];
                        if (input.color) updates.color = input.color as string;
                        if (input.metalness !== undefined) updates.metalness = input.metalness as number;
                        if (input.roughness !== undefined) updates.roughness = input.roughness as number;
                        if (input.new_name) updates.name = input.new_name as string;
                        if (input.params) updates.params = { ...obj.params, ...(input.params as Record<string, unknown>) };
                        return { ...obj, ...updates };
                      });
                      setObjects(currentObjects);
                    } else {
                      accumulatedText += `\n(Could not find object "${input.name}")`;
                    }
                    break;
                  }

                  case 'delete_object': {
                    const delTarget = fuzzyFindObject(currentObjects, input.name as string);
                    if (delTarget) {
                      currentObjects = currentObjects.filter(obj => obj.id !== delTarget.id);
                      setObjects(currentObjects);
                    } else {
                      accumulatedText += `\n(Could not find object "${input.name}" to delete)`;
                    }
                    break;
                  }

                  case 'select_objects': {
                    const { matched, unmatched } = fuzzyFindObjects(currentObjects, input.names as string[]);
                    if (matched.length > 0) {
                      setSelectedIds(matched.map(m => m.id));
                    }
                    if (unmatched.length > 0) {
                      accumulatedText += `\n(Could not find: ${unmatched.join(', ')})`;
                    }
                    break;
                  }
                }

                // Update chat message with tool calls
                const textSoFar2 = accumulatedText;
                const toolsSoFar2 = [...accumulatedToolCalls];
                setChatMessages(prev => prev.map(m =>
                  m.id === aiMessageId ? { ...m, text: textSoFar2, toolCalls: toolsSoFar2 } : m
                ));
                break;
              }

              case 'error': {
                accumulatedText += event.error || 'An error occurred';
                const errText = accumulatedText;
                setChatMessages(prev => prev.map(m =>
                  m.id === aiMessageId ? { ...m, text: errText } : m
                ));
                break;
              }

              case 'done': {
                // Push history for undo/redo
                pushHistory(currentObjects, selectedIds[0] || null);

                // Update conversation history with tool call context
                setConversationHistory(prev => {
                  const updated = [...prev];
                  updated.push({ role: 'user', content: userMessage });

                  const assistantContent: Array<Record<string, unknown>> = [];
                  if (accumulatedText) {
                    assistantContent.push({ type: 'text', text: accumulatedText });
                  }
                  for (const tc of accumulatedToolCalls) {
                    assistantContent.push({
                      type: 'tool_use',
                      id: `tool_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
                      name: tc.tool,
                      input: tc.input,
                    });
                  }
                  updated.push({
                    role: 'assistant',
                    content: assistantContent.length > 0 ? assistantContent : [{ type: 'text', text: 'Done.' }],
                  });

                  if (accumulatedToolCalls.length > 0) {
                    updated.push({
                      role: 'user',
                      content: accumulatedToolCalls.map((tc, idx) => ({
                        type: 'tool_result',
                        tool_use_id: (assistantContent.find(
                          (b, i) => b.type === 'tool_use' && b.name === tc.tool && i === (accumulatedText ? idx + 1 : idx)
                        ) as any)?.id || `tool_${idx}`,
                        content: JSON.stringify({ success: true }),
                      })),
                    });
                  }

                  return updated.slice(-60);
                });
                break;
              }
            }
          } catch (parseErr) {
            console.warn('Malformed SSE event:', jsonStr);
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        setChatMessages(prev => prev.map(m =>
          m.id === aiMessageId ? { ...m, text: m.text + '\n(Generation cancelled)' } : m
        ));
      } else {
        setChatMessages(prev => prev.map(m =>
          m.id === aiMessageId ? { ...m, text: err.message || 'Generation failed. Please try again.' } : m
        ));
      }
    } finally {
      setIsStreaming(false);
      setIsGenerating(false);
      abortControllerRef.current = null;
    }
  }, [isStreaming, objects, conversationHistory, pushHistory, selectedIds]);

  // ─── Chat Send (routes everything through AI) ───
  const handleChatSend = useCallback(() => {
    if (!chatInput.trim() || isStreaming) return;
    const msg = chatInput;
    setChatInput("");
    handleAIChat(msg);
  }, [chatInput, isStreaming, handleAIChat]);

  // ─── Generation from prompt bar ───
  const handleGenerate = useCallback(async () => {
    if (!prompt.trim() || isStreaming) return;
    const msg = prompt;
    setPrompt("");
    handleAIChat(msg);
  }, [prompt, isStreaming, handleAIChat]);

  // ─── Handle incoming prompt from URL ───
  const handleIncomingPrompt = useCallback(async (p: string) => {
    setPrompt(p);
    handleAIChat(p);
  }, [handleAIChat]);

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

  const handleExportOBJ = useCallback(() => {
    if (sceneRef.current) {
      exportToOBJ(sceneRef.current, "spacevision_model.obj");
      setChatMessages(prev => [...prev, { role: "ai", text: "Exported spacevision_model.obj + .mtl" }]);
    }
    setShowExportMenu(false);
  }, []);

  const handleExportGLTF = useCallback(async () => {
    if (sceneRef.current) {
      try {
        await exportToGLTF(sceneRef.current, "spacevision_model.glb");
        setChatMessages(prev => [...prev, { role: "ai", text: "Exported spacevision_model.glb" }]);
      } catch (err: any) {
        setChatMessages(prev => [...prev, { role: "ai", text: `GLB export failed: ${err.message}` }]);
      }
    }
    setShowExportMenu(false);
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

  // ─── File Import ───
  const handleFileImport = useCallback(async (file: File) => {
    try {
      const { geometry, name } = await loadFile(file);
      const objId = newId();
      importedGeometries.current.set(objId, geometry);

      const newObj = createObject('imported' as SceneObject["type"], {
        id: objId,
        name,
        position: [0, 0, 0],
      });

      const updated = [...objects, newObj];
      setObjects(updated);
      setSelectedIds([objId]);
      pushHistory(updated, objId);

      setChatMessages(prev => [...prev,
        { role: "ai", text: `Imported "${name}" successfully.` }
      ]);
    } catch (err: any) {
      setChatMessages(prev => [...prev,
        { role: "ai", text: `Import failed: ${err.message}` }
      ]);
    }
  }, [objects, pushHistory]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingShape(null);
    const files = Array.from(e.dataTransfer.files);
    const modelFile = files.find(f => detectFormat(f.name) !== null);
    if (modelFile) handleFileImport(modelFile);
  }, [handleFileImport]);

  // ─── Keyboard Shortcuts ───
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't intercept when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.key === "c" && (e.ctrlKey || e.metaKey)) { copySelected(); e.preventDefault(); return; }
      if (e.key === "v" && (e.ctrlKey || e.metaKey)) { pasteFromClipboard(); e.preventDefault(); return; }
      if (e.key === "x" && (e.ctrlKey || e.metaKey)) { cutSelected(); e.preventDefault(); return; }
      if (e.key === "f" || e.key === "F") { flattenSelected(); e.preventDefault(); return; }
      if (e.key === "X" && e.shiftKey && !e.ctrlKey && !e.metaKey) { flipSelected('x'); e.preventDefault(); return; }
      if (e.key === "Y" && e.shiftKey && !e.ctrlKey && !e.metaKey) { flipSelected('y'); e.preventDefault(); return; }
      if (e.key === "Z" && e.shiftKey && !e.ctrlKey && !e.metaKey) { flipSelected('z'); e.preventDefault(); return; }
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
      else if (e.key === "Escape") { if (abortControllerRef.current) { abortControllerRef.current.abort(); } setSelectedIds([]); e.preventDefault(); }
      else if (e.key === "a" && (e.ctrlKey || e.metaKey)) { setSelectedIds(objects.map(o => o.id)); e.preventDefault(); }
      else if (e.key === "x") { setSnapEnabled(prev => !prev); e.preventDefault(); }
      else if (e.key === "w") { setWireframe(prev => !prev); e.preventDefault(); }
      else if (e.key === "m" || e.key === "M") { setShowRulers(prev => !prev); e.preventDefault(); }
      else if (e.key === "q" || e.key === "Q") { setInteractionMode(prev => prev === "simple" ? "advanced" : "simple"); e.preventDefault(); }
      else if (e.key === "?") { setTutorialActive(prev => !prev); e.preventDefault(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [deleteSelected, duplicateSelected, undo, redo, objects, handleGroup, handleUngroup, handleToggleHole, selectedGroupId, copySelected, pasteFromClipboard, cutSelected, flattenSelected, flipSelected]);

  // ─── Primitives ───
  const primitiveTypes: { type: SceneObject["type"]; icon: any; label: string }[] = [
    { type: "box", icon: Box, label: "Cube" },
    { type: "sphere", icon: Circle, label: "Sphere" },
    { type: "cylinder", icon: Cylinder, label: "Cylinder" },
    { type: "cone", icon: Triangle, label: "Cone" },
    { type: "wedge", icon: Triangle, label: "Wedge" },
    { type: "tube", icon: Hexagon, label: "Tube" },
    { type: "star", icon: Star, label: "Star" },
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

        {/* Interaction mode toggle */}
        <button
          data-tutorial="mode-toggle"
          onClick={() => setInteractionMode(prev => prev === "simple" ? "advanced" : "simple")}
          title={`Mode: ${interactionMode === "simple" ? "Simple (click & drag)" : "Advanced (gizmo)"} — Press Q to toggle`}
          className={`w-8 h-8 rounded-md flex items-center justify-center transition-all text-[9px] font-bold ${
            interactionMode === "simple"
              ? "bg-green-500/20 text-green-400 border border-green-500/30"
              : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
          }`}
        >
          {interactionMode === "simple" ? <Hand className="w-3.5 h-3.5" /> : <Crosshair className="w-3.5 h-3.5" />}
        </button>

        <div className="w-5 border-t border-surface-border my-1" />

        {/* Transform tools (only visible in advanced mode) */}
        {interactionMode === "advanced" && ([
          { mode: "translate" as const, icon: Move, label: "Move (G)", key: "G" },
          { mode: "rotate" as const, icon: RotateCw, label: "Rotate (R)", key: "R" },
          { mode: "scale" as const, icon: Maximize2, label: "Scale (S)", key: "S" },
        ]).map(tool => (
          <button
            key={tool.mode}
            data-tutorial={tool.mode === "translate" ? "transform-tools" : undefined}
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

        {/* Quick add (full shape panel is the ShapeDrawer) */}
        <p className="text-[7px] text-gray-600 font-bold tracking-wider">ADD</p>
        <button
          onClick={() => addPrimitive("box")}
          title="Quick Add Cube"
          className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-surface-lighter transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {/* Import file button */}
        <label className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-surface-lighter cursor-pointer transition-all" title="Import STL/OBJ/GLTF">
          <Upload className="w-3.5 h-3.5" />
          <input
            type="file"
            accept=".stl,.obj,.gltf,.glb"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileImport(file);
              e.target.value = '';
            }}
          />
        </label>

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

        {/* Help / Tutorial */}
        <button
          onClick={() => setTutorialActive(true)}
          title="Tutorial (?)"
          className="w-8 h-8 rounded-md flex items-center justify-center text-gray-500 hover:text-white hover:bg-surface-lighter transition-all"
        >
          <HelpCircle className="w-3.5 h-3.5" />
        </button>
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
                <div className="relative">
                  <button
                    data-tutorial="export"
                    onClick={() => setShowExportMenu(prev => !prev)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-brand hover:bg-brand-hover text-white text-[11px] font-medium transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Export
                    <ChevronDown className="w-2.5 h-2.5" />
                  </button>
                  {showExportMenu && (
                    <div className="absolute top-full left-0 mt-1 bg-surface-lighter border border-surface-border rounded-md shadow-xl py-1 z-50 min-w-[120px]">
                      <button
                        onClick={() => { handleExportSTL(); setShowExportMenu(false); }}
                        className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-brand/20 hover:text-white"
                      >
                        STL (3D Print)
                      </button>
                      <button
                        onClick={handleExportOBJ}
                        className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-brand/20 hover:text-white"
                      >
                        OBJ + MTL
                      </button>
                      <button
                        onClick={handleExportGLTF}
                        className="w-full text-left px-3 py-1.5 text-[11px] text-gray-300 hover:bg-brand/20 hover:text-white"
                      >
                        GLB (GLTF)
                      </button>
                    </div>
                  )}
                </div>
                <button onClick={handleClearScene} className="flex items-center gap-1 px-2 py-1 rounded bg-surface-lighter hover:bg-surface-border text-gray-300 text-[11px] font-medium transition-colors">
                  <RotateCcw className="w-3 h-3" />
                  Clear
                </button>
              </>
            )}
            <div className="w-px h-4 bg-surface-border mx-1" />
            <button
              onClick={() => setRightPanel(rightPanel === "properties" ? "chat" : rightPanel === "chat" ? "search" : "properties")}
              title={rightPanel === "properties" ? "Switch to Chat" : rightPanel === "chat" ? "Switch to Search" : "Switch to Properties"}
              className="p-1 rounded text-gray-500 hover:text-white hover:bg-surface-lighter transition-all"
            >
              {rightPanel === "properties" ? <MessageSquare className="w-3.5 h-3.5" /> : rightPanel === "chat" ? <SearchIcon className="w-3.5 h-3.5" /> : <Settings2 className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Viewport + Side Panels */}
        <div className="flex-1 flex min-h-0">

          {/* ─── Object List Panel (left side) ─── */}
          {showOutliner && objects.length > 0 && (
            <div className="w-48 bg-surface border-r border-surface-border flex flex-col shrink-0 overflow-hidden">
              <ObjectListPanel
                objects={objects}
                csgGroups={csgGroups}
                selectedIds={selectedIds}
                onSelect={(id, additive) => {
                  if (additive) {
                    setSelectedIds(prev => toggleSelection(prev, id));
                  } else {
                    setSelectedIds(prev => prev.length === 1 && prev[0] === id ? [] : [id]);
                  }
                }}
                onToggleVisibility={(id) => {
                  const newObjects = objects.map(o => o.id === id ? { ...o, visible: !o.visible } : o);
                  setObjects(newObjects);
                  pushHistory(newObjects, selectedId);
                }}
                onToggleLock={(id) => {
                  const newObjects = objects.map(o => o.id === id ? { ...o, locked: !o.locked } : o);
                  setObjects(newObjects);
                  pushHistory(newObjects, selectedId);
                }}
                onDelete={(id) => {
                  const newObjects = objects.filter(o => o.id !== id);
                  setObjects(newObjects);
                  if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(sid => sid !== id));
                  pushHistory(newObjects, null);
                }}
                onDuplicate={(id) => {
                  const obj = objects.find(o => o.id === id);
                  if (!obj) return;
                  const dupe = duplicateObject(obj);
                  const newObjects = [...objects, dupe];
                  setObjects(newObjects);
                  setSelectedIds([dupe.id]);
                  pushHistory(newObjects, dupe.id);
                }}
                onRename={(id, name) => {
                  const newObjects = objects.map(o => o.id === id ? { ...o, name } : o);
                  setObjects(newObjects);
                  pushHistory(newObjects, selectedId);
                }}
                onToggleHole={(id) => {
                  const newObjects = objects.map(o => o.id === id ? { ...o, isHole: !o.isHole } : o);
                  setObjects(newObjects);
                  pushHistory(newObjects, selectedId);
                }}
              />
              {/* Boolean toolbar */}
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
              {/* Align toolbar */}
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
          <div className="flex-1 relative cad-grid" onDragOver={handleDragOver} onDrop={handleDrop}>
            {isGenerating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-dark/70 z-10">
                <Loader2 className="w-8 h-8 text-brand animate-spin" />
                <p className="text-xs text-gray-400">Generating geometry...</p>
              </div>
            )}

            {objects.length > 0 ? (
              <>
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
                  interactionMode={interactionMode}
                  onSelect={(id: string) => setSelectedIds([id])}
                  onDeselect={() => setSelectedIds([])}
                  onMarqueeSelect={(ids, additive) => {
                    if (additive) {
                      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
                    } else {
                      setSelectedIds(ids);
                    }
                  }}
                  onTransformUpdate={handleTransformUpdate}
                  onSceneReady={(scene) => { sceneRef.current = scene; }}
                  importedGeometries={importedGeometries}
                  className="w-full h-full"
                  draggingShape={draggingShape}
                  onDropShape={(type, position, asHole) => {
                    const obj = createObject(type as SceneObject["type"], { position, isHole: asHole });
                    const newObjects = [...objects, obj];
                    setObjects(newObjects);
                    setSelectedIds([obj.id]);
                    pushHistory(newObjects, obj.id);
                    setDraggingShape(null);
                  }}
                />
              </>
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

            <ShapeDrawer
              onAddShape={addFromDrawer}
              onDragStart={(type, asHole) => setDraggingShape({ type, asHole })}
            />

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
          <div data-tutorial="properties" className="w-64 bg-surface border-l border-surface-border flex flex-col shrink-0 overflow-hidden">
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
              <button
                onClick={() => setRightPanel("search")}
                className={`flex-1 text-[10px] font-semibold transition-all ${
                  rightPanel === "search" ? "text-brand bg-brand/5 border-b border-brand" : "text-gray-500 hover:text-white"
                }`}
              >
                Search
              </button>
            </div>

            {rightPanel === "search" ? (
              /* ─── Search Panel ─── */
              <SketchfabSearch onImportUrl={(url, name) => {
                // Users download from Sketchfab and then drag-drop into the app
              }} />
            ) : rightPanel === "properties" ? (
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


                    {/* Shape Parameters */}
                    {selectedObj && ['sphere', 'cylinder', 'cone', 'torus'].includes(selectedObj.type) && (
                      <div className="space-y-1.5">
                        <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Shape Parameters</label>
                        {selectedObj.type === 'sphere' && (
                          <div className="space-y-1 mt-1">
                            <NumInput label="R" value={selectedObj.params.radius ?? 0.5} onChange={v => updateParam('radius', Math.max(0.1, v))} step={0.05} color="text-cyan-400" />
                            <div className="grid grid-cols-2 gap-1">
                              <NumInput label="WS" value={selectedObj.params.widthSegs ?? 32} onChange={v => updateParam('widthSegs', Math.max(8, Math.min(64, Math.round(v))))} step={1} color="text-cyan-400" />
                              <NumInput label="HS" value={selectedObj.params.heightSegs ?? 32} onChange={v => updateParam('heightSegs', Math.max(8, Math.min(64, Math.round(v))))} step={1} color="text-cyan-400" />
                            </div>
                          </div>
                        )}
                        {selectedObj.type === 'cylinder' && (
                          <div className="space-y-1 mt-1">
                            <div className="grid grid-cols-2 gap-1">
                              <NumInput label="RT" value={selectedObj.params.radiusTop ?? 0.5} onChange={v => updateParam('radiusTop', Math.max(0, v))} step={0.05} color="text-cyan-400" />
                              <NumInput label="RB" value={selectedObj.params.radiusBottom ?? 0.5} onChange={v => updateParam('radiusBottom', Math.max(0, v))} step={0.05} color="text-cyan-400" />
                            </div>
                            <NumInput label="Sides" value={selectedObj.params.radialSegments ?? 32} onChange={v => updateParam('radialSegments', Math.max(3, Math.min(64, Math.round(v))))} step={1} color="text-cyan-400" />
                            <div className="flex items-center gap-2 mt-0.5">
                              <label className="text-[10px] text-gray-400">Open Ended</label>
                              <input type="checkbox" checked={selectedObj.params.openEnded ?? false} onChange={e => updateParam('openEnded', e.target.checked)} className="accent-brand" />
                            </div>
                          </div>
                        )}
                        {selectedObj.type === 'cone' && (
                          <div className="space-y-1 mt-1">
                            <NumInput label="R" value={selectedObj.params.coneRadius ?? 0.5} onChange={v => updateParam('coneRadius', Math.max(0.1, v))} step={0.05} color="text-cyan-400" />
                            <NumInput label="Sides" value={selectedObj.params.coneSegments ?? 32} onChange={v => updateParam('coneSegments', Math.max(3, Math.min(64, Math.round(v))))} step={1} color="text-cyan-400" />
                          </div>
                        )}
                        {selectedObj.type === 'torus' && (
                          <div className="space-y-1 mt-1">
                            <div className="grid grid-cols-2 gap-1">
                              <NumInput label="MR" value={selectedObj.params.torusRadius ?? 0.4} onChange={v => updateParam('torusRadius', Math.max(0.1, v))} step={0.05} color="text-cyan-400" />
                              <NumInput label="TR" value={selectedObj.params.tubeRadius ?? 0.15} onChange={v => updateParam('tubeRadius', Math.max(0.01, Math.min(0.5, v)))} step={0.01} color="text-cyan-400" />
                            </div>
                            <div className="grid grid-cols-2 gap-1">
                              <NumInput label="RS" value={selectedObj.params.torusRadialSegments ?? 16} onChange={v => updateParam('torusRadialSegments', Math.max(3, Math.min(32, Math.round(v))))} step={1} color="text-cyan-400" />
                              <NumInput label="TS" value={selectedObj.params.torusTubularSegments ?? 48} onChange={v => updateParam('torusTubularSegments', Math.max(6, Math.min(64, Math.round(v))))} step={1} color="text-cyan-400" />
                            </div>
                            <NumInput label="Arc" value={Math.round((selectedObj.params.torusArc ?? Math.PI * 2) * 180 / Math.PI)} onChange={v => updateParam('torusArc', Math.max(0, Math.min(360, v)) * Math.PI / 180)} step={5} color="text-cyan-400" />
                          </div>
                        )}
                      </div>
                    )}
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

                    {/* Material Preset */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Material Preset</label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {PRESET_KEYS.map(key => (
                          <button
                            key={key}
                            onClick={() => applyPreset(key)}
                            className={`px-2 py-1 rounded text-[9px] font-medium transition-all ${
                              selectedObj.materialPreset === key
                                ? "bg-brand text-white"
                                : "bg-surface-dark text-gray-400 hover:text-white hover:bg-surface-lighter border border-surface-border"
                            }`}
                          >
                            {MATERIAL_PRESETS[key].name}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Texture */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Texture</label>
                      <select
                        value={selectedObj.texture || "none"}
                        onChange={(e) => updateSelectedProp("texture", e.target.value === "none" ? undefined : e.target.value)}
                        className="w-full mt-1 px-2 py-1.5 rounded bg-surface-dark border border-surface-border text-[11px] text-white focus:outline-none focus:border-brand/50"
                      >
                        <option value="none">None</option>
                        {AVAILABLE_TEXTURES.map(t => (
                          <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1).replace(/([A-Z])/g, ' $1')}</option>
                        ))}
                      </select>
                    </div>

                    {/* Smoothness */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Smoothness</label>
                      <div className="flex gap-1 mt-1">
                        {SMOOTHNESS_LEVELS.map((level, idx) => (
                          <button
                            key={level.label}
                            onClick={() => updateSelectedProp("smoothness", idx)}
                            className={`flex-1 py-1 rounded text-[9px] font-medium transition-all ${
                              (selectedObj.smoothness ?? 1) === idx
                                ? "bg-brand text-white"
                                : "bg-surface-dark text-gray-400 hover:text-white hover:bg-surface-lighter border border-surface-border"
                            }`}
                          >
                            {level.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Material Properties */}
                    <div>
                      <label className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Material Properties</label>
                      <div className="space-y-1.5 mt-1">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Metalness</span>
                          <span className="text-[10px] text-gray-500 font-mono">{selectedObj.metalness.toFixed(2)}</span>
                        </div>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          value={selectedObj.metalness}
                          onChange={(e) => updateSelectedProps({ metalness: parseFloat(e.target.value), materialPreset: "custom" })}
                          className="w-full h-1 accent-brand"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Roughness</span>
                          <span className="text-[10px] text-gray-500 font-mono">{selectedObj.roughness.toFixed(2)}</span>
                        </div>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          value={selectedObj.roughness}
                          onChange={(e) => updateSelectedProps({ roughness: parseFloat(e.target.value), materialPreset: "custom" })}
                          className="w-full h-1 accent-brand"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-gray-400">Opacity</span>
                          <span className="text-[10px] text-gray-500 font-mono">{(selectedObj.opacity ?? 1).toFixed(2)}</span>
                        </div>
                        <input
                          type="range" min="0" max="1" step="0.05"
                          value={selectedObj.opacity ?? 1}
                          onChange={(e) => updateSelectedProp("opacity", parseFloat(e.target.value))}
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
                        <span><kbd className="text-brand">F</kbd> Flatten</span>
                        <span><kbd className="text-brand">⌘C</kbd> Copy</span>
                        <span><kbd className="text-brand">⌘V</kbd> Paste</span>
                        <span><kbd className="text-brand">⌘X</kbd> Cut</span>
                        <span><kbd className="text-brand">⇧X</kbd> Flip X</span>
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
                {/* Scene context badge */}
                <div className="px-2.5 py-1 border-b border-surface-border text-[9px] text-gray-500 flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${objects.length > 0 ? 'bg-green-500' : 'bg-gray-600'}`} />
                  AI sees {objects.length} object{objects.length !== 1 ? 's' : ''}
                  {isStreaming && <Loader2 className="w-2.5 h-2.5 animate-spin ml-auto text-brand" />}
                </div>
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2 min-h-0">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[90%] px-2.5 py-2 rounded-lg text-[11px] leading-relaxed whitespace-pre-line ${
                        msg.role === "user"
                          ? "bg-brand/20 text-blue-100 rounded-br-sm"
                          : "bg-surface-lighter text-gray-300 rounded-bl-sm"
                      }`}>
                        {msg.text}
                        {msg.toolCalls && msg.toolCalls.length > 0 && (
                          <div className="flex flex-col gap-0.5 mt-1">
                            {msg.toolCalls.map((tc, j) => (
                              <ToolCallChip key={j} tool={tc.tool} input={tc.input} />
                            ))}
                          </div>
                        )}
                        {msg.role === "ai" && i === chatMessages.length - 1 && isStreaming && (
                          <span className="inline-block w-1.5 h-3 bg-brand animate-pulse ml-0.5 align-middle" />
                        )}
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
                      placeholder="Describe what to build or modify..."
                      className="flex-1 px-2.5 py-1.5 rounded bg-surface-lighter border border-surface-border text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-brand/50"
                    />
                    <button onClick={handleChatSend} disabled={!chatInput.trim() || isStreaming} className="p-1.5 rounded bg-brand hover:bg-brand-hover disabled:opacity-50 text-white transition-colors">
                      {isStreaming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
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
          <span>{interactionMode === "simple" ? "Simple" : `Advanced: ${transformMode}`}</span>
          {snapEnabled && <span className="text-yellow-500">Snap: {snapValue}</span>}
          {wireframe && <span className="text-blue-400">Wireframe</span>}
          {showRulers && <span className="text-blue-400">Rulers</span>}
          {csgGroups.length > 0 && <span>Groups: {csgGroups.length}</span>}
          {selectedObj && <span className="text-brand">{selectedObj.name} ({selectedObj.type})</span>}
          <span className="ml-auto">SpaceVision CAD</span>
        </div>
      </div>

      {/* Tutorial Overlay */}
      <TutorialOverlay
        isActive={tutorialActive}
        onClose={() => setTutorialActive(false)}
        onAddDemoCube={() => {
          if (objects.length === 0) {
            addPrimitive("box");
          }
        }}
      />
    </div>
  );
}
