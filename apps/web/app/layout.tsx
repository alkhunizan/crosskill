import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "crosskill — one skill, every tool",
  description:
    "Write AI coding-agent skills once. Compile to Claude Code, Cursor, Codex, Windsurf, Aider, OpenCode, Gemini CLI. Free, open source, no install.",
  openGraph: {
    title: "crosskill",
    description: "One skill, every tool. Free, open source.",
    url: "https://crosskill.dev",
    siteName: "crosskill",
  },
  twitter: { card: "summary_large_image", creator: "@azizme_com" },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
