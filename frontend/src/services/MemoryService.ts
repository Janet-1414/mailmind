import { HttpClient } from "@/lib/HttpClient";
import type { MemoryItem } from "@/types";

export class MemoryService {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient();
  }

  async listMemory(): Promise<MemoryItem[]> {
    return this.client.get<MemoryItem[]>("/memory");
  }

  async deleteItem(id: string): Promise<{ success: boolean }> {
    return this.client.delete<{ success: boolean }>(`/memory/${id}`);
  }

  async clearAll(): Promise<{ success: boolean; deleted: number }> {
    return this.client.delete<{ success: boolean; deleted: number }>("/memory");
  }
}
