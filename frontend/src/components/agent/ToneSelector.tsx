/**
 * ToneSelector component for MailMind.
 * Toggle button group for selecting the reply tone — formal, friendly,
 * or concise. Styled with Midnight Slate theme variables.
 */
"use client";

const TONES = ["formal", "friendly", "concise"];

export default function ToneSelector({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex gap-2 flex-wrap">
      {TONES.map((t) => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className="px-3 py-1.5 rounded-lg text-sm font-sans font-medium capitalize transition-all duration-150"
          style={{
            backgroundColor: value === t ? "var(--accent)" : "var(--border)",
            color:            value === t ? "#ffffff" : "var(--text-muted)",
            border:           `1px solid ${value === t ? "var(--accent)" : "var(--border-dark)"}`,
          }}
        >
          {t}
        </button>
      ))}
    </div>
  );
}
