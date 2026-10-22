import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Alert, Badge, Button, OrderSummary, Timeline } from "@/ds";
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
  const fmt = (iso: string) => new Date(iso).toLocaleString(locale === "uk" ? "uk-UA" : "en-GB", { dateStyle: "medium", timeStyle: "short" });
  return (
    <div className="container-x max-w-2xl sh-stack-lg py-10">
      <div className="sh-stack">
        <h1>{t(locale, "order_thanks")}</h1>
        <p className="body sh-muted">{t(locale, "order_no")}: <span className="font-mono font-semibold" style={{ color: "var(--ink)" }}>{order.id}</span></p>
        <p><Badge tone="leaf">{t(locale, `status_${order.status}` as DictKey)}</Badge></p>
      </div>

      {pay === "failed" && <Alert tone="danger">{t(locale, "pay_failed_note")}</Alert>}
      {unpaid && providerReady(order.payment) && <div><Button variant="accent" size="lg" icon="credit-card" href={`/api/pay/${order.payment}/${order.id}`}>{t(locale, "pay_now")}</Button></div>}
      {unpaid && !providerReady(order.payment) && <Alert tone="info">{t(locale, "pay_link_soon")}</Alert>}
      {order.shipment && (
        <Alert tone="info" title={t(locale, "parcel_ttn")}>
          <span className="font-mono font-semibold">{order.shipment.ttn}</span>{" "}
          <a className="font-semibold underline" href={`https://novaposhta.ua/tracking/?cargo_number=${encodeURIComponent(order.shipment.ttn)}`} target="_blank" rel="noopener noreferrer">{t(locale, "track_parcel")}</a>
        </Alert>
      )}

      <OrderSummary
        title={t(locale, "order_no")}
        rows={[
          ...order.items.map((i) => ({ label: `${i.title} × ${i.qty}`, value: money(i.unitMinor * i.qty) })),
          { label: t(locale, "shipping"), value: order.shippingMinor === 0 ? t(locale, "free") : money(order.shippingMinor) },
        ]}
        totalLabel={t(locale, "total")}
        total={money(order.totalMinor)}
      />

      {events.length > 0 && (
        <section>
          <h2 className="mb-3">{t(locale, "order_progress")}</h2>
          <Timeline events={events.map((e, i) => ({ title: t(locale, `status_${e.to}` as DictKey), time: fmt(e.ts), done: i < events.length - 1, current: i === events.length - 1 }))} />
        </section>
      )}

      <div className="sh-surface sh-stack">
        <h2 className="h3">{t(locale, "order_next")}</h2>
        <p className="body sh-muted">{t(locale, "order_next_text")}</p>
      </div>
      <div><Button variant="secondary" href={`/${locale}/plants`}>{t(locale, "cta_plants")}</Button></div>
    </div>
  );
}
