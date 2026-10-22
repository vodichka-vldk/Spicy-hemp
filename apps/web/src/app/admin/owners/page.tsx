import Link from "next/link";
import { Badge, Button, DataTable, Input } from "@/ds";
import { displayId } from "@/lib/domain";
import { store } from "@/lib/store";
import { PageHeader } from "@/ui";

export const dynamic = "force-dynamic";

/** Everyone who opened the bot, with their pots and open questions. */
export default async function Owners({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const q = ((await searchParams).q ?? "").trim().toLowerCase();
  const db = store();
  const [owners, items, questions, reviews] = await Promise.all([db.listOwners(), db.listItems(), db.listQuestions(), db.listReviews()]);
  const rows = owners
    .filter((o) => !q || (o.firstName ?? "").toLowerCase().includes(q) || (o.username ?? "").toLowerCase().includes(q) || String(o.telegramId).includes(q))
    .map((o) => ({
      o,
      pots: items.filter((i) => i.ownerId === o.id),
      open: questions.filter((x) => x.ownerId === o.id && x.status === "open").length,
      rated: reviews.filter((r) => r.itemCode && items.find((i) => i.code === r.itemCode)?.ownerId === o.id).length,
    }))
    .sort((a, b) => b.pots.length - a.pots.length || b.o.createdAt.localeCompare(a.o.createdAt));
  return (
    <div className="sh-stack-lg">
      <PageHeader title="Власники" />
      <form className="flex flex-wrap items-end gap-2" role="search">
        <div style={{ flex: "1 1 16rem" }}><Input name="q" defaultValue={q} icon="search" placeholder="Ім'я, @нік або id" aria-label="Пошук" /></div>
        <Button variant="secondary" type="submit">Знайти</Button>
      </form>
      <DataTable
        caption="Власники"
        columns={[
          { key: "who", label: "Власник" }, { key: "pots", label: "Горщики" }, { key: "open", label: "Питання без відповіді" },
          { key: "rated", label: "Оцінок" }, { key: "notify", label: "Сповіщення" }, { key: "since", label: "З нами з" },
        ]}
        rows={rows.map(({ o, pots, open, rated }) => ({
          who: <div><b>{o.firstName ?? "—"}</b>{o.username && <span className="sh-muted"> @{o.username}</span>}<div className="caption sh-muted font-mono">{o.telegramId}</div></div>,
          pots: pots.length === 0 ? "—" : pots.map((p) => (<Link key={p.code} href={`/admin/pots/${p.code}`} className="mr-2 inline-block">{displayId(p.kind, p.displayNo, "uk")}{p.ownerName ? ` «${p.ownerName}»` : ""}</Link>)),
          open: open > 0 ? <Link href="/admin/questions"><Badge tone="warning">{open}</Badge></Link> : "0",
          rated, notify: o.notify ? "так" : "вимкнені", since: o.createdAt.slice(0, 10),
        }))}
      />
      {rows.length === 0 && <p className="sh-muted">Поки нікого. Власники з'являються, коли пишуть боту.</p>}
    </div>
  );
}
