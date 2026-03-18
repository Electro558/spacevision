"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import {
  Heart,
  Eye,
  Download,
  Search,
  TrendingUp,
  Clock,
  Star,
  User,
} from "lucide-react";

const ModelViewer = dynamic(() => import("@/components/ModelViewer"), { ssr: false });

const GALLERY_ITEMS = [
  { id: 1, prompt: "crystal dragon with glowing wings", author: "Alex", likes: 234, views: 1892, category: "creature" },
  { id: 2, prompt: "futuristic silver spaceship", author: "Maya", likes: 189, views: 1456, category: "vehicle" },
  { id: 3, prompt: "golden ancient temple", author: "Sam", likes: 156, views: 1234, category: "building" },
  { id: 4, prompt: "purple gemstone crystal cluster", author: "River", likes: 142, views: 1102, category: "crystal" },
  { id: 5, prompt: "green terrain with mountains", author: "Jordan", likes: 128, views: 987, category: "terrain" },
  { id: 6, prompt: "red sports car sleek design", author: "Taylor", likes: 198, views: 1678, category: "vehicle" },
  { id: 7, prompt: "cute orange cat sitting", author: "Riley", likes: 312, views: 2341, category: "creature" },
  { id: 8, prompt: "blue geometric abstract sculpture", author: "Casey", likes: 89, views: 756, category: "geometric" },
  { id: 9, prompt: "dark castle tower with lightning", author: "Morgan", likes: 167, views: 1345, category: "building" },
  { id: 10, prompt: "pink organic flower bloom", author: "Drew", likes: 145, views: 1100, category: "organic" },
  { id: 11, prompt: "gold trophy with star", author: "Quinn", likes: 93, views: 678, category: "geometric" },
  { id: 12, prompt: "green alien creature big eyes", author: "Avery", likes: 267, views: 2012, category: "creature" },
];

const CATEGORIES = ["All", "Creature", "Vehicle", "Building", "Crystal", "Terrain", "Geometric", "Organic"];
const SORT_OPTIONS = [
  { label: "Trending", icon: TrendingUp, value: "trending" },
  { label: "Newest", icon: Clock, value: "newest" },
  { label: "Most Liked", icon: Star, value: "liked" },
];

function ModelCard({ item }: { item: (typeof GALLERY_ITEMS)[0] }) {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group rounded-2xl bg-white/[0.02] border border-surface-border overflow-hidden hover:border-brand/30 transition-all"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative aspect-square bg-surface overflow-hidden">
        <ModelViewer prompt={item.prompt} className="w-full h-full" />
        <div
          className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent transition-opacity ${
            isHovered ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
            <button
              onClick={(e) => { e.stopPropagation(); setIsLiked(!isLiked); }}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs backdrop-blur ${
                isLiked ? "bg-pink-500/20 text-pink-400" : "bg-black/40 text-white"
              }`}
            >
              <Heart className={`w-3 h-3 ${isLiked ? "fill-current" : ""}`} />
              {item.likes + (isLiked ? 1 : 0)}
            </button>
            <button className="p-1.5 rounded-md bg-black/40 backdrop-blur text-white hover:bg-black/60">
              <Download className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm font-medium truncate mb-2">&ldquo;{item.prompt}&rdquo;</p>
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1"><User className="w-3 h-3" />{item.author}</div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{item.views.toLocaleString()}</span>
            <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{item.likes}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function GalleryPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("trending");

  const filtered = GALLERY_ITEMS.filter((item) => {
    const matchSearch = item.prompt.toLowerCase().includes(search.toLowerCase());
    const matchCategory = category === "All" || item.category === category.toLowerCase();
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen pt-14 bg-surface-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">
            Community <span className="text-brand">Gallery</span>
          </h1>
          <p className="text-gray-400">
            Explore 3D models created by the SpaceVision community.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search models..."
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-surface-lighter border border-surface-border text-white placeholder-gray-500 focus:outline-none focus:border-brand/50 text-sm"
            />
          </div>
          <div className="flex gap-2">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSort(opt.value)}
                className={`flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-medium transition-all ${
                  sort === opt.value
                    ? "bg-brand/20 text-blue-300 border border-brand/30"
                    : "bg-surface-lighter text-gray-400 border border-surface-border hover:border-surface-border"
                }`}
              >
                <opt.icon className="w-3.5 h-3.5" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                category === cat
                  ? "bg-brand/20 text-blue-300 border border-brand/30"
                  : "bg-surface-lighter text-gray-400 border border-surface-border hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filtered.map((item) => (
            <ModelCard key={item.id} item={item} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-20">
            <p className="text-gray-400 mb-4">No models found matching your search.</p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-sm font-semibold"
            >
              Create the first one
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
