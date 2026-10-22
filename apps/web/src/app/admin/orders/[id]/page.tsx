import { notFound } from "next/navigation";
import { Alert, Badge, Button, Grid, Input, Timeline } from "@/ds";
import { Facts, PageHeader, Panel, StatusBadge } from "@/ui";
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
    <div className="sh-stack-lg">
      <PageHeader
        back={{ href: "/admin/orders", label: "Усі замовлення" }}
        title={<span className="font-mono">{o.id}</span>}
        actions={<><StatusBadge kind="order" status={o.status} label={statusUk(o.status)} /><span className="h3">{money(o.totalMinor)}</span></>}
      />

      {action && <Alert tone="info">Далі: {action}</Alert>}

      {next.length > 0 && (
        <Panel title="Змінити статус">
          <div className="flex flex-wrap items-center gap-2">
            {next.map((s) => (
              <form key={s} action={setStatus}>
                <input type="hidden" name="id" value={o.id} />
                <input type="hidden" name="status" value={s} />
                <Button type="submit" variant={BAD.includes(s) ? "secondary" : "primary"}>{statusUk(s)}</Button>
              </form>
            ))}
          </div>
        </Panel>
      )}

      <Grid cols="two">
        <Panel title="Клієнт і доставка">
          <Facts items={[
            { label: "Клієнт", value: o.customer.name },
            { label: "Телефон", value: <a href={`tel:${o.customer.phone}`}>{o.customer.phone}</a> },
            { label: "Пошта", value: o.customer.email },
            { label: o.shipping.kind === "np" ? "Нова пошта" : "За кордон", value: `${o.shipping.country} · ${o.shipping.city}, ${o.shipping.address}${o.shipping.postcode ? `, ${o.shipping.postcode}` : ""}` },
          ]} />
          {o.gift.isGift && <Alert tone="info" title="Подарунок">{o.gift.message ?? ""}</Alert>}
          {o.note && <p className="body-sm sh-muted">Коментар клієнта: {o.note}</p>}
        </Panel>
        <Panel title="Склад замовлення">
          <ul className="sh-stack body-sm">{o.items.map((i, n) => (<li key={n} className="flex justify-between"><span>{i.title} × {i.qty}</span><span>{money(i.unitMinor * i.qty)}</span></li>))}</ul>
          <p className="body-sm flex justify-between"><span>Доставка</span><span>{money(o.shippingMinor)}</span></p>
          <p className="h3 flex justify-between"><span>Разом</span><span>{money(o.totalMinor)}</span></p>
          <p className="body-sm sh-muted">{payUk[o.payment]}{o.paymentInfo?.status === "paid" ? " · сплачено" : ""}{o.paymentInfo?.status === "refunded" ? " · кошти повернено" : ""}</p>
        </Panel>
      </Grid>

      <Panel title="QR-коди цього замовлення">
        {short && <Alert tone="danger">Не вистачає на складі: {short}. Створіть партію в «Горщики й QR» і виділіть ще раз.</Alert>}
        {o.potCodes.length > 0 && !short ? (
          <ul className="flex flex-wrap gap-2">{o.potCodes.map((c) => (<li key={c}><Badge tone="leaf"><span className="font-mono">{formatCode(c)}</span></Badge></li>))}</ul>
        ) : (
          <form action={allocatePots}><input type="hidden" name="id" value={o.id} /><Button type="submit" variant="accent">Виділити горщики зі складу</Button></form>
        )}
      </Panel>

      {o.shipping.kind === "np" && (
        <Panel title="Відправлення (Нова пошта)">
          {o.shipment ? (
            <>
              <p>ТТН: <span className="font-mono font-semibold">{o.shipment.ttn}</span> · <a className="underline" href={`https://novaposhta.ua/tracking/?cargo_number=${o.shipment.ttn}`} target="_blank" rel="noopener noreferrer">стеження</a></p>
              {o.shipment.status && <p className="body-sm sh-muted">Статус: {o.shipment.status}{o.shipment.trackedAt ? ` (${o.shipment.trackedAt.slice(0, 16).replace("T", " ")})` : ""}</p>}
              {novaPoshtaConfigured() && <form action={syncTracking}><input type="hidden" name="id" value={o.id} /><Button type="submit" variant="secondary">Оновити статус посилки</Button></form>}
            </>
          ) : canWaybill ? (
            <form action={addWaybill} className="sh-stack">
              <input type="hidden" name="id" value={o.id} />
              <Input name="ttn" label="ТТН (залиште порожнім, щоб створити автоматично)" inputMode="numeric" placeholder="20450000000000" />
              <div><Button type="submit" variant="primary">{novaPoshtaConfigured() ? "Створити/додати ТТН і відправити" : "Додати ТТН і відправити"}</Button></div>
              {!novaPoshtaConfigured() && <p className="body-sm sh-muted">Автоматичне створення вимкнене (немає NOVA_POSHTA_API_KEY): введіть номер ТТН вручну.</p>}
              {(!o.shipping.cityRef || !o.shipping.warehouseRef) && novaPoshtaConfigured() && <p className="body-sm sh-muted">Клієнт не обрав відділення зі списку: автоматична ТТН недоступна, створіть її в кабінеті Нової пошти й введіть номер.</p>}
            </form>
          ) : <p className="sh-muted">ТТН можна додати, коли замовлення оплачене/підтверджене.</p>}
        </Panel>
      )}

      <Panel title="Нотатка для себе">
        <form action={saveAdminNote} className="flex flex-wrap items-end gap-2">
          <input type="hidden" name="id" value={o.id} />
          <div style={{ flex: "1 1 16rem" }}><Input name="note" defaultValue={o.adminNote ?? ""} maxLength={1000} aria-label="Нотатка" /></div>
          <Button type="submit" variant="secondary">Зберегти</Button>
        </form>
      </Panel>

      <Panel title="Історія">
        {events.length === 0 ? <p className="sh-muted">Подій ще немає.</p> : (
          <Timeline events={events.map((e, i) => ({
            title: e.from === e.to ? "Примітка" : statusUk(e.to),
            time: `${e.ts.slice(0, 16).replace("T", " ")} · ${actorUk[e.actorType]}${e.actor ? ` (${e.actor})` : ""}${e.note ? ` · ${e.note}` : ""}`,
            done: i < events.length - 1, current: i === events.length - 1,
          }))} />
        )}
      </Panel>
    </div>
  );
}
