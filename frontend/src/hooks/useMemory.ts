import { useState, useEffect } from "react";
import { MemoryService } from "@/services/MemoryService";
import type { MemoryItem } from "@/types";

const memoryService = new MemoryService();

export function useMemory() {
  const [items, setItems] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await memoryService.listMemory();
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, []);

  const deleteItem = async (id: string) => {
    await memoryService.deleteItem(id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const clearAll = async () => {
    setClearing(true);
    await memoryService.clearAll();
    setItems([]);
    setClearing(false);
  };

  return { items, loading, clearing, deleteItem, clearAll, refetch: fetchItems };
}
