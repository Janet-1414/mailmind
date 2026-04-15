import { HttpClient } from "@/lib/HttpClient";
import type { Thread, ThreadSummary } from "@/types";

export class ThreadService {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient();
  }

  async list(): Promise<ThreadSummary[]> {
    return this.client.get<ThreadSummary[]>("/threads");
  }

  async get(threadId: string): Promise<Thread> {
    return this.client.get<Thread>(`/threads/${threadId}`);
  }

  async create(title?: string): Promise<Thread> {
    return this.client.post<Thread>("/threads", { title: title || "New thread" });
  }

  async rename(threadId: string, title: string): Promise<void> {
    await this.client.patch(`/threads/${threadId}/title`, { title });
  }

  async delete(threadId: string): Promise<void> {
    await this.client.delete(`/threads/${threadId}`);
  }
}
