/** Pushes the built-in content seed (families, species) into Supabase. Safe to re-run (upsert). */
import { families } from "../src/data/families";
import { herbs } from "../src/data/herbs";

const url = process.env.SUPABASE_URL?.replace(/\/$/, "");
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) { console.error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY"); process.exit(2); }

async function upsert(table: string, rows: object[]) {
  const res = await fetch(`${url}/rest/v1/${table}`, {
    method: "POST",
    headers: { apikey: key!, Authorization: `Bearer ${key}`, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) { console.error(`${table}: ${res.status} ${await res.text()}`); process.exit(1); }
  console.log(`${table}: ${rows.length} rows upserted`);
}

await upsert("families", families.map((f) => ({ slug: f.slug, data: f })));
await upsert("species", herbs.map((h) => ({ slug: h.slug, family: h.family, data: h })));
