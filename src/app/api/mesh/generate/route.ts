import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createTextToModel, createImageToModel, getMeshCreditsForPlan } from "@/lib/tripo";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to use mesh generation" }, { status: 401 });
  }

  if (!session.user.emailVerified) {
    return NextResponse.json({ error: "Please verify your email first" }, { status: 403 });
  }

  const { prompt, imageUrl, mode, style } = await req.json();

  if (!prompt && !imageUrl) {
    return NextResponse.json({ error: "Prompt or image URL is required" }, { status: 400 });
  }

  // Check mesh credits
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, meshCreditsUsed: true, meshCreditsResetDate: true, status: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.status === "SUSPENDED") {
    return NextResponse.json({ error: "Your account has been suspended" }, { status: 403 });
  }

  // Reset credits if new month
  const now = new Date();
  const resetDate = user.meshCreditsResetDate;
  const isNewMonth = !resetDate || resetDate.getMonth() !== now.getMonth() || resetDate.getFullYear() !== now.getFullYear();
  const currentCreditsUsed = isNewMonth ? 0 : user.meshCreditsUsed;

  const maxCredits = getMeshCreditsForPlan(user.plan);
  if (currentCreditsUsed >= maxCredits) {
    return NextResponse.json(
      { error: `Monthly mesh limit reached (${maxCredits}). Upgrade your plan for more.` },
      { status: 429 }
    );
  }

  try {
    // Call Tripo3D API
    const generationMode = imageUrl ? "image_to_model" : "text_to_model";
    let taskId: string;

    if (generationMode === "image_to_model" && imageUrl) {
      taskId = await createImageToModel(imageUrl);
    } else {
      taskId = await createTextToModel(prompt, { style: style || undefined });
    }

    // Save to database
    const meshGen = await prisma.meshGeneration.create({
      data: {
        userId: session.user.id,
        prompt: prompt || `Image: ${imageUrl}`,
        imageUrl: imageUrl || null,
        mode: generationMode,
        style: style || null,
        tripoTaskId: taskId,
        status: "running",
        creditsUsed: 1,
      },
    });

    // Increment credits used
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        meshCreditsUsed: isNewMonth ? 1 : { increment: 1 },
        meshCreditsResetDate: now,
      },
    });

    return NextResponse.json({
      id: meshGen.id,
      taskId,
      status: "running",
      creditsRemaining: maxCredits - currentCreditsUsed - 1,
    });
  } catch (error: any) {
    console.error("[MeshGenerate] Error:", error);
    return NextResponse.json(
      { error: error.message || "Mesh generation failed" },
      { status: 500 }
    );
  }
}
