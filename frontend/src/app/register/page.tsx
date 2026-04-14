"use client";
// src/app/register/page.tsx
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services/AuthService";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", full_name: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await authService.register(form.email, form.password, form.full_name);
      await authService.login(form.email, form.password);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err?.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
      <div className="w-full max-w-md animate-slide-up">
        <div className="p-8 rounded-2xl shadow-card" style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
          <h1 className="font-display text-3xl font-bold mb-1" style={{ color: "var(--olive)" }}>Create account</h1>
          <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>Start drafting smarter emails today</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: "#fee2e2", color: "#991b1b" }}>{error}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {[
              { key: "full_name", label: "Full Name", type: "text", placeholder: "Jane Smith" },
              { key: "email", label: "Email", type: "email", placeholder: "you@example.com" },
              { key: "password", label: "Password", type: "password", placeholder: "Min. 8 characters" },
            ].map(({ key, label, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium mb-1" style={{ color: "var(--text)" }}>{label}</label>
                <input
                  type={type} required
                  value={(form as any)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl outline-none text-sm"
                  style={{ background: "var(--bg)", border: "1.5px solid var(--border)", color: "var(--text)" }}
                  placeholder={placeholder}
                  minLength={key === "password" ? 8 : undefined}
                />
              </div>
            ))}
            <button
              type="submit" disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "var(--olive)", color: "#F8F3E1" }}>
              {loading ? "Creating account…" : "Create Account"}
            </button>
          </form>

          <p className="mt-5 text-center text-sm" style={{ color: "var(--muted)" }}>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold hover:underline" style={{ color: "var(--olive)" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}
