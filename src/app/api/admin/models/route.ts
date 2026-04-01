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
  const search = searchParams.get("search") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: "insensitive" as const } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
          { user: { name: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const orderBy =
    sort === "oldest"
      ? { createdAt: "asc" as const }
      : sort === "creator"
      ? { user: { name: "asc" as const } }
      : { createdAt: "desc" as const };

  const [models, total] = await Promise.all([
    prisma.savedModel.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        sceneData: true,
        user: {
          select: { id: true, name: true, email: true, plan: true },
        },
      },
    }),
    prisma.savedModel.count({ where }),
  ]);

  // Count objects in scene data, omit thumbnails for list view
  const modelsWithMeta = models.map((m) => {
    const sceneArray = Array.isArray(m.sceneData) ? m.sceneData : [];
    return {
      id: m.id,
      name: m.name,
      description: m.description,
      createdAt: m.createdAt,
      updatedAt: m.updatedAt,
      objectCount: sceneArray.length,
      creator: m.user,
    };
  });

  return NextResponse.json({
    models: modelsWithMeta,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  });
}
