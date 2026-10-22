"use client";

import { useState } from "react";
import Link from "next/link";
import { dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { useCart } from "./CartProvider";

export function AddToCart({ slug, locale }: { slug: string; locale: Locale }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);

  return (
    <div>
      <button
        type="button"
        className="btn btn-primary w-full sm:w-auto"
        onClick={() => { add(slug, "sage"); setDone(true); window.setTimeout(() => setDone(false), 4000); }}
      >
        🛒 {dict.add_to_cart[locale]}
      </button>
      <div aria-live="polite" className="mt-3 min-h-6 text-sm">
        {done && (
          <span className="text-leaf">
            ✓ {dict.added[locale]} · <Link href={`/${locale}/cart`} className="font-semibold underline">{dict.cart_title[locale]}</Link>
          </span>
        )}
      </div>
    </div>
  );
}
