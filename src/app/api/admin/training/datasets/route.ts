import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

// GET /api/admin/training/datasets — list datasets
export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const datasets = await prisma.trainingDataset.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { items: true, fineTuneJobs: true } },
    },
  });

  return NextResponse.json({ datasets });
}

// POST /api/admin/training/datasets — create dataset
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { name, description } = await req.json();
  if (!name) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const dataset = await prisma.trainingDataset.create({
    data: { name, description },
  });

  return NextResponse.json({ dataset }, { status: 201 });
}

// DELETE /api/admin/training/datasets — delete dataset
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await req.json();
  await prisma.trainingDataset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
