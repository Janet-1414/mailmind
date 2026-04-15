/**
 * MailMind login page.
 * Handles user authentication — collects email and password, calls
 * the auth service, stores the JWT token, and redirects to the
 * dashboard on success.
 */
"use client";
import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function LoginPage() {
  const { login }         = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: "var(--bg)" }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-3xl">✉</span>
          <h1 className="font-serif text-2xl font-bold mt-2" style={{ color: "var(--primary)" }}>Welcome back</h1>
          <p className="font-sans text-sm mt-1" style={{ color: "var(--text-muted)" }}>Sign in to your MailMind account</p>
        </div>

        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email address</label>
              <input type="email" className="input-field" placeholder="you@example.com"
                value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div>
              <label className="label">Password</label>
              <input type="password" className="input-field" placeholder="••••••••"
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>

            {error && (
              <p className="text-sm font-sans" style={{ color: "#ef4444" }}>⚠ {error}</p>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm font-sans mt-4" style={{ color: "var(--text-muted)" }}>
          Don&apos;t have an account?{" "}
          <Link href="/register" style={{ color: "var(--accent)" }}>Create one</Link>
        </p>
      </div>
    </div>
  );
}
