import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";
import { encode } from "next-auth/jwt";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // The real admin ID is always in session.user.id (userId in JWT)
  const adminId = session.user.id;
  const admin = await prisma.user.findUnique({
    where: { id: adminId },
    select: { id: true, name: true, email: true, plan: true, emailVerified: true, status: true },
  });

  if (!admin || !(await isAdmin(admin.email!))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await logAdminAction(adminId, "impersonate_end", session.user.impersonatingUserId);

  // Restore admin session
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET!,
    salt: cookieName,
    token: {
      userId: admin.id,
      plan: admin.plan,
      emailVerified: admin.emailVerified,
      status: admin.status,
      email: admin.email,
      name: admin.name,
      sub: admin.id,
    },
  });

  const response = NextResponse.json({ success: true });

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
