import { NextResponse } from "next/server";
import { novaPoshtaConfigured, searchCities } from "@/lib/novaposhta";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // 200 with enabled:false (not an error status) so the checkout can quietly fall back to plain text fields
  if (!novaPoshtaConfigured()) return NextResponse.json({ enabled: false, cities: [] });
  const q = (new URL(req.url).searchParams.get("q") ?? "").slice(0, 60);
  try {
    return NextResponse.json({ enabled: true, cities: await searchCities(q) }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (err) {
    console.error("np cities failed", err);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
