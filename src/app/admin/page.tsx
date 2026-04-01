"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Loader2,
  Users,
  Crown,
  Box,
  ShieldAlert,
  ArrowUpDown,
} from "lucide-react";

const ADMIN_EMAILS = ["coolbanana558@gmail.com"];

interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  plan: "FREE" | "PREMIUM";
  emailVerified: string | null;
  dailyGenerations: number;
  lastGenerationDate: string | null;
  createdAt: string;
  _count: { savedModels: number };
}

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  totalModels: number;
}

export default function AdminPage() {
  const { data: session, status } = useSession();
  const [users, setUsers] = useState<UserData[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isAdmin =
    status === "authenticated" &&
    session?.user?.email &&
    ADMIN_EMAILS.includes(session.user.email);

  useEffect(() => {
    if (!isAdmin) return;
    fetchUsers();
  }, [isAdmin]);

  async function fetchUsers() {
    try {
      const res = await fetch("/api/admin/users");
      if (!res.ok) return;
      const data = await res.json();
      setUsers(data.users);
      setStats(data.stats);
    } finally {
      setLoading(false);
    }
  }

  async function togglePlan(userId: string, currentPlan: "FREE" | "PREMIUM") {
    const newPlan = currentPlan === "FREE" ? "PREMIUM" : "FREE";
    setTogglingId(userId);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan: newPlan }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, plan: newPlan } : u))
        );
        if (stats) {
          const delta = newPlan === "PREMIUM" ? 1 : -1;
          setStats({ ...stats, premiumUsers: stats.premiumUsers + delta });
        }
      }
    } finally {
      setTogglingId(null);
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <div className="text-center">
          <ShieldAlert className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
          <p className="text-gray-400">
            You do not have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-dark pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white">Admin Console</h1>
          <p className="text-gray-400 mt-1">
            Manage users and monitor platform activity
          </p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="bg-white/[0.02] border border-surface-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-brand" />
                <span className="text-gray-400 text-sm">Total Users</span>
              </div>
              <p className="text-3xl font-bold text-white">{stats.totalUsers}</p>
            </div>
            <div className="bg-white/[0.02] border border-surface-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-gray-400 text-sm">Premium Users</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {stats.premiumUsers}
              </p>
            </div>
            <div className="bg-white/[0.02] border border-surface-border rounded-xl p-5">
              <div className="flex items-center gap-3 mb-2">
                <Box className="w-5 h-5 text-brand" />
                <span className="text-gray-400 text-sm">Total Models</span>
              </div>
              <p className="text-3xl font-bold text-white">
                {stats.totalModels}
              </p>
            </div>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white/[0.02] border border-surface-border rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-surface-border">
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    User
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    <div className="flex items-center gap-1">
                      Plan
                      <ArrowUpDown className="w-3 h-3" />
                    </div>
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Models
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Generations Today
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Joined
                  </th>
                  <th className="text-left text-gray-400 text-sm font-medium px-6 py-4">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-surface-border last:border-b-0 hover:bg-white/[0.02] transition-colors"
                  >
                    {/* User */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {user.image ? (
                          <img
                            src={user.image}
                            alt=""
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-brand/20 flex items-center justify-center text-brand text-sm font-medium">
                            {(user.name || user.email || "?")
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="text-white text-sm font-medium">
                            {user.name || "No name"}
                          </p>
                          <p className="text-gray-500 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan Badge */}
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.plan === "PREMIUM"
                            ? "bg-yellow-400/10 text-yellow-400"
                            : "bg-gray-500/10 text-gray-400"
                        }`}
                      >
                        {user.plan === "PREMIUM" && (
                          <Crown className="w-3 h-3 mr-1" />
                        )}
                        {user.plan}
                      </span>
                    </td>

                    {/* Models */}
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {user._count.savedModels}
                    </td>

                    {/* Generations Today */}
                    <td className="px-6 py-4 text-gray-300 text-sm">
                      {user.dailyGenerations}
                    </td>

                    {/* Joined */}
                    <td className="px-6 py-4 text-gray-400 text-sm">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4">
                      <button
                        onClick={() => togglePlan(user.id, user.plan)}
                        disabled={togglingId === user.id}
                        className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 ${
                          user.plan === "PREMIUM"
                            ? "bg-gray-500/10 text-gray-400 hover:bg-gray-500/20"
                            : "bg-brand/10 text-brand hover:bg-brand/20"
                        }`}
                      >
                        {togglingId === user.id ? (
                          <Loader2 className="w-3 h-3 animate-spin inline" />
                        ) : user.plan === "PREMIUM" ? (
                          "Downgrade"
                        ) : (
                          "Upgrade"
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
