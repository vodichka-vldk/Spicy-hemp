import Link from "next/link";
import { getHerbs } from "@/lib/content";
import { formatCode } from "@/lib/pots";
import { store } from "@/lib/store";
import { displayId } from "@/lib/domain";
import { products, productTitle } from "@/lib/shop";
import { generateBasketBatch, generateBatch } from "../actions";

export const dynamic = "force-dynamic";

export default async function Pots() {
  const [pots, items] = await Promise.all([store().listPots(), store().listItems()]);
  const batches = [...new Set([...pots.map((p) => p.batch), ...items.map((i) => i.batch)])];
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Pots &amp; QR codes</h1>
      <section className="card p-5">
        <h2 className="mb-3 text-xl font-bold">Generate a new batch</h2>
        <form action={generateBatch} className="grid gap-3 sm:grid-cols-4">
          <label className="field"><span>Plant</span><select name="species" className="input">{getHerbs().map((h) => (<option key={h.slug} value={h.slug}>{h.names.en}</option>))}</select></label>
          <label className="field"><span>How many</span><input name="count" type="number" min={1} max={500} defaultValue={10} className="input" /></label>
          <label className="field"><span>Batch name</span><input name="batch" className="input" placeholder="B-2026-10" /></label>
          <div className="flex items-end"><button className="btn btn-primary w-full" type="submit">Generate</button></div>
        </form>
      </section>
      <section className="card p-5">
        <h2 className="mb-3 text-xl font-bold">Generate a batch of baskets</h2>
        <form action={generateBasketBatch} className="grid gap-3 sm:grid-cols-4">
          <label className="field"><span>Basket</span><select name="product" className="input">{products.filter((p) => p.kind === "set").map((p) => (<option key={p.slug} value={p.slug}>{productTitle(p, "en")}</option>))}</select></label>
          <label className="field"><span>How many</span><input name="count" type="number" min={1} max={200} defaultValue={5} className="input" /></label>
          <label className="field"><span>Batch name</span><input name="batch" className="input" placeholder="K-2026-10" /></label>
          <div className="flex items-end"><button className="btn btn-primary w-full" type="submit">Generate</button></div>
        </form>
      </section>
      <section className="card overflow-x-auto">
        <h2 className="p-3 text-xl font-bold">Baskets</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3">No</th><th>Code</th><th>Basket</th><th>Batch</th><th>Status</th><th>Order</th><th>Test link</th></tr></thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.code} className="border-b border-line last:border-0">
                <td className="p-3">{displayId(i.kind, i.displayNo, "en")}</td><td className="font-mono">{formatCode(i.code)}</td><td>{i.product}</td><td>{i.batch}</td>
                <td><span className="badge">{i.status}</span></td><td className="font-mono">{i.orderId ?? "—"}</td>
                <td><a href={`/p/${i.code}`} className="text-leaf underline">/p/{i.code}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section>
        <h2 className="mb-2 text-xl font-bold">Print sheets</h2>
        <ul className="flex flex-wrap gap-2">{batches.map((b) => (<li key={b}><Link className="chip" href={`/admin/pots/print?batch=${encodeURIComponent(b)}`}>🖨 {b}</Link></li>))}</ul>
      </section>
      <section className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-line text-muted"><tr><th className="p-3">Code</th><th>Plant</th><th>Batch</th><th>Planted</th><th>Status</th><th>Order</th><th>Test link</th></tr></thead>
          <tbody>
            {pots.map((p) => (
              <tr key={p.code} className="border-b border-line last:border-0">
                <td className="p-3 font-mono">{formatCode(p.code)}</td><td>{p.species}</td><td>{p.batch}</td><td>{p.plantedOn}</td>
                <td><span className="badge">{p.status}</span></td><td className="font-mono">{p.orderId ?? "—"}</td>
                <td><a href={`/p/${p.code}`} className="text-leaf underline">/p/{p.code}</a></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
