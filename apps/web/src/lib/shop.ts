import { getHerb, getHerbs } from "./content";
import type { CareSection } from "./domain";
import type { CatalogEntry, CatalogStatus, StockMode } from "./store/types";
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
  status?: CatalogStatus; // built-in products are published unless the admin changed it
  stockMode?: StockMode;
  content?: CatalogEntry["content"]; // care texts written in the admin
  photos?: string[]; // storage paths, first is the cover
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

/** Price of a basket calculated from its herbs (rounded to 10 UAH). */
export function autoSetPrice(herbs: string[]): number {
  return Math.round(herbs.reduce((sum, h) => sum + potPrice(h), 0) * (1 - SET_DISCOUNT) / 10) * 10;
}

export function buildProducts(): Product[] {
  const potProducts: Product[] = getHerbs().map((h) => h.slug).map((slug) => ({ slug, kind: "pot" as const, herbs: [slug], priceUah: potPrice(slug) }));
  // Sets are only offered while every herb in them is published.
  const setProducts = sets.filter((x) => x.herbs.every((h) => getHerb(h))).map((s) => ({
    ...s,
    priceUah: autoSetPrice(s.herbs),
  }));
  return [...potProducts, ...setProducts];
}

export const products = buildProducts();
export const getProduct = (slug: string, list: Product[] = products) => list.find((p) => p.slug === slug);

const loc = (l: { uk?: string; en?: string } | undefined, fallback?: { uk: string; en: string }) =>
  l && (l.uk?.trim() || l.en?.trim()) ? { uk: l.uk?.trim() || l.en!.trim(), en: l.en?.trim() || l.uk!.trim() } : fallback;

/** Built-in products with the admin's entries applied: overrides for existing slugs, new baskets for the rest. */
export function mergeCatalog(entries: CatalogEntry[], base: Product[] = products): Product[] {
  const out: Product[] = base.map((p) => ({ ...p, status: p.status ?? "published", stockMode: p.stockMode ?? "in_stock" }));
  for (const e of entries) {
    const i = out.findIndex((p) => p.slug === e.slug);
    const cur = i >= 0 ? out[i] : undefined;
    const herbs = e.kind === "set" && e.herbs?.length ? e.herbs.filter((h) => getHerb(h)) : cur?.herbs ?? [];
    if (herbs.length === 0) continue;
    const next: Product = {
      slug: e.slug, kind: cur?.kind ?? e.kind, herbs,
      priceUah: e.priceUah > 0 ? e.priceUah : e.kind === "set" ? autoSetPrice(herbs) : cur?.priceUah ?? potPrice(herbs[0]),
      titleKey: loc(e.title, cur?.titleKey), blurb: loc(e.tagline, cur?.blurb),
      status: e.status, stockMode: e.stockMode, content: e.content, photos: e.photos,
    };
    if (i >= 0) out[i] = next; else out.push(next);
  }
  return out;
}

/** What visitors see: published products only. */
export const publicProducts = (list: Product[]) => list.filter((p) => (p.status ?? "published") === "published");

export function productTitle(p: Product, locale: Locale): string {
  if (p.titleKey) return p.titleKey[locale];
  const h = getHerb(p.herbs[0]);
  const name = h?.names[locale] ?? p.slug;
  return locale === "uk" ? `Горщик з рослиною: ${name}` : `Pot with ${name}`;
}


export function computeTotals(lines: CartLine[], currency: Currency, kind: "np" | "intl", list: Product[] = products): Totals {
  return totalsFrom(lines, (slug) => getProduct(slug, list)?.priceUah, currency, kind);
}
