import { basketContent } from "@/data/baskets";
import { getHerb } from "./content";
import { CARE_SECTIONS, type CareSection } from "./domain";
import { getProduct, type Product } from "./shop";
import type { Herb, L, Locale } from "./types";

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
export function cardSections(productSlug: string, locale: Locale, overrides: Partial<Record<CareSection, L>> = {}, resolved?: Product): CardSection[] {
  const product = resolved ?? getProduct(productSlug);
  const written = product?.content ?? {}; // texts written in the admin win over the built-in ones
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
  if (!src && Object.keys(written).length === 0) return [];
  return CARE_SECTIONS.map((key) => {
    const body = overrides[key]?.[locale] ?? (written[key]?.[locale]?.trim() || src?.[key][locale] || "");
    return { key, title: sectionTitles[key][locale], body };
  }).filter((s) => s.body);
}

export type Fact = { icon: string; label: string; value: string };

const LIGHT: Record<string, L> = {
  sun: { uk: "Багато сонця", en: "Lots of sun" },
  bright: { uk: "Яскраве світло", en: "Bright light" },
  partial: { uk: "Півтінь", en: "Part shade" },
};
const DIFFICULTY: Record<number, L> = { 1: { uk: "Легко", en: "Easy" }, 2: { uk: "Середньо", en: "Medium" }, 3: { uk: "Складно", en: "Demanding" } };
const PETS: Record<string, L> = {
  safe: { uk: "Безпечно для тварин", en: "Pet safe" },
  caution: { uk: "З обережністю для тварин", en: "Use caution with pets" },
  unknown: { uk: "Для тварин: уточнюється", en: "Pet safety: being checked" },
};

/** Four at-a-glance facts for a product; for baskets the most demanding herb sets the value. */
export function productFacts(herbs: Herb[], locale: Locale): Fact[] {
  if (herbs.length === 0) return [];
  const order = (arr: string[], pick: string[]) => pick.find((x) => arr.includes(x)) ?? arr[0];
  const light = order(herbs.map((h) => h.light.level), ["sun", "bright", "partial"]);
  const days = herbs.map((h) => h.waterEveryDays);
  const [dmin, dmax] = [Math.min(...days), Math.max(...days)];
  const diff = Math.max(...herbs.map((h) => h.difficulty));
  const pet = order(herbs.map((h) => h.petSafe), ["caution", "unknown", "safe"]);
  const every = dmin === dmax ? `${dmin}` : `${dmin}–${dmax}`;
  return [
    { icon: "☀️", label: locale === "uk" ? "Світло" : "Light", value: LIGHT[light][locale] },
    { icon: "💧", label: locale === "uk" ? "Полив" : "Watering", value: locale === "uk" ? `кожні ${every} дн.` : `every ${every} days` },
    { icon: "🎚", label: locale === "uk" ? "Складність" : "Difficulty", value: DIFFICULTY[diff][locale] },
    { icon: "🐾", label: locale === "uk" ? "Тварини" : "Pets", value: PETS[pet][locale] },
  ];
}
