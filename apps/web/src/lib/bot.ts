import { randomInt } from "node:crypto";
import type { Owner, Store } from "./store";
import type { Locale } from "./types";

/** Telegram ids of people who receive the shop's notifications and may use the admin commands. */
const ADMINS_KEY = "telegram_admin_ids";
const LINK_PREFIX = "admin_link:";
const LINK_TTL_MS = 15 * 60 * 1000;
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export async function adminIds(db: Store): Promise<number[]> {
  const stored = (await db.getSetting<number[]>(ADMINS_KEY)) ?? [];
  const env = Number(process.env.TELEGRAM_ADMIN_CHAT_ID);
  return [...new Set([...stored, ...(Number.isSafeInteger(env) && env !== 0 ? [env] : [])])];
}

export async function createAdminLinkCode(db: Store, now = new Date()): Promise<string> {
  let code = "";
  for (let i = 0; i < 8; i++) code += ALPHABET[randomInt(ALPHABET.length)];
  await db.setSetting(LINK_PREFIX + code, { expiresAt: new Date(now.getTime() + LINK_TTL_MS).toISOString() });
  return code;
}

/** One-time: a valid, unexpired code adds the Telegram user to the admins and is burned. */
export async function redeemAdminLinkCode(db: Store, code: string, telegramId: number, now = new Date()): Promise<boolean> {
  const key = LINK_PREFIX + code.toUpperCase();
  const rec = await db.getSetting<{ expiresAt: string }>(key);
  if (!rec) return false;
  await db.setSetting(key, null);
  if (new Date(rec.expiresAt).getTime() < now.getTime()) return false;
  const ids = (await db.getSetting<number[]>(ADMINS_KEY)) ?? [];
  if (!ids.includes(telegramId)) await db.setSetting(ADMINS_KEY, [...ids, telegramId]);
  return true;
}

export async function unlinkAdmin(db: Store, telegramId: number): Promise<void> {
  const ids = (await db.getSetting<number[]>(ADMINS_KEY)) ?? [];
  await db.setSetting(ADMINS_KEY, ids.filter((x) => x !== telegramId));
}

// ---------- update handling ----------

type TgFrom = { id: number; is_bot?: boolean; first_name?: string; username?: string; language_code?: string };
export type TgUpdate = { update_id?: number; message?: { chat: { id: number; type: string }; from?: TgFrom; text?: string } };

export type BotCtx = {
  db: Store;
  send: (chatId: number, text: string, markup?: Record<string, unknown>) => Promise<unknown>;
  siteUrl: string;
  now?: Date;
};

const T = {
  uk: {
    welcome: "Привіт! Я допомагаю доглядати за вашим горщиком із травами від Spicy Hemp.\n\nВідскануйте QR-код на горщику або відкрийте застосунок.",
    open: "🌿 Мої горщики",
    help: "Що я вмію:\n• /start: відкрити застосунок\n• Скануйте QR-код на горщику, щоб додати його до себе, дати ім'я та вести журнал.",
    adminHelp: "Команди адміна:\n• /today: що потребує дії\n• /unlink: відв'язати цей Telegram від сповіщень",
    linked: "✅ Telegram прив'язано. Сюди прийдуть повідомлення про нові замовлення й оплати.",
    linkBad: "Код не підійшов або застарів. Створіть новий в адмінці (Telegram).",
    today: (n: number, pay: number, rev: number) => `Сьогодні:\n• нових замовлень: ${n}\n• чекають оплати: ${pay}\n• відгуків на модерації: ${rev}`,
    unlinked: "Готово, сповіщення вимкнено.",
    notAdmin: "Ця команда лише для адміністратора магазину.",
    unknown: "Не зрозумів. Натисніть /start.",
  },
  en: {
    welcome: "Hi! I help you care for your Spicy Hemp herb pot.\n\nScan the QR code on your pot or open the app.",
    open: "🌿 My pots",
    help: "What I can do:\n• /start: open the app\n• Scan the QR code on your pot to add it, name it and keep a journal.",
    adminHelp: "Admin commands:\n• /today: what needs action\n• /unlink: stop notifications to this Telegram",
    linked: "✅ Telegram linked. New orders and payments will arrive here.",
    linkBad: "The code is wrong or expired. Create a new one in the admin (Telegram).",
    today: (n: number, pay: number, rev: number) => `Today:\n• new orders: ${n}\n• awaiting payment: ${pay}\n• reviews to moderate: ${rev}`,
    unlinked: "Done, notifications are off.",
    notAdmin: "This command is for the shop admin only.",
    unknown: "I did not get that. Tap /start.",
  },
} as const;

const localeOf = (from?: TgFrom): Locale => (from?.language_code?.startsWith("en") ? "en" : "uk");

/** Handles one Telegram update. Only private chats are served; everything else is ignored. */
export async function handleUpdate(update: TgUpdate, ctx: BotCtx): Promise<void> {
  const msg = update.message;
  if (!msg?.from || msg.from.is_bot || msg.chat.type !== "private" || typeof msg.text !== "string") return;
  const { db, send, siteUrl } = ctx;
  const chat = msg.chat.id;
  const locale = localeOf(msg.from);
  const t = T[locale];
  const [cmdRaw, ...args] = msg.text.trim().split(/\s+/);
  const cmd = cmdRaw.split("@")[0].toLowerCase();
  const isAdmin = (await adminIds(db)).includes(msg.from.id);

  if (cmd === "/start" && args[0]?.startsWith("link_")) {
    const ok = await redeemAdminLinkCode(db, args[0].slice(5), msg.from.id, ctx.now);
    await send(chat, ok ? T.uk.linked : T.uk.linkBad);
    return;
  }

  if (cmd === "/start" || cmd === "/help") {
    await db.upsertOwner({ telegramId: msg.from.id, username: msg.from.username, firstName: msg.from.first_name?.slice(0, 64), locale, notify: true });
    const open = { inline_keyboard: [[{ text: t.open, web_app: { url: `${siteUrl}/app` } }]] };
    await send(chat, cmd === "/help" ? t.help + (isAdmin ? `\n\n${t.adminHelp}` : "") : t.welcome, open);
    return;
  }

  if (cmd === "/today" || cmd === "/unlink") {
    if (!isAdmin) { await send(chat, t.notAdmin); return; }
    if (cmd === "/unlink") { await unlinkAdmin(db, msg.from.id); await send(chat, t.unlinked); return; }
    const orders = await db.listOrders();
    const reviews = await db.listReviews({ status: "pending" });
    await send(chat, t.today(orders.filter((o) => o.status === "new" || o.status === "paid" || o.status === "cod_confirmed").length, orders.filter((o) => o.status === "pending_payment").length, reviews.length));
    return;
  }

  await send(chat, t.unknown);
}

export type { Owner };
