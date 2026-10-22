import Link from "next/link";
import { displayId } from "@/lib/domain";
import { dict } from "@/lib/i18n";
import { formatCode } from "@/lib/pots";
import { products, productTitle } from "@/lib/shop";
import { store } from "@/lib/store";
import { generateItems } from "../actions";

export const dynamic = "force-dynamic";

const POT_UK: Record<string, string> = { planted: "посаджено", reserved: "зарезервовано", sold: "продано", returned: "повернено" };
const statusUk = (s: string) => (dict as Record<string, { uk: string }>)[`item_status_${s}`]?.uk ?? POT_UK[s] ?? s;

/** All physical items with a QR code in one place: baskets and single pots. */
export default async function Pots() {
  const [pots, items] = await Promise.all([store().listPots(), store().listItems()]);
  const rows = [
    ...items.map((i) => ({ code: i.code, label: displayId(i.kind, i.displayNo, "uk"), type: "Кошик", what: i.product, batch: i.batch, status: i.status, orderId: i.orderId })),
    ...pots.map((p) => ({ code: p.code, label: "—", type: "Рослина", what: p.species, batch: p.batch, status: p.status, orderId: p.orderId })),
  ];
  const batches = [...new Set(rows.map((r) => r.batch))];
  const opt = (kind: "set" | "pot") => products.filter((p) => p.kind === kind).map((p) => (<option key={p.slug} value={p.slug}>{productTitle(p, "uk")}</option>));
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Горщики й QR-коди</h1>
      <section className="card p-5">
        <h2 className="mb-3 text-xl font-bold">Створити партію</h2>
        <form action={generateItems} className="grid gap-3 sm:grid-cols-4">
          <label className="field"><span>Що</span>
            <select name="product" className="input"><optgroup label="Кошики">{opt("set")}</optgroup><optgroup label="Окремі рослини">{opt("pot")}</optgroup></select>
          </label>
          <label className="field"><span>Скільки</span><input name="count" type="number" min={1} max={500} defaultValue={5} className="input" /></label>
          <label className="field"><span>Назва партії</span><input name="batch" className="input" placeholder="B-2026-10" /></label>
          <div className="flex items-end"><button className="btn btn-primary w-full" type="submit">Створити</button></div>
        </form>
        <p className="mt-3 text-sm text-muted">Кожен горщик отримує свій QR-код. Роздрукуйте аркуш і наклейте етикетки.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-bold">Друк етикеток</h2>
        <ul className="flex flex-wrap gap-2">{batches.map((b) => (<li key={b}><Link className="chip" href={`/admin/pots/print?batch=${encodeURIComponent(b)}`}>🖨 {b}</Link></li>))}</ul>
      </section>
      <section className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3">№</th><th>Код</th><th>Тип</th><th>Що</th><th>Партія</th><th>Статус</th><th>Замовлення</th><th>Перевірити</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-line last:border-0">
                <td className="p-3">{r.label}</td><td className="font-mono">{formatCode(r.code)}</td><td>{r.type}</td><td>{r.what}</td><td>{r.batch}</td>
                <td><span className="badge">{statusUk(r.status)}</span></td><td className="font-mono">{r.orderId ?? "—"}</td>
                <td><a href={`/p/${r.code}`} className="text-leaf underline">/p/{r.code}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
