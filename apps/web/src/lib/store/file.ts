import { promises as fs } from "node:fs";
import path from "node:path";
import { getHerbs } from "../content";
import { makeCode, seeded } from "../pots";
import { getProduct } from "../shop";
import { randomUUID } from "node:crypto";
import type { CatalogEntry, Item, JournalEntry, Owner, Question, Reminder, Order, OrderEvent, Pot, Review, ScanEvent, Store } from "./types";

type Db = { orders: Order[]; pots: Pot[]; items: Item[]; reviews: Review[]; catalog: CatalogEntry[]; owners: Owner[]; reminders: Reminder[]; questions: Question[]; journal: JournalEntry[]; settings: Record<string, unknown>; orderEvents: OrderEvent[]; scans: ScanEvent[] };

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
    if (!db.items || !db.reviews || !db.orderEvents || !db.catalog || !db.owners || !db.settings || !db.reminders || !db.questions || !db.journal) { db.items ??= demoItems(); db.reviews ??= []; db.orderEvents ??= []; db.catalog ??= []; db.owners ??= []; db.settings ??= {}; db.reminders ??= []; db.questions ??= []; db.journal ??= []; await write(db); }
    return db;
  } catch {
    const db: Db = { orders: [], pots: demoPots(), items: demoItems(), reviews: [], catalog: [], owners: [], reminders: [], questions: [], journal: [], settings: {}, orderEvents: [], scans: [] };
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
  addOrderEvent: (ev) => serial(async () => { const db = await read(); db.orderEvents.push(ev); await write(db); }),
  listOrderEvents: (orderId) => serial(async () => (await read()).orderEvents.filter((e) => e.orderId === orderId).sort((a, b) => a.ts.localeCompare(b.ts))),
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
  listReviews: (f) => serial(async () => (await read()).reviews.filter((r) => (!f?.product || r.product === f.product) && (!f?.status || r.status === f.status)).sort((a, b) => b.createdAt.localeCompare(a.createdAt))),
  upsertReview: (review) =>
    serial(async () => {
      if (review.status === "approved" && !review.consentPublic) throw new Error("review cannot be approved without the author's consent");
      const db = await read();
      const i = db.reviews.findIndex((r) => r.id === review.id);
      if (i >= 0) db.reviews[i] = review; else db.reviews.push(review);
      await write(db);
    }),
  getOwnerByTelegram: (tid) => serial(async () => (await read()).owners.find((o) => o.telegramId === tid) ?? null),
  listOwners: () => serial(async () => (await read()).owners),
  upsertOwner: (o) =>
    serial(async () => {
      const db = await read();
      const i = db.owners.findIndex((x) => x.telegramId === o.telegramId);
      const next: Owner = { ...(i >= 0 ? db.owners[i] : { id: randomUUID(), createdAt: new Date().toISOString() }), ...o, id: i >= 0 ? db.owners[i].id : o.id ?? randomUUID() } as Owner;
      if (i >= 0) db.owners[i] = next; else db.owners.push(next);
      await write(db);
      return next;
    }),
  listReminders: (f) => serial(async () => (await read()).reminders.filter((r) => (!f?.itemCode || r.itemCode === f.itemCode) && (!f?.ownerId || r.ownerId === f.ownerId) && (!f?.statuses || f.statuses.includes(r.status)))),
  upsertReminders: (rs) =>
    serial(async () => {
      const db = await read();
      for (const r of rs) { const i = db.reminders.findIndex((x) => x.id === r.id); if (i >= 0) db.reminders[i] = r; else db.reminders.push(r); }
      await write(db);
    }),
  listJournal: (f) => serial(async () => (await read()).journal.filter((e) => (!f?.itemCode || e.itemCode === f.itemCode) && (!f?.ownerId || e.ownerId === f.ownerId) && (!f?.kind || e.kind === f.kind)).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))),
  addJournalEntry: (e) => serial(async () => { const db = await read(); db.journal.push(e); await write(db); }),
  deleteJournalEntry: (id) => serial(async () => { const db = await read(); db.journal = db.journal.filter((e) => e.id !== id); await write(db); }),
  listQuestions: (f) => serial(async () => (await read()).questions.filter((q) => (!f?.itemCode || q.itemCode === f.itemCode) && (!f?.ownerId || q.ownerId === f.ownerId) && (!f?.status || q.status === f.status)).sort((a, b) => a.createdAt.localeCompare(b.createdAt))),
  getQuestion: (id) => serial(async () => (await read()).questions.find((q) => q.id === id) ?? null),
  upsertQuestion: (q) => serial(async () => { const db = await read(); const i = db.questions.findIndex((x) => x.id === q.id); if (i >= 0) db.questions[i] = q; else db.questions.push(q); await write(db); }),
  getSetting: (key) => serial(async () => ((await read()).settings[key] ?? null) as never),
  setSetting: (key, value) => serial(async () => { const db = await read(); if (value === null) delete db.settings[key]; else db.settings[key] = value; await write(db); }),
  listCatalog: () => serial(async () => (await read()).catalog),
  upsertCatalogEntry: (entry) =>
    serial(async () => {
      const db = await read();
      const i = db.catalog.findIndex((e) => e.slug === entry.slug);
      if (i >= 0) db.catalog[i] = entry; else db.catalog.push(entry);
      await write(db);
    }),
  deleteCatalogEntry: (slug) => serial(async () => { const db = await read(); db.catalog = db.catalog.filter((e) => e.slug !== slug); await write(db); }),
  logScan: (ev) => serial(async () => { const db = await read(); db.scans.push(ev); await write(db); }),
  listScans: (since) => serial(async () => { const s = (await read()).scans; return since ? s.filter((e) => e.ts >= since) : s; }),
  hasScanned: (code, visitor) => serial(async () => (await read()).scans.some((e) => e.potCode === code && e.visitor === visitor)),
};
