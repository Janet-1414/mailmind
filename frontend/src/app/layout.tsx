/**
 * MailMind root layout.
 * Applies global fonts (Playfair Display and DM Sans from Google Fonts),
 * sets the page metadata, wraps all pages with ThemeProvider for
 * light/dark mode support, and provides the base HTML structure.
 */
import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import ThemeProvider from "@/providers/ThemeProvider";

export const metadata: Metadata = {
  title:       "MailMind — AI Email Reply Agent",
  description: "Craft perfect email replies with AI, memory, and your personal tone.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
