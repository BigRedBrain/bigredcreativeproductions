import { ImageResponse } from "next/og";
import { siteConfig } from "@/config/site";
import { getSiteSettings } from "@/server/queries/site-content";
import { getPublishedBrandTokens } from "@/server/queries/brand";

// The default social share card (Open Graph / X) — the picture that shows
// up when a link to the site is posted on Instagram, Facebook, LinkedIn,
// iMessage, etc. Pages with their own real artwork (a service/project hero,
// a product's primary image) use that instead; every other page falls back
// to this. Typographic on purpose, matching the site's own split-word
// .project-art treatment rather than a stock or generated photo.
//
// Name, tagline, domain and colors all come from the same published,
// admin-managed settings the site itself renders, with the code-owned
// defaults as a fallback, so the card can never fail to render.

const SIZE = { width: 1200, height: 630 };

// Same values as globals.css :root — used only if the database is
// unreachable.
const FALLBACK = {
  siteName: siteConfig.name,
  tagline: "Branding · Print · Promotions · Events",
  canonicalUrl: siteConfig.url,
  red: "#D71920",
  cream: "#EFE9DF",
  ink: "#0B0B0B",
};

async function loadCardContent() {
  try {
    const [settings, brand] = await Promise.all([getSiteSettings(), getPublishedBrandTokens()]);
    return {
      siteName: settings.siteName,
      tagline: settings.tagline,
      canonicalUrl: settings.canonicalUrl,
      red: brand.primaryColor,
      cream: brand.backgroundColor,
      ink: brand.textColor,
    };
  } catch {
    return FALLBACK;
  }
}

export const revalidate = 3600;

export async function GET() {
  const content = await loadCardContent();
  const domain = new URL(content.canonicalUrl).host.replace(/^www\./, "");
  const words = content.siteName.toUpperCase().split(/\s+/);

  // next/og ships only a regular-weight font; a tight same-color text-shadow
  // thickens the strokes so the headline reads with the brand's heavy weight.
  const heavy = (color: string) => `1.5px 0 0 ${color}, -1.5px 0 0 ${color}, 0 1.5px 0 ${color}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: content.cream,
          color: content.ink,
          border: `16px solid ${content.ink}`,
          padding: "44px 60px 52px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "flex-end", fontSize: 26, letterSpacing: 2 }}>
          {domain}
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {words.map((word, index) => {
            const color = index === 0 ? content.red : content.ink;
            return (
              <div
                key={`${word}-${index}`}
                style={{ fontSize: 92, lineHeight: 0.95, letterSpacing: -1, color, textShadow: heavy(color) }}
              >
                {word}
              </div>
            );
          })}
        </div>
        <div style={{ display: "flex" }}>
          <div
            style={{
              display: "flex",
              background: content.red,
              color: "#FFFFFF",
              fontSize: 26,
              letterSpacing: 3,
              padding: "12px 22px",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            {content.tagline}
          </div>
        </div>
      </div>
    ),
    SIZE,
  );
}
