import Link from "next/link";
import { notFound } from "next/navigation";
import { HerbCard } from "@/components/HerbParts";
import { PotArt } from "@/components/PotArt";
import { getHerbs, getHerb } from "@/lib/content";
import { isLocale, t } from "@/lib/i18n";
import { loadPublicProducts } from "@/lib/catalog-server";
import { currencyFor, formatMoney, priceMinor, productTitle } from "@/lib/shop";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const cur = currencyFor(locale);
  const popular = ["basil", "mint", "rosemary", "thyme", "parsley", "oregano"].map((s) => getHerb(s)).filter((h): h is NonNullable<typeof h> => Boolean(h));
  const sets = (await loadPublicProducts()).filter((p) => p.kind === "set");
  const steps = [
    { i: "🏺", t: t(locale, "how_1_t"), d: t(locale, "how_1_d") },
    { i: "📱", t: t(locale, "how_2_t"), d: t(locale, "how_2_d") },
    { i: "🌿", t: t(locale, "how_3_t"), d: t(locale, "how_3_d") },
  ];
  return (
    <>
      <section className="bg-soft">
        <div className="container-x grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
          <div>
            <h1 className="text-4xl font-bold text-leaf md:text-5xl">{t(locale, "hero_title")}</h1>
            <p className="mt-4 max-w-xl text-lg text-muted">{t(locale, "hero_text")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={`/${locale}/shop`} className="btn btn-primary">{t(locale, "cta_shop")}</Link>
              <Link href={`/${locale}/plants`} className="btn btn-ghost">{t(locale, "cta_plants")}</Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border border-line shadow-lg">
            <div className="aspect-square"><PotArt color="#3f8f4a" glaze="terracotta" label="Pot with basil" /></div>
          </div>
        </div>
      </section>

      <section className="container-x py-12" aria-labelledby="how">
        <h2 id="how" className="text-3xl font-bold">{t(locale, "how_title")}</h2>
        <ol className="mt-6 grid gap-4 md:grid-cols-3">
          {steps.map((s, n) => (
            <li key={n} className="card p-6">
              <span className="text-3xl" aria-hidden>{s.i}</span>
              <h3 className="mt-3 text-xl font-bold">{n + 1}. {s.t}</h3>
              <p className="mt-1 text-muted">{s.d}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="container-x py-4" aria-labelledby="pop">
        <div className="flex items-end justify-between gap-4">
          <h2 id="pop" className="text-3xl font-bold">{t(locale, "popular")}</h2>
          <Link href={`/${locale}/plants`} className="font-semibold text-leaf">{t(locale, "all_plants")} →</Link>
        </div>
        <ul className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 lg:gap-4">
          {popular.map((h) => (<li key={h.slug}><HerbCard herb={h} locale={locale} /></li>))}
        </ul>
      </section>

      <section className="container-x py-12" aria-labelledby="sets">
        <h2 id="sets" className="text-3xl font-bold">{t(locale, "sets_title")}</h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {sets.map((s) => (
            <li key={s.slug}>
              <Link href={`/${locale}/shop/${s.slug}`} className="card block p-5 no-underline transition hover:shadow-md">
                <div className="flex gap-1">
                  {s.herbs.map((h) => (<div key={h} className="aspect-square w-1/3 overflow-hidden rounded-xl"><PotArt color={getHerb(h)!.color} /></div>))}
                </div>
                <h3 className="mt-4 text-xl font-bold text-ink">{productTitle(s, locale)}</h3>
                <p className="mt-1 text-muted">{s.blurb?.[locale]}</p>
                <p className="mt-3 flex items-center gap-2">
                  <span className="text-lg font-bold text-ink">{formatMoney(priceMinor(s.priceUah, cur), cur, locale)}</span>
                  <span className="badge">{t(locale, "set_save")}</span>
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-x pb-4">
        <div className="card flex flex-col items-start gap-3 bg-soft p-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold text-leaf">🌱 {t(locale, "warranty_title")}</h2>
            <p className="mt-1 max-w-2xl text-muted">{t(locale, "warranty_text")}</p>
          </div>
          <Link href={`/${locale}/warranty`} className="btn btn-ghost">{t(locale, "warranty_page")}</Link>
        </div>
      </section>
    </>
  );
}
