import { afterEach, describe, expect, it } from "vitest";
import { buildOrder, newOrderId, paymentMethodsFor, validateOrder } from "@/lib/orders";

const good = {
  locale: "uk",
  lines: [{ slug: "basil", glaze: "sage", qty: 2 }],
  customer: { name: "Олена Шевченко", email: "olena@example.com", phone: "+380 50 123 45 67" },
  shipping: { kind: "np", city: "Київ", address: "Відділення 12" },
  payment: "cod",
  agree: true,
};

describe("order validation", () => {
  it("accepts a valid Ukrainian cash-on-delivery order", () => {
    const v = validateOrder(good);
    expect(v.ok).toBe(true);
  });

  it("reports missing and malformed fields", () => {
    const v = validateOrder({ ...good, customer: { name: "", email: "bad", phone: "12" }, agree: false, lines: [] });
    expect(v.ok).toBe(false);
    if (!v.ok) {
      expect(v.errors).toMatchObject({ name: "required", email: "invalid_email", phone: "invalid_phone", agree: "required", lines: "required" });
    }
  });

  it("drops unknown products and clamps nonsense quantities", () => {
    const v = validateOrder({ ...good, lines: [{ slug: "unknown", glaze: "sage", qty: 1 }, { slug: "mint", glaze: "x", qty: 99 }, { slug: "mint", glaze: "sage", qty: 1.5 }] });
    expect(v.ok).toBe(false);
  });

  it("falls back to a valid glaze", () => {
    const v = validateOrder({ ...good, lines: [{ slug: "mint", glaze: "hax", qty: 1 }] });
    expect(v.ok && v.value.lines[0].glaze).toBe("sage");
  });

  it("requires country and postcode for international shipping and rejects COD there", () => {
    const v = validateOrder({ ...good, locale: "en", shipping: { kind: "intl", city: "Berlin", address: "Str 1" } });
    expect(v.ok).toBe(false);
    if (!v.ok) expect(v.errors).toMatchObject({ country: "required", postcode: "required", payment: "invalid" });
  });

  it("rejects non-object bodies", () => {
    expect(validateOrder(null).ok).toBe(false);
    expect(validateOrder("x").ok).toBe(false);
  });
});

describe("order building", () => {
  it("computes prices on the server and never trusts the client", () => {
    const v = validateOrder({ ...good, items: [{ unitMinor: 1 }], total: 1 });
    if (!v.ok) throw new Error("invalid");
    const o = buildOrder(v.value, new Date("2026-10-12T10:00:00Z"));
    expect(o.status).toBe("new");
    expect(o.currency).toBe("UAH");
    expect(o.totalMinor).toBe(o.subtotalMinor + o.shippingMinor);
    expect(o.items[0].unitMinor).toBe(84000); // 450 pot + 390 basil, UAH
    expect(o.subtotalMinor).toBe(168000);
    expect(o.id).toMatch(/^SH-261012-[A-Z2-9]{8}$/);
  });

  it("makes unique, hard-to-guess ids", () => {
    const ids = new Set(Array.from({ length: 2000 }, () => newOrderId()));
    expect(ids.size).toBe(2000);
  });
});

describe("payment methods", () => {
  const saved = { ...process.env };
  afterEach(() => { process.env = { ...saved }; });

  it("offers only cash on delivery without provider keys", () => {
    delete process.env.STRIPE_SECRET_KEY; delete process.env.LIQPAY_PUBLIC_KEY; delete process.env.LIQPAY_PRIVATE_KEY;
    expect(paymentMethodsFor({ shippingKind: "np", currency: "UAH" })).toEqual(["cod"]);
    expect(paymentMethodsFor({ shippingKind: "intl", currency: "EUR" })).toEqual([]);
  });

  it("adds providers by currency when configured", () => {
    process.env.STRIPE_SECRET_KEY = "sk"; process.env.LIQPAY_PUBLIC_KEY = "pk"; process.env.LIQPAY_PRIVATE_KEY = "sk2";
    expect(paymentMethodsFor({ shippingKind: "intl", currency: "EUR" })).toEqual(["stripe"]);
    expect(paymentMethodsFor({ shippingKind: "np", currency: "UAH" })).toEqual(["cod", "liqpay"]);
  });
});
