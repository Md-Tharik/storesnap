"use client";

import { useRef, useState } from "react";

const PLATFORM_FEE_PERCENT = 3;
const DEBOUNCE_MS = 500;

interface Product {
  id: string;
  title: string;
  price: number;
  delivery_type: string;
  delivery_charge: number;
  weight_grams: number | null;
}

interface Props {
  product: Product;
  sellerId: string;
  sellerName: string;
  sellerPincode: string;
}

const INPUT =
  "w-full border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm " +
  "focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 " +
  "placeholder:text-gray-400 transition-shadow bg-white " +
  "disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed";

const INPUT_DISABLED =
  "w-full border border-gray-100 rounded-xl px-3.5 py-2.5 text-sm " +
  "bg-gray-50 text-gray-400 cursor-not-allowed";

const LABEL = "block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2";

function Spinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
    </svg>
  );
}

export default function CheckoutForm({ product, sellerId, sellerName, sellerPincode }: Props) {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [dynamicShipping, setDynamicShipping] = useState<number | null>(null);
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingError, setShippingError] = useState<string | null>(null);
  const [isFallbackRate, setIsFallbackRate] = useState(false);

  // Ref for debounce timer — cancelled on every keystroke before restarting
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const price = Number(product.price);
  const weightKg = product.weight_grams ? product.weight_grams / 1000 : 0.5;
  const serviceFee = Math.round((price * PLATFORM_FEE_PERCENT) / 100);
  const effectiveShipping = dynamicShipping ?? Number(product.delivery_charge ?? 0);
  const total = price + effectiveShipping + serviceFee;

  // True while the user has started typing a pincode but hasn't reached 6 digits yet
  const pincodePartial = form.pincode.length > 0 && form.pincode.length < 6;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function fetchShipping(pincode: string) {
    setShippingLoading(true);
    try {
      const res = await fetch("/api/shipping/calculate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyerPincode: pincode, sellerPincode, weight: weightKg }),
      });
      const data = await res.json();

      if (!res.ok || typeof data.shippingCost !== "number") {
        setShippingError(data.error ?? "Standard shipping is only available within India.");
        setDynamicShipping(null);
        setIsFallbackRate(false);
      } else {
        setDynamicShipping(data.shippingCost);
        setIsFallbackRate(data.isFallback === true);
        setShippingError(null);
      }
    } catch {
      setShippingError("Standard shipping is only available within India.");
      setDynamicShipping(null);
      setIsFallbackRate(false);
    } finally {
      setShippingLoading(false);
    }
  }

  function handlePincodeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 6);
    setForm((f) => ({ ...f, pincode: val }));

    // Cancel any pending debounce
    if (debounceRef.current) clearTimeout(debounceRef.current);

    // Always reset shipping state immediately when pincode changes
    setDynamicShipping(null);
    setIsFallbackRate(false);
    setShippingError(null);

    if (val.length < 6) {
      // Partial pincode — reset only, button will be hidden via pincodePartial
      return;
    }

    if (!/^[1-9][0-9]{5}$/.test(val)) {
      // 6 digits but starts with 0 — not a valid Indian pincode
      setShippingError("Standard shipping is only available within India.");
      return;
    }

    // Valid 6-digit pincode — debounce the API call by DEBOUNCE_MS
    debounceRef.current = setTimeout(() => fetchShipping(val), DEBOUNCE_MS);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (pincodePartial) {
      setError("Please complete your 6-digit delivery pincode.");
      return;
    }
    if (shippingError) {
      setError("Please enter a valid Indian delivery pincode to continue.");
      return;
    }
    if (form.pincode.length === 6 && dynamicShipping === null && !shippingLoading) {
      setError("Shipping rate could not be calculated. Please check the pincode.");
      return;
    }

    setLoading(true);

    try {
      const complianceRes = await fetch("/api/check-seller-compliance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId }),
      });
      const complianceData = await complianceRes.json();
      if (!complianceRes.ok) {
        setError(complianceData.error ?? "Cannot process order right now.");
        setLoading(false);
        return;
      }

      const orderRes = await fetch("/api/create-razorpay-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amountPaise: Math.round(total * 100) }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        setError(orderData.error ?? "Failed to initiate payment.");
        setLoading(false);
        return;
      }

      if (!window.Razorpay) {
        setError("Payment gateway not loaded. Please refresh and try again.");
        setLoading(false);
        return;
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: orderData.amount,
        currency: "INR",
        name: sellerName,
        description: product.title,
        order_id: orderData.id,
        prefill: { name: form.name, email: form.email, contact: form.phone },
        theme: { color: "#4f46e5" },
        modal: { ondismiss: () => setLoading(false) },
        handler: async (response: RazorpayPaymentResponse) => {
          try {
            const confirmRes = await fetch("/api/confirm-order", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature,
                product_id: product.id,
                seller_id: sellerId,
                item_price: price,
                shipping_paid_by_buyer: effectiveShipping,
                platform_commission: serviceFee,
                seller_payout_amount: price,
                total_paid: total,
                shipping_address: form,
              }),
            });
            const confirmData = await confirmRes.json();
            if (!confirmRes.ok) {
              setError(
                confirmData.error ??
                  `Payment received but order creation failed. Contact support with ID: ${response.razorpay_payment_id}`
              );
            } else {
              setSuccess(true);
            }
          } catch (err: unknown) {
            setError(
              `${err instanceof Error ? err.message : "Unexpected error"} — ` +
                `payment ID: ${response.razorpay_payment_id}. Contact support if charged.`
            );
          } finally {
            setLoading(false);
          }
        },
      });

      rzp.open();
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="bg-white rounded-2xl border border-[#e8e8f0] shadow-card p-8 text-center">
        <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-3xl mx-auto mb-4">
          ✅
        </div>
        <h2 className="text-xl font-bold text-gray-900">Order Confirmed!</h2>
        <p className="mt-2 text-sm text-gray-500 leading-relaxed">
          Your order has been placed successfully.{" "}
          <span className="font-medium text-gray-700">{sellerName}</span> will confirm it shortly.
        </p>
        <p className="mt-1.5 text-xs text-gray-400">
          Confirmation details sent to{" "}
          <span className="font-medium">{form.email}</span>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#e8e8f0] shadow-card p-5 sm:p-6">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900">Complete Your Order</h2>
        <p className="text-xs text-gray-400 mt-0.5">No account required · Guest checkout</p>
      </div>

      {error && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 leading-relaxed">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Contact */}
        <div>
          <p className={LABEL}>Contact Details</p>
          <div className="space-y-3">
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              className={INPUT}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={form.email}
                onChange={handleChange}
                required
                className={INPUT}
              />
              <input
                name="phone"
                type="tel"
                placeholder="Phone"
                value={form.phone}
                onChange={handleChange}
                required
                pattern="[6-9][0-9]{9}"
                title="10-digit Indian mobile number"
                className={INPUT}
              />
            </div>
          </div>
        </div>

        {/* Shipping address */}
        <div>
          <p className={LABEL}>Shipping Address</p>
          <div className="space-y-3">
            <input
              name="address_line1"
              placeholder="Address Line 1"
              value={form.address_line1}
              onChange={handleChange}
              required
              className={INPUT}
            />
            <input
              name="address_line2"
              placeholder="Address Line 2 (optional)"
              value={form.address_line2}
              onChange={handleChange}
              className={INPUT}
            />
            <div className="grid grid-cols-3 gap-3">
              <input
                name="city"
                placeholder="City"
                value={form.city}
                onChange={handleChange}
                required
                className={INPUT}
              />
              <input
                name="state"
                placeholder="State"
                value={form.state}
                onChange={handleChange}
                required
                className={INPUT}
              />
              <input
                name="pincode"
                placeholder="Pincode"
                value={form.pincode}
                onChange={handlePincodeChange}
                disabled={shippingLoading}
                required
                inputMode="numeric"
                maxLength={6}
                pattern="[1-9][0-9]{5}"
                title="6-digit pincode"
                className={
                  shippingLoading
                    ? INPUT_DISABLED
                    : shippingError
                    ? INPUT + " border-red-300 focus:border-red-400 focus:ring-red-500/20"
                    : INPUT
                }
              />
            </div>

            {/* Country — locked to India */}
            <input
              name="country"
              value="India"
              readOnly
              disabled
              className={INPUT_DISABLED}
            />

            {/* Pincode-level shipping error */}
            {shippingError && (
              <p className="text-xs text-red-600 flex items-center gap-1.5 -mt-1">
                <svg className="h-3.5 w-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {shippingError}
              </p>
            )}
          </div>
        </div>

        {/* Order summary */}
        <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
          <p className={LABEL + " mb-3"}>Order Summary</p>

          {/* Product price */}
          <div className="flex justify-between text-gray-600">
            <span className="truncate pr-4 max-w-[60%]">{product.title}</span>
            <span className="font-medium">₹{price.toLocaleString("en-IN")}</span>
          </div>

          {/* Shipping row */}
          <div className="flex justify-between text-gray-500 items-center min-h-[1.5rem]">
            <span>Shipping</span>
            {shippingLoading ? (
              <span className="flex items-center gap-1.5 text-indigo-500 text-xs">
                <Spinner className="h-3.5 w-3.5" />
                Calculating best rates…
              </span>
            ) : shippingError ? (
              <span className="text-red-500 text-xs">Unavailable</span>
            ) : (
              <span className={dynamicShipping !== null ? "text-indigo-600 font-medium" : ""}>
                {effectiveShipping === 0
                  ? "Free"
                  : `₹${effectiveShipping.toLocaleString("en-IN")}`}
              </span>
            )}
          </div>

          {/* Caption: live rate (real Shiprocket) or silent for fallback */}
          {dynamicShipping !== null && !shippingLoading && !isFallbackRate && (
            <p className="text-[11px] text-gray-400 -mt-1">Live rate via Shiprocket</p>
          )}

          {/* Platform service fee */}
          <div className="flex justify-between text-gray-500">
            <span>Service Fee ({PLATFORM_FEE_PERCENT}%)</span>
            <span>₹{serviceFee.toLocaleString("en-IN")}</span>
          </div>

          {/* Total */}
          <div className="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-2.5 mt-1">
            <span>Total</span>
            <span className="text-indigo-600">
              {shippingLoading || shippingError ? "—" : `₹${total.toLocaleString("en-IN")}`}
            </span>
          </div>
        </div>

        {/* Payment button — hidden while pincode is partially typed */}
        {pincodePartial ? (
          <p className="text-center text-xs text-gray-400 py-2">
            Enter your 6-digit pincode above to calculate shipping and unlock payment.
          </p>
        ) : (
          <button
            type="submit"
            disabled={loading || shippingLoading || !!shippingError}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white
                       font-semibold py-3.5 rounded-xl transition-all duration-150
                       disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-sm
                       shadow-indigo-200"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Processing…
              </span>
            ) : shippingLoading ? (
              <span className="flex items-center justify-center gap-2">
                <Spinner />
                Calculating best rates…
              </span>
            ) : shippingError ? (
              "Shipping unavailable for this pincode"
            ) : (
              `Proceed to Payment · ₹${total.toLocaleString("en-IN")} →`
            )}
          </button>
        )}

        <p className="text-xs text-gray-400 text-center">
          🔒 Payments secured by{" "}
          <span className="font-semibold text-gray-500">Razorpay</span>
        </p>
      </form>
    </div>
  );
}
