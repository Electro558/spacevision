import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "30d";

  const now = new Date();
  let since: Date;
  switch (range) {
    case "7d":
      since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      since = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "all":
      since = new Date("2020-01-01");
      break;
    default:
      since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Parallel queries
  const [
    totalUsers,
    premiumUsers,
    totalModels,
    usersToday,
    signups,
    generations,
    modelCreations,
    planDistribution,
    topUsers,
    generationsToday,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { plan: "PREMIUM" } }),
    prisma.savedModel.count(),
    prisma.user.count({
      where: { createdAt: { gte: new Date(now.toISOString().slice(0, 10)) } },
    }),
    prisma.user.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.generationLog.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.savedModel.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.groupBy({
      by: ["plan"],
      _count: true,
    }),
    prisma.savedModel.groupBy({
      by: ["userId"],
      _count: true,
      orderBy: { _count: { userId: "desc" } },
      take: 10,
    }),
    prisma.generationLog.count({
      where: { createdAt: { gte: new Date(now.toISOString().slice(0, 10)) } },
    }),
  ]);

  // Resolve top user names
  const topUserIds = topUsers.map((u) => u.userId);
  const topUserDetails = await prisma.user.findMany({
    where: { id: { in: topUserIds } },
    select: { id: true, name: true, email: true },
  });
  const userMap = Object.fromEntries(topUserDetails.map((u) => [u.id, u]));

  // Group by day helper
  function groupByDay(items: { createdAt: Date }[]): { date: string; count: number }[] {
    const map: Record<string, number> = {};
    for (const item of items) {
      const day = item.createdAt.toISOString().slice(0, 10);
      map[day] = (map[day] || 0) + 1;
    }
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  }

  return NextResponse.json({
    stats: {
      totalUsers,
      premiumUsers,
      totalModels,
      usersToday,
      generationsToday,
      conversionRate: totalUsers > 0 ? Math.round((premiumUsers / totalUsers) * 100) : 0,
    },
    charts: {
      signups: groupByDay(signups),
      generations: groupByDay(generations),
      models: groupByDay(modelCreations),
      planDistribution: planDistribution.map((p) => ({
        plan: p.plan,
        count: p._count,
      })),
      topUsers: topUsers.map((u) => ({
        name: userMap[u.userId]?.name || userMap[u.userId]?.email || u.userId,
        models: u._count,
      })),
    },
  });
}
