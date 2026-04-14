"use client";
// src/hooks/useTemplates.ts
import { useState, useEffect, useCallback } from "react";
import { templateService } from "@/services/AllServices";
import type { EmailTemplate, TemplateCreate } from "@/types";

export function useTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  const fetchAll = useCallback(async (q?: string) => {
    setLoading(true);
    try {
      const data = await templateService.list(q);
      setTemplates(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  const create = useCallback(async (data: TemplateCreate) => {
    const t = await templateService.create(data);
    setTemplates((prev) => [t, ...prev]);
    return t;
  }, []);

  const remove = useCallback(async (id: string) => {
    await templateService.delete(id);
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }, []);

  useEffect(() => { fetchAll(search || undefined); }, [search, fetchAll]);

  return { templates, loading, search, setSearch, create, remove, refetch: fetchAll };
}
