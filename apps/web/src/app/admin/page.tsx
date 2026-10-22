import { getHerb } from "@/lib/content";
import { orderStats, scanStats, type Count } from "@/lib/stats";
import { formatMoney } from "@/lib/shop-calc";
import { store } from "@/lib/store";

export const dynamic = "force-dynamic";

function Bars({ rows, label }: { rows: Count[]; label?: (k: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (rows.length === 0) return <p className="text-muted">No data yet</p>;
  return (
    <ul className="space-y-2">
      {rows.slice(0, 10).map((r) => (
        <li key={r.key}>
          <div className="flex justify-between text-sm"><span>{label ? label(r.key) : r.key}</span><span className="font-semibold">{r.n}</span></div>
          <div className="h-2 rounded-full bg-soft"><div className="h-2 rounded-full bg-leaf" style={{ width: `${(r.n / max) * 100}%` }} /></div>
        </li>
      ))}
    </ul>
  );
}

const Tile = ({ label, value, hint }: { label: string; value: string | number; hint?: string }) => (
  <div className="card p-4"><p className="text-sm text-muted">{label}</p><p className="text-3xl font-bold">{value}</p>{hint && <p className="text-xs text-muted">{hint}</p>}</div>
);

export default async function Dashboard() {
  const db = store();
  const [scans, orders] = await Promise.all([db.listScans(), db.listOrders()]);
  const s = scanStats(scans, 30);
  const o = orderStats(orders);
  const maxDay = Math.max(1, ...s.perDay.map((d) => d.n));
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">Analytics · last 30 days</h1>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Scans" value={s.total} hint={`${s.invalid} invalid codes`} />
        <Tile label="Unique visitors" value={s.uniqueVisitors} />
        <Tile label="Pots scanned" value={s.scannedPots} hint={`${s.repeatPots} scanned again`} />
        <Tile label="Orders" value={o.count} hint={Object.entries(o.revenue).map(([c, m]) => formatMoney(m, c as "UAH" | "EUR", "en")).join(" · ") || "—"} />
      </div>
      <section className="card p-5">
        <h2 className="mb-3 text-xl font-bold">Scans per day</h2>
        <div className="flex h-28 items-end gap-1" role="img" aria-label="Scans per day">
          {s.perDay.map((d) => (<div key={d.key} title={`${d.key}: ${d.n}`} className="flex-1 rounded-t bg-leaf" style={{ height: `${Math.max(2, (d.n / maxDay) * 100)}%` }} />))}
        </div>
      </section>
      <div className="grid gap-6 md:grid-cols-2">
        <section className="card p-5"><h2 className="mb-3 text-xl font-bold">By plant</h2><Bars rows={s.bySpecies} label={(k) => getHerb(k)?.names.en ?? k} /></section>
        <section className="card p-5"><h2 className="mb-3 text-xl font-bold">By country</h2><Bars rows={s.byCountry} /></section>
        <section className="card p-5"><h2 className="mb-3 text-xl font-bold">Device</h2><Bars rows={s.byDevice} /></section>
        <section className="card p-5"><h2 className="mb-3 text-xl font-bold">OS</h2><Bars rows={s.byOs} /></section>
      </div>
    </div>
  );
}
