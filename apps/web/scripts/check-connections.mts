/** Verifies Supabase and Notion credentials and that the expected tables/databases are reachable. */
let bad = 0;
const line = (ok: boolean, msg: string) => { console.log(`${ok ? "OK  " : "FAIL"} ${msg}`); if (!ok) bad++; };

const su = process.env.SUPABASE_URL?.replace(/\/$/, ""), sk = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!su || !sk) console.log("SKIP Supabase (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set)");
else {
  for (const table of ["families", "species", "pots", "orders", "scan_events"]) {
    const r = await fetch(`${su}/rest/v1/${table}?select=*&limit=1`, { headers: { apikey: sk, Authorization: `Bearer ${sk}` } });
    line(r.ok, `Supabase table ${table} (${r.status}${r.ok ? "" : ": did you apply supabase/migrations/0001_init.sql?"})`);
  }
}

const nt = process.env.NOTION_TOKEN;
if (!nt) console.log("SKIP Notion (NOTION_TOKEN not set)");
else {
  for (const [name, id] of [["species", process.env.NOTION_DB_SPECIES], ["families", process.env.NOTION_DB_FAMILIES]] as const) {
    if (!id) { line(false, `Notion ${name}: NOTION_DB_${name.toUpperCase()} not set`); continue; }
    const r = await fetch(`https://api.notion.com/v1/databases/${id}`, { headers: { Authorization: `Bearer ${nt}`, "Notion-Version": "2022-06-28" } });
    line(r.ok, `Notion database ${name} (${r.status}${r.ok ? "" : ": share the database with your integration"})`);
  }
}
process.exit(bad ? 1 : 0);
