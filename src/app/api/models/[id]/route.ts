import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/models/[id] — get a specific model
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const model = await prisma.savedModel.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!model) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  return NextResponse.json({ model });
}

// PUT /api/models/[id] — update a model
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ownership
  const existing = await prisma.savedModel.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  const { name, description, sceneData, thumbnail } = await req.json();

  const model = await prisma.savedModel.update({
    where: { id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(sceneData !== undefined && { sceneData }),
      ...(thumbnail !== undefined && { thumbnail }),
    },
  });

  return NextResponse.json({ model });
}

// DELETE /api/models/[id] — delete a model
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const existing = await prisma.savedModel.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Model not found" }, { status: 404 });
  }

  await prisma.savedModel.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
