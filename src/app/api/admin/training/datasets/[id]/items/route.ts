import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

// POST /api/admin/training/datasets/[id]/items — add examples to dataset
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { exampleIds } = await req.json();
  if (!Array.isArray(exampleIds) || exampleIds.length === 0) {
    return NextResponse.json({ error: "exampleIds array required" }, { status: 400 });
  }

  // Upsert to avoid duplicates
  const results = await Promise.allSettled(
    exampleIds.map((exampleId: string) =>
      prisma.trainingDatasetItem.upsert({
        where: { datasetId_exampleId: { datasetId: id, exampleId } },
        update: {},
        create: { datasetId: id, exampleId },
      })
    )
  );

  const added = results.filter((r) => r.status === "fulfilled").length;
  return NextResponse.json({ added });
}

// DELETE /api/admin/training/datasets/[id]/items — remove examples from dataset
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { exampleIds } = await req.json();
  if (!Array.isArray(exampleIds)) {
    return NextResponse.json({ error: "exampleIds array required" }, { status: 400 });
  }

  await prisma.trainingDatasetItem.deleteMany({
    where: { datasetId: id, exampleId: { in: exampleIds } },
  });

  return NextResponse.json({ success: true });
}
