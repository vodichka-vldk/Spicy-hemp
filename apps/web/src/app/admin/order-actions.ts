"use server";

import { revalidatePath } from "next/cache";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/domain";
import { createWaybill, novaPoshtaConfigured, trackWaybill } from "@/lib/novaposhta";
import { changeOrderStatus } from "@/lib/order-flow";
import { store } from "@/lib/store";

const actor = { type: "admin" as const, name: "Адмін" };
const refresh = (id: string) => { revalidatePath("/admin/orders"); revalidatePath(`/admin/orders/${id}`); revalidatePath("/admin"); };

/** Moves an order to the next status (only transitions the state machine allows). */
export async function setStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) return;
  await changeOrderStatus(store(), id, status, actor, String(formData.get("note") ?? "").trim() || undefined);
  refresh(id);
}

export async function saveAdminNote(formData: FormData) {
  const id = String(formData.get("id"));
  await store().updateOrder(id, { adminNote: String(formData.get("note") ?? "").trim().slice(0, 1000) || undefined });
  refresh(id);
}

/** Waybill: created through the Nova Poshta API, or typed in by hand when the packer made it elsewhere. Then the order is "shipped". */
export async function addWaybill(formData: FormData) {
  const id = String(formData.get("id"));
  const db = store();
  const order = await db.getOrder(id);
  if (!order) return;
  let ttn = String(formData.get("ttn") ?? "").replace(/\s/g, "");
  let ref: string | undefined;
  if (!ttn) {
    if (!novaPoshtaConfigured()) return;
    try { ({ ttn, ref } = await createWaybill(order)); }
    catch (err) {
      await db.addOrderEvent({ id: crypto.randomUUID(), orderId: id, ts: new Date().toISOString(), from: order.status, to: order.status, actorType: "admin", actor: actor.name, note: `Не вдалося створити ТТН: ${err instanceof Error ? err.message : "помилка"}` });
      refresh(id);
      return;
    }
  }
  if (!/^\d{10,16}$/.test(ttn)) return;
  await db.updateOrder(id, { shipment: { carrier: "nova_poshta", ttn, ref, createdAt: new Date().toISOString() } });
  if (order.status === "packed") await changeOrderStatus(db, id, "shipped", actor, `ТТН ${ttn}`);
  refresh(id);
}

/** Asks Nova Poshta where the parcel is; a delivered parcel moves the order to "delivered". */
export async function syncTracking(formData: FormData) {
  const id = String(formData.get("id"));
  const db = store();
  const order = await db.getOrder(id);
  if (!order?.shipment || !novaPoshtaConfigured()) return;
  const t = await trackWaybill(order.shipment.ttn, order.customer.phone).catch(() => null);
  if (!t) return;
  await db.updateOrder(id, { shipment: { ...order.shipment, status: t.status, trackedAt: new Date().toISOString() } });
  if (t.delivered && order.status === "shipped") await changeOrderStatus(db, id, "delivered", { type: "system", name: "Нова пошта" }, t.status);
  refresh(id);
}
