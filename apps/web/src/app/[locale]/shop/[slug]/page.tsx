import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales, t } from "@/lib/i18n";
import { loadProducts } from "@/lib/catalog-server";
import { ProductView } from "@/components/ProductView";
import { getProduct, products, productTitle } from "@/lib/shop";

/** Static pages refreshed every few minutes so newly approved reviews appear without a redeploy. */
export const revalidate = 300;

export function generateStaticParams() {
  return locales.flatMap((locale) => products.map((p) => ({ locale, slug: p.slug })));
}

type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = getProduct(slug, await loadProducts());
  return isLocale(locale) && p?.status === "published" ? { title: productTitle(p, locale) } : {};
}

export default async function ProductPage({ params }: P) {
  const { locale, slug } = await params;
  const p = getProduct(slug, await loadProducts());
  if (!isLocale(locale) || !p || p.status !== "published") notFound();
  return <ProductView p={p} locale={locale} />;
}
