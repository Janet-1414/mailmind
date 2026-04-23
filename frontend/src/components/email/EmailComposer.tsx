/**
 * EmailComposer component for MailMind.
 * The main input area where users paste the email they received and
 * optionally type a reply hint to guide the agent. Shows character
 * counts and validation warnings for both fields before submission.
 */
"use client";

const MAX_EMAIL_LENGTH = 10000;
const MAX_HINT_LENGTH  = 500;

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
  const emailTooLong = value.length > MAX_EMAIL_LENGTH;
  const hintTooLong  = hint.length > MAX_HINT_LENGTH;
  const canSubmit    = !loading && value.trim() && !emailTooLong && !hintTooLong;

  return (
    <div className="card space-y-4">
      {/* Email field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0">Email to reply to</label>
          <span
            className="font-mono text-xs"
            style={{ color: emailTooLong ? "#ef4444" : "var(--text-muted)" }}
          >
            {value.length.toLocaleString()} / {MAX_EMAIL_LENGTH.toLocaleString()}
          </span>
        </div>
        <textarea
          className="input-field resize-none"
          rows={6}
          placeholder="Paste the email you received here…"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={loading}
          style={emailTooLong ? { borderColor: "#ef4444" } : {}}
        />
        {emailTooLong && (
          <p className="font-sans text-xs mt-1" style={{ color: "#ef4444" }}>
            ⚠ Email is too long. Please trim it to under {MAX_EMAIL_LENGTH.toLocaleString()} characters.
          </p>
        )}
      </div>

      {/* Hint field */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0">
            Reply hint{" "}
            <span className="font-normal" style={{ color: "var(--text-muted)" }}>
              (optional)
            </span>
          </label>
          <span
            className="font-mono text-xs"
            style={{ color: hintTooLong ? "#ef4444" : "var(--text-muted)" }}
          >
            {hint.length} / {MAX_HINT_LENGTH}
          </span>
        </div>
        <input
          type="text"
          className="input-field"
          placeholder='e.g. "decline politely", "ask for more time", "keep it short"'
          value={hint}
          onChange={(e) => onHintChange(e.target.value)}
          disabled={loading}
          style={hintTooLong ? { borderColor: "#ef4444" } : {}}
        />
        {hintTooLong && (
          <p className="font-sans text-xs mt-1" style={{ color: "#ef4444" }}>
            ⚠ Hint is too long. Keep it under {MAX_HINT_LENGTH} characters — it should be a short instruction, not the full email.
          </p>
        )}
      </div>

      <button
        onClick={onSubmit}
        disabled={!canSubmit}
        className="btn-primary w-full"
      >
        {loading ? "Generating reply…" : "Generate reply →"}
      </button>
    </div>
  );
}
