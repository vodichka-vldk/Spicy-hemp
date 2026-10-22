import type { CareSection } from "../domain";
import type { CatalogEntry, Item, Owner, Order, OrderEvent, Pot, Review, ScanEvent, Store } from "./types";

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

const ITEM_SELECT = "code,kind,product,batch,status,readyOn:ready_on,orderId:order_id,ownerName:owner_name,photoPath:photo_path,displayNo:display_no,ownerId:owner_id,activatedAt:activated_at,item_species(species)";
type ItemRow = Omit<Item, "species" | "orderId" | "ownerName" | "photoPath" | "product" | "ownerId" | "activatedAt"> & {
  ownerId: string | null; activatedAt: string | null; product: string | null; orderId: string | null; ownerName: string | null; photoPath: string | null; item_species: Array<{ species: string }>;
};
export const itemFromRow = (r: ItemRow): Item => ({
  code: r.code, kind: r.kind, product: r.product ?? "", species: r.item_species.map((s) => s.species), displayNo: r.displayNo,
  batch: r.batch, readyOn: r.readyOn, status: r.status,
  ...(r.ownerName ? { ownerName: r.ownerName } : {}), ...(r.photoPath ? { photoPath: r.photoPath } : {}), ...(r.orderId ? { orderId: r.orderId } : {}),
  ...(r.ownerId ? { ownerId: r.ownerId } : {}), ...(r.activatedAt ? { activatedAt: r.activatedAt } : {}),
});

const REVIEW_SELECT = "id,product,itemCode:item_code,rating,body,authorName:author_name,locale,photos,consentPublic:consent_public,status,createdAt:created_at";
type ReviewRow = Omit<Review, "itemCode" | "body" | "authorName"> & { itemCode: string | null; body: string | null; authorName: string | null };
export const reviewFromRow = (r: ReviewRow): Review => ({
  id: r.id, product: r.product, rating: r.rating, locale: r.locale, photos: r.photos, consentPublic: r.consentPublic, status: r.status, createdAt: r.createdAt,
  ...(r.itemCode ? { itemCode: r.itemCode } : {}), ...(r.body ? { body: r.body } : {}), ...(r.authorName ? { authorName: r.authorName } : {}),
});

type ProductRow = {
  slug: string; kind: "basket" | "single"; status: CatalogEntry["status"]; price_uah: number; stock_mode: CatalogEntry["stockMode"];
  data: { title?: CatalogEntry["title"]; tagline?: CatalogEntry["tagline"]; photos?: string[] }; updated_at: string;
  product_species: Array<{ species: string }>; product_content: Array<{ locale: "uk" | "en"; section: CareSection; body: string }>;
};
export const catalogFromRow = (r: ProductRow): CatalogEntry => {
  const content: NonNullable<CatalogEntry["content"]> = {};
  for (const c of r.product_content) (content[c.section] ??= {})[c.locale] = c.body;
  return {
    slug: r.slug, kind: r.kind === "basket" ? "set" : "pot", status: r.status, priceUah: r.price_uah, stockMode: r.stock_mode,
    ...(r.data.photos?.length ? { photos: r.data.photos } : {}), ...(r.data.title ? { title: r.data.title } : {}), ...(r.data.tagline ? { tagline: r.data.tagline } : {}),
    ...(r.product_species.length ? { herbs: r.product_species.map((x) => x.species).sort() } : {}),
    ...(Object.keys(content).length ? { content } : {}), updatedAt: r.updated_at,
  };
};

const OWNER_SELECT = "id,telegramId:telegram_id,username,firstName:first_name,locale,notify,createdAt:created_at";
type OwnerRow = Omit<Owner, "username" | "firstName"> & { username: string | null; firstName: string | null };
export const ownerFromRow = (r: OwnerRow): Owner => ({
  id: r.id, telegramId: Number(r.telegramId), locale: r.locale, notify: r.notify, createdAt: r.createdAt,
  ...(r.username ? { username: r.username } : {}), ...(r.firstName ? { firstName: r.firstName } : {}),
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
  async addOrderEvent(e) {
    await rest("order_events", { method: "POST", body: JSON.stringify({ order_id: e.orderId, ts: e.ts, from_status: e.from, to_status: e.to, actor_type: e.actorType, actor: e.actor ?? null, note: e.note ?? null }) });
  },
  async listOrderEvents(orderId) {
    const rows = await rest<Array<Record<string, unknown>>>(`order_events?order_id=eq.${encodeURIComponent(orderId)}&select=*&order=ts.asc`);
    return rows.map((r): OrderEvent => ({
      id: String(r.id), orderId: String(r.order_id), ts: String(r.ts), from: (r.from_status as OrderEvent["from"]) ?? null, to: r.to_status as OrderEvent["to"],
      actorType: r.actor_type as OrderEvent["actorType"], ...(r.actor ? { actor: String(r.actor) } : {}), ...(r.note ? { note: String(r.note) } : {}),
    }));
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
      owner_id: i.ownerId ?? null, activated_at: i.activatedAt ?? null,
    }));
    await rest("items", { method: "POST", body: JSON.stringify(rows), prefer: "resolution=merge-duplicates" });
    const comp = items.flatMap((i) => i.species.map((species) => ({ item: i.code, species })));
    if (comp.length) await rest("item_species", { method: "POST", body: JSON.stringify(comp), prefer: "resolution=ignore-duplicates" });
  },
  async listReviews(f) {
    const q = [f?.product ? `&product=eq.${encodeURIComponent(f.product)}` : "", f?.status ? `&status=eq.${f.status}` : ""].join("");
    return (await rest<ReviewRow[]>(`reviews?select=${REVIEW_SELECT}&order=created_at.desc&limit=500${q}`)).map(reviewFromRow);
  },
  async upsertReview(r) {
    // the table check constraint also rejects "approved" without consent
    await rest("reviews", {
      method: "POST", prefer: "resolution=merge-duplicates",
      body: JSON.stringify({ id: r.id, product: r.product, item_code: r.itemCode ?? null, rating: r.rating, body: r.body ?? null, author_name: r.authorName ?? null, locale: r.locale, photos: r.photos, consent_public: r.consentPublic, status: r.status, created_at: r.createdAt }),
    });
  },
  async getOwnerByTelegram(tid) {
    const rows = await rest<OwnerRow[]>(`owners?telegram_id=eq.${tid}&select=${OWNER_SELECT}`);
    return rows[0] ? ownerFromRow(rows[0]) : null;
  },
  async upsertOwner(o) {
    const rows = await rest<OwnerRow[]>(`owners?on_conflict=telegram_id&select=${OWNER_SELECT}`, {
      method: "POST", prefer: "resolution=merge-duplicates,return=representation",
      body: JSON.stringify({ telegram_id: o.telegramId, username: o.username ?? null, first_name: o.firstName ?? null, locale: o.locale, notify: o.notify }),
    });
    return ownerFromRow(rows[0]);
  },
  async getSetting(key) {
    const rows = await rest<Array<{ value: unknown }>>(`app_settings?key=eq.${encodeURIComponent(key)}&select=value`);
    return (rows[0]?.value ?? null) as never;
  },
  async setSetting(key, value) {
    if (value === null) { await rest(`app_settings?key=eq.${encodeURIComponent(key)}`, { method: "DELETE" }); return; }
    await rest("app_settings", { method: "POST", prefer: "resolution=merge-duplicates", body: JSON.stringify({ key, value, updated_at: new Date().toISOString() }) });
  },
  async listCatalog() {
    const rows = await rest<ProductRow[]>("products?select=slug,kind,status,price_uah,stock_mode,data,updated_at,product_species(species),product_content(locale,section,body)&limit=1000");
    return rows.map(catalogFromRow);
  },
  async upsertCatalogEntry(e) {
    const slug = encodeURIComponent(e.slug);
    await rest("products", {
      method: "POST", prefer: "resolution=merge-duplicates",
      body: JSON.stringify({ slug: e.slug, kind: e.kind === "set" ? "basket" : "single", status: e.status, price_uah: e.priceUah, stock_mode: e.stockMode, data: { title: e.title, tagline: e.tagline, photos: e.photos ?? [] } }),
    });
    // composition and texts are replaced as a whole
    await rest(`product_species?product=eq.${slug}`, { method: "DELETE" });
    if (e.herbs?.length) await rest("product_species", { method: "POST", body: JSON.stringify(e.herbs.map((species) => ({ product: e.slug, species }))) });
    await rest(`product_content?product=eq.${slug}`, { method: "DELETE" });
    const content = Object.entries(e.content ?? {}).flatMap(([section, l]) =>
      (["uk", "en"] as const).flatMap((locale) => (l?.[locale]?.trim() ? [{ product: e.slug, locale, section, body: l[locale]!.trim() }] : [])));
    if (content.length) await rest("product_content", { method: "POST", body: JSON.stringify(content) });
  },
  async deleteCatalogEntry(slug) { await rest(`products?slug=eq.${encodeURIComponent(slug)}`, { method: "DELETE" }); },
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
