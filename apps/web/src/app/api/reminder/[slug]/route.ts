import { NextResponse } from "next/server";
import { getHerb } from "@/lib/content";
import { isLocale, pick } from "@/lib/i18n";
import { wateringIcs } from "@/lib/ics";

export async function GET(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const { slug } = await ctx.params;
  const herb = getHerb(slug);
  if (!herb) return new NextResponse("Not found", { status: 404 });
  const url = new URL(req.url);
  const lang = url.searchParams.get("lang");
  const locale = isLocale(lang) ? lang : "uk";
  const title = locale === "uk" ? `Полив: ${herb.names.uk}` : `Water: ${herb.names.en}`;
  const ics = wateringIcs({
    title,
    description: pick(herb.waterNote, locale),
    everyDays: herb.waterEveryDays,
    uid: `water-${slug}-${url.searchParams.get("pot") ?? "generic"}@spicy-hemp`,
  });
  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="water-${slug}.ics"`,
    },
  });
}
