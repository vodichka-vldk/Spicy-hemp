import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { infoPages } from "@/data/pages";
import { isLocale, locales, pick } from "@/lib/i18n";

export function generateStaticParams() {
  return locales.flatMap((locale) => Object.keys(infoPages).map((page) => ({ locale, page })));
}

type P = { params: Promise<{ locale: string; page: string }> };

export async function generateMetadata({ params }: P): Promise<Metadata> {
  const { locale, page } = await params;
  const p = infoPages[page];
  return isLocale(locale) && p ? { title: pick(p.title, locale) } : {};
}

export default async function Info({ params }: P) {
  const { locale, page } = await params;
  const p = Object.hasOwn(infoPages, page) ? infoPages[page] : undefined;
  if (!isLocale(locale) || !p) notFound();
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="text-4xl font-bold text-leaf">{pick(p.title, locale)}</h1>
      <p className="mt-3 text-lg text-muted">{pick(p.lead, locale)}</p>
      {p.sections.map((s, i) => (
        <section key={i} className="mt-8">
          <h2 className="text-2xl font-bold">{pick(s.h, locale)}</h2>
          <p className="mt-2">{pick(s.p, locale)}</p>
        </section>
      ))}
    </div>
  );
}
