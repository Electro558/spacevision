import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

// GET /api/admin/training/examples — list training examples
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category");
  const source = searchParams.get("source");
  const approved = searchParams.get("approved");
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (category) where.category = category;
  if (source) where.source = source;
  if (approved !== null && approved !== "") where.approved = approved === "true";

  const [examples, total] = await Promise.all([
    prisma.trainingExample.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.trainingExample.count({ where }),
  ]);

  const categories = await prisma.trainingExample.groupBy({
    by: ["category"],
    _count: true,
  });

  return NextResponse.json({
    examples,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
    categories: categories.map((c) => ({ category: c.category, count: c._count })),
  });
}

// POST /api/admin/training/examples — create a training example
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { prompt, category, difficulty, description, actions, approved, source } = await req.json();

  if (!prompt || !category || !description || !actions) {
    return NextResponse.json({ error: "prompt, category, description, and actions are required" }, { status: 400 });
  }

  const example = await prisma.trainingExample.create({
    data: {
      prompt,
      category,
      difficulty: difficulty || "medium",
      description,
      actions,
      approved: approved ?? false,
      source: source || "handcrafted",
    },
  });

  return NextResponse.json({ example }, { status: 201 });
}

// DELETE /api/admin/training/examples — bulk delete
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { ids } = await req.json();
  if (!Array.isArray(ids)) {
    return NextResponse.json({ error: "ids array required" }, { status: 400 });
  }

  await prisma.trainingExample.deleteMany({ where: { id: { in: ids } } });
  return NextResponse.json({ deleted: ids.length });
}

// PATCH /api/admin/training/examples — bulk approve/unapprove
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { ids, approved } = await req.json();
  if (!Array.isArray(ids) || typeof approved !== "boolean") {
    return NextResponse.json({ error: "ids array and approved boolean required" }, { status: 400 });
  }

  await prisma.trainingExample.updateMany({
    where: { id: { in: ids } },
    data: { approved },
  });

  return NextResponse.json({ updated: ids.length });
}
