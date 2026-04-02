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
      // Tripo v2.5 returns flat URL strings for pbr_model, rendered_image, etc.
      const pbr = typeof task.output.pbr_model === "string" ? task.output.pbr_model : null;
      const rendered = typeof task.output.rendered_image === "string" ? task.output.rendered_image : null;
      const model = typeof task.output.model === "string"
        ? task.output.model
        : typeof task.output.model === "object" ? task.output.model?.url : null;

      // The GLB model URL — prefer pbr_model (has textures), fall back to model
      updateData.resultUrl = pbr || model || null;
      updateData.thumbnailUrl = rendered || (typeof task.output.generated_image === "string" ? task.output.generated_image : null);
      updateData.modelData = {
        glb: pbr || model,
        rendered,
        generated_image: task.output.generated_image,
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
