import type { Locale } from "./types";

// All prices are PLACEHOLDERS for testing. Replace with real prices before launch.
export const POT_BASE_UAH = 450;
export const UAH_TO_EUR = 0.022;
export const SET_DISCOUNT = 0.1;
export const SHIPPING_UAH = { np: 100, intl: 680 } as const;
export const FREE_SHIPPING_UAH = { np: 1800, intl: 2050 } as const;

export const glazes = ["sage", "cream", "terracotta"] as const;
export type Glaze = (typeof glazes)[number];
export const glazeColor: Record<Glaze, string> = { sage: "#9db79a", cream: "#eadfc8", terracotta: "#c46a45" };

export type CartLine = { slug: string; glaze: Glaze; qty: number };
export type Currency = "UAH" | "EUR";
export const currencyFor = (locale: Locale): Currency => (locale === "uk" ? "UAH" : "EUR");

/** Price of an item in minor units for the given currency (kopiyky or cents). */
export function priceMinor(priceUah: number, currency: Currency): number {
  return currency === "UAH" ? Math.round(priceUah * 100) : Math.round(priceUah * UAH_TO_EUR * 100);
}

export function formatMoney(minor: number, currency: Currency, locale: Locale): string {
  return new Intl.NumberFormat(locale === "uk" ? "uk-UA" : "en-IE", {
    style: "currency",
    currency,
    maximumFractionDigits: minor % 100 === 0 ? 0 : 2,
  }).format(minor / 100);
}

export type Totals = { subtotal: number; shipping: number; total: number; freeAt: number; currency: Currency };

/** Pure totals calculation; `unitUah` resolves a product slug to its UAH price (undefined = unknown, skipped). */
export function totalsFrom(lines: CartLine[], unitUah: (slug: string) => number | undefined, currency: Currency, kind: "np" | "intl"): Totals {
  const subtotal = lines.reduce((sum, l) => {
    const u = unitUah(l.slug);
    return u === undefined ? sum : sum + priceMinor(u, currency) * l.qty;
  }, 0);
  const freeAt = priceMinor(FREE_SHIPPING_UAH[kind], currency);
  const shipping = lines.length === 0 || subtotal >= freeAt ? 0 : priceMinor(SHIPPING_UAH[kind], currency);
  return { subtotal, shipping, total: subtotal + shipping, freeAt, currency };
}
