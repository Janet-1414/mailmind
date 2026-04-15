/**
 * ThemeProvider wraps the app with next-themes for light/dark mode support.
 * Uses the "class" attribute strategy so Tailwind dark: variants work correctly.
 * Theme preference is persisted to localStorage automatically by next-themes.
 */
"use client";
import { ThemeProvider as NextThemesProvider } from "next-themes";
import { ReactNode } from "react";

export default function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      disableTransitionOnChange={false}
    >
      {children}
    </NextThemesProvider>
  );
}
