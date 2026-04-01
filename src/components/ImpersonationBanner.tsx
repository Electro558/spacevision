"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, X } from "lucide-react";

export default function ImpersonationBanner() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session?.user?.impersonatingUserId) return null;

  const handleExit = async () => {
    await fetch("/api/admin/impersonate/exit", { method: "POST" });
    router.push("/admin/users");
    router.refresh();
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-yellow-600 text-black text-sm font-medium py-1.5 px-4 flex items-center justify-center gap-3">
      <Eye className="w-4 h-4" />
      <span>Viewing as {session.user.impersonatingUserName}</span>
      <button
        onClick={handleExit}
        className="flex items-center gap-1 bg-black/20 hover:bg-black/30 px-2 py-0.5 rounded text-xs font-bold"
      >
        <X className="w-3 h-3" />
        Exit
      </button>
    </div>
  );
}
