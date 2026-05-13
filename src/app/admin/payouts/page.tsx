import { createServiceClient } from "@/lib/supabase";
import PayoutsClient, { type SellerPayout } from "./PayoutsClient";

export const dynamic = "force-dynamic";

export default async function AdminPayoutsPage() {
  const supabase = createServiceClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select(
      `
      seller_id,
      seller_payout_amount,
      created_at,
      sellers (
        id,
        display_name,
        bank_account_name,
        bank_account_number,
        bank_ifsc
      )
    `
    )
    .eq("payout_status", "pending")
    .order("created_at", { ascending: true });

  if (error) {
    return (
      <div className="p-8 text-red-500">
        Error loading payouts: {error.message}
      </div>
    );
  }

  // Group orders by seller
  const sellerMap = new Map<string, SellerPayout>();

  for (const order of orders ?? []) {
    const seller = (order.sellers as unknown) as {
      id: string;
      display_name: string | null;
      bank_account_name: string | null;
      bank_account_number: string | null;
      bank_ifsc: string | null;
    } | null;

    if (!seller) continue;

    if (!sellerMap.has(order.seller_id)) {
      sellerMap.set(order.seller_id, {
        id: seller.id,
        display_name: seller.display_name,
        bank_account_name: seller.bank_account_name,
        bank_account_number: seller.bank_account_number,
        bank_ifsc: seller.bank_ifsc,
        total_payout: 0,
        order_count: 0,
        oldest_order_date: order.created_at,
      });
    }

    const entry = sellerMap.get(order.seller_id)!;
    entry.total_payout += Number(order.seller_payout_amount ?? 0);
    entry.order_count += 1;
    if (order.created_at < entry.oldest_order_date) {
      entry.oldest_order_date = order.created_at;
    }
  }

  const sellers = Array.from(sellerMap.values()).sort(
    (a, b) =>
      new Date(a.oldest_order_date).getTime() -
      new Date(b.oldest_order_date).getTime()
  );

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Pending Payouts</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {sellers.length} seller{sellers.length !== 1 ? "s" : ""} awaiting
            payout
          </p>
        </div>
        <PayoutsClient sellers={sellers} />
      </div>
    </main>
  );
}
