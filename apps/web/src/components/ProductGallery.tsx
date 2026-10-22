"use client";

import { useState } from "react";
import { PotArt } from "./PotArt";
import { AddToCart } from "./AddToCart";
import type { Glaze } from "@/lib/shop-calc";
import type { Locale } from "@/lib/types";

/** Product visual follows the chosen glaze; sets show all their herbs side by side. */
export function ProductBuy({ slug, colors, locale }: { slug: string; colors: string[]; locale: Locale }) {
  const [glaze, setGlaze] = useState<Glaze>("sage");
  return (
    <>
      <div className={`overflow-hidden rounded-[2rem] border border-line ${colors.length > 1 ? "grid grid-cols-3" : ""}`}>
        {colors.map((c, i) => (<div key={i} className="aspect-square"><PotArt color={c} glaze={glaze} /></div>))}
      </div>
      <div className="mt-6"><AddToCart slug={slug} locale={locale} onGlaze={setGlaze} /></div>
    </>
  );
}
