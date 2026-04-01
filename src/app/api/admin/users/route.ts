import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = ["coolbanana558@gmail.com"];

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
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
      emailVerified: true,
      dailyGenerations: true,
      lastGenerationDate: true,
      createdAt: true,
      _count: { select: { savedModels: true } },
    },
  });

  const stats = {
    totalUsers: users.length,
    premiumUsers: users.filter((u) => u.plan === "PREMIUM").length,
    totalModels: users.reduce((sum, u) => sum + u._count.savedModels, 0),
  };

  return NextResponse.json({ users, stats });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.email || !ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, plan } = await req.json();

  if (!userId || !["FREE", "PREMIUM"].includes(plan)) {
    return NextResponse.json({ error: "Invalid userId or plan" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { plan },
    select: { id: true, email: true, plan: true },
  });

  return NextResponse.json({ user });
}
