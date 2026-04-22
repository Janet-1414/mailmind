/**
 * Thread service for MailMind.
 * Handles all conversation thread operations — listing threads,
 * fetching a single thread with its full exchange history, renaming
 * a thread title, and deleting a thread.
 */
import { HttpClient } from "@/services/HttpClient";
import type { ThreadDetail, ThreadSummary } from "@/types";

export class ThreadService {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient();
  }

  async list(): Promise<ThreadSummary[]> {
    return this.client.get<ThreadSummary[]>("/threads");
  }

  async get(threadId: string): Promise<ThreadDetail> {
    return this.client.get<ThreadDetail>(`/threads/${threadId}`);
  }

  async rename(threadId: string, title: string): Promise<void> {
    await this.client.patch(`/threads/${threadId}/title`, { title });
  }

  async delete(threadId: string): Promise<void> {
    await this.client.delete(`/threads/${threadId}`);
  }
}
