"use client";

import { Button, CartItem, EmptyState, OrderSummary, ProgressBar, Split } from "@/ds";
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
      <div className="container-x py-16">
        <EmptyState icon="shopping-cart" title={dict.cart_empty[locale]} text={dict.cart_empty_t[locale]} action={<Button variant="accent" href={`/${locale}/shop`}>{dict.cta_shop[locale]}</Button>} />
      </div>
    );
  }
  const left = Math.max(0, totals.freeAt - totals.subtotal);

  return (
    <div className="container-x sh-stack-lg py-8">
      <h1>{dict.cart_title[locale]}</h1>
      <Split
        aside={
          <OrderSummary
            title={dict.cart_title[locale]}
            rows={[{ label: dict.subtotal[locale], value: money(totals.subtotal) }, { label: dict.shipping[locale], value: totals.shipping === 0 ? dict.free[locale] : money(totals.shipping) }]}
            note={left > 0 ? dict.free_ship_hint[locale].replace("{n}", money(left)) : dict.price_note[locale]}
            totalLabel={dict.total[locale]}
            total={money(totals.total)}
            cta={
              <div className="sh-stack">
                {left > 0 && <ProgressBar value={Math.min(100, Math.round((totals.subtotal / totals.freeAt) * 100))} label={dict.free_ship_hint[locale].replace("{n}", money(left))} />}
                <Button variant="accent" size="lg" full href={`/${locale}/checkout`}>{dict.checkout[locale]}</Button>
                <Button variant="ghost" full href={`/${locale}/shop`}>{dict.continue_shopping[locale]}</Button>
              </div>
            }
          />
        }
      >
        <ul className="sh-stack">
          {valid.map((l) => {
            const item = catalog[l.slug];
            return (
              <li key={`${l.slug}-${l.glaze}`}>
                <CartItem
                  title={item.title}
                  href={`/${locale}/shop/${l.slug}`}
                  image={<PotArt color={item.colors[0]} glaze={l.glaze} />}
                  price={money(priceMinor(item.priceUah, currency) * l.qty)}
                  qty={l.qty}
                  onQty={(n: number) => setQty(l.slug, l.glaze, n)}
                  onRemove={() => remove(l.slug, l.glaze)}
                  removeLabel={dict.remove[locale]}
                />
              </li>
            );
          })}
        </ul>
      </Split>
    </div>
  );
}
