import { MIME, isPhotoPath, readPrivatePhoto } from "@/lib/media";

export const dynamic = "force-dynamic";

/** Admin view of a private journal photo (the /admin prefix is behind the session check in middleware). */
export async function GET(req: Request) {
  const path = new URL(req.url).searchParams.get("path") ?? "";
  if (!isPhotoPath(path)) return new Response("Not found", { status: 404 });
  const bytes = await readPrivatePhoto(path);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": MIME[path.split(".").pop()!], "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
