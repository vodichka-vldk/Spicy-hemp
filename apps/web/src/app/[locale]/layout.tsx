import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import { CartProvider } from "@/components/CartProvider";
import { BottomNav, Footer, Header } from "@/components/SiteChrome";
import { isLocale, locales, t } from "@/lib/i18n";
import { siteUrl } from "@/lib/payments";
import "../globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#faf7f0" }, { media: "(prefers-color-scheme: dark)", color: "#131916" }],
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  return {
    metadataBase: new URL(siteUrl()),
    title: { default: `${t(locale, "brand")}: ${t(locale, "hero_title")}`, template: `%s · ${t(locale, "brand")}` },
    description: t(locale, "hero_text"),
    manifest: "/manifest.webmanifest",
    openGraph: { type: "website", siteName: t(locale, "brand"), locale: locale === "uk" ? "uk_UA" : "en_US" },
  };
}

export default async function LocaleLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <html lang={locale}>
      <body className="pb-nav">
        <a href="#main" className="skip">{t(locale, "skip")}</a>
        <CartProvider>
          <Header locale={locale} />
          <main id="main">{children}</main>
          <Footer locale={locale} />
          <BottomNav locale={locale} />
        </CartProvider>
      </body>
    </html>
  );
}
