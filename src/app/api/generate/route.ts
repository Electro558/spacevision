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
        type: { type: 'string', enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'torusKnot', 'dodecahedron', 'octahedron', 'plane', 'capsule', 'wedge', 'tube', 'star'] },
        position: { type: 'array', items: { type: 'number' }, description: '[x, y, z] world position. y=0 is ground.' },
        rotation: { type: 'array', items: { type: 'number' }, description: '[x, y, z] Euler angles in radians' },
        scale: { type: 'array', items: { type: 'number' }, description: '[x, y, z] scale factors' },
        color: { type: 'string', description: 'Hex color e.g. #ff0000' },
        metalness: { type: 'number', description: '0-1 metallic appearance' },
        roughness: { type: 'number', description: '0-1 surface roughness' },
        opacity: { type: 'number', description: '0-1 transparency. 1=opaque (default), 0=invisible' },
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
            // Wedge
            wedgeWidth: { type: 'number' },
            wedgeHeight: { type: 'number' },
            wedgeDepth: { type: 'number' },
            // Tube
            tubeOuterRadius: { type: 'number' },
            tubeInnerRadius: { type: 'number' },
            tubeHeight: { type: 'number' },
            // Star
            starPoints: { type: 'number' },
            starOuterRadius: { type: 'number' },
            starInnerRadius: { type: 'number' },
            starDepth: { type: 'number' },
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
        opacity: { type: 'number', description: '0-1 transparency' },
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

Available shape types: box, sphere, cylinder, cone, torus, torusKnot, dodecahedron, octahedron, plane, capsule, wedge, tube, star.

Each shape supports parametric controls:
- box: widthSegments, heightSegments, depthSegments (use scale for sizing)
- sphere: radius, widthSegs, heightSegs
- cylinder: radiusTop, radiusBottom, radialSegments, openEnded, thetaArc
- cone: coneRadius, coneHeight, coneSegments
- torus: torusRadius, tubeRadius, torusArc
- wedge: wedgeWidth, wedgeHeight, wedgeDepth (triangular prism / ramp)
- tube: tubeOuterRadius, tubeInnerRadius, tubeHeight (hollow cylinder)
- star: starPoints, starOuterRadius, starInnerRadius, starDepth (extruded star)
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

          response.on('text', (text) => {
            sendEvent({ type: 'text_delta', text });
          });

          response.on('contentBlock', (block) => {
            if (block.type === 'tool_use') {
              toolCalls.push({ id: block.id, name: block.name, input: block.input as Record<string, unknown> });
              sendEvent({
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
