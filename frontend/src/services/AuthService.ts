import { HttpClient } from "@/services/HttpClient";
import type { AuthResponse, User } from "@/types";

export class AuthService {
  private client: HttpClient;

  constructor() {
    this.client = new HttpClient();
  }

  async register(name: string, email: string, password: string): Promise<AuthResponse> {
    return this.client.post<AuthResponse>("/auth/register", { name, email, password });
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    return this.client.post<AuthResponse>("/auth/login", { email, password });
  }

  async getMe(): Promise<User> {
    return this.client.get<User>("/auth/me");
  }

  async updateProfile(data: { name: string; email: string }): Promise<User> {
    return this.client.patch<User>("/auth/me", data);
  }

  async changePassword(data: { current_password: string; new_password: string }): Promise<void> {
    return this.client.post<void>("/auth/change-password", data);
  }

  async deleteAccount(): Promise<void> {
    return this.client.delete<void>("/auth/me");
  }

  saveToken(token: string): void {
    localStorage.setItem("token", token);
  }

  clearToken(): void {
    localStorage.removeItem("token");
  }

  isAuthenticated(): boolean {
    return !!localStorage.getItem("token");
  }
}
