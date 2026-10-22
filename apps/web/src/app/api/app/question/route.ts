import { askQuestion, hintFor } from "@/lib/questions";
import { isValidCode } from "@/lib/pots";
import { authenticate, unauthorized } from "@/lib/mini-app-auth";
import { siteUrl } from "@/lib/payments";
import { store } from "@/lib/store";
import { sendMessage } from "@/lib/telegram";

export const dynamic = "force-dynamic";

/** The owner asks Katya a question about a pot, optionally picking a symptom to get first aid right away. */
export async function POST(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  const body = (await req.json().catch(() => null)) as { code?: unknown; text?: unknown; symptom?: unknown } | null;
  if (!body || typeof body.code !== "string" || typeof body.text !== "string" || !isValidCode(body.code)) return Response.json({ error: "bad_request" }, { status: 400 });
  const r = await askQuestion(store(), (c, t, m) => sendMessage(c, t, m), siteUrl(), a.owner, body.code, body.text, typeof body.symptom === "string" ? body.symptom : undefined);
  if (!r.ok) return Response.json({ error: r.reason }, { status: r.reason === "empty" ? 400 : 404 });
  return Response.json({ id: r.question.id, hint: hintFor(r.question.symptom, a.owner.locale) });
}
