import { ITEM_TRANSITIONS, canTransition, type ItemStatus } from "./domain";
import type { Item, Owner, Store } from "./store";

export const MAX_NAME = 60;

/** Statuses a pot goes through before its buyer activates it. */
const PATH: ItemStatus[] = ["sold", "shipped", "delivered", "activated"];

export type ActivateResult = { ok: true; item: Item; already: boolean } | { ok: false; reason: "not_found" | "taken" | "not_sold" };

/** The buyer scans the QR and confirms the pot is theirs. Only pots that were sold can be activated. */
export async function activateItem(db: Store, code: string, owner: Owner, now = new Date()): Promise<ActivateResult> {
  const item = await db.getItem(code);
  if (!item) return { ok: false, reason: "not_found" };
  if (item.ownerId === owner.id) return { ok: true, item, already: true };
  if (item.ownerId) return { ok: false, reason: "taken" };
  const from = PATH.indexOf(item.status);
  if (from < 0 || item.status === "activated") return { ok: false, reason: "not_sold" };
  for (let i = from; i < PATH.length - 1; i++) {
    if (!canTransition(ITEM_TRANSITIONS, PATH[i], PATH[i + 1])) return { ok: false, reason: "not_sold" };
  }
  const next: Item = { ...item, status: "activated", ownerId: owner.id, activatedAt: now.toISOString() };
  await db.upsertItems([next]);
  return { ok: true, item: next, already: false };
}

export function cleanName(raw: string): string {
  // eslint-disable-next-line no-control-regex
  return raw.replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

/** The owner gives the pot a name. Empty clears it. */
export async function renameItem(db: Store, code: string, owner: Owner, raw: string): Promise<Item | null> {
  const item = await db.getItem(code);
  if (!item || item.ownerId !== owner.id) return null;
  const name = cleanName(raw);
  const next: Item = { ...item, ownerName: name || undefined }; // explicit undefined clears the name in the merge-style stores
  await db.upsertItems([next]);
  return next;
}

export async function itemsOfOwner(db: Store, owner: Owner): Promise<Item[]> {
  return (await db.listItems()).filter((i) => i.ownerId === owner.id).sort((a, b) => (a.activatedAt ?? "").localeCompare(b.activatedAt ?? ""));
}
