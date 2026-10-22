import { NextResponse } from "next/server";
import { isRef } from "@/lib/orders";
import { listWarehouses, novaPoshtaConfigured } from "@/lib/novaposhta";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!novaPoshtaConfigured()) return NextResponse.json({ error: "not_configured" }, { status: 503 });
  const sp = new URL(req.url).searchParams;
  const city = sp.get("city") ?? "";
  if (!isRef(city)) return NextResponse.json({ error: "bad_city" }, { status: 400 });
  try {
    return NextResponse.json({ warehouses: await listWarehouses(city, (sp.get("q") ?? "").slice(0, 40)) }, { headers: { "Cache-Control": "public, max-age=300" } });
  } catch (err) {
    console.error("np warehouses failed", err);
    return NextResponse.json({ error: "upstream" }, { status: 502 });
  }
}
