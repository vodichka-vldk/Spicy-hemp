import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { signInitData, verifyInitData, webhookAuthorised } from "@/lib/telegram";

const TOKEN = "123456:TEST-token";
const NOW = 1_800_000_000_000;
const sec = Math.floor(NOW / 1000);
const user = JSON.stringify({ id: 777, first_name: "Олена", username: "olena", language_code: "uk" });
const signed = (over: Record<string, string> = {}, token = TOKEN) => signInitData({ auth_date: String(sec - 60), user, query_id: "AAH", ...over }, token);

describe("Mini App initData", () => {
  it("accepts correctly signed, fresh data", () => {
    const a = verifyInitData(signed({ start_param: "ABCD2345" }), TOKEN, NOW);
    expect(a).toEqual({ user: { id: 777, firstName: "Олена", username: "olena", locale: "uk" }, startParam: "ABCD2345" });
  });
  it("reads the language", () => {
    const en = signed({ user: JSON.stringify({ id: 1, language_code: "en-GB" }) });
    expect(verifyInitData(en, TOKEN, NOW)?.user.locale).toBe("en");
  });
  it("rejects a different bot token", () => expect(verifyInitData(signed({}, "999:other"), TOKEN, NOW)).toBeNull());
  it("rejects tampered fields", () => {
    const tampered = signed().replace("777", "778");
    expect(verifyInitData(tampered, TOKEN, NOW)).toBeNull();
    expect(verifyInitData(signed() + "&start_param=EVIL", TOKEN, NOW)).toBeNull();
  });
  it("rejects stale and future data", () => {
    expect(verifyInitData(signed({ auth_date: String(sec - 90_000) }), TOKEN, NOW)).toBeNull();
    expect(verifyInitData(signed({ auth_date: String(sec + 3600) }), TOKEN, NOW)).toBeNull();
  });
  it("rejects garbage", () => {
    for (const bad of ["", "hash=abc", "user=%7B%7D", "a".repeat(5000)]) expect(verifyInitData(bad, TOKEN, NOW)).toBeNull();
    expect(verifyInitData(signed(), "", NOW)).toBeNull();
    expect(verifyInitData(signed({ user: "not json" }), TOKEN, NOW)).toBeNull();
    expect(verifyInitData(signed({ user: JSON.stringify({ id: "1" }) }), TOKEN, NOW)).toBeNull();
  });
});

describe("webhook secret", () => {
  it("compares in constant time and fails closed", () => {
    expect(webhookAuthorised("s3cret", "s3cret")).toBe(true);
    expect(webhookAuthorised("s3cret!", "s3cret")).toBe(false);
    expect(webhookAuthorised(null, "s3cret")).toBe(false);
    expect(webhookAuthorised("anything", "")).toBe(false);
    expect(webhookAuthorised("", "")).toBe(false);
  });
});

type Db = typeof import("@/lib/store/file").fileStore;
let db: Db;
let act: typeof import("@/lib/activation");
let bot: typeof import("@/lib/bot");

beforeAll(async () => {
  process.chdir(mkdtempSync(join(tmpdir(), "sh-tg-")));
  delete process.env.TELEGRAM_ADMIN_CHAT_ID;
  db = (await import("@/lib/store/file")).fileStore;
  act = await import("@/lib/activation");
  bot = await import("@/lib/bot");
});

const mkItem = (code: string, status: "ready_for_sale" | "sold" | "shipped" | "delivered" | "archived") =>
  ({ code, kind: "basket" as const, product: "set-tea", species: ["mint"], batch: "T", readyOn: "2026-10-22", status });
const owner = (telegramId: number) => db.upsertOwner({ telegramId, locale: "uk", notify: true });

describe("activation", () => {
  it("moves a sold pot through delivery to activated and assigns the owner", async () => {
    await db.upsertItems([mkItem("AAAA2222", "sold")]);
    const o = await owner(1);
    const r = await act.activateItem(db, "AAAA2222", o, new Date("2026-10-23T10:00:00Z"));
    expect(r).toMatchObject({ ok: true, already: false, item: { status: "activated", ownerId: o.id, activatedAt: "2026-10-23T10:00:00.000Z" } });
    expect((await act.itemsOfOwner(db, o)).map((i) => i.code)).toEqual(["AAAA2222"]);
  });
  it("is idempotent for the same owner and refuses another one", async () => {
    const o = await owner(1);
    expect(await act.activateItem(db, "AAAA2222", o)).toMatchObject({ ok: true, already: true });
    expect(await act.activateItem(db, "AAAA2222", await owner(2))).toEqual({ ok: false, reason: "taken" });
  });
  it("refuses pots that are not sold, unknown codes", async () => {
    await db.upsertItems([mkItem("BBBB2222", "ready_for_sale"), mkItem("CCCC2222", "archived")]);
    const o = await owner(3);
    expect(await act.activateItem(db, "BBBB2222", o)).toEqual({ ok: false, reason: "not_sold" });
    expect(await act.activateItem(db, "CCCC2222", o)).toEqual({ ok: false, reason: "not_sold" });
    expect(await act.activateItem(db, "ZZZZ9999", o)).toEqual({ ok: false, reason: "not_found" });
  });
  it("activates from shipped and delivered too", async () => {
    await db.upsertItems([mkItem("DDDD2222", "shipped"), mkItem("EEEE2222", "delivered")]);
    const o = await owner(4);
    expect((await act.activateItem(db, "DDDD2222", o)).ok).toBe(true);
    expect((await act.activateItem(db, "EEEE2222", o)).ok).toBe(true);
  });
  it("only the owner can name the pot; names are cleaned and can be cleared", async () => {
    const o = await owner(1);
    expect((await act.renameItem(db, "AAAA2222", o, "  Мій   <b>кущ</b>\n"))?.ownerName).toBe("Мій bкущ/b");
    expect((await db.getItem("AAAA2222"))?.ownerName).toBe("Мій bкущ/b");
    expect(await act.renameItem(db, "AAAA2222", await owner(2), "Чужий")).toBeNull();
    expect((await act.renameItem(db, "AAAA2222", o, "x".repeat(200)))?.ownerName).toHaveLength(60);
    const cleared = await act.renameItem(db, "AAAA2222", o, "   ");
    expect(cleared?.ownerName).toBeUndefined();
    expect((await db.getItem("AAAA2222"))?.ownerName).toBeUndefined();
  });
});

describe("bot", () => {
  const sent: Array<{ chat: number; text: string; markup?: Record<string, unknown> }> = [];
  const ctx = (now?: Date) => ({ db, siteUrl: "https://shop.example", now, send: async (chat: number, text: string, markup?: Record<string, unknown>) => { sent.push({ chat, text, markup }); } });
  const msg = (id: number, text: string, chatType = "private", extra: object = {}) => ({ message: { chat: { id, type: chatType }, from: { id, first_name: "К", ...extra }, text } });

  it("/start greets and offers the Mini App", async () => {
    sent.length = 0;
    await bot.handleUpdate(msg(50, "/start"), ctx());
    expect(sent).toHaveLength(1);
    expect(JSON.stringify(sent[0].markup)).toContain("https://shop.example/app");
    expect((await db.getOwnerByTelegram(50))?.firstName).toBe("К");
  });
  it("answers in English for English users", async () => {
    sent.length = 0;
    await bot.handleUpdate(msg(51, "/start", "private", { language_code: "en" }), ctx());
    expect(sent[0].text).toMatch(/^Hi!/);
  });
  it("ignores groups, bots and non-text", async () => {
    sent.length = 0;
    await bot.handleUpdate(msg(52, "/start", "group"), ctx());
    await bot.handleUpdate(msg(53, "/start", "private", { is_bot: true }), ctx());
    await bot.handleUpdate({ message: { chat: { id: 54, type: "private" }, from: { id: 54 } } }, ctx());
    await bot.handleUpdate({}, ctx());
    expect(sent).toHaveLength(0);
  });
  it("links an admin with a one-time code", async () => {
    sent.length = 0;
    const code = await bot.createAdminLinkCode(db);
    await bot.handleUpdate(msg(60, `/start link_${code}`), ctx());
    expect(sent[0].text).toMatch(/прив'язано/);
    expect(await bot.adminIds(db)).toContain(60);
    await bot.handleUpdate(msg(61, `/start link_${code}`), ctx()); // already used
    expect(sent[1].text).toMatch(/не підійшов/);
    expect(await bot.adminIds(db)).not.toContain(61);
  });
  it("rejects an expired or invented code", async () => {
    sent.length = 0;
    const code = await bot.createAdminLinkCode(db, new Date("2026-01-01T00:00:00Z"));
    await bot.handleUpdate(msg(62, `/start link_${code}`), ctx(new Date("2026-01-01T01:00:00Z")));
    await bot.handleUpdate(msg(63, "/start link_NOPE1234"), ctx());
    expect(sent.every((s) => /не підійшов/.test(s.text))).toBe(true);
    expect(await bot.adminIds(db)).not.toContain(62);
  });
  it("admin commands work only for admins", async () => {
    sent.length = 0;
    await bot.handleUpdate(msg(70, "/today"), ctx());
    expect(sent[0].text).toMatch(/лише для адміністратора/);
    await bot.handleUpdate(msg(60, "/today"), ctx());
    expect(sent[1].text).toMatch(/нових замовлень: \d+/);
    await bot.handleUpdate(msg(60, "/unlink"), ctx());
    expect(await bot.adminIds(db)).not.toContain(60);
  });
  it("the env chat id counts as an admin too", async () => {
    process.env.TELEGRAM_ADMIN_CHAT_ID = "999";
    expect(await bot.adminIds(db)).toContain(999);
    delete process.env.TELEGRAM_ADMIN_CHAT_ID;
  });
});
