import { families as seedFamilies } from "@/data/families";
import generated from "@/data/generated/content.json";
import { herbs as seedHerbs } from "@/data/herbs";
import type { Family, Herb, Locale } from "./types";

// Content comes from the Notion sync (src/data/generated/content.json) when it has been run,
// otherwise from the built-in seed so the site always works.
const g = generated as { herbs: Herb[] | null; families: Family[] | null };
const herbs: Herb[] = g.herbs && g.herbs.length > 0 ? g.herbs : seedHerbs;
const families: Family[] = g.families && g.families.length > 0 ? g.families : seedFamilies;

export const getHerbs = (): Herb[] => herbs;
export const getHerb = (slug: string): Herb | undefined => herbs.find((h) => h.slug === slug);
export const getFamilies = (): Family[] => families;
export const getFamily = (slug: string): Family | undefined => families.find((f) => f.slug === slug);
export const herbsOfFamily = (slug: string): Herb[] => herbs.filter((h) => h.family === slug);

const norm = (s: string) => s.toLocaleLowerCase().normalize("NFKD").replace(/[̀-ͯ'’ʼ`]/g, "");

export function herbMatches(h: Herb, query: string): boolean {
  const q = norm(query.trim());
  if (!q) return true;
  const hay = [h.names.uk, h.names.en, h.latin, ...h.varieties.map((v) => v.name)].map(norm).join(" | ");
  return hay.includes(q);
}

export const WATER_LABEL = (days: number, locale: Locale) =>
  days <= 1 ? (locale === "uk" ? "щодня" : "daily") : locale === "uk" ? `кожні ${days} дн.` : `every ${days} days`;
