import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion, HerbCard, QuickFacts, cycleKey, petKey, toneAt } from "@/components/HerbParts";
import { Alert, Breadcrumbs, Button, Chip, Grid, Icon, PlantHero } from "@/ds";
import { PotArt } from "@/components/PotArt";
import { PotContext } from "@/components/PotContext";
import { getFamily, getHerb, getHerbs, herbsOfFamily } from "@/lib/content";
import { isLocale, locales, pick, t } from "@/lib/i18n";
import { siteUrl } from "@/lib/payments";

export function generateStaticParams() {
  return locales.flatMap((locale) => getHerbs().map((h) => ({ locale, slug: h.slug })));
}

type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const h = getHerb(slug);
  if (!isLocale(locale) || !h) return {};
  return {
    title: `${h.names[locale]}: ${locale === "uk" ? "догляд, сорти, застосування" : "care, varieties, uses"}`,
    description: h.tagline[locale],
    alternates: { canonical: `/${locale}/plants/${slug}`, languages: { uk: `/uk/plants/${slug}`, en: `/en/plants/${slug}` } },
  };
}

export default async function PlantPage({ params }: P) {
  const { locale, slug } = await params;
  const h = getHerb(slug);
  if (!isLocale(locale) || !h) notFound();
  const fam = getFamily(h.family)!;
  const siblings = herbsOfFamily(h.family).filter((x) => x.slug !== h.slug);
  const companions = h.companions.map((s) => getHerb(s)).filter((x): x is NonNullable<typeof x> => Boolean(x));

  const careKeys = ["water", "light", "feeding", "harvest", "winter"] as const;
  const careTitle = { water: "sec_water", light: "sec_light", feeding: "sec_feeding", harvest: "sec_harvest", winter: "sec_winter" } as const;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: h.names[locale],
    description: h.tagline[locale],
    url: `${siteUrl()}/${locale}/plants/${h.slug}`,
    category: fam.latin,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Latin name", value: h.latin },
      { "@type": "PropertyValue", name: "Family", value: fam.latin },
    ],
  };

  return (
    <article className="container-x py-6 md:py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="sh-hide-mobile mb-4">
        <Breadcrumbs items={[{ label: t(locale, "nav_plants"), href: `/${locale}/plants` }, { label: h.names[locale] }]} />
      </div>

      <PlantHero
        name={h.names[locale]}
        latin={h.latin}
        tagline={h.tagline[locale]}
        image={<PotArt color={h.color} label={h.names[locale]} />}
        badges={[
          { label: `${t(locale, "sec_family")}: ${fam.latin}`, tone: "neutral" },
          { label: t(locale, cycleKey(h.cycle)), tone: "neutral" },
          { label: `${t(locale, "pet")}: ${t(locale, petKey(h.petSafe))}`, tone: h.petSafe === "safe" ? "success" : h.petSafe === "caution" ? "warning" : "neutral", icon: "paw-print" },
        ]}
        actions={[
          <a key="r" className="sh-btn v-action s-lg label" href={`/api/reminder/${h.slug}?lang=${locale}`} download><Icon name="bell" size={20} /><span>{t(locale, "remind_btn")}</span></a>,
          <Button key="b" variant="accent" size="lg" href={`/${locale}/shop/${h.slug}`}>{t(locale, "buy_again")}</Button>,
        ]}
      >
        <div className="sh-stack" style={{ marginTop: 12 }}>
          <PotContext locale={locale} slug={h.slug} />
          <p className="body-sm sh-muted">{t(locale, "remind_text")}</p>
        </div>
      </PlantHero>

      <section className="mt-8" aria-label={t(locale, "quick_facts")}><QuickFacts herb={h} locale={locale} /></section>

      <nav aria-label="Sections" className="sh-chiprow mt-8">
        {[["care", "tab_care"], ["problems", "tab_problems"], ["uses", "tab_uses"], ["varieties", "sec_varieties"]].map(([id, k]) => (
          <Chip key={id} href={`#${id}`}>{t(locale, k as "tab_care")}</Chip>
        ))}
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <section id="care" className="scroll-mt-32">
            <h2 className="mb-2 text-2xl font-bold">{t(locale, "tab_care")}</h2>
            <p className="mb-3 flex items-center gap-2 text-muted"><Icon name="droplet" size={18} /> {pick(h.waterNote, locale)}. {t(locale, "pot_size")} {h.potCm} cm.</p>
            {careKeys.map((k, i) => (
              <Accordion key={k} title={t(locale, careTitle[k])} open={i === 0}>
                <p>{pick(h.sections[k], locale)}</p>
              </Accordion>
            ))}
            {h.aloneInPot && <div className="mt-4"><Alert tone="warning">{t(locale, "alone")}</Alert></div>}
          </section>

          <section id="problems" className="mt-10 scroll-mt-32">
            <h2 className="mb-2 text-2xl font-bold">{t(locale, "sec_problems")}</h2>
            {h.problems.map((p, i) => (
              <Accordion key={i} title={pick(p.symptom, locale)}><p>{pick(p.fix, locale)}</p></Accordion>
            ))}
          </section>

          <section id="uses" className="mt-10 scroll-mt-32">
            <h2 className="mb-2 text-2xl font-bold">{t(locale, "sec_uses")}</h2>
            <p>{pick(h.sections.uses, locale)}</p>
          </section>

          <section id="varieties" className="mt-10 scroll-mt-32">
            <h2 className="mb-2 text-2xl font-bold">{t(locale, "sec_varieties")}</h2>
            <ul className="divide-y divide-line">
              {h.varieties.map((v) => (
                <li key={v.name} className="py-3"><span className="font-semibold">{v.name}</span><span className="text-muted"> · {pick(v.note, locale)}</span></li>
              ))}
            </ul>
          </section>
        </div>

        <aside className="space-y-6">
          <div className="sh-surface sh-stack">
            <h2 className="h3">{t(locale, "sec_family")}</h2>
            <p className="body-sm sh-muted">{pick(fam.description, locale)}</p>
            <Button variant="ghost" size="sm" href={`/${locale}/families/${fam.slug}`} iconRight="arrow-right">{fam.latin}</Button>
          </div>
          {companions.length > 0 && (
            <div className="sh-surface sh-stack">
              <h2 className="h3">{t(locale, "sec_companions")}</h2>
              <div className="flex flex-wrap gap-2">
                {companions.map((c) => (<Chip key={c.slug} href={`/${locale}/plants/${c.slug}`}>{c.names[locale]}</Chip>))}
              </div>
            </div>
          )}
          <p className="text-xs text-muted">{t(locale, "pet_note")}</p>
        </aside>
      </div>

      {siblings.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">{t(locale, "related_family")}</h2>
          <Grid cols="cards">
            {siblings.slice(0, 4).map((s, i) => (<HerbCard key={s.slug} herb={s} locale={locale} tone={toneAt(i)} />))}
          </Grid>
        </section>
      )}
    </article>
  );
}
