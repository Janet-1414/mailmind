// src/types/index.ts — shared TypeScript types

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
}

export interface EmailLog {
  id: string;
  email_content: string;
  reply: string;
  model_used: string | null;
  tokens_used: number;
  confidence_score: number;
  created_at: string;
}

export interface Thread {
  id: string;
  title: string;
  created_at: string;
  email_logs: EmailLog[];
}

export interface ReplyRequest {
  email_content: string;
  hint?: string;
  tone?: string;
  model?: string;
  thread_id?: string | null;
  web_search_enabled?: boolean;
}

export interface ReplyResponse {
  reply: string;
  confidence_score: number;
  confidence_breakdown: { context_match: number; tone_consistency: number; hint_compliance: number };
  tokens_used: number;
  model_used: string;
  email_analysis: {
    is_urgent: boolean;
    urgency_level: string;
    question_count: number;
    sentiment_hint: string;
    requires_action: boolean;
    summary: string;
  };
  thread_id: string | null;
  email_log_id: string | null;
}

export interface Memory {
  id: string;
  pinecone_id: string;
  content: string;
  relevance_score: number;
  created_at: string;
  last_accessed: string;
}

export interface MemoryHealth {
  total_memories: number;
  healthy: number;
  pruned_eligible: number;
  average_score: number;
  health_percentage: number;
}

export interface EmailTemplate {
  id: string;
  title: string;
  content: string;
  tone: string | null;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface TemplateCreate {
  title: string;
  content: string;
  tone?: string;
  tags?: string;
}

export interface InboxItem {
  id: string;
  subject: string;
  from_address: string;
  date: string;
  snippet: string;
}

export interface EmailMessage {
  id: string;
  subject: string;
  from_address: string;
  to: string;
  date: string;
  body: string;
}

export interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  provider: "gmail" | "outlook";
}

export type Tone = "professional" | "friendly" | "formal" | "casual" | "empathetic" | "assertive" | "concise";
export type Model = "gpt-4o" | "gpt-4o-mini" | "gpt-4-turbo" | "claude-3-5-sonnet-20241022" | "claude-3-haiku-20240307";

export interface StreamToken {
  token: string;
  done: boolean;
  full_reply?: string;
  tokens_used?: number;
  model_used?: string;
  error?: string;
}

export interface FeedbackCreate {
  email_log_id: string;
  rating: number;
  comment?: string;
}

export type Theme = "light" | "dark";
