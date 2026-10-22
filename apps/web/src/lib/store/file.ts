import { promises as fs } from "node:fs";
import path from "node:path";
import { getHerbs } from "../content";
import { makeCode, seeded } from "../pots";
import type { Order, Pot, ScanEvent, Store } from "./types";

type Db = { orders: Order[]; pots: Pot[]; scans: ScanEvent[] };

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

async function read(): Promise<Db> {
  try {
    return JSON.parse(await fs.readFile(FILE, "utf8")) as Db;
  } catch {
    const db: Db = { orders: [], pots: demoPots(), scans: [] };
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
  logScan: (ev) => serial(async () => { const db = await read(); db.scans.push(ev); await write(db); }),
  listScans: (since) => serial(async () => { const s = (await read()).scans; return since ? s.filter((e) => e.ts >= since) : s; }),
  hasScanned: (code, visitor) => serial(async () => (await read()).scans.some((e) => e.potCode === code && e.visitor === visitor)),
};
