import { promises as fs } from "node:fs";
import path from "node:path";
import { getHerbs } from "../content";
import { makeCode, seeded } from "../pots";
import { getProduct } from "../shop";
import type { Item, Order, Pot, ScanEvent, Store } from "./types";

type Db = { orders: Order[]; pots: Pot[]; items: Item[]; scans: ScanEvent[] };

const FILE = path.join(process.cwd(), ".data", "store.json");

let queue: Promise<unknown> = Promise.resolve();
const serial = <T,>(fn: () => Promise<T>): Promise<T> => {
  const run = queue.then(fn, fn);
  queue = run.catch(() => undefined);
  return run;
};

export function demoPots(): Pot[] {
  const rand = seeded(20261012);
  return getHerbs().map((h, i) => ({
    code: makeCode(rand),
    species: h.slug,
    batch: `DEMO-${String(i < 8 ? 1 : 2).padStart(2, "0")}`,
    plantedOn: "2026-09-14",
    status: "planted",
  }));
}

/** One demo basket per set, so the card can be tried right away. */
export function demoItems(): Item[] {
  const rand = seeded(20261022);
  return ["set-tea", "set-italian", "set-asian"].flatMap((slug, i) => {
    const product = getProduct(slug);
    if (!product) return [];
    return [{
      code: makeCode(rand), kind: "basket" as const, product: slug, species: product.herbs, displayNo: i + 1,
      batch: "DEMO-BASKET", readyOn: "2026-08-20", status: "ready_for_sale" as const,
    }];
  });
}

async function read(): Promise<Db> {
  try {
    const db = JSON.parse(await fs.readFile(FILE, "utf8")) as Db;
    if (!db.items) { db.items = demoItems(); await write(db); }
    return db;
  } catch {
    const db: Db = { orders: [], pots: demoPots(), items: demoItems(), scans: [] };
    await write(db);
    return db;
  }
}

async function write(db: Db) {
  await fs.mkdir(path.dirname(FILE), { recursive: true });
  const tmp = `${FILE}.${process.pid}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(db, null, 2));
  await fs.rename(tmp, FILE);
}

export const fileStore: Store = {
  createOrder: (order) => serial(async () => { const db = await read(); db.orders.push(order); await write(db); }),
  getOrder: (id) => serial(async () => (await read()).orders.find((o) => o.id === id) ?? null),
  listOrders: () => serial(async () => (await read()).orders.slice().reverse()),
  updateOrder: (id, patch) =>
    serial(async () => {
      const db = await read();
      const o = db.orders.find((x) => x.id === id);
      if (!o) return null;
      Object.assign(o, patch);
      await write(db);
      return o;
    }),
  getPot: (code) => serial(async () => (await read()).pots.find((p) => p.code === code) ?? null),
  listPots: () => serial(async () => (await read()).pots),
  upsertPots: (pots) =>
    serial(async () => {
      const db = await read();
      for (const p of pots) {
        const i = db.pots.findIndex((x) => x.code === p.code);
        if (i >= 0) db.pots[i] = p; else db.pots.push(p);
      }
      await write(db);
    }),
  getItem: (code) => serial(async () => (await read()).items.find((i) => i.code === code) ?? null),
  listItems: () => serial(async () => (await read()).items),
  upsertItems: (items) =>
    serial(async () => {
      const db = await read();
      for (const it of items) {
        const i = db.items.findIndex((x) => x.code === it.code);
        if (i >= 0) { db.items[i] = { ...db.items[i], ...it, displayNo: db.items[i].displayNo }; continue; }
        const next = Math.max(0, ...db.items.filter((x) => x.kind === it.kind).map((x) => x.displayNo)) + 1;
        db.items.push({ ...it, displayNo: it.displayNo ?? next });
      }
      await write(db);
    }),
  logScan: (ev) => serial(async () => { const db = await read(); db.scans.push(ev); await write(db); }),
  listScans: (since) => serial(async () => { const s = (await read()).scans; return since ? s.filter((e) => e.ts >= since) : s; }),
  hasScanned: (code, visitor) => serial(async () => (await read()).scans.some((e) => e.potCode === code && e.visitor === visitor)),
};
