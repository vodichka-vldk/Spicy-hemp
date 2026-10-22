import type { Review } from "./store/types";

/** Mean rating rounded to one decimal, or null when there are no reviews. */
export function averageRating(reviews: Pick<Review, "rating">[]): number | null {
  if (reviews.length === 0) return null;
  return Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10;
}

/** Public URL of a review photo (bucket "reviews" is public; objects get there only after approval). */
export function reviewPhotoUrl(path: string): string | null {
  const base = process.env.SUPABASE_URL?.replace(/\/$/, "");
  if (!base || path.includes("..")) return null;
  return `${base}/storage/v1/object/public/reviews/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** Only reviews the author agreed to publish and an admin approved may be shown. */
export const isPublic = (r: Pick<Review, "status" | "consentPublic">) => r.status === "approved" && r.consentPublic;
