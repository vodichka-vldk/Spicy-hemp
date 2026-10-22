import type { NextConfig } from "next";

const security = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
];

const config: NextConfig = {
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
  async headers() {
    return [
      // everything except the Mini App may not be framed; Telegram opens /app inside its own webview
      { source: "/((?!app).*)", headers: [...security, { key: "X-Frame-Options", value: "DENY" }] },
      { source: "/app", headers: security },
      { source: "/admin/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
};

export default config;
