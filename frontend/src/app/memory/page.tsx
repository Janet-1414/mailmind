/**
 * MailMind memory page.
 * Displays all long-term Pinecone memories stored for the current user
 * with explanatory cards describing how memory improves replies over time.
 * Allows deleting individual memories, clearing all, and manual pruning.
 */
"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useMemory } from "@/hooks/useMemory";
import Navbar from "@/components/layout/Navbar";
import PageWrapper from "@/components/layout/PageWrapper";

export default function MemoryPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { items, loading, clearing, deleteItem, clearAll } = useMemory();

  useEffect(() => {
    if (!authLoading && !user && typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) router.push("/login");
    }
  }, [authLoading, user, router]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />
      <PageWrapper>
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl" style={{ color: "var(--accent)" }}>◈</span>
            <h1 className="font-serif text-3xl font-bold" style={{ color: "var(--primary)" }}>Your Memory</h1>
          </div>
          <p className="font-sans max-w-2xl leading-relaxed" style={{ color: "var(--text-muted)" }}>
            Every time MailMind generates a reply, it quietly saves a summary of what happened.
            Over time, it uses these memories to write replies that sound more like{" "}
            <em>you</em> — without you having to repeat yourself.
          </p>
        </div>

        {/* How it works */}
        <div className="rounded-2xl p-6 mb-8" style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}>
          <h2 className="font-serif font-semibold mb-4" style={{ color: "var(--primary)" }}>How it helps you</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { icon: "🧠", title: "Learns your style",    desc: "Remembers whether you prefer formal or friendly replies." },
              { icon: "📬", title: "Knows your context",   desc: "Pulls from past similar emails to give you a smarter starting point." },
              { icon: "⏱",  title: "Saves you time",       desc: "The more you use MailMind, the less you need to explain." },
            ].map((card) => (
              <div
                key={card.title}
                className="rounded-xl p-4"
                style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
              >
                <span className="text-2xl block mb-2">{card.icon}</span>
                <h3 className="font-sans font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>{card.title}</h3>
                <p className="font-sans text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{card.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Memory list */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-serif font-semibold" style={{ color: "var(--primary)" }}>Stored memories</h2>
              <p className="font-sans text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                {loading ? "Loading…" : `${items.length} memory${items.length !== 1 ? "s" : ""} saved`}
              </p>
            </div>
            {items.length > 0 && (
              <button onClick={clearAll} disabled={clearing} className="btn-ghost text-xs" style={{ color: "#ef4444" }}>
                {clearing ? "Clearing…" : "Clear all memories"}
              </button>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-16 rounded-xl animate-pulse" style={{ backgroundColor: "var(--border)", opacity: 1 - i * 0.15 }} />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-16 font-sans" style={{ color: "var(--text-muted)" }}>
              <span className="text-4xl block mb-3">◈</span>
              <p className="text-sm font-medium">No memories yet</p>
              <p className="text-xs mt-1" style={{ color: "var(--border-dark)" }}>
                Start generating replies on the dashboard and memories will appear here automatically.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start justify-between gap-4 rounded-xl px-5 py-4 group transition-colors"
                  style={{ backgroundColor: "var(--bg)", border: "1px solid var(--border)" }}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-sans text-sm leading-relaxed" style={{ color: "var(--text)" }}>{item.content}</p>
                    <p className="font-mono text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                      Saved {new Date(item.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteItem(item.id)}
                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 text-xl leading-none mt-1 transition-all hover:text-red-400"
                    style={{ color: "var(--text-muted)" }}
                    title="Delete this memory"
                  >×</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </PageWrapper>
    </div>
  );
}
