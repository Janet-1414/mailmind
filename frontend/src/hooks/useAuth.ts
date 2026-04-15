import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AuthService } from "@/services/AuthService";
import type { User } from "@/types";

const authService = new AuthService();

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      setLoading(false);
      return;
    }
    authService
      .getMe()
      .then(setUser)
      .catch(() => authService.clearToken())
      .finally(() => setLoading(false));
  }, []);

  const login = async (email: string, password: string) => {
    const data = await authService.login(email, password);
    authService.saveToken(data.access_token);
    router.push("/dashboard");
  };

  const register = async (name: string, email: string, password: string) => {
    const data = await authService.register(name, email, password);
    authService.saveToken(data.access_token);
    router.push("/dashboard");
  };

  const logout = () => {
    authService.clearToken();
    router.push("/login");
  };

  return { user, loading, login, register, logout };
}
