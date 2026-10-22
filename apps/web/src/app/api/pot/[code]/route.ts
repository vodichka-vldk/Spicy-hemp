import { NextResponse } from "next/server";
import { cleanCode, isValidCode } from "@/lib/pots";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Public, minimal pot info: never exposes order or buyer data. */
export async function GET(req: Request, ctx: { params: Promise<{ code: string }> }) {
  const { code: raw } = await ctx.params;
  const code = cleanCode(raw);
  if (!isValidCode(code)) return NextResponse.json(null, { status: 404 });
  const pot = await store().getPot(code);
  const species = new URL(req.url).searchParams.get("species");
  if (!pot || (species && pot.species !== species)) return NextResponse.json(null, { status: 404 });
  return NextResponse.json({ code: pot.code, batch: pot.batch, plantedOn: pot.plantedOn }, { headers: { "Cache-Control": "no-store" } });
}
