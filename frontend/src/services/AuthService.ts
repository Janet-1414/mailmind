// src/services/AuthService.ts
import { http } from "./HttpClient";
import type { TokenResponse, User } from "@/types";

class AuthService {
  async register(email: string, password: string, full_name: string): Promise<User> {
    return http.post<User>("/auth/register", { email, password, full_name });
  }

  async login(email: string, password: string): Promise<TokenResponse> {
    const form = new URLSearchParams({ username: email, password });
    const resp = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/auth/login`,
      { method: "POST", body: form, headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    if (!resp.ok) throw new Error("Invalid credentials");
    const data: TokenResponse = await resp.json();
    if (typeof window !== "undefined") localStorage.setItem("access_token", data.access_token);
    return data;
  }

  async me(): Promise<User> {
    return http.get<User>("/auth/me");
  }

  logout(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
  }

  isAuthenticated(): boolean {
    if (typeof window === "undefined") return false;
    return !!localStorage.getItem("access_token");
  }
}

export const authService = new AuthService();
