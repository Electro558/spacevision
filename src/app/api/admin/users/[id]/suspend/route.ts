import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const user = await prisma.user.update({
    where: { id },
    data: { status: "SUSPENDED" },
    select: { id: true, status: true },
  });

  await logAdminAction(session.user.id, "suspend_user", id);

  return NextResponse.json({ user });
}
