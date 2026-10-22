import Link from "next/link";
import { Alert, Badge, Button, EmptyState, Grid, StatTile } from "@/ds";
import { ORDER_TABS, inTab, nextAction } from "@/lib/order-groups";
import { store } from "@/lib/store";
import { PageHeader, Panel } from "@/ui";

export const dynamic = "force-dynamic";

const LOW_STOCK = 3;

function Tile({ href, n, title, icon, warn }: { href: string; n: number; title: string; icon: string; warn?: boolean }) {
  return (
    <Link href={href} className="no-underline">
      <StatTile label={title} value={String(n)} icon={icon} delta={warn && n > 0 ? "потрібна дія" : undefined} deltaTone="warning" />
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
    <div className="sh-stack-lg">
      <PageHeader title="Сьогодні" />
      <Grid cols="stats">
        <Tile href="/admin/orders?tab=todo" n={todo.length} title="Замовлення до дії" icon="clipboard-list" warn />
        <Tile href="/admin/orders?tab=todo" n={toShip.length} title="До відправки" icon="truck" />
        <Tile href="/admin/orders?tab=unpaid" n={unpaid.length} title="Чекають оплату" icon="credit-card" />
        <Tile href="/admin/questions" n={openQuestions.length} title="Питання без відповіді" icon="info" warn />
        <Tile href="/admin/reviews" n={reviews.length} title="Відгуки на модерації" icon="star" warn />
      </Grid>

      <Panel title="Що робити зараз">
        {todo.length === 0 && returns.length === 0 ? <EmptyState icon="circle-check" title="Усе опрацьовано" /> : (
          <ul className="sh-stack">
            {todo.slice(0, 8).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/orders/${o.id}`} className="flex flex-wrap items-center gap-x-3 gap-y-1 no-underline">
                  <span className="font-mono font-semibold">{o.id}</span><span>{o.customer.name}</span>
                  <span className="ml-auto"><Badge tone="info" icon="arrow-right">{nextAction(o)}</Badge></span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        {todo.length > 8 && <Button variant="ghost" href="/admin/orders?tab=todo" iconRight="arrow-right">Усі {todo.length}</Button>}
      </Panel>

      {low.length > 0 && (
        <Alert tone="warning" title="Закінчуються горщики">
          <ul className="my-2 flex flex-wrap gap-2">{low.map(([p, n]) => (<li key={p}><Badge tone="warning">{p}: {n}</Badge></li>))}</ul>
          <Button size="sm" variant="accent" href="/admin/pots">Створити партію</Button>
        </Alert>
      )}

      <p className="body-sm sh-muted">{ORDER_TABS.find((t) => t.key === "closed")?.label}: {orders.filter((o) => inTab(o, "closed")).length} · Аналітику сканів дивіться в розділі «Аналітика».</p>
    </div>
  );
}
