// Social share image helpers (Open Graph / X cards). A page with its own real
// artwork shares that; anything else shares the generated, branded default
// card at /og (src/app/og/route.tsx). Next.js merges page metadata with the
// root layout's shallowly, so any page that sets its own `openGraph` must
// pass `images` explicitly or it silently loses the default card.

export const DEFAULT_SHARE_IMAGE = {
  url: "/og",
  width: 1200,
  height: 630,
  alt: "Big Red Creative Productions",
};

type ShareableImage = { src: string; alt: string; type?: "image" | "video" } | undefined;

// A video can't be a share image, and its poster isn't always resolved, so
// video heroes fall back to the default card.
export function shareImagesFor(image: ShareableImage) {
  if (!image || image.type === "video" || !image.src) return [DEFAULT_SHARE_IMAGE];
  return [{ url: image.src, alt: image.alt }];
}
