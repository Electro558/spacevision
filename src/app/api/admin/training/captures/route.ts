import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

// GET /api/admin/training/captures — list generation captures with feedback
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const minRating = parseInt(searchParams.get("minRating") || "0", 10);
  const consentOnly = searchParams.get("consentOnly") === "true";
  const pageSize = 20;

  const where: Record<string, unknown> = {};
  if (consentOnly) where.consentGiven = true;
  if (minRating > 0) {
    where.feedback = { some: { rating: { gte: minRating } } };
  }

  const [captures, total] = await Promise.all([
    prisma.generationCapture.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        prompt: true,
        modelUsed: true,
        consentGiven: true,
        createdAt: true,
        user: { select: { name: true, email: true } },
        feedback: { select: { rating: true, thumbs: true, comment: true } },
        _count: { select: { feedback: true } },
      },
    }),
    prisma.generationCapture.count({ where }),
  ]);

  // Stats
  const stats = await Promise.all([
    prisma.generationCapture.count(),
    prisma.generationCapture.count({ where: { consentGiven: true } }),
    prisma.generationFeedback.count(),
    prisma.generationFeedback.aggregate({ _avg: { rating: true } }),
  ]);

  return NextResponse.json({
    captures,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
    stats: {
      totalCaptures: stats[0],
      consentedCaptures: stats[1],
      totalFeedback: stats[2],
      avgRating: stats[3]._avg.rating ? Math.round(stats[3]._avg.rating * 10) / 10 : null,
    },
  });
}

// POST /api/admin/training/captures — convert capture to training example
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { captureId, category, difficulty } = await req.json();

  const capture = await prisma.generationCapture.findUnique({
    where: { id: captureId },
    select: { prompt: true, sceneData: true, toolCalls: true },
  });

  if (!capture) {
    return NextResponse.json({ error: "Capture not found" }, { status: 404 });
  }

  const actions = Array.isArray(capture.toolCalls)
    ? (capture.toolCalls as Array<{ name: string; input: Record<string, unknown> }>).map((tc) => ({
        tool: tc.name,
        input: tc.input,
      }))
    : [];

  const example = await prisma.trainingExample.create({
    data: {
      prompt: capture.prompt,
      category: category || "uncategorized",
      difficulty: difficulty || "medium",
      description: `Captured from real user generation: "${capture.prompt}"`,
      actions: JSON.parse(JSON.stringify(actions)),
      approved: false,
      source: "captured",
    },
  });

  return NextResponse.json({ example }, { status: 201 });
}
