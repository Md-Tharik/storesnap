import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { seller_id, payout_amount } = body as {
    seller_id?: string;
    payout_amount?: number;
  };

  if (!seller_id || payout_amount == null) {
    return NextResponse.json(
      { error: "seller_id and payout_amount are required" },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const { error } = await supabase
    .from("orders")
    .update({ payout_status: "paid" })
    .eq("seller_id", seller_id)
    .eq("payout_status", "pending");

  if (error) {
    console.error("[process-payout] DB update failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

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
          title: "Payout Sent! 💸",
          body: `We just processed your manual payout of ₹${payout_amount}. It will reflect in your bank account shortly.`,
        }),
      }
    );
    console.log("[process-payout] Push response:", await pushRes.text());
  } catch (err) {
    console.error("[process-payout] Push notification failed (non-fatal):", err);
  }

  return NextResponse.json({ ok: true });
}
