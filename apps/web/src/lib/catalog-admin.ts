import { CARE_SECTIONS } from "./domain";
import { getHerb } from "./content";
import { CATALOG_STATUSES, type CatalogEntry, type CatalogStatus, type StockMode } from "./store/types";
import type { Product } from "./shop";

const TRANSLIT: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ie", ж: "zh", з: "z", и: "y", і: "i", ї: "i", й: "i", к: "k", л: "l", м: "m",
  н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "", ю: "iu", я: "ia",
  ы: "y", э: "e", ё: "e", ъ: "",
};

/** URL slug from a title: Ukrainian/Russian transliterated, ASCII, dashes. */
export function slugify(title: string): string {
  const s = [...title.toLowerCase()].map((c) => TRANSLIT[c] ?? c).join("")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  return s;
}

export const isSlug = (v: string) => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(v) && v.length <= 40;

export type EntryResult = { ok: true; entry: CatalogEntry } | { ok: false; error: string };

const clean = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const pick = <T extends string>(v: unknown, all: readonly T[], fallback: T): T => (all as readonly string[]).includes(String(v)) ? (v as T) : fallback;

/** Builds a validated catalogue entry from loosely typed input (form or CSV row). */
export function buildEntry(
  raw: { slug: string; kind: string; status?: string; priceUah?: unknown; stockMode?: string; herbs?: string[]; title?: { uk?: string; en?: string }; tagline?: { uk?: string; en?: string }; content?: Record<string, { uk?: string; en?: string }> },
  isBuiltIn: (slug: string) => boolean,
  now = new Date(),
): EntryResult {
  const slug = clean(raw.slug, 60).toLowerCase();
  if (!isSlug(slug)) return { ok: false, error: `Некоректний ідентифікатор «${slug}» (латиниця, цифри й дефіси)` };
  const kind = raw.kind === "set" ? "set" : "pot";
  const herbs = [...new Set((raw.herbs ?? []).map((h) => h.trim()).filter(Boolean))];
  const unknown = herbs.filter((h) => !getHerb(h));
  if (unknown.length) return { ok: false, error: `Невідомі рослини: ${unknown.join(", ")}` };
  if (kind === "set" && !isBuiltIn(slug) && herbs.length === 0) return { ok: false, error: "У кошику має бути хоча б одна рослина" };
  const price = Number(raw.priceUah ?? 0);
  if (!Number.isFinite(price) || price < 0 || price > 100000) return { ok: false, error: "Некоректна ціна" };
  const l = (v?: { uk?: string; en?: string }) => {
    const uk = clean(v?.uk, 200), en = clean(v?.en, 200);
    return uk || en ? { ...(uk ? { uk } : {}), ...(en ? { en } : {}) } : undefined;
  };
  const content: NonNullable<CatalogEntry["content"]> = {};
  for (const key of CARE_SECTIONS) {
    const uk = clean(raw.content?.[key]?.uk), en = clean(raw.content?.[key]?.en);
    if (uk || en) content[key] = { ...(uk ? { uk } : {}), ...(en ? { en } : {}) };
  }
  const title = l(raw.title), tagline = l(raw.tagline);
  return {
    ok: true,
    entry: {
      slug, kind, status: pick<CatalogStatus>(raw.status, CATALOG_STATUSES, "draft"), priceUah: Math.round(price),
      stockMode: pick<StockMode>(raw.stockMode, ["in_stock", "made_to_order"], "in_stock"),
      ...(title ? { title } : {}), ...(tagline ? { tagline } : {}),
      ...(kind === "set" ? { herbs } : {}), ...(Object.keys(content).length ? { content } : {}),
      updatedAt: now.toISOString(),
    },
  };
}

// ---------- CSV (semicolon-free, comma separated, UTF-8 with BOM for Excel) ----------

export const CSV_COLUMNS = [
  "slug", "kind", "status", "price_uah", "stock_mode", "title_uk", "title_en", "tagline_uk", "tagline_en", "herbs",
  ...CARE_SECTIONS.flatMap((s) => [`${s}_uk`, `${s}_en`]),
] as const;

const esc = (v: string) => (/[",\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v);

export function productsToCsv(list: Product[]): string {
  const rows = list.map((p) => {
    const cell: Record<string, string> = {
      slug: p.slug, kind: p.kind, status: p.status ?? "published", price_uah: String(p.priceUah), stock_mode: p.stockMode ?? "in_stock",
      title_uk: p.titleKey?.uk ?? "", title_en: p.titleKey?.en ?? "", tagline_uk: p.blurb?.uk ?? "", tagline_en: p.blurb?.en ?? "",
      herbs: p.herbs.join(";"),
    };
    for (const s of CARE_SECTIONS) { cell[`${s}_uk`] = p.content?.[s]?.uk ?? ""; cell[`${s}_en`] = p.content?.[s]?.en ?? ""; }
    return CSV_COLUMNS.map((c) => esc(cell[c] ?? "")).join(",");
  });
  return "﻿" + [CSV_COLUMNS.join(","), ...rows].join("\r\n") + "\r\n";
}

/** RFC 4180 style parser: quotes, doubled quotes and line breaks inside quoted cells. */
export function parseCsv(text: string): string[][] {
  const src = text.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [], cell = "", quoted = false;
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else quoted = false; } else cell += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && src[i + 1] === "\n") i++; row.push(cell); rows.push(row); row = []; cell = ""; }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

export type ImportReport = { entries: CatalogEntry[]; errors: string[] };

export function entriesFromCsv(text: string, isBuiltIn: (slug: string) => boolean, now = new Date()): ImportReport {
  const [head, ...body] = parseCsv(text);
  const entries: CatalogEntry[] = [], errors: string[] = [];
  if (!head || !head.includes("slug")) return { entries, errors: ["Немає рядка заголовків зі стовпцем slug"] };
  const col = (r: string[], name: string) => r[head.indexOf(name)]?.trim() ?? "";
  body.forEach((r, n) => {
    const content: Record<string, { uk?: string; en?: string }> = {};
    for (const s of CARE_SECTIONS) content[s] = { uk: col(r, `${s}_uk`), en: col(r, `${s}_en`) };
    const res = buildEntry({
      slug: col(r, "slug"), kind: col(r, "kind"), status: col(r, "status"), priceUah: col(r, "price_uah") || 0, stockMode: col(r, "stock_mode"),
      herbs: col(r, "herbs").split(/[;,]/), title: { uk: col(r, "title_uk"), en: col(r, "title_en") }, tagline: { uk: col(r, "tagline_uk"), en: col(r, "tagline_en") }, content,
    }, isBuiltIn, now);
    if (res.ok) entries.push(res.entry); else errors.push(`Рядок ${n + 2}: ${res.error}`);
  });
  return { entries, errors };
}
