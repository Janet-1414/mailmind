/**
 * MailMind landing page.
 * Public-facing marketing page with hero section, feature cards,
 * stats row, CTA banner, and footer using Midnight Slate theme.
 * Supports light and dark mode via CSS variables.
 */
"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

const FEATURES = [
  { icon: "✦", title: "Context-Aware Replies",  desc: "Understands intent, tone, and urgency before drafting." },
  { icon: "◈", title: "Long-Term Memory",        desc: "Learns from your past emails and gets better over time." },
  { icon: "⟁", title: "Tone Control",            desc: "Formal, friendly, or concise — you decide." },
  { icon: "⬡", title: "RAG-Powered",             desc: "Retrieves relevant context from your email history." },
];

const STATS = [
  { label: "Avg. time saved", value: "4 min" },
  { label: "Reply quality",   value: "94%"   },
  { label: "Tones available", value: "3"     },
  { label: "LLMs supported",  value: "4+"    },
];

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <main className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      {/* Subtle background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-0 right-0 w-96 h-96 rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #3B82F6, transparent 70%)" }}
        />
      </div>

      {/* Navbar */}
      <nav
        className="relative z-10 max-w-5xl mx-auto px-8 py-6 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">✉</span>
          <span className="font-serif font-bold text-lg" style={{ color: "var(--primary)" }}>
            MailMind
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login"    className="btn-ghost text-sm">Sign in</Link>
          <Link href="/register" className="btn-primary text-sm">Get started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-28"
        style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}
      >
        <div
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border mb-8"
          style={{ borderColor: "var(--accent)", backgroundColor: `var(--accent)20` }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "var(--accent)" }} />
          <span className="text-xs font-sans" style={{ color: "var(--primary)" }}>
            Powered by LangGraph · Pinecone · GPT-4o
          </span>
        </div>

        <h1 className="font-serif text-5xl md:text-6xl font-bold leading-tight mb-5 max-w-2xl" style={{ color: "var(--primary)" }}>
          Write better emails,{" "}
          <span className="font-normal italic" style={{ color: "var(--text-muted)" }}>effortlessly.</span>
        </h1>

        <p className="font-sans text-base max-w-lg mb-10 leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Paste any email you received. MailMind reads it, understands the context,
          and drafts a reply that sounds exactly like you — in seconds.
        </p>

        <div className="flex items-center gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-sm">Start for free →</Link>
          <Link href="/login"    className="btn-secondary px-6 py-3 text-sm">Sign in</Link>
        </div>

        <div
          className="flex flex-wrap items-center gap-10 mt-16 pt-8"
          style={{ borderTop: "1px solid var(--border)" }}
        >
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-serif text-2xl font-bold" style={{ color: "var(--primary)" }}>{s.value}</div>
              <div className="font-sans text-xs mt-0.5 uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-24">
        <div className="mb-10">
          <h2 className="font-serif text-2xl font-bold mb-1" style={{ color: "var(--primary)" }}>Everything you need</h2>
          <p className="font-sans text-sm" style={{ color: "var(--text-muted)" }}>Built on production-grade AI infrastructure.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card group">
              <div className="text-xl mb-3" style={{ color: "var(--accent)" }}>{f.icon}</div>
              <h3 className="font-sans font-semibold text-sm mb-1.5" style={{ color: "var(--primary)" }}>{f.title}</h3>
              <p className="font-sans text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-24">
        <div
          className="rounded-2xl px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-6"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <div>
            <h3 className="font-serif text-2xl font-bold text-white mb-1">Ready to save time?</h3>
            <p className="font-sans text-sm text-white/60">Join and let MailMind handle your inbox.</p>
          </div>
          <Link
            href="/register"
            className="flex-shrink-0 font-sans font-semibold text-sm px-6 py-3 rounded-xl transition-colors"
            style={{ backgroundColor: "var(--surface)", color: "var(--primary)" }}
          >
            Get started for free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="relative z-10 max-w-5xl mx-auto px-8 py-6 flex items-center justify-between"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-sm">✉</span>
          <span className="font-serif font-semibold text-sm" style={{ color: "var(--primary)" }}>MailMind</span>
        </div>
        <p className="font-sans text-xs" style={{ color: "var(--text-muted)" }}>
          LangGraph · Pinecone · FastAPI · Next.js
        </p>
      </footer>
    </main>
  );
}
