import { isValidCode } from "@/lib/pots";
import { authenticate, unauthorized } from "@/lib/mini-app-auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  const body = (await req.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.toUpperCase() : "";
  if (!isValidCode(code)) return Response.json({ error: "bad_request" }, { status: 400 });
  const db = store();
  const item = await db.getItem(code);
  if (!item || item.ownerId !== a.owner.id) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ entries: await db.listJournal({ itemCode: code }) }, { headers: { "Cache-Control": "no-store" } });
}
