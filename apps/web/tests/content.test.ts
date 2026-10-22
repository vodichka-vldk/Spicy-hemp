import { describe, expect, it } from "vitest";
import { families } from "@/data/families";
import { herbs } from "@/data/herbs";
import { guides, infoPages } from "@/data/pages";
import { dict } from "@/lib/i18n";
import { products } from "@/lib/shop";

const both = (v: { uk: string; en: string }) => v.uk.trim().length > 0 && v.en.trim().length > 0;

describe("content integrity", () => {
  it("has the 15 starter herbs with unique slugs", () => {
    expect(herbs).toHaveLength(15);
    expect(new Set(herbs.map((h) => h.slug)).size).toBe(15);
  });

  it("every herb is fully translated and references existing families/companions", () => {
    const famSlugs = new Set(families.map((f) => f.slug));
    const slugs = new Set(herbs.map((h) => h.slug));
    for (const h of herbs) {
      expect(famSlugs.has(h.family), `${h.slug} family`).toBe(true);
      expect(both(h.names) && both(h.tagline) && both(h.waterNote), `${h.slug} basics`).toBe(true);
      for (const [k, v] of Object.entries(h.sections)) expect(both(v), `${h.slug}.${k}`).toBe(true);
      expect(h.problems.length, `${h.slug} problems`).toBeGreaterThanOrEqual(3);
      for (const p of h.problems) expect(both(p.symptom) && both(p.fix)).toBe(true);
      expect(h.varieties.length, `${h.slug} varieties`).toBeGreaterThanOrEqual(2);
      for (const v of h.varieties) expect(both(v.note)).toBe(true);
      for (const c of h.companions) expect(slugs.has(c), `${h.slug} companion ${c}`).toBe(true);
      expect(h.temp[0]).toBeLessThan(h.temp[1]);
      expect(h.waterEveryDays).toBeGreaterThan(0);
    }
  });

  it("every family has at least one herb and both languages", () => {
    for (const f of families) {
      expect(herbs.some((h) => h.family === f.slug), f.slug).toBe(true);
      expect(both(f.names) && both(f.description)).toBe(true);
    }
  });

  it("dictionary, info pages and guides are fully translated", () => {
    for (const [k, v] of Object.entries(dict)) expect(both(v), k).toBe(true);
    for (const p of Object.values(infoPages)) expect(both(p.title) && both(p.lead)).toBe(true);
    for (const g of guides) expect(g.steps.every(both)).toBe(true);
  });

  it("every product references real herbs and has a price", () => {
    const slugs = new Set(herbs.map((h) => h.slug));
    expect(products.filter((p) => p.kind === "pot")).toHaveLength(15);
    for (const p of products) {
      expect(p.priceUah).toBeGreaterThan(0);
      for (const h of p.herbs) expect(slugs.has(h)).toBe(true);
    }
  });
});
