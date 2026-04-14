"use client";
// src/hooks/useInbox.ts
import { useState, useCallback } from "react";
import { inboxService } from "@/services/AllServices";
import type { InboxItem, EmailMessage } from "@/types";

export function useInbox() {
  const [items, setItems] = useState<InboxItem[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<EmailMessage | null>(null);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<"gmail" | "outlook">("gmail");
  const [error, setError] = useState<string | null>(null);

  const fetchInbox = useCallback(async (p: "gmail" | "outlook" = provider) => {
    setLoading(true);
    setError(null);
    try {
      const data = p === "gmail"
        ? await inboxService.fetchGmailInbox()
        : await inboxService.fetchOutlookInbox();
      setItems(data);
      setProvider(p);
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Failed to fetch inbox");
    } finally {
      setLoading(false);
    }
  }, [provider]);

  const fetchMessage = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const msg = await inboxService.fetchGmailMessage(id);
      setSelectedMessage(msg);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const connectGmail = useCallback(async () => {
    const { auth_url } = await inboxService.getGmailAuthUrl();
    window.location.href = auth_url;
  }, []);

  const connectOutlook = useCallback(async () => {
    const { auth_url } = await inboxService.getOutlookAuthUrl();
    window.location.href = auth_url;
  }, []);

  return {
    items, selectedMessage, loading, provider, error,
    fetchInbox, fetchMessage, connectGmail, connectOutlook,
    clearSelected: () => setSelectedMessage(null),
  };
}
