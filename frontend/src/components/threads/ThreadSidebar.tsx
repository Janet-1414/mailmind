/**
 * ThreadSidebar component for MailMind.
 * Fixed left sidebar showing all conversation threads for the current user.
 * Supports selecting, inline rename, delete single thread, and clear all history.
 * Styled with Midnight Slate theme variables for light/dark compatibility.
 */
"use client";
import { useState, useEffect, useRef } from "react";
import { ThreadService } from "@/services/ThreadService";
import type { ThreadSummary } from "@/types";

interface ThreadSidebarProps {
  activeThreadId:  string | null;
  onSelectThread:  (id: string) => void;
  onNewThread:     () => void;
  refreshTrigger:  number;
}

const threadService = new ThreadService();

export default function ThreadSidebar({
  activeThreadId, onSelectThread, onNewThread, refreshTrigger,
}: ThreadSidebarProps) {
  const [threads,        setThreads]        = useState<ThreadSummary[]>([]);
  const [editingId,      setEditingId]      = useState<string | null>(null);
  const [editTitle,      setEditTitle]      = useState("");
  const [showClearAll,   setShowClearAll]   = useState(false);
  const [clearingAll,    setClearingAll]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { loadThreads(); }, [refreshTrigger]);
  useEffect(() => { if (editingId && inputRef.current) inputRef.current.focus(); }, [editingId]);

  const loadThreads = async () => {
    try { setThreads(await threadService.list()); } catch { /* fail silently */ }
  };

  const handleRename = async (id: string) => {
    if (!editTitle.trim()) { setEditingId(null); return; }
    try {
      await threadService.rename(id, editTitle.trim());
      setThreads((prev) => prev.map((t) => t.id === id ? { ...t, title: editTitle.trim() } : t));
    } catch { /* fail silently */ }
    setEditingId(null);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await threadService.delete(id);
      setThreads((prev) => prev.filter((t) => t.id !== id));
      if (activeThreadId === id) onNewThread();
    } catch { /* fail silently */ }
  };

  const handleClearAll = async () => {
    setClearingAll(true);
    try {
      await Promise.all(threads.map((t) => threadService.delete(t.id)));
      setThreads([]);
      onNewThread();
    } catch { /* fail silently */ }
    finally {
      setClearingAll(false);
      setShowClearAll(false);
    }
  };

  const startEdit = (e: React.MouseEvent, thread: ThreadSummary) => {
    e.stopPropagation();
    setEditingId(thread.id);
    setEditTitle(thread.title);
  };

  return (
    <div className="flex flex-col h-full">
      <button
        onClick={onNewThread}
        className="w-full flex items-center gap-2 px-4 py-3 mb-4 rounded-xl font-sans text-sm font-medium transition-colors"
        style={{ backgroundColor: "var(--primary)", color: "#ffffff" }}
      >
        <span className="text-lg">✦</span> New conversation
      </button>

      {/* History header with clear all */}
      <div className="flex items-center justify-between mb-2 px-1">
        <p className="text-xs font-sans uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
          History
        </p>
        {threads.length > 0 && (
          <button
            onClick={() => setShowClearAll(true)}
            className="text-xs font-sans transition-colors hover:opacity-80"
            style={{ color: "#ef4444" }}
            title="Clear all history"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Confirm clear all */}
      {showClearAll && (
        <div
          className="rounded-xl p-3 mb-3 space-y-2"
          style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca" }}
        >
          <p className="font-sans text-xs" style={{ color: "#dc2626" }}>
            Delete all {threads.length} conversation{threads.length > 1 ? "s" : ""}?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleClearAll}
              disabled={clearingAll}
              className="flex-1 text-xs font-sans font-medium py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: "#dc2626", color: "#fff" }}
            >
              {clearingAll ? "Clearing…" : "Yes, delete all"}
            </button>
            <button
              onClick={() => setShowClearAll(false)}
              className="flex-1 text-xs font-sans font-medium py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: "var(--border)", color: "var(--text)" }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-1">
        {threads.length === 0 && (
          <p className="text-xs font-sans text-center mt-8 px-2" style={{ color: "var(--text-muted)" }}>
            No conversations yet.
          </p>
        )}
        {threads.map((thread) => (
          <div
            key={thread.id}
            onClick={() => onSelectThread(thread.id)}
            className="group relative w-full text-left px-3 py-3 rounded-xl cursor-pointer transition-all"
            style={{
              backgroundColor: activeThreadId === thread.id ? `var(--accent)15` : "transparent",
              border: `1px solid ${activeThreadId === thread.id ? "var(--accent)" : "transparent"}`,
            }}
            onMouseEnter={(e) => {
              if (activeThreadId !== thread.id)
                (e.currentTarget as HTMLDivElement).style.backgroundColor = "var(--border)";
            }}
            onMouseLeave={(e) => {
              if (activeThreadId !== thread.id)
                (e.currentTarget as HTMLDivElement).style.backgroundColor = "transparent";
            }}
          >
            {editingId === thread.id ? (
              <input
                ref={inputRef}
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => handleRename(thread.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter")  handleRename(thread.id);
                  if (e.key === "Escape") setEditingId(null);
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full bg-transparent text-sm font-sans outline-none py-0.5"
                style={{ borderBottom: `1px solid var(--accent)`, color: "var(--text)" }}
              />
            ) : (
              <>
                <p className="text-sm font-sans font-medium truncate pr-12" style={{ color: "var(--text)" }}>
                  {thread.title}
                </p>
                <p className="text-xs font-sans mt-0.5" style={{ color: "var(--text-muted)" }}>
                  {thread.exchange_count} {thread.exchange_count === 1 ? "exchange" : "exchanges"}
                </p>
                <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1">
                  <button
                    onClick={(e) => startEdit(e, thread)}
                    className="p-1 rounded-lg text-xs transition-colors"
                    style={{ color: "var(--text-muted)" }}
                    title="Rename"
                  >✎</button>
                  <button
                    onClick={(e) => handleDelete(e, thread.id)}
                    className="p-1 rounded-lg text-xs transition-colors hover:text-red-500"
                    style={{ color: "var(--text-muted)" }}
                    title="Delete"
                  >✕</button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
