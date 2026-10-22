import { randomInt, randomUUID } from "node:crypto";
import { ADMINS_KEY, adminIds } from "./admins";
import { answerReminder, potLabel } from "./care";
import { answerQuestion, questionForReply } from "./questions";
import type { Owner, Review, Store } from "./store";
import type { Locale } from "./types";

const LINK_PREFIX = "admin_link:";
const LINK_TTL_MS = 15 * 60 * 1000;
const ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";

export { adminIds };

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
export type TgUpdate = {
  update_id?: number;
  message?: { message_id?: number; chat: { id: number; type: string }; from?: TgFrom; text?: string; reply_to_message?: { message_id: number } };
  callback_query?: { id: string; from: TgFrom; data?: string; message?: { message_id: number; chat: { id: number }; text?: string } };
};

export type BotCtx = {
  db: Store;
  send: (chatId: number, text: string, markup?: Record<string, unknown>) => Promise<unknown>;
  siteUrl: string;
  now?: Date;
  answer?: (callbackId: string, text: string) => Promise<unknown>;
  edit?: (chatId: number, messageId: number, text: string) => Promise<unknown>;
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
  if (update.callback_query) return handleCallback(update.callback_query, ctx);
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

  if (!msg.text.startsWith("/")) {
    // Katya answers a question by replying to its card
    if (isAdmin && msg.reply_to_message) {
      const q = await questionForReply(db, chat, msg.reply_to_message.message_id);
      if (q) {
        const r = await answerQuestion(db, send, q.id, msg.text, ctx.now);
        await send(chat, r.ok ? "✅ Відповідь надіслано власнику" : "Не вдалося зберегти відповідь");
        return;
      }
    }
    // free text after a rating: it becomes the review text
    const awaiting = await db.getSetting<string>(AWAIT + msg.from.id);
    if (awaiting) {
      const review = (await db.listReviews()).find((r) => r.id === awaiting);
      await db.setSetting(AWAIT + msg.from.id, null);
      if (review) {
        await db.upsertReview({ ...review, body: msg.text.replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 1000) });
        await send(chat, locale === "en" ? "Thank you! Your review is with Katya." : "Дякуємо! Відгук передано Каті.");
        await notifyAdmins(ctx, `⭐ Новий відгук (${review.rating}/5) чекає модерації: ${siteUrl}/admin/reviews`);
        return;
      }
    }
  }

  await send(chat, t.unknown);
}

const AWAIT = "awaiting_review:";

async function notifyAdmins(ctx: BotCtx, text: string) {
  for (const id of await adminIds(ctx.db)) await ctx.send(id, text);
}

const R = {
  uk: { thanks: "Дякуємо за оцінку!", consent: "Чи можна опублікувати ваш відгук і оцінку на сайті? Ім'я буде лише те, що в Telegram.", yes: "Так, можна", no: "Лише для Каті", ask: "Якщо хочете, напишіть кілька слів про горщик одним повідомленням.", done: "Готово 👍", snoozed: "Нагадаю завтра ⏰", gone: "Це нагадування вже не актуальне" },
  en: { thanks: "Thanks for rating!", consent: "May we publish your review and rating on the website? Only your Telegram first name is shown.", yes: "Yes, publish", no: "Only for Katya", ask: "If you like, write a few words about your pot in one message.", done: "Done 👍", snoozed: "I will remind you tomorrow ⏰", gone: "This reminder is no longer relevant" },
} as const;

/** Buttons under reminders (done / snooze), the star rating and the consent question. */
async function handleCallback(cb: NonNullable<TgUpdate["callback_query"]>, ctx: BotCtx): Promise<void> {
  const { db, send } = ctx;
  const ack = (text: string) => ctx.answer?.(cb.id, text);
  const owner = await db.getOwnerByTelegram(cb.from.id);
  const [kind, ref, arg] = (cb.data ?? "").split(":");
  if (!owner || !ref) { await ack(""); return; }
  const r = R[owner.locale];
  const chat = cb.message?.chat.id ?? cb.from.id;

  if (kind === "rc") {
    const review = (await db.listReviews()).find((x) => x.id === ref);
    if (!review || review.itemCode === undefined) { await ack(r.gone); return; }
    const item = await db.getItem(review.itemCode);
    if (item?.ownerId !== owner.id) { await ack(r.gone); return; }
    await db.upsertReview({ ...review, consentPublic: arg === "1" });
    await ack(r.done);
    if (cb.message) await ctx.edit?.(chat, cb.message.message_id, `${cb.message.text ?? ""}\n\n${arg === "1" ? r.yes : r.no} ✓`);
    await db.setSetting(AWAIT + cb.from.id, review.id);
    await send(chat, r.ask);
    return;
  }

  const item = await db.getItem(ref);
  if (!item || item.ownerId !== owner.id) { await ack(r.gone); return; }

  if (kind === "rv") {
    const rating = Number(arg);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) { await ack(""); return; }
    const existing = (await db.listReviews()).find((x) => x.itemCode === item.code);
    const review: Review = existing ? { ...existing, rating: rating as Review["rating"] } : {
      id: randomUUID(), product: item.product || item.species[0], itemCode: item.code, rating: rating as Review["rating"], locale: owner.locale,
      photos: [], consentPublic: false, status: "pending", createdAt: (ctx.now ?? new Date()).toISOString(), ...(owner.firstName ? { authorName: owner.firstName.slice(0, 40) } : {}),
    };
    await db.upsertReview(review);
    await answerReminder(db, item.code, "review", "done", ctx.now);
    await ack(r.thanks);
    if (cb.message) await ctx.edit?.(chat, cb.message.message_id, `${potLabel(item, owner.locale)}: ${"★".repeat(rating)}`);
    await send(chat, r.consent, { inline_keyboard: [[{ text: r.yes, callback_data: `rc:${review.id}:1` }, { text: r.no, callback_data: `rc:${review.id}:0` }]] });
    return;
  }

  if ((kind === "d" || kind === "s") && (arg === "water" || arg === "feed" || arg === "photo")) {
    const n = await answerReminder(db, item.code, arg, kind === "d" ? "done" : "snooze", ctx.now);
    await ack(n === 0 ? r.gone : kind === "d" ? r.done : r.snoozed);
    if (cb.message) await ctx.edit?.(chat, cb.message.message_id, `${cb.message.text ?? ""}\n\n${kind === "d" ? "✅" : "⏰"}`);
    return;
  }
  await ack("");
}

export type { Owner };
