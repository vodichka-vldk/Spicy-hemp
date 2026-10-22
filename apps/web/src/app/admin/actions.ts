"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getProduct } from "@/lib/shop";
import { makeCode } from "@/lib/pots";
import { getHerb } from "@/lib/content";
import { store, type OrderStatus, type Pot } from "@/lib/store";

const STATUSES: OrderStatus[] = ["new", "pending_payment", "paid", "packed", "shipped", "delivered", "cancelled"];

export async function setStatus(formData: FormData) {
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  if (!STATUSES.includes(status)) return;
  await store().updateOrder(id, { status });
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
}

/** Reserves one planted pot per unit ordered (sets expand to their herbs). */
export async function allocatePots(formData: FormData) {
  const id = String(formData.get("id"));
  const db = store();
  const order = await db.getOrder(id);
  if (!order || order.potCodes.length > 0) return;
  const free = (await db.listPots()).filter((p) => p.status === "planted" && !p.orderId);
  const taken: Pot[] = [];
  let needed = 0;
  for (const item of order.items) {
    const product = getProduct(item.slug);
    if (!product) continue;
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
  if (taken.length > 0) {
    await db.upsertPots(taken);
    await db.updateOrder(id, { potCodes: taken.map((p) => p.code) });
  }
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/pots");
  // Tell the packer when stock is short instead of failing silently.
  if (taken.length < needed) redirect(`/admin/orders/${id}?short=${needed - taken.length}`);
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
