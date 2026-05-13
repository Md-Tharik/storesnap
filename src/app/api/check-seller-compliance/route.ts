import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { sellerId } = await req.json();

  if (!sellerId) {
    return NextResponse.json({ error: "sellerId is required." }, { status: 400 });
  }

  const { data: seller, error } = await supabase
    .from("sellers")
    .select("total_sales_volume, gstin")
    .eq("id", sellerId)
    .single();

  if (error || !seller) {
    return NextResponse.json({ error: "Seller not found." }, { status: 404 });
  }

  if (Number(seller.total_sales_volume) >= 100000 && !seller.gstin) {
    return NextResponse.json(
      { error: "Seller is currently updating tax compliance." },
      { status: 403 }
    );
  }

  return NextResponse.json({ ok: true });
}
