"use client";
// src/components/layout/Navbar.tsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { authService } from "@/services/AuthService";

const NAV_LINKS = [
  { href: "/dashboard", label: "Compose", icon: "✦" },
  { href: "/inbox",     label: "Inbox",   icon: "📬" },
  { href: "/templates", label: "Templates", icon: "📄" },
  { href: "/memory",    label: "Memory",  icon: "🧠" },
  { href: "/settings",  label: "Settings", icon: "⚙" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [dark, setDark]       = useState(false);
  const [menuOpen, setMenu]   = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = saved ? saved === "dark" : prefersDark;
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const handleLogout = () => { authService.logout(); router.push("/login"); };

  return (
    <nav className="sticky top-0 z-50 border-b backdrop-blur-md"
      style={{ background: "var(--surface)dd", borderColor: "var(--border)" }}>
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-between h-14">

        {/* Logo */}
        <Link href="/dashboard" className="font-display text-xl font-bold" style={{ color: "var(--olive)" }}>
          MailMind
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label, icon }) => {
            const active = pathname.startsWith(href);
            return (
              <Link key={href} href={href}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={{
                  background: active ? "#AEB78422" : "transparent",
                  color: active ? "var(--olive)" : "var(--muted)",
                }}>
                <span className="text-xs">{icon}</span>{label}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button onClick={toggleTheme}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm transition-all hover:opacity-80"
            style={{ background: "var(--bg)", color: "var(--muted)" }}
            title="Toggle theme">
            {dark ? "☀️" : "🌙"}
          </button>
          <button onClick={handleLogout}
            className="hidden md:block px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
            style={{ background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
            Sign out
          </button>
          {/* Mobile hamburger */}
          <button className="md:hidden w-8 h-8 flex flex-col items-center justify-center gap-1"
            onClick={() => setMenu(!menuOpen)}>
            {[0,1,2].map(i => (
              <span key={i} className="block w-5 h-0.5 rounded-full transition-all"
                style={{ background: "var(--muted)" }} />
            ))}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden border-t px-4 py-3 space-y-1 animate-fade-in"
          style={{ borderColor: "var(--border)", background: "var(--surface)" }}>
          {NAV_LINKS.map(({ href, label, icon }) => (
            <Link key={href} href={href} onClick={() => setMenu(false)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
              style={{ color: pathname.startsWith(href) ? "var(--olive)" : "var(--muted)" }}>
              {icon} {label}
            </Link>
          ))}
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 text-sm"
            style={{ color: "var(--muted)" }}>
            Sign out
          </button>
        </div>
      )}
    </nav>
  );
}
