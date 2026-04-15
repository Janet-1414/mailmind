/**
 * ModelSelector component for MailMind.
 * Dropdown for selecting the LLM to use for reply generation.
 * Supports GPT-4o, GPT-4o-mini, GPT-3.5-turbo, and Claude 3.5 Haiku
 * with per-model pricing shown as reference.
 */
"use client";

const MODELS = [
  { value: "gpt-4o",           label: "GPT-4o",           price: "$0.005/1K" },
  { value: "gpt-4o-mini",      label: "GPT-4o Mini",      price: "$0.00015/1K" },
  { value: "gpt-3.5-turbo",    label: "GPT-3.5 Turbo",    price: "$0.0005/1K" },
  { value: "claude-3-5-haiku", label: "Claude 3.5 Haiku", price: "$0.00025/1K" },
];

export default function ModelSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="input-field text-sm"
    >
      {MODELS.map((m) => (
        <option key={m.value} value={m.value}>
          {m.label} — {m.price}
        </option>
      ))}
    </select>
  );
}
