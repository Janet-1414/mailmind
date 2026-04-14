"use client";
// src/components/templates/TemplateCard.tsx
import type { EmailTemplate } from "@/types";

interface Props {
  template: EmailTemplate;
  onLoad: (content: string) => void;
  onDelete: (id: string) => void;
}

export function TemplateCard({ template, onLoad, onDelete }: Props) {
  return (
    <div className="p-4 rounded-2xl shadow-card transition-all hover:shadow-card-hover group"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm" style={{ color: "var(--text)" }}>{template.title}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
          <button onClick={() => onLoad(template.content)}
            className="text-xs px-2 py-0.5 rounded-lg font-medium"
            style={{ background: "var(--olive)", color: "#F8F3E1" }}>
            Use
          </button>
          <button onClick={() => onDelete(template.id)}
            className="text-xs px-2 py-0.5 rounded-lg"
            style={{ background: "#fee2e2", color: "#dc2626" }}>
            ✕
          </button>
        </div>
      </div>

      {template.tone && (
        <span className="inline-block text-xs px-2 py-0.5 rounded-full mb-2 capitalize"
          style={{ background: "#AEB78422", color: "var(--olive)" }}>
          {template.tone}
        </span>
      )}

      <p className="text-xs line-clamp-3 leading-relaxed" style={{ color: "var(--muted)" }}>
        {template.content}
      </p>

      {template.tags && (
        <div className="flex flex-wrap gap-1 mt-3">
          {template.tags.split(",").map((tag) => (
            <span key={tag.trim()} className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              {tag.trim()}
            </span>
          ))}
        </div>
      )}

      <p className="text-xs mt-3" style={{ color: "var(--muted)" }}>
        {new Date(template.created_at).toLocaleDateString()}
      </p>
    </div>
  );
}

// ── TemplateSearch ────────────────────────────────────────────────
interface SearchProps { value: string; onChange: (v: string) => void; }

export function TemplateSearch({ value, onChange }: SearchProps) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: "var(--muted)" }}>🔍</span>
      <input
        type="text" value={value} onChange={(e) => onChange(e.target.value)}
        placeholder="Search templates…"
        className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm outline-none"
        style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text)" }}
      />
    </div>
  );
}
