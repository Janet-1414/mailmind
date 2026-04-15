/**
 * ReplyOutput component for MailMind.
 * Displays the agent-generated reply with copy-to-clipboard, source tags
 * (memory, cache, web search), confidence score badge, token usage bar,
 * and the feedback widget. Supports streaming text display.
 * Accepts onReset (start over) and onDislike (auto-retry with correction) handlers.
 */
"use client";
import { useState } from "react";
import type { AgentReply } from "@/types";
import TokenUsageBar from "@/components/agent/TokenUsageBar";
import FeedbackWidget from "@/components/email/FeedbackWidget";

interface ReplyOutputProps {
  reply:         AgentReply;
  streamingText?: string;
  onReset:       () => void;
  onDislike:     (comment: string) => void;
}

function ConfidenceBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) return null;
  const pct   = Math.round(score * 100);
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
  const label = pct >= 80 ? "High confidence" : pct >= 60 ? "Medium confidence" : "Low confidence";
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-sans font-medium"
      style={{ backgroundColor: `${color}20`, color }}
      title={label}
    >
      ◎ {pct}%
    </span>
  );
}

export default function ReplyOutput({ reply, streamingText, onReset, onDislike }: ReplyOutputProps) {
  const [copied, setCopied] = useState(false);

  const displayText = reply.reply || streamingText || "";

  const handleCopy = () => {
    navigator.clipboard.writeText(displayText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="card space-y-4 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="font-serif font-semibold" style={{ color: "var(--primary)" }}>
          Generated Reply
        </h2>
        <div className="flex items-center gap-2 flex-wrap">
          <ConfidenceBadge score={reply.confidence_score} />
          {reply.memory_used && (
            <span className="tag text-xs">◈ Memory</span>
          )}
          {reply.cached && (
            <span className="tag text-xs">⚡ Cached</span>
          )}
          {reply.sources.filter(s => s !== "Long-term memory").map((s, i) => (
            <span key={i} className="tag text-xs">{s}</span>
          ))}
        </div>
      </div>

      {/* Reply body */}
      <div
        className="rounded-xl p-5"
        style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
      >
        <pre
          className="font-sans text-sm leading-relaxed whitespace-pre-wrap"
          style={{ color: "var(--text)" }}
        >
          {displayText}
          {streamingText && !reply.reply && (
            <span className="inline-block w-0.5 h-4 ml-0.5 animate-pulse" style={{ backgroundColor: "var(--accent)" }} />
          )}
        </pre>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button onClick={handleCopy} className="btn-secondary text-sm px-4 py-2">
          {copied ? "✓ Copied!" : "Copy reply"}
        </button>
        <button
          onClick={onReset}
          className="btn-ghost text-sm"
          style={{ color: "var(--text-muted)" }}
        >
          Start over
        </button>
      </div>

      {/* Token usage */}
      <TokenUsageBar usage={reply.usage} cached={reply.cached} />

      {/* Feedback */}
      <div className="pt-3" style={{ borderTop: "1px solid var(--border)" }}>
        <FeedbackWidget emailLogId={reply.email_log_id} onDislike={onDislike} />
      </div>
    </div>
  );
}
