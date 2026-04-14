"use client";
// src/components/threads/ThreadChatView.tsx
import { useState } from "react";
import type { Thread, EmailLog } from "@/types";
import { useEmailAgent } from "@/hooks/useEmailAgent";
import { StreamingReply, ReplyOutput } from "@/components/email/ReplyOutput";
import type { ReplyRequest, Model, Tone } from "@/types";

interface Props {
  thread: Thread;
  onSaveTemplate: (content: string) => void;
  onReplyGenerated?: (threadId?: string) => void;
}

function EmailExchange({ log }: { log: EmailLog }) {
  const time = new Date(log.created_at).toLocaleString([], {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="animate-fade-in">
      <p className="text-xs text-center mb-3" style={{ color: "var(--muted)" }}>{time}</p>
      <div className="grid grid-cols-2 gap-4">

        {/* Left: Incoming */}
        <div className="flex flex-col">
          <p className="text-xs font-medium mb-1.5 flex items-center gap-1" style={{ color: "var(--muted)" }}>
            📨 Incoming Email
          </p>
          <div className="flex-1 p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}>
            {log.email_content}
          </div>
        </div>

        {/* Right: AI Reply */}
        <div className="flex flex-col">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-medium flex items-center gap-1" style={{ color: "var(--sage)" }}>
              ✦ AI Reply
            </p>
            <div className="flex items-center gap-2">
              {log.confidence_score > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full"
                  style={{ background: "#d1fae5", color: "#065f46" }}>
                  {log.confidence_score}%
                </span>
              )}
              {log.tokens_used > 0 && (
                <span className="text-xs" style={{ color: "var(--muted)" }}>
                  {log.tokens_used.toLocaleString()}t
                </span>
              )}
            </div>
          </div>
          <div className="flex-1 p-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
            style={{ background: "var(--surface)", border: "1px solid var(--sage)", color: "var(--text)" }}>
            {log.reply}
          </div>
        </div>
      </div>
      <div className="mt-4" style={{ borderBottom: "1px dashed var(--border)" }} />
    </div>
  );
}

export default function ThreadChatView({ thread, onSaveTemplate, onReplyGenerated }: Props) {
  const [newEmail, setNewEmail] = useState("");
  const [hint, setHint] = useState("");
  const [tone, setTone] = useState<Tone>("professional");
  const [model, setModel] = useState<Model>("gpt-4o-mini");
  const [useStream, setUseStream] = useState(true);
  const [thumbs, setThumbs] = useState<"up" | "down" | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const { reply, streaming, loading, error, response, generate, stream, reset } = useEmailAgent();

  const handleGenerate = async (extraHint?: string) => {
    if (!newEmail.trim()) return;
    reset();
    setThumbs(null);
    setFeedbackText("");
    setFeedbackSubmitted(false);
    const req: ReplyRequest = {
      email_content: newEmail,
      thread_id: thread.id,
      tone,
      model,
      hint: extraHint || hint || "",
      web_search_enabled: false,
    };
    if (useStream) await stream(req);
    else await generate(req);
    onReplyGenerated?.(thread.id);
  };

  const handleFeedbackRegenerate = () => {
    if (!feedbackText.trim()) return;
    setFeedbackSubmitted(true);
    handleGenerate(
      `Previous reply was ${thumbs === "down" ? "not good" : "good but"} — ${feedbackText}. Please improve accordingly.`
    );
  };

  return (
    <div className="flex flex-col gap-6">

      {/* Conversation history */}
      {thread.email_logs && thread.email_logs.length > 0 ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold" style={{ color: "var(--olive)" }}>
              {thread.title}
            </h2>
            <span className="text-xs px-2 py-1 rounded-full"
              style={{ background: "var(--surface)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              {thread.email_logs.length} exchange{thread.email_logs.length !== 1 ? "s" : ""}
            </span>
          </div>
          {thread.email_logs.map((log) => (
            <EmailExchange key={log.id} log={log} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 gap-2">
          <span className="text-3xl">📭</span>
          <p className="text-sm" style={{ color: "var(--muted)" }}>
            No messages yet — paste an email below to start
          </p>
        </div>
      )}

      {/* New incoming email input */}
      <div className="rounded-2xl p-5 space-y-4"
        style={{ background: "var(--surface)", border: "2px solid var(--border)" }}>
        <p className="text-sm font-semibold" style={{ color: "var(--olive)" }}>
          📨 Continue this thread — paste next incoming email
        </p>

        <textarea
          value={newEmail}
          onChange={(e) => setNewEmail(e.target.value)}
          maxLength={10000}
          rows={6}
          className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none leading-relaxed"
          style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text)" }}
          placeholder="Paste the new incoming email here..."
        />
        <div className="flex justify-between text-xs" style={{ color: "var(--muted)" }}>
          <span>{newEmail.length} / 10,000</span>
          {newEmail && (
            <button onClick={() => setNewEmail("")} className="hover:underline">Clear</button>
          )}
        </div>

        {/* Hint */}
        <div className="rounded-xl p-3 space-y-2"
          style={{ background: "var(--bg)", border: "1.5px solid var(--sage)" }}>
          <label className="block text-xs font-semibold" style={{ color: "var(--olive)" }}>
            Reply Hint{" "}
            <span className="font-normal" style={{ color: "var(--muted)" }}>(optional)</span>
          </label>
          <input
            type="text"
            value={hint}
            maxLength={500}
            onChange={(e) => setHint(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--text)" }}
            placeholder="e.g. Keep it short, reply in French..."
          />
        </div>

        {/* Tone + Model + Stream toggle */}
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-xs" style={{ color: "var(--muted)" }}>Tone:</span>
          {(["professional", "friendly", "formal", "casual", "concise"] as Tone[]).map((t) => (
            <button key={t} onClick={() => setTone(t)}
              className="px-2.5 py-1 rounded-full text-xs font-medium capitalize transition-all"
              style={{
                background: tone === t ? "var(--olive)" : "var(--bg)",
                color: tone === t ? "#F8F3E1" : "var(--muted)",
                border: "1px solid " + (tone === t ? "var(--olive)" : "var(--border)"),
              }}>
              {t}
            </button>
          ))}
          <span className="ml-4 text-xs" style={{ color: "var(--muted)" }}>Model:</span>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value as Model)}
            className="px-2 py-1 rounded-lg text-xs outline-none"
            style={{ background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)" }}
          >
            <option value="gpt-4o-mini">GPT-4o Mini</option>
            <option value="gpt-4o">GPT-4o</option>
            <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
            <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
          </select>

          <div className="ml-auto flex items-center gap-2">
            <div
              onClick={() => setUseStream(!useStream)}
              className="w-8 h-4 rounded-full relative cursor-pointer transition-all"
              style={{ background: useStream ? "var(--sage)" : "var(--border)" }}
            >
              <div className="w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                style={{ left: useStream ? "17px" : "2px" }} />
            </div>
            <span className="text-xs" style={{ color: "var(--muted)" }}>
              {useStream ? "Stream" : "Standard"}
            </span>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={() => handleGenerate()}
          disabled={loading || streaming || !newEmail.trim()}
          className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          style={{ background: "var(--olive)", color: "#F8F3E1" }}
        >
          {(loading || streaming) ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {streaming ? "Streaming..." : "Generating..."}
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

      {/* Full response + feedback */}
      {response && (
        <div className="space-y-4">
          <ReplyOutput response={response} onSaveTemplate={onSaveTemplate} />

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
                    rows={2}
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder={
                      thumbs === "down"
                        ? "e.g. Too formal, make it shorter..."
                        : "e.g. Add a call to action..."
                    }
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
              Regenerating with your feedback...
            </div>
          )}
        </div>
      )}
    </div>
  );
}