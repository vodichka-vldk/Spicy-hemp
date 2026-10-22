import Link from "next/link";
import { Suspense } from "react";
import type { Locale } from "@/lib/types";
import { t } from "@/lib/i18n";
import { CartBadge } from "./CartBadge";
import { LangSwitch } from "./LangSwitch";


export function Header({ locale }: { locale: Locale }) {
  const items = [
    { href: `/${locale}/plants`, label: t(locale, "nav_plants") },
    { href: `/${locale}/shop`, label: t(locale, "nav_shop") },
    { href: `/${locale}/guides`, label: t(locale, "nav_guides") },
    { href: `/${locale}/about`, label: t(locale, "nav_about") },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/90 backdrop-blur">
      <div className="container-x flex h-14 items-center justify-between gap-3">
        <Link href={`/${locale}`} className="font-display text-xl font-bold text-leaf no-underline" aria-label={t(locale, "nav_home")}>
          🌿 {t(locale, "brand")}
        </Link>
        <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
          {items.map((i) => (
            <Link key={i.href} href={i.href} className="font-medium text-ink no-underline hover:text-leaf">{i.label}</Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Suspense fallback={null}><LangSwitch locale={locale} /></Suspense>
          <Link href={`/${locale}/cart`} className="chip hidden md:inline-flex" aria-label={t(locale, "nav_cart")}>
            🛒 {t(locale, "nav_cart")}<CartBadge />
          </Link>
        </div>
      </div>
    </header>
  );
}

export function BottomNav({ locale }: { locale: Locale }) {
  const items = [
    { href: `/${locale}`, icon: "🏠", label: t(locale, "nav_home") },
    { href: `/${locale}/plants`, icon: "🌱", label: t(locale, "nav_plants") },
    { href: `/${locale}/shop`, icon: "🏺", label: t(locale, "nav_shop") },
    { href: `/${locale}/cart`, icon: "🛒", label: t(locale, "nav_cart"), badge: true },
  ];
  return (
    <nav aria-label="Mobile" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <ul className="grid grid-cols-4">
        {items.map((i) => (
          <li key={i.href}>
            <Link href={i.href} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium text-ink no-underline">
              <span aria-hidden className="text-xl leading-none">{i.icon}</span>
              <span>{i.label}{i.badge ? <CartBadge /> : null}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Footer({ locale }: { locale: Locale }) {
  const links = [
    ["delivery", t(locale, "delivery_page")],
    ["warranty", t(locale, "warranty_page")],
    ["privacy", t(locale, "privacy_page")],
    ["terms", t(locale, "terms_page")],
    ["contact", t(locale, "contact_page")],
  ] as const;
  return (
    <footer className="mt-16 border-t border-line bg-soft">
      <div className="container-x grid gap-8 py-10 md:grid-cols-3">
        <div>
          <p className="font-display text-xl font-bold text-leaf">🌿 {t(locale, "brand")}</p>
          <p className="mt-2 max-w-xs text-muted">{t(locale, "footer_about")}</p>
        </div>
        <nav aria-label="Help">
          <p className="font-semibold">{t(locale, "footer_help")}</p>
          <ul className="mt-2 space-y-1">
            {links.map(([slug, label]) => (
              <li key={slug}><Link href={`/${locale}/${slug}`} className="text-muted hover:text-leaf">{label}</Link></li>
            ))}
          </ul>
        </nav>
        <p className="text-sm text-muted">{t(locale, "disclaimer")}</p>
      </div>
    </footer>
  );
}
