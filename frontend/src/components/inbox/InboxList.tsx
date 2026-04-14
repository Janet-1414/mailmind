"use client";
// src/components/inbox/InboxList.tsx
import type { InboxItem } from "@/types";

interface Props {
  items: InboxItem[];
  selectedId?: string;
  onSelect: (item: InboxItem) => void;
  loading: boolean;
  error?: string | null;
}

export function InboxList({ items, selectedId, onSelect, loading, error }: Props) {
  if (loading) return (
    <div className="space-y-2 p-3">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="h-16 rounded-xl animate-pulse" style={{ background: "var(--border)" }} />
      ))}
    </div>
  );

  if (error) return (
    <div className="p-4 text-sm text-center" style={{ color: "#dc2626" }}>
      {error}
    </div>
  );

  if (items.length === 0) return (
    <div className="p-6 text-sm text-center" style={{ color: "var(--muted)" }}>
      No emails found. Connect your inbox first.
    </div>
  );

  return (
    <div className="overflow-y-auto divide-y" style={{ divideColor: "var(--border)" }}>
      {items.map((item) => (
        <div key={item.id} onClick={() => onSelect(item)}
          className="px-4 py-3 cursor-pointer transition-all hover:opacity-90"
          style={{
            background: selectedId === item.id ? "#AEB78422" : "transparent",
            borderLeft: selectedId === item.id ? "3px solid var(--sage)" : "3px solid transparent",
          }}>
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-medium truncate flex-1" style={{ color: "var(--text)" }}>
              {item.subject || "(no subject)"}
            </p>
            <span className="text-xs flex-shrink-0" style={{ color: "var(--muted)" }}>
              {new Date(item.date).toLocaleDateString()}
            </span>
          </div>
          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--muted)" }}>
            {item.from_address}
          </p>
          <p className="text-xs mt-1 line-clamp-2" style={{ color: "var(--muted)" }}>
            {item.snippet}
          </p>
        </div>
      ))}
    </div>
  );
}

// ── EmailPreview ─────────────────────────────────────────────────
import type { EmailMessage } from "@/types";

interface PreviewProps {
  message: EmailMessage;
  onReply: (body: string) => void;
  onClose: () => void;
}

export function EmailPreview({ message, onReply, onClose }: PreviewProps) {
  return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="p-4 flex items-start justify-between gap-4"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <div>
          <h2 className="font-semibold" style={{ color: "var(--text)" }}>{message.subject}</h2>
          <p className="text-xs mt-1" style={{ color: "var(--muted)" }}>
            From: {message.from_address}
          </p>
          <p className="text-xs" style={{ color: "var(--muted)" }}>
            {new Date(message.date).toLocaleString()}
          </p>
        </div>
        <button onClick={onClose} className="text-lg" style={{ color: "var(--muted)" }}>✕</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--text)" }}>
          {message.body}
        </p>
      </div>

      <div className="p-4" style={{ borderTop: "1px solid var(--border)" }}>
        <button onClick={() => onReply(message.body)}
          className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90"
          style={{ background: "var(--olive)", color: "#F8F3E1" }}>
          ✦ Generate Reply in Composer
        </button>
      </div>
    </div>
  );
}
