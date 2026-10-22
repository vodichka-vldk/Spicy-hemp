"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { buildEntry, entriesFromCsv, isSlug, slugify } from "@/lib/catalog-admin";
import { loadProducts } from "@/lib/catalog-server";
import { CARE_SECTIONS } from "@/lib/domain";
import { MAX_PHOTO_BYTES, MAX_PRODUCT_PHOTOS, isPhotoPath, removePhoto, savePhoto, sniffImage } from "@/lib/media";
import { getProduct, products as builtIn } from "@/lib/shop";
import { CATALOG_STATUSES, store, type CatalogEntry } from "@/lib/store";

const isBuiltIn = (slug: string) => builtIn.some((p) => p.slug === slug);

/** The shop caches product pages; changes in the catalogue must show up right away. */
function refreshShop() {
  revalidatePath("/", "layout");
}

/** The admin's entry for a slug, or a neutral one built from the built-in product, so quick edits never lose anything. */
async function entryFor(slug: string): Promise<CatalogEntry | null> {
  const db = store();
  const existing = (await db.listCatalog()).find((e) => e.slug === slug);
  if (existing) return existing;
  const p = getProduct(slug, await loadProducts());
  if (!p) return null;
  return { slug, kind: p.kind, status: p.status ?? "published", priceUah: 0, stockMode: p.stockMode ?? "in_stock", updatedAt: new Date().toISOString() };
}

export async function setStatus(formData: FormData) {
  const slug = String(formData.get("slug"));
  const status = String(formData.get("status"));
  if (!(CATALOG_STATUSES as readonly string[]).includes(status)) return;
  const entry = await entryFor(slug);
  if (!entry) return;
  await store().upsertCatalogEntry({ ...entry, status: status as CatalogEntry["status"], updatedAt: new Date().toISOString() });
  refreshShop();
  revalidatePath("/admin/catalog");
}

/** Quick price edit from the table; empty or 0 returns to the automatic price. */
export async function setPrice(formData: FormData) {
  const slug = String(formData.get("slug"));
  const price = Math.round(Number(String(formData.get("price") ?? "0").replace(",", ".")));
  if (!Number.isFinite(price) || price < 0 || price > 100000) return;
  const entry = await entryFor(slug);
  if (!entry) return;
  await store().upsertCatalogEntry({ ...entry, priceUah: price, updatedAt: new Date().toISOString() });
  refreshShop();
  revalidatePath("/admin/catalog");
}

function fromForm(formData: FormData, slug: string, kind: string) {
  const g = (k: string) => String(formData.get(k) ?? "");
  const content: Record<string, { uk?: string; en?: string }> = {};
  for (const s of CARE_SECTIONS) content[s] = { uk: g(`${s}_uk`), en: g(`${s}_en`) };
  return {
    slug, kind, status: g("status"), priceUah: g("price").replace(",", ".") || 0, stockMode: g("stock_mode"),
    herbs: formData.getAll("herbs").map(String),
    title: { uk: g("title_uk"), en: g("title_en") }, tagline: { uk: g("tagline_uk"), en: g("tagline_en") }, content,
  };
}

/** Saves the editor: existing product (slug is fixed) or a brand new basket. */
export async function saveProduct(formData: FormData) {
  const original = String(formData.get("original") ?? "");
  const kind = String(formData.get("kind") ?? "set");
  let slug = original;
  if (!slug) {
    slug = String(formData.get("slug") || "").trim().toLowerCase() || `set-${slugify(String(formData.get("title_uk") || formData.get("title_en") || ""))}`;
    if (!isSlug(slug)) redirect(`/admin/catalog/new?error=${encodeURIComponent("Вкажіть назву кошика або ідентифікатор (латиниця)")}`);
    if ((await loadProducts()).some((p) => p.slug === slug)) redirect(`/admin/catalog/new?error=${encodeURIComponent(`Товар «${slug}» уже існує`)}`);
  }
  const res = buildEntry(fromForm(formData, slug, kind), isBuiltIn);
  if (!res.ok) redirect(`/admin/catalog/${original ? slug : "new"}?error=${encodeURIComponent(res.error)}`);
  const photos = (await store().listCatalog()).find((e) => e.slug === slug)?.photos;
  await store().upsertCatalogEntry({ ...res.entry, ...(photos?.length ? { photos } : {}) });
  refreshShop();
  redirect(`/admin/catalog/${slug}?saved=1`);
}

/** Built-in product: forget the admin's changes. Custom basket: delete it (only if no physical baskets exist). */
export async function resetProduct(formData: FormData) {
  const slug = String(formData.get("slug"));
  if (!isBuiltIn(slug)) {
    const used = (await store().listItems()).some((i) => i.product === slug);
    if (used) redirect(`/admin/catalog/${slug}?error=${encodeURIComponent("Є виготовлені горщики цього кошика. Заархівуйте його замість видалення")}`);
  }
  const photos = (await store().listCatalog()).find((e) => e.slug === slug)?.photos ?? [];
  await store().deleteCatalogEntry(slug);
  await Promise.all(photos.map((p) => removePhoto(p)));
  refreshShop();
  redirect(isBuiltIn(slug) ? `/admin/catalog/${slug}?saved=1` : "/admin/catalog");
}

/** Copy of a basket as a draft: the fast way to make a variation. */
export async function duplicateProduct(formData: FormData) {
  const slug = String(formData.get("slug"));
  const all = await loadProducts();
  const src = getProduct(slug, all);
  if (!src || src.kind !== "set") return;
  let n = 2, next = `${slug}-${n}`;
  while (all.some((p) => p.slug === next)) next = `${slug}-${++n}`;
  const entry = (await store().listCatalog()).find((e) => e.slug === slug);
  await store().upsertCatalogEntry({
    slug: next, kind: "set", status: "draft", priceUah: entry?.priceUah ?? 0, stockMode: src.stockMode ?? "in_stock",
    title: src.titleKey ? { uk: `${src.titleKey.uk} (копія)`, en: `${src.titleKey.en} (copy)` } : undefined,
    tagline: src.blurb, herbs: src.herbs, content: src.content, updatedAt: new Date().toISOString(),
  });
  refreshShop();
  redirect(`/admin/catalog/${next}`);
}

/** Adds photos to a product (JPEG, PNG or WebP up to 5 MB each; the type is checked from the file itself). */
export async function uploadPhotos(formData: FormData) {
  const slug = String(formData.get("slug"));
  const back = (q: string) => redirect(`/admin/catalog/${slug}?${q}`);
  const entry = await entryFor(slug);
  if (!entry) return back("error=" + encodeURIComponent("Спершу збережіть товар"));
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  if (files.length === 0) return back("error=" + encodeURIComponent("Оберіть файли"));
  const photos = [...(entry.photos ?? [])];
  const problems: string[] = [];
  for (const f of files) {
    if (photos.length >= MAX_PRODUCT_PHOTOS) { problems.push(`максимум ${MAX_PRODUCT_PHOTOS} фото`); break; }
    if (f.size > MAX_PHOTO_BYTES) { problems.push(`${f.name}: більше 5 МБ`); continue; }
    const bytes = new Uint8Array(await f.arrayBuffer());
    const ext = sniffImage(bytes);
    if (!ext) { problems.push(`${f.name}: потрібен JPEG, PNG або WebP`); continue; }
    photos.push(await savePhoto(slug, bytes, ext));
  }
  await store().upsertCatalogEntry({ ...entry, photos, updatedAt: new Date().toISOString() });
  refreshShop();
  back(problems.length ? "error=" + encodeURIComponent(`Частину не додано: ${problems.join("; ")}`) : "saved=1");
}

/** Remove a photo, or make it the cover (move to the front). */
export async function changePhoto(formData: FormData) {
  const slug = String(formData.get("slug"));
  const photo = String(formData.get("photo"));
  const op = String(formData.get("op"));
  const entry = await entryFor(slug);
  if (!entry?.photos?.includes(photo)) return;
  const photos = op === "cover" ? [photo, ...entry.photos.filter((p) => p !== photo)] : entry.photos.filter((p) => p !== photo);
  await store().upsertCatalogEntry({ ...entry, photos, updatedAt: new Date().toISOString() });
  if (op === "delete" && isPhotoPath(photo)) await removePhoto(photo);
  refreshShop();
  redirect(`/admin/catalog/${slug}?saved=1`);
}

export async function importCsv(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect(`/admin/catalog?import=${encodeURIComponent("Оберіть CSV-файл")}`);
  if (file.size > 2_000_000) redirect(`/admin/catalog?import=${encodeURIComponent("Файл завеликий")}`);
  const { entries, errors } = entriesFromCsv(await file.text(), isBuiltIn);
  const db = store();
  const photos = new Map((await db.listCatalog()).map((e) => [e.slug, e.photos]));
  for (const e of entries) await db.upsertCatalogEntry({ ...e, ...(photos.get(e.slug)?.length ? { photos: photos.get(e.slug) } : {}) });
  refreshShop();
  const msg = `Імпортовано: ${entries.length}.${errors.length ? ` Пропущено: ${errors.length} (${errors.slice(0, 3).join("; ")})` : ""}`;
  redirect(`/admin/catalog?import=${encodeURIComponent(msg)}`);
}
