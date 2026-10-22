import { AddToCart } from "./AddToCart";
import { GardenArt, gardenRatio } from "./GardenArt";
import { PhotoGallery } from "./PhotoGallery";
import type { Locale } from "@/lib/types";

/** Product pictures (real photos if the admin added them, else the illustration) and the buy button. */
export function ProductBuy({ slug, colors, locale, photos = [], alt = "", preview = false }: { slug: string; colors: string[]; locale: Locale; photos?: string[]; alt?: string; preview?: boolean }) {
  return (
    <>
      {photos.length > 0 ? (
        <PhotoGallery photos={photos} alt={alt} />
      ) : (
        <div className="overflow-hidden rounded-[2rem] border border-line" style={{ aspectRatio: gardenRatio(colors.length) }}>
          <GardenArt colors={colors} />
        </div>
      )}
      {!preview && <div className="mt-5"><AddToCart slug={slug} locale={locale} /></div>}
    </>
  );
}
