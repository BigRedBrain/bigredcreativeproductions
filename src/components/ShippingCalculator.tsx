"use client";
import { useState, type FormEvent } from "react";
import type { CartItem } from "@/data/cart";
import { shippingCopy as copy, type ShippingRate } from "@/data/shipping";

export default function ShippingCalculator({ items }: { items: CartItem[] }) {
  const [method, setMethod] = useState("pickup");
  const [zip, setZip] = useState("");
  const [result, setResult] = useState<{ key: string; rates: ShippingRate[]; message: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const lines = items.map((item) => ({ productId: item.productId, quantity: item.quantity,
    selectedPackageSlug: item.selectedPackage?.packageSlug,
    selectedOptionValues: Object.fromEntries(item.selectedOptions.map((option) => [option.optionKey, option.value])),
    selectedAddOnSlugs: item.selectedAddOns.map((addOn) => addOn.addOnSlug),
  }));
  const key = JSON.stringify({ lines, zip });
  const current = result?.key === key ? result : null;
  async function calculate(event: FormEvent) {
    event.preventDefault(); setBusy(true); setResult(null);
    try {
      const response = await fetch("/api/shipping", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ zip, lines }) });
      const data = await response.json();
      setResult({ key, rates: response.ok && data.status === "quoted" ? data.rates : [],
        message: !response.ok ? copy.failure : data.status === "digital" ? copy.digital : data.status === "quoted" ? "" : copy.unavailable });
    } catch { setResult({ key, rates: [], message: copy.failure }); }
    finally { setBusy(false); }
  }
  if (!items.some((item) => item.productType === "physical")) return <section className="shipping-calculator"><p>{copy.digital}</p></section>;
  return <section className="shipping-calculator" aria-labelledby="shipping-title">
    <h2 id="shipping-title">{copy.title}</h2>
    <p>{copy.selectionNotice}</p>
    <label><input type="radio" name="estimate-delivery" checked={method === "pickup"} onChange={() => setMethod("pickup")} />{copy.pickup}</label>
    <label><input type="radio" name="estimate-delivery" checked={method === "ship"} onChange={() => setMethod("ship")} />{copy.ship}</label>
    {method === "pickup" ? <p>{copy.pickupDetails}</p> : <>
      <form onSubmit={calculate}><label htmlFor="shipping-zip">{copy.zip}</label>
        <input id="shipping-zip" autoComplete="postal-code" inputMode="numeric" pattern="[0-9]{5}(-[0-9]{4})?" required value={zip} maxLength={10} onChange={(event) => setZip(event.target.value)} />
        <p>{copy.consent}</p><button type="submit" disabled={busy}>{busy ? copy.loading : copy.calculate}</button>
      </form>
      <div role="status" aria-live="polite">{current?.message}
        {current?.rates.length ? <ul>{current.rates.map((rate, index) => <li key={index}>
          {rate.carrier} · {rate.service}: {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(rate.cents / 100)}
          {rate.estimatedDays ? ` · estimated ${rate.estimatedDays} transit days` : ""}
        </li>)}</ul> : null}
      </div><p>{copy.notice}</p>
    </>}
  </section>;
}
