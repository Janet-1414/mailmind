"use client";
// src/components/layout/PageWrapper.tsx
import Navbar from "./Navbar";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className = "" }: Props) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: "var(--bg)" }}>
      <Navbar />
      <main className={`flex-1 max-w-7xl mx-auto w-full px-4 py-6 ${className}`}>
        {children}
      </main>
    </div>
  );
}
