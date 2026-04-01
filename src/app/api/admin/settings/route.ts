import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, getSettings, setSetting } from "@/lib/settings";
import { logAdminAction } from "@/lib/auditLog";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await getSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updates = await req.json();
  const oldSettings = await getSettings();

  for (const [key, value] of Object.entries(updates)) {
    await setSetting(key, String(value));
    await logAdminAction(session.user.id, "update_setting", undefined, {
      key,
      from: oldSettings[key],
      to: value,
    });
  }

  const settings = await getSettings();
  return NextResponse.json({ settings });
}
