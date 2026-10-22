import Link from "next/link";
import { notFound } from "next/navigation";
import { ORDER_TRANSITIONS, type OrderStatus } from "@/lib/domain";
import { dict } from "@/lib/i18n";
import { novaPoshtaConfigured } from "@/lib/novaposhta";
import { nextAction } from "@/lib/order-groups";
import { formatCode } from "@/lib/pots";
import { formatMoney } from "@/lib/shop-calc";
import { store } from "@/lib/store";
import { allocatePots } from "../../actions";
import { addWaybill, saveAdminNote, setStatus, syncTracking } from "../../order-actions";

export const dynamic = "force-dynamic";

const statusUk = (s: string) => (dict as Record<string, { uk: string }>)[`status_${s}`]?.uk ?? s;
const payUk = { cod: "Оплата при отриманні", stripe: "Картка (Stripe)", liqpay: "Картка (LiqPay)" } as const;
const actorUk = { system: "система", admin: "адмін", webhook: "платіжна система", customer: "клієнт" } as const;
const BAD: OrderStatus[] = ["cancelled", "payment_failed", "refund_requested", "return_requested"];

export default async function AdminOrder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ short?: string }> }) {
  const { id } = await params;
  const { short } = await searchParams;
  const db = store();
  const o = await db.getOrder(id);
  if (!o) notFound();
  const events = await db.listOrderEvents(id);
  const money = (m: number) => formatMoney(m, o.currency, "uk");
  const next = ORDER_TRANSITIONS[o.status];
  const action = nextAction(o);
  const canWaybill = o.shipping.kind === "np" && ["cod_confirmed", "paid", "processing", "packed"].includes(o.status);
  return (
    <div className="space-y-6">
      <p><Link href="/admin/orders" className="text-sm text-muted">← Усі замовлення</Link></p>
      <header className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold"><span className="font-mono">{o.id}</span></h1>
        <span className="badge">{statusUk(o.status)}</span>
        <span className="ml-auto text-xl font-bold">{money(o.totalMinor)}</span>
      </header>

      {action && <p className="card bg-soft p-4 font-semibold text-leaf">Далі: {action}</p>}

      {next.length > 0 && (
        <section className="card p-4">
          <h2 className="mb-2 text-lg font-bold">Змінити статус</h2>
          <div className="flex flex-wrap items-center gap-2">
            {next.map((s) => (
              <form key={s} action={setStatus}>
                <input type="hidden" name="id" value={o.id} />
                <input type="hidden" name="status" value={s} />
                <button className={`btn ${BAD.includes(s) ? "btn-ghost" : "btn-primary"}`} type="submit">{statusUk(s)}</button>
              </form>
            ))}
          </div>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5 text-sm">
          <h2 className="mb-2 text-lg font-bold">Клієнт</h2>
          <p className="font-semibold">{o.customer.name}</p>
          <p><a href={`tel:${o.customer.phone}`} className="text-leaf">{o.customer.phone}</a></p>
          <p>{o.customer.email}</p>
          <h2 className="mb-2 mt-4 text-lg font-bold">Доставка ({o.shipping.kind === "np" ? "Нова пошта" : "за кордон"})</h2>
          <p>{o.shipping.country} · {o.shipping.city}</p><p>{o.shipping.address}</p>{o.shipping.postcode && <p>{o.shipping.postcode}</p>}
          {o.gift.isGift && <p className="mt-3 rounded bg-soft p-2">🎁 Подарунок{o.gift.message ? `: ${o.gift.message}` : ""}</p>}
          {o.note && <p className="mt-3 text-muted">Коментар клієнта: {o.note}</p>}
        </section>
        <section className="card p-5 text-sm">
          <h2 className="mb-2 text-lg font-bold">Склад замовлення</h2>
          <ul className="divide-y divide-line">{o.items.map((i, n) => (<li key={n} className="flex justify-between py-2"><span>{i.title} × {i.qty}</span><span>{money(i.unitMinor * i.qty)}</span></li>))}</ul>
          <p className="mt-2 flex justify-between"><span>Доставка</span><span>{money(o.shippingMinor)}</span></p>
          <p className="flex justify-between text-lg font-bold"><span>Разом</span><span>{money(o.totalMinor)}</span></p>
          <p className="mt-2 text-muted">{payUk[o.payment]}{o.paymentInfo?.status === "paid" ? " · сплачено" : ""}{o.paymentInfo?.status === "refunded" ? " · кошти повернено" : ""}</p>
        </section>
      </div>

      <section className="card p-5">
        <h2 className="mb-2 text-lg font-bold">QR-коди цього замовлення</h2>
        {short && <p role="alert" className="mb-3 rounded-lg bg-soft p-3 font-semibold text-clay">⚠️ Не вистачає на складі: {short}. Створіть партію в «Горщики й QR» і виділіть ще раз.</p>}
        {o.potCodes.length > 0 && !short ? (
          <ul className="flex flex-wrap gap-2">{o.potCodes.map((c) => (<li key={c} className="badge font-mono">{formatCode(c)}</li>))}</ul>
        ) : (
          <form action={allocatePots}><input type="hidden" name="id" value={o.id} /><button className="btn btn-clay" type="submit">Виділити горщики зі складу</button></form>
        )}
      </section>

      {o.shipping.kind === "np" && (
        <section className="card p-5 text-sm">
          <h2 className="mb-2 text-lg font-bold">Відправлення (Нова пошта)</h2>
          {o.shipment ? (
            <>
              <p>ТТН: <span className="font-mono font-semibold">{o.shipment.ttn}</span> · <a className="text-leaf underline" href={`https://novaposhta.ua/tracking/?cargo_number=${o.shipment.ttn}`} target="_blank" rel="noopener noreferrer">стеження</a></p>
              {o.shipment.status && <p className="text-muted">Статус: {o.shipment.status}{o.shipment.trackedAt ? ` (${o.shipment.trackedAt.slice(0, 16).replace("T", " ")})` : ""}</p>}
              {novaPoshtaConfigured() && <form action={syncTracking} className="mt-2"><input type="hidden" name="id" value={o.id} /><button className="btn btn-ghost" type="submit">Оновити статус посилки</button></form>}
            </>
          ) : canWaybill ? (
            <form action={addWaybill} className="flex flex-wrap items-end gap-2">
              <input type="hidden" name="id" value={o.id} />
              <label className="field"><span>ТТН (залиште порожнім, щоб створити автоматично)</span><input name="ttn" inputMode="numeric" className="input" placeholder="20450000000000" /></label>
              <button className="btn btn-primary" type="submit">{novaPoshtaConfigured() ? "Створити/додати ТТН і відправити" : "Додати ТТН і відправити"}</button>
              {!novaPoshtaConfigured() && <p className="basis-full text-muted">Автоматичне створення вимкнене (немає NOVA_POSHTA_API_KEY): введіть номер ТТН вручну.</p>}
              {(!o.shipping.cityRef || !o.shipping.warehouseRef) && novaPoshtaConfigured() && <p className="basis-full text-muted">Клієнт не обрав відділення зі списку: автоматична ТТН недоступна, створіть її в кабінеті Нової пошти й введіть номер.</p>}
            </form>
          ) : <p className="text-muted">ТТН можна додати, коли замовлення оплачене/підтверджене.</p>}
        </section>
      )}

      <section className="card p-5 text-sm">
        <h2 className="mb-2 text-lg font-bold">Нотатка для себе</h2>
        <form action={saveAdminNote} className="flex gap-2"><input type="hidden" name="id" value={o.id} /><input name="note" defaultValue={o.adminNote ?? ""} className="input" maxLength={1000} aria-label="Нотатка" /><button className="btn btn-ghost" type="submit">Зберегти</button></form>
      </section>

      <section className="card p-5 text-sm">
        <h2 className="mb-3 text-lg font-bold">Історія</h2>
        {events.length === 0 ? <p className="text-muted">Подій ще немає.</p> : (
          <ol className="space-y-2 border-l-2 border-line pl-4">
            {events.map((e) => (
              <li key={e.id}>
                <span className="font-semibold">{e.from === e.to ? "Примітка" : statusUk(e.to)}</span>
                <span className="text-muted"> · {e.ts.slice(0, 16).replace("T", " ")} · {actorUk[e.actorType]}{e.actor ? ` (${e.actor})` : ""}</span>
                {e.note && <p className="text-muted">{e.note}</p>}
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
