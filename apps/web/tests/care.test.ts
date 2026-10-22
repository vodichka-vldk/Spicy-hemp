import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { inQuietHours, nextDue, ruleFor } from "@/lib/care";

describe("care rules", () => {
  it("uses the herb passport for watering and a season for feeding", () => {
    expect(ruleFor("mint", "water")).toMatchObject({ everyDays: expect.any(Number), monthFrom: 1, monthTo: 12 });
    expect(ruleFor("mint", "feed")).toEqual({ everyDays: 21, monthFrom: 4, monthTo: 9 });
    expect(ruleFor("nope", "water")).toBeNull();
    expect(ruleFor("mint", "prune")).toBeNull();
  });
  it("Katya's overrides win and null switches a task off", () => {
    expect(ruleFor("mint", "water", { mint: { water: { everyDays: 3, monthFrom: 1, monthTo: 12 } } })?.everyDays).toBe(3);
    expect(ruleFor("mint", "feed", { mint: { feed: null } })).toBeNull();
  });
  it("nextDue adds the interval and waits for the season", () => {
    const r = { everyDays: 21, monthFrom: 4, monthTo: 9 };
    expect(nextDue(new Date("2026-06-01T09:00:00Z"), r).toISOString()).toBe("2026-06-22T09:00:00.000Z");
    expect(nextDue(new Date("2026-09-20T09:00:00Z"), r).toISOString()).toBe("2027-04-01T09:00:00.000Z");
    expect(nextDue(new Date("2026-12-01T09:00:00Z"), { everyDays: 7, monthFrom: 11, monthTo: 2 }).toISOString()).toBe("2026-12-08T09:00:00.000Z"); // window across New Year
  });
  it("quiet hours cross midnight and follow the time zone", () => {
    const kyiv = { timezone: "Europe/Kyiv", quietFrom: "21:00", quietUntil: "08:00" };
    expect(inQuietHours(new Date("2026-07-01T20:00:00Z"), kyiv)).toBe(true); // 23:00 in Kyiv
    expect(inQuietHours(new Date("2026-07-01T04:30:00Z"), kyiv)).toBe(true); // 07:30
    expect(inQuietHours(new Date("2026-07-01T06:00:00Z"), kyiv)).toBe(false); // 09:00
    expect(inQuietHours(new Date("2026-07-01T20:00:00Z"), { ...kyiv, timezone: "UTC" })).toBe(false); // 20:00 UTC
    expect(inQuietHours(new Date("2026-07-01T12:00:00Z"), { ...kyiv, quietFrom: "10:00", quietUntil: "10:00" })).toBe(false);
    expect(inQuietHours(new Date("2026-07-01T12:00:00Z"), { ...kyiv, timezone: "Not/AZone" })).toBe(false);
  });
});

type Db = typeof import("@/lib/store/file").fileStore;
let db: Db;
let care: typeof import("@/lib/care");
let bot: typeof import("@/lib/bot");
let qs: typeof import("@/lib/questions");
const sent: Array<{ chat: number; text: string; markup?: Record<string, unknown> }> = [];
const send = async (chat: number, text: string, markup?: Record<string, unknown>) => { sent.push({ chat, text, markup }); return { message_id: sent.length }; };
const ACT = "2026-07-01T09:00:00.000Z";

beforeAll(async () => {
  process.chdir(mkdtempSync(join(tmpdir(), "sh-care-")));
  delete process.env.TELEGRAM_ADMIN_CHAT_ID;
  db = (await import("@/lib/store/file")).fileStore;
  care = await import("@/lib/care");
  bot = await import("@/lib/bot");
  qs = await import("@/lib/questions");
});

async function activated(code: string, tg: number, species = ["mint", "basil"]) {
  const o = await db.upsertOwner({ telegramId: tg, firstName: "Олена", locale: "uk", notify: true });
  await db.upsertItems([{ code, kind: "basket", product: "set-tea", species, batch: "T", readyOn: "2026-06-01", status: "activated", ownerId: o.id, activatedAt: ACT }]);
  return o;
}

describe("planning reminders", () => {
  it("plans watering and feeding per herb, a photo reminder and the review request, once", async () => {
    await activated("PLAN2222", 101);
    const first = await care.planReminders(db, new Date(ACT));
    const mine = first.filter((r) => r.itemCode === "PLAN2222");
    expect(mine.map((r) => `${r.task}:${r.species ?? "-"}`).sort()).toEqual(["feed:basil", "feed:mint", "photo:-", "review:-", "water:basil", "water:mint"]);
    const review = mine.find((r) => r.task === "review")!;
    expect(review.dueAt).toBe("2026-07-15T09:00:00.000Z"); // two weeks after activation
    expect(await care.planReminders(db, new Date(ACT))).toEqual([]); // nothing new
  });
  it("does not plan for owners who switched notifications off or for pots that are not activated", async () => {
    const o = await db.upsertOwner({ telegramId: 102, locale: "uk", notify: false });
    await db.upsertItems([{ code: "QUIE2222", kind: "basket", product: "set-tea", species: ["mint"], batch: "T", readyOn: "2026-06-01", status: "activated", ownerId: o.id, activatedAt: ACT }, { code: "SOLD2222", kind: "basket", product: "set-tea", species: ["mint"], batch: "T", readyOn: "2026-06-01", status: "sold" }]);
    const planned = await care.planReminders(db, new Date(ACT));
    expect(planned.filter((r) => r.itemCode === "QUIE2222" || r.itemCode === "SOLD2222")).toEqual([]);
  });
});

describe("sending reminders", () => {
  it("sends due reminders once per pot and task, not before they are due or at night", async () => {
    sent.length = 0;
    const waterDue = (await db.listReminders({ itemCode: "PLAN2222" })).filter((r) => r.task === "water").map((r) => r.dueAt).sort()[0];
    expect(await care.dispatchDue(db, send, "https://s.example", new Date(new Date(waterDue).getTime() - 3_600_000))).toBe(0);
    // 22:00 Kyiv: quiet
    expect(await care.dispatchDue(db, send, "https://s.example", new Date("2026-07-03T19:00:00Z"))).toBe(0);
    expect(sent).toHaveLength(0);
    const n = await care.dispatchDue(db, send, "https://s.example", new Date("2026-07-03T09:00:00Z"));
    expect(n).toBeGreaterThanOrEqual(1);
    const water = sent.find((m) => /полити/.test(m.text))!;
    expect(water.chat).toBe(101);
    expect(water.text).toMatch(/Мʼята|М'ята|М’ята/i);
    expect(JSON.stringify(water.markup)).toContain("d:PLAN2222:water");
    expect(JSON.stringify(water.markup)).toContain("s:PLAN2222:water");
    sent.length = 0;
    expect(await care.dispatchDue(db, send, "https://s.example", new Date("2026-07-03T09:05:00Z"))).toBe(0); // already sent
  });
  it("keeps a reminder pending when Telegram fails", async () => {
    await activated("FAIL2222", 103, ["thyme"]);
    await care.planReminders(db, new Date(ACT));
    const r = await care.dispatchDue(db, async () => null, "https://s.example", new Date("2027-01-01T09:00:00Z"));
    expect(r).toBe(0);
    expect((await db.listReminders({ itemCode: "FAIL2222", statuses: ["pending"] })).length).toBeGreaterThan(0);
  });
});

describe("buttons under reminders", () => {
  const ctx = (extra: object = {}) => ({ db, send, siteUrl: "https://s.example", now: new Date("2026-07-03T09:00:00Z"), answer: async () => undefined, edit: async () => undefined, ...extra });
  const click = (tg: number, data: string) => ({ callback_query: { id: "cb", from: { id: tg }, data, message: { message_id: 5, chat: { id: tg }, text: "x" } } });

  it("done marks the reminder done and plans the next one from today", async () => {
    await bot.handleUpdate(click(101, "d:PLAN2222:water"), ctx());
    const all = await db.listReminders({ itemCode: "PLAN2222" });
    expect(all.filter((r) => r.task === "water" && r.status === "done")).toHaveLength(2);
    const next = all.filter((r) => r.task === "water" && r.status === "pending");
    expect(next).toHaveLength(2);
    expect(next.every((r) => new Date(r.dueAt) > new Date("2026-07-03T09:00:00Z"))).toBe(true);
  });
  it("snooze moves the reminder by a day", async () => {
    await bot.handleUpdate(click(101, "d:PLAN2222:feed"), ctx()); // make sure something is open for feed first
    const before = await db.listReminders({ itemCode: "PLAN2222", statuses: ["pending", "sent"] });
    expect(before.some((r) => r.task === "photo")).toBe(true);
    await bot.handleUpdate(click(101, "s:PLAN2222:photo"), ctx());
    const photo = (await db.listReminders({ itemCode: "PLAN2222" })).find((r) => r.task === "photo")!;
    expect(photo.status).toBe("snoozed");
    expect(photo.dueAt).toBe("2026-07-04T09:00:00.000Z");
  });
  it("another user cannot press buttons of someone else's pot", async () => {
    await db.upsertOwner({ telegramId: 999, locale: "uk", notify: true });
    await bot.handleUpdate(click(999, "d:PLAN2222:photo"), ctx());
    expect((await db.listReminders({ itemCode: "PLAN2222" })).find((r) => r.task === "photo")!.status).toBe("snoozed");
  });
});

describe("review request", () => {
  const ctx = (now = "2026-07-15T10:00:00Z") => ({ db, send, siteUrl: "https://s.example", now: new Date(now), answer: async () => undefined, edit: async () => undefined });
  it("is sent two weeks after activation with 1-5 buttons", async () => {
    sent.length = 0;
    await care.dispatchDue(db, send, "https://s.example", new Date("2026-07-15T10:00:00Z"));
    const ask = sent.find((m) => m.chat === 101 && /Оцініть/.test(m.text))!;
    expect(ask).toBeTruthy();
    expect(JSON.stringify(ask.markup)).toContain("rv:PLAN2222:5");
  });
  it("rating, consent and text create a pending review for moderation", async () => {
    sent.length = 0;
    await bot.handleUpdate({ callback_query: { id: "1", from: { id: 101 }, data: "rv:PLAN2222:5", message: { message_id: 1, chat: { id: 101 }, text: "x" } } }, ctx());
    const review = (await db.listReviews()).find((r) => r.itemCode === "PLAN2222")!;
    expect(review).toMatchObject({ rating: 5, status: "pending", consentPublic: false, product: "set-tea", authorName: "Олена" });
    expect(JSON.stringify(sent.at(-1)!.markup)).toContain(`rc:${review.id}:1`);
    await bot.handleUpdate({ callback_query: { id: "2", from: { id: 101 }, data: `rc:${review.id}:1`, message: { message_id: 2, chat: { id: 101 }, text: "x" } } }, ctx());
    expect((await db.listReviews()).find((r) => r.id === review.id)!.consentPublic).toBe(true);
    await bot.handleUpdate({ message: { chat: { id: 101, type: "private" }, from: { id: 101, first_name: "Олена" }, text: "Чудовий кошик, мʼята росте!" } }, ctx());
    expect((await db.listReviews()).find((r) => r.id === review.id)!.body).toBe("Чудовий кошик, мʼята росте!");
    expect((await db.listReminders({ itemCode: "PLAN2222" })).find((r) => r.task === "review")!.status).toBe("done");
    // text is only taken once
    await bot.handleUpdate({ message: { chat: { id: 101, type: "private" }, from: { id: 101 }, text: "ще" } }, ctx());
    expect((await db.listReviews()).find((r) => r.id === review.id)!.body).toBe("Чудовий кошик, мʼята росте!");
  });
  it("a second rating updates the same review instead of adding another", async () => {
    await bot.handleUpdate({ callback_query: { id: "3", from: { id: 101 }, data: "rv:PLAN2222:4", message: { message_id: 3, chat: { id: 101 }, text: "x" } } }, ctx());
    const mine = (await db.listReviews()).filter((r) => r.itemCode === "PLAN2222");
    expect(mine).toHaveLength(1);
    expect(mine[0].rating).toBe(4);
  });
  it("ratings outside 1-5 are ignored", async () => {
    await bot.handleUpdate({ callback_query: { id: "4", from: { id: 101 }, data: "rv:PLAN2222:9", message: { message_id: 4, chat: { id: 101 }, text: "x" } } }, ctx());
    expect((await db.listReviews()).find((r) => r.itemCode === "PLAN2222")!.rating).toBe(4);
  });
});

describe("questions to Katya", () => {
  it("the owner asks, Katya gets a card and answers by replying in Telegram", async () => {
    sent.length = 0;
    await db.setSetting("telegram_admin_ids", [500]);
    const o = (await db.getOwnerByTelegram(101))!;
    const r = await qs.askQuestion(db, send, "https://s.example", o, "PLAN2222", "  Листя жовтіє  ", "overwater");
    expect(r.ok).toBe(true);
    const card = sent.find((m) => m.chat === 500)!;
    expect(card.text).toMatch(/Листя жовтіє/);
    expect(card.text).toMatch(/Симптом/);
    expect(card.text).toMatch(/ГОРЩИК/);
    const cardId = sent.indexOf(card) + 1;
    sent.length = 0;
    // a stranger's reply is not an answer
    await bot.handleUpdate({ message: { chat: { id: 777, type: "private" }, from: { id: 777 }, text: "Полийте менше", reply_to_message: { message_id: cardId } } }, { db, send, siteUrl: "https://s.example" });
    expect((await db.listQuestions({ status: "open" })).length).toBe(1);
    sent.length = 0;
    await bot.handleUpdate({ message: { chat: { id: 500, type: "private" }, from: { id: 500 }, text: "Полийте менше, і прибрати воду з піддону", reply_to_message: { message_id: cardId } } }, { db, send, siteUrl: "https://s.example" });
    const q = (await db.listQuestions())[0];
    expect(q).toMatchObject({ status: "answered", answer: "Полийте менше, і прибрати воду з піддону" });
    const toOwner = sent.find((m) => m.chat === 101)!;
    expect(toOwner.text).toMatch(/Катя відповіла/);
    expect(toOwner.text).toMatch(/Полийте менше/);
  });
  it("refuses empty questions and other people's pots", async () => {
    const o = (await db.getOwnerByTelegram(101))!;
    expect(await qs.askQuestion(db, send, "x", o, "PLAN2222", "   ")).toEqual({ ok: false, reason: "empty" });
    expect(await qs.askQuestion(db, send, "x", o, "FAIL2222", "чужий")).toEqual({ ok: false, reason: "not_yours" });
  });
  it("flags unanswered questions after a day", () => {
    const q = { id: "1", itemCode: "A", ownerId: "o", body: "?", status: "open" as const, createdAt: "2026-07-01T00:00:00Z" };
    expect(qs.isOverdue(q, new Date("2026-07-01T23:00:00Z"))).toBe(false);
    expect(qs.isOverdue(q, new Date("2026-07-02T01:00:00Z"))).toBe(true);
    expect(qs.isOverdue({ ...q, status: "answered" }, new Date("2026-08-01T00:00:00Z"))).toBe(false);
  });
  it("first aid comes from the knowledge base", () => {
    expect(qs.hintFor("overwater", "uk")?.fix).toMatch(/Поливайте рідше/);
    expect(qs.hintFor("overwater", "en")?.fix).toMatch(/Water less/);
    expect(qs.hintFor("bogus", "uk")).toBeNull();
    expect(qs.hintFor(undefined, "uk")).toBeNull();
  });
});
