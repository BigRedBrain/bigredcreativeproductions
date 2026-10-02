import type { MetadataRoute } from "next";
import { getSiteSettings } from "@/server/queries/site-content";
import { getPublishedProducts } from "@/server/queries/catalog";
import { getPublishedServices } from "@/server/queries/services";
import { getPublishedProjects } from "@/server/queries/portfolio";
export const revalidate = 3600;
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [settings, products, services, projects] = await Promise.all([
    getSiteSettings(), getPublishedProducts(), getPublishedServices(), getPublishedProjects(),
  ]);
  return ["/", "/store", ...products.map(p => `/store/${encodeURIComponent(p.slug)}`),
    ...services.map(s => `/services/${encodeURIComponent(s.slug)}`),
    ...projects.map(p => `/work/${encodeURIComponent(p.slug)}`)]
    .map(path => ({ url: new URL(path, settings.canonicalUrl).href }));
}
