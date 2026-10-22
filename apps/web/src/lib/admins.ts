import type { Store } from "./store";

/** Telegram ids of people who receive the shop's notifications and may use the admin commands. */
export const ADMINS_KEY = "telegram_admin_ids";

export async function adminIds(db: Store): Promise<number[]> {
  const stored = (await db.getSetting<number[]>(ADMINS_KEY)) ?? [];
  const env = Number(process.env.TELEGRAM_ADMIN_CHAT_ID);
  return [...new Set([...stored, ...(Number.isSafeInteger(env) && env !== 0 ? [env] : [])])];
}
