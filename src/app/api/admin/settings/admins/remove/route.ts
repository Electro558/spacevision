import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, getAdminEmails, setSetting } from "@/lib/settings";
import { logAdminAction } from "@/lib/auditLog";

const SUPER_ADMIN = "coolbanana558@gmail.com";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();

  if (email === SUPER_ADMIN) {
    return NextResponse.json({ error: "Cannot remove super admin" }, { status: 400 });
  }

  if (email === session.user.email) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const emails = await getAdminEmails();
  const filtered = emails.filter((e) => e !== email);
  await setSetting("admin_emails", JSON.stringify(filtered));
  await logAdminAction(session.user.id, "remove_admin", undefined, { email });

  return NextResponse.json({ emails: filtered });
}
