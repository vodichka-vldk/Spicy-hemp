import { store, usingSupabase } from "@/lib/store";

export const dynamic = "force-dynamic";

/** Liveness and storage check for the host's monitor: 200 when the store answers, 503 otherwise. No secrets in the answer. */
export async function GET() {
  const started = Date.now();
  try {
    await store().listCatalog();
    return Response.json({ ok: true, store: usingSupabase() ? "supabase" : "file", ms: Date.now() - started }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ ok: false, store: usingSupabase() ? "supabase" : "file" }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
