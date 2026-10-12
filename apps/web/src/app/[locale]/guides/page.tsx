import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { guides } from "@/data/pages";
import { isLocale, pick, t } from "@/lib/i18n";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: t(locale, "guides_title") } : {};
}

export default async function Guides({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  return (
    <div className="container-x max-w-3xl py-10">
      <h1 className="text-4xl font-bold text-leaf">{t(locale, "guides_title")}</h1>
      {guides.map((g) => (
        <section key={g.slug} id={g.slug} className="card mt-8 p-6">
          <h2 className="text-2xl font-bold">{pick(g.title, locale)}</h2>
          <p className="mt-1 text-muted">{pick(g.lead, locale)}</p>
          <ol className="mt-4 list-decimal space-y-2 pl-5">
            {g.steps.map((s, i) => (<li key={i}>{pick(s, locale)}</li>))}
          </ol>
        </section>
      ))}
    </div>
  );
}
