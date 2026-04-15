/**
 * ThreadChatView component for MailMind.
 * Renders the full conversation history of the active thread as a
 * chat-style exchange list. Each bubble shows the original email
 * and the agent reply with tone, model, and confidence score metadata.
 * Styled with Midnight Slate theme variables.
 */
"use client";
import type { ThreadExchange } from "@/types";

interface ThreadChatViewProps {
  exchanges: ThreadExchange[];
}

function ConfidencePill({ score }: { score?: number | null }) {
  if (score === null || score === undefined) return null;
  const pct   = Math.round(score * 100);
  const color = pct >= 80 ? "#22c55e" : pct >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <span className="text-xs font-mono" style={{ color }}>◎ {pct}%</span>
  );
}

export default function ThreadChatView({ exchanges }: ThreadChatViewProps) {
  return (
    <div className="space-y-4">
      <p className="text-xs font-sans uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
        Conversation history
      </p>
      {exchanges.map((ex, i) => (
        <div key={ex.id || i} className="space-y-2">
          {/* Incoming email */}
          <div className="flex justify-start">
            <div
              className="max-w-[85%] rounded-2xl rounded-tl-sm px-4 py-3"
              style={{ backgroundColor: "var(--border)", border: "1px solid var(--border-dark)" }}
            >
              <p className="text-xs font-sans font-medium mb-1" style={{ color: "var(--text-muted)" }}>
                Incoming email {ex.hint && <span>· hint: "{ex.hint}"</span>}
              </p>
              <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                {ex.email_content}
              </p>
            </div>
          </div>

          {/* Agent reply */}
          <div className="flex justify-end">
            <div
              className="max-w-[85%] rounded-2xl rounded-tr-sm px-4 py-3"
              style={{ backgroundColor: `var(--accent)15`, border: `1px solid var(--accent)40` }}
            >
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <p className="text-xs font-sans font-medium" style={{ color: "var(--accent)" }}>
                  Your reply · {ex.tone} · {ex.model}
                </p>
                <ConfidencePill score={ex.confidence_score} />
              </div>
              <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--text)" }}>
                {ex.reply}
              </p>
            </div>
          </div>
        </div>
      ))}
      <div
        className="text-center text-xs font-sans py-2"
        style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}
      >
        Continue conversation
      </div>
    </div>
  );
}
