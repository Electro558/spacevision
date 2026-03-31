"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Plus, Trash2, Pencil, ExternalLink, Crown, Loader2,
  FolderOpen, Check,
} from "lucide-react";

interface SavedModel {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  createdAt: string;
  updatedAt: string;
}

export default function DashboardPage() {
  const { data: session, status, update } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [models, setModels] = useState<SavedModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const upgraded = searchParams.get("upgraded") === "true";
  const isPremium = session?.user?.plan === "PREMIUM";

  // Poll for plan update after Stripe checkout redirect
  useEffect(() => {
    if (!upgraded || isPremium) return;
    let attempts = 0;
    const interval = setInterval(async () => {
      attempts++;
      const res = await fetch("/api/user/plan");
      const data = await res.json();
      if (data.plan === "PREMIUM") {
        await update(); // Refresh session JWT
        clearInterval(interval);
      }
      if (attempts >= 5) clearInterval(interval);
    }, 2000);
    return () => clearInterval(interval);
  }, [upgraded, isPremium, update]);

  // Fetch models
  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/models")
      .then((res) => res.json())
      .then((data) => {
        setModels(data.models || []);
        setLoading(false);
      });
  }, [status]);

  const handleDelete = async (id: string) => {
    await fetch(`/api/models/${id}`, { method: "DELETE" });
    setModels((prev) => prev.filter((m) => m.id !== id));
    setDeleteConfirm(null);
  };

  const handleRename = async (id: string) => {
    if (!renameValue.trim()) return;
    await fetch(`/api/models/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: renameValue }),
    });
    setModels((prev) =>
      prev.map((m) => (m.id === id ? { ...m, name: renameValue } : m))
    );
    setRenamingId(null);
  };

  const handleManageSubscription = async () => {
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-surface-dark flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  const modelLimit = isPremium ? null : 5;
  const modelCountText = modelLimit
    ? `${models.length} / ${modelLimit} models`
    : `${models.length} models`;

  return (
    <div className="min-h-screen bg-surface-dark pt-24 pb-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-gray-400 mt-1">
              {modelCountText}
              <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">
                {isPremium ? "Premium" : "Free"}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isPremium && (
              <button
                onClick={handleManageSubscription}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Manage Subscription
              </button>
            )}
            <Link
              href="/generate"
              className="flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-medium px-4 py-2 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              New Model
            </Link>
          </div>
        </div>

        {/* Upgrade banner for free users */}
        {!isPremium && (
          <div className="bg-brand/10 border border-brand/30 rounded-xl p-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Crown className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-white font-medium">Upgrade to Premium</p>
                <p className="text-gray-400 text-sm">Unlimited models, exports, and AI generations</p>
              </div>
            </div>
            <Link
              href="/pricing"
              className="bg-brand hover:bg-brand-hover text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
            >
              View Plans
            </Link>
          </div>
        )}

        {upgraded && isPremium && (
          <div className="bg-green-500/10 border border-green-500/30 text-green-400 rounded-xl p-4 mb-8 flex items-center gap-2">
            <Check className="w-5 h-5" />
            Welcome to Premium! You now have unlimited access.
          </div>
        )}

        {/* Models Grid */}
        {models.length === 0 ? (
          <div className="text-center py-20">
            <FolderOpen className="w-16 h-16 text-gray-700 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">No models yet</h2>
            <p className="text-gray-400 mb-6">Create your first 3D model to see it here.</p>
            <Link
              href="/generate"
              className="inline-flex items-center gap-2 bg-brand hover:bg-brand-hover text-white font-medium px-6 py-3 rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Start Creating
            </Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => (
              <div
                key={model.id}
                className="bg-white/[0.02] border border-surface-border rounded-xl overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="aspect-video bg-surface relative">
                  {model.thumbnail ? (
                    <img
                      src={model.thumbnail}
                      alt={model.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      No preview
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  {renamingId === model.id ? (
                    <div className="flex gap-2">
                      <input
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && handleRename(model.id)}
                        className="flex-1 bg-surface border border-surface-border rounded px-2 py-1 text-white text-sm"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(model.id)}
                        className="text-green-400 hover:text-green-300 text-sm"
                      >
                        Save
                      </button>
                    </div>
                  ) : (
                    <h3 className="text-white font-medium truncate">{model.name}</h3>
                  )}
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(model.updatedAt).toLocaleDateString()}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <Link
                      href={`/generate?modelId=${model.id}`}
                      className="flex items-center gap-1 text-brand hover:text-brand-hover text-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      Open
                    </Link>
                    <button
                      onClick={() => {
                        setRenamingId(model.id);
                        setRenameValue(model.name);
                      }}
                      className="flex items-center gap-1 text-gray-400 hover:text-white text-sm"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Rename
                    </button>
                    {deleteConfirm === model.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(model.id)}
                          className="text-red-400 hover:text-red-300 text-sm"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-gray-400 hover:text-white text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(model.id)}
                        className="flex items-center gap-1 text-gray-400 hover:text-red-400 text-sm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
