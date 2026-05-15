import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();

  // Top-level order fields — prices are NOT trusted from client; recomputed from DB below
  const {
    razorpay_payment_id,
    razorpay_order_id,
    razorpay_signature,
    product_id,
    seller_id,
    shipping_paid_by_buyer,
    shipping_address, // { name, email, phone, address_line1, ... }
  } = body;

  // Verify Razorpay payment signature before touching the DB
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const expectedSig = crypto
    .createHmac("sha256", secret)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  if (expectedSig !== razorpay_signature) {
    return NextResponse.json(
      { error: "Payment verification failed. Invalid signature." },
      { status: 400 }
    );
  }

  // Resolve buyer identity + shipping address.
  // Frontend sends: shipping_address: { name, email, phone, address_line1, address_line2, city, state, pincode }
  // Fallback chains guard against any future shape change on the client side.
  const buyer_email: string | null =
    shipping_address?.email ?? body.email ?? null;

  const buyer_name: string | null =
    shipping_address?.name ?? body.name ?? null;

  const buyer_phone: string | null =
    shipping_address?.phone ?? body.phone ?? null;

  // Combine address_line1 + address_line2 into the single text column
  const line1 = (shipping_address?.address_line1 ?? "").trim();
  const line2 = (shipping_address?.address_line2 ?? "").trim();
  const shipping_address_text: string | null =
    line1 || line2 ? [line1, line2].filter(Boolean).join(", ") : null;

  const shipping_city: string | null = shipping_address?.city ?? null;
  const shipping_state: string | null = shipping_address?.state ?? null;
  const shipping_pincode: string | null = shipping_address?.pincode ?? null;

  console.log("[confirm-order] buyer identity resolved:", {
    buyer_email,
    buyer_name,
    buyer_phone,
    shipping_city,
    shipping_pincode,
  });

  // Use service-role client to bypass RLS — guest buyers are unauthenticated
  const supabase = createServiceClient();

  // Validate the product exists and belongs to the claimed seller — never trust client prices
  const { data: dbProduct } = await supabase
    .from("products")
    .select("price, seller_id, is_active")
    .eq("id", product_id)
    .eq("seller_id", seller_id)
    .eq("is_active", true)
    .maybeSingle();

  if (!dbProduct) {
    return NextResponse.json(
      { error: "Product not found or seller mismatch." },
      { status: 400 }
    );
  }

  // Recompute amounts server-side from the real product price
  const realItemPrice = Number(dbProduct.price);
  const realCommission = Math.round((realItemPrice * 3) / 100);
  const realSellerPayout = realItemPrice;
  // shipping_paid_by_buyer comes from client; it was baked into the Razorpay order amount
  const realTotal = realItemPrice + (Number(shipping_paid_by_buyer) || 0) + realCommission;

  // payout_method and payout_eligible_at are overridden by the DB trigger process_order_rules()
  const { data: inserted, error } = await supabase
    .from("orders")
    .insert({
      product_id,
      seller_id,
      item_price: realItemPrice,
      shipping_paid_by_buyer,
      platform_commission: realCommission,
      seller_payout_amount: realSellerPayout,
      total_paid: realTotal,
      razorpay_order_id,
      razorpay_payment_id,
      buyer_email,
      buyer_name,
      buyer_phone,
      shipping_address: shipping_address_text,
      shipping_city,
      shipping_state,
      shipping_pincode,
      status: "pending",
      payout_method: "delayed",
      payout_eligible_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  // Push notification — awaited so the serverless function doesn't terminate before the fetch completes.
  // Errors are swallowed: a notification failure must never block the buyer's order confirmation.
  if (!error && seller_id) {
    console.log("[confirm-order] Sending push to seller ID:", seller_id);
    try {
      const pushRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-push-notification`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            user_id: seller_id,
            title: "New Order! 💸",
            body: `You received a new order for ₹${realTotal}`,
          }),
        }
      );
      console.log("[confirm-order] Push notification response:", await pushRes.text());
    } catch (pushErr) {
      console.error("[confirm-order] Push notification failed (non-fatal):", pushErr);
    }
  }

  // Order confirmation email to buyer
  if (!error && buyer_email && inserted?.id) {
    // Fetch seller display name for the receipt email
    let sellerName: string | null = null;
    if (seller_id) {
      const { data: sellerRow } = await supabase
        .from("sellers")
        .select("display_name")
        .eq("id", seller_id)
        .maybeSingle();
      sellerName = sellerRow?.display_name ?? null;
    }

    try {
      const emailRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/send-order-receipt`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            type: "UPDATE",
            table: "orders",
            schema: "public",
            record: {
              id: inserted.id,
              buyer_email,
              buyer_name,
              total_paid,
              payment_status: "paid",
              seller_name: sellerName,
            },
            old_record: { payment_status: null },
          }),
        }
      );
      const emailBody = await emailRes.text();
      if (!emailRes.ok) {
        console.error("[confirm-order] Receipt email failed:", emailRes.status, emailBody);
      } else {
        console.log("[confirm-order] Receipt email sent to:", buyer_email);
      }
    } catch (emailErr) {
      console.error("[confirm-order] Receipt email error (non-fatal):", emailErr);
    }
  } else if (!error && !buyer_email) {
    console.warn("[confirm-order] No buyer_email — skipping receipt email");
  }

  if (error) {
    console.error("[confirm-order] DB insert failed:", error.message);

    // Translate known trigger exceptions into human-readable messages
    if (error.message.includes("KYC_PENDING")) {
      return NextResponse.json(
        { error: "This seller's account is pending verification." },
        { status: 403 }
      );
    }
    if (error.message.includes("GST_REQUIRED")) {
      return NextResponse.json(
        { error: "Seller is currently updating tax compliance." },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "Order could not be recorded. Please contact support." },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}
