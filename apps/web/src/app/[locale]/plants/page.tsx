import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlantsExplorer, type HerbLite } from "@/components/PlantsExplorer";
import { getHerbs } from "@/lib/content";
import { isLocale, t } from "@/lib/i18n";

const norm = (s: string) => s.toLocaleLowerCase().normalize("NFKD").replace(/[̀-ͯ'’ʼ`]/g, "");

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  return isLocale(locale) ? { title: t(locale, "nav_plants"), alternates: { languages: { uk: "/uk/plants", en: "/en/plants" } } } : {};
}

export default async function Plants({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const herbs: HerbLite[] = getHerbs().map((h) => ({
    slug: h.slug, latin: h.latin, name: h.names[locale], color: h.color, difficulty: h.difficulty,
    hours: h.light.hours, sunny: h.light.level === "sun", petSafe: h.petSafe === "safe",
    perennial: ["perennial", "shrub", "tree", "tropical"].includes(h.cycle), family: h.family,
    search: norm([h.names.uk, h.names.en, h.latin, ...h.varieties.map((v) => v.name)].join(" | ")),
  }));
  return (
    <div className="container-x py-8">
      <h1 className="mb-6 text-4xl font-bold text-leaf">{t(locale, "nav_plants")}</h1>
      <PlantsExplorer herbs={herbs} locale={locale} />
    </div>
  );
}
