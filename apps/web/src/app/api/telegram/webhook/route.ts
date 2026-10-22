import { NextResponse } from "next/server";
import { handleUpdate, type TgUpdate } from "@/lib/bot";
import { siteUrl } from "@/lib/payments";
import { store } from "@/lib/store";
import { sendMessage, webhookAuthorised } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/** Telegram calls this for every message to the bot. Requests without the shared secret are rejected. */
export async function POST(req: Request) {
  if (!webhookAuthorised(req.headers.get("x-telegram-bot-api-secret-token"))) return new NextResponse("Forbidden", { status: 403 });
  let update: TgUpdate;
  try {
    update = (await req.json()) as TgUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }
  try {
    await handleUpdate(update, { db: store(), send: (chat, text, markup) => sendMessage(chat, text, markup), siteUrl: siteUrl() });
  } catch (err) {
    console.error("bot update failed", err); // answer 200 anyway so Telegram does not retry the same update forever
  }
  return NextResponse.json({ ok: true });
}
