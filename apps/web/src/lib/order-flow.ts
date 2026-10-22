import { randomUUID } from "node:crypto";
import { ITEM_TRANSITIONS, ORDER_RELEASES_ITEMS, ORDER_TRANSITIONS, canTransition, type ItemStatus, type OrderStatus } from "./domain";
import { notifyAdmin } from "./notify";
import { formatMoney } from "./shop-calc";
import type { Order, OrderEvent, Store } from "./store/types";

export type Actor = { type: OrderEvent["actorType"]; name?: string };
export type FlowResult = { ok: true; order: Order } | { ok: false; reason: "not_found" | "transition"; order?: Order };

/** Items follow the order: shipped/delivered/returned mirror it, cancelled/refunded put them back on the shelf. */
const ITEM_FOLLOWS: Partial<Record<OrderStatus, ItemStatus>> = { shipped: "shipped", delivered: "delivered", returned: "returned" };

const text: Partial<Record<OrderStatus, string>> = {
  // Katya is notified only about new orders (registerNewOrder) and payments
  paid: "💰 Оплачено",
};

async function syncItems(db: Store, order: Order, to: OrderStatus) {
  const release = ORDER_RELEASES_ITEMS.includes(to);
  const follow = ITEM_FOLLOWS[to];
  if (!release && !follow) return order;

  const items = (await db.listItems()).filter((i) => i.orderId === order.id);
  const changed = items.flatMap((i) => {
    const target: ItemStatus = release ? "ready_for_sale" : follow!;
    if (!canTransition(ITEM_TRANSITIONS, i.status, target)) return [];
    return [{ ...i, status: target, ...(release ? { orderId: undefined } : {}) }];
  });
  if (changed.length) await db.upsertItems(changed);

  if (release) {
    const pots = (await db.listPots()).filter((p) => p.orderId === order.id);
    if (pots.length) await db.upsertPots(pots.map((p) => ({ ...p, status: "planted" as const, orderId: undefined })));
    const next = await db.updateOrder(order.id, { potCodes: [] });
    return next ?? order;
  }
  return order;
}

/** The single place where an order changes status: validates, saves, logs the event, updates items, notifies. */
export async function changeOrderStatus(db: Store, id: string, to: OrderStatus, actor: Actor, note?: string): Promise<FlowResult> {
  const order = await db.getOrder(id);
  if (!order) return { ok: false, reason: "not_found" };
  if (!canTransition(ORDER_TRANSITIONS, order.status, to)) return { ok: false, reason: "transition", order };

  const now = new Date().toISOString();
  const paymentInfo =
    to === "paid" ? { ...order.paymentInfo, status: "paid" as const, paidAt: now }
    : to === "payment_failed" ? { ...order.paymentInfo, status: "failed" as const }
    : to === "refunded" ? { ...order.paymentInfo, status: "refunded" as const, refundedAt: now }
    : order.paymentInfo;
  const updated = (await db.updateOrder(id, { status: to, ...(paymentInfo ? { paymentInfo } : {}) })) ?? order;
  await db.addOrderEvent({ id: randomUUID(), orderId: id, ts: now, from: order.status, to, actorType: actor.type, actor: actor.name, note });
  const final = await syncItems(db, updated, to);

  const label = text[to];
  if (label) await notifyAdmin(`${label}\nЗамовлення ${id} · ${formatMoney(order.totalMinor, order.currency, "uk")}${note ? `\n${note}` : ""}`);
  return { ok: true, order: final };
}

/** Records a brand-new order (creation event + owner notification). */
export async function registerNewOrder(db: Store, order: Order): Promise<void> {
  await db.createOrder({ ...order, paymentInfo: order.paymentInfo ?? { status: order.payment === "cod" ? "none" : "pending" } });
  await db.addOrderEvent({ id: randomUUID(), orderId: order.id, ts: order.createdAt, from: null, to: order.status, actorType: "customer" });
  await notifyAdmin(`🛒 Нове замовлення ${order.id}\n${order.customer.name} · ${order.customer.phone}\n${order.items.map((i) => `${i.title} × ${i.qty}`).join("\n")}\nРазом ${formatMoney(order.totalMinor, order.currency, "uk")} (${order.payment})`);
}

/** Payment provider confirmed the money. Idempotent: a repeated webhook for an already paid order is ignored. */
export async function confirmPayment(db: Store, id: string, reference?: string): Promise<FlowResult> {
  const order = await db.getOrder(id);
  if (!order) return { ok: false, reason: "not_found" };
  if (order.paymentInfo?.status === "paid") return { ok: true, order };
  if (reference) await db.updateOrder(id, { paymentInfo: { ...(order.paymentInfo ?? { status: "pending" }), reference } });
  return changeOrderStatus(db, id, "paid", { type: "webhook" });
}
