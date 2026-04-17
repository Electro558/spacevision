"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Loader2,
  X,
  Bot,
  Sparkles,
  Trash2,
  StopCircle,
  Box,
  Layers,
  RotateCcw,
  GitBranch,
  Scissors,
  Grid3x3,
  Circle,
  type LucideProps,
} from "lucide-react";
import type { AiChatMessage } from "../hooks/useAiChat";

type IconComponent = React.ForwardRefExoticComponent<Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>>;

const TOOL_META: Record<string, { label: string; icon: IconComponent; color: string }> = {
  add_primitive:        { label: "Add Primitive",      icon: Box,       color: "text-violet-400" },
  create_sketch_extrude:{ label: "Sketch + Extrude",   icon: Layers,    color: "text-indigo-400" },
  add_fillet:           { label: "Fillet",             icon: Circle,    color: "text-blue-400" },
  add_chamfer:          { label: "Chamfer",            icon: Scissors,  color: "text-cyan-400" },
  add_hole:             { label: "Hole",               icon: Circle,    color: "text-rose-400" },
  add_boolean:          { label: "Boolean Op",         icon: GitBranch, color: "text-amber-400" },
  add_linear_pattern:   { label: "Linear Pattern",     icon: Grid3x3,   color: "text-green-400" },
  add_circular_pattern: { label: "Circular Pattern",   icon: RotateCcw, color: "text-teal-400" },
  modify_feature:       { label: "Modify Feature",     icon: Layers,    color: "text-orange-400" },
  delete_feature:       { label: "Delete Feature",     icon: Trash2,    color: "text-red-400" },
};

const SUGGESTIONS = [
  "Create a 50×30×10mm base plate",
  "Add a 5mm fillet to all edges",
  "Make a cylinder 20mm diameter, 40mm tall",
  "Cut a 10mm hole through the center",
  "Add a 3×3 grid pattern spaced 15mm apart",
];

interface ToolChipProps {
  tool: string;
  input: Record<string, unknown>;
}

function ToolChip({ tool, input }: ToolChipProps) {
  const meta = TOOL_META[tool] ?? { label: tool, icon: Sparkles, color: "text-gray-400" };
  const Icon = meta.icon;

  // Build a short summary of the key input params
  const summary = Object.entries(input)
    .filter(([k]) => !["name"].includes(k))
    .slice(0, 3)
    .map(([k, v]) => {
      if (typeof v === "number") return `${k}: ${v}mm`;
      if (typeof v === "string" && v.length < 20) return v;
      return null;
    })
    .filter(Boolean)
    .join(", ");

  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] mt-1">
      <Icon className={`w-3 h-3 ${meta.color}`} width={12} height={12} />
      <span className={`font-medium ${meta.color}`}>{meta.label}</span>
      {summary && <span className="text-gray-500">{summary}</span>}
    </div>
  );
}

interface MessageBubbleProps {
  msg: AiChatMessage;
  isLast: boolean;
  isStreaming: boolean;
}

function MessageBubble({ msg, isLast, isStreaming }: MessageBubbleProps) {
  const isAi = msg.role === "ai";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-2 ${isAi ? "" : "flex-row-reverse"}`}
    >
      {/* Avatar */}
      {isAi && (
        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-600/40 border border-indigo-500/30 flex items-center justify-center mt-0.5">
          <Bot className="w-3 h-3 text-indigo-300" />
        </div>
      )}

      <div className={`flex-1 min-w-0 ${isAi ? "" : "flex flex-col items-end"}`}>
        {/* Message text */}
        <div
          className={`rounded-xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap break-words max-w-full ${
            isAi
              ? "bg-white/[0.04] text-gray-200 border border-white/[0.06]"
              : "bg-indigo-600/40 text-white border border-indigo-500/30"
          }`}
        >
          {msg.text || (isLast && isStreaming ? "" : "...")}
          {isLast && isStreaming && (
            <span className="inline-block w-1.5 h-3 bg-indigo-400 ml-0.5 animate-pulse align-middle rounded-sm" />
          )}
        </div>

        {/* Tool call chips */}
        {msg.toolCalls && msg.toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-1 max-w-full">
            {msg.toolCalls.map((tc, i) => (
              <ToolChip key={i} tool={tc.tool} input={tc.input} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface AiChatPanelProps {
  messages: AiChatMessage[];
  isStreaming: boolean;
  input: string;
  setInput: (v: string) => void;
  sendMessage: (text: string) => void;
  stop: () => void;
  clearHistory: () => void;
  onClose: () => void;
}

export function AiChatPanel({
  messages,
  isStreaming,
  input,
  setInput,
  sendMessage,
  stop,
  clearHistory,
  onClose,
}: AiChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when panel opens
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && input.trim()) sendMessage(input);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 16 }}
      transition={{ duration: 0.2 }}
      className="flex h-full w-72 flex-col border-l border-gray-800/50 bg-[#0b0b1e]/98 backdrop-blur-sm"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-800/50 px-3 py-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-600/30 border border-indigo-500/30">
            <Sparkles className="h-3 w-3 text-indigo-400" />
          </div>
          <span className="text-xs font-semibold text-gray-200">AI CAD Assistant</span>
          <span className="rounded-full bg-indigo-600/20 px-1.5 py-0.5 text-[9px] font-medium text-indigo-400 border border-indigo-500/20">
            Claude
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearHistory}
            title="Clear conversation"
            className="rounded p-1 text-gray-600 hover:text-gray-300 transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onClose}
            className="rounded p-1 text-gray-600 hover:text-gray-300 transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 cad-panel">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              isLast={i === messages.length - 1}
              isStreaming={isStreaming}
            />
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Suggestion chips — only when idle and no user messages yet */}
      {messages.length <= 1 && !isStreaming && (
        <div className="border-t border-gray-800/50 px-3 py-2">
          <p className="text-[10px] text-gray-600 mb-1.5">Try:</p>
          <div className="flex flex-col gap-1">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                className="text-left px-2 py-1.5 rounded-lg text-[10px] text-gray-400 bg-white/[0.03] border border-white/[0.06] hover:border-indigo-500/30 hover:text-gray-200 transition-all truncate"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-800/50 p-3">
        <div className="flex gap-2">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe a CAD operation…"
            rows={2}
            disabled={isStreaming}
            className="flex-1 resize-none rounded-xl bg-white/[0.04] border border-white/[0.08] px-3 py-2 text-xs text-gray-200 placeholder-gray-600 focus:border-indigo-500/40 focus:outline-none focus:ring-0 transition-colors disabled:opacity-50"
          />
          <div className="flex flex-col gap-1">
            {isStreaming ? (
              <button
                onClick={stop}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-red-600/30 border border-red-500/30 text-red-400 hover:bg-red-600/50 transition-colors"
                title="Stop"
              >
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={() => { if (input.trim()) sendMessage(input); }}
                disabled={!input.trim()}
                className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600/40 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/70 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Send (Enter)"
              >
                {isStreaming ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Send className="h-3.5 w-3.5" />
                )}
              </button>
            )}
          </div>
        </div>
        <p className="mt-1.5 text-center text-[9px] text-gray-700">
          Enter to send · Shift+Enter for newline
        </p>
      </div>
    </motion.div>
  );
}
