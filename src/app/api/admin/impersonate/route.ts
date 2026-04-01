import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import { prisma } from "@/lib/prisma";
import { logAdminAction } from "@/lib/auditLog";
import { encode } from "next-auth/jwt";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();
  const target = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, plan: true, emailVerified: true, status: true },
  });

  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await logAdminAction(session.user.id, "impersonate_start", userId);

  // Create a new JWT with impersonation data
  const token = await encode({
    secret: process.env.NEXTAUTH_SECRET!,
    token: {
      userId: session.user.id, // Keep real admin ID
      impersonatingUserId: target.id,
      impersonatingUserName: target.name || target.email,
      plan: target.plan,
      emailVerified: target.emailVerified,
      status: target.status,
      email: target.email,
      name: target.name,
      sub: session.user.id,
    },
  });

  const response = NextResponse.json({ success: true });

  // Set the new session cookie
  const cookieName = process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  response.cookies.set(cookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  return response;
}
