import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { getProduct, mergeCatalog } from "@/lib/shop";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52]);
const JPG = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1]);
const WEBP = Uint8Array.from([...Buffer.from("RIFF"), 1, 0, 0, 0, ...Buffer.from("WEBPVP8 ")]);

describe("media", () => {
  let media: typeof import("@/lib/media");
  beforeAll(async () => {
    process.chdir(mkdtempSync(join(tmpdir(), "sh-media-")));
    delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    media = await import("@/lib/media");
  });

  it("recognises images by content, not by name", () => {
    expect(media.sniffImage(PNG)).toBe("png");
    expect(media.sniffImage(JPG)).toBe("jpg");
    expect(media.sniffImage(WEBP)).toBe("webp");
    expect(media.sniffImage(new TextEncoder().encode("<svg onload=alert(1)></svg>"))).toBeNull();
    expect(media.sniffImage(new TextEncoder().encode("GIF89a....................."))).toBeNull();
  });

  it("accepts only generated storage paths", () => {
    expect(media.isPhotoPath("set-tea/0123456789abcdef.jpg")).toBe(true);
    for (const bad of ["../x/0123456789abcdef.jpg", "set-tea/../0123456789abcdef.jpg", "set-tea/abc.jpg", "set-tea/0123456789abcdef.svg", "/etc/passwd", "a/b/0123456789abcdef.png"]) {
      expect(media.isPhotoPath(bad)).toBe(false);
    }
  });

  it("saves, reads and removes a photo locally", async () => {
    const p = await media.savePhoto("set-tea", PNG, "png");
    expect(media.isPhotoPath(p)).toBe(true);
    expect(media.photoUrl(p)).toBe(`/media/catalog/${p}`);
    expect((await media.readLocalPhoto(p))?.length).toBe(PNG.length);
    await media.removePhoto(p);
    expect(await media.readLocalPhoto(p)).toBeNull();
  });

  it("refuses to read or remove paths outside the uploads", async () => {
    expect(await media.readLocalPhoto("../../store.json")).toBeNull();
    await expect(media.removePhoto("../../store.json")).resolves.toBeUndefined();
  });

  it("builds Supabase public URLs when configured", async () => {
    process.env.SUPABASE_URL = "https://x.supabase.co/"; process.env.SUPABASE_SERVICE_ROLE_KEY = "k";
    expect(media.photoUrl("set-tea/0123456789abcdef.jpg")).toBe("https://x.supabase.co/storage/v1/object/public/catalog/set-tea/0123456789abcdef.jpg");
    delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  });

  it("photos flow into the merged product", () => {
    const m = mergeCatalog([{ slug: "set-tea", kind: "set", status: "published", priceUah: 0, stockMode: "in_stock", photos: ["set-tea/0123456789abcdef.jpg"], updatedAt: "" }]);
    expect(getProduct("set-tea", m)!.photos).toEqual(["set-tea/0123456789abcdef.jpg"]);
  });
});
