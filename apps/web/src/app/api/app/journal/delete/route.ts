import { removeEntry } from "@/lib/journal";
import { authenticate, unauthorized } from "@/lib/mini-app-auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  const body = (await req.json().catch(() => null)) as { id?: unknown } | null;
  if (typeof body?.id !== "string") return Response.json({ error: "bad_request" }, { status: 400 });
  return (await removeEntry(store(), a.owner, body.id)) ? Response.json({ ok: true }) : Response.json({ error: "not_found" }, { status: 404 });
}
