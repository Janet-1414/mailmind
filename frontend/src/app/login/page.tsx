"use client";
// src/app/login/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(form.email, form.password);
      router.push("/dashboard");
    } catch {
      setError("Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md animate-slide-up">
        <div className="p-8 rounded-2xl shadow-card" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h1 className="font-display text-3xl font-bold mb-1" style={{ color: "var(--olive)" }}>Welcome back</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Sign in to MailMind</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fee2e2", color: "#991b1b" }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Email</label>
              <input
                type="email" required value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl outline-none text-sm transition-all"
                style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text)" }}
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>Password</label>
              <input
                type="password" required value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl outline-none text-sm"
                style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text)" }}
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--olive)", color: "#F8F3E1" }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: "var(--muted)" }}>
            No account?{" "}
            <Link href="/register" className="font-semibold hover:underline" style={{ color: "var(--olive)" }}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
