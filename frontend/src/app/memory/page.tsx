"use client";
import PageWrapper from "@/components/layout/PageWrapper";
import { MemoryPanel, MemoryHealthScore } from "@/components/memory/MemoryPanel";
import { useMemory } from "@/hooks/useMemory";

export default function MemoryPage() {
  const { health, loading } = useMemory();

  return (
    <PageWrapper>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1
            className="font-display text-3xl font-bold"
            style={{ color: "var(--olive)" }}
          >
            Memory
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            MailMind learns from your conversations. Memories are auto-pruned every 24 hours.
          </p>
        </div>

        {loading && (
          <div
            className="h-32 rounded-2xl animate-pulse"
            style={{ background: "var(--surface)" }}
          />
        )}

        {health && !loading && <MemoryHealthScore health={health} />}

        <div>
          <h2
            className="text-base font-semibold mb-4"
            style={{ color: "var(--text)" }}
          >
            Stored Memories
          </h2>
          <MemoryPanel />
        </div>
      </div>
    </PageWrapper>
  );
}