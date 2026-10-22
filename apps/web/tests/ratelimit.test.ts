import { beforeEach, describe, expect, it } from "vitest";
import { clearAll, hit } from "@/lib/ratelimit";

const L = { max: 3, windowMs: 1000 };
beforeEach(() => clearAll());

describe("rate limiter", () => {
  it("allows up to max hits in the window, then refuses with a retry time", () => {
    expect([1, 2, 3].map((i) => hit("k", L, 1000 + i).ok)).toEqual([true, true, true]);
    const r = hit("k", L, 1500);
    expect(r.ok).toBe(false);
    expect(r.retryAfterSec).toBeGreaterThanOrEqual(1);
  });
  it("frees up as the window slides", () => {
    hit("k", L, 1000); hit("k", L, 1100); hit("k", L, 1200);
    expect(hit("k", L, 1300).ok).toBe(false);
    expect(hit("k", L, 2101).ok).toBe(true);
  });
  it("keys are independent and peek does not count", () => {
    for (let i = 0; i < 3; i++) hit("a", L, 1000);
    expect(hit("b", L, 1000).ok).toBe(true);
    clearAll();
    for (let i = 0; i < 10; i++) hit("p", L, 1000, true);
    expect(hit("p", L, 1000).ok).toBe(true);
  });
});
