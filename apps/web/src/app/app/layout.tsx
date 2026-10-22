import type { Metadata, Viewport } from "next";
import "../globals.css";

export const metadata: Metadata = { title: "Spicy Hemp", robots: { index: false } };
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1 };

/** Telegram Mini App shell: no site header or footer, the Telegram chrome is the navigation. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body><main className="mx-auto max-w-xl px-4 py-5">{children}</main></body>
    </html>
  );
}
