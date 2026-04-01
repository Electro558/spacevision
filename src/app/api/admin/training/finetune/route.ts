import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

// GET /api/admin/training/finetune — list fine-tune jobs
export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const jobs = await prisma.fineTuneJob.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      dataset: { select: { name: true, _count: { select: { items: true } } } },
    },
  });

  return NextResponse.json({ jobs });
}

// POST /api/admin/training/finetune — create a new fine-tune job
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { datasetId, config } = await req.json();

  if (!datasetId) {
    return NextResponse.json({ error: "datasetId required" }, { status: 400 });
  }

  // Verify dataset exists and has items
  const dataset = await prisma.trainingDataset.findUnique({
    where: { id: datasetId },
    include: { _count: { select: { items: true } } },
  });

  if (!dataset) {
    return NextResponse.json({ error: "Dataset not found" }, { status: 404 });
  }

  if (dataset._count.items < 10) {
    return NextResponse.json(
      { error: "Dataset needs at least 10 examples for fine-tuning" },
      { status: 400 }
    );
  }

  const job = await prisma.fineTuneJob.create({
    data: {
      datasetId,
      status: "pending",
      config: config || { epochs: 3, learningRate: "auto" },
    },
  });

  await logAdminAction(session.user.id, "create_finetune_job", job.id, { datasetId });

  // NOTE: Actual Anthropic fine-tuning API integration would go here.
  // For now, the job is created in "pending" status.
  // A separate worker/cron would:
  // 1. Export the dataset as JSONL
  // 2. Upload to Anthropic
  // 3. Start the fine-tuning job
  // 4. Poll for status and update the job record

  return NextResponse.json({ job }, { status: 201 });
}
