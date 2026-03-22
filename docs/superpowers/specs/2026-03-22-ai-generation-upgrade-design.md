# Scene-Aware AI Assistant with Streaming

**Date:** 2026-03-22
**Status:** Approved
**Scope:** Upgrade AI 3D generation from stateless regex-based system to a scene-aware, streaming, tool-use Claude assistant that can add, modify, delete, and select objects through natural conversation.

---

## Problem

The current AI generation has two disconnected systems:

1. **Local `generateFromPrompt()`** — 500+ lines of regex pattern matching. "house" always produces the same hardcoded house. No variation, no intelligence, no scene awareness.
2. **Claude API route** — stateless. Each request is isolated. No conversation memory, no knowledge of what's on the workplane, no ability to modify existing objects. The chat UI is a display log, not a real conversation.

Users cannot say "make that box taller" or "add a window to the house" — the AI has no idea what's in the scene.

## Solution

Replace both systems with a single **scene-aware Claude assistant** that uses **tool-use streaming** to manipulate the 3D scene in real-time through natural conversation.

## Architecture

### Tool Schema

Claude receives 4 tools for scene manipulation:

#### `add_object`
Create a new object on the workplane.

```json
{
  "name": "add_object",
  "description": "Add a new 3D object to the scene",
  "input_schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Descriptive name for the object" },
      "type": { "type": "string", "enum": ["box", "sphere", "cylinder", "cone", "torus", "torusKnot", "dodecahedron", "octahedron", "plane", "capsule"] },
      "position": { "type": "array", "items": { "type": "number" }, "description": "[x, y, z] world position. y=0 is ground." },
      "rotation": { "type": "array", "items": { "type": "number" }, "description": "[x, y, z] rotation in radians" },
      "scale": { "type": "array", "items": { "type": "number" }, "description": "[x, y, z] scale factors" },
      "color": { "type": "string", "description": "Hex color, e.g. #ff0000" },
      "metalness": { "type": "number", "description": "0-1, metallic appearance" },
      "roughness": { "type": "number", "description": "0-1, surface roughness" },
      "params": {
        "type": "object",
        "description": "Shape-specific parametric controls",
        "properties": {
          "radius": { "type": "number" },
          "widthSegs": { "type": "integer" },
          "heightSegs": { "type": "integer" },
          "radiusTop": { "type": "number" },
          "radiusBottom": { "type": "number" },
          "radialSegments": { "type": "integer" },
          "openEnded": { "type": "boolean" },
          "thetaArc": { "type": "number" },
          "torusRadius": { "type": "number" },
          "tubeRadius": { "type": "number" },
          "torusArc": { "type": "number" },
          "coneRadius": { "type": "number" },
          "coneHeight": { "type": "number" },
          "coneSegments": { "type": "integer" }
        }
      }
    },
    "required": ["name", "type", "position"]
  }
}
```

#### `modify_object`
Change properties of an existing object. Only include properties that are changing.

```json
{
  "name": "modify_object",
  "description": "Modify an existing object in the scene by name",
  "input_schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Name of the object to modify (fuzzy matched)" },
      "position": { "type": "array", "items": { "type": "number" } },
      "rotation": { "type": "array", "items": { "type": "number" } },
      "scale": { "type": "array", "items": { "type": "number" } },
      "color": { "type": "string" },
      "metalness": { "type": "number" },
      "roughness": { "type": "number" },
      "new_name": { "type": "string", "description": "Rename the object" },
      "params": { "type": "object" }
    },
    "required": ["name"]
  }
}
```

#### `delete_object`
Remove an object from the scene.

```json
{
  "name": "delete_object",
  "description": "Delete an object from the scene by name",
  "input_schema": {
    "type": "object",
    "properties": {
      "name": { "type": "string", "description": "Name of the object to delete (fuzzy matched)" }
    },
    "required": ["name"]
  }
}
```

#### `select_objects`
Highlight objects in the viewport so the user sees what the AI is referencing.

```json
{
  "name": "select_objects",
  "description": "Select objects in the viewport to highlight them",
  "input_schema": {
    "type": "object",
    "properties": {
      "names": { "type": "array", "items": { "type": "string" }, "description": "Names of objects to select" }
    },
    "required": ["names"]
  }
}
```

### Streaming Pipeline

#### API Route (`/api/generate/route.ts` — rewritten)

- Accepts POST with `{ prompt, conversationHistory, sceneState }`
- Uses `anthropic.messages.stream()` with tool definitions
- Returns Server-Sent Events (SSE) via `TransformStream`
- Event types:
  - `text_delta` — partial text content (chat message building)
  - `tool_start` — tool call beginning (name + partial input)
  - `tool_done` — complete tool call with full input (triggers scene mutation)
  - `done` — stream complete
  - `error` — error occurred

#### Frontend Consumer (`generate/page.tsx`)

- Uses `fetch()` with `response.body.getReader()` to consume SSE stream
- Processes events as they arrive:
  - `text_delta` → append to current AI chat message (character-by-character)
  - `tool_done` → execute scene mutation immediately:
    - `add_object` → call `createObject()`, append to scene state
    - `modify_object` → fuzzy-match object by name, update changed properties
    - `delete_object` → fuzzy-match object by name, remove from scene
    - `select_objects` → fuzzy-match names, update `selectedIds`
  - `done` → finalize message, save to conversation history

#### Fuzzy Name Matching

`modify_object` and `delete_object` match by name using:
1. Exact match (case-insensitive)
2. Includes match (name contains search term)
3. Fallback: first object if only one exists

This lets the user say "make the cube bigger" and Claude says `modify_object({name: "cube"})` — which matches "Red Cube" or "Base Cube".

### Conversation Memory

- Store last 10 message exchanges in component state
- Each exchange = `{ role: "user" | "assistant", content: string, toolCalls?: ToolCall[] }`
- Sent with every API request so Claude maintains context
- Enables iterative refinement: "make it bigger" → "no, the other one" → "perfect, now make it blue"

### Scene State Serialization

Before each API call, serialize the current scene:

```typescript
function serializeScene(objects: SceneObject[]): string {
  return objects.map(obj =>
    `- "${obj.name}" (${obj.type}): pos=[${obj.position}], scale=[${obj.scale}], color=${obj.color}`
  ).join('\n');
}
```

Compact format to minimize tokens. Sent as part of the system prompt context.

### System Prompt

```
You are a 3D modeling assistant for a TinkerCAD-like editor called SpaceVision. You help users create and modify 3D scenes using primitive shapes.

Available shape types: box, sphere, cylinder, cone, torus, torusKnot, dodecahedron, octahedron, plane, capsule.

Each shape supports parametric controls:
- sphere: radius, widthSegs, heightSegs
- cylinder: radiusTop, radiusBottom, radialSegments, openEnded, thetaArc
- cone: coneRadius, coneHeight, coneSegments
- torus: torusRadius, tubeRadius, torusArc

Rules:
- Use the provided tools to add, modify, delete, or select objects.
- y=0 is the ground plane. Position objects so they rest on or above the ground.
- Keep proportions realistic and scenes centered around the origin.
- Use descriptive object names (e.g., "House Wall Left" not "Box 1").
- After making changes, briefly explain what you did in plain text.
- When the user refers to "it" or "that", use conversation context and the current scene to determine what they mean.
- For complex models, build them from multiple primitives composed together.
- Choose materials that match the object (wood=rough, metal=metallic, glass=low roughness+low metalness).

Current scene:
{sceneState}
```

### Chat UI Upgrades

1. **Streaming text** — AI messages build character-by-character as deltas arrive
2. **Tool call chips** — inline indicators in chat showing what the AI did:
   - Green chip: "✚ Added 'House Base'"
   - Yellow chip: "✎ Modified 'Wall' → scale"
   - Red chip: "✕ Deleted 'Old Roof'"
   - Blue chip: "◉ Selected 'Door', 'Window'"
3. **Scene context badge** — top of chat panel shows "AI sees N objects"
4. **No more heuristic routing** — everything goes to Claude. Even "hello" gets a contextual AI response.
5. **Loading state** — pulsing indicator while waiting for first stream event

## What Gets Removed

1. **`generateFromPrompt()`** in `cadStore.ts` — entire 340-line regex-based generator. Claude replaces it.
2. **`generateWithAI()`** in `page.tsx` — replaced by new streaming `handleAIChat()`.
3. **Old chat heuristic** in `handleChatSend()` — no more "starts with make/create" detection.
4. **Old `/api/generate` route** — completely rewritten for streaming tool-use.

## Files Modified

| File | Change |
|------|--------|
| `src/app/api/generate/route.ts` | Rewrite: streaming SSE + tool-use |
| `src/app/generate/page.tsx` | New `handleAIChat()`, streaming consumer, tool call execution, conversation state, UI upgrades |
| `src/lib/cadStore.ts` | Remove `generateFromPrompt()`, add `serializeScene()` |
| `src/components/ToolCallChip.tsx` | New: inline tool call indicator component |

## Error Handling

- **No API key**: Show message in chat "Set ANTHROPIC_API_KEY in .env.local to enable AI"
- **Rate limited (429)**: "Rate limited — please wait a moment and try again"
- **Malformed tool call**: Skip it, log warning, continue processing stream
- **Stream interruption**: Show partial results + "Generation interrupted" message
- **Object not found** (modify/delete): Show "Couldn't find object named 'X'" in chat, skip mutation
- **Fallback**: If API is unavailable entirely, show helpful error in chat (no silent failures)
