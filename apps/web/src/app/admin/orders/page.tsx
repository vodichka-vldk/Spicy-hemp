import Link from "next/link";
import { Button, Chip, DataTable, EmptyState, Input } from "@/ds";
import { dict } from "@/lib/i18n";
import { ORDER_TABS, inTab, matchesQuery, nextAction, type OrderTab } from "@/lib/order-groups";
import { formatMoney } from "@/lib/shop-calc";
import { store } from "@/lib/store";
import { PageHeader, StatusBadge } from "@/ui";

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
    <div className="sh-stack-lg">
      <PageHeader title="Замовлення" />
      <nav className="sh-chiprow" aria-label="Фільтр">
        {ORDER_TABS.map((t) => (
          <Chip key={t.key} href={`/admin/orders?tab=${t.key}${q ? `&q=${encodeURIComponent(q)}` : ""}`} selected={t.key === tab} count={count(t.key)}>{t.label}</Chip>
        ))}
      </nav>
      <form className="flex flex-wrap items-end gap-2" action="/admin/orders" role="search">
        <input type="hidden" name="tab" value={tab} />
        <div style={{ flex: "1 1 18rem" }}><Input name="q" defaultValue={q} icon="search" placeholder="Пошук: номер, ім'я, телефон, ТТН" aria-label="Пошук" /></div>
        <Button type="submit" variant="secondary">Знайти</Button>
      </form>
      {orders.length === 0 ? <EmptyState icon="clipboard-list" title="Тут порожньо" /> : (
        <DataTable
          caption="Замовлення"
          columns={[
            { key: "id", label: "Номер" }, { key: "status", label: "Статус" }, { key: "customer", label: "Клієнт" },
            { key: "when", label: "Дата й оплата" }, { key: "next", label: "Що далі" }, { key: "total", label: "Сума", align: "right" },
          ]}
          rows={orders.map((o) => ({
            id: <Link href={`/admin/orders/${o.id}`} className="font-mono font-semibold">{o.id}</Link>,
            status: <StatusBadge kind="order" status={o.status} label={statusUk(o.status)} />,
            customer: o.customer.name,
            when: `${o.createdAt.slice(0, 16).replace("T", " ")} · ${payUk[o.payment]}`,
            next: nextAction(o) ?? "",
            total: formatMoney(o.totalMinor, o.currency, "uk"),
          }))}
        />
      )}
    </div>
  );
}
