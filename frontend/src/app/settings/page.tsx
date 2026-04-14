"use client";
// src/app/settings/page.tsx
import { useEffect, useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import { authService } from "@/services/AuthService";
import { inboxService } from "@/services/AllServices";
import { http } from "@/services/HttpClient";
import type { User } from "@/types";

export default function SettingsPage() {
  const [user, setUser]                       = useState<User | null>(null);
  const [dark, setDark]                       = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm]     = useState("");
  const [deleting, setDeleting]               = useState(false);

  useEffect(() => {
    authService.me().then(setUser).catch(() => {});
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
  };

  const connectGmail = async () => {
    const { auth_url } = await inboxService.getGmailAuthUrl();
    window.location.href = auth_url;
  };

  const connectOutlook = async () => {
    const { auth_url } = await inboxService.getOutlookAuthUrl();
    window.location.href = auth_url;
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await http.delete("/auth/me");
      authService.logout();
    } catch {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div
      className="p-5 rounded-2xl shadow-card"
      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
    >
      <h2 className="font-semibold mb-4" style={{ color: "var(--text)" }}>
        {title}
      </h2>
      {children}
    </div>
  );

  return (
    <PageWrapper>
      <div className="max-w-2xl mx-auto space-y-6">

        <div>
          <h1 className="font-display text-3xl font-bold" style={{ color: "var(--olive)" }}>
            Settings
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
            Manage your account and integrations.
          </p>
        </div>

        {/* Account info */}
        <Section title="Account">
          {user ? (
            <div className="space-y-2 text-sm">
              {[
                { label: "Name",         value: user.full_name || "—" },
                { label: "Email",        value: user.email },
                { label: "Member since", value: new Date(user.created_at).toLocaleDateString() },
                { label: "Status",       value: user.is_active ? "Active" : "Inactive" },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1"
                  style={{ borderBottom: "1px solid var(--border)" }}>
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <span className="font-medium" style={{ color: "var(--text)" }}>{value}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 rounded-lg animate-pulse"
                  style={{ background: "var(--border)" }} />
              ))}
            </div>
          )}
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Dark Mode</p>
              <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                Toggle between light and dark theme
              </p>
            </div>
            <div
              onClick={toggleTheme}
              className="w-12 h-6 rounded-full relative transition-all cursor-pointer"
              style={{ background: dark ? "var(--sage)" : "var(--border)" }}
            >
              <div
                className="w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all shadow-sm"
                style={{ left: dark ? "26px" : "2px" }}
              />
            </div>
          </div>
        </Section>

        {/* Email integrations */}
        <Section title="Email Integrations">
          <div className="space-y-3">
            {[
              { name: "Gmail",   icon: "📧", desc: "Connect your Google account to fetch and send emails.",          onConnect: connectGmail   },
              { name: "Outlook", icon: "📮", desc: "Connect your Microsoft account for Outlook integration.",        onConnect: connectOutlook },
            ].map(({ name, icon, desc, onConnect }) => (
              <div key={name} className="flex items-center justify-between p-3 rounded-xl"
                style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{icon}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text)" }}>{name}</p>
                    <p className="text-xs" style={{ color: "var(--muted)" }}>{desc}</p>
                  </div>
                </div>
                <button onClick={onConnect}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                  style={{ background: "var(--olive)", color: "#F8F3E1" }}>
                  Connect
                </button>
              </div>
            ))}
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone">
          <div className="space-y-3">

            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text)" }}>Sign Out</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Sign out of your account on this device.
                </p>
              </div>
              <button onClick={() => authService.logout()}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: "#fee2e2", color: "#dc2626", border: "1px solid #fecaca" }}>
                Sign Out
              </button>
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl"
              style={{ background: "#fff5f5", border: "1px solid #fecaca" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "#dc2626" }}>Delete Account</p>
                <p className="text-xs mt-0.5" style={{ color: "var(--muted)" }}>
                  Permanently delete your account and all data. Cannot be undone.
                </p>
              </div>
              <button onClick={() => setShowDeleteModal(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all hover:opacity-90"
                style={{ background: "#dc2626", color: "#fff" }}>
                Delete
              </button>
            </div>

          </div>
        </Section>

      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ background: "rgba(0,0,0,0.6)" }}>
          <div className="w-full max-w-md p-6 rounded-2xl shadow-card-hover animate-slide-up"
            style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>

            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">⚠️</span>
              <h3 className="font-display text-xl font-bold" style={{ color: "#dc2626" }}>
                Delete Account
              </h3>
            </div>

            <p className="text-sm mb-3" style={{ color: "var(--muted)" }}>
              This will permanently delete:
            </p>

            <ul className="text-sm mb-4 space-y-1" style={{ color: "var(--text)" }}>
              {[
                "Your account and profile",
                "All email threads and logs",
                "All stored memories",
                "All saved templates",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2">
                  <span style={{ color: "#dc2626" }}>✕</span> {item}
                </li>
              ))}
            </ul>

            <p className="text-sm mb-2 font-medium" style={{ color: "var(--text)" }}>
              Type <span className="font-bold">DELETE</span> to confirm:
            </p>

            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-4"
              style={{
                background: "var(--bg)",
                border: `1.5px solid ${deleteConfirm === "DELETE" ? "#dc2626" : "var(--border)"}`,
                color: "var(--text)",
              }}
              placeholder="Type DELETE here"
            />

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirm !== "DELETE" || deleting}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all disabled:opacity-40"
                style={{ background: "#dc2626", color: "#fff" }}>
                {deleting ? "Deleting…" : "Yes, delete everything"}
              </button>
              <button
                onClick={() => { setShowDeleteModal(false); setDeleteConfirm(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
                style={{ background: "var(--bg)", color: "var(--muted)", border: "1px solid var(--border)" }}>
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </PageWrapper>
  );
}
