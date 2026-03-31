import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function PATCH(req: NextRequest) {
  const secret = req.headers.get("x-admin-secret");
  if (!secret || !process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Timing-safe comparison
  const expected = Buffer.from(process.env.ADMIN_SECRET);
  const received = Buffer.from(secret);
  if (
    expected.length !== received.length ||
    !crypto.timingSafeEqual(expected, received)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId, plan } = await req.json();

  if (!userId || !["FREE", "PREMIUM"].includes(plan)) {
    return NextResponse.json({ error: "Invalid userId or plan" }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { plan },
    select: { id: true, email: true, plan: true },
  });

  return NextResponse.json({ user });
}
