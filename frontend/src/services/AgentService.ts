/**
 * Agent service for MailMind.
 * Sends email content, tone, model settings, optional hint, thread ID,
 * and conversation history to the backend agent endpoint.
 * Supports both standard JSON replies and streaming (word-by-word) responses.
 */
import { HttpClient } from "@/services/HttpClient";
import type { AgentReply, AgentSettings, ConversationTurn } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export class AgentService {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient();
  }

  async generateReply(
    emailContent: string,
    settings: AgentSettings,
    hint: string = "",
    threadId?: string,
    history: ConversationTurn[] = [],
  ): Promise<AgentReply> {
    return this.client.post<AgentReply>("/agent/reply", {
      email_content:        emailContent,
      hint,
      thread_id:            threadId || null,
      settings: {
        model:             settings.model,
        tone:              settings.tone,
        temperature:       settings.temperature,
        top_p:             settings.top_p,
        frequency_penalty: settings.frequency_penalty,
        web_search_enabled: settings.webSearchEnabled,
      },
      conversation_history: history,
    });
  }

  async *generateReplyStream(
    emailContent: string,
    settings: AgentSettings,
    hint: string = "",
    threadId?: string,
    history: ConversationTurn[] = [],
    onToken?: (token: string) => void,
  ): AsyncGenerator<string> {
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const response = await fetch(`${BASE_URL}/agent/reply/stream`, {
      method: "POST",
      headers: {
        "Content-Type":  "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        email_content:        emailContent,
        hint,
        thread_id:            threadId || null,
        settings: {
          model:             settings.model,
          tone:              settings.tone,
          temperature:       settings.temperature,
          top_p:             settings.top_p,
          frequency_penalty: settings.frequency_penalty,
          web_search_enabled: settings.webSearchEnabled,
        },
        conversation_history: history,
      }),
    });

    if (!response.body) throw new Error("No response body for streaming");

    const reader  = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n").filter((l) => l.startsWith("data:"));
      for (const line of lines) {
        const data = line.replace("data:", "").trim();
        if (data === "[DONE]") return;
        try {
          const parsed = JSON.parse(data);
          if (parsed.type === "delta") {
            if (onToken) onToken(parsed.content);
            yield parsed.content;
          }
        } catch { /* skip malformed chunks */ }
      }
    }
  }
}
