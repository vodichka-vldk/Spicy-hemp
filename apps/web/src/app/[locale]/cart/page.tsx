import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CartView } from "@/components/CartView";
import { catalogFor } from "@/lib/catalog";
import { isLocale, t } from "@/lib/i18n";
import { currencyFor } from "@/lib/shop";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: t(locale, "cart_title"), robots: { index: false } } : {};
}

export default async function Cart({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return <CartView locale={locale} currency={currencyFor(locale)} catalog={catalogFor(locale)} />;
}
