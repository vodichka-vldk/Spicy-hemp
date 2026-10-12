import { getHerb, getHerbs } from "./content";
import { POT_BASE_UAH, SET_DISCOUNT, priceMinor, totalsFrom, type CartLine, type Currency, type Totals } from "./shop-calc";
import type { Locale } from "./types";

export * from "./shop-calc";

export type Product = {
  slug: string;
  kind: "pot" | "set";
  herbs: string[]; // herb slugs
  priceUah: number;
  titleKey?: { uk: string; en: string };
  blurb?: { uk: string; en: string };
};

const sets: Product[] = [
  {
    slug: "set-italian",
    kind: "set",
    herbs: ["basil", "oregano", "thyme", "rosemary"],
    priceUah: 0,
    titleKey: { uk: "Набір «Італійський»", en: "“Italian” set" },
    blurb: { uk: "Базилік, орегано, чебрець і розмарин: усе для піци й пасти.", en: "Basil, oregano, thyme and rosemary: everything for pizza and pasta." },
  },
  {
    slug: "set-tea",
    kind: "set",
    herbs: ["mint", "lemon-balm", "sage"],
    priceUah: 0,
    titleKey: { uk: "Набір «Чайний»", en: "“Tea” set" },
    blurb: { uk: "М'ята, меліса та шавлія для запашного чаю.", en: "Mint, lemon balm and sage for fragrant tea." },
  },
  {
    slug: "set-asian",
    kind: "set",
    herbs: ["basil", "lemongrass", "cilantro"],
    priceUah: 0,
    titleKey: { uk: "Набір «Азійський»", en: "“Asian” set" },
    blurb: { uk: "Базилік, лемонграс і кінза для супів та каррі.", en: "Basil, lemongrass and cilantro for soups and curries." },
  },
];

export function potPrice(herbSlug: string): number {
  const h = getHerb(herbSlug);
  return POT_BASE_UAH + (h?.priceUah ?? 0);
}

export function buildProducts(): Product[] {
  const potProducts: Product[] = getHerbs().map((h) => h.slug).map((slug) => ({ slug, kind: "pot" as const, herbs: [slug], priceUah: potPrice(slug) }));
  // Sets are only offered while every herb in them is published.
  const setProducts = sets.filter((x) => x.herbs.every((h) => getHerb(h))).map((s) => ({
    ...s,
    priceUah: Math.round(s.herbs.reduce((sum, h) => sum + potPrice(h), 0) * (1 - SET_DISCOUNT) / 10) * 10,
  }));
  return [...potProducts, ...setProducts];
}

export const products = buildProducts();
export const getProduct = (slug: string) => products.find((p) => p.slug === slug);

export function productTitle(p: Product, locale: Locale): string {
  if (p.titleKey) return p.titleKey[locale];
  const h = getHerb(p.herbs[0]);
  const name = h?.names[locale] ?? p.slug;
  return locale === "uk" ? `Горщик з рослиною: ${name}` : `Pot with ${name}`;
}


export function computeTotals(lines: CartLine[], currency: Currency, kind: "np" | "intl"): Totals {
  return totalsFrom(lines, (slug) => getProduct(slug)?.priceUah, currency, kind);
}
