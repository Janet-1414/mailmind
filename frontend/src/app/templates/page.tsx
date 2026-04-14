"use client";
// src/app/templates/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import { TemplateCard, TemplateSearch } from "@/components/templates/TemplateCard";
import { useTemplates } from "@/hooks/useTemplates";

export default function TemplatesPage() {
  const { templates, loading, search, setSearch, create, remove } = useTemplates();
  const router = useRouter();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", tone: "", tags: "" });
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.content) return;
    setCreating(true);
    try {
      await create({ title: form.title, content: form.content, tone: form.tone || undefined, tags: form.tags || undefined });
      setForm({ title: "", content: "", tone: "", tags: "" });
      setShowCreate(false);
    } finally { setCreating(false); }
  };

  const handleLoad = (content: string) => {
    if (typeof window !== "undefined") {
      sessionStorage.setItem("preload_email", content);
      router.push("/dashboard");
    }
  };

  return (
    <PageWrapper>
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold" style={{ color: "var(--olive)" }}>Templates</h1>
            <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
              Save and reuse your best replies.
            </p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-90"
            style={{ background: "var(--olive)", color: "#F8F3E1" }}>
            + New Template
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <form onSubmit={handleCreate}
            className="p-5 rounded-2xl space-y-4 animate-slide-up"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
            <h2 className="font-semibold" style={{ color: "var(--text)" }}>New Template</h2>
            {[
              { key: "title", label: "Title", type: "text", placeholder: "e.g. Meeting Follow-up" },
              { key: "tone", label: "Tone (optional)", type: "text", placeholder: "professional" },
              { key: "tags", label: "Tags (optional, comma-separated)", type: "text", placeholder: "follow-up, meeting" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>{label}</label>
                <input type={type} value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg text-sm outline-none"
                  style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text)" }}
                  placeholder={placeholder} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: "var(--muted)" }}>Content</label>
              <textarea rows={5} value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text)" }}
                placeholder="Template content…" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={creating}
                className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                style={{ background: "var(--olive)", color: "#F8F3E1" }}>
                {creating ? "Saving…" : "Save Template"}
              </button>
              <button type="button" onClick={() => setShowCreate(false)}
                className="px-4 py-2 rounded-xl text-sm"
                style={{ background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                Cancel
              </button>
            </div>
          </form>
        )}

        <TemplateSearch value={search} onChange={setSearch} />

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl animate-pulse" style={{ background: "var(--surface)" }} />)}
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-16" style={{ color: "var(--muted)" }}>
            <p className="text-4xl mb-3">📄</p>
            <p className="font-semibold">No templates yet</p>
            <p className="text-sm">Generate a reply and save it as a template.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((t) => (
              <TemplateCard key={t.id} template={t} onLoad={handleLoad} onDelete={remove} />
            ))}
          </div>
        )}
      </div>
    </PageWrapper>
  );
}
