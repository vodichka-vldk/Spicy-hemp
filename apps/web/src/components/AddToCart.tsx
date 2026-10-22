"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, Icon } from "@/ds";
import { dict } from "@/lib/i18n";
import type { Locale } from "@/lib/types";
import { useCart } from "./CartProvider";

export function AddToCart({ slug, locale }: { slug: string; locale: Locale }) {
  const { add } = useCart();
  const [done, setDone] = useState(false);

  return (
    <div>
      <Button variant="accent" size="lg" icon="shopping-cart" onClick={() => { add(slug, "sage"); setDone(true); window.setTimeout(() => setDone(false), 4000); }}>
        {dict.add_to_cart[locale]}
      </Button>
      <div aria-live="polite" className="mt-3 min-h-6 text-sm">
        {done && (
          <span className="inline-flex items-center gap-1 text-leaf">
            <Icon name="check" size={16} /> {dict.added[locale]} · <Link href={`/${locale}/cart`} className="font-semibold underline">{dict.cart_title[locale]}</Link>
          </span>
        )}
      </div>
    </div>
  );
}
