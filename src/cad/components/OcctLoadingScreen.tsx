"use client";

interface OcctLoadingScreenProps {
  progress: number;
  message: string;
  error: string | null;
}

export function OcctLoadingScreen({
  progress,
  message,
  error,
}: OcctLoadingScreenProps) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0d1a]">
      <div className="flex flex-col items-center gap-6">
        {/* Logo / Title */}
        <h1 className="text-2xl font-bold text-white">
          SpaceVision <span className="text-indigo-400">CAD</span>
        </h1>
        <p className="text-sm text-gray-400">
          Loading OpenCASCADE geometry kernel...
        </p>

        {/* Progress bar */}
        <div className="h-2 w-64 overflow-hidden rounded-full bg-gray-800">
          <div
            className="h-full rounded-full bg-indigo-500 transition-all duration-300"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Status message */}
        <p className="text-xs text-gray-500">{message || "Initializing..."}</p>

        {/* Error state */}
        {error && (
          <div className="mt-4 max-w-md rounded-lg border border-red-800 bg-red-900/30 p-4 text-sm text-red-300">
            <p className="font-medium">Failed to load CAD engine</p>
            <p className="mt-1 text-xs text-red-400">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 rounded bg-red-800 px-3 py-1 text-xs text-white hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
