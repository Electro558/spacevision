"use client";

import { useState, useEffect } from "react";
import {
  Users,
  Crown,
  Box,
  Zap,
  Loader2,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface Stats {
  totalUsers: number;
  premiumUsers: number;
  totalModels: number;
  usersToday: number;
  generationsToday: number;
  conversionRate: number;
}

interface Charts {
  signups: { date: string; count: number }[];
  generations: { date: string; count: number }[];
  models: { date: string; count: number }[];
  planDistribution: { plan: string; count: number }[];
  topUsers: { name: string; models: number }[];
}

const RANGES = ["7d", "30d", "90d", "all"] as const;
const PIE_COLORS = ["#6366f1", "#eab308"];

export default function AdminDashboard() {
  const [range, setRange] = useState<string>("30d");
  const [stats, setStats] = useState<Stats | null>(null);
  const [charts, setCharts] = useState<Charts | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/analytics?range=${range}`)
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setCharts(data.charts);
        setLoading(false);
      });
  }, [range]);

  if (loading || !stats || !charts) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, delta: `+${stats.usersToday} today`, icon: Users, color: "text-brand" },
    { label: "Premium Users", value: stats.premiumUsers, delta: `${stats.conversionRate}% conversion`, icon: Crown, color: "text-yellow-400" },
    { label: "Total Models", value: stats.totalModels, delta: null, icon: Box, color: "text-green-400" },
    { label: "Generations Today", value: stats.generationsToday, delta: null, icon: Zap, color: "text-purple-400" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => (
          <div key={card.label} className="p-5 rounded-xl bg-white/[0.02] border border-surface-border">
            <div className="flex items-center justify-between mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-xs text-gray-500 mt-1">{card.label}</p>
            {card.delta && <p className="text-xs text-green-400 mt-0.5">{card.delta}</p>}
          </div>
        ))}
      </div>

      {/* Date Range Filter */}
      <div className="flex gap-2 mb-6">
        {RANGES.map((r) => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              range === r
                ? "bg-brand text-white"
                : "bg-white/[0.02] text-gray-400 hover:text-white border border-surface-border"
            }`}
          >
            {r === "all" ? "All Time" : r}
          </button>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Signups Over Time */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-surface-border">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Signups Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={charts.signups}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }} />
              <Line type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Generations Over Time */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-surface-border">
          <h3 className="text-sm font-medium text-gray-400 mb-4">AI Generations Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.generations}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="date" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }} />
              <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Plan Distribution */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-surface-border">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Plan Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={charts.planDistribution}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="count"
                nameKey="plan"
                label={({ plan, count }: { plan: string; count: number }) => `${plan}: ${count}`}
              >
                {charts.planDistribution.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Users by Models */}
        <div className="p-5 rounded-xl bg-white/[0.02] border border-surface-border">
          <h3 className="text-sm font-medium text-gray-400 mb-4">Top Users by Models</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={charts.topUsers} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis type="number" tick={{ fill: "#888", fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={120} tick={{ fill: "#888", fontSize: 11 }} />
              <Tooltip contentStyle={{ background: "#1a1a2e", border: "1px solid #333", borderRadius: 8 }} />
              <Bar dataKey="models" fill="#22c55e" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
