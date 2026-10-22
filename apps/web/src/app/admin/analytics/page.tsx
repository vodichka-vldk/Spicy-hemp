import { BarChart, Grid, ProgressBar, StatTile } from "@/ds";
import { getHerb } from "@/lib/content";
import { orderStats, scanStats, type Count } from "@/lib/stats";
import { formatMoney } from "@/lib/shop-calc";
import { store } from "@/lib/store";
import { PageHeader, Panel } from "@/ui";

export const dynamic = "force-dynamic";

function Bars({ rows, label }: { rows: Count[]; label?: (k: string) => string }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  if (rows.length === 0) return <p className="sh-muted">Даних ще немає</p>;
  return (
    <ul className="sh-stack">
      {rows.slice(0, 10).map((r) => (
        <li key={r.key} className="sh-stack" style={{ gap: 4 }}>
          <div className="body-sm flex justify-between"><span>{label ? label(r.key) : r.key}</span><span className="label">{r.n}</span></div>
          <ProgressBar value={Math.round((r.n / max) * 100)} label={`${label ? label(r.key) : r.key}: ${r.n}`} />
        </li>
      ))}
    </ul>
  );
}

export default async function Analytics() {
  const db = store();
  const [scans, orders] = await Promise.all([db.listScans(), db.listOrders()]);
  const s = scanStats(scans, 30);
  const o = orderStats(orders);
  const days = s.perDay.slice(-14).map((d) => ({ label: d.key.slice(8, 10), value: d.n }));
  return (
    <div className="sh-stack-lg">
      <PageHeader title="Аналітика" lead="Останні 30 днів" />
      <Grid cols="stats">
        <StatTile label="Скани QR" value={String(s.total)} icon="scan-line" delta={s.invalid ? `${s.invalid} хибних кодів` : undefined} deltaTone="warning" />
        <StatTile label="Унікальні відвідувачі" value={String(s.uniqueVisitors)} icon="user" />
        <StatTile label="Скановано горщиків" value={String(s.scannedPots)} icon="qr-code" delta={`${s.repeatPots} повторно`} deltaTone="info" />
        <StatTile label="Замовлення" value={String(o.count)} icon="shopping-cart" delta={Object.entries(o.revenue).map(([c, m]) => formatMoney(m, c as "UAH" | "EUR", "uk")).join(" · ") || undefined} deltaTone="success" />
      </Grid>
      <Panel title="Скани за останні 14 днів"><BarChart data={days} title="Скани за днями" /></Panel>
      <Grid cols="two">
        <Panel title="За рослинами"><Bars rows={s.bySpecies} label={(k) => getHerb(k)?.names.uk ?? k} /></Panel>
        <Panel title="За країнами"><Bars rows={s.byCountry} /></Panel>
        <Panel title="Пристрій"><Bars rows={s.byDevice} /></Panel>
        <Panel title="ОС"><Bars rows={s.byOs} /></Panel>
      </Grid>
    </div>
  );
}
