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

  // Check user has at least one OAuth account
  const user = await prisma.user.findUnique({
    where: { id },
    select: { _count: { select: { accounts: true } } },
  });

  if (!user || user._count.accounts === 0) {
    return NextResponse.json(
      { error: "Cannot reset password: user has no linked OAuth accounts" },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { id },
    data: { password: null },
  });

  await logAdminAction(session.user.id, "reset_password", id);

  return NextResponse.json({ success: true });
}
