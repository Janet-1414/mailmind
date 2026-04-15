/**
 * PageWrapper component for MailMind.
 * Consistent content container used across non-dashboard pages.
 * Applies max-width, horizontal padding, and vertical spacing
 * so all pages share the same layout rhythm.
 */
"use client";
import { ReactNode } from "react";

interface PageWrapperProps {
  children:   ReactNode;
  className?: string;
}

export default function PageWrapper({ children, className = "" }: PageWrapperProps) {
  return (
    <div className={`max-w-5xl mx-auto px-6 py-10 ${className}`}>
      {children}
    </div>
  );
}
