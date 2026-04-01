"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Search,
  ChevronDown,
  Shield,
  ShieldOff,
  ShieldBan,
  KeyRound,
  Eye,
  ArrowUpDown,
  Loader2,
  Crown,
} from "lucide-react";

interface UserData {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  plan: string;
  status: string;
  emailVerified: string | null;
  dailyGenerations: number;
  lastGenerationDate: string | null;
  createdAt: string;
  _count: { savedModels: number; accounts: number };
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<{ id: string; action: string } | null>(null);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        !search ||
        (u.name || "").toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase());
      const matchesPlan = planFilter === "all" || u.plan === planFilter;
      const matchesStatus = statusFilter === "all" || u.status === statusFilter;
      return matchesSearch && matchesPlan && matchesStatus;
    });
  }, [users, search, planFilter, statusFilter]);

  const handleAction = async (userId: string, action: string) => {
    setActionMenuId(null);
    setConfirmAction(null);

    let url = "";
    let method = "POST";
    let body: string | undefined;

    switch (action) {
      case "toggle_plan": {
        const user = users.find((u) => u.id === userId);
        const newPlan = user?.plan === "FREE" ? "PREMIUM" : "FREE";
        url = "/api/admin/users";
        method = "PATCH";
        body = JSON.stringify({ userId, plan: newPlan });
        break;
      }
      case "suspend":
        url = `/api/admin/users/${userId}/suspend`;
        break;
      case "ban":
        url = `/api/admin/users/${userId}/ban`;
        break;
      case "activate":
        url = `/api/admin/users/${userId}/activate`;
        break;
      case "reset_password":
        url = `/api/admin/users/${userId}/reset-password`;
        break;
      case "impersonate":
        await fetch("/api/admin/impersonate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId }),
        });
        window.location.href = "/dashboard";
        return;
      default:
        return;
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body,
    });

    if (res.ok) {
      // Refresh users
      const data = await fetch("/api/admin/users").then((r) => r.json());
      setUsers(data.users || []);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Active</span>;
      case "SUSPENDED":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-400">Suspended</span>;
      case "BANNED":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Banned</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-gray-500/10 text-gray-400">{status}</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">User Management</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand"
          />
        </div>
        <select
          value={planFilter}
          onChange={(e) => setPlanFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white focus:outline-none focus:border-brand"
        >
          <option value="all">All Plans</option>
          <option value="FREE">Free</option>
          <option value="PREMIUM">Premium</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white focus:outline-none focus:border-brand"
        >
          <option value="all">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="SUSPENDED">Suspended</option>
          <option value="BANNED">Banned</option>
        </select>
      </div>

      <p className="text-sm text-gray-500 mb-4">{filtered.length} users</p>

      {/* Users Table */}
      <div className="rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.02] text-gray-400 text-xs uppercase">
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Plan</th>
              <th className="text-left px-4 py-3">Models</th>
              <th className="text-left px-4 py-3">Gens Today</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Joined</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {filtered.map((user) => (
              <tr key={user.id} className="hover:bg-white/[0.01]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {user.image ? (
                      <img src={user.image} alt="" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand text-xs font-bold">
                        {(user.name || user.email)[0].toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-white font-medium">{user.name || "—"}</p>
                      <p className="text-gray-500 text-xs">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    user.plan === "PREMIUM"
                      ? "bg-yellow-500/10 text-yellow-400"
                      : "bg-brand/10 text-brand"
                  }`}>
                    {user.plan === "PREMIUM" && <Crown className="w-3 h-3 inline mr-1" />}
                    {user.plan}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{user._count.savedModels}</td>
                <td className="px-4 py-3 text-gray-300">{user.dailyGenerations}</td>
                <td className="px-4 py-3">{statusBadge(user.status)}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="relative">
                    <button
                      onClick={() => setActionMenuId(actionMenuId === user.id ? null : user.id)}
                      className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                    {actionMenuId === user.id && (
                      <div className="absolute right-0 top-full mt-1 w-48 bg-gray-900 border border-surface-border rounded-lg shadow-xl z-50 py-1">
                        <button
                          onClick={() => handleAction(user.id, "toggle_plan")}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                        >
                          <ArrowUpDown className="w-3.5 h-3.5" />
                          {user.plan === "FREE" ? "Upgrade to Premium" : "Downgrade to Free"}
                        </button>
                        {user.status === "ACTIVE" && (
                          <>
                            <button
                              onClick={() => setConfirmAction({ id: user.id, action: "suspend" })}
                              className="w-full text-left px-3 py-2 text-sm text-yellow-400 hover:bg-white/5 flex items-center gap-2"
                            >
                              <ShieldOff className="w-3.5 h-3.5" />
                              Suspend
                            </button>
                            <button
                              onClick={() => setConfirmAction({ id: user.id, action: "ban" })}
                              className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-white/5 flex items-center gap-2"
                            >
                              <ShieldBan className="w-3.5 h-3.5" />
                              Ban
                            </button>
                          </>
                        )}
                        {(user.status === "SUSPENDED" || user.status === "BANNED") && (
                          <button
                            onClick={() => handleAction(user.id, "activate")}
                            className="w-full text-left px-3 py-2 text-sm text-green-400 hover:bg-white/5 flex items-center gap-2"
                          >
                            <Shield className="w-3.5 h-3.5" />
                            Activate
                          </button>
                        )}
                        {user._count.accounts > 0 && (
                          <button
                            onClick={() => setConfirmAction({ id: user.id, action: "reset_password" })}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                            Reset Password
                          </button>
                        )}
                        <button
                          onClick={() => handleAction(user.id, "impersonate")}
                          className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center gap-2"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Impersonate
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Confirmation Modal */}
      {confirmAction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-surface-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">
              Confirm {confirmAction.action === "ban" ? "Ban" : confirmAction.action === "suspend" ? "Suspend" : "Reset Password"}
            </h3>
            <p className="text-gray-400 text-sm mb-4">
              {confirmAction.action === "ban"
                ? "This user will be completely blocked from logging in."
                : confirmAction.action === "suspend"
                ? "This user will be able to log in but cannot use features."
                : "This will clear the user's password. They will need to use OAuth to log in."}
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmAction(null)}
                className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-surface-border"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(confirmAction.id, confirmAction.action)}
                className={`px-4 py-2 rounded-lg text-sm text-white ${
                  confirmAction.action === "ban" ? "bg-red-600 hover:bg-red-500" : "bg-yellow-600 hover:bg-yellow-500"
                }`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
