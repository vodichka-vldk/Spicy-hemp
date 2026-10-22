import { authenticate, unauthorized } from "@/lib/mini-app-auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

const validZone = (z: string) => { try { new Intl.DateTimeFormat("en", { timeZone: z }); return true; } catch { return false; } };
const validTime = (t: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(t);

/** Owner settings: notifications on/off, quiet hours, time zone, language. */
export async function POST(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  const b = (await req.json().catch(() => null)) as { notify?: unknown; timezone?: unknown; quietFrom?: unknown; quietUntil?: unknown; locale?: unknown } | null;
  if (!b) return Response.json({ error: "bad_request" }, { status: 400 });
  const o = a.owner;
  if ((b.timezone !== undefined && (typeof b.timezone !== "string" || !validZone(b.timezone))) || (b.quietFrom !== undefined && (typeof b.quietFrom !== "string" || !validTime(b.quietFrom))) || (b.quietUntil !== undefined && (typeof b.quietUntil !== "string" || !validTime(b.quietUntil)))) return Response.json({ error: "bad_request" }, { status: 400 });
  const next = await store().upsertOwner({
    telegramId: o.telegramId, username: o.username, firstName: o.firstName,
    locale: b.locale === "en" || b.locale === "uk" ? b.locale : o.locale,
    notify: typeof b.notify === "boolean" ? b.notify : o.notify,
    timezone: (b.timezone as string | undefined) ?? o.timezone, quietFrom: (b.quietFrom as string | undefined) ?? o.quietFrom, quietUntil: (b.quietUntil as string | undefined) ?? o.quietUntil,
  });
  return Response.json({ notify: next.notify, timezone: next.timezone ?? "Europe/Kyiv", quietFrom: next.quietFrom ?? "21:00", quietUntil: next.quietUntil ?? "08:00", locale: next.locale });
}
