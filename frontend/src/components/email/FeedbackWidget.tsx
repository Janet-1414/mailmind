/**
 * FeedbackWidget component for MailMind.
 * Renders thumbs up/thumbs down rating buttons and an optional comment
 * textarea. On submit, sends feedback to the backend. On thumbs down,
 * passes the comment back up via onDislike to trigger an auto-retry
 * with the correction injected into the agent prompt.
 */
"use client";
import { useState } from "react";
import { FeedbackService } from "@/services/FeedbackService";

interface FeedbackWidgetProps {
  emailLogId: string;
  onDislike?: (comment: string) => void;
}

const feedbackService = new FeedbackService();

export default function FeedbackWidget({ emailLogId, onDislike }: FeedbackWidgetProps) {
  const [rating,    setRating]    = useState<1 | -1 | null>(null);
  const [comment,   setComment]   = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading,   setLoading]   = useState(false);

  const handleSubmit = async () => {
    if (!rating) return;
    setLoading(true);
    try {
      await feedbackService.submit({ email_log_id: emailLogId, rating, comment });
      setSubmitted(true);
      if (rating === -1 && onDislike) {
        setTimeout(() => onDislike(comment), 1500);
      }
    } catch { /* non-critical */ }
    finally { setLoading(false); }
  };

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-sm font-sans py-1" style={{ color: "var(--text-muted)" }}>
        <span style={{ color: "var(--accent)" }}>✓</span>
        {rating === -1
          ? comment.trim() ? "Got it! Retrying with your feedback…" : "Got it! Retrying with a fresh reply…"
          : "Thanks for your feedback!"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="font-sans text-sm font-medium" style={{ color: "var(--text-muted)" }}>
        Was this reply helpful?
      </p>

      <div className="flex items-center gap-2">
        {([1, -1] as const).map((r) => (
          <button
            key={r}
            onClick={() => setRating(r)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl border-2 text-sm font-sans font-medium transition-all duration-200"
            style={{
              borderColor: rating === r ? "var(--accent)" : "var(--border-dark)",
              backgroundColor: rating === r ? `var(--accent)15` : "var(--surface)",
              color: rating === r ? "var(--accent)" : "var(--text-muted)",
            }}
          >
            {r === 1 ? "👍 Yes" : "👎 No"}
          </button>
        ))}
      </div>

      {rating && (
        <div className="space-y-2">
          <textarea
            className="input-field text-sm resize-none"
            rows={2}
            placeholder={rating === -1 ? "What was wrong? e.g. 'too formal', 'too long' (optional)" : "Any comments? (optional)"}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button onClick={handleSubmit} disabled={loading} className="btn-primary text-sm px-4 py-2">
            {loading ? "Submitting…" : "Submit feedback"}
          </button>
        </div>
      )}
    </div>
  );
}
