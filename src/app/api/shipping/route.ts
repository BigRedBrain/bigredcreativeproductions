import { NextResponse } from "next/server";
import { z } from "zod";
import { validateSameOriginRequest } from "@/server/validate-origin";
import { checkAndRecordRateLimit, extractClientIp, hashIpForRateLimit } from "@/server/rate-limit";
import { getAuthoritativeProduct } from "@/server/product-source";
import { verifyConfigurationAgainstProduct } from "@/server/verify-configuration";
import { getShippingRates } from "@/server/shipping-rates";
import type { ShippingLine } from "@/data/shipping";

const schema = z.object({ zip: z.string().regex(/^\d{5}(?:-\d{4})?$/), lines: z.array(z.object({
  productId: z.string().min(1).max(200), quantity: z.number().int().min(1).max(100000),
  selectedPackageSlug: z.string().max(200).optional(),
  selectedOptionValues: z.record(z.string().max(200), z.string().max(200)),
  selectedAddOnSlugs: z.array(z.string().max(200)).max(30),
})).min(1).max(50) });

export async function POST(request: Request) {
  if (!validateSameOriginRequest(request).ok) return NextResponse.json({ error: "Invalid origin." }, { status: 403 });
  try {
    const ip = extractClientIp(request.headers);
    const key = ip ? hashIpForRateLimit(ip) : null;
    if (!key) throw new Error("Limiter unavailable");
    const limit = await checkAndRecordRateLimit([{ scope: "shipping_quote_ip", key }]);
    if (!limit.allowed) return NextResponse.json({ error: "Please try again later." }, { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } });
    const text = await request.text();
    if (text.length > 20000) return NextResponse.json({ error: "Request too large." }, { status: 413 });
    const parsed = schema.safeParse(JSON.parse(text));
    if (!parsed.success) return NextResponse.json({ error: "Invalid shipping request." }, { status: 400 });
    const physical: ShippingLine[] = [];
    for (const line of parsed.data.lines) {
      const product = await getAuthoritativeProduct(line.productId);
      if (!product || product.status !== "published" || verifyConfigurationAgainstProduct(product, line)) {
        return NextResponse.json({ error: "Please refresh your product selections." }, { status: 400 });
      }
      if (product.productType === "physical") physical.push(line);
    }
    if (!physical.length) return NextResponse.json({ status: "digital", rates: [] }, { headers: { "Cache-Control": "no-store" } });
    const rates = await getShippingRates(physical, parsed.data.zip);
    return NextResponse.json({ status: rates?.length ? "quoted" : "manual", rates: rates ?? [] }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Shipping estimate unavailable. Request a quote with your order." }, { status: 503 });
  }
}
