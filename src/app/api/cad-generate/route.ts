import { NextRequest } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "@/lib/auth";

const client = new Anthropic();

// ── Tools exposed to Claude for parametric CAD operations ──────────────────
const CAD_TOOLS: Anthropic.Tool[] = [
  {
    name: "add_primitive",
    description:
      "Add a solid primitive body to the model. Use for quick solid shapes without needing a sketch profile.",
    input_schema: {
      type: "object" as const,
      properties: {
        primitiveType: {
          type: "string",
          enum: ["box", "cylinder", "sphere", "cone", "torus", "wedge", "pipe"],
          description: "Type of primitive solid",
        },
        name: { type: "string", description: "Descriptive feature name" },
        operation: {
          type: "string",
          enum: ["add", "cut"],
          description: "Whether to add or subtract this solid",
          default: "add",
        },
        width: { type: "number", description: "Box width in mm" },
        height: { type: "number", description: "Box height in mm" },
        length: { type: "number", description: "Box length/depth in mm" },
        radius: { type: "number", description: "Cylinder/sphere/cone/torus outer radius in mm" },
        radius2: { type: "number", description: "Cone top radius or pipe inner radius or torus tube radius in mm" },
        depth: { type: "number", description: "Cylinder/cone/pipe height in mm" },
        posX: { type: "number", description: "X position offset in mm (default 0)" },
        posY: { type: "number", description: "Y position offset in mm (default 0)" },
        posZ: { type: "number", description: "Z position offset in mm (default 0)" },
      },
      required: ["primitiveType"],
    },
  },
  {
    name: "create_sketch_extrude",
    description:
      "Create a 2D sketch profile and immediately extrude it into a 3D solid. The most common way to create parts.",
    input_schema: {
      type: "object" as const,
      properties: {
        profile: {
          type: "string",
          enum: ["rectangle", "circle"],
          description: "Sketch profile shape",
        },
        name: { type: "string", description: "Feature name (e.g. 'Base Plate')" },
        plane: {
          type: "string",
          enum: ["XY", "XZ", "YZ"],
          description: "Sketch plane. XY = horizontal (default), XZ = front face, YZ = side face",
          default: "XY",
        },
        depth: { type: "number", description: "Extrusion depth in mm" },
        operation: {
          type: "string",
          enum: ["add", "cut"],
          description: "Add material or cut material",
          default: "add",
        },
        // Rectangle params
        rectWidth: { type: "number", description: "Rectangle width in mm (for rectangle profile)" },
        rectHeight: { type: "number", description: "Rectangle height in mm (for rectangle profile)" },
        originX: { type: "number", description: "Rectangle origin X offset in sketch plane (default -width/2 for centered)" },
        originY: { type: "number", description: "Rectangle origin Y offset in sketch plane (default -height/2 for centered)" },
        // Circle params
        circleRadius: { type: "number", description: "Circle radius in mm (for circle profile)" },
        centerX: { type: "number", description: "Circle center X in sketch plane (default 0)" },
        centerY: { type: "number", description: "Circle center Y in sketch plane (default 0)" },
      },
      required: ["profile", "depth"],
    },
  },
  {
    name: "add_fillet",
    description: "Round all sharp edges of the most recent solid feature. Apply after creating a solid.",
    input_schema: {
      type: "object" as const,
      properties: {
        radius: { type: "number", description: "Fillet radius in mm (typically 1-5mm)" },
        name: { type: "string" },
      },
      required: ["radius"],
    },
  },
  {
    name: "add_chamfer",
    description: "Bevel/chamfer all sharp edges of the most recent solid feature.",
    input_schema: {
      type: "object" as const,
      properties: {
        distance: { type: "number", description: "Chamfer distance in mm" },
        name: { type: "string" },
      },
      required: ["distance"],
    },
  },
  {
    name: "add_hole",
    description: "Add a cylindrical hole feature.",
    input_schema: {
      type: "object" as const,
      properties: {
        diameter: { type: "number", description: "Hole diameter in mm" },
        depth: { type: "number", description: "Hole depth in mm" },
        holeType: {
          type: "string",
          enum: ["simple", "countersink", "counterbore"],
          default: "simple",
        },
        name: { type: "string" },
      },
      required: ["diameter", "depth"],
    },
  },
  {
    name: "add_boolean",
    description:
      "Combine two existing features with a boolean operation (union, subtract, or intersect). Reference features by their ID from the feature tree.",
    input_schema: {
      type: "object" as const,
      properties: {
        operation: {
          type: "string",
          enum: ["union", "subtract", "intersect"],
          description: "Boolean operation type",
        },
        bodyAFeatureId: { type: "string", description: "Feature ID of the first (base) body" },
        bodyBFeatureId: { type: "string", description: "Feature ID of the second (tool) body" },
        name: { type: "string" },
      },
      required: ["operation", "bodyAFeatureId", "bodyBFeatureId"],
    },
  },
  {
    name: "add_linear_pattern",
    description: "Repeat an existing feature in a straight line.",
    input_schema: {
      type: "object" as const,
      properties: {
        sourceFeatureId: { type: "string", description: "Feature ID to pattern" },
        direction: { type: "string", enum: ["x", "y", "z"], description: "Pattern direction" },
        count: { type: "number", description: "Total number of instances (including original)" },
        spacing: { type: "number", description: "Distance between instances in mm" },
        name: { type: "string" },
      },
      required: ["sourceFeatureId", "direction", "count", "spacing"],
    },
  },
  {
    name: "add_circular_pattern",
    description: "Repeat an existing feature in a circle.",
    input_schema: {
      type: "object" as const,
      properties: {
        sourceFeatureId: { type: "string", description: "Feature ID to pattern" },
        axis: { type: "string", enum: ["x", "y", "z"], description: "Rotation axis" },
        count: { type: "number", description: "Total number of instances" },
        angle: { type: "number", description: "Total arc angle in degrees (360 = full circle)" },
        name: { type: "string" },
      },
      required: ["sourceFeatureId", "axis", "count", "angle"],
    },
  },
  {
    name: "modify_feature",
    description: "Change parameters of an existing feature. Only include properties to change.",
    input_schema: {
      type: "object" as const,
      properties: {
        featureId: { type: "string", description: "ID of the feature to modify (from feature tree)" },
        depth: { type: "number" },
        radius: { type: "number" },
        distance: { type: "number" },
        width: { type: "number" },
        height: { type: "number" },
        length: { type: "number" },
        name: { type: "string" },
        suppressed: { type: "boolean" },
      },
      required: ["featureId"],
    },
  },
  {
    name: "delete_feature",
    description: "Remove a feature from the model by its ID.",
    input_schema: {
      type: "object" as const,
      properties: {
        featureId: { type: "string", description: "ID of the feature to delete" },
      },
      required: ["featureId"],
    },
  },
];

function buildSystemPrompt(featureTree: unknown): string {
  const treeStr = featureTree
    ? JSON.stringify(featureTree, null, 2).slice(0, 3000)
    : "Empty project — no features yet.";

  return `You are an expert parametric CAD assistant for SpaceVision, an engineering CAD tool powered by OpenCASCADE (OCCT). You help users build precise 3D models using parametric features.

## Coordinate System
- Units: millimeters (mm)
- Origin at (0, 0, 0)
- Y-axis is up
- XY plane = horizontal ground plane
- XZ plane = front vertical face
- YZ plane = side vertical face

## Approach
- Think step by step about what operations are needed
- Start with the base shape, then add/cut features
- For complex shapes, combine multiple primitives and sketch extrusions
- Default dimensions if not specified: 20mm for most features
- Keep models centered around the origin unless the user specifies otherwise
- Explain what you're doing in plain language before or after each operation

## Current Feature Tree
${treeStr}

Use feature IDs from the tree when referencing existing features in modify/delete/boolean/pattern operations. If the model is empty, start building from scratch.`;
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const body = await req.json();
    const { message, featureTree, conversationHistory = [] } = body;

    if (!message) {
      return new Response(JSON.stringify({ error: "message required" }), { status: 400 });
    }

    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    const sendEvent = async (data: unknown) => {
      await writer.write(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
    };

    (async () => {
      try {
        // Build messages
        const messages: Anthropic.MessageParam[] = [
          ...conversationHistory,
          { role: "user" as const, content: message },
        ];

        let currentMessages = [...messages];
        const allToolCalls: Array<{ tool: string; input: Record<string, unknown> }> = [];

        for (let round = 0; round < 8; round++) {
          const stream = client.messages.stream({
            model: "claude-opus-4-6",
            max_tokens: 4096,
            system: buildSystemPrompt(featureTree),
            tools: CAD_TOOLS,
            messages: currentMessages,
          });

          let textSoFar = "";
          const toolCalls: Array<{ id: string; name: string; input: Record<string, unknown> }> = [];

          stream.on("text", async (text) => {
            textSoFar += text;
            await sendEvent({ type: "text_delta", text });
          });

          for await (const event of stream) {
            if (
              event.type === "content_block_stop" &&
              (event as any).content_block?.type === "tool_use"
            ) {
              const block = (event as any).content_block;
              toolCalls.push({ id: block.id, name: block.name, input: block.input });
              allToolCalls.push({ tool: block.name, input: block.input });
              await sendEvent({ type: "tool_done", tool: block.name, input: block.input });
            }
          }

          const finalMessage = await stream.finalMessage();

          if (finalMessage.stop_reason === "tool_use" && toolCalls.length > 0) {
            currentMessages.push({ role: "assistant", content: finalMessage.content });

            const toolResults: Anthropic.ToolResultBlockParam[] = toolCalls.map((tc) => ({
              type: "tool_result" as const,
              tool_use_id: tc.id,
              content: JSON.stringify({ success: true, applied: tc.name }),
            }));

            currentMessages.push({ role: "user", content: toolResults });
            continue;
          }

          break;
        }

        await sendEvent({ type: "done", toolCalls: allToolCalls });
      } catch (err: any) {
        await sendEvent({ type: "error", error: err.message || "CAD generation failed" });
      } finally {
        await writer.close();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    return new Response(
      `data: ${JSON.stringify({ type: "error", error: err.message })}\n\n`,
      { status: 500, headers: { "Content-Type": "text/event-stream" } }
    );
  }
}
