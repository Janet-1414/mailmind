// src/services/HttpClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

class HttpClient {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({ baseURL: API_URL, timeout: 60000 });

    this.client.interceptors.request.use((config) => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("access_token");
        if (token) config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    this.client.interceptors.response.use(
      (r) => r,
      (err) => {
        if (err.response?.status === 401 && typeof window !== "undefined") {
          localStorage.removeItem("access_token");
          window.location.href = "/login";
        }
        return Promise.reject(err);
      }
    );
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const r = await this.client.get<T>(url, config);
    return r.data;
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    const r = await this.client.post<T>(url, data, config);
    return r.data;
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    const r = await this.client.put<T>(url, data);
    return r.data;
  }

  async delete<T>(url: string): Promise<T> {
    const r = await this.client.delete<T>(url);
    return r.data;
  }

  getBaseURL(): string {
    return API_URL;
  }
}

export const http = new HttpClient();
