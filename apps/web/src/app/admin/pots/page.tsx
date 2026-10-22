import Link from "next/link";
import { displayId } from "@/lib/domain";
import { formatCode } from "@/lib/pots";
import { products, productTitle } from "@/lib/shop";
import { store } from "@/lib/store";
import { generateItems } from "../actions";

export const dynamic = "force-dynamic";

/** All physical items with a QR code in one place: baskets and single pots. */
export default async function Gardens() {
  const [pots, items] = await Promise.all([store().listPots(), store().listItems()]);
  const rows = [
    ...items.map((i) => ({ code: i.code, label: displayId(i.kind, i.displayNo, "en"), type: "Basket", what: i.product, batch: i.batch, status: i.status, orderId: i.orderId })),
    ...pots.map((p) => ({ code: p.code, label: "—", type: "Plant", what: p.species, batch: p.batch, status: p.status, orderId: p.orderId })),
  ];
  const batches = [...new Set(rows.map((r) => r.batch))];
  const opt = (kind: "set" | "pot") => products.filter((p) => p.kind === kind).map((p) => (<option key={p.slug} value={p.slug}>{productTitle(p, "en")}</option>));
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Gardens &amp; QR codes</h1>
      <section className="card p-5">
        <h2 className="mb-3 text-xl font-bold">Make a batch</h2>
        <form action={generateItems} className="grid gap-3 sm:grid-cols-4">
          <label className="field"><span>What</span>
            <select name="product" className="input"><optgroup label="Baskets">{opt("set")}</optgroup><optgroup label="Single plants">{opt("pot")}</optgroup></select>
          </label>
          <label className="field"><span>How many</span><input name="count" type="number" min={1} max={500} defaultValue={5} className="input" /></label>
          <label className="field"><span>Batch name</span><input name="batch" className="input" placeholder="B-2026-10" /></label>
          <div className="flex items-end"><button className="btn btn-primary w-full" type="submit">Make</button></div>
        </form>
        <p className="mt-3 text-sm text-muted">Each item gets its own QR code. Print the sheet and attach the label.</p>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-bold">Print sheets</h2>
        <ul className="flex flex-wrap gap-2">{batches.map((b) => (<li key={b}><Link className="chip" href={`/admin/pots/print?batch=${encodeURIComponent(b)}`}>🖨 {b}</Link></li>))}</ul>
      </section>
      <section className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3">No</th><th>Code</th><th>Type</th><th>What</th><th>Batch</th><th>Status</th><th>Order</th><th>Test link</th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.code} className="border-b border-line last:border-0">
                <td className="p-3">{r.label}</td><td className="font-mono">{formatCode(r.code)}</td><td>{r.type}</td><td>{r.what}</td><td>{r.batch}</td>
                <td><span className="badge">{r.status}</span></td><td className="font-mono">{r.orderId ?? "—"}</td>
                <td><a href={`/p/${r.code}`} className="text-leaf underline">/p/{r.code}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
