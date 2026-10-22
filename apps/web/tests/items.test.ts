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
    expect(displayId("basket", 1)).toBe("САД · 001");
    expect(displayId("basket", 12, "en")).toBe("GARDEN · 012");
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
