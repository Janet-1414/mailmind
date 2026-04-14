"use client";
// src/hooks/useMemory.ts
import { useState, useEffect, useCallback } from "react";
import { memoryService } from "@/services/AllServices";
import type { Memory, MemoryHealth } from "@/types";

export function useMemory() {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [health, setHealth] = useState<MemoryHealth | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [mems, h] = await Promise.all([memoryService.list(), memoryService.health()]);
      setMemories(mems);
      setHealth(h);
    } catch { /* handled silently */ }
    finally { setLoading(false); }
  }, []);

  const deleteMemory = useCallback(async (id: string) => {
    await memoryService.delete(id);
    setMemories((prev) => prev.filter((m) => m.id !== id));
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  return { memories, health, loading, refetch: fetchAll, deleteMemory };
}
