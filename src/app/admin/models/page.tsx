"use client";

import { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
  X,
  Loader2,
  Image as ImageIcon,
} from "lucide-react";

interface ModelData {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  objectCount: number;
  creator: { id: string; name: string | null; email: string; plan: string };
}

interface ModelDetail {
  id: string;
  name: string;
  description: string | null;
  thumbnail: string | null;
  sceneData: unknown[];
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string | null; email: string; plan: string };
}

export default function AdminModelsPage() {
  const [models, setModels] = useState<ModelData[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [detailModel, setDetailModel] = useState<ModelDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmBulk, setConfirmBulk] = useState(false);

  const fetchModels = () => {
    setLoading(true);
    fetch(`/api/admin/models?search=${encodeURIComponent(search)}&sort=${sort}&page=${page}`)
      .then((r) => r.json())
      .then((data) => {
        setModels(data.models || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      });
  };

  useEffect(() => { fetchModels(); }, [page, sort]);

  const handleSearch = () => { setPage(1); fetchModels(); };

  const handleDelete = async (id: string) => {
    await fetch(`/api/admin/models/${id}`, { method: "DELETE" });
    setConfirmDelete(null);
    setDetailModel(null);
    fetchModels();
  };

  const handleBulkDelete = async () => {
    await fetch("/api/admin/models/bulk-delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setSelected(new Set());
    setConfirmBulk(false);
    fetchModels();
  };

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    const res = await fetch(`/api/admin/models/${id}`);
    const data = await res.json();
    setDetailModel(data.model);
    setDetailLoading(false);
  };

  const toggleSelect = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === models.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(models.map((m) => m.id)));
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
      <h1 className="text-2xl font-bold text-white mb-6">Content Moderation</h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Search by model name or creator..."
            className="w-full pl-10 pr-4 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => { setSort(e.target.value); setPage(1); }}
          className="px-3 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white focus:outline-none focus:border-brand"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="creator">Creator</option>
        </select>
        {selected.size > 0 && (
          <button
            onClick={() => setConfirmBulk(true)}
            className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete {selected.size} selected
          </button>
        )}
      </div>

      <p className="text-sm text-gray-500 mb-4">{total} models total</p>

      {/* Table */}
      <div className="rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.02] text-gray-400 text-xs uppercase">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === models.length && models.length > 0}
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              <th className="text-left px-4 py-3">Model</th>
              <th className="text-left px-4 py-3">Creator</th>
              <th className="text-left px-4 py-3">Objects</th>
              <th className="text-left px-4 py-3">Created</th>
              <th className="text-left px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {models.map((model) => (
              <tr key={model.id} className="hover:bg-white/[0.01]">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selected.has(model.id)}
                    onChange={() => toggleSelect(model.id)}
                    className="rounded"
                  />
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => openDetail(model.id)}
                    className="text-white font-medium hover:text-brand text-left"
                  >
                    {model.name}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <p className="text-gray-300">{model.creator.name || "—"}</p>
                  <p className="text-gray-500 text-xs">{model.creator.email}</p>
                </td>
                <td className="px-4 py-3 text-gray-300">{model.objectCount}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">
                  {new Date(model.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => setConfirmDelete(model.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="p-2 rounded-lg border border-surface-border text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="p-2 rounded-lg border border-surface-border text-gray-400 hover:text-white disabled:opacity-30"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Detail Modal */}
      {(detailModel || detailLoading) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-surface-border rounded-xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-auto">
            {detailLoading ? (
              <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto" />
            ) : detailModel ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white">{detailModel.name}</h3>
                  <button onClick={() => setDetailModel(null)} className="text-gray-400 hover:text-white">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                {detailModel.thumbnail ? (
                  <img src={detailModel.thumbnail} alt={detailModel.name} className="w-full rounded-lg mb-4" />
                ) : (
                  <div className="w-full aspect-video bg-gray-800 rounded-lg mb-4 flex items-center justify-center text-gray-600">
                    <ImageIcon className="w-12 h-12" />
                  </div>
                )}
                <div className="space-y-2 text-sm">
                  {detailModel.description && (
                    <p className="text-gray-300">{detailModel.description}</p>
                  )}
                  <p className="text-gray-400">Creator: <span className="text-white">{detailModel.user.name || detailModel.user.email}</span> ({detailModel.user.plan})</p>
                  <p className="text-gray-400">Objects: <span className="text-white">{Array.isArray(detailModel.sceneData) ? detailModel.sceneData.length : 0}</span></p>
                  <p className="text-gray-400">Created: <span className="text-white">{new Date(detailModel.createdAt).toLocaleString()}</span></p>
                  <p className="text-gray-400">Updated: <span className="text-white">{new Date(detailModel.updatedAt).toLocaleString()}</span></p>
                </div>
                <button
                  onClick={() => setConfirmDelete(detailModel.id)}
                  className="mt-4 w-full py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Model
                </button>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-gray-900 border border-surface-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Delete Model?</h3>
            <p className="text-gray-400 text-sm mb-4">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmDelete(null)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-surface-border">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-500">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation */}
      {confirmBulk && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-gray-900 border border-surface-border rounded-xl p-6 max-w-sm w-full mx-4">
            <h3 className="text-lg font-bold text-white mb-2">Delete {selected.size} Models?</h3>
            <p className="text-gray-400 text-sm mb-4">This action cannot be undone.</p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setConfirmBulk(false)} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:text-white border border-surface-border">Cancel</button>
              <button onClick={handleBulkDelete} className="px-4 py-2 rounded-lg text-sm text-white bg-red-600 hover:bg-red-500">Delete All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
