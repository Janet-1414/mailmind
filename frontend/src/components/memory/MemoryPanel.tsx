/**
 * MemoryPanel component for MailMind.
 * Reusable component that lists long-term Pinecone memory items for
 * the current user with delete controls and loading skeleton.
 * Used inside the dedicated Memory page.
 */
"use client";
import { useMemory } from "@/hooks/useMemory";

export default function MemoryPanel() {
  const { items, loading, clearing, deleteItem, clearAll } = useMemory();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-serif font-semibold" style={{ color: "var(--primary)" }}>Long-term Memory</h3>
          <p className="font-sans text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {items.length} stored context{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearAll}
            disabled={clearing}
            className="btn-ghost text-xs"
            style={{ color: "#ef4444" }}
          >
            {clearing ? "Clearing…" : "Clear all"}
          </button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-12 rounded-xl animate-pulse" style={{ backgroundColor: "var(--border)", opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-8 font-sans text-sm" style={{ color: "var(--text-muted)" }}>
          <span className="text-2xl block mb-2">◈</span>
          No memories yet. They appear as you use the agent.
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-start justify-between gap-3 rounded-xl px-4 py-3 group"
              style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
            >
              <div className="flex-1 min-w-0">
                <p className="font-sans text-sm line-clamp-2" style={{ color: "var(--text)" }}>{item.content}</p>
                <p className="font-mono text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {new Date(item.created_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => deleteItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-lg leading-none transition-all hover:text-red-400"
                style={{ color: "var(--text-muted)" }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
