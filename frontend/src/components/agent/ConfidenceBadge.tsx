"use client";
// src/components/agent/ConfidenceBadge.tsx

interface Props {
  score: number;
  breakdown?: { context_match: number; tone_consistency: number; hint_compliance: number };
}

function getColor(score: number): { bg: string; text: string; label: string } {
  if (score >= 80) return { bg: "#d1fae5", text: "#065f46", label: "High confidence" };
  if (score >= 60) return { bg: "#fef3c7", text: "#92400e", label: "Moderate confidence" };
  return { bg: "#fee2e2", text: "#991b1b", label: "Low confidence — review carefully" };
}

export default function ConfidenceBadge({ score, breakdown }: Props) {
  const { bg, text, label } = getColor(score);

  return (
    <div className="rounded-xl p-4 animate-fade-in" style={{ background: bg }}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold" style={{ color: text }}>{label}</span>
        <span className="text-2xl font-bold font-display" style={{ color: text }}>{score}</span>
      </div>

      {/* Score bar */}
      <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: `${text}22` }}>
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${score}%`, background: text }} />
      </div>

      {/* Breakdown */}
      {breakdown && (
        <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: text }}>
          {[
            { label: "Context", value: breakdown.context_match, max: 40 },
            { label: "Tone", value: breakdown.tone_consistency, max: 30 },
            { label: "Hint", value: breakdown.hint_compliance, max: 30 },
          ].map(({ label: l, value, max }) => (
            <div key={l} className="text-center">
              <div className="font-bold">{value}/{max}</div>
              <div className="opacity-75">{l}</div>
            </div>
          ))}
        </div>
      )}

      {score < 60 && (
        <p className="mt-2 text-xs font-medium" style={{ color: text }}>
          ⚠ Consider reviewing and editing this reply before sending.
        </p>
      )}
    </div>
  );
}
