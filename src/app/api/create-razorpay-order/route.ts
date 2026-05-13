import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";

const razorpay = new Razorpay({
  key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function POST(req: NextRequest) {
  const { amountPaise } = await req.json();

  if (!amountPaise || amountPaise < 100) {
    return NextResponse.json(
      { error: "Invalid amount." },
      { status: 400 }
    );
  }

  try {
    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: "INR",
      receipt: `snap_${Date.now()}`,
    });

    return NextResponse.json(order);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create payment order.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
