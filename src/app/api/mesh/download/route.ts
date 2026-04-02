import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { downloadModel } from "@/lib/tripo";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const format = (searchParams.get("format") || "glb") as "glb" | "fbx" | "obj" | "stl" | "usdz";

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const meshGen = await prisma.meshGeneration.findUnique({
    where: { id },
  });

  if (!meshGen || meshGen.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (meshGen.status !== "success" || !meshGen.tripoTaskId) {
    return NextResponse.json({ error: "Model not ready" }, { status: 400 });
  }

  // Check format permissions based on plan
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { plan: true },
  });

  const premiumFormats = ["fbx", "stl", "usdz"];
  if (premiumFormats.includes(format) && user?.plan === "FREE") {
    return NextResponse.json(
      { error: `${format.toUpperCase()} export requires a Premium plan` },
      { status: 403 }
    );
  }

  try {
    const url = await downloadModel(meshGen.tripoTaskId, format);
    return NextResponse.json({ url, format });
  } catch (error: any) {
    console.error("[MeshDownload] Error:", error);
    return NextResponse.json(
      { error: error.message || "Download failed" },
      { status: 500 }
    );
  }
}
