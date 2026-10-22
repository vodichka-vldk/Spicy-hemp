import { AddToCart } from "./AddToCart";
import { GardenArt, gardenRatio } from "./GardenArt";
import type { Locale } from "@/lib/types";

/** Product picture and the buy button (one pot style for everything, no glaze choice). */
export function ProductBuy({ slug, colors, locale }: { slug: string; colors: string[]; locale: Locale }) {
  return (
    <>
      <div className="overflow-hidden rounded-[2rem] border border-line" style={{ aspectRatio: gardenRatio(colors.length) }}>
        <GardenArt colors={colors} />
      </div>
      <div className="mt-5"><AddToCart slug={slug} locale={locale} /></div>
    </>
  );
}
