import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@supabase/supabase-js";
import type { Metadata } from "next";
import SellerAvatar from "./SellerAvatar";
import OpenInAppBanner from "./OpenInAppBanner";

export const revalidate = 60;

// ── Types ─────────────────────────────────────────────────────────────────────

interface Seller {
  id: string;
  display_name: string;
  store_slug: string;
  bio: string | null;
  profile_image_url: string | null;
  banner_url: string | null;
  banner_preset: string;
}

interface Product {
  id: string;
  title: string;
  description: string | null;
  price: number;
  image_urls: string[] | null;
  slug: string;
}

interface Props {
  params: Promise<{ store_slug: string }>;
}

const PRESETS: Record<string, { bg: string; glow1: string; glow2: string }> = {
  default: { bg: "linear-gradient(160deg,#080810 0%,#1a1040 50%,#080820 100%)", glow1: "#4338ca", glow2: "#7c3aed" },
  aurora:  { bg: "linear-gradient(160deg,#041a14 0%,#0d3b2b 50%,#041828 100%)", glow1: "#047857", glow2: "#0369a1" },
  sunset:  { bg: "linear-gradient(160deg,#1a0500 0%,#4a1500 50%,#3a0520 100%)", glow1: "#c2410c", glow2: "#be185d" },
  ocean:   { bg: "linear-gradient(160deg,#020f1a 0%,#0a2a3f 50%,#020e28 100%)", glow1: "#0369a1", glow2: "#0e7490" },
  rose:    { bg: "linear-gradient(160deg,#1a0010 0%,#400030 50%,#1a0025 100%)", glow1: "#be185d", glow2: "#7c3aed" },
  forest:  { bg: "linear-gradient(160deg,#020f04 0%,#0a3f15 50%,#02100a 100%)", glow1: "#047857", glow2: "#065f46" },
};

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { store_slug } = await params;
  const { data } = await db()
    .from("sellers")
    .select("display_name, bio")
    .eq("store_slug", store_slug)
    .maybeSingle();

  if (!data) return { title: "Store not found – StoreSnap" };
  return {
    title: `${data.display_name} – StoreSnap`,
    description: data.bio ?? `Shop at ${data.display_name} on StoreSnap`,
    openGraph: {
      title: `${data.display_name} – StoreSnap`,
      description: data.bio ?? `Shop at ${data.display_name} on StoreSnap`,
    },
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function StorefrontPage({ params }: Props) {
  const { store_slug } = await params;
  const supabase = db();

  const { data: seller } = await supabase
    .from("sellers")
    .select("id, display_name, store_slug, bio, profile_image_url, banner_url, banner_preset")
    .eq("store_slug", store_slug)
    .maybeSingle();

  if (!seller) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, title, description, price, image_urls, slug")
    .eq("seller_id", seller.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const count = products?.length ?? 0;

  return (
    <div className="min-h-screen" style={{ background: "#f0f0f5" }}>

      {/* ── Navbar ───────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-[#080810]/90 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="StoreSnap"
            width={130}
            height={34}
            className="h-7 sm:h-8 w-auto"
            priority
          />
          <span className="text-[11px] text-white/25 font-mono tracking-wider hidden sm:block">
            storesnap.in/{seller.store_slug}
          </span>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      {(() => {
        const preset = PRESETS[seller.banner_preset] ?? PRESETS.default;
        const hasBanner = !!seller.banner_url;
        return (
          <header className="relative overflow-hidden">
            {/* Custom banner image */}
            {hasBanner && (
              <img
                src={seller.banner_url!}
                alt=""
                aria-hidden
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {/* Base: gradient OR dark overlay on custom image */}
            <div
              className="absolute inset-0"
              style={{
                background: hasBanner
                  ? "linear-gradient(160deg,rgba(0,0,0,0.78) 0%,rgba(0,0,0,0.62) 50%,rgba(0,0,0,0.72) 100%)"
                  : preset.bg,
              }}
            />
            {/* Glow orbs — preset mode only */}
            {!hasBanner && (
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full opacity-40"
                  style={{ background: `radial-gradient(circle,${preset.glow1},transparent 70%)` }} />
                <div className="absolute -bottom-40 -right-20 w-[600px] h-[600px] rounded-full opacity-30"
                  style={{ background: `radial-gradient(circle,${preset.glow2},transparent 70%)` }} />
              </div>
            )}
            {/* Dot-grid texture */}
            <div className="pointer-events-none absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)", backgroundSize: "28px 28px" }} />

            {/* Content */}
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 md:py-20 lg:py-24">
              <div className="flex flex-col md:flex-row md:items-center gap-7 md:gap-10 lg:gap-16">
                {/* Profile image */}
                <div className="flex justify-center md:justify-start">
                  <SellerAvatar avatarUrl={seller.profile_image_url} displayName={seller.display_name} />
                </div>
                {/* Text */}
                <div className="flex-1 min-w-0 text-center md:text-left">
                  <div className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-4 sm:mb-5 bg-emerald-500/10 border border-emerald-500/20">
                    <svg className="w-3 h-3 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-emerald-400 text-[11px] font-bold tracking-widest uppercase">Verified Store</span>
                  </div>
                  <h1 className="font-black leading-none tracking-tight text-[2.4rem] sm:text-5xl md:text-6xl lg:text-7xl"
                    style={{ background: "linear-gradient(135deg,#ffffff 30%,rgba(255,255,255,0.5) 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                    {seller.display_name}
                  </h1>
                  {seller.bio && (
                    <p className="mt-3 sm:mt-4 text-white/45 text-sm sm:text-base md:text-[15px] max-w-xl leading-relaxed mx-auto md:mx-0">
                      {seller.bio}
                    </p>
                  )}
                  <div className="mt-5 sm:mt-6 flex flex-wrap justify-center md:justify-start gap-2 sm:gap-2.5">
                    <GlassPill>🔒 Secure Checkout</GlassPill>
                    <GlassPill>🚚 Pan-India Delivery</GlassPill>
                    <GlassPill>💳 Razorpay</GlassPill>
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute bottom-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          </header>
        );
      })()}

      {/* ── Products ──────────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-14">
        {count === 0 ? (
          <EmptyState storeName={seller.display_name} />
        ) : (
          <section>
            {/* Section header */}
            <div className="flex items-center justify-between mb-6 sm:mb-8">
              <div className="flex items-center gap-3">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">All Products</h2>
                <span className="bg-indigo-50 text-indigo-600 text-xs font-bold px-2.5 py-1 rounded-full">
                  {count}
                </span>
              </div>
              <p className="text-xs text-gray-400 hidden sm:block">
                Powered by{" "}
                <span className="font-semibold text-indigo-500">StoreSnap</span>
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5">
              {products!.map((p) => (
                <ProductCard key={p.id} product={p} storeSlug={store_slug} />
              ))}
            </div>
          </section>
        )}
      </main>

      <OpenInAppBanner storeSlug={store_slug} />

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <footer className="mt-16 sm:mt-24 border-t border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8
                        flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-400 text-center sm:text-left">
            © {new Date().getFullYear()}{" "}
            <span className="font-semibold text-gray-700">{seller.display_name}</span>
            . All rights reserved.
          </p>
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="StoreSnap" width={80} height={22} className="h-5 w-auto opacity-30" />
            <span className="text-gray-200 text-xs">·</span>
            <span className="text-xs text-gray-400">Secure payments by Razorpay</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Components ────────────────────────────────────────────────────────────────

function GlassPill({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 bg-white/[0.06] border border-white/[0.09] rounded-xl px-3 sm:px-4 py-2 sm:py-2.5">
      <span className="text-white/55 text-[11px] sm:text-xs font-medium">{children}</span>
    </div>
  );
}

function ProductCard({
  product,
  storeSlug,
}: {
  product: Product;
  storeSlug: string;
}) {
  const image = product.image_urls?.[0] ?? null;

  return (
    <Link
      href={`/${storeSlug}/${product.slug}`}
      className="group bg-white rounded-2xl overflow-hidden flex flex-col
                 border border-gray-100 shadow-sm
                 hover:shadow-xl hover:shadow-gray-200/80 hover:-translate-y-1
                 transition-all duration-300 ease-out"
    >
      {/* Image area */}
      <div className="relative w-full aspect-[3/4] bg-gray-50 overflow-hidden">
        {image ? (
          <>
            <img
              src={image}
              alt={product.title}
              className="absolute inset-0 w-full h-full object-cover
                         group-hover:scale-[1.06] transition-transform duration-500 ease-out"
            />
            {/* Hover price overlay */}
            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent
                            translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out
                            hidden sm:flex items-end p-3">
              <span className="text-white font-bold text-sm">
                ₹{Number(product.price).toLocaleString("en-IN")}
              </span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-200 gap-2">
            <svg className="w-9 h-9 sm:w-12 sm:h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 sm:p-4 flex flex-col flex-1">
        <p className="text-[13px] sm:text-sm font-semibold text-gray-900 leading-snug line-clamp-2 flex-1">
          {product.title}
        </p>
        <div className="mt-2.5 sm:mt-3 flex items-center justify-between gap-2">
          <span className="text-sm sm:text-[15px] font-black text-indigo-600">
            ₹{Number(product.price).toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold text-indigo-600 bg-indigo-50
                           group-hover:bg-indigo-600 group-hover:text-white
                           px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg
                           transition-colors duration-200 whitespace-nowrap shrink-0">
            Buy →
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState({ storeName }: { storeName: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 sm:py-36 text-center">
      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl mb-5">
        🛍️
      </div>
      <h2 className="text-lg sm:text-xl font-bold text-gray-900">{storeName} is setting up</h2>
      <p className="text-gray-400 text-sm mt-2 max-w-xs">
        No products listed yet. Check back soon — something great is coming!
      </p>
    </div>
  );
}
