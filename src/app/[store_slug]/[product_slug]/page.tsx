import { notFound } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import Image from "next/image";
import CheckoutForm from "./CheckoutForm";

interface Props {
  params: Promise<{ store_slug: string; product_slug: string }>;
}

export default async function ProductPage({ params }: Props) {
  const { store_slug, product_slug } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, display_name, bio, profile_image_url, store_slug")
    .eq("store_slug", store_slug)
    .maybeSingle();

  if (!seller) notFound();

  const { data: product } = await supabase
    .from("products")
    .select(
      "id, title, description, price, image_urls, slug, variants, accepts_returns, accepts_refunds, weight_grams, delivery_type, delivery_charge"
    )
    .eq("seller_id", seller.id)
    .eq("slug", product_slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!product) return <ErrorScreen title="Product not found" />;

  const images: string[] = product.image_urls ?? [];
  const price = Number(product.price);

  return (
    <div className="min-h-screen bg-[#f0f0f5]">

      {/* ── Navbar ────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-[#080810]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center gap-3">

          {/* Back to store — seller mini identity */}
          <Link
            href={`/${store_slug}`}
            className="flex items-center gap-2.5 min-w-0 group"
          >
            {seller.profile_image_url ? (
              <img
                src={seller.profile_image_url}
                alt={seller.display_name}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-cover ring-1 ring-white/20 shrink-0"
              />
            ) : (
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                {seller.display_name[0].toUpperCase()}
              </div>
            )}
            <span className="text-sm font-semibold text-white/80 group-hover:text-white transition-colors truncate hidden sm:block">
              {seller.display_name}
            </span>
          </Link>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-white/25 min-w-0 ml-1">
            <span>/</span>
            <span className="truncate text-white/40">{product.title}</span>
          </div>

          {/* Logo right */}
          <div className="ml-auto">
            <Image
              src="/logo.png"
              alt="StoreSnap"
              width={100}
              height={26}
              className="h-6 w-auto opacity-50"
            />
          </div>
        </div>
      </nav>

      {/* ── Content ───────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_460px] gap-6 lg:gap-10 xl:gap-14 items-start">

          {/* ── Left: Product visuals ──────────────────────────────────────── */}
          <div className="space-y-3 sm:space-y-4">

            {/* Main image */}
            <div className="aspect-[4/5] sm:aspect-square lg:aspect-[4/5] rounded-2xl overflow-hidden bg-white
                            border border-gray-100 shadow-md">
              {images[0] ? (
                <img
                  src={images[0]}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-200 gap-3">
                  <svg className="w-16 h-16 sm:w-20 sm:h-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-300">No image</span>
                </div>
              )}
            </div>

            {/* Thumbnail strip */}
            {images.length > 1 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-1">
                {images.map((url, i) => (
                  <div
                    key={i}
                    className="shrink-0 w-14 h-14 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-xl overflow-hidden
                               border-2 border-indigo-500/40 hover:border-indigo-500 transition-colors bg-white"
                  >
                    <img src={url} alt={`View ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            )}

            {/* Policy badges */}
            <div className="flex gap-2 flex-wrap">
              <PolicyBadge ok={product.accepts_returns} yes="Returns accepted" no="No returns" />
              <PolicyBadge ok={product.accepts_refunds} yes="Refunds accepted" no="No refunds" />
            </div>

            {/* Seller card — desktop only, below image */}
            <div className="hidden lg:flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              {seller.profile_image_url ? (
                <img
                  src={seller.profile_image_url}
                  alt={seller.display_name}
                  className="w-11 h-11 rounded-xl object-cover shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-black text-lg shrink-0 select-none">
                  {seller.display_name[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900 truncate">{seller.display_name}</p>
                {seller.bio && (
                  <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{seller.bio}</p>
                )}
              </div>
              <Link
                href={`/${store_slug}`}
                className="ml-auto shrink-0 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                View Store →
              </Link>
            </div>
          </div>

          {/* ── Right: Info + checkout (sticky on desktop) ────────────────── */}
          <div className="space-y-4 lg:sticky lg:top-20">

            {/* Product title card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sm:p-6">
              <h1 className="text-xl sm:text-2xl lg:text-[1.6rem] font-black text-gray-900 leading-snug">
                {product.title}
              </h1>
              <p className="mt-3 text-3xl sm:text-4xl font-black text-indigo-600 tabular-nums">
                ₹{price.toLocaleString("en-IN")}
              </p>
              {product.description && (
                <p className="mt-4 text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-4">
                  {product.description}
                </p>
              )}
            </div>

            {/* Checkout form */}
            <CheckoutForm
              product={product}
              sellerId={seller.id}
              sellerName={seller.display_name}
              sellerPincode="600001"
            />

            {/* Trust strip */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "🔒", label: "SSL Secured" },
                { icon: "💳", label: "Razorpay" },
                { icon: "🚚", label: "Pan-India" },
              ].map(({ icon, label }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-1 bg-white rounded-xl border border-gray-100 py-3 px-2"
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 text-center leading-tight">
                    {label}
                  </span>
                </div>
              ))}
            </div>

          </div>
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="mt-10 sm:mt-16 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6
                        flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            href={`/${store_slug}`}
            className="text-xs text-gray-400 hover:text-indigo-600 transition-colors"
          >
            ← Back to {seller.display_name}&apos;s store
          </Link>
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="StoreSnap" width={70} height={18} className="h-4 w-auto opacity-30" />
            <span className="text-xs text-gray-300">·</span>
            <span className="text-xs text-gray-400">Secure payments by Razorpay</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function PolicyBadge({ ok, yes, no }: { ok: boolean; yes: string; no: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full ${
        ok ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-600"
      }`}
    >
      <span>{ok ? "✓" : "✗"}</span>
      {ok ? yes : no}
    </span>
  );
}

function ErrorScreen({ title }: { title: string }) {
  return (
    <main className="min-h-screen bg-[#f0f0f5] flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 max-w-md w-full text-center">
        <div className="text-5xl mb-5">😕</div>
        <h1 className="text-xl font-bold text-gray-900">{title}</h1>
        <p className="mt-2 text-gray-400 text-sm">
          This page doesn&apos;t exist or has been removed.
        </p>
      </div>
    </main>
  );
}
