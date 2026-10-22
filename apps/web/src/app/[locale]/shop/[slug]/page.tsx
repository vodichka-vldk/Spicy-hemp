import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion } from "@/components/HerbParts";
import { GardenArt } from "@/components/GardenArt";
import { ProductBuy } from "@/components/ProductGallery";
import { cardSections, productFacts } from "@/lib/card";
import { getHerb } from "@/lib/content";
import { isLocale, locales, t } from "@/lib/i18n";
import { averageRating, isPublic, reviewPhotoUrl } from "@/lib/reviews";
import { store } from "@/lib/store";
import { currencyFor, formatMoney, getProduct, priceMinor, products, productTitle } from "@/lib/shop";

/** Static pages refreshed every few minutes so newly approved reviews appear without a redeploy. */
export const revalidate = 300;

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
  const basket = p.kind === "set";
  const price = formatMoney(priceMinor(p.priceUah, cur), cur, locale);
  const facts = productFacts(herbs, locale);
  const sections = cardSections(p.slug, locale);
  const reviews = (await store().listReviews({ product: p.slug, status: "approved" }).catch(() => [])).filter(isPublic);
  const avg = averageRating(reviews);
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productTitle(p, locale),
    ...(avg ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg, reviewCount: reviews.length } } : {}),
    offers: { "@type": "Offer", price: (priceMinor(p.priceUah, cur) / 100).toFixed(2), priceCurrency: cur, availability: "https://schema.org/InStock" },
  };
  const steps = [1, 2, 3].map((n) => ({ n, title: t(locale, `next_${n}_t` as "next_1_t"), text: t(locale, `next_${n}_d` as "next_1_d") }));
  return (
    <div className="container-x py-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href={`/${locale}/shop`} className="hover:text-leaf">{t(locale, "nav_shop")}</Link> / <span>{productTitle(p, locale)}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:items-start">
        <div className="md:sticky md:top-24"><ProductBuy slug={p.slug} colors={herbs.map((h) => h.color)} locale={locale} /></div>

        <div className="space-y-8">
          <header>
            <h1 className="text-4xl font-bold text-leaf">{productTitle(p, locale)}</h1>
            {avg && <p className="mt-1"><a href="#reviews" className="text-amber-600 no-underline" aria-label={`${avg} / 5`}>★ {avg}</a> <a href="#reviews" className="text-sm text-muted">({reviews.length})</a></p>}
            <p className="mt-2 text-3xl font-bold">{price}</p>
            <p className="text-sm text-muted">{t(locale, "price_note")} · {t(locale, "in_stock")}</p>
            <p className="mt-4 text-lg">{p.blurb ? p.blurb[locale] : herbs[0].tagline[locale]}</p>
            <p className="mt-2 text-sm text-muted">🌱 {t(locale, "buy_now_note")}</p>
          </header>

          <ul className="grid grid-cols-2 gap-3" aria-label="Facts">
            {facts.map((f) => (
              <li key={f.label} className="card p-3">
                <span aria-hidden>{f.icon}</span> <span className="text-xs uppercase tracking-wide text-muted">{f.label}</span>
                <p className="mt-1 font-semibold">{f.value}</p>
              </li>
            ))}
          </ul>

          <section>
            <h2 className="text-xl font-bold">{t(locale, "includes")}</h2>
            <ul className="mt-3 grid gap-3">
              {herbs.map((h) => (
                <li key={h.slug}>
                  <Link href={`/${locale}/plants/${h.slug}`} className="card flex items-center gap-3 p-3 no-underline">
                    <span className="block h-16 w-16 shrink-0 overflow-hidden rounded-xl"><GardenArt colors={[h.color]} /></span>
                    <span className="min-w-0">
                      <span className="block font-semibold text-ink">{h.names[locale]} <span className="text-sm font-normal italic text-muted">{h.latin}</span></span>
                      <span className="block text-sm text-muted">{h.tagline[locale]}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-xl font-bold">{t(locale, "product_care_title")}</h2>
            <div className="space-y-2">{sections.map((s, i) => (<Accordion key={s.key} title={s.title} open={i === 0}><p>{s.body}</p></Accordion>))}</div>
          </section>

          {reviews.length > 0 && (
            <section aria-labelledby="reviews">
              <h2 id="reviews" className="text-xl font-bold">{t(locale, "reviews_title")}</h2>
              <p className="mt-1 text-sm text-muted">{t(locale, "reviews_count", { n: reviews.length, avg: avg ?? 0 })}</p>
              <ul className="mt-3 space-y-3">
                {reviews.map((r) => (
                  <li key={r.id} className="card p-4">
                    <p className="text-amber-600" role="img" aria-label={`${r.rating} / 5`}>{"★".repeat(r.rating)}<span className="text-line">{"★".repeat(5 - r.rating)}</span></p>
                    {r.body && <p className="mt-2">{r.body}</p>}
                    {r.photos.length > 0 && (
                      <ul className="mt-3 flex gap-2">
                        {r.photos.map((ph) => { const url = reviewPhotoUrl(ph); return url ? (<li key={ph}><img src={url} alt="" loading="lazy" className="h-20 w-20 rounded-xl object-cover" /></li>) : null; })}
                      </ul>
                    )}
                    {r.authorName && <p className="mt-2 text-sm text-muted">— {r.authorName}</p>}
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">{t(locale, "reviews_note")}</p>
            </section>
          )}

          {basket && (
            <section>
              <h2 className="mb-3 text-xl font-bold">{t(locale, "product_next_title")}</h2>
              <ol className="space-y-3">
                {steps.map((s) => (
                  <li key={s.n} className="flex gap-3">
                    <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-soft font-bold text-leaf">{s.n}</span>
                    <span><span className="block font-semibold">{s.title}</span><span className="text-sm text-muted">{s.text}</span></span>
                  </li>
                ))}
              </ol>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
