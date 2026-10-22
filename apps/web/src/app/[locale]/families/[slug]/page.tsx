import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HerbCard } from "@/components/HerbParts";
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
      <p className="text-sm italic text-muted">{f.latin}</p>
      <h1 className="text-4xl font-bold text-leaf">{f.names[locale]}</h1>
      <p className="mt-3 max-w-2xl text-lg text-muted">{pick(f.description, locale)}</p>
      <ul className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {list.map((h) => (<li key={h.slug}><HerbCard herb={h} locale={locale} /></li>))}
      </ul>
    </div>
  );
}
