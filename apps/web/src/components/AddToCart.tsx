"use client";

import { useState } from "react";
import Link from "next/link";
import { dict } from "@/lib/i18n";
import { glazeColor, glazes, type Glaze } from "@/lib/shop-calc";
import type { Locale } from "@/lib/types";
import { useCart } from "./CartProvider";

export function AddToCart({ slug, locale, onGlaze }: { slug: string; locale: Locale; onGlaze?: (g: Glaze) => void }) {
  const { add } = useCart();
  const [glaze, setGlaze] = useState<Glaze>("sage");
  const [done, setDone] = useState(false);

  return (
    <div>
      <fieldset>
        <legend className="mb-2 font-semibold">{dict.glaze[locale]}: {dict[`glaze_${glaze}` as "glaze_sage"][locale]}</legend>
        <div className="flex gap-3">
          {glazes.map((g) => (
            <label key={g} className="relative cursor-pointer">
              <input type="radio" name="glaze" value={g} checked={glaze === g} className="peer sr-only" onChange={() => { setGlaze(g); onGlaze?.(g); }} />
              <span className="block h-11 w-11 rounded-full border-2 border-line peer-checked:border-leaf peer-checked:ring-2 peer-checked:ring-leaf peer-focus-visible:outline peer-focus-visible:outline-2" style={{ background: glazeColor[g] }} />
              <span className="sr-only">{dict[`glaze_${g}` as "glaze_sage"][locale]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <button
        type="button"
        className="btn btn-primary mt-5 w-full sm:w-auto"
        onClick={() => { add(slug, glaze); setDone(true); window.setTimeout(() => setDone(false), 4000); }}
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
