/**
 * MailMind main dashboard page.
 * Fixed-height split layout with static thread sidebar and independent
 * scrolling main area. Manages thread state, conversation history,
 * streaming reply generation, dislike auto-retry (isRetry replaces
 * last exchange instead of adding a new one), and sidebar toggle.
 */
"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useEmailAgent } from "@/hooks/useEmailAgent";
import { useAuth } from "@/hooks/useAuth";
import { ThreadService } from "@/services/ThreadService";
import Navbar from "@/components/layout/Navbar";
import SettingsPanel from "@/components/agent/SettingsPanel";
import EmailComposer from "@/components/email/EmailComposer";
import ReplyOutput from "@/components/email/ReplyOutput";
import ThreadSidebar from "@/components/threads/ThreadSidebar";
import ThreadChatView from "@/components/threads/ThreadChatView";
import type { AgentSettings, ThreadExchange, ConversationTurn } from "@/types";

const DEFAULT_SETTINGS: AgentSettings = {
  model:             "gpt-4o-mini",
  tone:              "formal",
  temperature:       0.7,
  top_p:             1.0,
  frequency_penalty: 0.0,
  webSearchEnabled:  false,
};

const threadService = new ThreadService();

export default function DashboardPage() {
  const router = useRouter();
  const { user, loading: authLoading }                      = useAuth();
  const { reply, loading, streamingText, error, generate, reset } = useEmailAgent();

  const [emailContent, setEmailContent]         = useState("");
  const [hint, setHint]                         = useState("");
  const [settings, setSettings]                 = useState<AgentSettings>(DEFAULT_SETTINGS);
  const [sidebarOpen, setSidebarOpen]           = useState(true);
  const [activeThreadId, setActiveThreadId]     = useState<string | null>(null);
  const [exchanges, setExchanges]               = useState<ThreadExchange[]>([]);
  const [sidebarRefresh, setSidebarRefresh]     = useState(0);

  const pendingRef = useRef<{
    email_content: string;
    hint:          string;
    tone:          string;
    model:         string;
    isRetry?:      boolean;
  } | null>(null);

  useEffect(() => {
    if (!authLoading && !user && typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (!token) router.push("/login");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (reply && pendingRef.current) {
      const p = pendingRef.current;
      const newExchange: ThreadExchange = {
        id:               reply.email_log_id,
        email_content:    p.email_content,
        hint:             p.hint,
        reply:            reply.reply,
        tone:             p.tone,
        model:            p.model,
        created_at:       new Date().toISOString(),
        confidence_score: reply.confidence_score,
      };
      if (p.isRetry) {
        // Replace last exchange — dislike retry should not add a new bubble
        setExchanges((prev) => [...prev.slice(0, -1), newExchange]);
      } else {
        setExchanges((prev) => [...prev, newExchange]);
      }
      setActiveThreadId(reply.thread_id ?? null);
      setSidebarRefresh((n) => n + 1);
      pendingRef.current = null;
      setEmailContent("");
      setHint("");
    }
  }, [reply]);

  const handleGenerate = () => {
    if (!emailContent.trim()) return;
    pendingRef.current = {
      email_content: emailContent,
      hint,
      tone:  settings.tone,
      model: settings.model,
    };
    const history: ConversationTurn[] = exchanges
      .filter((ex) => !ex.hint?.startsWith("The previous reply was rejected"))
      .map((ex) => ({ email_content: ex.email_content, reply: ex.reply }));
    generate(emailContent, settings, hint, activeThreadId || undefined, history);
  };

  const handleNewThread = () => {
    reset();
    setActiveThreadId(null);
    setExchanges([]);
    setEmailContent("");
    setHint("");
    pendingRef.current = null;
  };

  const handleDislike = (comment: string) => {
    let emailToRetry    = "";
    let originalHint    = "";
    let historyWithout: ThreadExchange[] = [];

    setExchanges((prev) => {
      const last    = prev[prev.length - 1];
      historyWithout = prev.slice(0, -1);
      if (last) {
        emailToRetry = last.email_content;
        originalHint = last.hint || "";
      }
      return historyWithout;
    });

    reset();

    const correctionHint = comment.trim()
      ? `The previous reply was rejected. User said: "${comment.trim()}". Please fix this.`
      : "The previous reply was rejected. Please try a different approach.";

    setTimeout(() => {
      const history: ConversationTurn[] = historyWithout
        .filter((ex) => !ex.hint?.startsWith("The previous reply was rejected"))
        .map((ex) => ({ email_content: ex.email_content, reply: ex.reply }));
      pendingRef.current = {
        email_content: emailToRetry,
        hint:          originalHint,
        tone:          settings.tone,
        model:         settings.model,
        isRetry:       true,
      };
      generate(emailToRetry, settings, correctionHint, activeThreadId || undefined, history);
    }, 100);
  };

  const handleSelectThread = async (threadId: string) => {
    try {
      reset();
      pendingRef.current = null;
      const thread = await threadService.get(threadId);
      setActiveThreadId(thread.id);
      setExchanges(thread.exchanges);
      setEmailContent("");
      setHint("");
    } catch { /* fail silently */ }
  };

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`transition-all duration-300 flex-shrink-0 flex flex-col overflow-hidden border-r
            ${sidebarOpen ? "w-72" : "w-0"}`}
          style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
        >
          {sidebarOpen && (
            <div className="flex-1 overflow-y-auto px-4 py-6">
              <ThreadSidebar
                activeThreadId={activeThreadId}
                onSelectThread={handleSelectThread}
                onNewThread={handleNewThread}
                refreshTrigger={sidebarRefresh}
              />
            </div>
          )}
        </aside>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-6 py-8">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="font-serif text-3xl font-bold" style={{ color: "var(--primary)" }}>
                  {exchanges.length > 0 ? "Continue conversation ✦" : `Good day, ${firstName} ✦`}
                </h1>
                <p className="font-sans mt-1" style={{ color: "var(--text-muted)" }}>
                  {exchanges.length > 0
                    ? `${exchanges.length} exchange${exchanges.length > 1 ? "s" : ""} in this thread`
                    : "Paste an email below and get a perfect reply."}
                </p>
              </div>
              <button
                onClick={() => setSidebarOpen((v) => !v)}
                className="btn-ghost text-sm flex items-center gap-1.5"
                style={{ color: "var(--text-muted)" }}
              >
                {sidebarOpen ? "◂ Hide" : "▸ History"}
              </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-1">
                <SettingsPanel settings={settings} onChange={setSettings} />
              </div>

              <div className="lg:col-span-2 space-y-4">
                {exchanges.length > 0 && <ThreadChatView exchanges={exchanges} />}

                <EmailComposer
                  hint={hint}
                  onHintChange={setHint}
                  value={emailContent}
                  onChange={setEmailContent}
                  onSubmit={handleGenerate}
                  loading={loading}
                />

                {error && (
                  <div
                    className="rounded-xl px-4 py-3 text-sm font-sans"
                    style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}
                  >
                    ⚠ {error}
                  </div>
                )}

                {loading && (
                  <div className="card space-y-3">
                    {streamingText ? (
                      <div>
                        <p className="text-xs font-sans mb-2" style={{ color: "var(--text-muted)" }}>
                          Generating reply…
                        </p>
                        <pre
                          className="font-sans text-sm leading-relaxed whitespace-pre-wrap"
                          style={{ color: "var(--text)" }}
                        >
                          {streamingText}
                          <span
                            className="inline-block w-0.5 h-4 ml-0.5 animate-pulse"
                            style={{ backgroundColor: "var(--accent)" }}
                          />
                        </pre>
                      </div>
                    ) : (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-4 rounded w-1/3" style={{ backgroundColor: "var(--border)" }} />
                        <div className="h-3 rounded w-full" style={{ backgroundColor: "var(--border)" }} />
                        <div className="h-3 rounded w-5/6" style={{ backgroundColor: "var(--border)" }} />
                        <div className="h-3 rounded w-4/5" style={{ backgroundColor: "var(--border)" }} />
                      </div>
                    )}
                  </div>
                )}

                {reply && !loading && (
                  <ReplyOutput
                    reply={reply}
                    streamingText={streamingText}
                    onReset={handleNewThread}
                    onDislike={handleDislike}
                  />
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
