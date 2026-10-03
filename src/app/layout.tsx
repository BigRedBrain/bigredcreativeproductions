import type { Metadata } from "next";
import "./globals.css";
import { CartProvider } from "@/components/CartProvider";
import { getSiteSettings } from "@/server/queries/site-content";
import { DEFAULT_SHARE_IMAGE } from "@/data/share-image";

// Database-backed as of Phase 14 (was a static object) — this is what
// lets an admin-edited site name/meta title/description/canonical URL/OG
// description take effect without a redeploy. getSiteSettings() is
// field-level-fallback-safe against src/config/site.ts, so this can never
// render blank metadata even if the DB row is incomplete.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  return {
    title: settings.metaTitle,
    description: settings.metaDescription,
    metadataBase: new URL(settings.canonicalUrl),
    openGraph: {
      title: settings.siteName,
      description: settings.ogDescription,
      type: "website",
      // Phase 22 — settings.ogImageSrc was already fetched here (same
      // getSiteSettings() call) but never wired into the returned
      // metadata. No new query, no new admin field, no new source of
      // truth — site_settings.ogImageSrc remains exactly as
      // admin-editable as before; this is purely the missing connection.
      // No admin-set share image → the generated, branded default card.
      images: settings.ogImageSrc ? [{ url: settings.ogImageSrc }] : [DEFAULT_SHARE_IMAGE],
    },
    twitter: { card: "summary_large_image" },
  };
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}