/**
 * MailMind account settings page.
 * Allows the user to update profile, change password, clear all Pinecone
 * memory, and delete their account. Dangerous actions require confirmation
 * via a modal popup. Styled with Midnight Slate theme variables.
 */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import { AuthService } from "@/services/AuthService";
import { MemoryService } from "@/services/MemoryService";
import Navbar from "@/components/layout/Navbar";
import PageWrapper from "@/components/layout/PageWrapper";

const authService   = new AuthService();
const memoryService = new MemoryService();

interface ConfirmModalProps {
  title:        string;
  message:      string;
  confirmLabel: string;
  onConfirm:    () => void;
  onCancel:     () => void;
}

function ConfirmModal({ title, message, confirmLabel, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 backdrop-blur-sm"
        style={{ backgroundColor: "rgba(15,23,42,0.5)" }}
        onClick={onCancel}
      />
      <div
        className="relative rounded-2xl shadow-strong p-8 max-w-sm w-full mx-4"
        style={{ backgroundColor: "var(--surface)", border: "1px solid var(--border)" }}
      >
        <h3 className="font-serif font-bold text-xl mb-2" style={{ color: "var(--primary)" }}>{title}</h3>
        <p className="font-sans text-sm leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>{message}</p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="btn-ghost text-sm px-4 py-2">Cancel</button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-sans font-medium text-white transition-colors"
            style={{ backgroundColor: "#dc2626" }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const [name,            setName]            = useState("");
  const [email,           setEmail]           = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [profileMsg,  setProfileMsg]  = useState<{ text: string; ok: boolean } | null>(null);
  const [passwordMsg, setPasswordMsg] = useState<{ text: string; ok: boolean } | null>(null);
  const [memoryMsg,   setMemoryMsg]   = useState<{ text: string; ok: boolean } | null>(null);

  const [savingProfile,   setSavingProfile]   = useState(false);
  const [savingPassword,  setSavingPassword]  = useState(false);
  const [clearingMemory,  setClearingMemory]  = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [showClearModal,  setShowClearModal]  = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (user) { setName(user.name || ""); setEmail(user.email || ""); }
  }, [user]);

  const handleSaveProfile = async () => {
    if (!name.trim()) { setProfileMsg({ text: "Name cannot be empty.", ok: false }); return; }
    setSavingProfile(true);
    try {
      await authService.updateProfile({ name, email });
      setProfileMsg({ text: "Profile updated successfully.", ok: true });
    } catch (e: unknown) {
      setProfileMsg({ text: e instanceof Error ? e.message : "Failed to update profile.", ok: false });
    } finally { setSavingProfile(false); }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMsg({ text: "Please fill in all password fields.", ok: false }); return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ text: "New passwords do not match.", ok: false }); return;
    }
    if (newPassword.length < 8) {
      setPasswordMsg({ text: "New password must be at least 8 characters.", ok: false }); return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword({ current_password: currentPassword, new_password: newPassword });
      setPasswordMsg({ text: "Password updated successfully.", ok: true });
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (e: unknown) {
      setPasswordMsg({ text: e instanceof Error ? e.message : "Failed to update password.", ok: false });
    } finally { setSavingPassword(false); }
  };

  const handleClearMemory = async () => {
    setShowClearModal(false);
    setClearingMemory(true);
    try {
      await memoryService.clearAll();
      setMemoryMsg({ text: "All memory cleared successfully.", ok: true });
    } catch {
      setMemoryMsg({ text: "Failed to clear memory.", ok: false });
    } finally { setClearingMemory(false); }
  };

  const handleDeleteAccount = async () => {
    setShowDeleteModal(false);
    setDeletingAccount(true);
    try {
      await authService.deleteAccount();
      logout();
      router.push("/");
    } catch { setDeletingAccount(false); }
  };

  const msgStyle = (ok: boolean) => ({ color: ok ? "var(--accent)" : "#ef4444" });

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg)" }}>
      <Navbar />

      {showClearModal && (
        <ConfirmModal
          title="Clear all memory?"
          message="This permanently deletes all stored memories. The agent will start fresh with no context about your style or preferences."
          confirmLabel="Yes, clear memory"
          onConfirm={handleClearMemory}
          onCancel={() => setShowClearModal(false)}
        />
      )}
      {showDeleteModal && (
        <ConfirmModal
          title="Delete your account?"
          message="This permanently deletes your account, all threads, replies, and memory. This action cannot be undone."
          confirmLabel="Yes, delete my account"
          onConfirm={handleDeleteAccount}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <PageWrapper className="max-w-4xl">
        <div className="mb-8">
          <Link href="/dashboard" className="btn-ghost text-sm inline-flex items-center gap-1 mb-4 -ml-2">
            ← Back to dashboard
          </Link>
          <h1 className="font-serif text-3xl font-bold" style={{ color: "var(--primary)" }}>Account Settings</h1>
          <p className="font-sans mt-1" style={{ color: "var(--text-muted)" }}>Manage your profile and preferences.</p>
        </div>

        <div className="space-y-6 max-w-2xl">
          {/* Profile */}
          <div className="card space-y-4">
            <h2 className="font-serif font-semibold" style={{ color: "var(--primary)" }}>Profile</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="label">Full name</label>
                <input type="text" className="input-field" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="label">Email address</label>
                <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
            </div>
            {profileMsg && <p className="text-sm font-sans" style={msgStyle(profileMsg.ok)}>{profileMsg.ok ? "✓" : "⚠"} {profileMsg.text}</p>}
            <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-primary text-sm">
              {savingProfile ? "Saving…" : "Save changes"}
            </button>
          </div>

          {/* Password */}
          <div className="card space-y-4">
            <h2 className="font-serif font-semibold" style={{ color: "var(--primary)" }}>Change Password</h2>
            <div className="space-y-3">
              <div>
                <label className="label">Current password</label>
                <input type="password" className="input-field" placeholder="••••••••" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
              <div>
                <label className="label">New password</label>
                <input type="password" className="input-field" placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div>
                <label className="label">Confirm new password</label>
                <input type="password" className="input-field" placeholder="••••••••" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>
            {passwordMsg && <p className="text-sm font-sans" style={msgStyle(passwordMsg.ok)}>{passwordMsg.ok ? "✓" : "⚠"} {passwordMsg.text}</p>}
            <button onClick={handleChangePassword} disabled={savingPassword} className="btn-primary text-sm">
              {savingPassword ? "Updating…" : "Update password"}
            </button>
          </div>

          {/* Danger zone */}
          <div className="card space-y-3" style={{ borderColor: "#fecaca" }}>
            <h2 className="font-serif font-semibold" style={{ color: "#dc2626" }}>Danger Zone</h2>
            <p className="font-sans text-sm" style={{ color: "var(--text-muted)" }}>These actions are permanent and cannot be undone.</p>
            {memoryMsg && <p className="text-sm font-sans" style={msgStyle(memoryMsg.ok)}>{memoryMsg.ok ? "✓" : "⚠"} {memoryMsg.text}</p>}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setShowClearModal(true)}
                disabled={clearingMemory}
                className="px-4 py-2 rounded-xl border-2 text-sm font-sans font-medium transition-colors disabled:opacity-50"
                style={{ borderColor: "#fecaca", color: "#dc2626" }}
              >
                {clearingMemory ? "Clearing…" : "Clear all memory"}
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                disabled={deletingAccount}
                className="px-4 py-2 rounded-xl border-2 text-sm font-sans font-medium transition-colors disabled:opacity-50"
                style={{ borderColor: "#fca5a5", backgroundColor: "#fef2f2", color: "#b91c1c" }}
              >
                {deletingAccount ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      </PageWrapper>
    </div>
  );
}
