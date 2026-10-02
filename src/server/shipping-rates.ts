import "server-only";
import { z } from "zod";
import { packingKey, type ShippingLine, type ShippingRate } from "@/data/shipping";

const parcelSchema = z.object({
  length: z.number().positive().max(108), width: z.number().positive().max(108),
  height: z.number().positive().max(108), weight: z.number().positive().max(150),
  distance_unit: z.literal("in"), mass_unit: z.literal("lb"),
});
const originSchema = z.object({
  name: z.string().min(1), street1: z.string().min(1), street2: z.string().optional(),
  city: z.string().min(1), state: z.string().length(2), zip: z.string().regex(/^\d{5}(?:-\d{4})?$/),
  country: z.literal("US"), phone: z.string().min(1), email: z.string().email(),
});
const responseSchema = z.object({ mode: z.enum(["test", "production"]), rates: z.array(z.object({
  carrier: z.string().min(1), service: z.string().min(1), mode: z.enum(["test", "production"]), rate: z.string().regex(/^\d+\.\d{2}$/), currency: z.string(),
  delivery_days: z.number().int().positive().nullable().optional(),
})) });

export async function getShippingRates(lines: ShippingLine[], zip: string): Promise<ShippingRate[] | null> {
  const token = process.env.EASYPOST_API_KEY;
  if (!token?.trim() || process.env.EASYPOST_MODE !== "production") return null;
  let origin: z.infer<typeof originSchema>;
  let parcel: z.infer<typeof parcelSchema>;
  try {
    origin = originSchema.parse(JSON.parse(process.env.SHIPPING_ORIGIN_JSON ?? "null"));
    const profiles = z.record(z.string(), parcelSchema).parse(JSON.parse(process.env.SHIPPING_PACKING_PROFILES_JSON ?? "{}"));
    const profile = profiles[packingKey(lines)];
    if (!profile) return null;
    parcel = profile;
  } catch { return null; }
  // EasyPost uses inches/ounces at one decimal. Round UP to avoid under-rating.
  const roundUpTenth = (value: number) => Math.ceil(value * 10) / 10;
  // Rates only. Never creates a transaction, label purchase or payment.
  const response = await fetch("https://api.easypost.com/v2/shipments", {
    method: "POST", headers: { Authorization: `Basic ${Buffer.from(`${token}:`).toString("base64")}`, "Content-Type": "application/json" },
    body: JSON.stringify({ shipment: { from_address: origin, to_address: { zip, country: "US", residential: true }, parcel: { length: roundUpTenth(parcel.length), width: roundUpTenth(parcel.width), height: roundUpTenth(parcel.height), weight: roundUpTenth(parcel.weight * 16) } } }),
    signal: AbortSignal.timeout(15000), cache: "no-store",
  });
  if (!response.ok) throw new Error("Shipping provider unavailable");
  const parsed = responseSchema.parse(await response.json());
  if (parsed.mode !== "production") return null;
  return parsed.rates.filter((rate) => rate.currency === "USD" && rate.mode === "production")
    .map((rate) => ({ carrier: rate.carrier, service: rate.service,
      cents: Math.round(Number(rate.rate) * 100), estimatedDays: rate.delivery_days ?? null }))
    .filter((rate) => Number.isSafeInteger(rate.cents) && rate.cents > 0)
    .sort((a, b) => a.cents - b.cents).slice(0, 10);
}
