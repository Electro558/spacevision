import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/settings";
import AdminSidebar from "@/components/AdminSidebar";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/login");
  }

  const adminCheck = await isAdmin(session.user.email);
  if (!adminCheck) {
    redirect("/");
  }

  return (
    <div className="flex pt-14">
      <AdminSidebar />
      <main className="flex-1 min-h-[calc(100vh-3.5rem)] p-6 overflow-auto">
        {children}
      </main>
    </div>
  );
}
