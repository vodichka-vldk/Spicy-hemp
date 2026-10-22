import type { Item, Order, Pot, ScanEvent, Store } from "./types";

// Thin PostgREST client (no SDK needed). Tables are defined in supabase/migrations.
const url = () => process.env.SUPABASE_URL!.replace(/\/$/, "");
const key = () => process.env.SUPABASE_SERVICE_ROLE_KEY!;

async function rest<T>(pathAndQuery: string, init: RequestInit & { prefer?: string } = {}): Promise<T> {
  const res = await fetch(`${url()}/rest/v1/${pathAndQuery}`, {
    ...init,
    cache: "no-store",
    headers: {
      apikey: key(),
      Authorization: `Bearer ${key()}`,
      "Content-Type": "application/json",
      ...(init.prefer ? { Prefer: init.prefer } : {}),
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`);
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}

type OrderRow = { id: string; created_at: string; status: Order["status"]; data: Order };
const orderRow = (o: Order) => ({ id: o.id, created_at: o.createdAt, status: o.status, data: o });

const ITEM_SELECT = "code,kind,product,batch,status,readyOn:ready_on,orderId:order_id,ownerName:owner_name,photoPath:photo_path,displayNo:display_no,item_species(species)";
type ItemRow = Omit<Item, "species" | "orderId" | "ownerName" | "photoPath" | "product"> & {
  product: string | null; orderId: string | null; ownerName: string | null; photoPath: string | null; item_species: Array<{ species: string }>;
};
export const itemFromRow = (r: ItemRow): Item => ({
  code: r.code, kind: r.kind, product: r.product ?? "", species: r.item_species.map((s) => s.species), displayNo: r.displayNo,
  batch: r.batch, readyOn: r.readyOn, status: r.status,
  ...(r.ownerName ? { ownerName: r.ownerName } : {}), ...(r.photoPath ? { photoPath: r.photoPath } : {}), ...(r.orderId ? { orderId: r.orderId } : {}),
});

export const supabaseStore: Store = {
  async createOrder(o) { await rest("orders", { method: "POST", body: JSON.stringify(orderRow(o)) }); },
  async getOrder(id) {
    const rows = await rest<OrderRow[]>(`orders?id=eq.${encodeURIComponent(id)}&select=data`);
    return rows[0]?.data ?? null;
  },
  async listOrders() {
    const rows = await rest<OrderRow[]>("orders?select=data&order=created_at.desc&limit=500");
    return rows.map((r) => r.data);
  },
  async updateOrder(id, patch) {
    const cur = await this.getOrder(id);
    if (!cur) return null;
    const next = { ...cur, ...patch };
    await rest(`orders?id=eq.${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(orderRow(next)) });
    return next;
  },
  async getPot(code) {
    const rows = await rest<Pot[]>(`pots?code=eq.${encodeURIComponent(code)}&select=code,species,batch,plantedOn:planted_on,status,orderId:order_id`);
    return rows[0] ?? null;
  },
  async listPots() {
    return rest<Pot[]>("pots?select=code,species,batch,plantedOn:planted_on,status,orderId:order_id&limit=5000");
  },
  async upsertPots(pots) {
    const body = pots.map((p) => ({ code: p.code, species: p.species, batch: p.batch, planted_on: p.plantedOn, status: p.status, order_id: p.orderId ?? null }));
    await rest("pots", { method: "POST", body: JSON.stringify(body), prefer: "resolution=merge-duplicates" });
  },
  async getItem(code) {
    const rows = await rest<ItemRow[]>(`items?code=eq.${encodeURIComponent(code)}&select=${ITEM_SELECT}`);
    return rows[0] ? itemFromRow(rows[0]) : null;
  },
  async listItems() {
    return (await rest<ItemRow[]>(`items?select=${ITEM_SELECT}&order=created_at.desc&limit=5000`)).map(itemFromRow);
  },
  async upsertItems(items) {
    // display_no is left to the database (per-kind sequence) for new rows and untouched on update
    const rows = items.map((i) => ({
      code: i.code, kind: i.kind, product: i.product || null, batch: i.batch, ready_on: i.readyOn, status: i.status,
      order_id: i.orderId ?? null, owner_name: i.ownerName ?? null, photo_path: i.photoPath ?? null,
    }));
    await rest("items", { method: "POST", body: JSON.stringify(rows), prefer: "resolution=merge-duplicates" });
    const comp = items.flatMap((i) => i.species.map((species) => ({ item: i.code, species })));
    if (comp.length) await rest("item_species", { method: "POST", body: JSON.stringify(comp), prefer: "resolution=ignore-duplicates" });
  },
  async logScan(e) {
    await rest("scan_events", {
      method: "POST",
      body: JSON.stringify({ id: e.id, ts: e.ts, pot_code: e.potCode, species: e.species, country: e.country, device: e.device, os: e.os, referrer: e.referrer, visitor: e.visitor, first_scan: e.firstScan, valid: e.valid }),
    });
  },
  async listScans(since) {
    const q = since ? `&ts=gte.${encodeURIComponent(since)}` : "";
    const rows = await rest<Array<Record<string, unknown>>>(`scan_events?select=*&order=ts.desc&limit=20000${q}`);
    return rows.map((r) => ({
      id: String(r.id), ts: String(r.ts), potCode: (r.pot_code as string) ?? null, species: (r.species as string) ?? null,
      country: (r.country as string) ?? null, device: r.device as ScanEvent["device"], os: String(r.os ?? ""),
      referrer: (r.referrer as string) ?? null, visitor: String(r.visitor), firstScan: Boolean(r.first_scan), valid: Boolean(r.valid),
    }));
  },
  async hasScanned(code, visitor) {
    const rows = await rest<unknown[]>(`scan_events?pot_code=eq.${encodeURIComponent(code)}&visitor=eq.${encodeURIComponent(visitor)}&select=id&limit=1`);
    return rows.length > 0;
  },
};
