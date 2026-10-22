import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { checkCredentials, safeNext, signSession, verifySession } from "@/lib/admin-auth";
import { ORDER_TABS, inTab, matchesQuery, nextAction } from "@/lib/order-groups";
import { ORDER_STATUSES } from "@/lib/domain";
import type { Order } from "@/lib/store/types";

describe("admin sign-in", () => {
  beforeEach(() => { process.env.ADMIN_EMAIL = "Katya@Example.com"; process.env.ADMIN_PASSWORD = "s3cret-pass"; delete process.env.ADMIN_SESSION_SECRET; });
  afterEach(() => { delete process.env.ADMIN_EMAIL; delete process.env.ADMIN_PASSWORD; });

  it("accepts the right e-mail (case-insensitive) and password only", async () => {
    expect(await checkCredentials("katya@example.com", "s3cret-pass")).toBe(true);
    expect(await checkCredentials(" KATYA@example.com ", "s3cret-pass")).toBe(true);
    expect(await checkCredentials("katya@example.com", "wrong")).toBe(false);
    expect(await checkCredentials("other@example.com", "s3cret-pass")).toBe(false);
    expect(await checkCredentials("", "")).toBe(false);
  });
  it("refuses everything when no password is configured", async () => {
    delete process.env.ADMIN_PASSWORD;
    expect(await checkCredentials("katya@example.com", "")).toBe(false);
  });
  it("signs sessions that verify, expire and resist tampering", async () => {
    const now = Date.now();
    const token = await signSession(now);
    expect(await verifySession(token, now)).toBe(true);
    expect(await verifySession(token, now + 13 * 3600 * 1000)).toBe(false);
    const [exp, sig] = token.split(".");
    expect(await verifySession(`${Number(exp) + 1000}.${sig}`, now)).toBe(false);
    expect(await verifySession(`${exp}.${"0".repeat(sig.length)}`, now)).toBe(false);
    expect(await verifySession(undefined)).toBe(false);
    expect(await verifySession("garbage")).toBe(false);
  });
  it("invalidates sessions when the password changes", async () => {
    const token = await signSession();
    process.env.ADMIN_PASSWORD = "another";
    expect(await verifySession(token)).toBe(false);
  });
  it("only returns to local /admin paths", () => {
    expect(safeNext("/admin/orders?tab=todo")).toBe("/admin/orders?tab=todo");
    expect(safeNext("https://evil.example")).toBe("/admin");
    expect(safeNext("//evil.example")).toBe("/admin");
    expect(safeNext("/admin//evil")).toBe("/admin");
    expect(safeNext("/other")).toBe("/admin");
    expect(safeNext(null)).toBe("/admin");
  });
});

const order = (over: Partial<Order> = {}): Order => ({
  id: "SH-1", createdAt: "2026-10-22T10:00:00Z", status: "new", locale: "uk", currency: "UAH", items: [], subtotalMinor: 0, shippingMinor: 0, totalMinor: 0,
  payment: "cod", customer: { name: "Олена Шевченко", email: "o@example.com", phone: "+380501234567" },
  shipping: { kind: "np", country: "UA", city: "Київ", address: "Відділення 1" }, gift: { isGift: false }, potCodes: [], ...over,
});

describe("order tabs and search", () => {
  it("puts every status into exactly one working tab", () => {
    for (const status of ORDER_STATUSES) {
      const tabs = ORDER_TABS.filter((t) => t.key !== "all" && inTab({ status }, t.key));
      expect(tabs.length, status).toBe(1);
    }
    expect(inTab({ status: "paid" }, "all")).toBe(true);
  });
  it("finds orders by id, name, phone digits, e-mail and waybill", () => {
    const o = order({ shipment: { carrier: "nova_poshta", ttn: "20450000111222", createdAt: "x" } });
    expect(matchesQuery(o, "sh-1")).toBe(true);
    expect(matchesQuery(o, "шевченко")).toBe(true);
    expect(matchesQuery(o, "050 123")).toBe(true);
    expect(matchesQuery(o, "o@example")).toBe(true);
    expect(matchesQuery(o, "2045000011")).toBe(true);
    expect(matchesQuery(o, "nobody")).toBe(false);
    expect(matchesQuery(o, "")).toBe(true);
  });
  it("tells the packer what to do next", () => {
    expect(nextAction({ status: "new", payment: "cod" })).toMatch(/підтвердити/);
    expect(nextAction({ status: "new", payment: "stripe" })).toMatch(/оплат/);
    expect(nextAction({ status: "packed", payment: "cod" })).toMatch(/ТТН/);
    expect(nextAction({ status: "completed", payment: "cod" })).toBe("");
  });
});
