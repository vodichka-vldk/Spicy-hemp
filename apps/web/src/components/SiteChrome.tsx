import { Footer as DsFooter } from "@/ds";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { SiteHeader, SiteTabBar } from "./ChromeClient";

export function Header({ locale }: { locale: Locale }) {
  const items = [
    { href: `/${locale}/plants`, label: t(locale, "nav_plants") },
    { href: `/${locale}/shop`, label: t(locale, "nav_shop") },
    { href: `/${locale}/guides`, label: t(locale, "nav_guides") },
    { href: `/${locale}/about`, label: t(locale, "nav_about") },
  ];
  return <SiteHeader locale={locale} brand={t(locale, "brand")} items={items} cartLabel={t(locale, "nav_cart")} homeLabel={t(locale, "nav_home")} />;
}

export function BottomNav({ locale }: { locale: Locale }) {
  const items = [
    { href: `/${locale}`, icon: "house", label: t(locale, "nav_home") },
    { href: `/${locale}/plants`, icon: "sprout", label: t(locale, "nav_plants") },
    { href: `/${locale}/shop`, icon: "flower-2", label: t(locale, "nav_shop") },
    { href: `/${locale}/cart`, icon: "shopping-cart", label: t(locale, "nav_cart"), cart: true },
  ];
  return <SiteTabBar locale={locale} items={items} />;
}

export function Footer({ locale }: { locale: Locale }) {
  const links = (["delivery", "warranty", "privacy", "terms", "contact"] as const).map((slug) => ({ label: t(locale, `${slug}_page` as "delivery_page"), href: `/${locale}/${slug}` }));
  return <DsFooter brand={t(locale, "brand")} about={t(locale, "footer_about")} helpTitle={t(locale, "footer_help")} links={links} note={t(locale, "disclaimer")} />;
}
