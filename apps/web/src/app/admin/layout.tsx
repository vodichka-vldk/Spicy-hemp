import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { SESSION_COOKIE, adminConfigured, verifySession } from "@/lib/admin-auth";
import { logout } from "./auth-actions";
import "../globals.css";

export const metadata: Metadata = { title: "Адмінка", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Сьогодні", icon: "📋" },
  { href: "/admin/orders", label: "Замовлення", icon: "🛒" },
  { href: "/admin/catalog", label: "Каталог", icon: "🧺" },
  { href: "/admin/pots", label: "Горщики й QR", icon: "🏺" },
  { href: "/admin/reviews", label: "Відгуки", icon: "⭐" },
  { href: "/admin/analytics", label: "Аналітика", icon: "📈" },
  { href: "/admin/telegram", label: "Telegram", icon: "✈️" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const signedIn = !adminConfigured() || (await verifySession((await cookies()).get(SESSION_COOKIE)?.value));
  return (
    <html lang="uk">
      <body>
        <header className="sticky top-0 z-40 border-b border-line bg-card">
          <div className="container-x flex h-14 items-center gap-4">
            <Link href={signedIn ? "/admin" : "/"} className="font-bold text-leaf no-underline">🌿 Spicy Hemp · адмінка</Link>
            {signedIn && (
              <div className="ml-auto flex items-center gap-3 text-sm">
                <Link href="/" className="text-muted">На сайт →</Link>
                {adminConfigured() && <form action={logout}><button className="text-muted underline" type="submit">Вийти</button></form>}
              </div>
            )}
          </div>
          {signedIn && (
            <nav aria-label="Адмінка" className="container-x flex gap-1 overflow-x-auto pb-2">
              {NAV.map((n) => (<Link key={n.href} href={n.href} className="chip shrink-0 no-underline">{n.icon} {n.label}</Link>))}
            </nav>
          )}
        </header>
        <main className="container-x py-6">{children}</main>
      </body>
    </html>
  );
}
