import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Accordion, HerbCard, QuickFacts, cycleKey, petKey } from "@/components/HerbParts";
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
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href={`/${locale}/plants`} className="hover:text-leaf">{t(locale, "nav_plants")}</Link> / <span>{h.names[locale]}</span>
      </nav>

      <div className="grid gap-6 md:grid-cols-[minmax(0,22rem)_1fr] md:gap-10">
        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-[2rem] border border-line md:mx-0">
          <div className="aspect-square"><PotArt color={h.color} label={h.names[locale]} /></div>
        </div>
        <div>
          <h1 className="text-4xl font-bold text-leaf md:text-5xl">{h.names[locale]}</h1>
          <p className="mt-1 text-lg italic text-muted">{h.latin}</p>
          <p className="mt-3 text-lg">{h.tagline[locale]}</p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link href={`/${locale}/families/${fam.slug}`} className="badge no-underline">{t(locale, "sec_family")}: {fam.latin}</Link>
            <span className="badge">{t(locale, cycleKey(h.cycle))}</span>
            <span className="badge">{t(locale, "pet")}: {t(locale, petKey(h.petSafe))}</span>
          </div>
          <div className="mt-5"><PotContext locale={locale} slug={h.slug} /></div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a className="btn btn-primary" href={`/api/reminder/${h.slug}?lang=${locale}`} download>🔔 {t(locale, "remind_btn")}</a>
            <Link className="btn btn-clay" href={`/${locale}/shop/${h.slug}`}>{t(locale, "buy_again")}</Link>
          </div>
          <p className="mt-2 text-sm text-muted">{t(locale, "remind_text")}</p>
        </div>
      </div>

      <section className="mt-8" aria-label={t(locale, "quick_facts")}><QuickFacts herb={h} locale={locale} /></section>

      <nav aria-label="Sections" className="sticky top-14 z-30 -mx-4 mt-8 flex gap-2 overflow-x-auto border-b border-line bg-paper/95 px-4 py-2 backdrop-blur sm:mx-0 sm:px-0">
        {[["care", "tab_care"], ["problems", "tab_problems"], ["uses", "tab_uses"], ["varieties", "sec_varieties"]].map(([id, k]) => (
          <a key={id} href={`#${id}`} className="chip shrink-0 no-underline">{t(locale, k as "tab_care")}</a>
        ))}
      </nav>

      <div className="mt-6 grid gap-10 lg:grid-cols-[1fr_20rem]">
        <div>
          <section id="care" className="scroll-mt-32">
            <h2 className="mb-2 text-2xl font-bold">{t(locale, "tab_care")}</h2>
            <p className="mb-3 text-muted">💧 {pick(h.waterNote, locale)}. {t(locale, "pot_size")} {h.potCm} cm.</p>
            {careKeys.map((k, i) => (
              <Accordion key={k} title={t(locale, careTitle[k])} open={i === 0}>
                <p>{pick(h.sections[k], locale)}</p>
              </Accordion>
            ))}
            {h.aloneInPot && <p className="mt-4 rounded-xl bg-soft p-3 text-sm">⚠️ {t(locale, "alone")}</p>}
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
          <div className="card p-5">
            <h2 className="text-lg font-bold">{t(locale, "sec_family")}</h2>
            <p className="mt-1 text-sm text-muted">{pick(fam.description, locale)}</p>
            <Link href={`/${locale}/families/${fam.slug}`} className="mt-3 inline-block font-semibold text-leaf">{fam.latin} →</Link>
          </div>
          {companions.length > 0 && (
            <div className="card p-5">
              <h2 className="text-lg font-bold">{t(locale, "sec_companions")}</h2>
              <ul className="mt-2 space-y-1">
                {companions.map((c) => (<li key={c.slug}><Link href={`/${locale}/plants/${c.slug}`} className="text-leaf">{c.names[locale]}</Link></li>))}
              </ul>
            </div>
          )}
          <p className="text-xs text-muted">{t(locale, "pet_note")}</p>
        </aside>
      </div>

      {siblings.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-4 text-2xl font-bold">{t(locale, "related_family")}</h2>
          <ul className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {siblings.slice(0, 4).map((s) => (<li key={s.slug}><HerbCard herb={s} locale={locale} /></li>))}
          </ul>
        </section>
      )}
    </article>
  );
}
