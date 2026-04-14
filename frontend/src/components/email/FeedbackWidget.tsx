"use client";
// src/components/email/FeedbackWidget.tsx
import { useState } from "react";
import { feedbackService } from "@/services/AllServices";

interface Props {
  emailLogId: string;
}

export default function FeedbackWidget({ emailLogId }: Props) {
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showComment, setShowComment] = useState(false);

  const handleVote = (vote: "up" | "down") => {
    const score = vote === "up" ? 5 : 1;
    setRating(score);
    setShowComment(true);
  };

  const handleSubmit = async () => {
    if (rating === null) return;
    setLoading(true);
    try {
      await feedbackService.submit({ email_log_id: emailLogId, rating, comment });
      setSubmitted(true);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="p-3 rounded-xl text-sm text-center animate-fade-in"
        style={{ background: "#d1fae5", color: "#065f46" }}>
        ✓ Thanks for your feedback!
      </div>
    );
  }

  return (
    <div className="p-4 rounded-xl space-y-3"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
        Was this reply helpful?
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => handleVote("up")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: rating === 5 ? "#d1fae5" : "var(--bg)",
            color: rating === 5 ? "#065f46" : "var(--muted)",
            border: `1.5px solid ${rating === 5 ? "#10b981" : "var(--border)"}`,
          }}
        >
          👍 Yes
        </button>
        <button
          onClick={() => handleVote("down")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
          style={{
            background: rating === 1 ? "#fee2e2" : "var(--bg)",
            color: rating === 1 ? "#991b1b" : "var(--muted)",
            border: `1.5px solid ${rating === 1 ? "#ef4444" : "var(--border)"}`,
          }}
        >
          👎 No
        </button>
      </div>

      {showComment && (
        <div className="space-y-2 animate-fade-in">
          <textarea
            rows={2}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Any comments? (optional)"
            className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-none"
            style={{
              background: "var(--bg)",
              border: "1.5px solid var(--border)",
              color: "var(--text)",
            }}
          />
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold transition-all disabled:opacity-50"
            style={{ background: "var(--olive)", color: "#F8F3E1" }}
          >
            {loading ? "Submitting…" : "Submit feedback"}
          </button>
        </div>
      )}
    </div>
  );
}