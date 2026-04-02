import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMeshCreditsForPlan } from "@/lib/tripo";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, meshCreditsUsed: true, meshCreditsResetDate: true },
  });

  const now = new Date();
  const isNewMonth = !user?.meshCreditsResetDate ||
    user.meshCreditsResetDate.getMonth() !== now.getMonth() ||
    user.meshCreditsResetDate.getFullYear() !== now.getFullYear();

  const creditsUsed = isNewMonth ? 0 : (user?.meshCreditsUsed || 0);
  const maxCredits = getMeshCreditsForPlan(user?.plan || "FREE");

  const generations = await prisma.meshGeneration.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      prompt: true,
      mode: true,
      style: true,
      status: true,
      progress: true,
      resultUrl: true,
      thumbnailUrl: true,
      modelData: true,
      error: true,
      createdAt: true,
      completedAt: true,
    },
  });

  return NextResponse.json({
    generations,
    credits: {
      used: creditsUsed,
      max: maxCredits,
      remaining: maxCredits - creditsUsed,
    },
  });
}
