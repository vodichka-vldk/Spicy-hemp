import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { SESSION_COOKIE, adminConfigured, verifySession } from "@/lib/admin-auth";
import { AdminChrome } from "@/components/AdminChrome";
import { Button } from "@/ds";
import { logout } from "./auth-actions";
import "@/ds/fonts";
import "../globals.css";

export const metadata: Metadata = { title: "Адмінка", robots: { index: false } };

const NAV = [
  { href: "/admin", label: "Сьогодні", icon: "clipboard-list" },
  { href: "/admin/orders", label: "Замовлення", icon: "shopping-cart" },
  { href: "/admin/catalog", label: "Каталог", icon: "layout-grid" },
  { href: "/admin/pots", label: "Горщики й QR", icon: "qr-code" },
  { href: "/admin/owners", label: "Власники", icon: "user" },
  { href: "/admin/questions", label: "Питання", icon: "info" },
  { href: "/admin/care", label: "Графік догляду", icon: "droplet" },
  { href: "/admin/reviews", label: "Відгуки", icon: "star" },
  { href: "/admin/analytics", label: "Аналітика", icon: "chart-column" },
  { href: "/admin/telegram", label: "Telegram", icon: "bell" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const signedIn = !adminConfigured() || (await verifySession((await cookies()).get(SESSION_COOKIE)?.value));
  return (
    <html lang="uk" data-theme="light">
      <body>
        {signedIn ? (
          <AdminChrome
            items={NAV}
            end={
              <>
                <Link href="/" className="label" style={{ color: "var(--ink-muted)" }}>На сайт</Link>
                {adminConfigured() && <form action={logout}><Button size="sm" variant="ghost" type="submit">Вийти</Button></form>}
              </>
            }
          />
        ) : (
          <header className="container-x flex items-center py-4"><Link href="/" className="h3 no-underline">Spicy Hemp · адмінка</Link></header>
        )}
        <main className="container-x py-6 sh-page" style={{ background: "transparent" }}>{children}</main>
      </body>
    </html>
  );
}
