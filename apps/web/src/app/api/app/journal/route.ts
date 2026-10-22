import { addEntry } from "@/lib/journal";
import { isValidCode } from "@/lib/pots";
import { authenticate, unauthorized } from "@/lib/mini-app-auth";
import { notifyAdmin } from "@/lib/notify";
import { siteUrl } from "@/lib/payments";
import { LIMITS, clientIp, hit, tooMany } from "@/lib/ratelimit";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";
const MAX_BODY = 60_000_000;

/** New journal entry (multipart: code, kind, note, light, watered, symptom, date, files[]). */
export async function POST(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  const gate = hit(`journal:${a.owner.id}`, LIMITS.journal);
  if (!gate.ok) return tooMany(gate.retryAfterSec);
  if (Number(req.headers.get("content-length") ?? 0) > MAX_BODY) return Response.json({ error: "too_big" }, { status: 413 });
  let fd: FormData;
  try { fd = await req.formData(); } catch { return Response.json({ error: "bad_request" }, { status: 400 }); }
  const g = (k: string) => { const v = fd.get(k); return typeof v === "string" ? v : undefined; };
  const code = (g("code") ?? "").toUpperCase();
  if (!isValidCode(code)) return Response.json({ error: "bad_request" }, { status: 400 });
  const files: Uint8Array[] = [];
  for (const f of fd.getAll("files")) if (f instanceof File && f.size > 0) files.push(new Uint8Array(await f.arrayBuffer()));
  const watered = g("watered");
  const r = await addEntry(store(), a.owner, { code, kind: g("kind") ?? "note", note: g("note"), light: g("light"), symptom: g("symptom"), date: g("date"), watered: watered === "1" ? true : watered === "0" ? false : undefined }, files);
  if (!r.ok) return Response.json({ error: r.reason }, { status: r.reason === "not_yours" ? 404 : 400 });
  if (r.entry.kind === "problem") await notifyAdmin(`Запис «проблема» від ${a.owner.firstName ?? "власника"}: ${siteUrl()}/admin/pots/${code}`);
  return Response.json({ id: r.entry.id });
}
