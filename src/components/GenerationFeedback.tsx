"use client";

import { useState } from "react";
import { Star, ThumbsUp, ThumbsDown, Send } from "lucide-react";

interface Props {
  captureId: string | null;
}

export default function GenerationFeedback({ captureId }: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [thumbs, setThumbs] = useState<"up" | "down" | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showComment, setShowComment] = useState(false);

  if (!captureId || submitted) {
    if (submitted) {
      return (
        <div className="flex items-center gap-2 text-xs text-green-400 py-1">
          <span>Thanks for the feedback!</span>
        </div>
      );
    }
    return null;
  }

  const handleSubmit = async () => {
    if (rating === 0) return;

    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        captureId,
        rating,
        thumbs,
        comment: comment.trim() || undefined,
      }),
    });

    setSubmitted(true);
  };

  return (
    <div className="flex flex-col gap-2 py-2 border-t border-surface-border/50 mt-2">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500">Rate this generation:</span>

        {/* Star rating */}
        <div className="flex gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5"
            >
              <Star
                className={`w-4 h-4 transition-colors ${
                  star <= (hoverRating || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-600"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Thumbs */}
        <div className="flex gap-1 ml-2">
          <button
            onClick={() => setThumbs(thumbs === "up" ? null : "up")}
            className={`p-1 rounded transition-colors ${
              thumbs === "up"
                ? "text-green-400 bg-green-400/10"
                : "text-gray-600 hover:text-green-400"
            }`}
          >
            <ThumbsUp className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setThumbs(thumbs === "down" ? null : "down")}
            className={`p-1 rounded transition-colors ${
              thumbs === "down"
                ? "text-red-400 bg-red-400/10"
                : "text-gray-600 hover:text-red-400"
            }`}
          >
            <ThumbsDown className="w-3.5 h-3.5" />
          </button>
        </div>

        {rating > 0 && !showComment && (
          <button
            onClick={() => setShowComment(true)}
            className="text-xs text-gray-500 hover:text-gray-300 ml-1"
          >
            + comment
          </button>
        )}

        {rating > 0 && !showComment && (
          <button
            onClick={handleSubmit}
            className="ml-auto flex items-center gap-1 px-2 py-1 bg-brand/20 text-brand text-xs rounded hover:bg-brand/30 transition-colors"
          >
            <Send className="w-3 h-3" />
            Submit
          </button>
        )}
      </div>

      {showComment && (
        <div className="flex gap-2">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What could be better?"
            className="flex-1 px-2 py-1 bg-white/[0.02] border border-surface-border rounded text-xs text-white placeholder-gray-600 focus:outline-none focus:border-brand"
          />
          <button
            onClick={handleSubmit}
            className="flex items-center gap-1 px-2 py-1 bg-brand/20 text-brand text-xs rounded hover:bg-brand/30 transition-colors"
          >
            <Send className="w-3 h-3" />
            Submit
          </button>
        </div>
      )}
    </div>
  );
}
