"use client";
// src/hooks/useEmailAgent.ts
import { useState, useCallback } from "react";
import { agentService } from "@/services/AgentService";
import type { ReplyRequest, ReplyResponse } from "@/types";

interface AgentState {
  reply: string;
  streaming: boolean;
  loading: boolean;
  error: string | null;
  response: ReplyResponse | null;
}

export function useEmailAgent() {
  const [state, setState] = useState<AgentState>({
    reply: "",
    streaming: false,
    loading: false,
    error: null,
    response: null,
  });

  const generate = useCallback(async (data: ReplyRequest) => {
    setState((s) => ({ ...s, loading: true, error: null, reply: "", response: null }));
    try {
      const resp = await agentService.generateReply(data);
      setState((s) => ({ ...s, loading: false, reply: resp.reply, response: resp }));
    } catch (err: any) {
      setState((s) => ({
        ...s,
        loading: false,
        error: err?.response?.data?.detail || "Failed to generate reply",
      }));
    }
  }, []);

  const stream = useCallback(async (data: ReplyRequest) => {
    setState((s) => ({ ...s, streaming: true, error: null, reply: "", response: null }));
    try {
      let fullReply = "";
      for await (const token of agentService.streamReply(data)) {
        if (token.error) throw new Error(token.error);
        if (!token.done) {
          fullReply += token.token;
          setState((s) => ({ ...s, reply: fullReply }));
        } else {
          const finalReply = token.full_reply || fullReply;
          const syntheticResponse: ReplyResponse = {
            reply: finalReply,
            confidence_score: (token as any).confidence_score ?? 0,
            confidence_breakdown: (token as any).confidence_breakdown ?? {
              context_match: 0,
              tone_consistency: 0,
              hint_compliance: 0,
            },
            tokens_used: token.tokens_used || 0,
            model_used: token.model_used || data.model || "gpt-4o-mini",
            email_analysis: (token as any).email_analysis ?? {
              is_urgent: false,
              urgency_level: "low",
              question_count: 0,
              sentiment_hint: "neutral",
              requires_action: false,
              summary: "",
            },
            thread_id: null,
            email_log_id: null,
          };
          setState((s) => ({
            ...s,
            streaming: false,
            reply: finalReply,
            response: syntheticResponse,
          }));
        }
      }
    } catch (err: any) {
      setState((s) => ({
        ...s,
        streaming: false,
        error: err.message || "Streaming failed",
      }));
    }
  }, []);

  const reset = useCallback(() => {
    setState({ reply: "", streaming: false, loading: false, error: null, response: null });
  }, []);

  return { ...state, generate, stream, reset };
}