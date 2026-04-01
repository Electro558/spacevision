import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getSettingNumber } from "@/lib/settings";

// GET /api/models — list user's models
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const models = await prisma.savedModel.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      thumbnail: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json({ models });
}

// POST /api/models — create a new model
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check model limit for free users
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  if (user?.plan === "FREE") {
    const count = await prisma.savedModel.count({
      where: { userId: session.user.id },
    });
    const modelLimit = await getSettingNumber("free_model_limit") ?? 5;
    if (count >= modelLimit) {
      return NextResponse.json(
        { error: `Free plan limit: ${modelLimit} models. Upgrade to Premium for unlimited.` },
        { status: 403 }
      );
    }
  }

  const { name, description, sceneData, thumbnail } = await req.json();

  if (!name || !sceneData) {
    return NextResponse.json(
      { error: "Name and sceneData are required" },
      { status: 400 }
    );
  }

  const model = await prisma.savedModel.create({
    data: {
      name,
      description: description || null,
      sceneData,
      thumbnail: thumbnail || null,
      userId: session.user.id,
    },
  });

  return NextResponse.json({ model }, { status: 201 });
}
