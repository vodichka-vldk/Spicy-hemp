import { randomUUID } from "node:crypto";
import { JOURNAL_KINDS, LIGHT_LEVELS, type JournalKind, type LightLevel } from "./domain";
import { MAX_PHOTO_BYTES, removePhoto, savePhoto, sniffImage } from "./media";
import { cleanText, isSymptom } from "./questions";
import type { JournalEntry, Owner, Store } from "./store";

export const JOURNAL_MAX_PHOTOS = 6;
export const JOURNAL_MAX_NOTE = 2000;
export const JOURNAL_PHOTO_BYTES = Math.max(MAX_PHOTO_BYTES, 8_000_000);

export type NewEntry = { code: string; kind: string; note?: string; light?: string; watered?: boolean; symptom?: string; date?: string };
export type EntryResult = { ok: true; entry: JournalEntry } | { ok: false; reason: "not_yours" | "bad_kind" | "empty" | "too_many_photos" | "bad_photo" | "too_big" };

const isKind = (v: string): v is JournalKind => (JOURNAL_KINDS as readonly string[]).includes(v);
const isLight = (v?: string): v is LightLevel => !!v && (LIGHT_LEVELS as readonly string[]).includes(v);
const isDate = (v?: string): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v));

/** The owner writes a journal entry for one of their pots. Photos are checked by content and stored privately. */
export async function addEntry(db: Store, owner: Owner, input: NewEntry, files: Uint8Array[], now = new Date()): Promise<EntryResult> {
  const item = await db.getItem(input.code);
  if (!item || item.ownerId !== owner.id) return { ok: false, reason: "not_yours" };
  if (!isKind(input.kind)) return { ok: false, reason: "bad_kind" };
  if (files.length > JOURNAL_MAX_PHOTOS) return { ok: false, reason: "too_many_photos" };
  const note = cleanText(input.note ?? "", JOURNAL_MAX_NOTE);
  if (!note && files.length === 0 && input.watered === undefined && !input.light && !input.symptom) return { ok: false, reason: "empty" };
  const exts: Array<"jpg" | "png" | "webp"> = [];
  for (const f of files) {
    if (f.length > JOURNAL_PHOTO_BYTES) return { ok: false, reason: "too_big" };
    const ext = sniffImage(f);
    if (!ext) return { ok: false, reason: "bad_photo" };
    exts.push(ext);
  }
  const folder = item.code.toLowerCase();
  const photos: string[] = [];
  for (let i = 0; i < files.length; i++) photos.push(await savePhoto(folder, files[i], exts[i], "journal"));
  const today = now.toISOString().slice(0, 10);
  const entry: JournalEntry = {
    id: randomUUID(), itemCode: item.code, ownerId: owner.id, kind: input.kind, date: isDate(input.date) && input.date <= today ? input.date : today,
    ...(isLight(input.light) ? { light: input.light } : {}), ...(input.watered !== undefined ? { watered: input.watered } : {}),
    ...(note ? { note } : {}), ...(isSymptom(input.symptom) ? { symptom: input.symptom } : {}), photos, createdAt: now.toISOString(),
  };
  await db.addJournalEntry(entry);
  return { ok: true, entry };
}

export async function removeEntry(db: Store, owner: Owner, id: string): Promise<boolean> {
  const e = (await db.listJournal({ ownerId: owner.id })).find((x) => x.id === id);
  if (!e) return false;
  await db.deleteJournalEntry(id);
  await Promise.all(e.photos.map((p) => removePhoto(p, "journal")));
  return true;
}

/** A photo may be read only by the owner of the pot it belongs to. */
export async function ownerMayRead(db: Store, owner: Owner, path: string): Promise<boolean> {
  return (await db.listJournal({ ownerId: owner.id })).some((e) => e.photos.includes(path));
}
