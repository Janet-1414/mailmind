// src/services/AgentService.ts
import { http } from "./HttpClient";
import type { ReplyRequest, ReplyResponse, StreamToken } from "@/types";

class AgentService {
  async generateReply(data: ReplyRequest): Promise<ReplyResponse> {
    return http.post<ReplyResponse>("/agent/reply", data);
  }

  async *streamReply(data: ReplyRequest): AsyncGenerator<StreamToken> {
    const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : "";
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

    const resp = await fetch(`${apiUrl}/agent/reply/stream`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!resp.ok || !resp.body) throw new Error("Stream failed");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          try {
            const parsed: StreamToken = JSON.parse(line.slice(6));
            yield parsed;
          } catch {
            // skip malformed
          }
        }
      }
    }
  }
}

export const agentService = new AgentService();
