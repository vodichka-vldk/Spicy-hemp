import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildOrder } from "@/lib/orders";

type Flow = typeof import("@/lib/order-flow");
let flow: Flow;
let db: typeof import("@/lib/store/file").fileStore;

beforeAll(async () => {
  process.chdir(mkdtempSync(join(tmpdir(), "sh-flow-")));
  flow = await import("@/lib/order-flow");
  db = (await import("@/lib/store/file")).fileStore;
});

const newOrder = (payment: "cod" | "stripe" = "cod") =>
  buildOrder({
    locale: "uk", lines: [{ slug: "set-tea", glaze: "sage", qty: 1 }],
    customer: { name: "Олена Шевченко", email: "o@example.com", phone: "+380501234567" },
    shipping: { kind: "np", country: "UA", city: "Київ", address: "Відділення 12" }, payment, agree: true,
  });
const actor = { type: "admin" as const, name: "Каті" };

describe("order flow", () => {
  it("records the creation event and payment info", async () => {
    const o = newOrder("stripe");
    await flow.registerNewOrder(db, o);
    expect((await db.getOrder(o.id))?.paymentInfo).toEqual({ status: "pending" });
    const ev = await db.listOrderEvents(o.id);
    expect(ev).toHaveLength(1);
    expect(ev[0]).toMatchObject({ from: null, to: "pending_payment", actorType: "customer" });
  });

  it("walks a cash-on-delivery order to completion with an event per step", async () => {
    const o = newOrder("cod");
    await flow.registerNewOrder(db, o);
    for (const to of ["cod_confirmed", "processing", "packed", "shipped", "delivered", "completed"] as const) {
      const r = await flow.changeOrderStatus(db, o.id, to, actor);
      expect(r.ok, to).toBe(true);
    }
    expect((await db.getOrder(o.id))?.status).toBe("completed");
    expect((await db.listOrderEvents(o.id)).map((e) => e.to)).toEqual(["new", "cod_confirmed", "processing", "packed", "shipped", "delivered", "completed"]);
  });

  it("refuses transitions the state machine does not allow", async () => {
    const o = newOrder("cod");
    await flow.registerNewOrder(db, o);
    const r = await flow.changeOrderStatus(db, o.id, "delivered", actor);
    expect(r).toMatchObject({ ok: false, reason: "transition" });
    expect((await db.getOrder(o.id))?.status).toBe("new");
    expect(await flow.changeOrderStatus(db, "SH-NOPE", "paid", actor)).toMatchObject({ ok: false, reason: "not_found" });
  });

  it("confirms payment once even when the webhook is repeated", async () => {
    const o = newOrder("stripe");
    await flow.registerNewOrder(db, o);
    expect((await flow.confirmPayment(db, o.id, "pi_123")).ok).toBe(true);
    expect((await flow.confirmPayment(db, o.id, "pi_123")).ok).toBe(true);
    const saved = await db.getOrder(o.id);
    expect(saved?.status).toBe("paid");
    expect(saved?.paymentInfo).toMatchObject({ status: "paid", reference: "pi_123" });
    expect((await db.listOrderEvents(o.id)).filter((e) => e.to === "paid")).toHaveLength(1);
  });

  it("lets a failed payment be retried", async () => {
    const o = newOrder("stripe");
    await flow.registerNewOrder(db, o);
    await flow.changeOrderStatus(db, o.id, "payment_failed", { type: "webhook" });
    expect((await flow.changeOrderStatus(db, o.id, "pending_payment", { type: "customer" })).ok).toBe(true);
    expect((await flow.confirmPayment(db, o.id)).ok).toBe(true);
  });

  it("puts reserved baskets and pots back on the shelf when the order is cancelled", async () => {
    const o = newOrder("cod");
    await flow.registerNewOrder(db, o);
    await db.upsertItems([{ code: "FLOW2222", kind: "basket", product: "set-tea", species: ["mint"], batch: "T", readyOn: "2026-10-22", status: "sold", orderId: o.id }]);
    await db.upsertPots([{ code: "FLOW3333", species: "basil", batch: "T", plantedOn: "2026-10-22", status: "sold", orderId: o.id }]);
    await db.updateOrder(o.id, { potCodes: ["FLOW2222", "FLOW3333"] });
    expect((await flow.changeOrderStatus(db, o.id, "cancelled", actor, "Клієнт передумав")).ok).toBe(true);
    expect(await db.getItem("FLOW2222")).toMatchObject({ status: "ready_for_sale" });
    expect((await db.getItem("FLOW2222"))?.orderId).toBeUndefined();
    expect(await db.getPot("FLOW3333")).toMatchObject({ status: "planted" });
    expect((await db.getOrder(o.id))?.potCodes).toEqual([]);
    expect((await db.listOrderEvents(o.id)).at(-1)).toMatchObject({ to: "cancelled", note: "Клієнт передумав", actor: "Каті" });
  });

  it("moves baskets to shipped and delivered with the order", async () => {
    const o = newOrder("cod");
    await flow.registerNewOrder(db, o);
    await db.upsertItems([{ code: "FLOW4444", kind: "basket", product: "set-tea", species: ["mint"], batch: "T", readyOn: "2026-10-22", status: "sold", orderId: o.id }]);
    for (const to of ["cod_confirmed", "packed", "shipped"] as const) await flow.changeOrderStatus(db, o.id, to, actor);
    expect((await db.getItem("FLOW4444"))?.status).toBe("shipped");
    await flow.changeOrderStatus(db, o.id, "delivered", actor);
    expect((await db.getItem("FLOW4444"))?.status).toBe("delivered");
  });
});
