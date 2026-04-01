import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST /api/feedback — submit feedback for a generation
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { captureId, rating, thumbs, comment } = await req.json();

  if (!captureId || typeof rating !== "number" || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "captureId and rating (1-5) are required" },
      { status: 400 }
    );
  }

  if (thumbs && !["up", "down"].includes(thumbs)) {
    return NextResponse.json({ error: "thumbs must be 'up' or 'down'" }, { status: 400 });
  }

  // Verify the capture exists
  const capture = await prisma.generationCapture.findUnique({
    where: { id: captureId },
    select: { id: true },
  });

  if (!capture) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }

  // Upsert feedback (one per user per capture)
  const feedback = await prisma.generationFeedback.upsert({
    where: {
      captureId_userId: { captureId, userId: session.user.id },
    },
    update: {
      rating,
      thumbs: thumbs || null,
      comment: comment || null,
    },
    create: {
      captureId,
      userId: session.user.id,
      rating,
      thumbs: thumbs || null,
      comment: comment || null,
    },
  });

  return NextResponse.json({ feedback });
}

// GET /api/feedback?captureId=xxx — get user's feedback for a generation
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const captureId = new URL(req.url).searchParams.get("captureId");
  if (!captureId) {
    return NextResponse.json({ error: "captureId required" }, { status: 400 });
  }

  const feedback = await prisma.generationFeedback.findUnique({
    where: {
      captureId_userId: { captureId, userId: session.user.id },
    },
  });

  return NextResponse.json({ feedback });
}
