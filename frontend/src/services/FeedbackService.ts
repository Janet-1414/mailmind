import { HttpClient } from "@/lib/HttpClient";
import type { FeedbackPayload } from "@/types";

export class FeedbackService {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient();
  }

  async submit(payload: FeedbackPayload): Promise<{ success: boolean }> {
    return this.client.post<{ success: boolean }>("/feedback", payload);
  }
}
