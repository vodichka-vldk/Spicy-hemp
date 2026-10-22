import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/payments";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/p/", "/uk/cart", "/en/cart", "/uk/checkout", "/en/checkout", "/uk/order", "/en/order"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
