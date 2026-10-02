export const shippingCopy = {
  title: "Delivery and pickup",
  selectionNotice: "This is an estimate tool. Include your preferred delivery or pickup option in your checkout notes; we confirm it with your order.",
  pickup: "Free pickup by appointment",
  pickupDetails: "We share pickup instructions when your order is ready. Production timing is confirmed per order after written proof approval.",
  ship: "Shipping — estimate carrier rates",
  zip: "Destination ZIP code (United States)",
  calculate: "Calculate shipping",
  loading: "Getting carrier rates…",
  notice: "Estimates are separate from the cart subtotal. Final shipping and delivery details are confirmed before fulfillment. Carrier transit time starts after production; it is not a production promise.",
  consent: "Calculating sends your destination ZIP and package details to EasyPost for carrier rates.",
  unavailable: "Shipping needs a confirmed package size and weight. Request a shipping quote with your order.",
  digital: "Digital services and artwork are delivered electronically at no shipping charge.",
  failure: "We could not calculate shipping. Please request a shipping quote with your order.",
};

export type ShippingLine = {
  productId: string;
  quantity: number;
  selectedPackageSlug?: string;
  selectedOptionValues: Record<string, string>;
  selectedAddOnSlugs: string[];
};
export type ShippingRate = { carrier: string; service: string; cents: number; estimatedDays: number | null };

// A packing profile covers an EXACT whole physical cart, including quantity,
// options and add-ons. No guessed weights, per-unit scaling or box merging.
export function packingKey(lines: ShippingLine[]): string {
  return JSON.stringify(lines.map((line) => ({
    productId: line.productId,
    quantity: line.quantity,
    selectedPackageSlug: line.selectedPackageSlug ?? "",
    selectedOptionValues: Object.entries(line.selectedOptionValues).sort(([a], [b]) => a.localeCompare(b)),
    selectedAddOnSlugs: [...line.selectedAddOnSlugs].sort(),
  })).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))));
}
