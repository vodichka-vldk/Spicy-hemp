"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProduct } from "@/lib/shop";
import { makeCode } from "@/lib/pots";
import { getHerb } from "@/lib/content";
import { store, type Item, type OrderStatus, type Pot } from "@/lib/store";
import { ORDER_STATUSES, ORDER_TRANSITIONS, canTransition } from "@/lib/domain";

export async function setStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) return;
  const current = await store().getOrder(id);
  if (!current || !canTransition(ORDER_TRANSITIONS, current.status, status)) return;
  await store().updateOrder(id, { status });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

/** Reserves what was ordered: one basket (with its own QR) per set unit, one planted pot per single plant. */
export async function allocatePots(formData: FormData) {
  const id = String(formData.get("id"));
  const db = store();
  const order = await db.getOrder(id);
  if (!order || order.potCodes.length > 0) return;
  const free = (await db.listPots()).filter((p) => p.status === "planted" && !p.orderId);
  const freeItems = (await db.listItems()).filter((i) => i.status === "ready_for_sale" && !i.orderId);
  const taken: Pot[] = [];
  const takenItems: Item[] = [];
  let needed = 0;
  for (const item of order.items) {
    const product = getProduct(item.slug);
    if (!product) continue;
    if (product.kind === "set") {
      for (let n = 0; n < item.qty; n++) {
        needed++;
        const i = freeItems.findIndex((b) => b.product === product.slug);
        if (i < 0) continue;
        takenItems.push({ ...freeItems[i], status: "sold", orderId: id });
        freeItems.splice(i, 1);
      }
      continue;
    }
    for (const herb of product.herbs) {
      for (let n = 0; n < item.qty; n++) {
        needed++;
        const i = free.findIndex((p) => p.species === herb);
        if (i < 0) continue;
        taken.push({ ...free[i], status: "sold", orderId: id });
        free.splice(i, 1);
      }
    }
  }
  if (taken.length + takenItems.length > 0) {
    if (taken.length) await db.upsertPots(taken);
    if (takenItems.length) await db.upsertItems(takenItems);
    await db.updateOrder(id, { potCodes: [...takenItems.map((i) => i.code), ...taken.map((p) => p.code)] });
  }
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/pots");
  // Tell the packer when stock is short instead of failing silently.
  if (taken.length + takenItems.length < needed) redirect(`/admin/orders/${id}?short=${needed - taken.length - takenItems.length}`);
}

export async function generateBatch(formData: FormData) {
  const species = String(formData.get("species"));
  const count = Math.min(500, Math.max(1, Number(formData.get("count")) || 1));
  const batch = String(formData.get("batch") || "").trim().slice(0, 40) || `B-${new Date().toISOString().slice(0, 10)}`;
  if (!getHerb(species)) return;
  const db = store();
  const existing = new Set((await db.listPots()).map((p) => p.code));
  const pots: Pot[] = [];
  while (pots.length < count) {
    const code = makeCode();
    if (existing.has(code)) continue;
    existing.add(code);
    pots.push({ code, species, batch, plantedOn: new Date().toISOString().slice(0, 10), status: "planted" });
  }
  await db.upsertPots(pots);
  revalidatePath("/admin/pots");
}

/** Makes a batch of baskets of one set; each gets its own QR code and "САД · NNN" number. */
export async function generateBasketBatch(formData: FormData) {
  const slug = String(formData.get("product"));
  const product = getProduct(slug);
  if (!product || product.kind !== "set") return;
  const count = Math.min(200, Math.max(1, Number(formData.get("count")) || 1));
  const batch = String(formData.get("batch") || "").trim().slice(0, 40) || `K-${new Date().toISOString().slice(0, 10)}`;
  const db = store();
  const existing = new Set([...(await db.listPots()).map((p) => p.code), ...(await db.listItems()).map((i) => i.code)]);
  const items: Array<Omit<Item, "displayNo">> = [];
  while (items.length < count) {
    const code = makeCode();
    if (existing.has(code)) continue;
    existing.add(code);
    items.push({ code, kind: "basket", product: slug, species: product.herbs, batch, readyOn: new Date().toISOString().slice(0, 10), status: "ready_for_sale" });
  }
  await db.upsertItems(items);
  revalidatePath("/admin/pots");
}
