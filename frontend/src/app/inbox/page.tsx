"use client";
// src/app/inbox/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import PageWrapper from "@/components/layout/PageWrapper";
import { InboxList, EmailPreview } from "@/components/inbox/InboxList";
import { useInbox } from "@/hooks/useInbox";
import type { InboxItem } from "@/types";

export default function InboxPage() {
  const router = useRouter();
  const { items, selectedMessage, loading, provider, error,
    fetchInbox, fetchMessage, connectGmail, connectOutlook, clearSelected } = useInbox();
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);

  const handleSelect = async (item: InboxItem) => {
    setSelectedItem(item);
    await fetchMessage(item.id);
  };

  const handleReply = (body: string) => {
    sessionStorage.setItem("preload_email", body);
    router.push("/dashboard");
  };

  return (
    <PageWrapper className="!p-0">
      <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden">

        {/* Sidebar */}
        <div className="w-80 flex-shrink-0 flex flex-col"
          style={{ borderRight: "1px solid var(--border)", background: "var(--surface)" }}>

          {/* Provider tabs */}
          <div className="p-3 flex gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
            {(["gmail", "outlook"] as const).map((p) => (
              <button key={p} onClick={() => fetchInbox(p)}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all"
                style={{
                  background: provider === p ? "var(--olive)" : "var(--bg)",
                  color: provider === p ? "#F8F3E1" : "var(--muted)",
                }}>
                {p === "gmail" ? "📧 Gmail" : "📮 Outlook"}
              </button>
            ))}
          </div>

          {/* Connect buttons */}
          <div className="p-3 flex gap-2" style={{ borderBottom: "1px solid var(--border)" }}>
            <button onClick={connectGmail}
              className="flex-1 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
              style={{ background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              Connect Gmail
            </button>
            <button onClick={connectOutlook}
              className="flex-1 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
              style={{ background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
              Connect Outlook
            </button>
          </div>

          <div className="flex-1 overflow-hidden">
            <InboxList
              items={items}
              selectedId={selectedItem?.id}
              onSelect={handleSelect}
              loading={loading}
              error={error}
            />
          </div>
        </div>

        {/* Email preview */}
        <div className="flex-1 overflow-hidden" style={{ background: "var(--bg)" }}>
          {selectedMessage ? (
            <EmailPreview
              message={selectedMessage}
              onReply={handleReply}
              onClose={() => { clearSelected(); setSelectedItem(null); }}
            />
          ) : (
            <div className="h-full flex items-center justify-center flex-col gap-3"
              style={{ color: "var(--muted)" }}>
              <span className="text-5xl">📬</span>
              <p className="font-semibold">Select an email to preview</p>
              <p className="text-sm">Connect Gmail or Outlook above, then fetch your inbox.</p>
            </div>
          )}
        </div>
      </div>
    </PageWrapper>
  );
}
