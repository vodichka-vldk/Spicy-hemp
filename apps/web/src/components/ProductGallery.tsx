import { GardenArt, gardenRatio } from "./GardenArt";
import { PhotoGallery } from "./PhotoGallery";

/** Product picture: the admin's photos if there are any, else the illustration. */
export function ProductImage({ colors, photos = [], alt = "" }: { colors: string[]; photos?: string[]; alt?: string }) {
  if (photos.length > 0) return <PhotoGallery photos={photos} alt={alt} />;
  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)]" style={{ aspectRatio: gardenRatio(colors.length) }}>
      <GardenArt colors={colors} />
    </div>
  );
}
