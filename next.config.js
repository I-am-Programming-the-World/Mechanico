/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";
import { env } from "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    const imgSrc = [
      "'self'",
      "data:",
      "blob:",
      "https://api.mapbox.com",
      "https://*.tiles.mapbox.com",
    ];
    if (env.S3_PUBLIC_URL_BASE) {
      try {
        const origin = new URL(env.S3_PUBLIC_URL_BASE).origin;
        imgSrc.push(origin);
      } catch {
        // ignore invalid URL
      }
    }

    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "geolocation=(self)" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' https://api.mapbox.com https://cdnjs.cloudflare.com",
              "style-src 'self' 'unsafe-inline' https://api.mapbox.com https://fonts.googleapis.com",
              `img-src ${imgSrc.join(" ")}`,
              "font-src 'self' https://fonts.gstatic.com",
              "connect-src 'self' https://api.mapbox.com https://events.mapbox.com ws: wss:",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
        ],
      },
    ];
  },
};

export default config;
