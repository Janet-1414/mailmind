/**
 * Shared TypeScript type definitions for MailMind.
 * Defines interfaces for AgentSettings, AgentReply (with confidence score
 * and streaming support), TokenUsage, ThreadExchange, ThreadSummary,
 * ConversationTurn, MemoryItem, FeedbackPayload, User, and AuthResponse.
 */

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface User {
  id:    string;
  name:  string;
  email: string;
}

export interface AuthResponse {
  access_token: string;
}

// ── Agent ─────────────────────────────────────────────────────────────────────
export interface AgentSettings {
  model:             string;
  tone:              string;
  temperature:       number;
  top_p:             number;
  frequency_penalty: number;
  webSearchEnabled:  boolean;
}

export interface TokenUsage {
  prompt_tokens:     number;
  completion_tokens: number;
  total_tokens:      number;
  cost_usd:          number;
}

export interface AgentReply {
  email_log_id:     string;
  thread_id:        string;
  reply:            string;
  usage:            TokenUsage;
  cached:           boolean;
  sources:          string[];
  memory_used:      boolean;
  confidence_score: number | null;
}

// ── Streaming ─────────────────────────────────────────────────────────────────
export interface StreamChunk {
  type:    "delta" | "done" | "error";
  content: string;
}

// ── Threads ───────────────────────────────────────────────────────────────────
export interface ConversationTurn {
  email_content: string;
  reply:         string;
}

export interface ThreadExchange {
  id:            string;
  email_content: string;
  hint:          string;
  reply:         string;
  tone:          string;
  model:         string;
  created_at:    string;
  isRetry?:      boolean;
  confidence_score?: number | null;
}

export interface ThreadSummary {
  id:             string;
  title:          string;
  updated_at:     string;
  exchange_count: number;
}

export interface ThreadDetail {
  id:         string;
  title:      string;
  created_at: string;
  updated_at: string;
  exchanges:  ThreadExchange[];
}

// ── Feedback ──────────────────────────────────────────────────────────────────
export interface FeedbackPayload {
  email_log_id: string;
  rating:       1 | -1;
  comment?:     string;
}

// ── Memory ────────────────────────────────────────────────────────────────────
export interface MemoryItem {
  id:         string;
  content:    string;
  created_at: string;
}
