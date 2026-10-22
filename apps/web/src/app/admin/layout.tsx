import type { Metadata } from "next";
import Link from "next/link";
import "../globals.css";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-line bg-card">
          <nav className="container-x flex h-14 items-center gap-5" aria-label="Admin">
            <strong className="text-leaf">🌿 Admin</strong>
            <Link href="/admin">Analytics</Link>
            <Link href="/admin/orders">Orders</Link>
            <Link href="/admin/pots">Pots &amp; QR</Link>
            <Link href="/admin/reviews">Reviews</Link>
            <Link href="/" className="ml-auto text-muted">Site →</Link>
          </nav>
        </header>
        <main className="container-x py-8">{children}</main>
      </body>
    </html>
  );
}
