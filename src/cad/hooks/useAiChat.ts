"use client";

import { useState, useCallback, useRef } from "react";
import type { Feature, CadProject } from "../engine/types";
import {
  createSketch,
  addRectangleToSketch,
  addCircleToSketch,
  createExtrude,
  createFillet,
  createChamfer,
  createBoolean,
  createPrimitive,
  createHole,
  createLinearPattern,
  createCircularPattern,
} from "../engine/featureTree";
import type { PrimitiveType } from "../engine/types";

export interface AiChatMessage {
  id: string;
  role: "user" | "ai";
  text: string;
  toolCalls?: Array<{ tool: string; input: Record<string, unknown> }>;
}

interface UseAiChatOptions {
  project: CadProject;
  addFeature: (f: Feature) => void;
  updateFeature: (id: string, updates: Partial<Feature>) => void;
  removeFeature: (id: string) => void;
}

export function useAiChat({
  project,
  addFeature,
  updateFeature,
  removeFeature,
}: UseAiChatOptions) {
  const [messages, setMessages] = useState<AiChatMessage[]>([
    {
      id: "welcome",
      role: "ai",
      text: "Hi! I'm your CAD assistant. Describe what you want to build and I'll create parametric features for you.\n\nTry: \"Create a 50×30×10mm box\" or \"Add a 5mm fillet\" or \"Make a cylinder with a hole through the center\"",
    },
  ]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [input, setInput] = useState("");
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);
  const abortRef = useRef<AbortController | null>(null);

  // Build a compact, readable feature tree to give Claude context
  const serializeFeatureTree = useCallback(() => {
    return project.features.map((f) => ({
      id: f.id,
      type: f.type,
      name: f.name,
      suppressed: f.suppressed,
      // Include key dimension params per type
      ...(f.type === "extrude" && { depth: (f as any).depth, operation: (f as any).operation }),
      ...(f.type === "primitive" && {
        primitiveType: (f as any).primitiveType,
        width: (f as any).width,
        height: (f as any).height,
        length: (f as any).length,
        radius: (f as any).radius,
        depth: (f as any).depth,
      }),
      ...(f.type === "fillet" && { radius: (f as any).radius }),
      ...(f.type === "chamfer" && { distance: (f as any).distance }),
    }));
  }, [project.features]);

  // Execute a tool call from Claude → CAD operations
  const applyToolCall = useCallback(
    (tool: string, input: Record<string, unknown>) => {
      try {
        switch (tool) {
          case "add_primitive": {
            const ptype = (input.primitiveType as PrimitiveType) || "box";
            const op = (input.operation as "add" | "cut") || "add";
            const feature = createPrimitive(ptype, op);
            const overrides: Partial<Feature> = {};
            if (input.name) overrides.name = input.name as string;
            if (input.width !== undefined) (overrides as any).width = input.width;
            if (input.height !== undefined) (overrides as any).height = input.height;
            if (input.length !== undefined) (overrides as any).length = input.length;
            if (input.radius !== undefined) (overrides as any).radius = input.radius;
            if (input.radius2 !== undefined) (overrides as any).radius2 = input.radius2;
            if (input.depth !== undefined) (overrides as any).depth = input.depth;
            if (input.posX !== undefined || input.posY !== undefined || input.posZ !== undefined) {
              (overrides as any).position = {
                x: (input.posX as number) ?? 0,
                y: (input.posY as number) ?? 0,
                z: (input.posZ as number) ?? 0,
              };
            }
            addFeature({ ...feature, ...overrides } as Feature);
            break;
          }

          case "create_sketch_extrude": {
            const profile = (input.profile as string) || "rectangle";
            const plane = (input.plane as "XY" | "XZ" | "YZ") || "XY";
            const depth = (input.depth as number) || 10;
            const op = (input.operation as "add" | "cut") || "add";
            const baseName = (input.name as string) || `Sketch ${project.features.length + 1}`;

            // 1. Create sketch
            const sketch = createSketch(`${baseName} Sketch`, plane);
            let updatedSketch = { ...sketch };

            // 2. Add profile geometry
            if (profile === "rectangle") {
              const w = (input.rectWidth as number) || 20;
              const h = (input.rectHeight as number) || 20;
              const ox = input.originX !== undefined ? (input.originX as number) : -w / 2;
              const oy = input.originY !== undefined ? (input.originY as number) : -h / 2;
              updatedSketch = {
                ...updatedSketch,
                sketch: addRectangleToSketch(updatedSketch.sketch, ox, oy, w, h),
              };
            } else if (profile === "circle") {
              const r = (input.circleRadius as number) || 10;
              const cx = (input.centerX as number) || 0;
              const cy = (input.centerY as number) || 0;
              updatedSketch = {
                ...updatedSketch,
                sketch: addCircleToSketch(updatedSketch.sketch, cx, cy, r),
              };
            }

            // 3. Create extrude referencing the sketch
            const extrude = createExtrude(baseName, updatedSketch.id, depth, op);

            // Add both features
            addFeature(updatedSketch as Feature);
            addFeature(extrude);
            break;
          }

          case "add_fillet": {
            const radius = (input.radius as number) || 2;
            const fillet = createFillet(radius);
            if (input.name) fillet.name = input.name as string;
            addFeature(fillet);
            break;
          }

          case "add_chamfer": {
            const distance = (input.distance as number) || 1;
            const chamfer = createChamfer(distance);
            if (input.name) chamfer.name = input.name as string;
            addFeature(chamfer);
            break;
          }

          case "add_hole": {
            const diameter = (input.diameter as number) || 10;
            const depth = (input.depth as number) || 10;
            const holeType = (input.holeType as "simple" | "countersink" | "counterbore") || "simple";
            const hole = createHole(holeType, diameter, depth);
            if (input.name) hole.name = input.name as string;
            addFeature(hole);
            break;
          }

          case "add_boolean": {
            const op = (input.operation as "union" | "subtract" | "intersect") || "union";
            const bodyA = (input.bodyAFeatureId as string) || "";
            const bodyB = (input.bodyBFeatureId as string) || "";
            const bool = createBoolean(op, bodyA, bodyB);
            if (input.name) bool.name = input.name as string;
            addFeature(bool);
            break;
          }

          case "add_linear_pattern": {
            const sourceId = (input.sourceFeatureId as string) || "";
            const dir = (input.direction as "x" | "y" | "z") || "x";
            const count = (input.count as number) || 3;
            const spacing = (input.spacing as number) || 10;
            const pat = createLinearPattern(sourceId, dir, count, spacing);
            if (input.name) pat.name = input.name as string;
            addFeature(pat);
            break;
          }

          case "add_circular_pattern": {
            const sourceId = (input.sourceFeatureId as string) || "";
            const axis = (input.axis as "x" | "y" | "z") || "z";
            const count = (input.count as number) || 6;
            const angle = (input.angle as number) || 360;
            const pat = createCircularPattern(sourceId, axis, count, angle);
            if (input.name) pat.name = input.name as string;
            addFeature(pat);
            break;
          }

          case "modify_feature": {
            const featureId = input.featureId as string;
            const updates: Partial<Feature> = {};
            if (input.name !== undefined) updates.name = input.name as string;
            if (input.suppressed !== undefined) updates.suppressed = input.suppressed as boolean;
            const numberFields = ["depth", "radius", "distance", "width", "height", "length", "spacing", "angle"];
            for (const field of numberFields) {
              if (input[field] !== undefined) (updates as any)[field] = input[field];
            }
            updateFeature(featureId, updates);
            break;
          }

          case "delete_feature": {
            const featureId = input.featureId as string;
            removeFeature(featureId);
            break;
          }

          default:
            console.warn("[useAiChat] Unknown tool:", tool);
        }
      } catch (err) {
        console.error("[useAiChat] applyToolCall error", tool, err);
      }
    },
    [project.features, addFeature, updateFeature, removeFeature]
  );

  const sendMessage = useCallback(
    async (userText: string) => {
      if (!userText.trim() || isStreaming) return;

      const userMsg: AiChatMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        text: userText,
      };
      const aiId = `ai-${Date.now()}`;
      const aiMsg: AiChatMessage = { id: aiId, role: "ai", text: "", toolCalls: [] };

      setMessages((prev) => [...prev, userMsg, aiMsg]);
      setInput("");
      setIsStreaming(true);

      const abort = new AbortController();
      abortRef.current = abort;

      try {
        const res = await fetch("/api/cad-generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userText,
            featureTree: serializeFeatureTree(),
            conversationHistory: conversationHistoryRef.current.slice(-10),
          }),
          signal: abort.signal,
        });

        if (!res.ok || !res.body) throw new Error("Request failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let textSoFar = "";
        const toolsSoFar: Array<{ tool: string; input: Record<string, unknown> }> = [];

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            try {
              const event = JSON.parse(line.slice(6));

              switch (event.type) {
                case "text_delta":
                  textSoFar += event.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiId ? { ...m, text: textSoFar, toolCalls: toolsSoFar } : m
                    )
                  );
                  break;

                case "tool_done":
                  toolsSoFar.push({ tool: event.tool, input: event.input });
                  applyToolCall(event.tool, event.input);
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiId ? { ...m, toolCalls: [...toolsSoFar] } : m
                    )
                  );
                  break;

                case "done":
                  break;

                case "error":
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === aiId
                        ? { ...m, text: m.text || event.error || "Generation failed" }
                        : m
                    )
                  );
                  break;
              }
            } catch {
              // ignore JSON parse errors in stream
            }
          }
        }

        // Persist conversation history for multi-turn context
        conversationHistoryRef.current = [
          ...conversationHistoryRef.current,
          { role: "user", content: userText },
          { role: "assistant", content: textSoFar || "(applied CAD operations)" },
        ].slice(-20);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiId ? { ...m, text: "Connection error. Please try again." } : m
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [isStreaming, serializeFeatureTree, applyToolCall]
  );

  const stop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearHistory = useCallback(() => {
    conversationHistoryRef.current = [];
    setMessages([
      {
        id: "welcome",
        role: "ai",
        text: "Context cleared. What would you like to build?",
      },
    ]);
  }, []);

  return { messages, isStreaming, input, setInput, sendMessage, stop, clearHistory };
}
