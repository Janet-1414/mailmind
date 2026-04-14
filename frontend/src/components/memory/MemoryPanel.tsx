"use client";
// src/components/memory/MemoryHealthScore.tsx
import type { MemoryHealth } from "@/types";

export function MemoryHealthScore({ health }: { health: MemoryHealth }) {
  const pct = health.health_percentage;
  const color = pct >= 80 ? "#059669" : pct >= 60 ? "#d97706" : "#dc2626";

  return (
    <div className="p-5 rounded-2xl shadow-card animate-fade-in"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <h3 className="font-display text-lg font-semibold mb-4" style={{ color: "var(--olive)" }}>
        Memory Health
      </h3>

      {/* Circular gauge */}
      <div className="flex items-center gap-6">
        <div className="relative w-20 h-20">
          <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
              style={{ stroke: "var(--border)" }} />
            <circle cx="18" cy="18" r="15.9" fill="none" strokeWidth="3"
              strokeDasharray={`${pct} ${100 - pct}`}
              strokeLinecap="round"
              style={{ stroke: color, transition: "stroke-dasharray 0.8s ease" }} />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-lg font-bold font-display" style={{ color }}>{Math.round(pct)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          {[
            { label: "Total",     value: health.total_memories },
            { label: "Healthy",   value: health.healthy },
            { label: "Avg Score", value: health.average_score.toFixed(2) },
            { label: "Low Score", value: health.pruned_eligible },
          ].map(({ label, value }) => (
            <div key={label}>
              <span style={{ color: "var(--muted)" }} className="text-xs">{label}</span>
              <div className="font-semibold" style={{ color: "var(--text)" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      <p className="mt-4 text-xs" style={{ color: "var(--muted)" }}>
        Memories below 0.6 relevance score are auto-pruned every 24 hours.
        Memories older than 90 days are also removed.
      </p>
    </div>
  );
}

// ── MemoryPanel ──────────────────────────────────────────────────
import { useMemory } from "@/hooks/useMemory";

export function MemoryPanel() {
  const { memories, health, loading, deleteMemory } = useMemory();

  return (
    <div className="space-y-3">
      {loading && (
        <div className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>Loading memories…</div>
      )}
      {!loading && memories.length === 0 && (
        <div className="text-sm text-center py-6" style={{ color: "var(--muted)" }}>
          No memories stored yet. Generate replies to build memory context.
        </div>
      )}
      {memories.map((m) => (
        <div key={m.id} className="group p-3 rounded-xl flex items-start gap-3 transition-all hover:shadow-card"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <div className="flex-1 min-w-0">
            <p className="text-sm leading-relaxed" style={{ color: "var(--text)" }}>{m.content}</p>
            <div className="flex gap-3 mt-2 text-xs" style={{ color: "var(--muted)" }}>
              <span>Score: <b>{m.relevance_score.toFixed(2)}</b></span>
              <span>{new Date(m.created_at).toLocaleDateString()}</span>
            </div>
          </div>
          <button onClick={() => deleteMemory(m.id)}
            className="opacity-0 group-hover:opacity-100 text-xs px-2 py-1 rounded-lg transition-all"
            style={{ background: "#fee2e2", color: "#dc2626" }}>
            Delete
          </button>
        </div>
      ))}
    </div>
  );
}
