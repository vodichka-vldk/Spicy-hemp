import { randomUUID } from "node:crypto";
import { getHerb } from "./content";
import { displayId, type CareTask } from "./domain";
import type { Item, Owner, Reminder, ReminderTask, Store } from "./store";

export type TaskRule = { everyDays: number; monthFrom: number; monthTo: number };
export type CareOverrides = Record<string, Partial<Record<CareTask, TaskRule | null>>>; // by herb slug; null switches a task off
export const OVERRIDES_KEY = "care_templates";

const DAY = 86_400_000;
export const REVIEW_AFTER_DAYS = 14;
/** A reminder nobody answered for this long is dropped and the next one is planned from the day it was sent. */
export const GIVE_UP_AFTER_DAYS = 3;
export const SNOOZE_HOURS = 24;

/** Katya's schedule for a herb: her overrides on top of the defaults (watering from the herb passport, feeding in the growing season). */
export function ruleFor(species: string, task: CareTask, overrides: CareOverrides = {}): TaskRule | null {
  const o = overrides[species]?.[task];
  if (o === null) return null;
  if (o) return o;
  const herb = getHerb(species);
  if (!herb) return null;
  if (task === "water") return { everyDays: herb.waterEveryDays, monthFrom: 1, monthTo: 12 };
  if (task === "feed") return { everyDays: 21, monthFrom: 4, monthTo: 9 };
  return null;
}

export const inWindow = (month: number, from: number, to: number) => (from <= to ? month >= from && month <= to : month >= from || month <= to);

/** The next date `everyDays` after `from` that falls inside the season; out of season it waits for the first day of the season. */
export function nextDue(from: Date, rule: TaskRule): Date {
  const d = new Date(from.getTime() + rule.everyDays * DAY);
  if (inWindow(d.getUTCMonth() + 1, rule.monthFrom, rule.monthTo)) return d;
  const next = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1, d.getUTCHours(), d.getUTCMinutes()));
  for (let i = 0; i < 13; i++) {
    next.setUTCMonth(next.getUTCMonth() + 1);
    if (inWindow(next.getUTCMonth() + 1, rule.monthFrom, rule.monthTo)) return next;
  }
  return d;
}

// ---------- quiet hours ----------

export function localMinutes(now: Date, timeZone: string): number {
  try {
    const parts = new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
    const get = (t: string) => Number(parts.find((p) => p.type === t)?.value);
    return get("hour") * 60 + get("minute");
  } catch {
    return localMinutes(now, "Europe/Kyiv");
  }
}
const toMin = (hhmm: string) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + (m || 0); };

/** Quiet hours may cross midnight ("21:00" to "08:00"). */
export function inQuietHours(now: Date, owner: Pick<Owner, "timezone" | "quietFrom" | "quietUntil">): boolean {
  const t = localMinutes(now, owner.timezone ?? "Europe/Kyiv");
  const from = toMin(owner.quietFrom ?? "21:00"), until = toMin(owner.quietUntil ?? "08:00");
  if (from === until) return false;
  return from < until ? t >= from && t < until : t >= from || t < until;
}

// ---------- planning ----------

type Slot = { task: ReminderTask; species?: string; rule: TaskRule };

/** What an activated item needs: watering and feeding for every herb separately, a monthly photo for the whole pot. */
export function slotsFor(item: Item, overrides: CareOverrides = {}): Slot[] {
  const slots: Slot[] = [];
  for (const species of item.species) {
    for (const task of ["water", "feed"] as const) {
      const rule = ruleFor(species, task, overrides);
      if (rule) slots.push({ task, species, rule });
    }
  }
  slots.push({ task: "photo", rule: { everyDays: 30, monthFrom: 1, monthTo: 12 } });
  return slots;
}

const key = (r: { itemCode: string; task: string; species?: string }) => `${r.itemCode}|${r.task}|${r.species ?? ""}`;
const ACTIVE = new Set(["pending", "sent", "snoozed"]);

/** Creates the reminders that are missing (the next one after each done/dropped one) and the one-off review request. Returns what it created. */
export async function planReminders(db: Store, now = new Date(), onlyItem?: string): Promise<Reminder[]> {
  const overrides = (await db.getSetting<CareOverrides>(OVERRIDES_KEY)) ?? {};
  const owners = new Map((await db.listOwners()).map((o) => [o.id, o]));
  const all = await db.listReminders();
  const created: Reminder[] = [];
  const dropped: Reminder[] = [];

  // drop reminders that were sent and ignored
  for (const r of all) {
    if (r.status === "sent" && r.sentAt && now.getTime() - new Date(r.sentAt).getTime() > GIVE_UP_AFTER_DAYS * DAY) {
      const d = { ...r, status: "skipped" as const };
      dropped.push(d);
      Object.assign(r, d);
    }
  }
  const byKey = new Map<string, Reminder[]>();
  for (const r of all) byKey.set(key(r), [...(byKey.get(key(r)) ?? []), r]);

  const items = (await db.listItems()).filter((i) => i.ownerId && i.activatedAt && i.status === "activated" && (!onlyItem || i.code === onlyItem));
  for (const item of items) {
    const owner = owners.get(item.ownerId!);
    if (!owner?.notify) continue;
    const base = new Date(item.activatedAt!);
    for (const slot of slotsFor(item, overrides)) {
      const k = key({ itemCode: item.code, task: slot.task, species: slot.species });
      const history = byKey.get(k) ?? [];
      if (history.some((r) => ACTIVE.has(r.status))) continue;
      const last = history.map((r) => r.doneAt ?? r.sentAt).filter(Boolean).sort().pop();
      const from = last ? new Date(last) : base;
      created.push({ id: randomUUID(), itemCode: item.code, ownerId: owner.id, task: slot.task, ...(slot.species ? { species: slot.species } : {}), dueAt: nextDue(from, slot.rule).toISOString(), status: "pending" });
    }
    const rk = key({ itemCode: item.code, task: "review" });
    if (!byKey.has(rk)) {
      created.push({ id: randomUUID(), itemCode: item.code, ownerId: owner.id, task: "review", dueAt: new Date(base.getTime() + REVIEW_AFTER_DAYS * DAY).toISOString(), status: "pending" });
    }
  }
  await db.upsertReminders([...dropped, ...created]);
  return created;
}

// ---------- sending ----------

export type Send = (chatId: number, text: string, markup?: Record<string, unknown>) => Promise<unknown>;

const NAMES: Record<"uk" | "en", Record<string, string>> = {
  uk: { water: "💧 час полити", feed: "🌱 час підгодувати", photo: "📷 час для фото-звіту" },
  en: { water: "💧 time to water", feed: "🌱 time to feed", photo: "📷 time for a photo update" },
};
const BTN = {
  uk: { done: "✅ Зроблено", snooze: "⏰ Відкласти на день", open: "🌿 Відкрити горщик", rate: "Як вам горщик? Оцініть від 1 до 5:" },
  en: { done: "✅ Done", snooze: "⏰ Snooze a day", open: "🌿 Open my pot", rate: "How do you like your pot? Rate it from 1 to 5:" },
};

export const potLabel = (item: Item, locale: "uk" | "en") => `${displayId(item.kind, item.displayNo, locale)}${item.ownerName ? ` «${item.ownerName}»` : ""}`;

/** Sends every reminder that is due and not in the owner's quiet hours, one message per pot and task. Failed sends are retried next run. */
export async function dispatchDue(db: Store, send: Send, siteUrl: string, now = new Date()): Promise<number> {
  const due = (await db.listReminders({ statuses: ["pending", "snoozed"] })).filter((r) => new Date(r.dueAt).getTime() <= now.getTime());
  if (due.length === 0) return 0;
  const owners = new Map((await db.listOwners()).map((o) => [o.id, o]));
  const items = new Map((await db.listItems()).map((i) => [i.code, i]));
  const groups = new Map<string, Reminder[]>();
  for (const r of due) groups.set(`${r.itemCode}|${r.task}`, [...(groups.get(`${r.itemCode}|${r.task}`) ?? []), r]);
  let sent = 0;
  for (const rs of groups.values()) {
    const owner = owners.get(rs[0].ownerId), item = items.get(rs[0].itemCode);
    if (!owner || !item || !owner.notify || inQuietHours(now, owner)) continue;
    const task = rs[0].task, loc = owner.locale, b = BTN[loc];
    let text: string, markup: Record<string, unknown>;
    if (task === "review") {
      text = `⭐ ${potLabel(item, loc)}\n${b.rate}`;
      markup = { inline_keyboard: [[1, 2, 3, 4, 5].map((n) => ({ text: "★".repeat(n), callback_data: `rv:${item.code}:${n}` }))] };
    } else {
      const herbs = rs.map((r) => (r.species ? getHerb(r.species)?.names[loc] : null)).filter(Boolean).join(", ");
      text = `${potLabel(item, loc)}: ${NAMES[loc][task]}${herbs ? `\n${herbs}` : ""}`;
      markup = { inline_keyboard: [[{ text: b.done, callback_data: `d:${item.code}:${task}` }, { text: b.snooze, callback_data: `s:${item.code}:${task}` }], [{ text: b.open, web_app: { url: `${siteUrl}/app` } }]] };
    }
    if (!(await send(owner.telegramId, text, markup))) continue;
    await db.upsertReminders(rs.map((r) => ({ ...r, status: "sent" as const, sentAt: now.toISOString() })));
    sent++;
  }
  return sent;
}

/** Owner pressed "Done" or "Snooze" under a reminder. Returns how many reminders changed. */
export async function answerReminder(db: Store, itemCode: string, task: ReminderTask, action: "done" | "snooze", now = new Date()): Promise<number> {
  const open = (await db.listReminders({ itemCode, statuses: ["pending", "sent", "snoozed"] })).filter((r) => r.task === task);
  if (open.length === 0) return 0;
  await db.upsertReminders(open.map((r) => (action === "done" ? { ...r, status: "done" as const, doneAt: now.toISOString() } : { ...r, status: "snoozed" as const, dueAt: new Date(now.getTime() + SNOOZE_HOURS * 3_600_000).toISOString() })));
  if (action === "done") await planReminders(db, now, itemCode);
  return open.length;
}
