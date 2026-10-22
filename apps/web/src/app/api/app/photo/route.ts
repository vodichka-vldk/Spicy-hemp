import { ownerMayRead } from "@/lib/journal";
import { MIME, isPhotoPath, readPrivatePhoto } from "@/lib/media";
import { authenticate, unauthorized } from "@/lib/mini-app-auth";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

/** A private journal photo. The Mini App fetches it with its Telegram header and shows it as a blob. */
export async function GET(req: Request) {
  const a = await authenticate(req);
  if (!a) return unauthorized();
  const path = new URL(req.url).searchParams.get("path") ?? "";
  if (!isPhotoPath(path) || !(await ownerMayRead(store(), a.owner, path))) return new Response("Not found", { status: 404 });
  const bytes = await readPrivatePhoto(path);
  if (!bytes) return new Response("Not found", { status: 404 });
  return new Response(new Uint8Array(bytes), { headers: { "Content-Type": MIME[path.split(".").pop()!], "Cache-Control": "private, max-age=3600", "X-Content-Type-Options": "nosniff" } });
}
