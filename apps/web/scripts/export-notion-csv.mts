/**
 * Writes docs/notion-import/families.csv and species.csv from the built-in seed,
 * laid out exactly as docs/NOTION.md describes. In Notion: New database -> Import -> CSV,
 * then change column types (Select / Number / Checkbox / Multi-select) as listed in docs/NOTION.md.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { families } from "../src/data/families";
import { herbs } from "../src/data/herbs";

const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
const toCsv = (rows: Record<string, unknown>[]) => {
  const cols = Object.keys(rows[0]);
  return [cols.map(esc).join(","), ...rows.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n";
};

const famRows = families.map((f) => ({
  Slug: f.slug, Status: "Published", Latin: f.latin,
  "Name uk": f.names.uk, "Name en": f.names.en, "Description uk": f.description.uk, "Description en": f.description.en,
}));

const speciesRows = herbs.map((h) => {
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  return {
    Slug: h.slug, Status: "Published", Latin: h.latin, Family: h.family, Cycle: h.cycle, Difficulty: h.difficulty,
    "Light level": h.light.level, "Light hours": h.light.hours, "Water every days": h.waterEveryDays, Humidity: h.humidity,
    "Pet safe": h.petSafe, "Temp min": h.temp[0], "Temp max": h.temp[1], "Pot cm": h.potCm, "Price UAH": h.priceUah,
    Color: h.color, "Alone in pot": h.aloneInPot ? "Yes" : "No", Companions: h.companions.join(", "),
    "Name uk": h.names.uk, "Name en": h.names.en, "Tagline uk": h.tagline.uk, "Tagline en": h.tagline.en,
    "Water note uk": h.waterNote.uk, "Water note en": h.waterNote.en,
    ...Object.fromEntries(Object.entries(h.sections).flatMap(([k, v]) => [[`${cap(k)} uk`, v.uk], [`${cap(k)} en`, v.en]])),
    "Problems uk": h.problems.map((p) => `${p.symptom.uk} => ${p.fix.uk}`).join("\n"),
    "Problems en": h.problems.map((p) => `${p.symptom.en} => ${p.fix.en}`).join("\n"),
    Varieties: h.varieties.map((v) => `${v.name} | ${v.note.uk} | ${v.note.en}`).join("\n"),
  };
});

const dir = path.join(process.cwd(), "..", "..", "docs", "notion-import");
await fs.mkdir(dir, { recursive: true });
await fs.writeFile(path.join(dir, "families.csv"), toCsv(famRows));
await fs.writeFile(path.join(dir, "species.csv"), toCsv(speciesRows));
console.log(`Wrote ${famRows.length} families and ${speciesRows.length} species to ${dir}`);
