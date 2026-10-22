import Link from "next/link";
import { dict } from "@/lib/i18n";
import { ORDER_TABS, inTab, matchesQuery, nextAction, type OrderTab } from "@/lib/order-groups";
import { formatMoney } from "@/lib/shop-calc";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

const statusUk = (s: string) => (dict as Record<string, { uk: string }>)[`status_${s}`]?.uk ?? s;
const payUk = { cod: "При отриманні", stripe: "Картка (Stripe)", liqpay: "Картка (LiqPay)" } as const;

export default async function Orders({ searchParams }: { searchParams: Promise<{ tab?: string; q?: string }> }) {
  const { tab: rawTab, q = "" } = await searchParams;
  const tab = (ORDER_TABS.some((t) => t.key === rawTab) ? rawTab : "todo") as OrderTab;
  const all = await store().listOrders();
  const orders = all.filter((o) => inTab(o, tab) && matchesQuery(o, q));
  const count = (t: OrderTab) => all.filter((o) => inTab(o, t)).length;
  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-bold">Замовлення</h1>
      <nav className="flex flex-wrap gap-2" aria-label="Фільтр">
        {ORDER_TABS.map((t) => (
          <Link key={t.key} href={`/admin/orders?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} className={`chip no-underline ${t.key === tab ? "bg-leaf text-leaf-ink" : ""}`} aria-current={t.key === tab ? "page" : undefined}>
            {t.label} <span className="opacity-70">{count(t.key)}</span>
          </Link>
        ))}
      </nav>
      <form className="flex gap-2" action="/admin/orders">
        <input type="hidden" name="tab" value={tab} />
        <input name="q" defaultValue={q} placeholder="Пошук: номер, ім'я, телефон, ТТН" className="input max-w-md" aria-label="Пошук" />
        <button className="btn btn-ghost" type="submit">Знайти</button>
      </form>
      {orders.length === 0 ? <p className="text-muted">Тут порожньо.</p> : (
        <ul className="space-y-2">
          {orders.map((o) => (
            <li key={o.id}>
              <Link href={`/admin/orders/${o.id}`} className="card flex flex-wrap items-center gap-x-4 gap-y-1 p-3 no-underline hover:shadow-md">
                <span className="font-mono font-semibold text-ink">{o.id}</span>
                <span className="badge">{statusUk(o.status)}</span>
                <span className="text-ink">{o.customer.name}</span>
                <span className="text-sm text-muted">{o.createdAt.slice(0, 16).replace("T", " ")} · {payUk[o.payment]}</span>
                <span className="ml-auto font-semibold text-ink">{formatMoney(o.totalMinor, o.currency, "uk")}</span>
                {nextAction(o) && <span className="basis-full text-sm text-leaf">→ {nextAction(o)}</span>}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
