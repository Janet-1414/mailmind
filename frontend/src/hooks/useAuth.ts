"use client";
// src/hooks/useAuth.ts
import { useState, useEffect, useCallback } from "react";
import { authService } from "@/services/AuthService";
import type { User } from "@/types";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authService.isAuthenticated()) {
      authService.me().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    await authService.login(email, password);
    const u = await authService.me();
    setUser(u);
    return u;
  }, []);

  const logout = useCallback(() => { authService.logout(); setUser(null); }, []);

  return { user, loading, login, logout, isAuthenticated: !!user };
}
