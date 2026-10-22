import { timingSafeEqual } from "node:crypto";
import { dispatchDue, planReminders } from "@/lib/care";
import { siteUrl } from "@/lib/payments";
import { store } from "@/lib/store";
import { sendMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

function authorised(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  const got = req.headers.get("authorization") ?? "";
  if (!secret || !got.startsWith("Bearer ")) return false;
  const a = Buffer.from(got.slice(7)), b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Run hourly by a scheduler (Vercel Cron sends `Authorization: Bearer $CRON_SECRET`): plans and sends care reminders and review requests. */
async function run(req: Request) {
  if (!authorised(req)) return new Response("Forbidden", { status: 403 });
  const db = store();
  const planned = await planReminders(db);
  const sent = await dispatchDue(db, (chat, text, markup) => sendMessage(chat, text, markup), siteUrl());
  return Response.json({ planned: planned.length, sent });
}

export const GET = run;
export const POST = run;
