import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/server/queries/site-content";
export default async function robots(): Promise<MetadataRoute.Robots> {
  const { canonicalUrl } = await getSiteSettings();
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin/", "/api/", "/cart", "/checkout"] },
    sitemap: new URL("/sitemap.xml", canonicalUrl).href,
  };
}
