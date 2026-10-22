"use server";

import { redirect } from "next/navigation";
import { adminIds, createAdminLinkCode, unlinkAdmin } from "@/lib/bot";
import { siteUrl } from "@/lib/payments";
import { store } from "@/lib/store";
import { sendMessage, tgCall } from "@/lib/telegram";

const back = (q: string) => redirect(`/admin/telegram?${q}`);
const msg = (m: string) => `msg=${encodeURIComponent(m)}`;

export async function newLinkCode() {
  back(`code=${await createAdminLinkCode(store())}`);
}

export async function connectWebhook() {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!process.env.TELEGRAM_BOT_TOKEN || !secret) return back(msg("Задайте TELEGRAM_BOT_TOKEN і TELEGRAM_WEBHOOK_SECRET"));
  const url = `${siteUrl()}/api/telegram/webhook`;
  if (!url.startsWith("https://")) return back(msg("Вебхук працює лише з https-адресою сайту (NEXT_PUBLIC_SITE_URL)"));
  const ok = await tgCall("setWebhook", { url, secret_token: secret, allowed_updates: ["message", "callback_query"], drop_pending_updates: true });
  back(msg(ok ? "Вебхук підключено" : "Telegram не прийняв вебхук, дивіться журнал сервера"));
}

export async function sendTest() {
  const ids = await adminIds(store());
  if (ids.length === 0) return back(msg("Спершу прив'яжіть свій Telegram"));
  const results = await Promise.all(ids.map((id) => sendMessage(id, "✅ Тестове повідомлення від Spicy Hemp")));
  back(msg(results.some(Boolean) ? "Надіслано" : "Не вдалося надіслати, перевірте токен"));
}

export async function removeAdmin(formData: FormData) {
  const id = Number(formData.get("id"));
  if (Number.isSafeInteger(id)) await unlinkAdmin(store(), id);
  back(msg("Відв'язано"));
}
