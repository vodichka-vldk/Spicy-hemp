import { notFound } from "next/navigation";
import { formatMoney } from "@/lib/shop-calc";
import { store } from "@/lib/store";
import { ORDER_TRANSITIONS } from "@/lib/domain";
import { formatCode } from "@/lib/pots";
import { allocatePots, setStatus } from "../../actions";

export const dynamic = "force-dynamic";

export default async function AdminOrder({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ short?: string }> }) {
  const { id } = await params;
  const { short } = await searchParams;
  const o = await store().getOrder(id);
  if (!o) notFound();
  const money = (m: number) => formatMoney(m, o.currency, "en");
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Order <span className="font-mono">{o.id}</span></h1>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5 text-sm">
          <h2 className="mb-2 text-lg font-bold">Customer</h2>
          <p>{o.customer.name}</p><p>{o.customer.email}</p><p>{o.customer.phone}</p>
          <h2 className="mb-2 mt-4 text-lg font-bold">Shipping ({o.shipping.kind})</h2>
          <p>{o.shipping.country} · {o.shipping.city}</p><p>{o.shipping.address}</p>{o.shipping.postcode && <p>{o.shipping.postcode}</p>}
          {o.gift.isGift && <p className="mt-3 rounded bg-soft p-2">🎁 Gift{o.gift.message ? `: ${o.gift.message}` : ""}</p>}
          {o.note && <p className="mt-3 text-muted">Note: {o.note}</p>}
        </section>
        <section className="card p-5 text-sm">
          <h2 className="mb-2 text-lg font-bold">Items</h2>
          <ul className="divide-y divide-line">{o.items.map((i, n) => (<li key={n} className="flex justify-between py-2"><span>{i.title} · {i.glaze} × {i.qty}</span><span>{money(i.unitMinor * i.qty)}</span></li>))}</ul>
          <p className="mt-2 flex justify-between"><span>Shipping</span><span>{money(o.shippingMinor)}</span></p>
          <p className="flex justify-between text-lg font-bold"><span>Total ({o.payment})</span><span>{money(o.totalMinor)}</span></p>
          <form action={setStatus} className="mt-4 flex gap-2">
            <input type="hidden" name="id" value={o.id} />
            <select name="status" defaultValue={o.status} className="input">{[o.status, ...ORDER_TRANSITIONS[o.status]].map((s) => (<option key={s}>{s}</option>))}</select>
            <button className="btn btn-primary" type="submit">Save</button>
          </form>
        </section>
      </div>
      <section className="card p-5">
        <h2 className="mb-2 text-lg font-bold">QR codes for this order</h2>
        {short && <p role="alert" className="mb-3 rounded-lg bg-soft p-3 font-semibold text-clay">⚠️ Not enough planted pots in stock: {short} short. Generate a batch in Pots &amp; QR, then allocate again.</p>}
        {o.potCodes.length > 0 && !short ? (
          <ul className="flex flex-wrap gap-2">{o.potCodes.map((c) => (<li key={c} className="badge font-mono">{formatCode(c)}</li>))}</ul>
        ) : (
          <form action={allocatePots}><input type="hidden" name="id" value={o.id} /><button className="btn btn-clay" type="submit">Allocate pots from stock</button></form>
        )}
      </section>
    </div>
  );
}
