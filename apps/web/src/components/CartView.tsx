"use client";

import Link from "next/link";
import { dict } from "@/lib/i18n";
import { formatMoney, priceMinor, totalsFrom, type Currency } from "@/lib/shop-calc";
import type { Locale } from "@/lib/types";
import { useCart } from "./CartProvider";
import { PotArt } from "./PotArt";

export type CatalogItem = { title: string; priceUah: number; colors: string[] };

export function CartView({ locale, currency, catalog }: { locale: Locale; currency: Currency; catalog: Record<string, CatalogItem> }) {
  const { lines, ready, setQty, remove } = useCart();
  const valid = lines.filter((l) => catalog[l.slug]);
  const totals = totalsFrom(valid, (s) => catalog[s]?.priceUah, currency, "np");
  const money = (m: number) => formatMoney(m, currency, locale);

  if (!ready) return <div className="container-x py-16" aria-busy="true" />;
  if (valid.length === 0) {
    return (
      <div className="container-x py-16 text-center">
        <p className="text-6xl" aria-hidden>🛒</p>
        <h1 className="mt-4 text-3xl font-bold">{dict.cart_empty[locale]}</h1>
        <p className="mt-2 text-muted">{dict.cart_empty_t[locale]}</p>
        <Link href={`/${locale}/shop`} className="btn btn-primary mt-6">{dict.cta_shop[locale]}</Link>
      </div>
    );
  }
  const left = Math.max(0, totals.freeAt - totals.subtotal);

  return (
    <div className="container-x py-8">
      <h1 className="text-4xl font-bold text-leaf">{dict.cart_title[locale]}</h1>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1fr_22rem]">
        <ul className="space-y-3">
          {valid.map((l) => {
            const item = catalog[l.slug];
            return (
              <li key={`${l.slug}-${l.glaze}`} className="card flex gap-4 p-3 sm:p-4">
                <div className="h-24 w-24 shrink-0 overflow-hidden rounded-xl sm:h-28 sm:w-28">
                  <PotArt color={item.colors[0]} glaze={l.glaze} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <Link href={`/${locale}/shop/${l.slug}`} className="font-bold text-ink no-underline">{item.title}</Link>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-2">
                    <div className="inline-flex items-center rounded-full border border-line" role="group" aria-label={dict.qty[locale]}>
                      <button type="button" className="h-11 w-11 text-xl" aria-label="−" onClick={() => setQty(l.slug, l.glaze, l.qty - 1)}>−</button>
                      <span className="min-w-8 text-center font-semibold" aria-live="polite">{l.qty}</span>
                      <button type="button" className="h-11 w-11 text-xl" aria-label="+" onClick={() => setQty(l.slug, l.glaze, l.qty + 1)}>+</button>
                    </div>
                    <p className="font-bold">{money(priceMinor(item.priceUah, currency) * l.qty)}</p>
                  </div>
                  <button type="button" className="mt-1 self-start text-sm text-muted underline" onClick={() => remove(l.slug, l.glaze)}>{dict.remove[locale]}</button>
                </div>
              </li>
            );
          })}
        </ul>
        <aside className="card h-fit p-5 lg:sticky lg:top-20">
          <dl className="space-y-2">
            <div className="flex justify-between"><dt>{dict.subtotal[locale]}</dt><dd>{money(totals.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>{dict.shipping[locale]}</dt><dd>{totals.shipping === 0 ? dict.free[locale] : money(totals.shipping)}</dd></div>
            <div className="flex justify-between border-t border-line pt-3 text-xl font-bold"><dt>{dict.total[locale]}</dt><dd>{money(totals.total)}</dd></div>
          </dl>
          {left > 0 && (
            <div className="mt-4">
              <p className="text-sm text-muted">{dict.free_ship_hint[locale].replace("{n}", money(left))}</p>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-soft" aria-hidden>
                <div className="h-full bg-leaf" style={{ width: `${Math.min(100, (totals.subtotal / totals.freeAt) * 100)}%` }} />
              </div>
            </div>
          )}
          <Link href={`/${locale}/checkout`} className="btn btn-primary mt-5 w-full">{dict.checkout[locale]}</Link>
          <Link href={`/${locale}/shop`} className="mt-3 block text-center text-sm font-semibold text-leaf">{dict.continue_shopping[locale]}</Link>
          <p className="mt-4 text-xs text-muted">{dict.price_note[locale]}</p>
        </aside>
      </div>
    </div>
  );
}
