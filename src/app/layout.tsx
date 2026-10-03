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
// Search engine ownership verification (Google Search Console, Bing
// Webmaster Tools). Optional: set either variable in Vercel to the token
// the tool gives you and the matching <meta> tag is rendered on every page;
// leave it unset and no tag is rendered. Only needed for the meta-tag
// verification method — DNS verification needs no code at all.
function buildVerification(): Metadata["verification"] {
  const google = process.env.GOOGLE_SITE_VERIFICATION?.trim();
  const bing = process.env.BING_SITE_VERIFICATION?.trim();
  if (!google && !bing) return undefined;
  return {
    ...(google ? { google } : {}),
    ...(bing ? { other: { "msvalidate.01": bing } } : {}),
  };
}

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
    verification: buildVerification(),
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