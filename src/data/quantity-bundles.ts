import type { Product } from "./products";

export type QuantityBundle = { quantity: number; totalPrice: number };

// These are existing advertised offers, not new discounts. Only enable
// them while the published base price and note still match, so an admin
// price change cannot silently retain an obsolete offer.
const advertisedOffers = [
  { slug: "3d-printed-keychain", basePrice: 800, note: "1 for $8; 5 for $30; 10 for $50.", bundles: [{ quantity: 5, totalPrice: 3000 }, { quantity: 10, totalPrice: 5000 }] },
  { slug: "custom-acrylic-keychain", basePrice: 800, note: "$8 single; 10 for $60; 25 for $125.", bundles: [{ quantity: 10, totalPrice: 6000 }, { quantity: 25, totalPrice: 12500 }] },
  { slug: "social-media-graphic", basePrice: 4000, note: "Single graphic $40; package of 5 for $150.", bundles: [{ quantity: 5, totalPrice: 15000 }] },
];

export function getQuantityBundles(product: Product): QuantityBundle[] | undefined {
  const offer = advertisedOffers.find(o => o.slug === product.slug);
  if (!offer || product.pricing.mode !== "fixed-price" || product.pricing.basePrice !== offer.basePrice
    || product.packages?.length || !product.pricing.pricingNote?.includes(offer.note)) return undefined;
  return [{ quantity: 1, totalPrice: offer.basePrice }, ...offer.bundles];
}

export function isValidQuantityBundles(value: unknown): value is QuantityBundle[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 10
    && value.some(b => b?.quantity === 1)
    && value.every(b => b && Number.isSafeInteger(b.quantity) && b.quantity >= 1 && b.quantity <= 100000
      && Number.isSafeInteger(b.totalPrice) && b.totalPrice >= 0);
}

// Find the lowest cost using the published bundles plus singles. This
// handles leftovers and combined bundles without inventing new tiers.
export function bundleSubtotal(quantity: number, bundles: QuantityBundle[]): number {
  const costs = new Float64Array(quantity + 1);
  for (let count = 1; count <= quantity; count++) {
    costs[count] = Infinity;
    for (const bundle of bundles) {
      if (bundle.quantity <= count) costs[count] = Math.min(costs[count], costs[count - bundle.quantity] + bundle.totalPrice);
    }
  }
  return costs[quantity];
}
