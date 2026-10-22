import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, t, type DictKey } from "@/lib/i18n";
import { formatMoney } from "@/lib/shop-calc";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

export default async function OrderPage({ params }: { params: Promise<{ locale: string; id: string }> }) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const order = await store().getOrder(id);
  if (!order) notFound();
  const money = (m: number) => formatMoney(m, order.currency, locale);
  return (
    <div className="container-x max-w-2xl py-10">
      <p className="text-5xl" aria-hidden>🎉</p>
      <h1 className="mt-3 text-4xl font-bold text-leaf">{t(locale, "order_thanks")}</h1>
      <p className="mt-2 text-muted">{t(locale, "order_no")}: <span className="font-mono font-semibold text-ink">{order.id}</span></p>
      <p className="mt-1"><span className="badge">{t(locale, `status_${order.status}` as DictKey)}</span></p>

      <ul className="card mt-6 divide-y divide-line">
        {order.items.map((i, n) => (
          <li key={n} className="flex justify-between gap-3 p-4">
            <span>{i.title} × {i.qty}</span>
            <span className="font-semibold">{money(i.unitMinor * i.qty)}</span>
          </li>
        ))}
        <li className="flex justify-between p-4"><span>{t(locale, "shipping")}</span><span>{order.shippingMinor === 0 ? t(locale, "free") : money(order.shippingMinor)}</span></li>
        <li className="flex justify-between p-4 text-xl font-bold"><span>{t(locale, "total")}</span><span>{money(order.totalMinor)}</span></li>
      </ul>

      <section className="card mt-6 bg-soft p-5">
        <h2 className="text-xl font-bold">{t(locale, "order_next")}</h2>
        <p className="mt-1 text-muted">{t(locale, "order_next_text")}</p>
      </section>
      <Link href={`/${locale}/plants`} className="btn btn-primary mt-8">{t(locale, "cta_plants")}</Link>
    </div>
  );
}
