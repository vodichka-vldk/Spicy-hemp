"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartLine, Glaze } from "@/lib/shop-calc";

type Ctx = {
  lines: CartLine[];
  count: number;
  ready: boolean;
  add: (slug: string, glaze: Glaze, qty?: number) => void;
  setQty: (slug: string, glaze: Glaze, qty: number) => void;
  remove: (slug: string, glaze: Glaze) => void;
  clear: () => void;
};

const KEY = "sh_cart_v1";
const CartCtx = createContext<Ctx | null>(null);

function load(): CartLine[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(parsed) ? parsed.filter((l) => l && typeof l.slug === "string" && l.qty > 0) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLines(load());
    setReady(true);
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) setLines(load()); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const persist = useCallback((next: CartLine[]) => {
    setLines(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode: keep in memory */ }
  }, []);

  const value = useMemo<Ctx>(() => ({
    lines,
    ready,
    count: lines.reduce((n, l) => n + l.qty, 0),
    add: (slug, glaze, qty = 1) => {
      const i = lines.findIndex((l) => l.slug === slug && l.glaze === glaze);
      const next = lines.slice();
      if (i >= 0) next[i] = { ...next[i], qty: Math.min(20, next[i].qty + qty) };
      else next.push({ slug, glaze, qty });
      persist(next);
    },
    setQty: (slug, glaze, qty) =>
      persist(lines.flatMap((l) => (l.slug === slug && l.glaze === glaze ? (qty > 0 ? [{ ...l, qty: Math.min(20, qty) }] : []) : [l]))),
    remove: (slug, glaze) => persist(lines.filter((l) => !(l.slug === slug && l.glaze === glaze))),
    clear: () => persist([]),
  }), [lines, ready, persist]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export function useCart(): Ctx {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
