import { answerReminder } from "@/lib/care";
import { isValidCode } from "@/lib/pots";
import { authenticate, unauthorized } from "@/lib/mini-app-auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  const b = (await req.json().catch(() => null)) as { code?: unknown; task?: unknown; action?: unknown } | null;
  const code = typeof b?.code === "string" ? b.code.toUpperCase() : "";
  if (!isValidCode(code) || !(b?.task === "water" || b?.task === "feed" || b?.task === "photo") || !(b.action === "done" || b.action === "snooze")) return Response.json({ error: "bad_request" }, { status: 400 });
  const db = store();
  const item = await db.getItem(code);
  if (!item || item.ownerId !== a.owner.id) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ changed: await answerReminder(db, code, b.task, b.action) });
}
