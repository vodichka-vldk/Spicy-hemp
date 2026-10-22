import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductBuy } from "@/components/ProductGallery";
import { getHerb } from "@/lib/content";
import { isLocale, locales, t } from "@/lib/i18n";
import { currencyFor, formatMoney, getProduct, priceMinor, products, productTitle } from "@/lib/shop";

export function generateStaticParams() {
  return locales.flatMap((locale) => products.map((p) => ({ locale, slug: p.slug })));
}

type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const p = getProduct(slug);
  return isLocale(locale) && p ? { title: productTitle(p, locale) } : {};
}

export default async function ProductPage({ params }: P) {
  const { locale, slug } = await params;
  const p = getProduct(slug);
  if (!isLocale(locale) || !p) notFound();
  const cur = currencyFor(locale);
  const herbs = p.herbs.map((s) => getHerb(s)!);
  const price = formatMoney(priceMinor(p.priceUah, cur), cur, locale);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productTitle(p, locale),
    offers: { "@type": "Offer", price: (priceMinor(p.priceUah, cur) / 100).toFixed(2), priceCurrency: cur, availability: "https://schema.org/InStock" },
  };
  return (
    <div className="container-x py-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href={`/${locale}/shop`} className="hover:text-leaf">{t(locale, "nav_shop")}</Link> / <span>{productTitle(p, locale)}</span>
      </nav>
      <div className="grid gap-8 md:grid-cols-2">
        <div><ProductBuy slug={p.slug} colors={herbs.map((h) => h.color)} locale={locale} /></div>
        <div>
          <h1 className="text-4xl font-bold text-leaf">{productTitle(p, locale)}</h1>
          <p className="mt-3 text-3xl font-bold">{price}</p>
          <p className="text-sm text-muted">{t(locale, "price_note")} · {t(locale, "in_stock")}</p>
          {p.blurb && <p className="mt-4 text-lg">{p.blurb[locale]}</p>}
          {p.kind === "pot" && <p className="mt-4 text-lg">{herbs[0].tagline[locale]}</p>}

          <h2 className="mt-8 text-xl font-bold">{t(locale, "includes")}</h2>
          <ul className="mt-2 divide-y divide-line">
            {herbs.map((h) => (
              <li key={h.slug} className="flex items-center justify-between gap-3 py-3">
                <span><span className="font-semibold">{h.names[locale]}</span> <span className="text-sm italic text-muted">{h.latin}</span></span>
                <Link href={`/${locale}/plants/${h.slug}`} className="shrink-0 text-sm font-semibold text-leaf">{t(locale, "cta_plants")} →</Link>
              </li>
            ))}
          </ul>
          <ul className="mt-6 space-y-2 text-muted">
            <li>🏺 {t(locale, "pot_label")}</li>
            <li>📱 {t(locale, "how_2_d")}</li>
            <li>🌱 {t(locale, "warranty_title")}: {t(locale, "warranty_text")}</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
