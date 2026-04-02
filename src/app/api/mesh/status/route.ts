import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getTaskStatus } from "@/lib/tripo";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  // Get our DB record
  const meshGen = await prisma.meshGeneration.findUnique({
    where: { id },
  });

  if (!meshGen || meshGen.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // If already completed or failed, return cached result
  if (meshGen.status === "success" || meshGen.status === "failed") {
    return NextResponse.json({
      id: meshGen.id,
      status: meshGen.status,
      progress: meshGen.progress,
      resultUrl: meshGen.resultUrl,
      thumbnailUrl: meshGen.thumbnailUrl,
      modelData: meshGen.modelData,
      error: meshGen.error,
    });
  }

  // Poll Tripo for latest status
  if (!meshGen.tripoTaskId) {
    return NextResponse.json({ error: "No task ID" }, { status: 500 });
  }

  try {
    const task = await getTaskStatus(meshGen.tripoTaskId);

    const updateData: Record<string, unknown> = {
      status: task.status === "success" ? "success" : task.status === "failed" ? "failed" : "running",
      progress: task.progress || 0,
    };

    if (task.status === "success" && task.output) {
      updateData.resultUrl = task.output.model?.url || null;
      updateData.thumbnailUrl = task.output.rendered_image?.url || null;
      updateData.modelData = {
        glb: task.output.model?.url,
        pbr: task.output.pbr_model?.url,
        rendered: task.output.rendered_image?.url,
      };
      updateData.completedAt = new Date();
    }

    if (task.status === "failed") {
      updateData.error = "Generation failed";
    }

    // Update our DB
    const updated = await prisma.meshGeneration.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      progress: updated.progress,
      resultUrl: updated.resultUrl,
      thumbnailUrl: updated.thumbnailUrl,
      modelData: updated.modelData,
      error: updated.error,
    });
  } catch (error: any) {
    console.error("[MeshStatus] Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check status" },
      { status: 500 }
    );
  }
}
