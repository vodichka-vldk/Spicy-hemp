import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GardenArt } from "@/components/GardenArt";
import { Button, Chip, Grid, Icon, ProductCard } from "@/ds";
import { getHerb } from "@/lib/content";
import { isLocale, t } from "@/lib/i18n";
import { averageRating, isPublic } from "@/lib/reviews";
import { store } from "@/lib/store";
import { photoUrl } from "@/lib/media";
import { loadPublicProducts } from "@/lib/catalog-server";
import { currencyFor, formatMoney, priceMinor, productTitle } from "@/lib/shop";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: t(locale, "shop_title") } : {};
}

/** Refreshed every few minutes so new approved reviews show up in the ratings. */
export const revalidate = 300;

const POPULAR = ["basil", "mint", "rosemary", "thyme", "parsley", "oregano"];

export default async function Shop({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const cur = currencyFor(locale);
  const products = await loadPublicProducts();
  const approved = (await store().listReviews({ status: "approved" }).catch(() => [])).filter(isPublic);
  const rating = (slug: string) => { const r = approved.filter((x) => x.product === slug); const avg = averageRating(r); return avg ? { avg, n: r.length } : null; };
  const baskets = products.filter((p) => p.kind === "set");
  const plants = POPULAR.map((s) => products.find((p) => p.slug === s)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const Card = ({ slug, tone }: { slug: string; tone: "card" | "sage" | "sand" | "sky" }) => {
    const p = products.find((x) => x.slug === slug)!;
    const herbs = p.herbs.map((s) => getHerb(s)!);
    const r = rating(p.slug);
    return (
      <ProductCard
        href={`/${locale}/shop/${p.slug}`}
        title={p.kind === "set" ? productTitle(p, locale) : herbs[0].names[locale]}
        subtitle={p.kind === "set" ? herbs.map((h) => h.names[locale]).join(" · ") : herbs[0].tagline[locale]}
        price={formatMoney(priceMinor(p.priceUah, cur), cur, locale)}
        tone={tone}
        rating={r?.avg}
        ratingCount={r?.n}
        image={p.photos?.[0] ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={photoUrl(p.photos[0])} alt="" loading="lazy" className="h-full w-full object-cover" /> : <GardenArt colors={herbs.map((h) => h.color)} />}
      />
    );
  };
  const tones = ["card", "sage", "sand", "sky"] as const;
  return (
    <div className="container-x sh-stack-lg py-8">
      <div className="sh-stack">
        <h1>{t(locale, "shop_title")}</h1>
        <p className="body sh-muted">{t(locale, "price_note")}</p>
        <nav className="sh-chiprow" aria-label="Sections">
          <Chip icon="package" href="#baskets">{t(locale, "sets_title")}</Chip>
          <Chip icon="leaf" href="#plants">{t(locale, "plants_section")}</Chip>
        </nav>
      </div>

      <section id="baskets" className="scroll-mt-24">
        <h2>{t(locale, "sets_title")}</h2>
        <p className="body sh-muted mb-4 mt-1">{t(locale, "shop_baskets_blurb")}</p>
        <Grid cols="cards">{baskets.map((p, i) => (<Card key={p.slug} slug={p.slug} tone={tones[(i + 2) % 4]} />))}</Grid>
      </section>

      <section id="plants" className="scroll-mt-24">
        <h2>{t(locale, "plants_section")}</h2>
        <p className="body sh-muted mb-4 mt-1">{t(locale, "shop_plants_blurb")}</p>
        <Grid cols="cards">{plants.map((p, i) => (<Card key={p.slug} slug={p.slug} tone={tones[i % 4]} />))}</Grid>
        <div className="mt-6"><Button variant="secondary" href={`/${locale}/plants`} iconRight="arrow-right">{t(locale, "all_plants")}</Button></div>
      </section>
    </div>
  );
}
