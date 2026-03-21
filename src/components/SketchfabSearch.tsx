'use client';

import React, { useState, useCallback } from 'react';
import { Search, Loader2, ExternalLink, Download } from 'lucide-react';

interface SketchfabResult {
  uid: string;
  name: string;
  thumbnail: string;
  viewerUrl: string;
  user: string;
  likeCount: number;
}

interface SketchfabSearchProps {
  onImportUrl: (url: string, name: string) => void;
}

export default function SketchfabSearch({ onImportUrl }: SketchfabSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SketchfabResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setSearched(true);

    try {
      const res = await fetch(`/api/sketchfab?q=${encodeURIComponent(query)}`);
      const data = await res.json();

      if (data.error) throw new Error(data.error);
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    e.stopPropagation(); // Prevent CAD shortcuts from firing
    if (e.key === 'Enter') handleSearch();
  }, [handleSearch]);

  return (
    <div className="flex flex-col h-full">
      {/* Search input */}
      <div className="flex gap-2 p-3 border-b border-zinc-800">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search 3D models..."
          className="flex-1 px-3 py-1.5 rounded bg-zinc-800 border border-zinc-700 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query.trim()}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {error && (
          <div className="text-red-400 text-xs p-2 bg-red-900/20 rounded">{error}</div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 text-zinc-500 text-sm">
            <Loader2 size={16} className="animate-spin mr-2" />
            Searching Sketchfab...
          </div>
        )}

        {!loading && searched && results.length === 0 && !error && (
          <div className="text-zinc-500 text-xs text-center py-8">
            No downloadable models found for &quot;{query}&quot;
          </div>
        )}

        {!searched && !loading && (
          <div className="text-zinc-500 text-xs text-center py-8 px-4">
            Search Sketchfab&apos;s library of free 3D models. Results show downloadable models under Creative Commons licenses.
          </div>
        )}

        {results.map((model) => (
          <div
            key={model.uid}
            className="bg-zinc-800/50 rounded-lg overflow-hidden border border-zinc-700/50 hover:border-zinc-600 transition-colors"
          >
            {/* Thumbnail */}
            {model.thumbnail && (
              <div className="w-full h-28 bg-zinc-900 overflow-hidden">
                <img
                  src={model.thumbnail}
                  alt={model.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            )}

            {/* Info */}
            <div className="p-2">
              <h4 className="text-xs font-medium text-white truncate" title={model.name}>
                {model.name}
              </h4>
              <p className="text-[10px] text-zinc-500 truncate">
                by {model.user} · {model.likeCount} likes
              </p>

              <div className="flex gap-1 mt-2">
                <a
                  href={model.viewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] bg-zinc-700 text-zinc-300 hover:bg-zinc-600"
                >
                  <ExternalLink size={10} /> View
                </a>
                <button
                  onClick={() => {
                    // Open the Sketchfab page where user can download
                    // Direct download requires Sketchfab OAuth which is complex
                    window.open(model.viewerUrl + '/download', '_blank');
                  }}
                  className="flex-1 flex items-center justify-center gap-1 px-2 py-1 rounded text-[10px] bg-blue-600 text-white hover:bg-blue-500"
                >
                  <Download size={10} /> Download
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Attribution */}
      <div className="p-2 border-t border-zinc-800 text-[9px] text-zinc-600 text-center">
        Powered by Sketchfab · Models under CC licenses
      </div>
    </div>
  );
}
