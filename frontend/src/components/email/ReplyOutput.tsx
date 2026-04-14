"use client";
// src/components/email/ReplyOutput.tsx

// ── StreamingReply ────────────────────────────────────────────────
interface StreamProps { text: string; isStreaming: boolean; }

export function StreamingReply({ text, isStreaming }: StreamProps) {
  if (!text && !isStreaming) return null;
  return (
    <div className="rounded-xl p-4 min-h-[120px] animate-fade-in"
      style={{ background: "var(--bg)", border: "1.5px solid var(--border)" }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--sage)" }}>
          AI Reply
        </span>
        {isStreaming && (
          <span className="flex gap-0.5">
            {[0, 1, 2].map(i => (
              <span key={i} className="w-1 h-1 rounded-full animate-pulse-dot"
                style={{ background: "var(--sage)", animationDelay: `${i * 0.2}s` }} />
            ))}
          </span>
        )}
      </div>
      <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isStreaming ? "streaming-cursor" : ""}`}
        style={{ color: "var(--text)" }}>
        {text}
      </p>
    </div>
  );
}

// ── ReplyOutput ───────────────────────────────────────────────────
import { useState } from "react";
import type { ReplyResponse } from "@/types";

interface ReplyOutputProps {
  response: ReplyResponse;
  onSaveTemplate: (content: string) => void;
  onSendEmail?: (content: string) => void;
}

export function ReplyOutput({ response, onSaveTemplate, onSendEmail }: ReplyOutputProps) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(response.reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-3 animate-slide-up">

      {/* ── Small analysis pills ── */}
      {response.email_analysis && (
        <div className="flex flex-wrap gap-1.5">
          {[
            {
              label: `${response.email_analysis.urgency_level} urgency`,
              color: response.email_analysis.is_urgent ? "#fee2e2" : "#d1fae5",
              text: response.email_analysis.is_urgent ? "#991b1b" : "#065f46",
            },
            {
              label: `${response.email_analysis.question_count} question(s)`,
              color: "#dbeafe",
              text: "#1e40af",
            },
            {
              label: response.email_analysis.sentiment_hint,
              color: "#fef3c7",
              text: "#92400e",
            },
          ].map(({ label, color, text }) => (
            <span key={label} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: color, color: text }}>
              {label}
            </span>
          ))}
        </div>
      )}

      {/* ── Reply text box ── */}
      <div className="rounded-xl p-4" style={{ background: "var(--bg)", border: "1.5px solid var(--border)" }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--sage)" }}>
            Generated Reply
          </span>
          <div className="flex gap-1.5">
            <button onClick={copy}
              className="text-xs px-2.5 py-1 rounded-lg transition-all"
              style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              {copied ? "✓ Copied" : "Copy"}
            </button>
            <button onClick={() => onSaveTemplate(response.reply)}
              className="text-xs px-2.5 py-1 rounded-lg transition-all"
              style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              Save Template
            </button>
            {onSendEmail && (
              <button onClick={() => onSendEmail(response.reply)}
                className="text-xs px-2.5 py-1 rounded-lg font-semibold transition-all"
                style={{ background: "var(--olive)", color: "#F8F3E1" }}>
                Send
              </button>
            )}
          </div>
        </div>
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>
          {response.reply}
        </p>

        {/* ── Subtle footer: confidence + tokens ── */}
        <div className="flex items-center gap-3 mt-3 pt-3"
          style={{ borderTop: "1px solid var(--border)" }}>
          {response.confidence_score > 0 && (
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              Confidence:{" "}
              <span className="font-medium"
                style={{ color: response.confidence_score >= 70 ? "var(--sage)" : "#f59e0b" }}>
                {response.confidence_score}%
              </span>
            </span>
          )}
          {response.confidence_breakdown && (
            <>
              <span className="text-xs" style={{ color: "var(--border)" }}>·</span>
              {Object.entries(response.confidence_breakdown).map(([key, val]) => (
                <span key={key} className="text-xs" style={{ color: "var(--muted)" }}>
                  {key.replace(/_/g, " ")}: <span className="font-medium">{Math.round(val as number)}%</span>
                </span>
              ))}
            </>
          )}
          {response.tokens_used > 0 && (
            <>
              <span className="text-xs" style={{ color: "var(--border)" }}>·</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>
                {response.tokens_used.toLocaleString()} tokens
              </span>
            </>
          )}
          {response.model_used && (
            <>
              <span className="text-xs" style={{ color: "var(--border)" }}>·</span>
              <span className="text-xs" style={{ color: "var(--muted)" }}>{response.model_used}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}