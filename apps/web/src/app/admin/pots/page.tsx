import Link from "next/link";
import { Button, Chip, DataTable, Input, Select } from "@/ds";
import { PageHeader, Panel, StatusBadge } from "@/ui";
import { displayId } from "@/lib/domain";
import { dict } from "@/lib/i18n";
import { formatCode } from "@/lib/pots";
import { loadProducts } from "@/lib/catalog-server";
import { productTitle } from "@/lib/shop";
import { store } from "@/lib/store";
import { generateItems } from "../actions";

export const dynamic = "force-dynamic";

const POT_UK: Record<string, string> = { planted: "посаджено", reserved: "зарезервовано", sold: "продано", returned: "повернено" };
const statusUk = (s: string) => (dict as Record<string, { uk: string }>)[`item_status_${s}`]?.uk ?? POT_UK[s] ?? s;

/** All physical items with a QR code in one place: baskets and single pots. */
export default async function Pots() {
  const [pots, items] = await Promise.all([store().listPots(), store().listItems()]);
  const rows = [
    ...items.map((i) => ({ code: i.code, label: displayId(i.kind, i.displayNo, "uk"), type: "Кошик", what: i.product, batch: i.batch, status: i.status, orderId: i.orderId, kind: "item" as const })),
    ...pots.map((p) => ({ code: p.code, label: "—", type: "Рослина", what: p.species, batch: p.batch, status: p.status, orderId: p.orderId, kind: "pot" as const })),
  ];
  const catalog = (await loadProducts()).filter((p) => p.status !== "archived");
  const batches = [...new Set(rows.map((r) => r.batch))];
  const options = [
    ...catalog.filter((p) => p.kind === "set").map((p) => ({ value: p.slug, label: `Кошик: ${productTitle(p, "uk")}` })),
    ...catalog.filter((p) => p.kind === "pot").map((p) => ({ value: p.slug, label: `Рослина: ${productTitle(p, "uk")}` })),
  ];
  return (
    <div className="sh-stack-lg">
      <PageHeader title="Горщики й QR-коди" />
      <Panel title="Створити партію" lead="Кожен горщик отримує свій QR-код. Роздрукуйте аркуш і наклейте етикетки.">
        <form action={generateItems} className="grid items-end gap-3 sm:grid-cols-4">
          <Select name="product" label="Що" options={options} />
          <Input name="count" type="number" label="Скільки" min={1} max={500} defaultValue={5} />
          <Input name="batch" label="Назва партії" placeholder="B-2026-10" />
          <Button type="submit" variant="primary" full>Створити</Button>
        </form>
      </Panel>
      <Panel title="Друк етикеток">
        <div className="sh-chiprow">{batches.map((b) => (<Chip key={b} href={`/admin/pots/print?batch=${encodeURIComponent(b)}`} icon="printer">{b}</Chip>))}</div>
      </Panel>
      <DataTable
        caption="Горщики й QR-коди"
        columns={[
          { key: "no", label: "№" }, { key: "code", label: "Код" }, { key: "type", label: "Тип" }, { key: "what", label: "Що" },
          { key: "batch", label: "Партія" }, { key: "status", label: "Статус" }, { key: "order", label: "Замовлення" }, { key: "check", label: "Перевірити" },
        ]}
        rows={rows.map((r) => ({
          no: r.kind === "item" ? <Link href={`/admin/pots/${r.code}`} className="font-semibold">{r.label}</Link> : r.label,
          code: <span className="font-mono">{formatCode(r.code)}</span>,
          type: r.type, what: r.what, batch: r.batch,
          status: r.kind === "item" ? <StatusBadge kind="item" status={r.status} label={statusUk(r.status)} /> : statusUk(r.status),
          order: <span className="font-mono">{r.orderId ?? "—"}</span>,
          check: <a href={`/p/${r.code}`} className="underline">/p/{r.code}</a>,
        }))}
      />
    </div>
  );
}
