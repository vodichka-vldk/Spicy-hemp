import Link from "next/link";
import { Alert, Button, Chip, DataTable, Input } from "@/ds";
import { PageHeader, Panel, StatusBadge } from "@/ui";
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
  const tab = (label: string, kind: string, status: string, icon?: string) => {
    const on = (sp.kind ?? "all") === kind && (sp.status ?? "all") === status;
    return (<Chip key={label} icon={icon} selected={on} href={`/admin/catalog?kind=${kind}&status=${status}${q ? `&q=${encodeURIComponent(q)}` : ""}`}>{label}</Chip>);
  };
  return (
    <div className="sh-stack-lg">
      <PageHeader title="Каталог" actions={<Button variant="accent" href="/admin/catalog/new" icon="plus">Новий кошик</Button>} />

      <form className="flex flex-wrap items-end gap-2" role="search">
        <div style={{ flex: "1 1 18rem" }}><Input name="q" defaultValue={sp.q ?? ""} icon="search" placeholder="Пошук: назва, рослина, ідентифікатор" aria-label="Пошук" /></div>
        <input type="hidden" name="kind" value={sp.kind ?? "all"} /><input type="hidden" name="status" value={sp.status ?? "all"} />
        <Button variant="secondary" type="submit">Знайти</Button>
      </form>
      <nav className="sh-chiprow" aria-label="Фільтри">
        {tab(`Усе (${all.length})`, "all", "all")}
        {tab("Кошики", "set", "all", "package")}
        {tab("Рослини", "pot", "all", "leaf")}
        {tab(`Опубліковано (${count("published")})`, "all", "published")}
        {tab(`Чернетки (${count("draft")})`, "all", "draft")}
        {tab(`Архів (${count("archived")})`, "all", "archived")}
      </nav>

      {sp.import && <Alert tone="info">{sp.import}</Alert>}

      <DataTable
        caption="Каталог"
        columns={[
          { key: "title", label: "Товар" }, { key: "herbs", label: "Склад" }, { key: "price", label: "Ціна, ₴" },
          { key: "ready", label: "Готових до продажу" }, { key: "status", label: "Статус" }, { key: "actions", label: "" },
        ]}
        rows={rows.map((p) => {
          const st = (p.status ?? "published") as keyof typeof STATUS_UK;
          const next = st === "published" ? { to: "draft", label: "Сховати" } : { to: "published", label: st === "archived" ? "Відновити" : "Опублікувати" };
          const n = ready(p.slug, p.kind);
          return {
            title: (
              <div>
                <Link href={`/admin/catalog/${p.slug}`} className="font-semibold">{productTitle(p, "uk")}</Link>
                <div className="caption sh-muted">{p.kind === "set" ? "кошик" : "рослина"} · {p.slug}{edited.has(p.slug) ? " · змінено" : ""}</div>
              </div>
            ),
            herbs: p.herbs.map((h) => getHerb(h)?.names.uk ?? h).join(", "),
            price: (
              <form action={setPrice} className="flex items-center gap-1">
                <input type="hidden" name="slug" value={p.slug} />
                <div style={{ width: 96 }}><Input name="price" type="number" min={0} defaultValue={p.priceUah} aria-label={`Ціна: ${productTitle(p, "uk")}`} /></div>
                <Button size="sm" variant="secondary" type="submit">ок</Button>
              </form>
            ),
            ready: <span className={n === 0 && st === "published" ? "label" : ""} style={n === 0 && st === "published" ? { color: "var(--danger)" } : undefined}>{n}</span>,
            status: <StatusBadge kind="catalog" status={st} label={STATUS_UK[st]} />,
            actions: (
              <div className="flex flex-wrap gap-1">
                <form action={setStatus}><input type="hidden" name="slug" value={p.slug} /><input type="hidden" name="status" value={next.to} /><Button size="sm" variant="secondary" type="submit">{next.label}</Button></form>
                <Button size="sm" variant="ghost" href={`/admin/catalog/${p.slug}`}>Редагувати</Button>
                {st === "published" && <Button size="sm" variant="ghost" href={`/uk/shop/${p.slug}`} target="_blank" rel="noopener noreferrer" ariaLabel="Відкрити на сайті" icon="arrow-up-right"> </Button>}
              </div>
            ),
          };
        })}
      />

      <Panel title="Таблиця (CSV)" lead="Завантажте весь каталог, відредагуйте в Excel чи Google Таблицях і завантажте назад. Існуючі товари оновляться за ідентифікатором, нові з'являться як чернетки або з вказаним статусом.">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" href="/admin/catalog/export" icon="download" download>Завантажити CSV</Button>
          <form action={importCsv} className="flex flex-wrap items-center gap-2">
            <input type="file" name="file" accept=".csv,text/csv" required className="body-sm" aria-label="CSV-файл" />
            <Button variant="primary" type="submit" icon="plus">Імпортувати</Button>
          </form>
        </div>
      </Panel>
    </div>
  );
}
