import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdmin, getAdminEmails, setSetting } from "@/lib/settings";
import { logAdminAction } from "@/lib/auditLog";

export async function GET() {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const emails = await getAdminEmails();
  return NextResponse.json({ emails });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email || !(await isAdmin(session.user.email))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email } = await req.json();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const emails = await getAdminEmails();
  if (emails.includes(email)) {
    return NextResponse.json({ error: "Already an admin" }, { status: 400 });
  }

  emails.push(email);
  await setSetting("admin_emails", JSON.stringify(emails));
  await logAdminAction(session.user.id, "add_admin", undefined, { email });

  return NextResponse.json({ emails });
}
