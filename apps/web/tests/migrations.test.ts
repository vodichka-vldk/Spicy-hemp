import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";
import { ITEM_TRANSITIONS, ORDER_TRANSITIONS } from "../src/lib/domain";

const dir = resolve(__dirname, "../../../supabase/migrations");
const sql = (f: string) => readFileSync(resolve(dir, f), "utf8");

// Minimal stand-ins for what Supabase provides (roles, auth schema, default grants).
const SUPABASE_STUBS = `
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
`;
const GRANTS = `
  grant usage on schema public to anon, authenticated;
  grant select, insert, update, delete on all tables in schema public to anon, authenticated;
`;

const without = (s: string, re: RegExp) => s.replace(re, "");

let db: PGlite;

beforeAll(async () => {
  db = new PGlite();
  await db.exec(SUPABASE_STUBS);
  // pgcrypto is only needed for gen_random_uuid(), which is built in since PG13
  await db.exec(without(sql("0001_init.sql"), /create extension if not exists pgcrypto;/));
  // legacy data that 0002 has to carry over
  await db.exec(`
    insert into batches (code) values ('B-1');
    insert into species (slug, family, data) select 'basil','lamiaceae','{}' where false;
    insert into families (slug, data) values ('lamiaceae','{}');
    insert into species (slug, family, data) values ('basil','lamiaceae','{}'), ('mint','lamiaceae','{}');
    insert into orders (id, status, data) values ('SH-1','pending_payment','{}'), ('SH-2','paid','{}');
    insert into pots (code, species, batch, planted_on, status, order_id) values
      ('AAAA2222','basil','B-1','2026-08-20','planted',null),
      ('BBBB3333','mint','B-1','2026-08-20','sold','SH-2');
  `);
  await db.exec(sql("0002_catalog_items_journal.sql"));
  await db.exec(GRANTS);
});

const rows = async <T = Record<string, unknown>>(q: string) => (await db.query<T>(q)).rows;

describe("migration 0002", () => {
  it("backfills legacy pots as single items with their species", async () => {
    const items = await rows<{ code: string; kind: string; status: string }>("select code, kind, status from items order by code");
    expect(items).toEqual([
      { code: "AAAA2222", kind: "single", status: "ready_for_sale" },
      { code: "BBBB3333", kind: "single", status: "sold" },
    ]);
    const sp = await rows("select item, species from item_species order by item");
    expect(sp).toEqual([{ item: "AAAA2222", species: "basil" }, { item: "BBBB3333", species: "mint" }]);
  });

  it("assigns display numbers for the САД · 001 label", async () => {
    const r = await rows<{ display_no: number }>("select display_no from items order by display_no");
    expect(r.map((x) => x.display_no)).toEqual([1, 2]);
  });

  it("keeps the SQL transition tables in sync with domain.ts", async () => {
    const pairs = (t: Record<string, string[]>) =>
      Object.entries(t).flatMap(([from, tos]) => tos.map((to) => `${from}>${to}`)).sort();
    const fromDb = async (table: string) =>
      (await rows<{ f: string; t: string }>(`select from_status f, to_status t from ${table}`)).map((r) => `${r.f}>${r.t}`).sort();
    expect(await fromDb("item_transitions")).toEqual(pairs(ITEM_TRANSITIONS));
    expect(await fromDb("order_transitions")).toEqual(pairs(ORDER_TRANSITIONS));
  });

  it("enforces item transitions", async () => {
    await expect(db.exec("update items set status='delivered' where code='AAAA2222'")).rejects.toThrow(/cannot go from/);
    await db.exec("update items set status='reserved' where code='AAAA2222'");
    await db.exec("update items set status='ready_for_sale' where code='AAAA2222'");
  });

  it("enforces order transitions and logs each change", async () => {
    await expect(db.exec("update orders set status='delivered' where id='SH-1'")).rejects.toThrow(/cannot go from/);
    await db.exec("update orders set status='paid' where id='SH-1'");
    await db.exec("update orders set status='processing' where id='SH-1'");
    const ev = await rows<{ from_status: string; to_status: string }>(
      "select from_status, to_status from order_events where order_id='SH-1' order by id");
    expect(ev).toEqual([
      { from_status: "pending_payment", to_status: "paid" },
      { from_status: "paid", to_status: "processing" },
    ]);
  });

  it("activation needs owner and timestamp together; owner_name is capped", async () => {
    await db.exec("insert into owners (telegram_id, first_name) values (42, 'Anna')");
    await expect(db.exec("update items set owner_id=(select id from owners) where code='BBBB3333'")).rejects.toThrow();
    await db.exec("update items set status='shipped' where code='BBBB3333'");
    await db.exec("update items set status='delivered' where code='BBBB3333'");
    await db.exec("update items set status='activated', owner_id=(select id from owners), activated_at=now(), owner_name='для чаю' where code='BBBB3333'");
    await expect(db.exec(`update items set owner_name='${"x".repeat(61)}' where code='BBBB3333'`)).rejects.toThrow();
  });

  it("limits journal photos and validates entry kinds", async () => {
    const six = "{a,b,c,d,e,f}", seven = "{a,b,c,d,e,f,g}";
    await db.exec(`insert into journal_entries (item_code, kind, photos) values ('BBBB3333','photo_report','${six}')`);
    await expect(db.exec(`insert into journal_entries (item_code, kind, photos) values ('BBBB3333','photo_report','${seven}')`)).rejects.toThrow();
    await expect(db.exec("insert into journal_entries (item_code, kind) values ('BBBB3333','selfie')")).rejects.toThrow();
  });

  it("requires an answer to mark a question answered", async () => {
    await expect(db.exec("insert into questions (item_code, body, status) values ('BBBB3333','?','answered')")).rejects.toThrow();
    await db.exec("insert into questions (item_code, body) values ('BBBB3333','Чому жовтіє?')");
  });
});

describe("row level security", () => {
  const as = async (role: string, sub: string | null, q: string) => {
    await db.exec(`set role ${role}; select set_config('request.jwt.claim.sub', '${sub ?? ""}', false)`);
    try { return await rows(q); } finally { await db.exec("reset role"); }
  };

  beforeAll(async () => {
    await db.exec(`
      insert into products (slug, kind, status, price_uah) values ('tea-garden','basket','published',690), ('secret','basket','draft',1);
      insert into product_species (product, species) values ('tea-garden','mint'), ('secret','basil');
      insert into product_content (product, locale, section, body) values
        ('tea-garden','uk','watering','Поливайте...'), ('secret','uk','watering','hidden');
      insert into auth.users (id, email) values ('11111111-1111-1111-1111-111111111111','katya@example.com');
      insert into admin_profiles (user_id, role) values ('11111111-1111-1111-1111-111111111111','owner');
    `);
  });

  it("shows anonymous visitors only published products and their composition/content", async () => {
    expect(await as("anon", null, "select slug from products")).toEqual([{ slug: "tea-garden" }]);
    expect(await as("anon", null, "select species from product_species")).toEqual([{ species: "mint" }]);
    expect(await as("anon", null, "select body from product_content")).toEqual([{ body: "Поливайте..." }]);
  });

  it("hides items, owners, journal, questions, orders and payments from anonymous visitors", async () => {
    for (const t of ["items", "owners", "journal_entries", "questions", "orders", "payments", "reminders", "admin_profiles"]) {
      expect(await as("anon", null, `select 1 from ${t}`), t).toEqual([]);
    }
  });

  it("gives admins full access and nobody else", async () => {
    const admin = "11111111-1111-1111-1111-111111111111";
    expect((await as("authenticated", admin, "select 1 from journal_entries")).length).toBeGreaterThan(0);
    expect((await as("authenticated", admin, "select slug from products")).length).toBe(2);
    const stranger = "22222222-2222-2222-2222-222222222222";
    expect(await as("authenticated", stranger, "select 1 from journal_entries")).toEqual([]);
    expect(await as("authenticated", stranger, "select 1 from orders")).toEqual([]);
  });
});
