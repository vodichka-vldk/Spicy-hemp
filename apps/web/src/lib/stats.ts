import type { Order, ScanEvent } from "./store/types";

export type Count = { key: string; n: number };

const tally = (items: string[]): Count[] => {
  const m = new Map<string, number>();
  for (const k of items) m.set(k, (m.get(k) ?? 0) + 1);
  return [...m].map(([key, n]) => ({ key, n })).sort((a, b) => b.n - a.n);
};

export function scanStats(scans: ScanEvent[], days = 30, now = new Date()) {
  const since = new Date(now.getTime() - days * 86400000).toISOString();
  const rows = scans.filter((s) => s.ts >= since);
  const valid = rows.filter((s) => s.valid);
  const perDay = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) perDay.set(new Date(now.getTime() - i * 86400000).toISOString().slice(0, 10), 0);
  for (const s of valid) { const d = s.ts.slice(0, 10); if (perDay.has(d)) perDay.set(d, perDay.get(d)! + 1); }
  const pots = new Map<string, number>();
  for (const s of valid) if (s.potCode) pots.set(s.potCode, (pots.get(s.potCode) ?? 0) + 1);
  return {
    total: valid.length,
    invalid: rows.length - valid.length,
    uniqueVisitors: new Set(valid.map((s) => s.visitor)).size,
    firstScans: valid.filter((s) => s.firstScan).length,
    repeatPots: [...pots.values()].filter((n) => n > 1).length,
    scannedPots: pots.size,
    bySpecies: tally(valid.map((s) => s.species ?? "?")),
    byCountry: tally(valid.map((s) => s.country ?? "—")),
    byDevice: tally(valid.map((s) => s.device)),
    byOs: tally(valid.map((s) => s.os)),
    perDay: [...perDay].map(([key, n]) => ({ key, n })),
  };
}

export function orderStats(orders: Order[]) {
  const live = orders.filter((o) => o.status !== "cancelled");
  const revenue: Record<string, number> = {};
  for (const o of live) revenue[o.currency] = (revenue[o.currency] ?? 0) + o.totalMinor;
  return { count: orders.length, open: orders.filter((o) => ["new", "pending_payment", "paid", "packed"].includes(o.status)).length, revenue };
}
