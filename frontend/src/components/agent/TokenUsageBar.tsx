/**
 * TokenUsageBar component for MailMind.
 * Displays token usage breakdown (prompt vs completion) and estimated
 * USD cost for the last agent reply. Shows a cache indicator when the
 * reply was served from Redis rather than a live LLM call.
 */
"use client";
import type { TokenUsage } from "@/types";

export default function TokenUsageBar({ usage, cached }: { usage: TokenUsage; cached: boolean }) {
  if (!usage) return null;
  const total = usage.total_tokens || 1;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          {usage.total_tokens.toLocaleString()} tokens
        </span>
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          ${usage.cost_usd.toFixed(5)}
          {cached && <span className="ml-2 text-xs" style={{ color: "var(--accent)" }}>⚡ cached</span>}
        </span>
      </div>
      <div className="flex h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
        <div
          className="h-full rounded-l-full transition-all duration-500"
          style={{
            width: `${(usage.prompt_tokens / total) * 100}%`,
            backgroundColor: "var(--accent)",
          }}
        />
        <div
          className="h-full rounded-r-full transition-all duration-500"
          style={{
            width: `${(usage.completion_tokens / total) * 100}%`,
            backgroundColor: "var(--primary)",
          }}
        />
      </div>
      <div className="flex gap-4">
        <span className="font-sans text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--accent)" }} />
          Prompt {usage.prompt_tokens}
        </span>
        <span className="font-sans text-xs flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: "var(--primary)" }} />
          Completion {usage.completion_tokens}
        </span>
      </div>
    </div>
  );
}
