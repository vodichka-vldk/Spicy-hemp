import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildEntry, entriesFromCsv, parseCsv, productsToCsv, slugify } from "@/lib/catalog-admin";
import { cardSections } from "@/lib/card";
import { computeTotals, getProduct, mergeCatalog, products, publicProducts } from "@/lib/shop";
import { buildOrder, validateOrder } from "@/lib/orders";
import type { CatalogEntry } from "@/lib/store/types";

const entry = (over: Partial<CatalogEntry> & { slug: string }): CatalogEntry => ({
  kind: "set", status: "published", priceUah: 0, stockMode: "in_stock", updatedAt: "2026-10-22T00:00:00.000Z", ...over,
});
const builtIn = (slug: string) => products.some((p) => p.slug === slug);

describe("mergeCatalog", () => {
  it("keeps built-in products when there are no entries", () => {
    const m = mergeCatalog([]);
    expect(m.map((p) => p.slug)).toEqual(products.map((p) => p.slug));
    expect(publicProducts(m)).toHaveLength(products.length);
  });

  it("applies price, status and texts to a built-in product", () => {
    const m = mergeCatalog([entry({ slug: "set-tea", priceUah: 999, status: "draft", title: { uk: "Чай від Каті" }, content: { watering: { uk: "Лийте щодня" } } })]);
    const p = getProduct("set-tea", m)!;
    expect(p.priceUah).toBe(999);
    expect(p.status).toBe("draft");
    expect(p.titleKey).toEqual({ uk: "Чай від Каті", en: "Чай від Каті" }); // missing language falls back to the other
    expect(p.herbs).toEqual(products.find((x) => x.slug === "set-tea")!.herbs);
    expect(publicProducts(m).some((x) => x.slug === "set-tea")).toBe(false);
  });

  it("priceUah 0 keeps the automatic price", () => {
    const auto = getProduct("set-tea")!.priceUah;
    expect(getProduct("set-tea", mergeCatalog([entry({ slug: "set-tea" })]))!.priceUah).toBe(auto);
  });

  it("adds a new basket with an automatic price and ignores unknown herbs", () => {
    const m = mergeCatalog([entry({ slug: "set-morning", herbs: ["mint", "basil", "no-such-herb"], title: { uk: "Ранковий" } })]);
    const p = getProduct("set-morning", m)!;
    expect(p.kind).toBe("set");
    expect(p.herbs).toEqual(["mint", "basil"]);
    expect(p.priceUah).toBeGreaterThan(0);
  });

  it("skips a new basket without valid herbs", () => {
    expect(getProduct("set-empty", mergeCatalog([entry({ slug: "set-empty", herbs: ["nope"] })]))).toBeUndefined();
  });

  it("orders use the merged prices and refuse unpublished products", () => {
    const m = mergeCatalog([entry({ slug: "set-tea", priceUah: 700 }), entry({ slug: "set-asian", status: "draft" })]);
    const pub = publicProducts(m);
    expect(computeTotals([{ slug: "set-tea", glaze: "sage", qty: 2 }], "UAH", "np", pub).subtotal).toBe(140000);
    const base = {
      locale: "uk", customer: { name: "Олена", email: "o@example.com", phone: "+380501234567" },
      shipping: { kind: "np", country: "UA", city: "Київ", address: "Відділення 1" }, payment: "cod", agree: true,
    };
    const ok = validateOrder({ ...base, lines: [{ slug: "set-tea", glaze: "sage", qty: 1 }] }, pub);
    expect(ok.ok).toBe(true);
    if (ok.ok) expect(buildOrder(ok.value, new Date(), pub).items[0].unitMinor).toBe(70000);
    expect(validateOrder({ ...base, lines: [{ slug: "set-asian", glaze: "sage", qty: 1 }] }, pub).ok).toBe(false);
  });
});

describe("care texts written in the admin", () => {
  it("win over the built-in text, empty sections fall back", () => {
    const m = mergeCatalog([entry({ slug: "set-tea", content: { watering: { uk: "Лийте щодня", en: "" } } })]);
    const p = getProduct("set-tea", m)!;
    const uk = cardSections("set-tea", "uk", {}, p);
    expect(uk.find((s) => s.key === "watering")!.body).toBe("Лийте щодня");
    expect(uk.find((s) => s.key === "placement")!.body).toMatch(/світло/);
    const en = cardSections("set-tea", "en", {}, p);
    expect(en.find((s) => s.key === "watering")!.body).toMatch(/Water when/); // English not written: built-in text stays
  });

  it("a new basket gets sections from its own texts", () => {
    const m = mergeCatalog([entry({ slug: "set-new", herbs: ["mint"], content: { description: { uk: "Мій кошик" } } })]);
    const s = cardSections("set-new", "uk", {}, getProduct("set-new", m));
    expect(s.find((x) => x.key === "description")!.body).toBe("Мій кошик");
  });
});

describe("buildEntry", () => {
  const raw = { slug: "set-morning", kind: "set", status: "published", priceUah: "520", herbs: ["mint", "mint", "basil"], title: { uk: " Ранковий ", en: "" } };
  it("normalises and de-duplicates", () => {
    const r = buildEntry(raw, builtIn);
    expect(r.ok && r.entry).toMatchObject({ slug: "set-morning", kind: "set", priceUah: 520, herbs: ["mint", "basil"], title: { uk: "Ранковий" }, stockMode: "in_stock" });
  });
  it("rejects bad slugs, unknown herbs, empty baskets and bad prices", () => {
    expect(buildEntry({ ...raw, slug: "Bad Slug" }, builtIn).ok).toBe(false);
    expect(buildEntry({ ...raw, herbs: ["zzz"] }, builtIn).ok).toBe(false);
    expect(buildEntry({ ...raw, herbs: [] }, builtIn).ok).toBe(false);
    expect(buildEntry({ ...raw, priceUah: "-5" }, builtIn).ok).toBe(false);
    expect(buildEntry({ ...raw, priceUah: "abc" }, builtIn).ok).toBe(false);
  });
  it("allows a built-in basket without a changed composition", () => {
    expect(buildEntry({ slug: "set-tea", kind: "set", status: "published", herbs: [] }, builtIn).ok).toBe(true);
  });
  it("unknown status becomes a draft", () => {
    const r = buildEntry({ ...raw, status: "weird" }, builtIn);
    expect(r.ok && r.entry.status).toBe("draft");
  });
});

describe("slugify", () => {
  it("transliterates Ukrainian titles", () => {
    expect(slugify("Ранковий кошик")).toBe("rankovyi-koshyk");
    expect(slugify("Італійський «мікс»!")).toBe("italiiskyi-miks");
    expect(slugify("")).toBe("");
  });
});

describe("CSV", () => {
  it("parses quotes, commas and line breaks in cells", () => {
    expect(parseCsv('a,b\r\n"x, y","say ""hi""\nbye"\r\n')).toEqual([["a", "b"], ["x, y", 'say "hi"\nbye']]);
  });

  it("round-trips the whole catalogue", () => {
    const merged = mergeCatalog([entry({ slug: "set-tea", priceUah: 640, content: { kitchen: { uk: "Чай, \"крутий\"\nдруга лінія", en: "Tea" } } })]);
    const csv = productsToCsv(merged);
    expect(csv.startsWith("﻿")).toBe(true);
    const { entries, errors } = entriesFromCsv(csv, builtIn);
    expect(errors).toEqual([]);
    expect(entries).toHaveLength(merged.length);
    const tea = entries.find((e) => e.slug === "set-tea")!;
    expect(tea.priceUah).toBe(640);
    expect(tea.content?.kitchen?.uk).toBe("Чай, \"крутий\"\nдруга лінія");
    expect(tea.herbs).toEqual(getProduct("set-tea")!.herbs);
  });

  it("reports bad rows and keeps the good ones", () => {
    const csv = "slug,kind,status,price_uah,herbs\nset-ok,set,draft,500,mint;basil\nBAD SLUG,set,draft,1,mint\nset-x,set,draft,1,nonsense\n";
    const { entries, errors } = entriesFromCsv(csv, builtIn);
    expect(entries.map((e) => e.slug)).toEqual(["set-ok"]);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/Рядок 3/);
  });

  it("refuses a file without a slug column", () => {
    expect(entriesFromCsv("name\nx", builtIn).errors).toHaveLength(1);
  });
});

describe("file store catalogue", () => {
  let db: typeof import("@/lib/store/file").fileStore;
  beforeAll(async () => {
    process.chdir(mkdtempSync(join(tmpdir(), "sh-cat-")));
    db = (await import("@/lib/store/file")).fileStore;
  });
  it("upserts, lists and deletes entries", async () => {
    expect(await db.listCatalog()).toEqual([]);
    await db.upsertCatalogEntry(entry({ slug: "set-a", herbs: ["mint"], priceUah: 100 }));
    await db.upsertCatalogEntry(entry({ slug: "set-a", herbs: ["mint"], priceUah: 200 }));
    expect((await db.listCatalog()).map((e) => [e.slug, e.priceUah])).toEqual([["set-a", 200]]);
    await db.deleteCatalogEntry("set-a");
    expect(await db.listCatalog()).toEqual([]);
  });
});

describe("Supabase row mapping", () => {
  it("maps a products row with species and content to a catalogue entry", async () => {
    const { catalogFromRow } = await import("@/lib/store/supabase");
    const e = catalogFromRow({
      slug: "set-a", kind: "basket", status: "published", price_uah: 500, stock_mode: "made_to_order", updated_at: "2026-10-22T00:00:00Z",
      data: { title: { uk: "А" } }, product_species: [{ species: "mint" }, { species: "basil" }],
      product_content: [{ locale: "uk", section: "watering", body: "x" }, { locale: "en", section: "watering", body: "y" }],
    });
    expect(e).toMatchObject({ slug: "set-a", kind: "set", priceUah: 500, stockMode: "made_to_order", herbs: ["basil", "mint"], title: { uk: "А" }, content: { watering: { uk: "x", en: "y" } } });
  });
});
