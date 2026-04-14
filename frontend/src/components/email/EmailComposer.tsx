"use client";
// src/components/email/EmailComposer.tsx
import { useState } from "react";
import { ModelSelector, ToneSelector } from "@/components/agent/AgentControls";
import { StreamingReply, ReplyOutput } from "@/components/email/ReplyOutput";
import { useEmailAgent } from "@/hooks/useEmailAgent";
import { threadService } from "@/services/AllServices";
import type { ReplyRequest, Model, Tone } from "@/types";

interface Props {
  initialContent?: string;
  threadId?: string;
  onSaveTemplate: (content: string) => void;
  onSendEmail?: (content: string) => void;
  onReplyGenerated?: (threadId?: string) => void;
}

export default function EmailComposer({
  initialContent = "",
  threadId,
  onSaveTemplate,
  onSendEmail,
  onReplyGenerated,
}: Props) {
  const [emailContent, setEmailContent] = useState(initialContent);
  const [useStream, setUseStream] = useState(true);
  const [feedbackText, setFeedbackText] = useState("");
  const [thumbs, setThumbs] = useState<"up" | "down" | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [currentThreadId, setCurrentThreadId] = useState<string | undefined>(threadId);
  const [settings, setSettings] = useState<Pick<ReplyRequest, "model" | "tone" | "web_search_enabled" | "hint">>({
    model: "gpt-4o-mini",
    tone: "professional",
    web_search_enabled: false,
    hint: "",
  });

  const { reply, streaming, loading, error, response, generate, stream, reset } = useEmailAgent();

  const handleSubmit = async (extraHint?: string) => {
    if (!emailContent.trim()) return;
    reset();
    setThumbs(null);
    setFeedbackText("");
    setFeedbackSubmitted(false);

    // Auto-create thread if none exists, named from first words of email
    let activeThreadId = currentThreadId;
    if (!activeThreadId) {
      try {
        const words = emailContent.trim().split(/\s+/).slice(0, 6).join(" ");
        const title = words.length > 3 ? words : "New Thread";
        const newThread = await threadService.create(title);
        activeThreadId = newThread.id;
        setCurrentThreadId(newThread.id);
      } catch { /* silent */ }
    }

    const req: ReplyRequest = {
      email_content: emailContent,
      thread_id: activeThreadId,
      ...settings,
      hint: extraHint || settings.hint || "",
    };

    if (useStream) await stream(req);
    else await generate(req);

    onReplyGenerated?.(activeThreadId);
  };

  const handleFeedbackRegenerate = () => {
    if (!feedbackText.trim()) return;
    setFeedbackSubmitted(true);
    handleSubmit(
      `Previous reply was ${thumbs === "down" ? "not good" : "good but"} — ${feedbackText}. Please improve accordingly.`
    );
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Email input + Settings */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-3">
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text)" }}>
            Email to reply to
          </label>
          <textarea
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            maxLength={10000}
            rows={10}
            className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none leading-relaxed"
            style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--text)" }}
            placeholder="Paste the email you want to reply to here..."
          />
          <div className="flex justify-between mt-1 text-xs" style={{ color: "var(--muted)" }}>
            <span>{emailContent.length} / 10,000</span>
            {emailContent && (
              <button onClick={() => setEmailContent("")} className="hover:underline">Clear</button>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4 p-4 rounded-xl h-fit"
          style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <ModelSelector
            value={settings.model as Model}
            onChange={(m) => setSettings((p) => ({ ...p, model: m }))}
          />
          <ToneSelector
            value={settings.tone as Tone}
            onChange={(t) => setSettings((p) => ({ ...p, tone: t }))}
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.web_search_enabled}
              onChange={(e) => setSettings((p) => ({ ...p, web_search_enabled: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm" style={{ color: "var(--text)" }}>Enable web search</span>
          </label>
        </div>
      </div>

      {/* Hint box */}
      <div className="rounded-xl p-4 space-y-2"
        style={{ background: "var(--surface)", border: "2px solid var(--sage)" }}>
        <label className="block text-sm font-semibold" style={{ color: "var(--olive)" }}>
          Reply Hint{" "}
          <span className="font-normal text-xs ml-1" style={{ color: "var(--muted)" }}>
            (optional - guide the AI)
          </span>
        </label>
        <input
          type="text"
          value={settings.hint || ""}
          maxLength={500}
          onChange={(e) => setSettings((p) => ({ ...p, hint: e.target.value }))}
          className="w-full px-4 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text)" }}
          placeholder="e.g. Keep it under 100 words, mention the deadline, reply in Spanish"
        />
      </div>

      {/* Stream toggle + Generate button */}
      <div className="flex flex-col gap-3">
        <label className="flex items-center gap-2 cursor-pointer w-fit">
          <div
            onClick={() => setUseStream(!useStream)}
            className="w-10 h-5 rounded-full relative transition-all cursor-pointer"
            style={{ background: useStream ? "var(--sage)" : "var(--border)" }}
          >
            <div
              className="w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
              style={{ left: useStream ? "22px" : "2px" }}
            />
          </div>
          <span className="text-sm" style={{ color: "var(--text)" }}>
            {useStream ? "Streaming mode" : "Standard mode"}
          </span>
        </label>

        <button
          onClick={() => handleSubmit()}
          disabled={loading || streaming || !emailContent.trim()}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "var(--olive)", color: "#F8F3E1" }}
        >
          {(loading || streaming) ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {streaming ? "Streaming reply..." : "Generating..."}
            </>
          ) : "Generate Reply"}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="p-3 rounded-lg text-sm" style={{ background: "#fee2e2", color: "#991b1b" }}>
          {error}
        </div>
      )}

      {/* Streaming output */}
      {(streaming || (reply && !response)) && (
        <StreamingReply text={reply} isStreaming={streaming} />
      )}

      {/* Full response output */}
      {response && (
        <div className="space-y-4">
          <ReplyOutput
            response={response}
            onSaveTemplate={onSaveTemplate}
            onSendEmail={onSendEmail}
          />

          {/* Feedback */}
          {!feedbackSubmitted && (
            <div className="rounded-xl p-4 space-y-3"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--muted)" }}>
                Was this reply helpful?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setThumbs("up")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: thumbs === "up" ? "#d1fae5" : "var(--bg)",
                    color: thumbs === "up" ? "#065f46" : "var(--muted)",
                    border: "1.5px solid " + (thumbs === "up" ? "#10b981" : "var(--border)"),
                  }}
                >
                  👍 Yes
                </button>
                <button
                  onClick={() => setThumbs("down")}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all"
                  style={{
                    background: thumbs === "down" ? "#fee2e2" : "var(--bg)",
                    color: thumbs === "down" ? "#991b1b" : "var(--muted)",
                    border: "1.5px solid " + (thumbs === "down" ? "#ef4444" : "var(--border)"),
                  }}
                >
                  👎 No
                </button>
              </div>

              {thumbs !== null && (
                <div className="space-y-2">
                  <label className="block text-xs font-medium" style={{ color: "var(--muted)" }}>
                    {thumbs === "down"
                      ? "What should be improved? AI will regenerate."
                      : "Any extra instructions? AI will refine."}
                  </label>
                  <textarea
                    rows={3}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={thumbs === "down" ? "e.g. Too formal, make it shorter..." : "e.g. Add a call to action..."}
                    className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
                    style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text)" }}
                  />
                  <button
                    onClick={handleFeedbackRegenerate}
                    disabled={!feedbackText.trim() || loading || streaming}
                    className="w-full py-2.5 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
                    style={{ background: "var(--sage)", color: "#fff" }}
                  >
                    {loading || streaming ? "Regenerating..." : "Regenerate with Feedback"}
                  </button>
                </div>
              )}
            </div>
          )}

          {feedbackSubmitted && (
            <div className="p-3 rounded-xl text-sm text-center"
              style={{ background: "#d1fae5", color: "#065f46" }}>
              Regenerating reply with your feedback...
            </div>
          )}
        </div>
      )}
    </div>
  );
}