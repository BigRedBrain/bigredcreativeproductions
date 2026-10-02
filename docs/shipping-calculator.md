# Shipping estimates

The cart offers free appointment pickup and a US destination ZIP calculator.
Pickup instructions are shared when ready. This estimates rates only: it does
not buy labels, add shipping to payment totals, save the delivery choice, or
claim a production date. Customers enter their preference in checkout notes;
final shipping is confirmed separately before fulfillment.

## Secure configuration

Set EASYPOST_API_KEY (production EasyPost API key), EASYPOST_MODE=production, SHIPPING_ORIGIN_JSON and
SHIPPING_PACKING_PROFILES_JSON as server-only Vercel environment variables.
Never put secrets in chat, committed files or NEXT_PUBLIC variables.

Origin JSON contains name, street1, optional street2, city, two-letter state,
ZIP, country US, phone and email. Confirm the business shipping origin before
sending it to EasyPost. The calculator sends destination ZIP, origin and parcel
details to EasyPost only when Calculate is pressed.

Each packing profile covers one exact physical cart configuration, packed in
ONE measured parcel. Its key is packingKey(lines) from src/data/shipping.ts.
Lines contain productId, quantity, selectedPackageSlug, selectedOptionValues,
and selectedAddOnSlugs. The parcel value contains numeric length, width,
height (inches), weight (pounds), distance_unit in and mass_unit lb.

Measure the finished packed parcel, including protective material. Never
substitute item dimensions or guessed weights. Quantity, size, package,
add-on and cart changes require their own measured profile. Service lines are
excluded. Multi-parcel, international and unknown configurations require a
manual quote. Provider rates have no added markup. Test-mode rates are not
presented as real prices. Missing or invalid configuration never returns a
fabricated zero shipping charge.

Rates are sorted by cost with available carrier transit estimates. Transit is
separate from production. Origin/credentials are not returned to the browser.
The endpoint checks origin, authoritative product/configuration and a shared
atomic database IP rate limit (5 per five minutes, 20 per hour). Missing
limiter infrastructure fails closed. Existing order/payment calculations are
unchanged.

## Launch checks

Configure measured profiles and live provider account, publish the code,
compare a real cart estimate with the provider dashboard, confirm absence of
label transactions, and check mobile, ZIP errors, changed cart/ZIP, unavailable
profiles, carrier failure, digital delivery and free pickup. A complete local
Next build additionally needs the repository's preview DATABASE_URL.

Packed profile weights remain in pounds and are converted to ounces for EasyPost.
Both shipment and rate response modes must be production; test responses are hidden.
API keys do not require an invented prefix check. Only the shipments endpoint is
called; the label purchase endpoint is never called.
