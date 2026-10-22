import { store, type Owner } from "./store";
import { verifyInitData, type MiniAppAuth } from "./telegram";

/** Reads `Authorization: tma <initData>`, verifies it against the bot token and returns the owner (created on first visit). */
export async function authenticate(req: Request): Promise<{ owner: Owner; auth: MiniAppAuth } | null> {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const header = req.headers.get("authorization") ?? "";
  if (!token || !header.startsWith("tma ")) return null;
  const auth = verifyInitData(header.slice(4), token);
  if (!auth) return null;
  const db = store();
  const known = await db.getOwnerByTelegram(auth.user.id);
  const owner = known ?? (await db.upsertOwner({ telegramId: auth.user.id, username: auth.user.username, firstName: auth.user.firstName, locale: auth.user.locale, notify: true }));
  return { owner, auth };
}

export const unauthorized = () => Response.json({ error: "unauthorized" }, { status: 401, headers: { "Cache-Control": "no-store" } });
