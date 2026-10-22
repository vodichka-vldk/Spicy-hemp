import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GardenArt } from "@/components/GardenArt";
import { getHerb } from "@/lib/content";
import { isLocale, t } from "@/lib/i18n";
import { averageRating, isPublic } from "@/lib/reviews";
import { store } from "@/lib/store";
import { currencyFor, formatMoney, priceMinor, products, productTitle } from "@/lib/shop";

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
  const approved = (await store().listReviews({ status: "approved" }).catch(() => [])).filter(isPublic);
  const rating = (slug: string) => { const r = approved.filter((x) => x.product === slug); const avg = averageRating(r); return avg ? { avg, n: r.length } : null; };
  const baskets = products.filter((p) => p.kind === "set");
  const plants = POPULAR.map((s) => products.find((p) => p.slug === s)).filter((p): p is NonNullable<typeof p> => Boolean(p));
  const Card = ({ slug }: { slug: string }) => {
    const p = products.find((x) => x.slug === slug)!;
    const herbs = p.herbs.map((s) => getHerb(s)!);
    return (
      <li>
        <Link href={`/${locale}/shop/${p.slug}`} className="card block h-full overflow-hidden no-underline transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="aspect-square"><GardenArt colors={herbs.map((h) => h.color)} /></div>
          <div className="p-3 sm:p-4">
            <h3 className="text-base font-bold text-ink">{p.kind === "set" ? productTitle(p, locale) : herbs[0].names[locale]}</h3>
            <p className="mt-0.5 line-clamp-2 text-xs text-muted">{p.kind === "set" ? herbs.map((h) => h.names[locale]).join(" · ") : herbs[0].tagline[locale]}</p>
            {rating(p.slug) && <p className="mt-1 text-xs text-amber-600" aria-label={`${rating(p.slug)!.avg} / 5`}>★ {rating(p.slug)!.avg} <span className="text-muted">({rating(p.slug)!.n})</span></p>}
            <p className="mt-2 font-semibold text-leaf">{formatMoney(priceMinor(p.priceUah, cur), cur, locale)}</p>
          </div>
        </Link>
      </li>
    );
  };
  const grid = "grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-5";
  return (
    <div className="container-x py-8">
      <h1 className="text-4xl font-bold text-leaf">{t(locale, "shop_title")}</h1>
      <p className="mt-2 text-sm text-muted">{t(locale, "price_note")}</p>
      <nav className="mt-4 flex gap-2" aria-label="Sections">
        <a className="chip" href="#baskets">🧺 {t(locale, "sets_title")}</a>
        <a className="chip" href="#plants">🌿 {t(locale, "plants_section")}</a>
      </nav>

      <section id="baskets" className="scroll-mt-24">
        <h2 className="mb-1 mt-8 text-2xl font-bold">{t(locale, "sets_title")}</h2>
        <p className="mb-4 text-sm text-muted">{t(locale, "shop_baskets_blurb")}</p>
        <ul className={grid}>{baskets.map((p) => (<Card key={p.slug} slug={p.slug} />))}</ul>
      </section>

      <section id="plants" className="scroll-mt-24">
        <h2 className="mb-1 mt-12 text-2xl font-bold">{t(locale, "plants_section")}</h2>
        <p className="mb-4 text-sm text-muted">{t(locale, "shop_plants_blurb")}</p>
        <ul className={grid}>{plants.map((p) => (<Card key={p.slug} slug={p.slug} />))}</ul>
        <Link href={`/${locale}/plants`} className="btn btn-ghost mt-6">{t(locale, "all_plants")} →</Link>
      </section>
    </div>
  );
}
