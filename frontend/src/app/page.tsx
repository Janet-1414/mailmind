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
    <main className="min-h-screen bg-cream">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-10"
          style={{ background: "radial-gradient(circle, #AEB784, transparent 70%)" }} />
      </div>
      <nav className="relative z-10 max-w-5xl mx-auto px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">✉</span>
          <span className="font-serif font-bold text-lg text-olive">MailMind</span>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/login" className="btn-ghost text-sm">Sign in</Link>
          <Link href="/register" className="btn-primary text-sm">Get started</Link>
        </div>
      </nav>
      <section className="relative z-10 max-w-5xl mx-auto px-8 pt-24 pb-28"
        style={{ opacity: mounted ? 1 : 0, transition: "opacity 0.5s ease" }}>
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-sage/40 bg-sage/10 mb-8">
          <span className="w-1.5 h-1.5 rounded-full bg-sage" />
          <span className="text-xs font-sans text-olive/70 tracking-wide">
            Powered by LangGraph · Pinecone · GPT-4o
          </span>
        </div>
        <h1 className="font-serif text-5xl md:text-6xl font-bold text-olive leading-tight mb-5 max-w-2xl">
          Write better emails,{" "}
          <span className="text-olive/50 font-normal italic">effortlessly.</span>
        </h1>
        <p className="font-sans text-base text-olive/60 max-w-lg mb-10 leading-relaxed">
          Paste any email you have received. MailMind reads it, understands the context,
          and drafts a reply that sounds exactly like you — in seconds.
        </p>
        <div className="flex items-center gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-sm">Start for free →</Link>
          <Link href="/login" className="btn-secondary px-6 py-3 text-sm">Sign in</Link>
        </div>
        <div className="flex flex-wrap items-center gap-10 mt-16 pt-8 border-t border-sand-dark">
          {STATS.map((s) => (
            <div key={s.label}>
              <div className="font-serif text-2xl font-bold text-olive">{s.value}</div>
              <div className="font-sans text-xs text-olive/50 mt-0.5 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>
      </section>
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-24">
        <div className="mb-10">
          <h2 className="font-serif text-2xl font-bold text-olive mb-1">Everything you need</h2>
          <p className="font-sans text-sm text-olive/50">Built on production-grade AI infrastructure.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="card group hover:shadow-strong transition-shadow duration-200">
              <div className="text-xl mb-3 text-sage">{f.icon}</div>
              <h3 className="font-sans font-semibold text-olive text-sm mb-1.5">{f.title}</h3>
              <p className="font-sans text-xs text-olive/55 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="relative z-10 max-w-5xl mx-auto px-8 pb-24">
        <div className="bg-olive rounded-2xl px-10 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="font-serif text-2xl font-bold text-cream mb-1">Ready to save time?</h3>
            <p className="font-sans text-sm text-cream/60">Join and let MailMind handle your inbox.</p>
          </div>
          <Link href="/register" className="flex-shrink-0 bg-cream text-olive font-sans font-semibold text-sm px-6 py-3 rounded-xl hover:bg-sand transition-colors">
            Get started for free →
          </Link>
        </div>
      </section>
      <footer className="relative z-10 max-w-5xl mx-auto px-8 py-6 border-t border-sand-dark flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm">✉</span>
          <span className="font-serif font-semibold text-sm text-olive">MailMind</span>
        </div>
        <p className="font-sans text-xs text-olive/40">LangGraph · Pinecone · FastAPI · Next.js</p>
      </footer>
    </main>
  );
}
