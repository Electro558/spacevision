"use client";

import { useEffect, useRef } from "react";

interface ShortcutHelpProps {
  onClose: () => void;
}

interface ShortcutEntry {
  key: string;
  description: string;
}

const CATEGORIES: { title: string; shortcuts: ShortcutEntry[] }[] = [
  {
    title: "Sketch Tools",
    shortcuts: [
      { key: "S", description: "Select tool" },
      { key: "L", description: "Line tool" },
      { key: "C", description: "Circle tool" },
      { key: "R", description: "Rectangle tool" },
      { key: "A", description: "Arc tool" },
      { key: "T", description: "Trim tool" },
      { key: "M", description: "Mirror sketch tool" },
      { key: "O", description: "Offset tool" },
      { key: "X", description: "Toggle construction mode" },
    ],
  },
  {
    title: "Features",
    shortcuts: [
      { key: "E", description: "Extrude" },
      { key: "F", description: "Fillet" },
    ],
  },
  {
    title: "View",
    shortcuts: [
      { key: "1", description: "Front view" },
      { key: "2", description: "Back view" },
      { key: "3", description: "Left view" },
      { key: "4", description: "Right view" },
      { key: "5", description: "Top view" },
      { key: "6", description: "Bottom view" },
      { key: "0", description: "Isometric view" },
      { key: "G", description: "Toggle grid" },
      { key: "Space", description: "Toggle snap" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { key: "Ctrl+Z", description: "Undo" },
      { key: "Ctrl+Shift+Z", description: "Redo" },
      { key: "Ctrl+S", description: "Save" },
      { key: "Delete", description: "Delete selected" },
      { key: "Escape", description: "Cancel / exit sketch" },
      { key: "?", description: "Show this help" },
    ],
  },
];

export function ShortcutHelp({ onClose }: ShortcutHelpProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "?") {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60"
    >
      <div className="max-h-[80vh] w-[640px] overflow-y-auto rounded-lg border border-gray-700 bg-[#1a1a2e] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-700 px-6 py-4">
          <h2 className="text-lg font-bold text-white">Keyboard Shortcuts</h2>
          <button
            onClick={onClose}
            className="rounded px-2 py-1 text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            &#x2715;
          </button>
        </div>

        {/* Content */}
        <div className="grid grid-cols-2 gap-6 p-6">
          {CATEGORIES.map((category) => (
            <div key={category.title}>
              <h3 className="mb-3 text-sm font-semibold text-indigo-400">
                {category.title}
              </h3>
              <div className="space-y-1.5">
                {category.shortcuts.map((s) => (
                  <div
                    key={s.key}
                    className="flex items-center justify-between text-xs"
                  >
                    <span className="text-gray-300">{s.description}</span>
                    <kbd className="rounded bg-gray-800 px-2 py-0.5 font-mono text-gray-400">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-700 px-6 py-3 text-center text-xs text-gray-500">
          Press <kbd className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-gray-400">?</kbd> or{" "}
          <kbd className="rounded bg-gray-800 px-1.5 py-0.5 font-mono text-gray-400">Esc</kbd> to close
        </div>
      </div>
    </div>
  );
}
