import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { basketContent } from "@/data/baskets";
import { cardSections } from "@/lib/card";
import { CARE_SECTIONS, displayId, suggestGardenNames } from "@/lib/domain";
import { isValidCode } from "@/lib/pots";
import { products } from "@/lib/shop";

describe("display ids and name ideas", () => {
  it("numbers per kind with localized prefixes", () => {
    expect(displayId("basket", 1)).toBe("ГОРЩИК · 001");
    expect(displayId("basket", 12, "en")).toBe("POT · 012");
    expect(displayId("single", 3)).toBe("РОСЛИНА · 003");
    expect(displayId("single", 3, "en")).toBe("PLANT · 003");
  });
  it("puts themed ideas first and limits the count", () => {
    const ideas = suggestGardenNames("basket", "uk", ["для чаю"]);
    expect(ideas[0]).toBe("для чаю");
    expect(ideas).toHaveLength(4);
    expect(suggestGardenNames("single", "en", [], 2)).toHaveLength(2);
  });
});

describe("card sections", () => {
  it("every set has authored text for all six sections in both languages", () => {
    for (const p of products.filter((x) => x.kind === "set")) {
      const c = basketContent[p.slug];
      expect(c, p.slug).toBeTruthy();
      for (const k of CARE_SECTIONS) { expect(c[k].uk.length, `${p.slug}.${k}.uk`).toBeGreaterThan(20); expect(c[k].en.length, `${p.slug}.${k}.en`).toBeGreaterThan(20); }
    }
  });
  it("builds six titled sections for baskets and falls back to the herb passport for singles", () => {
    expect(cardSections("set-tea", "uk").map((s) => s.key)).toEqual([...CARE_SECTIONS]);
    expect(cardSections("set-tea", "en")[1].title).toBe("How to water");
    const single = cardSections("basil", "en");
    expect(single).toHaveLength(6);
    expect(single[1].body).toMatch(/Water when the top layer/);
  });
  it("lets per-item overrides win", () => {
    const s = cardSections("set-tea", "uk", { watering: { uk: "Своє", en: "Own" } });
    expect(s.find((x) => x.key === "watering")?.body).toBe("Своє");
  });
  it("returns nothing for unknown products", () => {
    expect(cardSections("nope", "uk")).toEqual([]);
  });
});

describe("file store items", () => {
  it("seeds demo baskets, numbers new ones per kind and keeps numbers on update", async () => {
    process.chdir(mkdtempSync(join(tmpdir(), "sh-")));
    const { fileStore } = await import("@/lib/store/file");
    const demo = await fileStore.listItems();
    expect(demo.map((i) => i.displayNo)).toEqual([1, 2, 3]);
    expect(demo.every((i) => isValidCode(i.code) && i.kind === "basket")).toBe(true);

    await fileStore.upsertItems([{ code: "ZZZZ2222", kind: "basket", product: "set-tea", species: ["mint"], batch: "T", readyOn: "2026-10-22", status: "ready_for_sale" }]);
    expect((await fileStore.getItem("ZZZZ2222"))?.displayNo).toBe(4);
    await fileStore.upsertItems([{ code: "ZZZZ2222", kind: "basket", product: "set-tea", species: ["mint"], batch: "T", readyOn: "2026-10-22", status: "sold", orderId: "SH-1" }]);
    const after = await fileStore.getItem("ZZZZ2222");
    expect(after).toMatchObject({ displayNo: 4, status: "sold", orderId: "SH-1" });
    await fileStore.upsertItems([{ code: "YYYY3333", kind: "single", product: "basil", species: ["basil"], batch: "T", readyOn: "2026-10-22", status: "draft" }]);
    expect((await fileStore.getItem("YYYY3333"))?.displayNo).toBe(1);
  });
});

import { averageRating, isPublic, reviewPhotoUrl } from "@/lib/reviews";

describe("reviews", () => {
  it("averages ratings and handles none", () => {
    expect(averageRating([])).toBeNull();
    expect(averageRating([{ rating: 5 }, { rating: 4 }, { rating: 4 }])).toBe(4.3);
  });
  it("is public only with consent and approval", () => {
    expect(isPublic({ status: "approved", consentPublic: true })).toBe(true);
    expect(isPublic({ status: "approved", consentPublic: false })).toBe(false);
    expect(isPublic({ status: "pending", consentPublic: true })).toBe(false);
  });
  it("builds safe photo urls only when storage is configured", () => {
    delete process.env.SUPABASE_URL;
    expect(reviewPhotoUrl("a/b.jpg")).toBeNull();
    process.env.SUPABASE_URL = "https://x.supabase.co/";
    expect(reviewPhotoUrl("a/b c.jpg")).toBe("https://x.supabase.co/storage/v1/object/public/reviews/a/b%20c.jpg");
    expect(reviewPhotoUrl("../secret")).toBeNull();
    delete process.env.SUPABASE_URL;
  });
  it("file store refuses to approve a review without consent and filters by product/status", async () => {
    process.chdir(mkdtempSync(join(tmpdir(), "sh-")));
    const { fileStore } = await import("@/lib/store/file");
    const base = { product: "set-tea", rating: 5 as const, locale: "uk" as const, photos: [], createdAt: "2026-10-22T10:00:00Z" };
    await fileStore.upsertReview({ ...base, id: "r1", consentPublic: false, status: "pending" });
    await expect(fileStore.upsertReview({ ...base, id: "r1", consentPublic: false, status: "approved" })).rejects.toThrow(/consent/);
    await fileStore.upsertReview({ ...base, id: "r2", consentPublic: true, status: "approved", createdAt: "2026-10-23T10:00:00Z" });
    expect((await fileStore.listReviews({ product: "set-tea", status: "approved" })).map((r) => r.id)).toEqual(["r2"]);
    expect(await fileStore.listReviews({ product: "basil" })).toEqual([]);
  });
});
