import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";
import { setSetting } from "@/lib/settings";

// GET /api/admin/training/finetune/[id] — get job details
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const job = await prisma.fineTuneJob.findUnique({
    where: { id },
    include: {
      dataset: {
        include: { _count: { select: { items: true } } },
      },
    },
  });

  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}

// PATCH /api/admin/training/finetune/[id] — update job (deploy model, cancel, etc.)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { action, modelName, status, error } = await req.json();

  if (action === "deploy" && modelName) {
    // Set this fine-tuned model as the active model
    await setSetting("active_model", modelName);
    await logAdminAction(session.user.id, "deploy_finetuned_model", id, { modelName });
    return NextResponse.json({ success: true, message: `Model ${modelName} deployed as active model` });
  }

  if (action === "revert") {
    // Revert to base model
    await setSetting("active_model", "");
    await logAdminAction(session.user.id, "revert_to_base_model", id);
    return NextResponse.json({ success: true, message: "Reverted to base Claude model" });
  }

  // General status update (for webhook/polling updates)
  const updateData: Record<string, unknown> = {};
  if (status) updateData.status = status;
  if (error) updateData.error = error;
  if (modelName) updateData.modelName = modelName;
  if (status === "training") updateData.startedAt = new Date();
  if (status === "completed") updateData.completedAt = new Date();

  const job = await prisma.fineTuneJob.update({
    where: { id },
    data: updateData,
  });

  return NextResponse.json({ job });
}

// DELETE /api/admin/training/finetune/[id] — delete a job
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.fineTuneJob.delete({ where: { id } });
  await logAdminAction(session.user.id, "delete_finetune_job", id);

  return NextResponse.json({ success: true });
}
