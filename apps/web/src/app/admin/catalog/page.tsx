import Link from "next/link";
import { loadProducts } from "@/lib/catalog-server";
import { getHerb } from "@/lib/content";
import { productTitle } from "@/lib/shop";
import { store } from "@/lib/store";
import { importCsv, setPrice, setStatus } from "./actions";

export const dynamic = "force-dynamic";

const STATUS_UK = { published: "Опубліковано", draft: "Чернетка", archived: "В архіві" } as const;
type Search = { q?: string; kind?: string; status?: string; import?: string };

/** The whole catalogue in one table: find, hide/publish, change a price without leaving the page. */
export default async function Catalog({ searchParams }: { searchParams: Promise<Search> }) {
  const sp = await searchParams;
  const [all, items, pots, entries] = await Promise.all([loadProducts(), store().listItems(), store().listPots(), store().listCatalog()]);
  const edited = new Set(entries.map((e) => e.slug));
  const ready = (slug: string, kind: "set" | "pot") =>
    kind === "set"
      ? items.filter((i) => i.product === slug && i.status === "ready_for_sale" && !i.orderId).length
      : pots.filter((p) => p.species === slug && p.status === "planted" && !p.orderId).length;
  const q = (sp.q ?? "").trim().toLowerCase();
  const rows = all
    .filter((p) => (!sp.kind || sp.kind === "all" || p.kind === sp.kind) && (!sp.status || sp.status === "all" || p.status === sp.status))
    .filter((p) => !q || p.slug.includes(q) || productTitle(p, "uk").toLowerCase().includes(q) || p.herbs.some((h) => getHerb(h)?.names.uk.toLowerCase().includes(q)))
    .sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "set" ? -1 : 1));
  const count = (s: string) => all.filter((p) => p.status === s).length;
  const tab = (label: string, kind: string, status: string) => {
    const on = (sp.kind ?? "all") === kind && (sp.status ?? "all") === status;
    const href = `/admin/catalog?kind=${kind}&status=${status}${q ? `&q=${encodeURIComponent(q)}` : ""}`;
    return (<Link key={label} href={href} className="chip" aria-current={on ? "page" : undefined}>{label}</Link>);
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-3xl font-bold">Каталог</h1>
        <Link href="/admin/catalog/new" className="btn btn-primary ml-auto">+ Новий кошик</Link>
      </div>

      <form className="flex flex-wrap gap-2" role="search">
        <input name="q" defaultValue={sp.q ?? ""} className="input max-w-xs" placeholder="Пошук: назва, рослина, ідентифікатор" aria-label="Пошук" />
        <input type="hidden" name="kind" value={sp.kind ?? "all"} /><input type="hidden" name="status" value={sp.status ?? "all"} />
        <button className="btn btn-ghost" type="submit">Знайти</button>
      </form>
      <nav className="flex flex-wrap gap-2" aria-label="Фільтри">
        {tab(`Усе (${all.length})`, "all", "all")}
        {tab("🧺 Кошики", "set", "all")}
        {tab("🌿 Рослини", "pot", "all")}
        {tab(`Опубліковано (${count("published")})`, "all", "published")}
        {tab(`Чернетки (${count("draft")})`, "all", "draft")}
        {tab(`Архів (${count("archived")})`, "all", "archived")}
      </nav>

      {sp.import && <p role="status" className="rounded-lg bg-soft p-3 text-sm font-semibold">{sp.import}</p>}

      <section className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted">
            <tr><th className="p-3">Товар</th><th>Склад</th><th>Ціна, ₴</th><th>Готових до продажу</th><th>Статус</th><th /></tr>
          </thead>
          <tbody>
            {rows.map((p) => {
              const st = (p.status ?? "published") as keyof typeof STATUS_UK;
              const next = st === "published" ? { to: "draft", label: "Сховати" } : { to: "published", label: st === "archived" ? "Відновити" : "Опублікувати" };
              const n = ready(p.slug, p.kind);
              return (
                <tr key={p.slug} className="border-b border-line align-top last:border-0">
                  <td className="p-3">
                    <Link href={`/admin/catalog/${p.slug}`} className="font-semibold text-ink">{productTitle(p, "uk")}</Link>
                    <div className="text-xs text-muted">{p.kind === "set" ? "🧺 кошик" : "🌿 рослина"} · {p.slug}{edited.has(p.slug) ? " · змінено" : ""}</div>
                  </td>
                  <td className="py-3 pr-3 text-muted">{p.herbs.map((h) => getHerb(h)?.names.uk ?? h).join(", ")}</td>
                  <td className="py-3 pr-3">
                    <form action={setPrice} className="flex items-center gap-1">
                      <input type="hidden" name="slug" value={p.slug} />
                      <input name="price" type="number" min={0} defaultValue={p.priceUah} className="input w-24 !min-h-9 !py-1" aria-label={`Ціна: ${productTitle(p, "uk")}`} />
                      <button className="chip !min-h-9" type="submit">ок</button>
                    </form>
                  </td>
                  <td className="py-3 pr-3"><span className={n === 0 && st === "published" ? "font-semibold text-clay" : ""}>{n}</span></td>
                  <td className="py-3 pr-3"><span className="badge">{STATUS_UK[st]}</span></td>
                  <td className="py-3 pr-3">
                    <div className="flex flex-wrap gap-1">
                      <form action={setStatus}><input type="hidden" name="slug" value={p.slug} /><input type="hidden" name="status" value={next.to} /><button className="chip !min-h-9" type="submit">{next.label}</button></form>
                      <Link href={`/admin/catalog/${p.slug}`} className="chip !min-h-9">Редагувати</Link>
                      {st === "published" && <a href={`/uk/shop/${p.slug}`} className="chip !min-h-9" target="_blank" rel="noopener noreferrer">↗</a>}
                    </div>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">Нічого не знайдено</td></tr>}
          </tbody>
        </table>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-xl font-bold">Таблиця (CSV)</h2>
        <p className="mb-3 text-sm text-muted">Завантажте весь каталог, відредагуйте в Excel чи Google Таблицях і завантажте назад. Існуючі товари оновляться за ідентифікатором, нові з'являться як чернетки або з вказаним статусом.</p>
        <div className="flex flex-wrap items-center gap-3">
          <a href="/admin/catalog/export" className="btn btn-ghost" download>⬇ Завантажити CSV</a>
          <form action={importCsv} className="flex flex-wrap items-center gap-2">
            <input type="file" name="file" accept=".csv,text/csv" required className="text-sm" aria-label="CSV-файл" />
            <button className="btn btn-primary" type="submit">⬆ Імпортувати</button>
          </form>
        </div>
      </section>
    </div>
  );
}
