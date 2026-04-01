import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getFewShotExamples, formatFewShotPrompt } from '@/lib/training/compositionRecipes';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

const client = new Anthropic();

// Pre-compute few-shot examples for the system prompt
const FEW_SHOT_BLOCK = formatFewShotPrompt(getFewShotExamples(6));

const TOOLS: Anthropic.Tool[] = [
  {
    name: 'add_object',
    description: 'Add a new 3D object to the scene. Use descriptive names. Position objects so they rest on or above the ground (y >= 0). Keep scenes centered around origin.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Descriptive name like "House Wall Left"' },
        type: { type: 'string', enum: ['box', 'sphere', 'cylinder', 'cone', 'torus', 'torusKnot', 'dodecahedron', 'octahedron', 'plane', 'capsule', 'wedge', 'tube', 'star', 'roundedBox', 'text3d', 'halfSphere', 'pyramid', 'heart', 'spring', 'screw', 'roof', 'arrow', 'ring'] },
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
            // Rounded Box
            cornerRadius: { type: 'number' },
            rbWidth: { type: 'number' },
            rbHeight: { type: 'number' },
            rbDepth: { type: 'number' },
            // Text3D
            textContent: { type: 'string' },
            fontSize: { type: 'number' },
            extrudeDepth: { type: 'number' },
            bevelEnabled: { type: 'boolean' },
            bevelSize: { type: 'number' },
            // Pyramid
            pyramidHeight: { type: 'number' },
            pyramidBase: { type: 'number' },
            // Heart
            heartSize: { type: 'number' },
            heartDepth: { type: 'number' },
            // Spring
            springCoils: { type: 'number' },
            springRadius: { type: 'number' },
            wireRadius: { type: 'number' },
            // Screw
            screwLength: { type: 'number' },
            screwRadius: { type: 'number' },
            threadPitch: { type: 'number' },
            // Roof
            roofWidth: { type: 'number' },
            roofHeight: { type: 'number' },
            roofDepth: { type: 'number' },
            // Arrow
            arrowLength: { type: 'number' },
            arrowHeadSize: { type: 'number' },
            arrowDepth: { type: 'number' },
            // Ring
            ringRadius: { type: 'number' },
            ringThickness: { type: 'number' },
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
            // Rounded Box
            cornerRadius: { type: 'number' },
            rbWidth: { type: 'number' },
            rbHeight: { type: 'number' },
            rbDepth: { type: 'number' },
            // Text3D
            textContent: { type: 'string' },
            fontSize: { type: 'number' },
            extrudeDepth: { type: 'number' },
            bevelEnabled: { type: 'boolean' },
            bevelSize: { type: 'number' },
            // Pyramid
            pyramidHeight: { type: 'number' },
            pyramidBase: { type: 'number' },
            // Heart
            heartSize: { type: 'number' },
            heartDepth: { type: 'number' },
            // Spring
            springCoils: { type: 'number' },
            springRadius: { type: 'number' },
            wireRadius: { type: 'number' },
            // Screw
            screwLength: { type: 'number' },
            screwRadius: { type: 'number' },
            threadPitch: { type: 'number' },
            // Roof
            roofWidth: { type: 'number' },
            roofHeight: { type: 'number' },
            roofDepth: { type: 'number' },
            // Arrow
            arrowLength: { type: 'number' },
            arrowHeadSize: { type: 'number' },
            arrowDepth: { type: 'number' },
            // Ring
            ringRadius: { type: 'number' },
            ringThickness: { type: 'number' },
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

Available shape types: box, sphere, cylinder, cone, torus, torusKnot, dodecahedron, octahedron, plane, capsule, wedge, tube, star, roundedBox, text3d, halfSphere, pyramid, heart, spring, screw, roof, arrow, ring.

Each shape supports parametric controls:
- box: widthSegments, heightSegments, depthSegments (use scale for sizing)
- sphere: radius, widthSegs, heightSegs
- cylinder: radiusTop, radiusBottom, radialSegments, openEnded, thetaArc
- cone: coneRadius, coneHeight, coneSegments
- torus: torusRadius, tubeRadius, torusArc
- wedge: wedgeWidth, wedgeHeight, wedgeDepth (triangular prism / ramp)
- tube: tubeOuterRadius, tubeInnerRadius, tubeHeight (hollow cylinder)
- star: starPoints, starOuterRadius, starInnerRadius, starDepth (extruded star)
- roundedBox: cornerRadius, rbWidth, rbHeight, rbDepth (box with rounded corners)
- text3d: textContent (the text string), fontSize, extrudeDepth, bevelEnabled, bevelSize
- halfSphere: halfSphereRadius (dome/hemisphere)
- pyramid: pyramidHeight, pyramidBase (4-sided pyramid)
- heart: heartSize, heartDepth (heart shape)
- spring: springCoils, springRadius, wireRadius (helix coil)
- screw: screwLength, screwRadius, threadPitch (threaded rod)
- roof: roofWidth, roofHeight, roofDepth (triangular prism)
- arrow: arrowLength, arrowHeadSize, arrowDepth (3D arrow)
- ring: ringRadius, ringThickness (thin torus ring)
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
- For complex models, build them from multiple primitives composed together. Use 5-15 primitives for detailed objects.
- Choose materials that match the object (wood: roughness=0.8, metalness=0; metal: metalness=0.8, roughness=0.2; glass: metalness=0.1, roughness=0.05, opacity=0.5; stone: roughness=0.95, metalness=0).
- When asked general questions (not about scene manipulation), respond helpfully as a 3D modeling expert.

Spatial reference (common real-world proportions in scene units):
- Door: 0.8 wide, 2.0 tall | Window: 0.6 wide, 0.6 tall
- Table: 0.75 tall, 1.2-2.0 long | Chair: seat at 0.45, total 0.9 tall
- Person height: ~1.8 | Car: ~1.8 wide, ~4.0 long, ~1.4 tall
- Room: 3-5 wide, 2.5 tall | House: 2-3 wide, 2.0 walls + roof

Composition examples (follow these patterns for quality output):

${FEW_SHOT_BLOCK}

Current scene:
${sceneState}`;
}

export async function POST(req: NextRequest) {
  try {
    // Auth check — AI generation requires login
    const session = await auth();
    if (!session?.user?.id) {
      return new Response(
        JSON.stringify({ error: "Sign in to use AI generation" }),
        { status: 401 }
      );
    }

    // Email verification check
    if (!session.user.emailVerified) {
      return new Response(
        JSON.stringify({ error: "Please verify your email first" }),
        { status: 403 }
      );
    }

    // Rate limiting for free users
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { plan: true, dailyGenerations: true, lastGenerationDate: true },
    });

    if (user && user.plan === "FREE") {
      const now = new Date();
      const lastDate = user.lastGenerationDate;
      const isNewDay =
        !lastDate ||
        lastDate.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10);

      const currentCount = isNewDay ? 0 : user.dailyGenerations;

      if (currentCount >= 10) {
        return new Response(
          JSON.stringify({
            error: "Daily limit reached (10/day). Upgrade to Premium for unlimited.",
          }),
          { status: 429 }
        );
      }

      // Increment counter
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          dailyGenerations: isNewDay ? 1 : { increment: 1 },
          lastGenerationDate: now,
        },
      });
    }

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
