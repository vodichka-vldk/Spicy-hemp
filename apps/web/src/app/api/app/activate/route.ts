import { activateItem } from "@/lib/activation";
import { isValidCode } from "@/lib/pots";
import { authenticate, unauthorized } from "@/lib/mini-app-auth";
import { notifyAdmin } from "@/lib/notify";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

/** The owner confirms a pot (from the QR link or by typing the code). */
export async function POST(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  const body = (await req.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === "string" ? body.code.toUpperCase().replace(/[^A-Z0-9]/g, "") : "";
  if (!isValidCode(code)) return Response.json({ error: "bad_code" }, { status: 400 });
  const r = await activateItem(store(), code, a.owner);
  if (!r.ok) return Response.json({ error: r.reason }, { status: r.reason === "not_found" ? 404 : 409 });
  if (!r.already) await notifyAdmin(`🌱 Горщик активовано: ${r.item.product || r.item.kind} (${code})`);
  return Response.json({ code, already: r.already });
}
