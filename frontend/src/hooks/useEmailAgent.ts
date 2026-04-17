/**
 * useEmailAgent React hook for MailMind.
 * Manages the agent reply lifecycle with real SSE streaming support.
 * Streams reply token by token, then receives final metadata (thread_id,
 * usage, confidence score) in the done event. Falls back to standard
 * JSON if streaming fails.
 */
"use client";
import { useState } from "react";
import { AgentService } from "@/services/AgentService";
import type { AgentReply, AgentSettings, ConversationTurn } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const agentService = new AgentService();

export function useEmailAgent() {
  const [reply,         setReply]         = useState<AgentReply | null>(null);
  const [loading,       setLoading]       = useState(false);
  const [streamingText, setStreamingText] = useState("");
  const [error,         setError]         = useState<string | null>(null);

  const generate = async (
    emailContent: string,
    settings: AgentSettings,
    hint: string = "",
    threadId?: string,
    history: ConversationTurn[] = [],
  ) => {
    setLoading(true);
    setError(null);
    setReply(null);
    setStreamingText("");

    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const body  = JSON.stringify({
      email_content:        emailContent,
      hint,
      thread_id:            threadId || null,
      settings: {
        model:              settings.model,
        tone:               settings.tone,
        temperature:        settings.temperature,
        top_p:              settings.top_p,
        frequency_penalty:  settings.frequency_penalty,
        web_search_enabled: settings.webSearchEnabled,
      },
      conversation_history: history,
    });

    try {
      // ── Try SSE streaming ──────────────────────────────────────────────────
      const response = await fetch(`${BASE_URL}/agent/reply/stream`, {
        method:  "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body,
      });

      if (!response.ok || !response.body) {
        throw new Error("Stream not available");
      }

      const reader    = response.body.getReader();
      const decoder   = new TextDecoder();
      let accumulated = "";
      let finalReply: AgentReply | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data:"));

        for (const line of lines) {
          const raw = line.replace(/^data:\s*/, "").trim();
          if (raw === "[DONE]") break;

          try {
            const parsed = JSON.parse(raw);

            if (parsed.type === "delta") {
              accumulated += parsed.content;
              setStreamingText(accumulated);

            } else if (parsed.type === "done") {
              // Final metadata from backend
              finalReply = {
                email_log_id:     parsed.email_log_id,
                thread_id:        parsed.thread_id,
                reply:            accumulated,
                usage:            parsed.usage,
                cached:           false,
                sources:          parsed.sources || [],
                memory_used:      parsed.memory_used || false,
                confidence_score: parsed.confidence_score ?? null,
              };

            } else if (parsed.type === "error") {
              throw new Error(parsed.content);
            }
          } catch { /* skip malformed chunks */ }
        }
      }

      if (finalReply) {
        setReply(finalReply);
      }

    } catch {
      // ── Fallback to standard JSON endpoint ────────────────────────────────
      try {
        const result = await agentService.generateReply(
          emailContent, settings, hint, threadId, history,
        );
        setReply(result);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      setLoading(false);
      setStreamingText("");
    }
  };

  const reset = () => {
    setReply(null);
    setError(null);
    setStreamingText("");
    setLoading(false);
  };

  return { reply, loading, streamingText, error, generate, reset };
}
