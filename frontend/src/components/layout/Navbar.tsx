/**
 * Navbar component for MailMind.
 * Sticky top navigation with logo, page links, dark/light theme toggle,
 * and sign out button. Active page is highlighted. Theme toggle persists
 * user preference to localStorage via next-themes.
 */
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Navbar() {
  const { logout }             = useAuth();
  const pathname               = usePathname();
  const { theme, setTheme }    = useTheme();
  const [mounted, setMounted]  = useState(false);

  useEffect(() => setMounted(true), []);

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`btn-ghost text-sm ${pathname === href ? "font-semibold" : ""}`}
      style={pathname === href ? { backgroundColor: "var(--border)" } : {}}
    >
      {label}
    </Link>
  );

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <nav
      className="sticky top-0 z-20 backdrop-blur-sm border-b"
      style={{ backgroundColor: "var(--surface)", borderColor: "var(--border)" }}
    >
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2 group">
          <span className="text-xl">✉</span>
          <span
            className="font-serif font-bold text-lg transition-colors"
            style={{ color: "var(--primary)" }}
          >
            MailMind
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLink("/dashboard", "Dashboard")}
          {navLink("/memory", "◈ Memory")}
          {navLink("/settings", "Settings")}

          {/* Theme toggle */}
          {mounted && (
            <button
              onClick={toggleTheme}
              className="btn-ghost text-sm w-9 h-9 flex items-center justify-center rounded-lg ml-1"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? "☀" : "☾"}
            </button>
          )}

          <button
            onClick={logout}
            className="btn-ghost text-sm ml-1"
            style={{ color: "var(--text-muted)" }}
          >
            Sign out
          </button>
        </div>
      </div>
    </nav>
  );
}
