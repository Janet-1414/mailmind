"use client";
// src/components/threads/ThreadSidebar.tsx
import { useEffect, useState, useRef } from "react";
import { threadService } from "@/services/AllServices";
import type { Thread } from "@/types";

interface Props {
  selectedId?: string;
  onSelect: (thread: Thread) => void;
  onNew: () => void;
  refreshKey?: number;
}

export default function ThreadSidebar({ selectedId, onSelect, onNew, refreshKey }: Props) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    threadService.list().then(setThreads).finally(() => setLoading(false));
  }, [refreshKey]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const deleteThread = async (id: string) => {
    await threadService.delete(id);
    setThreads((prev) => prev.filter((t) => t.id !== id));
    setMenuOpenId(null);
  };

  const startRename = (t: Thread) => {
    setRenamingId(t.id);
    setRenameValue(t.title);
    setMenuOpenId(null);
  };

  const submitRename = async (id: string) => {
    if (!renameValue.trim()) return;
    await threadService.update(id, renameValue.trim());
    setThreads((prev) => prev.map((t) => t.id === id ? { ...t, title: renameValue.trim() } : t));
    setRenamingId(null);
  };

  return (
    <div className="h-full flex flex-col" style={{ borderRight: "1px solid var(--border)" }}>

      {/* Header */}
      <div className="px-4 py-4 flex items-center justify-between flex-shrink-0"
        style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="text-sm font-bold" style={{ color: "var(--olive)" }}>MailMind</span>
        <button
          onClick={onNew}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
          style={{ background: "var(--olive)", color: "#F8F3E1" }}
        >
          + New
        </button>
      </div>

      {/* Thread list */}
      <div className="flex-1 overflow-y-auto py-2">
        {loading && (
          <p className="text-xs text-center py-6" style={{ color: "var(--muted)" }}>Loading…</p>
        )}
        {!loading && threads.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-2 px-4 text-center">
            <span className="text-2xl">💬</span>
            <p className="text-xs" style={{ color: "var(--muted)" }}>No conversations yet</p>
            <p className="text-xs" style={{ color: "var(--muted)" }}>Click "+ New" to start</p>
          </div>
        )}

        {threads.map((t) => {
          const isSelected = selectedId === t.id;
          const isRenaming = renamingId === t.id;
          const isMenuOpen = menuOpenId === t.id;

          return (
            <div
              key={t.id}
              onClick={() => !isRenaming && onSelect(t)}
              className="group relative flex items-center gap-2 px-3 py-2.5 cursor-pointer transition-all"
              style={{
                background: isSelected ? "#AEB78422" : "transparent",
                borderLeft: `3px solid ${isSelected ? "var(--sage)" : "transparent"}`,
              }}
            >
              {/* Thread name or rename input */}
              <div className="flex-1 min-w-0">
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => submitRename(t.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") submitRename(t.id);
                      if (e.key === "Escape") setRenamingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-2 py-0.5 rounded text-xs outline-none"
                    style={{
                      background: "var(--bg)",
                      border: "1.5px solid var(--sage)",
                      color: "var(--text)",
                    }}
                  />
                ) : (
                  <>
                    <p className="text-sm truncate" style={{ color: "var(--text)" }}>{t.title}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>
                      {t.email_logs?.length || 0} exchange{(t.email_logs?.length || 0) !== 1 ? "s" : ""}
                    </p>
                  </>
                )}
              </div>

              {/* Three dots menu button */}
              {!isRenaming && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setMenuOpenId(isMenuOpen ? null : t.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 w-6 h-6 rounded-md flex items-center justify-center transition-all flex-shrink-0"
                  style={{ color: "var(--muted)", background: "var(--border)" }}
                >
                  ···
                </button>
              )}

              {/* Dropdown menu */}
              {isMenuOpen && (
                <div
                  ref={menuRef}
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-2 top-8 z-50 rounded-xl overflow-hidden shadow-lg"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", minWidth: "130px" }}
                >
                  <button
                    onClick={() => startRename(t)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-all hover:opacity-80 text-left"
                    style={{ color: "var(--text)" }}
                  >
                    ✏️ Rename
                  </button>
                  <div style={{ borderTop: "1px solid var(--border)" }} />
                  <button
                    onClick={() => deleteThread(t.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs transition-all hover:bg-red-50 text-left"
                    style={{ color: "#ef4444" }}
                  >
                    🗑️ Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}