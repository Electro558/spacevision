"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  FolderOpen,
  Grid3X3,
  List,
  MoreHorizontal,
  Download,
  Share2,
  Trash2,
  Pencil,
  Clock,
  Box,
  Users,
  TrendingUp,
  Heart,
  Eye,
} from "lucide-react";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), { ssr: false });

const SAVED_MODELS = [
  { id: 1, prompt: "crystal dragon with glowing wings", createdAt: "2 hours ago", likes: 12, views: 45 },
  { id: 2, prompt: "futuristic blue spaceship", createdAt: "5 hours ago", likes: 8, views: 32 },
  { id: 3, prompt: "golden ancient temple", createdAt: "1 day ago", likes: 23, views: 89 },
  { id: 4, prompt: "purple gemstone cluster", createdAt: "2 days ago", likes: 5, views: 18 },
  { id: 5, prompt: "cute orange cat sitting", createdAt: "3 days ago", likes: 45, views: 156 },
  { id: 6, prompt: "red sports car", createdAt: "1 week ago", likes: 34, views: 120 },
];

const PROJECTS = [
  { id: 1, name: "Game Assets", count: 12, shared: false },
  { id: 2, name: "School Project", count: 5, shared: true },
  { id: 3, name: "Personal Collection", count: 24, shared: false },
];

export default function DashboardPage() {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [activeMenu, setActiveMenu] = useState<number | null>(null);

  const stats = [
    { label: "Total Models", value: "24", icon: Box, color: "text-brand" },
    { label: "Total Likes", value: "127", icon: Heart, color: "text-pink-400" },
    { label: "Total Views", value: "460", icon: Eye, color: "text-blue-400" },
    { label: "Projects", value: "3", icon: FolderOpen, color: "text-yellow-400" },
  ];

  return (
    <div className="min-h-screen pt-14 bg-surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-gray-400 text-sm">Manage your 3D models and projects.</p>
          </div>
          <Link
            href="/generate"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            New Model
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat) => (
            <div key={stat.label} className="p-5 rounded-2xl bg-white/[0.02] border border-surface-border">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <TrendingUp className="w-3 h-3 text-green-400" />
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Projects</h2>
            <button className="text-xs text-brand hover:text-blue-300 transition-colors">View All</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {PROJECTS.map((project) => (
              <div
                key={project.id}
                className="p-5 rounded-2xl bg-white/[0.02] border border-surface-border hover:border-brand/20 transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <FolderOpen className="w-5 h-5 text-brand" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{project.name}</p>
                    <p className="text-xs text-gray-500">{project.count} models</p>
                  </div>
                </div>
                {project.shared && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 text-xs">
                    <Users className="w-3 h-3" /> Shared
                  </span>
                )}
              </div>
            ))}
            <button className="p-5 rounded-2xl border-2 border-dashed border-surface-border hover:border-brand/30 transition-all flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-brand">
              <Plus className="w-4 h-4" /> New Project
            </button>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Models</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView("grid")}
                className={`p-2 rounded-lg transition-all ${view === "grid" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView("list")}
                className={`p-2 rounded-lg transition-all ${view === "list" ? "bg-white/10 text-white" : "text-gray-500 hover:text-white"}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {view === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {SAVED_MODELS.map((model) => (
                <motion.div
                  key={model.id}
                  layout
                  className="group rounded-2xl bg-white/[0.02] border border-surface-border overflow-hidden hover:border-brand/20 transition-all"
                >
                  <div className="relative aspect-square bg-surface">
                    <ModelViewer prompt={model.prompt} className="w-full h-full" />
                    <div className="absolute top-3 right-3">
                      <div className="relative">
                        <button
                          onClick={() => setActiveMenu(activeMenu === model.id ? null : model.id)}
                          className="p-1.5 rounded-md bg-black/40 backdrop-blur text-gray-300 hover:text-white opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                        <AnimatePresence>
                          {activeMenu === model.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -5 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -5 }}
                              className="absolute right-0 top-full mt-1 w-40 py-1 rounded-xl bg-surface-light border border-surface-border shadow-xl z-10"
                            >
                              {[
                                { icon: Pencil, label: "Rename" },
                                { icon: Share2, label: "Share" },
                                { icon: Download, label: "Download STL" },
                                { icon: Trash2, label: "Delete", danger: true },
                              ].map((action) => (
                                <button
                                  key={action.label}
                                  onClick={() => setActiveMenu(null)}
                                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-white/5 transition-colors ${
                                    "danger" in action && action.danger ? "text-red-400" : "text-gray-300"
                                  }`}
                                >
                                  <action.icon className="w-3.5 h-3.5" />
                                  {action.label}
                                </button>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium truncate mb-1">&ldquo;{model.prompt}&rdquo;</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{model.createdAt}</span>
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{model.likes}</span>
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{model.views}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {SAVED_MODELS.map((model) => (
                <div
                  key={model.id}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-surface-border hover:border-brand/20 transition-all"
                >
                  <div className="w-16 h-16 rounded-lg bg-surface overflow-hidden shrink-0">
                    <ModelViewer prompt={model.prompt} className="w-full h-full" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">&ldquo;{model.prompt}&rdquo;</p>
                    <p className="text-xs text-gray-500 mt-0.5">{model.createdAt}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" /> {model.likes}</span>
                    <span className="flex items-center gap-1"><Eye className="w-3 h-3" /> {model.views}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"><Share2 className="w-4 h-4" /></button>
                    <button className="p-2 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-all"><Download className="w-4 h-4" /></button>
                    <button className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-white/5 transition-all"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
