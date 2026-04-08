"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  Sparkles,
  Loader2,
  Download,
  History,
  Zap,
  Crown,
  ImageIcon,
  X,
  ChevronDown,
  RefreshCw,
  Lock,
  ArrowRight,
  Eye,
  Grid3X3,
  Box,
  Paintbrush,
} from "lucide-react";
import type { ViewMode } from "@/components/MeshModelViewer";

// Lazy load the 3D viewer
const MeshModelViewer = dynamic(() => import("@/components/MeshModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-white/[0.02] rounded-xl">
      <Loader2 className="w-8 h-8 text-brand animate-spin" />
    </div>
  ),
});

interface MeshGeneration {
  id: string;
  prompt: string;
  mode: string;
  style: string | null;
  status: string;
  progress: number;
  resultUrl: string | null;
  thumbnailUrl: string | null;
  modelData: { glb?: string; pbr?: string; rendered?: string } | null;
  error: string | null;
  createdAt: string;
  completedAt: string | null;
}

const STYLES = [
  { value: "", label: "Realistic", description: "Photorealistic 3D model" },
  { value: "cartoon", label: "Cartoon", description: "Stylized cartoon look" },
  { value: "lego", label: "LEGO", description: "LEGO brick style" },
  { value: "voxel", label: "Voxel", description: "Minecraft-like voxels" },
  { value: "sculpture", label: "Sculpture", description: "Clay sculpture style" },
];

const VIEW_MODES: { value: ViewMode; label: string; icon: typeof Paintbrush; description: string }[] = [
  { value: "colored", label: "Textured", icon: Paintbrush, description: "Full color & textures" },
  { value: "solid", label: "Clay", icon: Box, description: "Grey clay render" },
  { value: "wireframe", label: "Wireframe", icon: Grid3X3, description: "Mesh wireframe view" },
];

export default function MeshGeneratorPage() {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("");
  const [generating, setGenerating] = useState(false);
  const [currentGen, setCurrentGen] = useState<MeshGeneration | null>(null);
  const [history, setHistory] = useState<MeshGeneration[]>([]);
  const [credits, setCredits] = useState({ used: 0, max: 3, remaining: 3 });
  const [showHistory, setShowHistory] = useState(false);
  const [selectedModel, setSelectedModel] = useState<MeshGeneration | null>(null);
  const [downloadFormat, setDownloadFormat] = useState("glb");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("colored");
  const [viewerKey, setViewerKey] = useState(0);

  // Fetch history on mount
  useEffect(() => {
    if (session?.user) {
      fetch("/api/mesh/history")
        .then((r) => r.json())
        .then((data) => {
          setHistory(data.generations || []);
          setCredits(data.credits || { used: 0, max: 3, remaining: 3 });
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.email]);

  // Reset view mode when selecting a new model
  useEffect(() => {
    setViewMode("colored");
    setViewerKey((k) => k + 1);
  }, [selectedModel?.id]);

  // Poll for generation status
  const pollStatus = useCallback(async (genId: string) => {
    let attempts = 0;
    const maxAttempts = 120;

    const poll = async () => {
      if (attempts >= maxAttempts) {
        setCurrentGen((prev) => prev ? { ...prev, status: "failed", error: "Timeout" } : null);
        setGenerating(false);
        return;
      }
      attempts++;

      try {
        const res = await fetch(`/api/mesh/status?id=${genId}`);
        const data = await res.json();

        setCurrentGen((prev) => prev ? { ...prev, ...data } : data);

        if (data.status === "success") {
          setGenerating(false);
          setSelectedModel(data);
          const histRes = await fetch("/api/mesh/history");
          const histData = await histRes.json();
          setHistory(histData.generations || []);
          setCredits(histData.credits || credits);
          return;
        }

        if (data.status === "failed") {
          setGenerating(false);
          return;
        }

        setTimeout(poll, 1500);
      } catch {
        setTimeout(poll, 3000);
      }
    };

    poll();
  }, [credits]);

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;

    setGenerating(true);
    setCurrentGen(null);
    setSelectedModel(null);

    try {
      const res = await fetch("/api/mesh/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          mode: "text_to_model",
          style: style || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setGenerating(false);
        setCurrentGen({ error: data.error } as MeshGeneration);
        return;
      }

      setCurrentGen({
        id: data.id,
        prompt: prompt.trim(),
        mode: "text_to_model",
        style,
        status: "running",
        progress: 0,
        resultUrl: null,
        thumbnailUrl: null,
        modelData: null,
        error: null,
        createdAt: new Date().toISOString(),
        completedAt: null,
      });

      setCredits((prev) => ({ ...prev, remaining: data.creditsRemaining }));
      pollStatus(data.id);
    } catch (err: any) {
      setGenerating(false);
      setCurrentGen({ error: err.message || "Generation failed" } as MeshGeneration);
    }
  };

  const handleDownload = async (gen: MeshGeneration, format: string) => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/mesh/download?id=${gen.id}&format=${format}`);
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Download failed");
        setDownloading(false);
        return;
      }

      window.open(data.url, "_blank");
    } catch {
      alert("Download failed");
    }
    setDownloading(false);
    setShowDownloadMenu(false);
  };

  const handleEditInStudio = () => {
    if (!selectedModel?.id) return;
    // Store the model info so Creative Studio can pick it up via proxy
    sessionStorage.setItem("importedMesh", JSON.stringify({
      proxyUrl: `/api/mesh/proxy-model?id=${selectedModel.id}`,
      prompt: selectedModel.prompt,
      thumbnailUrl: selectedModel.thumbnailUrl,
      id: selectedModel.id,
    }));
    router.push("/generate?import=mesh");
  };

  if (sessionStatus === "loading") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-14">
        <Loader2 className="w-8 h-8 text-brand animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center pt-14">
        <div className="text-center max-w-md mx-4">
          <Sparkles className="w-12 h-12 text-brand mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">AI Mesh Generator</h1>
          <p className="text-gray-400 mb-6">Generate realistic 3D models from text descriptions using AI.</p>
          <Link href="/login" className="px-6 py-3 bg-brand hover:bg-brand-hover text-white rounded-lg font-medium">
            Sign In to Get Started
          </Link>
        </div>
      </div>
    );
  }

  // Model is ready to view when we have a selected successful generation
  const modelReady = !!selectedModel?.id && selectedModel.status === "success";
  const modelProxyUrl = modelReady ? `/api/mesh/proxy-model?id=${selectedModel.id}` : null;

  return (
    <div className="min-h-screen bg-background pt-14">
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-brand" />
              Mesh Generator
            </h1>
            <p className="text-gray-400 mt-1">Generate realistic 3D models from text descriptions</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-surface-border rounded-lg">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">
                <span className="text-white font-bold">{credits.remaining}</span>/{credits.max} credits
              </span>
            </div>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                showHistory ? "bg-brand text-white" : "bg-white/[0.02] border border-surface-border text-gray-400 hover:text-white"
              }`}
            >
              <History className="w-4 h-4" />
              History
            </button>
          </div>
        </div>

        {/* Main Layout: 3-column on large screens */}
        <div className="grid lg:grid-cols-[340px_1fr_280px] gap-6">
          {/* Left Panel: Controls */}
          <div className="space-y-4">
            {/* Prompt Input */}
            <div className="p-5 bg-white/[0.02] border border-surface-border rounded-xl">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Describe your 3D model
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="A medieval knight's helmet with ornate gold engravings..."
                rows={3}
                className="w-full px-4 py-3 bg-gray-900 border border-surface-border rounded-lg text-white placeholder-gray-500 resize-none focus:outline-none focus:border-brand text-sm"
              />

              {/* Style Selector */}
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-500 mb-2">Style</label>
                <div className="flex flex-wrap gap-1.5">
                  {STYLES.map((s) => (
                    <button
                      key={s.value}
                      onClick={() => setStyle(s.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                        style === s.value
                          ? "bg-brand text-white"
                          : "bg-white/[0.02] border border-surface-border text-gray-400 hover:text-white"
                      }`}
                      title={s.description}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Generate Button */}
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim() || generating || credits.remaining <= 0}
                className="mt-4 w-full py-3 bg-brand hover:bg-brand-hover disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg flex items-center justify-center gap-2 transition-colors"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating... {currentGen?.progress ? `${currentGen.progress}%` : ""}
                  </>
                ) : credits.remaining <= 0 ? (
                  <>
                    <Lock className="w-4 h-4" />
                    No Credits Left
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate 3D Model
                  </>
                )}
              </button>

              {credits.remaining <= 0 && (
                <p className="text-xs text-yellow-400 mt-2 text-center">
                  <Crown className="w-3 h-3 inline mr-1" />
                  Upgrade to Premium for {session.user.plan === "FREE" ? "50" : "200"} monthly credits
                </p>
              )}
            </div>

            {/* Error Display */}
            {currentGen?.error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm">
                {currentGen.error}
              </div>
            )}

            {/* Progress */}
            {generating && currentGen && (
              <div className="p-4 bg-white/[0.02] border border-surface-border rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Generating mesh...</span>
                  <span className="text-sm text-brand font-mono">{currentGen.progress || 0}%</span>
                </div>
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-brand rounded-full transition-all duration-500"
                    style={{ width: `${currentGen.progress || 2}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2">This usually takes 30-90 seconds</p>
              </div>
            )}

            {/* Download Controls */}
            {selectedModel?.status === "success" && (
              <div className="p-5 bg-white/[0.02] border border-surface-border rounded-xl space-y-3">
                <h3 className="text-sm font-medium text-gray-300">Export Model</h3>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <button
                      onClick={() => setShowDownloadMenu(!showDownloadMenu)}
                      disabled={downloading}
                      className="w-full py-2.5 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium rounded-lg flex items-center justify-center gap-2 text-sm"
                    >
                      {downloading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      {downloadFormat.toUpperCase()}
                      <ChevronDown className="w-3 h-3" />
                    </button>
                    {showDownloadMenu && (
                      <div className="absolute bottom-full mb-1 left-0 right-0 bg-gray-900 border border-surface-border rounded-lg shadow-xl z-50 py-1">
                        {[
                          { fmt: "glb", label: "GLB", free: true },
                          { fmt: "obj", label: "OBJ", free: true },
                          { fmt: "fbx", label: "FBX", free: false },
                          { fmt: "stl", label: "STL", free: false },
                          { fmt: "usdz", label: "USDZ", free: false },
                        ].map((f) => (
                          <button
                            key={f.fmt}
                            onClick={() => {
                              setDownloadFormat(f.fmt);
                              handleDownload(selectedModel, f.fmt);
                            }}
                            className="w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-white/5 flex items-center justify-between"
                          >
                            <span>{f.label}</span>
                            {!f.free && session.user.plan === "FREE" && (
                              <Crown className="w-3 h-3 text-yellow-400" />
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      setSelectedModel(null);
                      setCurrentGen(null);
                      setPrompt("");
                      setViewMode("colored");
                    }}
                    className="px-3 py-2.5 bg-white/[0.02] border border-surface-border text-gray-400 hover:text-white rounded-lg text-sm"
                    title="New generation"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Send to Creative Studio */}
                <button
                  onClick={handleEditInStudio}
                  className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-lg flex items-center justify-center gap-2 text-sm transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Edit in Creative Studio
                  <ArrowRight className="w-3 h-3" />
                </button>
                <p className="text-xs text-gray-500 text-center">
                  Use Claude AI to make manual changes
                </p>
              </div>
            )}
          </div>

          {/* Center: 3D Viewer */}
          <div className="space-y-3">
            <div className="aspect-square lg:aspect-auto lg:h-[650px] bg-[#1a1a2e] border border-surface-border rounded-xl overflow-hidden relative">
              {modelReady && modelProxyUrl ? (
                <MeshModelViewer
                  key={`${selectedModel?.id}-${viewerKey}`}
                  src={modelProxyUrl}
                  className="w-full h-full"
                  viewMode={viewMode}
                />
              ) : selectedModel?.thumbnailUrl ? (
                <img
                  src={selectedModel.thumbnailUrl}
                  alt="Generated model"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-600">
                  <ImageIcon className="w-16 h-16 mb-3" />
                  <p className="text-sm">Your 3D model will appear here</p>
                  <p className="text-xs text-gray-700 mt-1">Drag to orbit • Scroll to zoom</p>
                </div>
              )}
            </div>

            {/* View Mode Toggle Bar */}
            {modelReady && (
              <div className="flex items-center justify-center gap-1 p-1 bg-white/[0.02] border border-surface-border rounded-lg w-fit mx-auto">
                {VIEW_MODES.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.value}
                      onClick={() => setViewMode(mode.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                        viewMode === mode.value
                          ? "bg-brand text-white shadow-lg shadow-brand/20"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                      title={mode.description}
                    >
                      <Icon className="w-4 h-4" />
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Panel: Model Info & Quick History */}
          <div className="space-y-4">
            {/* Model Info Card */}
            {selectedModel && (
              <div className="p-5 bg-white/[0.02] border border-surface-border rounded-xl space-y-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-brand" />
                  Model Details
                </h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Prompt</span>
                    <p className="text-sm text-gray-300 mt-0.5">{selectedModel.prompt}</p>
                  </div>
                  <div className="flex gap-4">
                    {selectedModel.style && (
                      <div>
                        <span className="text-xs text-gray-500">Style</span>
                        <p className="text-sm text-gray-300 mt-0.5 capitalize">{selectedModel.style || "Realistic"}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-xs text-gray-500">Status</span>
                      <p className="text-sm text-green-400 mt-0.5 capitalize">{selectedModel.status}</p>
                    </div>
                  </div>
                  {selectedModel.completedAt && (
                    <div>
                      <span className="text-xs text-gray-500">Created</span>
                      <p className="text-sm text-gray-300 mt-0.5">
                        {new Date(selectedModel.createdAt).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Thumbnail preview */}
                {selectedModel.thumbnailUrl && (
                  <div className="mt-3">
                    <span className="text-xs text-gray-500">Reference Image</span>
                    <img
                      src={selectedModel.thumbnailUrl}
                      alt="Model render"
                      className="w-full aspect-video object-cover rounded-lg mt-1 border border-surface-border"
                    />
                  </div>
                )}
              </div>
            )}

            {/* View Mode Info */}
            {modelReady && (
              <div className="p-4 bg-white/[0.02] border border-surface-border rounded-xl">
                <h3 className="text-sm font-semibold text-white mb-2">View Mode</h3>
                <p className="text-xs text-gray-400">
                  {viewMode === "colored" && "Showing the full textured model with PBR materials and colors."}
                  {viewMode === "solid" && "Grey clay render showing the model's shape without textures."}
                  {viewMode === "wireframe" && "Wireframe view showing the underlying mesh geometry."}
                </p>
              </div>
            )}

            {/* Recent Generations */}
            <div className="p-5 bg-white/[0.02] border border-surface-border rounded-xl">
              <h3 className="text-sm font-semibold text-white mb-3">Recent</h3>
              {history.length === 0 ? (
                <p className="text-xs text-gray-500">No generations yet</p>
              ) : (
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {history.slice(0, 8).map((gen) => (
                    <button
                      key={gen.id}
                      onClick={() => {
                        if (gen.status === "success") {
                          setSelectedModel(gen);
                        }
                      }}
                      className={`w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-white/5 transition-colors ${
                        selectedModel?.id === gen.id ? "bg-white/5 border border-brand/30" : ""
                      }`}
                    >
                      {gen.thumbnailUrl ? (
                        <img
                          src={gen.thumbnailUrl}
                          alt={gen.prompt}
                          className="w-10 h-10 rounded-md object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-md bg-gray-800 flex items-center justify-center flex-shrink-0">
                          {gen.status === "running" ? (
                            <Loader2 className="w-4 h-4 text-brand animate-spin" />
                          ) : gen.status === "failed" ? (
                            <X className="w-4 h-4 text-red-400" />
                          ) : (
                            <ImageIcon className="w-4 h-4 text-gray-600" />
                          )}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white truncate">{gen.prompt}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(gen.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Full History Panel */}
        {showHistory && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Generation History</h2>
              <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            {history.length === 0 ? (
              <p className="text-gray-500 text-sm">No generations yet. Create your first 3D model above!</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                {history.map((gen) => (
                  <button
                    key={gen.id}
                    onClick={() => {
                      if (gen.status === "success") {
                        setSelectedModel(gen);
                        setShowHistory(false);
                      }
                    }}
                    className={`p-3 bg-white/[0.02] border border-surface-border rounded-xl text-left hover:border-brand/50 transition-colors ${
                      selectedModel?.id === gen.id ? "border-brand" : ""
                    }`}
                  >
                    {gen.thumbnailUrl ? (
                      <img
                        src={gen.thumbnailUrl}
                        alt={gen.prompt}
                        className="w-full aspect-square object-cover rounded-lg mb-2"
                      />
                    ) : (
                      <div className="w-full aspect-square bg-gray-800 rounded-lg mb-2 flex items-center justify-center">
                        {gen.status === "running" ? (
                          <Loader2 className="w-6 h-6 text-brand animate-spin" />
                        ) : gen.status === "failed" ? (
                          <X className="w-6 h-6 text-red-400" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                    )}
                    <p className="text-xs text-white truncate">{gen.prompt}</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {gen.style ? `${gen.style} • ` : ""}
                      {new Date(gen.createdAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
