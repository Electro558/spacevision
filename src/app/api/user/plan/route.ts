import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true, dailyGenerations: true, lastGenerationDate: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Calculate remaining generations for free users
  const now = new Date();
  const lastDate = user.lastGenerationDate;
  const isNewDay =
    !lastDate ||
    lastDate.toISOString().slice(0, 10) !== now.toISOString().slice(0, 10);

  return NextResponse.json({
    plan: user.plan,
    generationsUsed: isNewDay ? 0 : user.dailyGenerations,
    generationsLimit: user.plan === "FREE" ? 10 : null,
  });
}
