/**
 * Generates pots with unique QR codes and prints a CSV (code,species,batch,url).
 *   npm run pots:generate -- basil 40 B-2026-10
 * Stores them in the configured store (Supabase or the local .data/ file).
 */
import { getHerb } from "../src/lib/content";
import { qrBaseUrl } from "../src/lib/payments";
import { makeCode } from "../src/lib/pots";
import { store } from "../src/lib/store";

const [species, countArg, batchArg] = process.argv.slice(2);
const count = Number(countArg);
if (!species || !getHerb(species) || !Number.isInteger(count) || count < 1 || count > 1000) {
  console.error("Usage: npm run pots:generate -- <herb-slug> <count 1-1000> [batch]");
  process.exit(2);
}
const batch = batchArg ?? `B-${new Date().toISOString().slice(0, 10)}`;
const db = store();
const existing = new Set((await db.listPots()).map((p) => p.code));
const pots = [];
while (pots.length < count) {
  const code = makeCode();
  if (existing.has(code)) continue;
  existing.add(code);
  pots.push({ code, species, batch, plantedOn: new Date().toISOString().slice(0, 10), status: "planted" as const });
}
await db.upsertPots(pots);
console.log("code,species,batch,url");
for (const p of pots) console.log(`${p.code},${p.species},${p.batch},${qrBaseUrl()}/p/${p.code}`);
