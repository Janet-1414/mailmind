/**
 * EmailComposer component for MailMind.
 * The main input area where users paste the email they received and
 * optionally type a reply hint to guide the agent. Renders the submit
 * button with loading state. Styled with Midnight Slate theme variables.
 */
"use client";

interface EmailComposerProps {
  value:        string;
  onChange:     (v: string) => void;
  hint:         string;
  onHintChange: (v: string) => void;
  onSubmit:     () => void;
  loading:      boolean;
}

export default function EmailComposer({
  value, onChange, hint, onHintChange, onSubmit, loading,
}: EmailComposerProps) {
  return (
    <div className="card space-y-4">
      <div>
        <label className="label">Email to reply to</label>
        <textarea
          className="input-field resize-none"
          rows={6}
          placeholder="Paste the email you received here…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
        />
      </div>

      <div>
        <label className="label">
          Reply hint{" "}
          <span className="font-normal" style={{ color: "var(--text-muted)" }}>
            (optional)
          </span>
        </label>
        <input
          type="text"
          className="input-field"
          placeholder='e.g. "decline politely", "ask for more time", "keep it short"'
          value={hint}
          onChange={(e) => onHintChange(e.target.value)}
          disabled={loading}
        />
      </div>

      <button
        onClick={onSubmit}
        disabled={loading || !value.trim()}
        className="btn-primary w-full"
      >
        {loading ? "Generating reply…" : "Generate reply →"}
      </button>
    </div>
  );
}
