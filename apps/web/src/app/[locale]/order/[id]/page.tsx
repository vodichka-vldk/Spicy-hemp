import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { isLocale, t, type DictKey } from "@/lib/i18n";
import { providerReady } from "@/lib/orders";
import { formatMoney } from "@/lib/shop-calc";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false } };

export default async function OrderPage({ params, searchParams }: { params: Promise<{ locale: string; id: string }>; searchParams: Promise<{ pay?: string }> }) {
  const { locale, id } = await params;
  const { pay } = await searchParams;
  if (!isLocale(locale)) notFound();
  const order = await store().getOrder(id);
  if (!order) notFound();
  const events = (await store().listOrderEvents(id)).filter((e) => e.from !== e.to);
  const unpaid = (order.payment === "stripe" || order.payment === "liqpay") && (order.status === "pending_payment" || order.status === "payment_failed");
  const money = (m: number) => formatMoney(m, order.currency, locale);
  return (
    <div className="container-x max-w-2xl py-10">
      <p className="text-5xl" aria-hidden>🎉</p>
      <h1 className="mt-3 text-4xl font-bold text-leaf">{t(locale, "order_thanks")}</h1>
      <p className="mt-2 text-muted">{t(locale, "order_no")}: <span className="font-mono font-semibold text-ink">{order.id}</span></p>
      <p className="mt-1"><span className="badge">{t(locale, `status_${order.status}` as DictKey)}</span></p>

      {pay === "failed" && <p role="alert" className="mt-4 rounded-lg bg-soft p-3 font-semibold text-clay">{t(locale, "pay_failed_note")}</p>}
      {unpaid && providerReady(order.payment) && <a href={`/api/pay/${order.payment}/${order.id}`} className="btn btn-primary mt-4">💳 {t(locale, "pay_now")}</a>}
      {unpaid && !providerReady(order.payment) && <p className="mt-4 rounded-lg bg-soft p-3 text-sm">{t(locale, "pay_link_soon")}</p>}
      {order.shipment && (
        <p className="mt-4 text-sm">
          {t(locale, "parcel_ttn")}: <span className="font-mono font-semibold">{order.shipment.ttn}</span>{" "}
          <a className="font-semibold text-leaf underline" href={`https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(order.shipment.ttn)}`} target="_blank" rel="noopener noreferrer">{t(locale, "track_parcel")} →</a>
        </p>
      )}

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

      {events.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-xl font-bold">{t(locale, "order_progress")}</h2>
          <ol className="space-y-2 border-l-2 border-line pl-4 text-sm">
            {events.map((e) => (
              <li key={e.id}><span className="font-semibold">{t(locale, `status_${e.to}` as DictKey)}</span> <span className="text-muted">· {new Date(e.ts).toLocaleString(locale === "uk" ? "uk-UA" : "en-GB", { dateStyle: "medium", timeStyle: "short" })}</span></li>
            ))}
          </ol>
        </section>
      )}

      <section className="card mt-6 bg-soft p-5">
        <h2 className="text-xl font-bold">{t(locale, "order_next")}</h2>
        <p className="mt-1 text-muted">{t(locale, "order_next_text")}</p>
      </section>
      <Link href={`/${locale}/plants`} className="btn btn-primary mt-8">{t(locale, "cta_plants")}</Link>
    </div>
  );
}
