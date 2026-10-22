import { NextResponse, type NextRequest } from "next/server";
import { parseUa, visitorHash } from "@/lib/analytics";
import { detectLocale, isLocale } from "@/lib/i18n";
import { cleanCode, isValidCode } from "@/lib/pots";
import { store } from "@/lib/store";
import { randomUUID } from "node:crypto";

export const dynamic = "force-dynamic";

/** QR entry point: logs the scan, then sends the visitor to the plant passport in their language. */
export async function GET(req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code: raw } = await ctx.params;
  if (raw === "lookup") {
    // Manual code entry form on the "pot not found" page.
    const typed = cleanCode(req.nextUrl.searchParams.get("code") ?? "");
    const to = req.nextUrl.clone();
    to.search = "";
    to.pathname = `/p/${typed || "invalid"}`;
    return NextResponse.redirect(to, 302);
  }
  const code = cleanCode(raw);
  const cookie = req.cookies.get("lang")?.value;
  const locale = isLocale(cookie) ? cookie : detectLocale(req.headers.get("accept-language"));
  const base = req.nextUrl.clone();
  base.search = "";

  const redirect = (path: string) => {
    base.pathname = path;
    const res = NextResponse.redirect(base, 302);
    res.headers.set("Cache-Control", "no-store");
    return res;
  };

  if (!isValidCode(code)) return redirect(`/${locale}/pot/unknown`);

  const ua = req.headers.get("user-agent") ?? "";
  const ip = (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "0.0.0.0";
  const visitor = visitorHash(ip, ua);
  const db = store();
  const item = await db.getItem(code);
  const pot = item ? null : await db.getPot(code);
  const known = item ?? pot;

  try {
    const first = known ? !(await db.hasScanned(code, visitor)) : true;
    await db.logScan({
      id: randomUUID(),
      ts: new Date().toISOString(),
      potCode: code,
      species: item ? item.product : (pot?.species ?? null),
      country: req.headers.get("x-vercel-ip-country") ?? req.headers.get("cf-ipcountry"),
      ...parseUa(ua),
      referrer: req.headers.get("referer"),
      visitor,
      firstScan: first,
      valid: Boolean(known),
    });
  } catch (err) {
    console.error("scan log failed", err); // never block the visitor because analytics failed
  }

  if (!known) return redirect(`/${locale}/pot/unknown`);
  if (item) return redirect(`/${locale}/garden/${code}`);
  if (!pot) return redirect(`/${locale}/pot/unknown`);
  base.searchParams.set("pot", code);
  base.pathname = `/${locale}/plants/${pot.species}`;
  const res = NextResponse.redirect(base, 302);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
