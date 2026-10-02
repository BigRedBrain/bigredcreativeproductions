"use client";
import { useState } from "react";
import type { CartItem } from "@/data/cart";
import { formatMoney } from "@/data/money";
import { temporaryShippingEstimate, TEMPORARY_SHIPPING_NOTICE } from "@/data/temporary-shipping";

export default function ShippingCalculator({ items }: { items: CartItem[] }) {
  const [method, setMethod] = useState("ship");
  const estimate = temporaryShippingEstimate(items);
  if (!estimate) return <section className="shipping-calculator"><p>Digital services and artwork are delivered electronically at no shipping charge.</p></section>;
  return <section className="shipping-calculator" aria-labelledby="shipping-title">
    <h2 id="shipping-title">Delivery and pickup</h2>
    <p>Shipping starts at $15 for small printed items, labels, stickers, cards, and keychains. Larger items, other physical products, or orders with more than four physical units start at $25. One shipping estimate per order.</p>
    <label><input type="radio" name="estimate-delivery" checked={method === "ship"} onChange={() => setMethod("ship")} />Shipping — item-based estimate</label>
    <label><input type="radio" name="estimate-delivery" checked={method === "pickup"} onChange={() => setMethod("pickup")} />Free pickup by appointment</label>
    <p role="status" aria-live="polite">{method === "ship" ? `Estimated shipping for these items: ${formatMoney(estimate)}` : "Pickup: $0. We share pickup instructions when your order is ready."}</p>
    <p>{TEMPORARY_SHIPPING_NOTICE}</p>
    <p>Include shipping or pickup in your checkout notes. This estimate is separate from your product subtotal; your order is reviewed before payment.</p>
  </section>;
}
