import type { CartItem } from "./cart";

export const TEMPORARY_SHIPPING_NOTICE = "Shipping is estimated from the items ordered and is subject to change for quantity, size, destination, or special packaging. We confirm the final shipping fee before payment. Free pickup by appointment; digital delivery is free.";

type ShippingItem = Pick<CartItem, "productType" | "productSlug" | "quantity">;

// Temporary business pricing, not a carrier quote or a measured parcel rate.
// Charge one tier per order, never one fee per item. Unknown physical items
// use the larger tier and remain subject to review.
export function temporaryShippingEstimate(items: ShippingItem[]): number {
  const physical = items.filter((item) => item.productType === "physical");
  if (!physical.length) return 0;
  const small = /(?:^|-)(?:stickers?|labels?|cards?|keychains?|decals?)(?:-|$)/;
  const units = physical.reduce((sum, item) => sum + item.quantity, 0);
  return units <= 4 && physical.every((item) => small.test(item.productSlug)) ? 1500 : 2500;
}
