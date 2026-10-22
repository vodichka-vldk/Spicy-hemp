import Link from "next/link";
import { notFound } from "next/navigation";
import { GardenArt } from "@/components/GardenArt";
import { HerbCard, toneAt } from "@/components/HerbParts";
import { PotArt } from "@/components/PotArt";
import { Alert, Button, Grid, Icon, ProductCard } from "@/ds";
import { loadPublicProducts } from "@/lib/catalog-server";
import { getHerb } from "@/lib/content";
import { isLocale, t } from "@/lib/i18n";
import { currencyFor, formatMoney, priceMinor, productTitle } from "@/lib/shop";

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const cur = currencyFor(locale);
  const popular = ["basil", "mint", "rosemary", "thyme", "parsley", "oregano"].map((s) => getHerb(s)).filter((h): h is NonNullable<typeof h> => Boolean(h));
  const sets = (await loadPublicProducts()).filter((p) => p.kind === "set");
  const steps = [
    { icon: "package", t: t(locale, "how_1_t"), d: t(locale, "how_1_d") },
    { icon: "qr-code", t: t(locale, "how_2_t"), d: t(locale, "how_2_d") },
    { icon: "bell", t: t(locale, "how_3_t"), d: t(locale, "how_3_d") },
  ];
  return (
    <>
      <section className="sh-section is-hero" style={{ paddingBlock: 0 }}>
        <div className="container-x grid items-center gap-8 py-10 md:grid-cols-2 md:py-16">
          <div className="sh-stack">
            <h1 className="display-lg">{t(locale, "hero_title")}</h1>
            <p className="body-lg">{t(locale, "hero_text")}</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="accent" size="lg" href={`/${locale}/shop`}>{t(locale, "cta_shop")}</Button>
              <Button variant="secondary" size="lg" href={`/${locale}/plants`}>{t(locale, "cta_plants")}</Button>
            </div>
          </div>
          <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[var(--radius-xl)] shadow-[var(--shadow-float)]">
            <div className="aspect-square"><PotArt color="#3f8f4a" glaze="terracotta" label="Pot with basil" /></div>
          </div>
        </div>
      </section>

      <div className="container-x sh-stack-lg py-10">
        <section aria-labelledby="how">
          <h2 id="how" className="mb-4">{t(locale, "how_title")}</h2>
          <Grid cols="steps">
            {steps.map((s, n) => (
              <div key={n} className="sh-surface sh-stack">
                <span className="sh-fact-icon"><Icon name={s.icon} size={22} /></span>
                <h3 className="title" style={{ margin: 0 }}>{n + 1}. {s.t}</h3>
                <p className="body sh-muted" style={{ margin: 0 }}>{s.d}</p>
              </div>
            ))}
          </Grid>
        </section>

        <section aria-labelledby="pop">
          <div className="mb-4 flex items-end justify-between gap-4">
            <h2 id="pop">{t(locale, "popular")}</h2>
            <Link href={`/${locale}/plants`} className="label inline-flex items-center gap-1 text-leaf">{t(locale, "all_plants")} <Icon name="arrow-right" size={18} /></Link>
          </div>
          <Grid cols="cards">
            {popular.map((h, i) => (<HerbCard key={h.slug} herb={h} locale={locale} tone={toneAt(i)} />))}
          </Grid>
        </section>

        <section aria-labelledby="sets">
          <h2 id="sets" className="mb-4">{t(locale, "sets_title")}</h2>
          <Grid cols="cards">
            {sets.map((s, i) => (
              <ProductCard
                key={s.slug}
                href={`/${locale}/shop/${s.slug}`}
                title={productTitle(s, locale)}
                subtitle={s.blurb?.[locale]}
                price={formatMoney(priceMinor(s.priceUah, cur), cur, locale)}
                priceNote={t(locale, "set_save")}
                tone={(["sand", "sage", "sky"] as const)[i % 3]}
                image={<GardenArt colors={s.herbs.map((h) => getHerb(h)!.color)} />}
              />
            ))}
          </Grid>
        </section>

        <Alert tone="info" title={t(locale, "warranty_title")}>
          {t(locale, "warranty_text")} <Link href={`/${locale}/warranty`} className="font-semibold underline">{t(locale, "warranty_page")}</Link>
        </Alert>
      </div>
    </>
  );
}
