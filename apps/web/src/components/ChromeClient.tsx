"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Header as DsHeader, SegmentedControl, TabBar as DsTabBar } from "@/ds";
import type { Locale } from "@/lib/types";
import { useCart } from "./CartProvider";

type Item = { href: string; label: string; icon?: string; cart?: boolean };

const isCurrent = (path: string, href: string, home: string) => (href === home ? path === home : path === href || path.startsWith(href + "/"));

/** Language switch: keeps the page and the query, changes only the locale prefix. */
function Lang({ locale }: { locale: Locale }) {
  const router = useRouter();
  const path = usePathname() ?? `/${locale}`;
  const qs = useSearchParams()?.toString();
  return (
    <SegmentedControl
      label="Language"
      value={locale}
      options={[{ value: "uk", label: "UK" }, { value: "en", label: "EN" }]}
      onChange={(v) => router.push(path.replace(/^\/(uk|en)(?=\/|$)/, `/${v}`) + (qs ? `?${qs}` : ""))}
    />
  );
}

/** Top bar. For a signed-in admin (non-secret hint cookie) the logo leads to the admin, for everyone else home. */
export function SiteHeader({ locale, brand, items, cartLabel, homeLabel }: { locale: Locale; brand: string; items: Item[]; cartLabel: string; homeLabel: string }) {
  const path = usePathname() ?? "";
  const { count, ready } = useCart();
  const [admin, setAdmin] = useState(false);
  useEffect(() => {
    try { setAdmin(document.cookie.split("; ").some((c) => c === "sh_admin_hint=1")); } catch { /* cookies blocked: public link */ }
  }, []);
  const home = `/${locale}`;
  return (
    <DsHeader
      brand={brand}
      homeHref={admin ? "/admin" : home}
      brandLabel={admin ? "Адмінка" : homeLabel}
      items={items.map((i) => ({ label: i.label, href: i.href, current: isCurrent(path, i.href, home) }))}
      end={<Suspense fallback={null}><Lang locale={locale} /></Suspense>}
      cartHref={`/${locale}/cart`}
      cartLabel={cartLabel}
      cartCount={ready && count > 0 ? count : undefined}
    />
  );
}

export function SiteTabBar({ locale, items }: { locale: Locale; items: Item[] }) {
  const path = usePathname() ?? "";
  const { count, ready } = useCart();
  const home = `/${locale}`;
  return (
    <DsTabBar
      items={items.map((i) => ({ label: i.label, icon: i.icon ?? "house", href: i.href, current: isCurrent(path, i.href, home), badge: i.cart && ready && count > 0 ? count : undefined }))}
    />
  );
}
