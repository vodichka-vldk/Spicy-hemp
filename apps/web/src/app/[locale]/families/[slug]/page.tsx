import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HerbCard, toneAt } from "@/components/HerbParts";
import { Grid } from "@/ds";
import { getFamilies, getFamily, herbsOfFamily } from "@/lib/content";
import { isLocale, locales, pick } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.flatMap((locale) => getFamilies().map((f) => ({ locale, slug: f.slug })));
}

type P = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, slug } = await params;
  const f = getFamily(slug);
  return isLocale(locale) && f ? { title: f.names[locale], description: pick(f.description, locale) } : {};
}

export default async function FamilyPage({ params }: P) {
  const { locale, slug } = await params;
  const f = getFamily(slug);
  if (!isLocale(locale) || !f) notFound();
  const list = herbsOfFamily(slug);
  return (
    <div className="container-x py-8">
      <p className="latin sh-muted">{f.latin}</p>
      <h1>{f.names[locale]}</h1>
      <p className="body-lg mt-3 max-w-2xl">{pick(f.description, locale)}</p>
      <div className="mt-8">
        <Grid cols="cards">
          {list.map((h, i) => (<HerbCard key={h.slug} herb={h} locale={locale} tone={toneAt(i)} />))}
        </Grid>
      </div>
    </div>
  );
}
