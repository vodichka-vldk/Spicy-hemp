import Link from "next/link";
import { displayId } from "@/lib/domain";
import { store } from "@/lib/store";

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
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Власники</h1>
      <form className="flex gap-2" role="search"><input name="q" defaultValue={q} className="input max-w-xs" placeholder="Ім'я, @нік або id" aria-label="Пошук" /><button className="btn btn-ghost" type="submit">Знайти</button></form>
      <section className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3">Власник</th><th>Горщики</th><th>Питання без відповіді</th><th>Оцінок</th><th>Сповіщення</th><th>З нами з</th></tr></thead>
          <tbody>
            {rows.map(({ o, pots, open, rated }) => (
              <tr key={o.id} className="border-b border-line align-top last:border-0">
                <td className="p-3"><b>{o.firstName ?? "—"}</b>{o.username && <span className="text-muted"> @{o.username}</span>}<div className="font-mono text-xs text-muted">{o.telegramId}</div></td>
                <td className="py-3 pr-3">{pots.length === 0 ? <span className="text-muted">—</span> : pots.map((p) => (<Link key={p.code} href={`/admin/pots/${p.code}`} className="mr-2 inline-block">{displayId(p.kind, p.displayNo, "uk")}{p.ownerName ? ` «${p.ownerName}»` : ""}</Link>))}</td>
                <td className="py-3 pr-3">{open > 0 ? <Link href="/admin/questions" className="font-semibold text-clay">{open}</Link> : 0}</td>
                <td className="py-3 pr-3">{rated}</td>
                <td className="py-3 pr-3">{o.notify ? "так" : "вимкнені"}</td>
                <td className="py-3 pr-3">{o.createdAt.slice(0, 10)}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted">Поки нікого. Власники з'являються, коли пишуть боту.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
