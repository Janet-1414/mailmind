/**
 * useEmailAgent React hook for MailMind.
 * Manages the agent reply lifecycle with streaming support.
 * Exposes generate (streaming word-by-word), loading, streamingText,
 * reply, error, and reset. Falls back to standard JSON if streaming fails.
 */
"use client";
import { useState } from "react";
import { AgentService } from "@/services/AgentService";
import type { AgentReply, AgentSettings, ConversationTurn } from "@/types";

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

    try {
      // Try streaming first
      let accumulated = "";
      let streamWorked = false;

      try {
        for await (const token of agentService.generateReplyStream(
          emailContent, settings, hint, threadId, history,
          (t) => {
            accumulated += t;
            setStreamingText(accumulated);
          },
        )) {
          streamWorked = true;
          void token;
        }
      } catch {
        // Streaming not available — fall back to standard request
        streamWorked = false;
      }

      if (!streamWorked) {
        const result = await agentService.generateReply(
          emailContent, settings, hint, threadId, history,
        );
        setReply(result);
      } else {
        // Fetch final reply object for metadata (thread_id, usage, etc.)
        const result = await agentService.generateReply(
          emailContent, settings, hint, threadId, history,
        );
        setReply(result);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
