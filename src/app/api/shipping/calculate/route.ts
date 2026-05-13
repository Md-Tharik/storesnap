import { NextRequest, NextResponse } from "next/server";

const INDIA_ONLY_ERROR = "Standard shipping is only available within India.";
const FALLBACK_SHIPPING = 80;
const SERVICEABILITY_TIMEOUT_MS = 3000;

async function getShiprocketToken(): Promise<string> {
  const res = await fetch(
    "https://apiv2.shiprocket.in/v1/external/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.SHIPROCKET_EMAIL,
        password: process.env.SHIPROCKET_PASSWORD,
      }),
    }
  );
  if (!res.ok) throw new Error(`Shiprocket auth failed: ${res.status}`);
  const data = await res.json();
  if (!data.token) throw new Error("Shiprocket auth returned no token");
  return data.token as string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { buyerPincode, sellerPincode, weight } = body as {
    buyerPincode?: string;
    sellerPincode?: string;
    weight?: number;
  };

  if (!buyerPincode || !sellerPincode || weight == null) {
    return NextResponse.json(
      { error: "buyerPincode, sellerPincode, and weight are required." },
      { status: 400 }
    );
  }

  try {
    const token = await getShiprocketToken();

    const url =
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability/` +
      `?pickup_postcode=${encodeURIComponent(sellerPincode)}` +
      `&delivery_postcode=${encodeURIComponent(buyerPincode)}` +
      `&weight=${encodeURIComponent(String(weight))}` +
      `&cod=0`;

    // 3-second hard timeout on the serviceability call
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), SERVICEABILITY_TIMEOUT_MS);

    let srRes: Response;
    try {
      srRes = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timer);
      const isTimeout =
        fetchErr instanceof DOMException && fetchErr.name === "AbortError";
      console.warn(
        `[shipping/calculate] serviceability fetch ${isTimeout ? "timed out" : "failed"}:`,
        fetchErr instanceof Error ? fetchErr.message : fetchErr
      );
      return NextResponse.json(
        { shippingCost: FALLBACK_SHIPPING, isFallback: true }
      );
    }
    clearTimeout(timer);

    // Transient errors (rate-limit or server-side): return a safe fallback rate
    if (srRes.status === 429 || srRes.status >= 500) {
      console.warn("[shipping/calculate] transient Shiprocket error:", srRes.status);
      return NextResponse.json(
        { shippingCost: FALLBACK_SHIPPING, isFallback: true }
      );
    }

    // Definitive non-success (e.g. 400, 404) → destination not serviceable
    if (!srRes.ok) {
      console.warn("[shipping/calculate] serviceability API rejected:", srRes.status);
      return NextResponse.json({ error: INDIA_ONLY_ERROR }, { status: 422 });
    }

    const srData = await srRes.json();
    const couriers: { freight_charge?: number; rate?: number }[] =
      srData?.data?.available_courier_companies ?? [];

    // No couriers → pincode is outside coverage
    if (!couriers.length) {
      return NextResponse.json({ error: INDIA_ONLY_ERROR }, { status: 422 });
    }

    const lowest = Math.min(
      ...couriers.map((c) => Number(c.freight_charge ?? c.rate ?? 999))
    );

    return NextResponse.json({ shippingCost: lowest });
  } catch (err) {
    // Auth failure or other unexpected upstream error → graceful fallback
    console.error(
      "[shipping/calculate] unexpected error:",
      err instanceof Error ? err.message : err
    );
    return NextResponse.json(
      { shippingCost: FALLBACK_SHIPPING, isFallback: true }
    );
  }
}
