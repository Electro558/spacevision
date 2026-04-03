import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  // Can work with or without a session — also accepts email in body
  const session = await auth();
  const body = await req.json().catch(() => ({}));
  const email = session?.user?.email || body.email;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Check user exists and is not already verified
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, emailVerified: true, password: true },
  });

  if (!user) {
    // Don't reveal whether the email exists
    return NextResponse.json({ message: "If an account exists, a verification email has been sent." });
  }

  if (user.emailVerified) {
    return NextResponse.json({ message: "Email is already verified." });
  }

  // Only allow resend for credentials users (OAuth auto-verifies)
  if (!user.password) {
    return NextResponse.json({ message: "Please sign in with Google or GitHub — your email will be verified automatically." });
  }

  // Rate limit: check for recent tokens (prevent spam)
  const recentToken = await prisma.verificationToken.findFirst({
    where: {
      identifier: email,
      expires: { gt: new Date() },
    },
    orderBy: { expires: "desc" },
  });

  // If a token was created less than 60 seconds ago, don't resend
  if (recentToken) {
    const tokenAge = Date.now() - (recentToken.expires.getTime() - 24 * 60 * 60 * 1000);
    if (tokenAge < 60 * 1000) {
      return NextResponse.json(
        { error: "Please wait a minute before requesting another email" },
        { status: 429 }
      );
    }
    // Delete the old token
    await prisma.verificationToken.delete({
      where: { token: recentToken.token },
    });
  }

  // Create new token
  const token = crypto.randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      identifier: email,
      token,
      expires,
    },
  });

  const result = await sendVerificationEmail(email, token);

  if (!result.success) {
    return NextResponse.json(
      { error: result.error || "Failed to send verification email" },
      { status: 500 }
    );
  }

  return NextResponse.json({ message: "Verification email sent. Check your inbox." });
}
