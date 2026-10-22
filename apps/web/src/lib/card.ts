import { basketContent } from "@/data/baskets";
import { getHerb } from "./content";
import { CARE_SECTIONS, type CareSection } from "./domain";
import { getProduct } from "./shop";
import type { L, Locale } from "./types";

export const sectionTitles: Record<CareSection, L> = {
  description: { uk: "Опис кошика", en: "About your basket" },
  watering: { uk: "Як поливати", en: "How to water" },
  placement: { uk: "Розміщення", en: "Placement" },
  seasonal: { uk: "Сезонний догляд", en: "Seasonal care" },
  katya_tips: { uk: "Поради від Каті", en: "Tips from Katya" },
  kitchen: { uk: "Використання на кухні", en: "In the kitchen" },
};

export type CardSection = { key: CareSection; title: string; body: string };

/** Sections for a product card: authored basket text, or for a single plant text composed from its herb passport. */
export function cardSections(productSlug: string, locale: Locale, overrides: Partial<Record<CareSection, L>> = {}): CardSection[] {
  const product = getProduct(productSlug);
  const herb = getHerb(product?.herbs[0] ?? productSlug);
  const authored = basketContent[productSlug];
  const fromHerb: Record<CareSection, L> | null = herb
    ? {
        description: herb.tagline,
        watering: herb.sections.water,
        placement: herb.sections.light,
        seasonal: herb.sections.winter,
        katya_tips: herb.sections.harvest,
        kitchen: herb.sections.uses,
      }
    : null;
  const src = authored ?? fromHerb;
  if (!src) return [];
  return CARE_SECTIONS.map((key) => {
    const body = overrides[key]?.[locale] ?? src[key][locale];
    return { key, title: sectionTitles[key][locale], body };
  }).filter((s) => s.body);
}
