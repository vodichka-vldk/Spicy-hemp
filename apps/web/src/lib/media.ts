import { randomBytes } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

export const MAX_PHOTO_BYTES = 5_000_000;
export const MAX_PRODUCT_PHOTOS = 8;
export type Bucket = "catalog" | "journal";
const LOCAL_DIR = (bucket: Bucket) => path.join(process.cwd(), ".data", "uploads", bucket);

const useSupabase = () => Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
const base = () => process.env.SUPABASE_URL!.replace(/\/$/, "");

export const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

/** Detects the image type from its first bytes (the browser-supplied type is not trusted). */
export function sniffImage(b: Uint8Array): "jpg" | "png" | "webp" | null {
  if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpg";
  if (b.length > 12 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  if (b.length > 12 && String.fromCharCode(...b.slice(0, 4)) === "RIFF" && String.fromCharCode(...b.slice(8, 12)) === "WEBP") return "webp";
  return null;
}

/** A stored path is `<product>/<random>.<ext>`; anything else is rejected before touching the disk or the network. */
export const isPhotoPath = (p: string) => /^[a-z0-9]+(-[a-z0-9]+)*\/[a-f0-9]{16}\.(jpg|png|webp)$/.test(p);

export const photoUrl = (p: string) => (useSupabase() ? `${base()}/storage/v1/object/public/catalog/${p}` : `/media/catalog/${p}`);

export async function savePhoto(product: string, bytes: Uint8Array, ext: "jpg" | "png" | "webp", bucket: Bucket = "catalog"): Promise<string> {
  const p = `${product}/${randomBytes(8).toString("hex")}.${ext}`;
  if (useSupabase()) {
    const res = await fetch(`${base()}/storage/v1/object/${bucket}/${p}`, {
      method: "POST",
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`, "Content-Type": MIME[ext] },
      body: bytes as unknown as BodyInit,
    });
    if (!res.ok) throw new Error(`Storage upload failed: ${res.status} ${await res.text()}`);
    return p;
  }
  const file = path.join(LOCAL_DIR(bucket), p);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, bytes);
  return p;
}

export async function removePhoto(p: string, bucket: Bucket = "catalog"): Promise<void> {
  if (!isPhotoPath(p)) return;
  if (useSupabase()) {
    await fetch(`${base()}/storage/v1/object/${bucket}/${p}`, {
      method: "DELETE",
      headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` },
    }).catch(() => undefined);
    return;
  }
  await fs.rm(path.join(LOCAL_DIR(bucket), p), { force: true });
}

export async function readLocalPhoto(p: string, bucket: Bucket = "catalog"): Promise<Buffer | null> {
  if (!isPhotoPath(p)) return null;
  try { return await fs.readFile(path.join(LOCAL_DIR(bucket), p)); } catch { return null; }
}

/** A private photo (journal): read with the service key, never through a public URL. */
export async function readPrivatePhoto(p: string, bucket: Bucket = "journal"): Promise<Buffer | null> {
  if (!isPhotoPath(p)) return null;
  if (!useSupabase()) return readLocalPhoto(p, bucket);
  const res = await fetch(`${base()}/storage/v1/object/${bucket}/${p}`, { headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!, Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}` } }).catch(() => null);
  return res?.ok ? Buffer.from(await res.arrayBuffer()) : null;
}
