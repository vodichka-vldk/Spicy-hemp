import type { CatalogItem } from "@/components/CartView";
import { getHerb } from "./content";
import { products, productTitle } from "./shop";
import type { Locale } from "./types";

/** Lightweight catalogue for client components (cart, checkout) so they do not bundle all plant content. */
export function catalogFor(locale: Locale): Record<string, CatalogItem> {
  return Object.fromEntries(
    products.map((p) => [p.slug, { title: productTitle(p, locale), priceUah: p.priceUah, colors: p.herbs.map((h) => getHerb(h)!.color) }]),
  );
}
