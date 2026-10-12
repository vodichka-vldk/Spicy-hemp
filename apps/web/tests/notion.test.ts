import { describe, expect, it } from "vitest";
import { families } from "@/data/families";
import { herbs } from "@/data/herbs";
import { crossCheck, isPublished, mapFamily, mapSpecies, type NotionPage } from "@/lib/notion";
import type { Family, Herb } from "@/lib/types";

const rt = (s: string) => ({ type: "rich_text" as const, rich_text: [{ plain_text: s }] });
const sel = (s: string) => ({ type: "select" as const, select: { name: s } });
const nm = (n: number) => ({ type: "number" as const, number: n });

/** Builds the Notion row an editor would have typed for a seed herb (see docs/NOTION.md). */
export function toPage(h: Herb, status = "Published"): NotionPage {
  return {
    id: `page-${h.slug}`,
    properties: {
      Slug: { type: "title", title: [{ plain_text: h.slug }] },
      Status: sel(status),
      Latin: rt(h.latin), Family: sel(h.family), Cycle: sel(h.cycle), Humidity: sel(h.humidity), "Pet safe": sel(h.petSafe), "Light level": sel(h.light.level),
      "Light hours": rt(h.light.hours), Color: rt(h.color), Difficulty: nm(h.difficulty), "Water every days": nm(h.waterEveryDays),
      "Temp min": nm(h.temp[0]), "Temp max": nm(h.temp[1]), "Pot cm": nm(h.potCm), "Price UAH": nm(h.priceUah),
      "Name uk": rt(h.names.uk), "Name en": rt(h.names.en), "Tagline uk": rt(h.tagline.uk), "Tagline en": rt(h.tagline.en),
      "Water note uk": rt(h.waterNote.uk), "Water note en": rt(h.waterNote.en),
      ...Object.fromEntries(Object.entries(h.sections).flatMap(([k, v]) => { const K = k[0].toUpperCase() + k.slice(1); return [[`${K} uk`, rt(v.uk)], [`${K} en`, rt(v.en)]]; })),
      "Problems uk": rt(h.problems.map((p) => `${p.symptom.uk} => ${p.fix.uk}`).join("\n")),
      "Problems en": rt(h.problems.map((p) => `${p.symptom.en} => ${p.fix.en}`).join("\n")),
      Varieties: rt(h.varieties.map((v) => `${v.name} | ${v.note.uk} | ${v.note.en}`).join("\n")),
      Companions: { type: "multi_select", multi_select: h.companions.map((name) => ({ name })) },
      "Alone in pot": { type: "checkbox", checkbox: Boolean(h.aloneInPot) },
    },
  };
}

const famPage = (f: Family): NotionPage => ({
  id: f.slug,
  properties: { Slug: { type: "title", title: [{ plain_text: f.slug }] }, Status: sel("Published"), Latin: rt(f.latin), "Name uk": rt(f.names.uk), "Name en": rt(f.names.en), "Description uk": rt(f.description.uk), "Description en": rt(f.description.en) },
});

describe("Notion mapping", () => {
  const known = new Set(families.map((f) => f.slug));

  it("round-trips every seed herb through the documented Notion layout", () => {
    for (const h of herbs) {
      const m = mapSpecies(toPage(h), known);
      if (!m.ok) throw new Error(`${h.slug}: ${m.errors.join("; ")}`);
      expect(m.value).toEqual({ ...h, aloneInPot: h.aloneInPot || undefined });
    }
  });

  it("round-trips families", () => {
    for (const f of families) {
      const m = mapFamily(famPage(f));
      expect(m.ok && m.value).toEqual(f);
    }
  });

  it("only Published rows are synced", () => {
    expect(isPublished(toPage(herbs[0]))).toBe(true);
    expect(isPublished(toPage(herbs[0], "Draft"))).toBe(false);
    expect(isPublished(toPage(herbs[0], "Review"))).toBe(false);
  });

  it("reports every problem of an incomplete row at once", () => {
    const page = toPage(herbs[0]);
    page.properties["Name en"] = rt("");
    page.properties["Difficulty"] = nm(7);
    page.properties["Family"] = sel("nonsense");
    page.properties["Problems en"] = rt("only one => line");
    page.properties["Slug"] = { type: "title", title: [{ plain_text: "Bad Slug" }] };
    const m = mapSpecies(page, known);
    expect(m.ok).toBe(false);
    if (!m.ok) {
      const all = m.errors.join(" | ");
      expect(all).toMatch(/missing Name en/);
      expect(all).toMatch(/Difficulty/);
      expect(all).toMatch(/unknown Family/);
      expect(all).toMatch(/Problems/);
      expect(all).toMatch(/Slug/);
    }
  });

  it("flags companions that are not published and duplicate slugs", () => {
    const a = { ...herbs[0], companions: ["ghost"] };
    expect(crossCheck([a])).toEqual([`${a.slug}: companion "ghost" is not published`]);
    expect(crossCheck([herbs[1], herbs[1]])[0]).toMatch(/duplicate slug/);
  });
});
