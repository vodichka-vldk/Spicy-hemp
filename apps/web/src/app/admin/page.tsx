import Link from "next/link";
import { ORDER_TABS, inTab, nextAction } from "@/lib/order-groups";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

const LOW_STOCK = 3;

function Card({ href, n, title, hint, tone }: { href: string; n: number; title: string; hint: string; tone?: "warn" }) {
  return (
    <Link href={href} className={`card block p-4 no-underline hover:shadow-md ${tone === "warn" && n > 0 ? "border-clay" : ""}`}>
      <p className={`text-4xl font-bold ${n > 0 && tone === "warn" ? "text-clay" : "text-leaf"}`}>{n}</p>
      <p className="mt-1 font-semibold text-ink">{title}</p>
      <p className="text-sm text-muted">{hint}</p>
    </Link>
  );
}

/** "Today": everything that needs a decision, in one screen. */
export default async function Today() {
  const db = store();
  const [orders, reviews, items, openQuestions] = await Promise.all([db.listOrders(), db.listReviews({ status: "pending" }), db.listItems(), db.listQuestions({ status: "open" })]);
  const todo = orders.filter((o) => inTab(o, "todo"));
  const unpaid = orders.filter((o) => inTab(o, "unpaid"));
  const toShip = orders.filter((o) => ["cod_confirmed", "paid", "processing", "packed"].includes(o.status));
  const returns = orders.filter((o) => o.status === "refund_requested" || o.status === "return_requested");
  const stock = new Map<string, number>();
  for (const i of items) if (i.status === "ready_for_sale" && !i.orderId) stock.set(i.product, (stock.get(i.product) ?? 0) + 1);
  const low = [...stock].filter(([, n]) => n <= LOW_STOCK);
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Сьогодні</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card href="/admin/orders?tab=todo" n={todo.length} title="Замовлення до дії" hint="підтвердити, зібрати, відправити" tone="warn" />
        <Card href="/admin/orders?tab=todo" n={toShip.length} title="До відправки" hint="оплачені й підтверджені" />
        <Card href="/admin/orders?tab=unpaid" n={unpaid.length} title="Чекають оплату" hint="нагадайте клієнтам" />
        <Card href="/admin/questions" n={openQuestions.length} title="Питання без відповіді" hint="відповісти власнику" tone="warn" />
        <Card href="/admin/reviews" n={reviews.length} title="Відгуки на модерації" hint="схвалити або відхилити" tone="warn" />
      </div>

      <section className="card p-5">
        <h2 className="mb-3 text-xl font-bold">Що робити зараз</h2>
        {todo.length === 0 && returns.length === 0 ? <p className="text-muted">Усе опрацьовано. </p> : (
          <ul className="divide-y divide-line">
            {todo.slice(0, 8).map((o) => (
              <li key={o.id}><Link href={`/admin/orders/${o.id}`} className="flex flex-wrap gap-x-3 py-2 no-underline"><span className="font-mono font-semibold text-ink">{o.id}</span><span className="text-ink">{o.customer.name}</span><span className="ml-auto text-leaf">→ {nextAction(o)}</span></Link></li>
            ))}
          </ul>
        )}
        {todo.length > 8 && <p className="mt-2 text-sm"><Link href="/admin/orders?tab=todo" className="text-leaf">Усі {todo.length} →</Link></p>}
      </section>

      {low.length > 0 && (
        <section className="card border-clay p-5">
          <h2 className="mb-2 text-xl font-bold">Закінчуються горщики</h2>
          <ul className="flex flex-wrap gap-2">{low.map(([p, n]) => (<li key={p} className="badge font-mono">{p}: {n}</li>))}</ul>
          <p className="mt-3"><Link href="/admin/pots" className="btn btn-clay">Створити партію</Link></p>
        </section>
      )}

      <p className="text-sm text-muted">{ORDER_TABS.find((t) => t.key === "closed")?.label}: {orders.filter((o) => inTab(o, "closed")).length} · Аналітику сканів дивіться в розділі «Аналітика».</p>
    </div>
  );
}
