import { renameItem } from "@/lib/activation";
import { isValidCode } from "@/lib/pots";
import { authenticate, unauthorized } from "@/lib/mini-app-auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  const body = (await req.json().catch(() => null)) as { code?: unknown; name?: unknown } | null;
  if (!body || typeof body.code !== "string" || typeof body.name !== "string" || !isValidCode(body.code)) return Response.json({ error: "bad_request" }, { status: 400 });
  const item = await renameItem(store(), body.code, a.owner, body.name);
  if (!item) return Response.json({ error: "not_found" }, { status: 404 });
  return Response.json({ name: item.ownerName ?? null });
}
