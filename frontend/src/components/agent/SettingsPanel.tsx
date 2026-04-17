/**
 * SettingsPanel component for MailMind.
 * Collects agent configuration — LLM model, tone, temperature, top-p,
 * frequency penalty, and web search toggle. Passes settings up via onChange.
 * Sliders use explicit CSS to show track in both light and dark mode.
 */
"use client";
import ToneSelector  from "@/components/agent/ToneSelector";
import ModelSelector from "@/components/agent/ModelSelector";
import type { AgentSettings } from "@/types";

interface SettingsPanelProps {
  settings: AgentSettings;
  onChange: (s: AgentSettings) => void;
}

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="label mb-0">{label}</label>
        <span className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>
          {value.toFixed(2)}
        </span>
      </div>
      <div className="relative h-5 flex items-center">
        {/* Track background */}
        <div
          className="absolute w-full h-1.5 rounded-full"
          style={{ backgroundColor: "var(--border-dark)" }}
        />
        {/* Filled portion */}
        <div
          className="absolute h-1.5 rounded-full"
          style={{
            width: `${pct}%`,
            backgroundColor: "var(--accent)",
          }}
        />
        {/* Native input on top for interaction */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="absolute w-full h-1.5 cursor-pointer appearance-none bg-transparent"
          style={{
            // Make the native thumb visible, hide native track
            accentColor: "var(--accent)",
          }}
        />
      </div>
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid var(--surface);
          box-shadow: 0 0 0 1px var(--accent);
        }
        input[type=range]::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--accent);
          cursor: pointer;
          border: 2px solid var(--surface);
        }
        input[type=range]::-webkit-slider-runnable-track {
          background: transparent;
        }
        input[type=range]::-moz-range-track {
          background: transparent;
        }
      `}</style>
    </div>
  );
}

export default function SettingsPanel({ settings, onChange }: SettingsPanelProps) {
  const set = (patch: Partial<AgentSettings>) => onChange({ ...settings, ...patch });

  return (
    <div className="card space-y-5">
      <h2 className="font-serif font-semibold" style={{ color: "var(--primary)" }}>
        Agent Settings
      </h2>

      <div>
        <label className="label">Model</label>
        <ModelSelector value={settings.model} onChange={(v) => set({ model: v })} />
      </div>

      <div>
        <label className="label">Tone</label>
        <ToneSelector value={settings.tone} onChange={(v) => set({ tone: v })} />
      </div>

      <Slider
        label="Temperature"
        value={settings.temperature}
        min={0} max={2} step={0.05}
        onChange={(v) => set({ temperature: v })}
      />
      <Slider
        label="Top-P"
        value={settings.top_p}
        min={0} max={1} step={0.05}
        onChange={(v) => set({ top_p: v })}
      />
      <Slider
        label="Frequency Penalty"
        value={settings.frequency_penalty}
        min={-2} max={2} step={0.1}
        onChange={(v) => set({ frequency_penalty: v })}
      />

      <div className="flex items-center justify-between">
        <div>
          <p className="font-sans text-sm font-medium" style={{ color: "var(--text)" }}>
            Web search
          </p>
          <p className="font-sans text-xs" style={{ color: "var(--text-muted)" }}>
            Search the web for current info
          </p>
        </div>
        <button
          onClick={() => set({ webSearchEnabled: !settings.webSearchEnabled })}
          className="relative w-11 h-6 rounded-full transition-colors duration-200 flex-shrink-0"
          style={{
            backgroundColor: settings.webSearchEnabled ? "var(--accent)" : "var(--border-dark)",
          }}
        >
          <span
            className="absolute top-0.5 w-5 h-5 rounded-full transition-transform duration-200"
            style={{
              backgroundColor: "#fff",
              transform: settings.webSearchEnabled ? "translateX(20px)" : "translateX(2px)",
            }}
          />
        </button>
      </div>
    </div>
  );
}
