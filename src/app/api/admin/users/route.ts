import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      plan: true,
      status: true,
      emailVerified: true,
      dailyGenerations: true,
      lastGenerationDate: true,
      createdAt: true,
      _count: { select: { savedModels: true, accounts: true } },
    },
  });

  const stats = {
    totalUsers: users.length,
    premiumUsers: users.filter((u) => u.plan === "PREMIUM").length,
    totalModels: users.reduce((sum, u) => sum + u._count.savedModels, 0),
  };

  return NextResponse.json({ users, stats });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, plan } = await req.json();

  if (!userId || !["FREE", "PREMIUM"].includes(plan)) {
    return NextResponse.json({ error: "Invalid userId or plan" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { plan },
    select: { id: true, plan: true },
  });

  await logAdminAction(session.user.id, "change_plan", userId, { from: user.plan, to: plan });

  return NextResponse.json({ user: updated });
}
