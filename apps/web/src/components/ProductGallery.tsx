"use client";

import { useState } from "react";
import { AddToCart } from "./AddToCart";
import { GardenArt, gardenRatio } from "./GardenArt";
import type { Glaze } from "@/lib/shop-calc";
import type { Locale } from "@/lib/types";

/** Product picture (follows the chosen glaze for single pots) and the buy button. Baskets are wicker: no glaze choice. */
export function ProductArt({ colors, glaze, ratio }: { colors: string[]; glaze?: Glaze; ratio?: string }) {
  return (
    <div className="overflow-hidden rounded-[2rem] border border-line" style={{ aspectRatio: ratio ?? gardenRatio(colors.length) }}>
      <GardenArt colors={colors} glaze={glaze} />
    </div>
  );
}

export function ProductBuy({ slug, colors, locale, basket }: { slug: string; colors: string[]; locale: Locale; basket: boolean }) {
  const [glaze, setGlaze] = useState<Glaze>("sage");
  return (
    <>
      <ProductArt colors={colors} glaze={basket ? undefined : glaze} />
      <div className="mt-5"><AddToCart slug={slug} locale={locale} onGlaze={setGlaze} withGlaze={!basket} /></div>
    </>
  );
}
