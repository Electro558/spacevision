import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

// GET /api/admin/training/datasets/[id]/export — export dataset as JSONL
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const dataset = await prisma.trainingDataset.findUnique({
    where: { id },
    include: {
      items: {
        include: { example: true },
      },
    },
  });

  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }

  const systemPrompt = `You are a 3D modeling assistant for SpaceVision. You help users create and modify 3D scenes using primitive shapes. Available shapes: box, sphere, cylinder, cone, torus, torusKnot, dodecahedron, octahedron, plane, capsule, wedge, tube, star, roundedBox, text3d, halfSphere, pyramid, heart, spring, screw, roof, arrow, ring. Use the add_object, modify_object, delete_object, and select_objects tools. Keep proportions realistic and scenes centered around the origin. y=0 is the ground plane.`;

  const lines: string[] = [];

  for (const item of dataset.items) {
    const example = item.example;
    const actions = Array.isArray(example.actions) ? example.actions : [];

    // Build tool use content blocks
    const toolUseBlocks = actions.map((action: any, i: number) => ({
      type: "tool_use",
      id: `tool_${i}`,
      name: action.tool || "add_object",
      input: action.input || action,
    }));

    // Add text block with description
    const contentBlocks = [
      ...toolUseBlocks,
      { type: "text", text: example.description },
    ];

    const jsonlLine = JSON.stringify({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: example.prompt },
        { role: "assistant", content: contentBlocks },
      ],
    });

    lines.push(jsonlLine);
  }

  const jsonl = lines.join("\n");

  // Update dataset status
  await prisma.trainingDataset.update({
    where: { id },
    data: { status: "exported" },
  });

  return new Response(jsonl, {
    headers: {
      "Content-Type": "application/jsonl",
      "Content-Disposition": `attachment; filename="${dataset.name.replace(/[^a-zA-Z0-9]/g, "_")}_${new Date().toISOString().slice(0, 10)}.jsonl"`,
    },
  });
}
