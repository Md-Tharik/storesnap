import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { supabase } from "@/lib/supabase";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

const PLATFORM_FEE_PERCENT = 3;

export async function POST(req: NextRequest) {
  const { product_id, shipping_amount } = await req.json();

  if (!product_id) {
    return NextResponse.json({ error: "product_id is required." }, { status: 400 });
  }

  const shipping = Number(shipping_amount ?? 0);
  if (isNaN(shipping) || shipping < 0) {
    return NextResponse.json({ error: "Invalid shipping amount." }, { status: 400 });
  }

  // Fetch actual product price from DB — never trust client-supplied amount
  const { data: product, error } = await supabase
    .from("products")
    .select("price, is_active")
    .eq("id", product_id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !product) {
    return NextResponse.json({ error: "Product not found." }, { status: 404 });
  }

  const price = Number(product.price);
  const serviceFee = Math.round((price * PLATFORM_FEE_PERCENT) / 100);
  const total = price + shipping + serviceFee;
  const amountPaise = Math.round(total * 100);

  if (amountPaise < 100) {
    return NextResponse.json({ error: "Order total is too low." }, { status: 400 });
  }

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `snap_${Date.now()}`,
    });

    return NextResponse.json({
      ...order,
      expected_price: price,
      expected_shipping: shipping,
      expected_fee: serviceFee,
      expected_total: total,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create payment order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
