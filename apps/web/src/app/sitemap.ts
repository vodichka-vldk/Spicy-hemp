import type { MetadataRoute } from "next";
import { infoPages } from "@/data/pages";
import { getFamilies, getHerbs } from "@/lib/content";
import { locales } from "@/lib/i18n";
import { siteUrl } from "@/lib/payments";
import { loadPublicProducts } from "@/lib/catalog-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const products = await loadPublicProducts();
  const base = siteUrl();
  const paths = [
    "",
    "/plants",
    "/shop",
    "/guides",
    ...Object.keys(infoPages).map((p) => `/${p}`),
    ...getHerbs().map((h) => `/plants/${h.slug}`),
    ...getFamilies().map((f) => `/families/${f.slug}`),
    ...products.map((p) => `/shop/${p.slug}`),
  ];
  return locales.flatMap((l) =>
    paths.map((p) => ({
      url: `${base}/${l}${p}`,
      alternates: { languages: Object.fromEntries(locales.map((x) => [x, `${base}/${x}${p}`])) },
    })),
  );
}
