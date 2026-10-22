import { AddToCart } from "@/components/AddToCart";
import { GardenArt } from "@/components/GardenArt";
import { ProductImage } from "@/components/ProductGallery";
import { Accordion, Alert, Breadcrumbs, FactTile, Grid, PlantCard, PlantHero, Rating, ReviewCard } from "@/ds";
import { cardSections, productFacts } from "@/lib/card";
import { getHerb } from "@/lib/content";
import { t } from "@/lib/i18n";
import { photoUrl } from "@/lib/media";
import { averageRating, isPublic, reviewPhotoUrl } from "@/lib/reviews";
import { store } from "@/lib/store";
import { currencyFor, formatMoney, priceMinor, productTitle, type Product } from "@/lib/shop";
import type { Locale } from "@/lib/types";

/** The product page body; `preview` shows a draft to the admin (no buy button, no structured data). */
export async function ProductView({ p, locale, preview = false }: { p: Product; locale: Locale; preview?: boolean }) {
  const cur = currencyFor(locale);
  const herbs = p.herbs.map((s) => getHerb(s)!);
  const basket = p.kind === "set";
  const price = formatMoney(priceMinor(p.priceUah, cur), cur, locale);
  const facts = productFacts(herbs, locale);
  const sections = cardSections(p.slug, locale, {}, p);
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
  const title = productTitle(p, locale);
  const single = herbs.length === 1 ? herbs[0] : null;
  return (
    <div className="container-x py-6 md:py-10">
      {!preview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />}
      <div className="sh-stack-lg">
        <div className="sh-hide-mobile">
          <Breadcrumbs items={[{ label: t(locale, "nav_shop"), href: `/${locale}/shop` }, { label: title }]} />
        </div>

        <PlantHero
          name={title}
          latin={single?.latin}
          tagline={p.blurb ? p.blurb[locale] : herbs[0].tagline[locale]}
          badges={[{ label: t(locale, p.stockMode === "in_stock" ? "in_stock" : "made_to_order"), tone: "success", icon: "circle-check" }]}
          image={<ProductImage colors={herbs.map((h) => h.color)} photos={(p.photos ?? []).map(photoUrl)} alt={title} />}
          price={price}
          priceNote={t(locale, "price_note")}
        >
          <div className="sh-stack" style={{ marginTop: 12 }}>
            {avg && <a href="#reviews" className="no-underline" aria-label={`${avg} / 5`}><Rating value={avg} count={reviews.length} /></a>}
            {!preview && <AddToCart slug={p.slug} locale={locale} />}
          </div>
        </PlantHero>

        <Grid cols="facts">
          {facts.map((f) => (<FactTile key={f.label} icon={f.icon} label={f.label} value={f.value} />))}
        </Grid>

        <Alert tone="info" title={t(locale, "warranty_title")}>{t(locale, "buy_now_note")}</Alert>

        <section>
          <h2 className="mb-4">{t(locale, "includes")}</h2>
          <Grid cols="cards">
            {herbs.map((h, i) => (
              <PlantCard key={h.slug} href={`/${locale}/plants/${h.slug}`} name={h.names[locale]} latin={h.latin} tone={(["sage", "sand", "sky", "card"] as const)[i % 4]} image={<GardenArt colors={[h.color]} />} />
            ))}
          </Grid>
        </section>

        <section>
          <h2 className="mb-4">{t(locale, "product_care_title")}</h2>
          <div>{sections.map((s, i) => (<Accordion key={s.key} title={s.title} open={i === 0}><p>{s.body}</p></Accordion>))}</div>
        </section>

        {reviews.length > 0 && (
          <section aria-labelledby="reviews">
            <h2 id="reviews">{t(locale, "reviews_title")}</h2>
            <p className="mb-4 mt-1 text-muted">{t(locale, "reviews_count", { n: reviews.length, avg: avg ?? 0 })}</p>
            <Grid cols="two">
              {reviews.map((r) => (
                <div key={r.id}>
                  <ReviewCard rating={r.rating} text={r.body ?? ""} author={r.authorName ?? ""} />
                  {r.photos.length > 0 && (
                    <ul className="mt-2 flex gap-2">
                      {r.photos.map((ph) => { const url = reviewPhotoUrl(ph); return url ? (<li key={ph}>{/* eslint-disable-next-line @next/next/no-img-element */}<img src={url} alt="" loading="lazy" className="h-20 w-20 rounded-xl object-cover" /></li>) : null; })}
                    </ul>
                  )}
                </div>
              ))}
            </Grid>
            <p className="mt-2 text-xs text-muted">{t(locale, "reviews_note")}</p>
          </section>
        )}

        {basket && (
          <section>
            <h2 className="mb-4">{t(locale, "product_next_title")}</h2>
            <Grid cols="steps">
              {steps.map((s) => (
                <div key={s.n} className="sh-surface sh-stack">
                  <span className="sh-fact-icon">{s.n}</span>
                  <h3 className="title" style={{ margin: 0 }}>{s.title}</h3>
                  <p className="body sh-muted" style={{ margin: 0 }}>{s.text}</p>
                </div>
              ))}
            </Grid>
          </section>
        )}
      </div>
    </div>
  );
}
