"use client";

import { useCart } from "./CartProvider";

export function CartBadge() {
  const { count, ready } = useCart();
  if (!ready || count === 0) return null;
  return (
    <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-clay px-1.5 text-xs font-bold text-clay-ink" aria-label={`${count}`}>
      {count}
    </span>
  );
}
