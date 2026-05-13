"use client";

import { useState } from "react";

export type SellerPayout = {
  id: string;
  display_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_ifsc: string | null;
  total_payout: number;
  order_count: number;
  oldest_order_date: string;
};

function PayoutDueBadge({ oldestOrderDate }: { oldestOrderDate: string }) {
  const dueDate = new Date(oldestOrderDate);
  dueDate.setDate(dueDate.getDate() + 3);
  dueDate.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffDays = Math.ceil(
    (dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  const isOverdue = diffDays <= 0;
  const label = isOverdue ? "Instant" : `In ${diffDays} day${diffDays === 1 ? "" : "s"}`;
  const dueDateStr = dueDate.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  return (
    <div className="flex flex-col gap-1">
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit ${
          isOverdue
            ? "bg-red-100 text-red-700"
            : "bg-green-100 text-green-700"
        }`}
      >
        {label}
      </span>
      <span className="text-xs text-gray-400">{dueDateStr}</span>
    </div>
  );
}

export default function PayoutsClient({
  sellers,
}: {
  sellers: SellerPayout[];
}) {
  const [processing, setProcessing] = useState<string | null>(null);
  const [paid, setPaid] = useState<Set<string>>(new Set());

  async function handleMarkPaid(seller: SellerPayout) {
    if (!confirm(`Mark ₹${seller.total_payout.toLocaleString("en-IN")} as paid to ${seller.display_name}?`)) return;

    setProcessing(seller.id);
    try {
      const res = await fetch("/api/admin/process-payout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seller_id: seller.id,
          payout_amount: seller.total_payout,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Request failed");
      setPaid((prev) => new Set([...prev, seller.id]));
    } catch (e: unknown) {
      alert(`Error: ${e instanceof Error ? e.message : "Unknown error"}`);
    } finally {
      setProcessing(null);
    }
  }

  const visible = sellers.filter((s) => !paid.has(s.id));

  if (visible.length === 0) {
    return (
      <div className="text-center py-20 text-gray-400">
        No pending payouts. All sellers are settled.
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            {["Seller", "Bank Details", "Orders", "Amount Due", "Due Date", "Action"].map(
              (h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                >
                  {h}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {visible.map((seller) => (
            <tr key={seller.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">
                {seller.display_name ?? "—"}
              </td>

              <td className="px-4 py-4">
                {seller.bank_account_name ? (
                  <div className="space-y-0.5">
                    <p className="font-medium text-gray-800">{seller.bank_account_name}</p>
                    <p className="text-gray-500 font-mono text-xs">{seller.bank_account_number}</p>
                    <p className="text-gray-400 text-xs">{seller.bank_ifsc}</p>
                  </div>
                ) : (
                  <span className="text-gray-400 italic text-xs">No bank account added</span>
                )}
              </td>

              <td className="px-4 py-4 text-gray-700 text-center">
                {seller.order_count}
              </td>

              <td className="px-4 py-4 font-semibold text-gray-900 whitespace-nowrap">
                ₹{seller.total_payout.toLocaleString("en-IN")}
              </td>

              <td className="px-4 py-4">
                <PayoutDueBadge oldestOrderDate={seller.oldest_order_date} />
              </td>

              <td className="px-4 py-4">
                <button
                  onClick={() => handleMarkPaid(seller)}
                  disabled={processing === seller.id || !seller.bank_account_number}
                  className="inline-flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {processing === seller.id ? "Processing…" : "Mark as Paid"}
                </button>
                {!seller.bank_account_number && (
                  <p className="text-xs text-red-400 mt-1">Bank details missing</p>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
