"use client";

import { useState, useEffect } from "react";
import {
  Brain,
  Database,
  MessageSquare,
  Download,
  Rocket,
  Plus,
  Trash2,
  Check,
  X,
  Loader2,
  Star,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowRight,
} from "lucide-react";

type Tab = "examples" | "captures" | "datasets" | "finetune";

interface Example {
  id: string;
  prompt: string;
  category: string;
  difficulty: string;
  description: string;
  approved: boolean;
  source: string;
  createdAt: string;
}

interface Capture {
  id: string;
  prompt: string;
  modelUsed: string;
  consentGiven: boolean;
  createdAt: string;
  user: { name: string | null; email: string };
  feedback: { rating: number; thumbs: string | null; comment: string | null }[];
  _count: { feedback: number };
}

interface Dataset {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  _count: { items: number; fineTuneJobs: number };
}

interface FineTuneJob {
  id: string;
  datasetId: string;
  externalJobId: string | null;
  modelName: string | null;
  status: string;
  error: string | null;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  dataset: { name: string; _count: { items: number } };
}

export default function AdminTrainingPage() {
  const [tab, setTab] = useState<Tab>("examples");

  const tabs = [
    { id: "examples" as Tab, label: "Examples", icon: Brain, count: null },
    { id: "captures" as Tab, label: "Captures", icon: MessageSquare, count: null },
    { id: "datasets" as Tab, label: "Datasets", icon: Database, count: null },
    { id: "finetune" as Tab, label: "Fine-Tune", icon: Rocket, count: null },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-white mb-6">Model Training</h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 p-1 bg-white/[0.02] rounded-lg border border-surface-border w-fit">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t.id
                ? "bg-brand text-white"
                : "text-gray-400 hover:text-white hover:bg-white/5"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "examples" && <ExamplesTab />}
      {tab === "captures" && <CapturesTab />}
      {tab === "datasets" && <DatasetsTab />}
      {tab === "finetune" && <FineTuneTab />}
    </div>
  );
}

// ── Examples Tab ──────────────────────────────────
function ExamplesTab() {
  const [examples, setExamples] = useState<Example[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<{ category: string; count: number }[]>([]);
  const [filterCategory, setFilterCategory] = useState("");
  const [filterSource, setFilterSource] = useState("");
  const [filterApproved, setFilterApproved] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const fetchExamples = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (filterCategory) params.set("category", filterCategory);
    if (filterSource) params.set("source", filterSource);
    if (filterApproved) params.set("approved", filterApproved);

    fetch(`/api/admin/training/examples?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setExamples(data.examples || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setCategories(data.categories || []);
        setLoading(false);
      });
  };

  useEffect(() => { fetchExamples(); }, [page, filterCategory, filterSource, filterApproved]);

  const handleApprove = async (approved: boolean) => {
    await fetch("/api/admin/training/examples", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected), approved }),
    });
    setSelected(new Set());
    fetchExamples();
  };

  const handleDelete = async () => {
    await fetch("/api/admin/training/examples", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: Array.from(selected) }),
    });
    setSelected(new Set());
    fetchExamples();
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mt-12" />;

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
          <p className="text-2xl font-bold text-white">{total}</p>
          <p className="text-xs text-gray-500">Total Examples</p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
          <p className="text-2xl font-bold text-green-400">{examples.filter(e => e.approved).length}</p>
          <p className="text-xs text-gray-500">Approved (this page)</p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
          <p className="text-2xl font-bold text-white">{categories.length}</p>
          <p className="text-xs text-gray-500">Categories</p>
        </div>
        <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
          <p className="text-2xl font-bold text-purple-400">{examples.filter(e => e.source === "captured").length}</p>
          <p className="text-xs text-gray-500">From Captures (this page)</p>
        </div>
      </div>

      {/* Filters + Actions */}
      <div className="flex flex-wrap gap-3 mb-4">
        <select value={filterCategory} onChange={(e) => { setFilterCategory(e.target.value); setPage(1); }} className="px-3 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white">
          <option value="">All Categories</option>
          {categories.map((c) => <option key={c.category} value={c.category}>{c.category} ({c.count})</option>)}
        </select>
        <select value={filterSource} onChange={(e) => { setFilterSource(e.target.value); setPage(1); }} className="px-3 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white">
          <option value="">All Sources</option>
          <option value="handcrafted">Handcrafted</option>
          <option value="captured">Captured</option>
          <option value="imported">Imported</option>
        </select>
        <select value={filterApproved} onChange={(e) => { setFilterApproved(e.target.value); setPage(1); }} className="px-3 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white">
          <option value="">All Status</option>
          <option value="true">Approved</option>
          <option value="false">Pending</option>
        </select>

        {selected.size > 0 && (
          <div className="flex gap-2 ml-auto">
            <button onClick={() => handleApprove(true)} className="px-3 py-2 bg-green-600 hover:bg-green-500 text-white text-sm rounded-lg flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> Approve ({selected.size})
            </button>
            <button onClick={() => handleApprove(false)} className="px-3 py-2 bg-yellow-600 hover:bg-yellow-500 text-white text-sm rounded-lg flex items-center gap-1">
              <X className="w-3.5 h-3.5" /> Unapprove
            </button>
            <button onClick={handleDelete} className="px-3 py-2 bg-red-600 hover:bg-red-500 text-white text-sm rounded-lg flex items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div className="rounded-xl border border-surface-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-white/[0.02] text-gray-400 text-xs uppercase">
              <th className="px-4 py-3">
                <input type="checkbox" checked={selected.size === examples.length && examples.length > 0} onChange={() => setSelected(selected.size === examples.length ? new Set() : new Set(examples.map(e => e.id)))} />
              </th>
              <th className="text-left px-4 py-3">Prompt</th>
              <th className="text-left px-4 py-3">Category</th>
              <th className="text-left px-4 py-3">Difficulty</th>
              <th className="text-left px-4 py-3">Source</th>
              <th className="text-left px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-border">
            {examples.map((ex) => (
              <tr key={ex.id} className="hover:bg-white/[0.01]">
                <td className="px-4 py-3">
                  <input type="checkbox" checked={selected.has(ex.id)} onChange={() => { const s = new Set(selected); s.has(ex.id) ? s.delete(ex.id) : s.add(ex.id); setSelected(s); }} />
                </td>
                <td className="px-4 py-3 text-white max-w-xs truncate">{ex.prompt}</td>
                <td className="px-4 py-3"><span className="text-xs px-2 py-0.5 rounded-full bg-brand/10 text-brand">{ex.category}</span></td>
                <td className="px-4 py-3 text-gray-400">{ex.difficulty}</td>
                <td className="px-4 py-3"><span className={`text-xs px-2 py-0.5 rounded-full ${ex.source === "handcrafted" ? "bg-blue-500/10 text-blue-400" : ex.source === "captured" ? "bg-purple-500/10 text-purple-400" : "bg-gray-500/10 text-gray-400"}`}>{ex.source}</span></td>
                <td className="px-4 py-3">{ex.approved ? <span className="text-xs text-green-400">Approved</span> : <span className="text-xs text-yellow-400">Pending</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-surface-border text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-surface-border text-gray-400 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

// ── Captures Tab ──────────────────────────────────
function CapturesTab() {
  const [captures, setCaptures] = useState<Capture[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [minRating, setMinRating] = useState(0);
  const [consentOnly, setConsentOnly] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCaptures = () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page) });
    if (minRating > 0) params.set("minRating", String(minRating));
    if (consentOnly) params.set("consentOnly", "true");

    fetch(`/api/admin/training/captures?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCaptures(data.captures || []);
        setStats(data.stats);
        setTotalPages(data.totalPages || 1);
        setLoading(false);
      });
  };

  useEffect(() => { fetchCaptures(); }, [page, minRating, consentOnly]);

  const convertToExample = async (captureId: string) => {
    await fetch("/api/admin/training/captures", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ captureId, category: "uncategorized" }),
    });
    alert("Converted to training example!");
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mt-12" />;

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
            <p className="text-2xl font-bold text-white">{stats.totalCaptures}</p>
            <p className="text-xs text-gray-500">Total Captures</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
            <p className="text-2xl font-bold text-green-400">{stats.consentedCaptures}</p>
            <p className="text-xs text-gray-500">With Consent</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
            <p className="text-2xl font-bold text-yellow-400">{stats.totalFeedback}</p>
            <p className="text-xs text-gray-500">Feedback Received</p>
          </div>
          <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
            <p className="text-2xl font-bold text-purple-400">{stats.avgRating || "—"}</p>
            <p className="text-xs text-gray-500">Avg Rating</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <select value={minRating} onChange={(e) => { setMinRating(parseInt(e.target.value)); setPage(1); }} className="px-3 py-2 bg-white/[0.02] border border-surface-border rounded-lg text-sm text-white">
          <option value="0">Any Rating</option>
          <option value="3">3+ Stars</option>
          <option value="4">4+ Stars</option>
          <option value="5">5 Stars Only</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-gray-400">
          <input type="checkbox" checked={consentOnly} onChange={(e) => { setConsentOnly(e.target.checked); setPage(1); }} />
          Consented only
        </label>
      </div>

      {/* Captures List */}
      <div className="space-y-3">
        {captures.map((cap) => {
          const avgRating = cap.feedback.length > 0 ? cap.feedback.reduce((s, f) => s + f.rating, 0) / cap.feedback.length : null;
          return (
            <div key={cap.id} className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">&ldquo;{cap.prompt}&rdquo;</p>
                  <p className="text-xs text-gray-500 mt-1">{cap.user.name || cap.user.email} &middot; {new Date(cap.createdAt).toLocaleString()} &middot; {cap.modelUsed}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {avgRating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                      <span className="text-sm text-yellow-400">{avgRating.toFixed(1)}</span>
                    </div>
                  )}
                  {cap.consentGiven && <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">Consented</span>}
                  <button onClick={() => convertToExample(cap.id)} className="px-2 py-1 bg-brand/20 text-brand text-xs rounded hover:bg-brand/30 flex items-center gap-1">
                    <ArrowRight className="w-3 h-3" /> Convert
                  </button>
                </div>
              </div>
              {cap.feedback.length > 0 && (
                <div className="mt-2 flex gap-2 flex-wrap">
                  {cap.feedback.map((f, i) => (
                    <span key={i} className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400">
                      {f.thumbs === "up" ? "👍" : f.thumbs === "down" ? "👎" : ""} {f.rating}★ {f.comment && `"${f.comment}"`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-4">
          <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1} className="p-2 rounded-lg border border-surface-border text-gray-400 hover:text-white disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
          <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="p-2 rounded-lg border border-surface-border text-gray-400 hover:text-white disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
        </div>
      )}
    </div>
  );
}

// ── Datasets Tab ──────────────────────────────────
function DatasetsTab() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const fetchDatasets = () => {
    setLoading(true);
    fetch("/api/admin/training/datasets")
      .then((r) => r.json())
      .then((data) => { setDatasets(data.datasets || []); setLoading(false); });
  };

  useEffect(() => { fetchDatasets(); }, []);

  const handleCreate = async () => {
    if (!newName) return;
    await fetch("/api/admin/training/datasets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, description: newDesc }),
    });
    setNewName(""); setNewDesc(""); setShowCreate(false);
    fetchDatasets();
  };

  const handleExport = async (id: string, name: string) => {
    const res = await fetch(`/api/admin/training/datasets/${id}/export`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name.replace(/[^a-zA-Z0-9]/g, "_")}.jsonl`;
    a.click();
    URL.revokeObjectURL(url);
    fetchDatasets();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this dataset?")) return;
    await fetch("/api/admin/training/datasets", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchDatasets();
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mt-12" />;

  const statusColor: Record<string, string> = {
    draft: "bg-gray-500/10 text-gray-400",
    ready: "bg-blue-500/10 text-blue-400",
    exported: "bg-green-500/10 text-green-400",
    training: "bg-yellow-500/10 text-yellow-400",
    completed: "bg-purple-500/10 text-purple-400",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <p className="text-sm text-gray-500">{datasets.length} datasets</p>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm rounded-lg">
          <Plus className="w-4 h-4" /> New Dataset
        </button>
      </div>

      {showCreate && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border mb-6">
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Dataset name" className="w-full px-3 py-2 bg-gray-900 border border-surface-border rounded-lg text-sm text-white mb-2" />
          <input value={newDesc} onChange={(e) => setNewDesc(e.target.value)} placeholder="Description (optional)" className="w-full px-3 py-2 bg-gray-900 border border-surface-border rounded-lg text-sm text-white mb-3" />
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-brand text-white text-sm rounded-lg">Create</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-surface-border text-gray-400 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {datasets.map((ds) => (
          <div key={ds.id} className="p-4 rounded-xl bg-white/[0.02] border border-surface-border flex items-center justify-between">
            <div>
              <p className="text-white font-medium">{ds.name}</p>
              <p className="text-xs text-gray-500 mt-1">
                {ds._count.items} examples &middot; {ds._count.fineTuneJobs} jobs &middot; Created {new Date(ds.createdAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[ds.status] || statusColor.draft}`}>{ds.status}</span>
              <button onClick={() => handleExport(ds.id, ds.name)} className="px-3 py-1.5 bg-white/5 text-gray-300 text-xs rounded-lg hover:bg-white/10 flex items-center gap-1">
                <Download className="w-3.5 h-3.5" /> Export JSONL
              </button>
              <button onClick={() => handleDelete(ds.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
        {datasets.length === 0 && (
          <p className="text-center text-gray-500 py-12">No datasets yet. Create one to start curating training data.</p>
        )}
      </div>
    </div>
  );
}

// ── Fine-Tune Tab ──────────────────────────────────
function FineTuneTab() {
  const [jobs, setJobs] = useState<FineTuneJob[]>([]);
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState("");

  const fetchJobs = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/admin/training/finetune").then((r) => r.json()),
      fetch("/api/admin/training/datasets").then((r) => r.json()),
    ]).then(([jobsData, dsData]) => {
      setJobs(jobsData.jobs || []);
      setDatasets(dsData.datasets || []);
      setLoading(false);
    });
  };

  useEffect(() => { fetchJobs(); }, []);

  const handleCreate = async () => {
    if (!selectedDataset) return;
    await fetch("/api/admin/training/finetune", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ datasetId: selectedDataset }),
    });
    setShowCreate(false); setSelectedDataset("");
    fetchJobs();
  };

  const handleDeploy = async (jobId: string, modelName: string) => {
    await fetch(`/api/admin/training/finetune/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "deploy", modelName }),
    });
    alert(`Model ${modelName} deployed!`);
  };

  const handleRevert = async (jobId: string) => {
    await fetch(`/api/admin/training/finetune/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "revert" }),
    });
    alert("Reverted to base Claude model");
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("Delete this job?")) return;
    await fetch(`/api/admin/training/finetune/${jobId}`, { method: "DELETE" });
    fetchJobs();
  };

  if (loading) return <Loader2 className="w-8 h-8 text-brand animate-spin mx-auto mt-12" />;

  const statusColor: Record<string, string> = {
    pending: "bg-gray-500/10 text-gray-400",
    uploading: "bg-blue-500/10 text-blue-400",
    training: "bg-yellow-500/10 text-yellow-400",
    completed: "bg-green-500/10 text-green-400",
    failed: "bg-red-500/10 text-red-400",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-gray-500">{jobs.length} fine-tune jobs</p>
          <p className="text-xs text-gray-600 mt-1">Note: Anthropic fine-tuning requires enterprise access. Jobs are tracked here for when API access is available.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 px-4 py-2 bg-brand hover:bg-brand-hover text-white text-sm rounded-lg">
          <Rocket className="w-4 h-4" /> New Job
        </button>
      </div>

      {showCreate && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-surface-border mb-6">
          <p className="text-sm text-white mb-2">Select a dataset (min 10 examples):</p>
          <select value={selectedDataset} onChange={(e) => setSelectedDataset(e.target.value)} className="w-full px-3 py-2 bg-gray-900 border border-surface-border rounded-lg text-sm text-white mb-3">
            <option value="">Choose dataset...</option>
            {datasets.filter(d => d._count.items >= 10).map((d) => (
              <option key={d.id} value={d.id}>{d.name} ({d._count.items} examples)</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!selectedDataset} className="px-4 py-2 bg-brand text-white text-sm rounded-lg disabled:opacity-50">Create Job</button>
            <button onClick={() => setShowCreate(false)} className="px-4 py-2 border border-surface-border text-gray-400 text-sm rounded-lg">Cancel</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {jobs.map((job) => (
          <div key={job.id} className="p-4 rounded-xl bg-white/[0.02] border border-surface-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-medium">Dataset: {job.dataset.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {job.dataset._count.items} examples &middot; Created {new Date(job.createdAt).toLocaleString()}
                  {job.modelName && ` · Model: ${job.modelName}`}
                </p>
                {job.error && <p className="text-xs text-red-400 mt-1">{job.error}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[job.status] || statusColor.pending}`}>{job.status}</span>
                {job.status === "completed" && job.modelName && (
                  <>
                    <button onClick={() => handleDeploy(job.id, job.modelName!)} className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-xs rounded-lg">Deploy</button>
                    <button onClick={() => handleRevert(job.id)} className="px-3 py-1.5 bg-white/5 text-gray-300 text-xs rounded-lg hover:bg-white/10">Revert to Base</button>
                  </>
                )}
                <button onClick={() => handleDelete(job.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
        {jobs.length === 0 && (
          <p className="text-center text-gray-500 py-12">No fine-tune jobs yet. Create a dataset with 10+ examples first.</p>
        )}
      </div>
    </div>
  );
}
