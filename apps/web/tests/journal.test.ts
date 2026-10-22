import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { codeFromScan } from "@/lib/pots";

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d, 0x49, 0x48, 0x44, 0x52]);
const NOW = new Date("2026-08-10T10:00:00Z");

type Db = typeof import("@/lib/store/file").fileStore;
let db: Db;
let j: typeof import("@/lib/journal");
let media: typeof import("@/lib/media");
let owner: import("@/lib/store").Owner, other: import("@/lib/store").Owner;

beforeAll(async () => {
  process.chdir(mkdtempSync(join(tmpdir(), "sh-journal-")));
  delete process.env.SUPABASE_URL; delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  db = (await import("@/lib/store/file")).fileStore;
  j = await import("@/lib/journal");
  media = await import("@/lib/media");
  owner = await db.upsertOwner({ telegramId: 1, locale: "uk", notify: true });
  other = await db.upsertOwner({ telegramId: 2, locale: "uk", notify: true });
  await db.upsertItems([{ code: "JRNL2222", kind: "basket", product: "set-tea", species: ["mint"], batch: "T", readyOn: "2026-06-01", status: "activated", ownerId: owner.id, activatedAt: "2026-07-01T00:00:00Z" }]);
});

describe("journal", () => {
  it("adds a note with a private photo and lists it newest first", async () => {
    const r = await j.addEntry(db, owner, { code: "JRNL2222", kind: "problem", note: "  Листя жовтіє  ", symptom: "overwater", light: "bright" }, [PNG], NOW);
    expect(r.ok && r.entry).toMatchObject({ kind: "problem", note: "Листя жовтіє", symptom: "overwater", light: "bright", date: "2026-08-10" });
    if (!r.ok) return;
    expect(r.entry.photos).toHaveLength(1);
    expect(r.entry.photos[0]).toMatch(/^jrnl2222\/[a-f0-9]{16}\.png$/);
    expect(await media.readPrivatePhoto(r.entry.photos[0])).not.toBeNull();
    expect(await media.readLocalPhoto(r.entry.photos[0], "catalog")).toBeNull(); // not in the public bucket
    await j.addEntry(db, owner, { code: "JRNL2222", kind: "care", watered: true, date: "2026-08-11" }, [], new Date("2026-08-12T00:00:00Z"));
    expect((await db.listJournal({ itemCode: "JRNL2222" })).map((e) => e.date)).toEqual(["2026-08-11", "2026-08-10"]);
  });

  it("refuses other people's pots, bad kinds, empty entries and bad photos", async () => {
    expect(await j.addEntry(db, other, { code: "JRNL2222", kind: "note", note: "x" }, [])).toEqual({ ok: false, reason: "not_yours" });
    expect(await j.addEntry(db, owner, { code: "NOPE2222", kind: "note", note: "x" }, [])).toEqual({ ok: false, reason: "not_yours" });
    expect(await j.addEntry(db, owner, { code: "JRNL2222", kind: "weird", note: "x" }, [])).toEqual({ ok: false, reason: "bad_kind" });
    expect(await j.addEntry(db, owner, { code: "JRNL2222", kind: "note", note: "   " }, [])).toEqual({ ok: false, reason: "empty" });
    expect(await j.addEntry(db, owner, { code: "JRNL2222", kind: "note", note: "x" }, [new TextEncoder().encode("<svg onload=alert(1)>")])).toEqual({ ok: false, reason: "bad_photo" });
    expect(await j.addEntry(db, owner, { code: "JRNL2222", kind: "note", note: "x" }, Array(7).fill(PNG))).toEqual({ ok: false, reason: "too_many_photos" });
  });

  it("ignores future dates and unknown symptoms or light", async () => {
    const r = await j.addEntry(db, owner, { code: "JRNL2222", kind: "note", note: "x", date: "2030-01-01", symptom: "nonsense", light: "blinding" }, [], NOW);
    expect(r.ok && r.entry.date).toBe("2026-08-10");
    expect(r.ok && r.entry.symptom).toBeUndefined();
    expect(r.ok && r.entry.light).toBeUndefined();
  });

  it("only the owner may read the photos", async () => {
    const entry = (await db.listJournal({ itemCode: "JRNL2222" })).find((e) => e.photos.length)!;
    expect(await j.ownerMayRead(db, owner, entry.photos[0])).toBe(true);
    expect(await j.ownerMayRead(db, other, entry.photos[0])).toBe(false);
    expect(await j.ownerMayRead(db, owner, "jrnl2222/0000000000000000.png")).toBe(false);
  });

  it("deleting an entry removes its photos; others cannot delete it", async () => {
    const entry = (await db.listJournal({ itemCode: "JRNL2222" })).find((e) => e.photos.length)!;
    expect(await j.removeEntry(db, other, entry.id)).toBe(false);
    expect(await j.removeEntry(db, owner, entry.id)).toBe(true);
    expect(await media.readPrivatePhoto(entry.photos[0])).toBeNull();
    expect((await db.listJournal({ itemCode: "JRNL2222" })).some((e) => e.id === entry.id)).toBe(false);
  });
});

describe("scan", () => {
  it("takes the code from a QR link or typed text", () => {
    expect(codeFromScan("https://shop.example/p/7ab6-4xt6")).toBe("7AB64XT6");
    expect(codeFromScan("https://shop.example/p/7AB64XT6?x=1")).toBe("7AB64XT6");
    expect(codeFromScan(" 7ab6 4xt6 ")).toBe("7AB64XT6");
    expect(codeFromScan("")).toBe("");
  });
});
