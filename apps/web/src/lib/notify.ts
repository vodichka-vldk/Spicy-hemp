import { adminIds } from "./bot";
import { sendMessage } from "./telegram";
import { store } from "./store";

/** Best-effort Telegram notifications to the shop's admins. Never throws: a failed notification must not break an order. */
export const adminChatConfigured = () => Boolean(process.env.TELEGRAM_BOT_TOKEN);

export async function notifyAdmin(text: string): Promise<boolean> {
  if (!process.env.TELEGRAM_BOT_TOKEN) return false;
  try {
    const ids = await adminIds(store());
    const results = await Promise.all(ids.map((id) => sendMessage(id, text)));
    return results.some(Boolean);
  } catch (err) {
    console.error("telegram notify failed", err);
    return false;
  }
}
