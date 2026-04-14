"use client";
// src/components/agent/ModelSelector.tsx
import type { Model } from "@/types";

const MODELS: { value: Model; label: string; provider: string }[] = [
  { value: "gpt-4o",                       label: "GPT-4o",            provider: "OpenAI" },
  { value: "gpt-4o-mini",                  label: "GPT-4o Mini",       provider: "OpenAI" },
  { value: "gpt-4-turbo",                  label: "GPT-4 Turbo",       provider: "OpenAI" },
  { value: "claude-3-5-sonnet-20241022",   label: "Claude 3.5 Sonnet", provider: "Anthropic" },
  { value: "claude-3-haiku-20240307",      label: "Claude 3 Haiku",    provider: "Anthropic" },
];

interface Props { value: Model; onChange: (m: Model) => void; }

export function ModelSelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Model</label>
      <select value={value} onChange={(e) => onChange(e.target.value as Model)}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none"
        style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text)" }}>
        {MODELS.map((m) => (
          <option key={m.value} value={m.value}>{m.provider} — {m.label}</option>
        ))}
      </select>
    </div>
  );
}

// ── ToneSelector ─────────────────────────────────────────────────
import type { Tone } from "@/types";

const TONES: Tone[] = ["professional", "friendly", "formal", "casual", "empathetic", "assertive", "concise"];

interface ToneProps { value: Tone; onChange: (t: Tone) => void; }

export function ToneSelector({ value, onChange }: ToneProps) {
  return (
    <div>
      <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Tone</label>
      <div className="flex flex-wrap gap-1.5">
        {TONES.map((t) => (
          <button key={t} onClick={() => onChange(t)}
            className="px-3 py-1 rounded-full text-xs font-medium capitalize transition-all"
            style={{
              background: value === t ? "var(--olive)" : "var(--bg)",
              color: value === t ? "#F8F3E1" : "var(--muted)",
              border: `1.5px solid ${value === t ? "var(--olive)" : "var(--border)"}`,
            }}>
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

// ── TokenUsageBar ─────────────────────────────────────────────────
interface TokenProps { used: number; model: string; }

const MODEL_LIMITS: Record<string, number> = {
  "gpt-4o": 128000, "gpt-4o-mini": 128000, "gpt-4-turbo": 128000,
  "claude-3-5-sonnet-20241022": 200000, "claude-3-haiku-20240307": 200000,
};

export function TokenUsageBar({ used, model }: TokenProps) {
  const limit = MODEL_LIMITS[model] || 8192;
  const pct = Math.min(100, (used / limit) * 100);

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
        <span>Tokens used</span>
        <span>{used.toLocaleString()} / {limit.toLocaleString()}</span>
      </div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
        <div className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: pct > 80 ? "#ef4444" : "var(--sage)" }} />
      </div>
    </div>
  );
}

// ── SettingsPanel ─────────────────────────────────────────────────
import type { ReplyRequest } from "@/types";

interface SettingsProps {
  settings: Pick<ReplyRequest, "model" | "tone" | "web_search_enabled" | "hint">;
  onChange: (s: Partial<ReplyRequest>) => void;
}

export function SettingsPanel({ settings, onChange }: SettingsProps) {
  return (
    <div className="space-y-4 p-4 rounded-xl" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
      <ModelSelector value={settings.model as Model} onChange={(m) => onChange({ model: m })} />
      <ToneSelector  value={settings.tone as Tone}   onChange={(t) => onChange({ tone: t })} />

      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--muted)" }}>Hint (optional)</label>
        <input
          type="text" value={settings.hint || ""} maxLength={500}
          onChange={(e) => onChange({ hint: e.target.value })}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text)" }}
          placeholder="e.g. Keep it under 100 words, mention the deadline"
        />
      </div>

      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={settings.web_search_enabled}
          onChange={(e) => onChange({ web_search_enabled: e.target.checked })}
          className="rounded" />
        <span className="text-sm" style={{ color: "var(--text)" }}>Enable web search</span>
      </label>
    </div>
  );
}
