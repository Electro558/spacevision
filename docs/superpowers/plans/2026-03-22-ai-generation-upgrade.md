# AI Generation Upgrade Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the stateless regex-based AI generation with a scene-aware, streaming Claude assistant that can add, modify, delete, and select objects through natural conversation.

**Architecture:** Rewrite the `/api/generate` route to use Anthropic tool-use with SSE streaming. The frontend consumes the stream, executing scene mutations in real-time as tool calls arrive. Conversation history (Anthropic API-native format) is maintained for iterative refinement. The old `generateFromPrompt()` regex engine is removed entirely.

**Tech Stack:** Anthropic SDK (tool-use streaming), Next.js App Router (SSE via TransformStream), React state for conversation memory.

**Spec:** `docs/superpowers/specs/2026-03-22-ai-generation-upgrade-design.md`

---

## Chunk 1: API Route + Scene Serialization

### Task 1: Add `serializeScene()` to cadStore

**Files:**
- Modify: `src/lib/cadStore.ts` (add function after line 160, before `generateFromPrompt`)

- [ ] **Step 1: Add `serializeScene` function**

Add this function to `src/lib/cadStore.ts` right before the `generateFromPrompt` function:

```typescript
export function serializeScene(objects: SceneObject[]): string {
  if (objects.length === 0) return '(empty scene)';
  return objects.map(obj => {
    let line = `- "${obj.name}" (${obj.type}): pos=[${obj.position}], rot=[${obj.rotation}], scale=[${obj.scale}], color=${obj.color}, metal=${obj.metalness}, rough=${obj.roughness}`;
    if (!obj.visible) line += ', HIDDEN';
    if (obj.locked) line += ', LOCKED';
    if (obj.isHole) line += ', HOLE';
    if (obj.type === 'imported') line += ', IMPORTED_MESH';
    return line;
  }).join('\n');
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/electro/Desktop/code/spacevision && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/lib/cadStore.ts
git commit -m "feat: add serializeScene for AI scene awareness"
```

---

### Task 2: Rewrite API route with streaming tool-use

**Files:**
- Rewrite: `src/app/api/generate/route.ts`

- [ ] **Step 1: Rewrite the API route**

Replace the entire contents of `src/app/api/generate/route.ts` with:

```typescript
import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'add_object',
    description: 'Add a new 3D object to the scene. Use descriptive names. Position objects so they rest on or above the ground (y >= 0). Keep scenes centered around origin.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Descriptive name like "House Wall Left"' },
        type: { type: 'string', enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'torusKnot', 'dodecahedron', 'octahedron', 'plane', 'capsule'] },
        position: { type: 'array', items: { type: 'number' }, description: '[x, y, z] world position. y=0 is ground.' },
        rotation: { type: 'array', items: { type: 'number' }, description: '[x, y, z] Euler angles in radians' },
        scale: { type: 'array', items: { type: 'number' }, description: '[x, y, z] scale factors' },
        color: { type: 'string', description: 'Hex color e.g. #ff0000' },
        metalness: { type: 'number', description: '0-1 metallic appearance' },
        roughness: { type: 'number', description: '0-1 surface roughness' },
        params: {
          type: 'object',
          description: 'Shape-specific parametric controls',
          properties: {
            radius: { type: 'number' },
            widthSegs: { type: 'number' },
            heightSegs: { type: 'number' },
            radiusTop: { type: 'number' },
            radiusBottom: { type: 'number' },
            radialSegments: { type: 'number' },
            openEnded: { type: 'boolean' },
            thetaArc: { type: 'number' },
            torusRadius: { type: 'number' },
            tubeRadius: { type: 'number' },
            torusArc: { type: 'number' },
            coneRadius: { type: 'number' },
            coneHeight: { type: 'number' },
            coneSegments: { type: 'number' },
          },
        },
      },
      required: ['name', 'type', 'position'],
    },
  },
  {
    name: 'modify_object',
    description: 'Modify an existing object in the scene by name. Only include properties you want to change.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Name of object to modify (fuzzy matched)' },
        position: { type: 'array', items: { type: 'number' } },
        rotation: { type: 'array', items: { type: 'number' } },
        scale: { type: 'array', items: { type: 'number' } },
        color: { type: 'string' },
        metalness: { type: 'number' },
        roughness: { type: 'number' },
        new_name: { type: 'string', description: 'Rename the object' },
        params: {
          type: 'object',
          description: 'Shape-specific parametric controls',
          properties: {
            radius: { type: 'number' },
            widthSegs: { type: 'number' },
            heightSegs: { type: 'number' },
            radiusTop: { type: 'number' },
            radiusBottom: { type: 'number' },
            radialSegments: { type: 'number' },
            openEnded: { type: 'boolean' },
            thetaArc: { type: 'number' },
            torusRadius: { type: 'number' },
            tubeRadius: { type: 'number' },
            torusArc: { type: 'number' },
            coneRadius: { type: 'number' },
            coneHeight: { type: 'number' },
            coneSegments: { type: 'number' },
          },
        },
      },
      required: ['name'],
    },
  },
  {
    name: 'delete_object',
    description: 'Delete an object from the scene by name.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Name of object to delete (fuzzy matched)' },
      },
      required: ['name'],
    },
  },
  {
    name: 'select_objects',
    description: 'Select/highlight objects in the viewport so the user can see what you are referencing.',
    input_schema: {
      type: 'object' as const,
      properties: {
        names: { type: 'array', items: { type: 'string' }, description: 'Names of objects to select' },
      },
      required: ['names'],
    },
  },
];

function buildSystemPrompt(sceneState: string): string {
  return `You are a 3D modeling assistant for a TinkerCAD-like editor called SpaceVision. You help users create and modify 3D scenes using primitive shapes.

Available shape types: box, sphere, cylinder, cone, torus, torusKnot, dodecahedron, octahedron, plane, capsule.

Each shape supports parametric controls:
- box: widthSegments, heightSegments, depthSegments (use scale for sizing)
- sphere: radius, widthSegs, heightSegs
- cylinder: radiusTop, radiusBottom, radialSegments, openEnded, thetaArc
- cone: coneRadius, coneHeight, coneSegments
- torus: torusRadius, tubeRadius, torusArc
- capsule, torusKnot, dodecahedron, octahedron, plane: use scale for sizing

Objects marked IMPORTED_MESH are file imports — you can modify their position, rotation, scale, color, and material, but not their geometry type or params.
Objects marked LOCKED should not be modified unless the user explicitly asks.
Objects marked HIDDEN exist but are not visible — mention them if relevant.

Rules:
- Use the provided tools to add, modify, delete, or select objects.
- y=0 is the ground plane. Position objects so they rest on or above the ground.
- Keep proportions realistic and scenes centered around the origin.
- Use descriptive object names (e.g., "House Wall Left" not "Box 1").
- After making changes, briefly explain what you did in plain text.
- When the user refers to "it" or "that", use conversation context and the current scene to determine what they mean.
- For complex models, build them from multiple primitives composed together.
- Choose materials that match the object (wood: roughness=0.8, metalness=0; metal: metalness=0.8, roughness=0.2; glass: metalness=0.1, roughness=0.05).
- When asked general questions (not about scene manipulation), respond helpfully as a 3D modeling expert.

Current scene:
${sceneState}`;
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, conversationHistory, sceneState } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return new Response(
        `data: ${JSON.stringify({ type: 'error', error: 'Prompt is required' })}\n\n`,
        { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
      );
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return new Response(
        `data: ${JSON.stringify({ type: 'error', error: 'Set ANTHROPIC_API_KEY in .env.local to enable AI' })}\n\n`,
        { status: 500, headers: { 'Content-Type': 'text/event-stream' } }
      );
    }

    const systemPrompt = buildSystemPrompt(sceneState || '(empty scene)');

    // Build messages: conversation history + new user message
    const messages: Anthropic.MessageParam[] = [];
    if (Array.isArray(conversationHistory)) {
      // Take last 20 exchanges
      const recent = conversationHistory.slice(-40);
      messages.push(...recent);
    }
    messages.push({ role: 'user', content: prompt });

    // Set up SSE stream
    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    // Sequential write queue to ensure event ordering
    let writePromise = Promise.resolve();
    const sendEvent = (data: Record<string, unknown>) => {
      writePromise = writePromise.then(() =>
        writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      );
      return writePromise;
    };

    // Process in background
    (async () => {
      try {
        let currentMessages = [...messages];
        let iterations = 0;
        const maxIterations = 5;

        while (iterations < maxIterations) {
          iterations++;

          const response = client.messages.stream({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 8192,
            system: systemPrompt,
            tools: TOOLS,
            messages: currentMessages,
          });

          const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

          response.on('text', async (text) => {
            await sendEvent({ type: 'text_delta', text });
          });

          response.on('contentBlock', async (block) => {
            if (block.type === 'tool_use') {
              currentToolId = block.id;
              currentToolName = block.name;
              toolCalls.push({ id: block.id, name: block.name, input: block.input as Record<string, unknown> });
              await sendEvent({
                type: 'tool_done',
                tool: block.name,
                input: block.input,
                toolId: block.id,
              });
            }
          });

          const finalMessage = await response.finalMessage();

          // Check if we need to continue (tool use requires tool_result round-trip)
          if (finalMessage.stop_reason === 'tool_use' && toolCalls.length > 0) {
            // Add assistant message with all content blocks
            currentMessages.push({
              role: 'assistant',
              content: finalMessage.content,
            });

            // Add synthetic tool results
            const toolResults: Anthropic.ToolResultBlockParam[] = toolCalls.map(tc => ({
              type: 'tool_result' as const,
              tool_use_id: tc.id,
              content: JSON.stringify({ success: true, message: `${tc.name} executed successfully` }),
            }));

            currentMessages.push({
              role: 'user',
              content: toolResults,
            });

            // Continue the loop for more tool calls or final text
            continue;
          }

          // Done - no more tool calls
          break;
        }

        await sendEvent({ type: 'done' });
      } catch (error: any) {
        console.error('Streaming error:', error);
        const errorMsg = error?.status === 401
          ? 'Invalid API key. Check your ANTHROPIC_API_KEY in .env.local'
          : error?.status === 429
            ? 'Rate limited — please wait a moment and try again'
            : error?.message || 'Generation failed';
        await sendEvent({ type: 'error', error: errorMsg });
      } finally {
        await writer.close();
      }
    })();

    return new Response(stream.readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Generate API error:', error);
    return new Response(
      `data: ${JSON.stringify({ type: 'error', error: error.message || 'Generation failed' })}\n\n`,
      { status: 500, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/electro/Desktop/code/spacevision && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/app/api/generate/route.ts
git commit -m "feat: rewrite API route with streaming tool-use"
```

---

## Chunk 2: Frontend Streaming Consumer + Fuzzy Matching

### Task 3: Add fuzzy name matching utility

**Files:**
- Create: `src/lib/fuzzyMatch.ts`

- [ ] **Step 1: Create fuzzy match utility**

Create `src/lib/fuzzyMatch.ts`:

```typescript
import type { SceneObject } from './cadStore';

/**
 * Fuzzy-match an object by name.
 * 1. Exact match (case-insensitive)
 * 2. Includes match (name contains search term, case-insensitive)
 * Returns null if no match found.
 */
export function fuzzyFindObject(
  objects: SceneObject[],
  searchName: string
): SceneObject | null {
  const lower = searchName.toLowerCase();

  // 1. Exact match
  const exact = objects.find(o => o.name.toLowerCase() === lower);
  if (exact) return exact;

  // 2. Includes match
  const includes = objects.find(o => o.name.toLowerCase().includes(lower));
  if (includes) return includes;

  // 3. Reverse includes (search term contains object name)
  const reverse = objects.find(o => lower.includes(o.name.toLowerCase()));
  if (reverse) return reverse;

  return null;
}

/**
 * Fuzzy-match multiple objects by name array.
 * Returns matched objects and unmatched names.
 */
export function fuzzyFindObjects(
  objects: SceneObject[],
  searchNames: string[]
): { matched: SceneObject[]; unmatched: string[] } {
  const matched: SceneObject[] = [];
  const unmatched: string[] = [];

  for (const name of searchNames) {
    const found = fuzzyFindObject(objects, name);
    if (found && !matched.some(m => m.id === found.id)) {
      matched.push(found);
    } else if (!found) {
      unmatched.push(name);
    }
  }

  return { matched, unmatched };
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/electro/Desktop/code/spacevision && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/lib/fuzzyMatch.ts
git commit -m "feat: add fuzzy name matching for AI object references"
```

---

### Task 4: Create ToolCallChip component

**Files:**
- Create: `src/components/ToolCallChip.tsx`

- [ ] **Step 1: Create the component**

Create `src/components/ToolCallChip.tsx`:

```tsx
'use client';

interface ToolCallChipProps {
  tool: string;
  input: Record<string, unknown>;
}

export default function ToolCallChip({ tool, input }: ToolCallChipProps) {
  const name = (input.name as string) || (input.names as string[])?.join(', ') || '';

  switch (tool) {
    case 'add_object': {
      const type = input.type as string;
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] font-medium my-0.5">
          <span>+</span>
          <span>Added &quot;{name}&quot; ({type})</span>
        </div>
      );
    }
    case 'modify_object': {
      const changes = Object.keys(input).filter(k => k !== 'name' && k !== 'new_name');
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-[10px] font-medium my-0.5">
          <span>~</span>
          <span>Modified &quot;{name}&quot; &rarr; {changes.join(', ')}</span>
        </div>
      );
    }
    case 'delete_object':
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-medium my-0.5">
          <span>&times;</span>
          <span>Deleted &quot;{name}&quot;</span>
        </div>
      );
    case 'select_objects': {
      const names = input.names as string[];
      return (
        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[10px] font-medium my-0.5">
          <span>&#9673;</span>
          <span>Selected {names?.join(', ')}</span>
        </div>
      );
    }
    default:
      return null;
  }
}
```

- [ ] **Step 2: Verify build**

Run: `cd /Users/electro/Desktop/code/spacevision && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/components/ToolCallChip.tsx
git commit -m "feat: add ToolCallChip component for AI action display"
```

---

### Task 5: Integrate streaming consumer into page.tsx

This is the largest task — rewiring the frontend to consume SSE, execute tool calls, and maintain conversation history.

**Files:**
- Modify: `src/app/generate/page.tsx`

- [ ] **Step 1: Update imports**

In `src/app/generate/page.tsx`, add these imports after the existing imports (around line 60):

```typescript
import ToolCallChip from "@/components/ToolCallChip";
import { fuzzyFindObject, fuzzyFindObjects } from "@/lib/fuzzyMatch";
import { serializeScene } from "@/lib/cadStore";
```

Also remove `generateFromPrompt` from the cadStore import (line 53):

Change:
```typescript
  createObject,
  duplicateObject,
  newId,
  generateFromPrompt,
} from "@/lib/cadStore";
```
To:
```typescript
  createObject,
  duplicateObject,
  newId,
} from "@/lib/cadStore";
```

- [ ] **Step 2: Replace chat state types**

Replace the `chatMessages` state (around line 118) and add new state:

Change:
```typescript
  const [chatMessages, setChatMessages] = useState<Array<{role: "user" | "ai"; text: string}>>([
    { role: "ai", text: "Welcome to SpaceVision! Describe a 3D model or scene to generate, or add primitives from the left toolbar.\n\nShortcuts: G=Move, R=Rotate, S=Scale, W=Wireframe, D=Duplicate, Del=Delete, X=Snap, M=Rulers, H=Hole, Ctrl+G=Group, Ctrl+A=Select All" }
  ]);
```

To:
```typescript
  // Chat display messages (for UI rendering)
  const [chatMessages, setChatMessages] = useState<Array<{
    role: "user" | "ai";
    text: string;
    id?: string; // Stable ID for streaming message updates
    toolCalls?: Array<{ tool: string; input: Record<string, unknown> }>;
  }>>([
    { role: "ai", text: "Welcome to SpaceVision! Describe what you want to build or modify. I can see your entire scene and help you create, edit, or rearrange objects.\n\nTry: \"build a house\" or \"make the red cube taller\"" }
  ]);

  // Conversation history in Anthropic API-native format
  const [conversationHistory, setConversationHistory] = useState<Array<Record<string, unknown>>>([]);

  // Streaming state
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
```

Also add a cleanup `useEffect` to abort streaming on unmount (add near the other useEffects):

```typescript
  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);
```

- [ ] **Step 3: Replace `generateWithAI` and `handleChatSend` with new streaming handler**

Remove the entire `generateWithAI` function (lines 222-248), `handleGenerate` (lines 251-274), `handleIncomingPrompt` (lines 276-297), and `handleChatSend` (lines 299-329).

Replace them all with this single streaming handler:

```typescript
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

    // Add placeholder AI message — use a unique ID for stable lookup
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
                    const newObj = createObject(input.type as string, {
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
                      // Object not found — add warning to text
                      accumulatedText += `\n(Could not find object "${input.name}")`;
                    }
                    break;
                  }

                  case 'delete_object': {
                    const target = fuzzyFindObject(currentObjects, input.name as string);
                    if (target) {
                      currentObjects = currentObjects.filter(obj => obj.id !== target.id);
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
                const textSoFar = accumulatedText;
                const toolsSoFar = [...accumulatedToolCalls];
                setChatMessages(prev => prev.map(m =>
                  m.id === aiMessageId ? { ...m, text: textSoFar, toolCalls: toolsSoFar } : m
                ));
                break;
              }

              case 'error': {
                accumulatedText += event.error || 'An error occurred';
                const textSoFar = accumulatedText;
                setChatMessages(prev => prev.map(m =>
                  m.id === aiMessageId ? { ...m, text: textSoFar } : m
                ));
                break;
              }

              case 'done': {
                // Push history for undo/redo
                pushHistory(currentObjects, selectedIds[0] || null);

                // Update conversation history — include tool calls so Claude
                // remembers what it created/modified in follow-up messages.
                // Build assistant content blocks matching Anthropic API format.
                setConversationHistory(prev => {
                  const updated = [...prev];
                  updated.push({ role: 'user', content: userMessage });

                  // Build assistant content with both text and tool_use blocks
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

                  // Add synthetic tool results so the conversation is valid
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

                  // Keep last 60 entries (20 exchanges, each may have 3 messages: user + assistant + tool_results)
                  return updated.slice(-60);
                });
                break;
              }
            }
          } catch (parseErr) {
            // Skip malformed SSE events
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

  // ─── Chat Send (now routes everything through AI) ───
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
```

- [ ] **Step 4: Update keyboard shortcut for Escape to cancel streaming**

Find the keyboard event handler (the `useEffect` with `keydown`). The Escape key is handled via an `else if` chain (not a switch/case). Find the line:

```typescript
else if (e.key === "Escape") { setSelectedIds([]); e.preventDefault(); }
```

Replace it with:

```typescript
else if (e.key === "Escape") { if (abortControllerRef.current) { abortControllerRef.current.abort(); } setSelectedIds([]); e.preventDefault(); }
```

- [ ] **Step 5: Update chat UI rendering to show tool call chips and streaming**

Replace the chat message rendering block (around lines 1127-1139). Change:

```tsx
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
```

To:

```tsx
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
      {/* Streaming indicator */}
      {msg.role === "ai" && i === chatMessages.length - 1 && isStreaming && (
        <span className="inline-block w-1.5 h-3 bg-brand animate-pulse ml-0.5 align-middle" />
      )}
    </div>
  </div>
))}
```

- [ ] **Step 6: Add scene context badge above chat**

Add a badge showing the AI's scene awareness. Find the chat panel section header (around the chat tab area) and add before the chat messages div:

```tsx
{/* Scene context badge */}
<div className="px-2.5 py-1 border-b border-surface-border text-[9px] text-gray-500 flex items-center gap-1">
  <div className={`w-1.5 h-1.5 rounded-full ${objects.length > 0 ? 'bg-green-500' : 'bg-gray-600'}`} />
  AI sees {objects.length} object{objects.length !== 1 ? 's' : ''}
  {isStreaming && <Loader2 className="w-2.5 h-2.5 animate-spin ml-auto text-brand" />}
</div>
```

- [ ] **Step 7: Update the send button to disable during streaming**

Change the send button's disabled check from `!chatInput.trim()` to `!chatInput.trim() || isStreaming`:

```tsx
<button onClick={handleChatSend} disabled={!chatInput.trim() || isStreaming} className="p-1.5 rounded bg-brand hover:bg-brand-hover disabled:opacity-50 text-white transition-colors">
  {isStreaming ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
</button>
```

- [ ] **Step 8: Verify build**

Run: `cd /Users/electro/Desktop/code/spacevision && npx next build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 9: Commit**

```bash
git add src/app/generate/page.tsx
git commit -m "feat: integrate streaming AI with scene awareness and tool execution"
```

---

## Chunk 3: Cleanup + Final Verification

### Task 6: Remove `generateFromPrompt` from cadStore

**Files:**
- Modify: `src/lib/cadStore.ts`

- [ ] **Step 1: Remove `generateFromPrompt`**

Delete the entire `generateFromPrompt` function from `src/lib/cadStore.ts` (lines 162-504 approximately — the large function with all the regex pattern matching). Keep the `serializeScene` function that was added in Task 1.

Also remove the `generateFromPrompt` from the module's exports if it's explicitly exported.

- [ ] **Step 2: Verify no other files import `generateFromPrompt`**

Run: `grep -r "generateFromPrompt" src/ --include="*.ts" --include="*.tsx"`
Expected: No matches (we already removed the import in Task 5)

- [ ] **Step 3: Verify build**

Run: `cd /Users/electro/Desktop/code/spacevision && npx next build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/lib/cadStore.ts
git commit -m "refactor: remove regex-based generateFromPrompt (replaced by Claude AI)"
```

---

### Task 7: Manual verification

**Files:** None (testing only)

- [ ] **Step 1: Start dev server**

Run: `cd /Users/electro/Desktop/code/spacevision && npm run dev`

- [ ] **Step 2: Test basic generation**

Open `http://localhost:3000/generate`. In the AI Chat tab, type "build a simple house" and send. Verify:
- Text streams in character-by-character
- Tool call chips appear (green "Added" chips)
- Objects appear on the workplane as they're generated
- Scene context badge shows object count updating

- [ ] **Step 3: Test scene modification**

After generating the house, type "make the roof red" and send. Verify:
- Claude identifies the roof object
- Yellow "Modified" chip appears
- The roof changes color on the workplane

- [ ] **Step 4: Test iterative conversation**

Type "add a chimney on top" and verify Claude uses conversation context to place it correctly.

- [ ] **Step 5: Test error handling**

Type a message with an empty scene and verify a helpful response (not a crash).

- [ ] **Step 6: Test cancel**

Start a generation, press Escape. Verify it cancels cleanly with "(Generation cancelled)" message.

- [ ] **Step 7: Commit final state**

If any fixes were needed during testing:
```bash
git add -A
git commit -m "fix: address issues found during AI generation testing"
```
