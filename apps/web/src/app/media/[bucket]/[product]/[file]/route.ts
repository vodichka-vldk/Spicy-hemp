import { MIME, isPhotoPath, readLocalPhoto } from "@/lib/media";

export const dynamic = "force-dynamic";

/** Serves product photos in local development (with Supabase they come straight from Storage). */
export async function GET(_req: Request, ctx: { params: Promise<{ bucket: string; product: string; file: string }> }) {
  const { bucket, product, file } = await ctx.params;
  const p = `${product}/${file}`;
  if (bucket !== "catalog" || !isPhotoPath(p)) return new Response("Not found", { status: 404 });
  const bytes = await readLocalPhoto(p);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), {
    headers: { "Content-Type": MIME[p.split(".").pop()!], "Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff" },
  });
}
