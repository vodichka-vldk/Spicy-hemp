/**
 * Notion -> JSON (+ Supabase) content sync.
 *   NOTION_TOKEN, NOTION_DB_SPECIES, NOTION_DB_FAMILIES required.
 *   SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY optional: also upserts the content tables.
 * Only rows with Status = Published are synced. Rows with errors are skipped and reported;
 * the run fails (exit 1) if any published row is invalid, so a half-filled page never goes live.
 * Notion file URLs expire within an hour, so this sync never stores them: images ship with the repo/Storage.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { crossCheck, isPublished, mapFamily, mapSpecies, type NotionPage } from "../src/lib/notion";

const token = process.env.NOTION_TOKEN;
const dbSpecies = process.env.NOTION_DB_SPECIES;
const dbFamilies = process.env.NOTION_DB_FAMILIES;
if (!token || !dbSpecies || !dbFamilies) {
  console.error("Set NOTION_TOKEN, NOTION_DB_SPECIES and NOTION_DB_FAMILIES");
  process.exit(2);
}

async function notion<T>(url: string, body?: unknown, attempt = 0): Promise<T> {
  const res = await fetch(`https://api.notion.com/v1/${url}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28", "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (res.status === 429 && attempt < 5) { // Notion allows ~3 requests/second
    await new Promise((r) => setTimeout(r, (Number(res.headers.get("retry-after")) || 1) * 1000));
    return notion<T>(url, body, attempt + 1);
  }
  if (!res.ok) throw new Error(`Notion ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

async function queryAll(db: string): Promise<NotionPage[]> {
  const out: NotionPage[] = [];
  let cursor: string | undefined;
  do {
    const r = await notion<{ results: NotionPage[]; has_more: boolean; next_cursor: string | null }>(`databases/${db}/query`, { page_size: 100, start_cursor: cursor });
    out.push(...r.results);
    cursor = r.has_more ? r.next_cursor ?? undefined : undefined;
  } while (cursor);
  return out;
}

async function supabaseUpsert(table: string, rows: object[]) {
  const url = process.env.SUPABASE_URL, key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || rows.length === 0) return;
  const res = await fetch(`${url.replace(/\/$/, "")}/rest/v1/${table}`, {
    method: "POST",
    headers: { apikey: key, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) throw new Error(`Supabase ${table} ${res.status}: ${await res.text()}`);
}

const [familyPages, speciesPages] = await Promise.all([queryAll(dbFamilies), queryAll(dbSpecies)]);
const problems: string[] = [];

const families = familyPages.filter(isPublished).flatMap((p) => {
  const m = mapFamily(p);
  if (!m.ok) { problems.push(`family ${m.slug}: ${m.errors.join("; ")}`); return []; }
  return [m.value];
});
const famSet = new Set(families.map((f) => f.slug));
const herbs = speciesPages.filter(isPublished).flatMap((p) => {
  const m = mapSpecies(p, famSet);
  if (!m.ok) { problems.push(`species ${m.slug}: ${m.errors.join("; ")}`); return []; }
  return [m.value];
});
problems.push(...crossCheck(herbs));

console.log(`Notion: ${families.length} families, ${herbs.length} species published`);
if (problems.length) {
  console.error("\nFix these in Notion (rows skipped):\n - " + problems.join("\n - "));
  process.exit(1);
}

await fs.writeFile(path.join(process.cwd(), "src/data/generated/content.json"), JSON.stringify({ herbs, families }, null, 2));
await supabaseUpsert("families", families.map((f) => ({ slug: f.slug, data: f })));
await supabaseUpsert("species", herbs.map((h) => ({ slug: h.slug, family: h.family, data: h })));
await supabaseUpsert("content_sync_log", [{ source: "notion", status: "ok", changed: herbs.length + families.length }]);
console.log("Synced. Rebuild/redeploy the site (or trigger the Vercel deploy hook) to publish.");
