import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic(); // reads ANTHROPIC_API_KEY from env automatically

const SYSTEM_PROMPT = `You are a 3D scene generator for a CAD application. Given a text description, you generate an array of 3D objects that compose the described scene.

Each object has these properties:
- name: string (descriptive name like "Table Leg 1")
- type: one of "box", "sphere", "cylinder", "cone", "torus", "torusKnot", "dodecahedron", "octahedron", "plane", "capsule"
- position: [x, y, z] - world coordinates. Y is up. Ground is at y=0.
- rotation: [x, y, z] - Euler angles in radians
- scale: [x, y, z] - scale factors
- color: hex color string like "#8B4513"
- metalness: 0-1 (0 = matte, 1 = metallic mirror)
- roughness: 0-1 (0 = glossy, 1 = rough)

Guidelines:
- Position objects so they sit on the ground (y >= 0)
- Use realistic proportions and spatial relationships
- Choose appropriate colors and materials
- Keep scenes centered around origin (0, 0, 0)
- Use metalness/roughness to convey material types (wood: metalness=0, roughness=0.8; metal: metalness=0.8, roughness=0.2; glass: metalness=0.1, roughness=0.05)
- Be creative with combining primitives to create complex shapes
- Return between 2-20 objects depending on complexity

Respond with ONLY a JSON array of objects. No markdown, no explanation, just the JSON array.`;

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 500 });
    }

    const message = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    // Extract text content
    const textBlock = message.content.find(b => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      return NextResponse.json({ error: 'No response from Claude' }, { status: 500 });
    }

    // Parse the JSON array
    let rawText = textBlock.text.trim();
    // Strip markdown code fences if present
    if (rawText.startsWith('```')) {
      rawText = rawText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const objects = JSON.parse(rawText);

    if (!Array.isArray(objects)) {
      return NextResponse.json({ error: 'Invalid response format' }, { status: 500 });
    }

    // Validate and sanitize each object
    const validTypes = ["box", "sphere", "cylinder", "cone", "torus", "torusKnot", "dodecahedron", "octahedron", "plane", "capsule"];
    const sanitized = objects.map((obj: any, i: number) => ({
      name: String(obj.name || `Object ${i + 1}`),
      type: validTypes.includes(obj.type) ? obj.type : 'box',
      position: Array.isArray(obj.position) && obj.position.length === 3 ? obj.position.map(Number) : [0, 0.5, 0],
      rotation: Array.isArray(obj.rotation) && obj.rotation.length === 3 ? obj.rotation.map(Number) : [0, 0, 0],
      scale: Array.isArray(obj.scale) && obj.scale.length === 3 ? obj.scale.map(Number) : [1, 1, 1],
      color: typeof obj.color === 'string' && obj.color.startsWith('#') ? obj.color : '#6b8caf',
      metalness: typeof obj.metalness === 'number' ? Math.max(0, Math.min(1, obj.metalness)) : 0.3,
      roughness: typeof obj.roughness === 'number' ? Math.max(0, Math.min(1, obj.roughness)) : 0.5,
    }));

    return NextResponse.json({ objects: sanitized });
  } catch (error: any) {
    console.error('Generate API error:', error);

    if (error?.status === 401) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
    }
    if (error?.status === 429) {
      return NextResponse.json({ error: 'Rate limited. Please try again.' }, { status: 429 });
    }

    return NextResponse.json({ error: error.message || 'Generation failed' }, { status: 500 });
  }
}
