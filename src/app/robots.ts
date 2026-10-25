import type { MetadataRoute } from "next";

import { env } from "@/lib/env";

/** Private or per-visitor pages: nothing to index there. */
const PRIVATE_PATHS = ["/admin", "/api/", "/cuenta", "/carrito", "/checkout", "/pedidos/"];

export default function robots(): MetadataRoute.Robots {
  // Vercel previews (VERCEL_ENV "preview"/"development") must never show up in search results.
  if (env.VERCEL_ENV && env.VERCEL_ENV !== "production") {
    return { rules: { userAgent: "*", disallow: "/" } };
  }
  return {
    rules: { userAgent: "*", allow: "/", disallow: PRIVATE_PATHS },
    sitemap: new URL("/sitemap.xml", env.SITE_URL).toString(),
  };
}
