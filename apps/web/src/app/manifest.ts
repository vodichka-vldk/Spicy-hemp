import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spicy Hemp",
    short_name: "Spicy Hemp",
    description: "Handmade pots with living herbs and a digital passport",
    start_url: "/",
    display: "standalone",
    background_color: "#faf7f0",
    theme_color: "#1f5a43",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
