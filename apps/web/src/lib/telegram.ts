import { createHmac, timingSafeEqual } from "node:crypto";

export type TgUser = { id: number; firstName?: string; username?: string; locale: "uk" | "en" };
export type MiniAppAuth = { user: TgUser; startParam?: string };

const eq = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

/**
 * Verifies the `initData` string a Telegram Mini App passes (https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app).
 * Returns the user only if the signature matches the bot token and the data is fresh.
 */
export function verifyInitData(initData: string, botToken: string, now = Date.now(), maxAgeSec = 86_400): MiniAppAuth | null {
  if (!initData || !botToken || initData.length > 4096) return null;
  const params = new URLSearchParams(initData);
  const hash = params.get("hash");
  if (!hash || !/^[0-9a-f]{64}$/.test(hash)) return null;
  params.delete("hash");
  const check = [...params.entries()].sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  if (!eq(createHmac("sha256", secret).update(check).digest("hex"), hash)) return null;
  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate) || authDate <= 0 || now / 1000 - authDate > maxAgeSec || authDate - now / 1000 > 300) return null;
  try {
    const u = JSON.parse(params.get("user") ?? "") as { id?: unknown; first_name?: unknown; username?: unknown; language_code?: unknown };
    if (typeof u.id !== "number" || !Number.isSafeInteger(u.id)) return null;
    return {
      user: {
        id: u.id,
        ...(typeof u.first_name === "string" ? { firstName: u.first_name.slice(0, 64) } : {}),
        ...(typeof u.username === "string" ? { username: u.username.slice(0, 64) } : {}),
        locale: typeof u.language_code === "string" && u.language_code.startsWith("en") ? "en" : "uk",
      },
      ...(params.get("start_param") ? { startParam: params.get("start_param")!.slice(0, 64) } : {}),
    };
  } catch {
    return null;
  }
}

/** Builds a signed initData string. Used by tests and the e2e run, never by the app. */
export function signInitData(fields: Record<string, string>, botToken: string): string {
  const check = Object.entries(fields).sort(([a], [b]) => (a < b ? -1 : 1)).map(([k, v]) => `${k}=${v}`).join("\n");
  const secret = createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = createHmac("sha256", secret).update(check).digest("hex");
  return new URLSearchParams({ ...fields, hash }).toString();
}

/** The webhook secret Telegram echoes back in `X-Telegram-Bot-Api-Secret-Token`. */
export function webhookAuthorised(header: string | null, secret = process.env.TELEGRAM_WEBHOOK_SECRET): boolean {
  if (!secret || !header) return false;
  return eq(header, secret);
}

type Markup = Record<string, unknown>;

export async function tgCall<T = unknown>(method: string, body: Record<string, unknown>, token = process.env.TELEGRAM_BOT_TOKEN): Promise<T | null> {
  if (!token) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
    });
    const json = (await res.json()) as { ok: boolean; result?: T; description?: string };
    if (!json.ok) { console.error(`telegram ${method} failed: ${json.description}`); return null; }
    return json.result ?? (true as T);
  } catch (err) {
    console.error(`telegram ${method} error`, err);
    return null;
  }
}

export const sendMessage = (chatId: number | string, text: string, replyMarkup?: Markup) =>
  tgCall("sendMessage", { chat_id: chatId, text, disable_web_page_preview: true, ...(replyMarkup ? { reply_markup: replyMarkup } : {}) });

export const answerCallback = (id: string, text: string) => tgCall("answerCallbackQuery", { callback_query_id: id, text: text.slice(0, 190) });
/** Replaces the text and removes the buttons. */
export const editMessage = (chatId: number, messageId: number, text: string) =>
  tgCall("editMessageText", { chat_id: chatId, message_id: messageId, text, reply_markup: { inline_keyboard: [] } });
