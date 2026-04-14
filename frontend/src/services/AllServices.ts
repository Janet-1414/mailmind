// src/services/AllServices.ts — all non-auth/agent services in one file
import { http } from "./HttpClient";
import type { Memory, MemoryHealth, Thread, EmailTemplate, TemplateCreate, InboxItem, EmailMessage, SendEmailRequest, FeedbackCreate } from "@/types";

// ── Memory ───────────────────────────────────────────────────────
class MemoryServiceClass {
  async list(): Promise<Memory[]> { return http.get<Memory[]>("/memory/"); }
  async health(): Promise<MemoryHealth> { return http.get<MemoryHealth>("/memory/health"); }
  async delete(id: string): Promise<void> { return http.delete(`/memory/${id}`); }
}
export const memoryService = new MemoryServiceClass();

// ── Thread ───────────────────────────────────────────────────────
class ThreadServiceClass {
  async list(): Promise<Thread[]> { return http.get<Thread[]>("/threads/"); }
  async get(id: string): Promise<Thread> { return http.get<Thread>(`/threads/${id}`); }
  async create(title?: string): Promise<Thread> { return http.post<Thread>("/threads/", { title: title || "New Thread" }); }
  async update(id: string, title: string): Promise<Thread> { return http.put<Thread>(`/threads/${id}`, { title }); }
  async delete(id: string): Promise<void> { return http.delete(`/threads/${id}`); }
}
export const threadService = new ThreadServiceClass();

// ── Template ─────────────────────────────────────────────────────
class TemplateServiceClass {
  async list(search?: string): Promise<EmailTemplate[]> {
    const q = search ? `?search=${encodeURIComponent(search)}` : "";
    return http.get<EmailTemplate[]>(`/templates/${q}`);
  }
  async create(data: TemplateCreate): Promise<EmailTemplate> { return http.post<EmailTemplate>("/templates/", data); }
  async update(id: string, data: Partial<TemplateCreate>): Promise<EmailTemplate> { return http.put<EmailTemplate>(`/templates/${id}`, data); }
  async delete(id: string): Promise<void> { return http.delete(`/templates/${id}`); }
}
export const templateService = new TemplateServiceClass();

// ── Inbox ─────────────────────────────────────────────────────────
class InboxServiceClass {
  async getGmailAuthUrl(): Promise<{ auth_url: string }> { return http.get("/email/gmail/auth"); }
  async getOutlookAuthUrl(): Promise<{ auth_url: string }> { return http.get("/email/outlook/auth"); }
  async fetchGmailInbox(): Promise<InboxItem[]> { return http.get<InboxItem[]>("/email/gmail/inbox"); }
  async fetchOutlookInbox(): Promise<InboxItem[]> { return http.get<InboxItem[]>("/email/outlook/inbox"); }
  async fetchGmailMessage(id: string): Promise<EmailMessage> { return http.get<EmailMessage>(`/email/gmail/message/${id}`); }
  async sendEmail(data: SendEmailRequest): Promise<{ status: string }> { return http.post("/email/send", data); }
}
export const inboxService = new InboxServiceClass();

// ── Feedback ──────────────────────────────────────────────────────
class FeedbackServiceClass {
  async submit(data: FeedbackCreate): Promise<void> { return http.post("/feedback/", data); }
}
export const feedbackService = new FeedbackServiceClass();