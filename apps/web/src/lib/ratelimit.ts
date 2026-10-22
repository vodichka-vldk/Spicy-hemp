/**
 * Sliding-window limiter kept in memory. It is a brake for one server instance (enough against casual guessing and
 * accidental floods); strict limits across instances belong to the hosting firewall (see docs/DEPLOY.md).
 */
type Hit = number[];
const buckets = new Map<string, Hit>();
let lastSweep = 0;

export type Limit = { max: number; windowMs: number };

/** Records an attempt and says whether it is allowed. `peek` only checks. */
export function hit(key: string, limit: Limit, now = Date.now(), peek = false): { ok: boolean; retryAfterSec: number } {
  if (now - lastSweep > 60_000) {
    lastSweep = now;
    for (const [k, v] of buckets) if (v.length === 0 || now - v[v.length - 1] > 3_600_000) buckets.delete(k);
  }
  const list = (buckets.get(key) ?? []).filter((t) => now - t < limit.windowMs);
  if (list.length >= limit.max) {
    buckets.set(key, list);
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((limit.windowMs - (now - list[0])) / 1000)) };
  }
  if (!peek) list.push(now);
  buckets.set(key, list);
  return { ok: true, retryAfterSec: 0 };
}

export const reset = (key: string) => { buckets.delete(key); };
export const clearAll = () => { buckets.clear(); };

export const LIMITS = {
  /** Wrong or foreign pot codes per owner: stops guessing 8-character codes. */
  activateFail: { max: 8, windowMs: 10 * 60_000 },
  journal: { max: 40, windowMs: 60 * 60_000 },
  question: { max: 10, windowMs: 60 * 60_000 },
  order: { max: 60, windowMs: 60 * 60_000 },
  lookup: { max: 40, windowMs: 10 * 60_000 },
} satisfies Record<string, Limit>;

/** Client address as the hosting passes it on. */
export function clientIp(req: Request): string {
  return (req.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || req.headers.get("x-real-ip") || "local";
}

export const tooMany = (retryAfterSec: number) => Response.json({ error: "rate_limited" }, { status: 429, headers: { "Retry-After": String(retryAfterSec) } });
