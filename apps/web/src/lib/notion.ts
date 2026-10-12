import type { Family, Herb } from "./types";

// ---- minimal Notion API shapes (only what we read) ----
type RichText = { plain_text: string };
type Prop =
  | { type: "title"; title: RichText[] }
  | { type: "rich_text"; rich_text: RichText[] }
  | { type: "number"; number: number | null }
  | { type: "select"; select: { name: string } | null }
  | { type: "multi_select"; multi_select: { name: string }[] }
  | { type: "checkbox"; checkbox: boolean }
  | { type: "status"; status: { name: string } | null };
export type NotionPage = { id: string; last_edited_time?: string; properties: Record<string, Prop | undefined> };

const text = (p?: Prop): string => {
  if (!p) return "";
  if (p.type === "title") return p.title.map((t) => t.plain_text).join("").trim();
  if (p.type === "rich_text") return p.rich_text.map((t) => t.plain_text).join("").trim();
  if (p.type === "select") return p.select?.name.trim() ?? "";
  if (p.type === "status") return p.status?.name.trim() ?? "";
  return "";
};
const num = (p?: Prop): number | undefined => (p?.type === "number" && p.number !== null ? p.number : undefined);
const bool = (p?: Prop): boolean => p?.type === "checkbox" && p.checkbox;
const list = (p?: Prop): string[] =>
  p?.type === "multi_select" ? p.multi_select.map((m) => m.name.trim()) : text(p).split(/[,\n]/).map((s) => s.trim()).filter(Boolean);

export type Mapped<T> = { ok: true; value: T } | { ok: false; slug: string; errors: string[] };
export const isPublished = (page: NotionPage) => text(page.properties["Status"]).toLowerCase() === "published";

const oneOf = <T extends string>(v: string, allowed: readonly T[]): T | undefined => (allowed as readonly string[]).includes(v) ? (v as T) : undefined;

/** Maps one Species row to a Herb, or returns every problem found so editors can fix the row. */
export function mapSpecies(page: NotionPage, knownFamilies: Set<string>): Mapped<Herb> {
  const p = page.properties;
  const errors: string[] = [];
  const slug = text(p["Slug"]);
  const need = (label: string, v: string | undefined) => { if (!v) errors.push(`missing ${label}`); return v ?? ""; };
  const both = (base: string) => ({ uk: need(`${base} uk`, text(p[`${base} uk`])), en: need(`${base} en`, text(p[`${base} en`])) });

  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.push("Slug must be lowercase-latin-with-dashes");
  const family = text(p["Family"]);
  if (!knownFamilies.has(family)) errors.push(`unknown Family "${family}"`);
  const cycle = oneOf(text(p["Cycle"]), ["annual", "biennial", "perennial", "shrub", "tree", "tropical"] as const);
  if (!cycle) errors.push("invalid Cycle");
  const humidity = oneOf(text(p["Humidity"]), ["low", "medium", "high"] as const);
  if (!humidity) errors.push("invalid Humidity");
  const petSafe = oneOf(text(p["Pet safe"]), ["safe", "caution", "unknown"] as const);
  if (!petSafe) errors.push("invalid Pet safe");
  const level = oneOf(text(p["Light level"]), ["sun", "bright", "partial"] as const);
  if (!level) errors.push("invalid Light level");
  const difficulty = num(p["Difficulty"]);
  if (difficulty !== 1 && difficulty !== 2 && difficulty !== 3) errors.push("Difficulty must be 1, 2 or 3");
  const every = num(p["Water every days"]);
  if (!every || every < 1) errors.push("Water every days must be >= 1");
  const tmin = num(p["Temp min"]);
  const tmax = num(p["Temp max"]);
  if (tmin === undefined || tmax === undefined || tmin >= tmax) errors.push("Temp min/max invalid");
  const potCm = num(p["Pot cm"]);
  const price = num(p["Price UAH"]);
  if (!potCm) errors.push("missing Pot cm");
  if (!price || price <= 0) errors.push("missing Price UAH");
  const hours = need("Light hours", text(p["Light hours"]));
  const color = text(p["Color"]) || "#3f8f4a";
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) errors.push("Color must be #rrggbb");

  const names = both("Name");
  const tagline = both("Tagline");
  const waterNote = both("Water note");
  const sections = { light: both("Light"), water: both("Water"), feeding: both("Feeding"), harvest: both("Harvest"), winter: both("Winter"), uses: both("Uses") };

  const lines = (key: string) => text(p[key]).split("\n").map((s) => s.trim()).filter(Boolean);
  const pu = lines("Problems uk");
  const pe = lines("Problems en");
  if (pu.length < 3) errors.push("need at least 3 Problems");
  if (pu.length !== pe.length) errors.push("Problems uk/en line counts differ");
  const problems = pu.map((u, i) => {
    const [su, fu] = u.split("=>").map((s) => s.trim());
    const [se, fe] = (pe[i] ?? "").split("=>").map((s) => s.trim());
    if (!su || !fu || !se || !fe) errors.push(`Problems line ${i + 1} must be "symptom => fix"`);
    return { symptom: { uk: su ?? "", en: se ?? "" }, fix: { uk: fu ?? "", en: fe ?? "" } };
  });

  const varieties = lines("Varieties").map((line, i) => {
    const [name, uk, en] = line.split("|").map((s) => s.trim());
    if (!name || !uk || !en) errors.push(`Varieties line ${i + 1} must be "Name | note uk | note en"`);
    return { name: name ?? "", note: { uk: uk ?? "", en: en ?? "" } };
  });
  if (varieties.length < 2) errors.push("need at least 2 Varieties");

  if (errors.length) return { ok: false, slug: slug || page.id, errors };
  return {
    ok: true,
    value: {
      slug, latin: need("Latin", text(p["Latin"])), family, names, tagline, color,
      cycle: cycle!, difficulty: difficulty as 1 | 2 | 3,
      light: { hours, level: level! }, waterEveryDays: every!, waterNote, temp: [tmin!, tmax!],
      humidity: humidity!, potCm: potCm!, petSafe: petSafe!, varieties, sections, problems,
      companions: list(p["Companions"]), aloneInPot: bool(p["Alone in pot"]) || undefined, priceUah: price!,
    },
  };
}

export function mapFamily(page: NotionPage): Mapped<Family> {
  const p = page.properties;
  const errors: string[] = [];
  const slug = text(p["Slug"]);
  const get = (k: string) => { const v = text(p[k]); if (!v) errors.push(`missing ${k}`); return v; };
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) errors.push("Slug must be lowercase-latin-with-dashes");
  const value: Family = {
    slug, latin: get("Latin"),
    names: { uk: get("Name uk"), en: get("Name en") },
    description: { uk: get("Description uk"), en: get("Description en") },
  };
  return errors.length ? { ok: false, slug: slug || page.id, errors } : { ok: true, value };
}

/** Cross-row checks that need the whole set (companions must exist, slugs unique). */
export function crossCheck(herbs: Herb[]): string[] {
  const slugs = new Set<string>();
  const errors: string[] = [];
  for (const h of herbs) { if (slugs.has(h.slug)) errors.push(`duplicate slug ${h.slug}`); slugs.add(h.slug); }
  for (const h of herbs) for (const c of h.companions) if (!slugs.has(c)) errors.push(`${h.slug}: companion "${c}" is not published`);
  return errors;
}
