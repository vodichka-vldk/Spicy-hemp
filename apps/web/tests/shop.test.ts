import { describe, expect, it } from "vitest";
import { computeTotals, formatMoney, getProduct, priceMinor, products } from "@/lib/shop";

describe("pricing", () => {
  it("converts to minor units for both currencies", () => {
    expect(priceMinor(800, "UAH")).toBe(80000);
    expect(priceMinor(1000, "EUR")).toBe(2200);
  });

  it("applies a 10% discount to sets", () => {
    const set = getProduct("set-tea")!;
    const sum = set.herbs.reduce((s, h) => s + getProduct(h)!.priceUah, 0);
    expect(set.priceUah).toBeLessThan(sum);
    expect(set.priceUah).toBeGreaterThan(sum * 0.85);
  });

  it("charges shipping below the free threshold and none above", () => {
    const one = computeTotals([{ slug: "basil", glaze: "sage", qty: 1 }], "UAH", "np");
    expect(one.shipping).toBe(10000);
    expect(one.total).toBe(one.subtotal + one.shipping);
    const many = computeTotals([{ slug: "basil", glaze: "sage", qty: 3 }], "UAH", "np");
    expect(many.shipping).toBe(0);
  });

  it("returns zero for an empty cart and ignores unknown products", () => {
    expect(computeTotals([], "UAH", "np").total).toBe(0);
    expect(computeTotals([{ slug: "nope", glaze: "sage", qty: 2 }], "EUR", "intl").subtotal).toBe(0);
  });

  it("formats money per locale", () => {
    expect(formatMoney(80000, "UAH", "uk")).toMatch(/800/);
    expect(formatMoney(2200, "EUR", "en")).toMatch(/22/);
  });

  it("all products are priced above the shipping-free-test minimum sanity", () => {
    for (const p of products) expect(p.priceUah).toBeGreaterThan(300);
  });
});
