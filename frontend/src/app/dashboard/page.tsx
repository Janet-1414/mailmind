"use client";
// src/app/dashboard/page.tsx
import { useState, useCallback } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import EmailComposer from "@/components/email/EmailComposer";
import ThreadSidebar from "@/components/threads/ThreadSidebar";
import ThreadChatView from "@/components/threads/ThreadChatView";
import { templateService, threadService } from "@/services/AllServices";
import type { Thread } from "@/types";

export default function DashboardPage() {
  const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
  const [saveMsg, setSaveMsg] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSaveTemplate = async (content: string) => {
    try {
      await templateService.create({ title: `Template ${new Date().toLocaleDateString()}`, content });
      setSaveMsg("Template saved!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch { /* silent */ }
  };

  const handleSelectThread = async (thread: Thread) => {
    try {
      const full = await threadService.get(thread.id);
      setSelectedThread(full);
    } catch {
      setSelectedThread(thread);
    }
  };

  const handleNew = () => setSelectedThread(null);

  // Called after reply generated — refresh sidebar + switch to the thread
  const handleReplyGenerated = useCallback(async (threadId?: string) => {
    // Always refresh sidebar
    setRefreshKey((k) => k + 1);

    // If a threadId was returned, fetch and select that thread
    if (threadId) {
      try {
        const full = await threadService.get(threadId);
        setSelectedThread(full);
      } catch { /* silent */ }
    } else if (selectedThread) {
      try {
        const full = await threadService.get(selectedThread.id);
        setSelectedThread(full);
      } catch { /* silent */ }
    }
  }, [selectedThread]);

  return (
    <PageWrapper>
      <div
        className="flex h-[calc(100vh-3.5rem-3rem)] rounded-2xl overflow-hidden shadow-card"
        style={{ border: "1px solid var(--border)" }}
      >
        {/* Sidebar */}
        <div className="w-60 flex-shrink-0" style={{ background: "var(--surface)" }}>
          <ThreadSidebar
            selectedId={selectedThread?.id}
            onSelect={handleSelectThread}
            onNew={handleNew}
            refreshKey={refreshKey}
          />
        </div>

        {/* Main area */}
        <div className="flex-1 flex flex-col overflow-hidden" style={{ background: "var(--bg)" }}>

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
            <div>
              <h1 className="font-display text-xl font-bold" style={{ color: "var(--olive)" }}>
                {selectedThread ? selectedThread.title : "New Compose"}
              </h1>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                {selectedThread
                  ? `${selectedThread.email_logs?.length || 0} exchange(s) in this thread`
                  : "Paste an email below to generate a reply"}
              </p>
            </div>
            {saveMsg && (
              <span className="text-xs px-3 py-1.5 rounded-full"
                style={{ background: "#d1fae5", color: "#065f46" }}>
                {saveMsg}
              </span>
            )}
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedThread ? (
              <ThreadChatView
                thread={selectedThread}
                onSaveTemplate={handleSaveTemplate}
                onReplyGenerated={handleReplyGenerated}
              />
            ) : (
              <EmailComposer
                key="new-compose"
                initialContent=""
                onSaveTemplate={handleSaveTemplate}
                onReplyGenerated={handleReplyGenerated}
              />
            )}
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}