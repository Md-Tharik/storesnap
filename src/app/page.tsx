import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "StoreSnap — Your Business, Online in Seconds",
  description:
    "The easiest way to launch your store and accept payments. No forced logins, privacy-friendly, and ultra-fast.",
  openGraph: {
    title: "StoreSnap — Your Business, Online in Seconds",
    description:
      "No forced logins, privacy-friendly, and ultra-fast checkout for Indian sellers.",
  },
};

const STEPS = [
  {
    number: "01",
    emoji: "📱",
    title: "Download & Set Up",
    desc: "Install StoreSnap, complete a quick KYC, and your storefront is live — no tech skills needed.",
  },
  {
    number: "02",
    emoji: "🛍️",
    title: "Add Your Products",
    desc: "List products with photos, set your price, and manage inventory from your phone in seconds.",
  },
  {
    number: "03",
    emoji: "💸",
    title: "Share & Get Paid",
    desc: "Send buyers your unique store link. They checkout without an account — you get paid directly.",
  },
];

const USPS = [
  {
    emoji: "🔓",
    title: "No Buyer Account",
    desc: "Customers checkout with just their name, email, and address. Zero friction — more conversions.",
  },
  {
    emoji: "🛡️",
    title: "Privacy-Friendly",
    desc: "We never sell buyer data. No invasive tracking. Clean, honest, and compliant.",
  },
  {
    emoji: "⚡",
    title: "Ultra-Fast Checkout",
    desc: "From product page to payment confirmed in under 60 seconds. Powered by Razorpay.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">

      {/* ── Navbar ──────────────────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-30 bg-[#080810]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Image
            src="/logo.png"
            alt="StoreSnap"
            width={130}
            height={34}
            className="h-7 sm:h-8 w-auto"
            priority
          />
          <div className="flex items-center gap-3 sm:gap-5">
            <Link
              href="/demo-store"
              className="text-sm text-white/45 hover:text-white transition-colors hidden sm:block"
            >
              Demo Store
            </Link>
            <a
              href="#download"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] text-white px-4 py-2 rounded-xl transition-all duration-150"
            >
              Get the App
            </a>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        {/* Layered dark gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#080810] via-[#100828] to-[#08081c]" />

        {/* Glow orbs */}
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full opacity-[0.22]"
            style={{ background: "radial-gradient(circle,#4338ca,transparent 68%)" }}
          />
          <div
            className="absolute top-1/3 -right-72 w-[600px] h-[600px] rounded-full opacity-[0.15]"
            style={{ background: "radial-gradient(circle,#7c3aed,transparent 68%)" }}
          />
          <div
            className="absolute -bottom-32 -left-48 w-[500px] h-[500px] rounded-full opacity-[0.12]"
            style={{ background: "radial-gradient(circle,#0369a1,transparent 68%)" }}
          />
        </div>

        {/* Dot grid texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.032]"
          style={{
            backgroundImage: "radial-gradient(circle,#fff 1px,transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Hero content */}
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28 sm:pt-28 sm:pb-36 lg:pt-40 lg:pb-48 text-center">

          {/* Live badge */}
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 sm:mb-10 bg-indigo-500/10 border border-indigo-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="text-indigo-300 text-[11px] sm:text-xs font-bold tracking-[0.12em] uppercase">
              Now live in India
            </span>
          </div>

          {/* Headline */}
          <h1
            className="font-black leading-[1.04] tracking-tight text-[2.75rem] sm:text-6xl md:text-7xl lg:text-[5.5rem]"
          >
            <span
              style={{
                background: "linear-gradient(135deg,#ffffff 25%,rgba(255,255,255,0.5) 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Your Business,
              <br />
            </span>
            <span
              style={{
                background: "linear-gradient(135deg,#818cf8 0%,#a78bfa 45%,#c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Online in Seconds.
            </span>
          </h1>

          {/* Subheadline */}
          <p className="mt-6 sm:mt-8 text-white/40 text-base sm:text-lg md:text-xl leading-relaxed max-w-2xl mx-auto">
            The easiest way to launch your store and accept payments.{" "}
            <span className="text-white/60 font-medium">
              No forced logins, privacy-friendly, and ultra-fast.
            </span>
          </p>

          {/* CTA buttons */}
          <div
            id="download"
            className="mt-9 sm:mt-11 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-3.5"
          >
            {/* Google Play — active */}
            <a
              href="#"
              className="active:scale-[0.97] transition-transform duration-150 shrink-0"
            >
              <Image
                src="/playstore-logo.jpg"
                alt="Get it on Google Play"
                width={200}
                height={60}
                className="h-[54px] w-auto"
              />
            </a>

            {/* App Store — coming soon / disabled */}
            <div
              title="App Store version coming soon"
              className="w-full sm:w-auto flex items-center justify-center gap-3
                         bg-white/[0.04] border border-white/[0.07]
                         px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl
                         cursor-not-allowed opacity-40 select-none"
            >
              <AppleSvg />
              <span className="text-left">
                <span className="block text-[10px] text-white/50 font-medium leading-none mb-0.5">
                  Coming Soon
                </span>
                <span className="block text-[15px] font-bold leading-none text-white/70">
                  App Store
                </span>
              </span>
            </div>

            {/* View Demo Store */}
            <Link
              href="/demo-store"
              className="w-full sm:w-auto flex items-center justify-center gap-2
                         border border-white/[0.13] hover:border-white/25
                         bg-white/[0.03] hover:bg-white/[0.07]
                         px-5 py-3.5 sm:px-6 sm:py-4 rounded-2xl
                         text-[15px] font-semibold text-white/60 hover:text-white
                         transition-all duration-150"
            >
              View Demo Store
              <span className="text-white/35 group-hover:translate-x-0.5 transition-transform">→</span>
            </Link>
          </div>

          {/* Trust pills row */}
          <div className="mt-9 sm:mt-11 flex flex-wrap justify-center gap-2 sm:gap-2.5">
            {[
              "🔒 No mandatory buyer logins",
              "🇮🇳 Built for Indian sellers",
              "💳 Razorpay secured",
              "🚚 Pan-India shipping",
            ].map((pill) => (
              <span
                key={pill}
                className="text-[11px] sm:text-xs font-medium text-white/30
                           bg-white/[0.04] border border-white/[0.06]
                           rounded-full px-3.5 py-1.5"
              >
                {pill}
              </span>
            ))}
          </div>
        </div>

        {/* Fade to next section */}
        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-b from-transparent to-[#f0f0f5]" />
      </section>

      {/* ── How it works ──────────────────────────────────────────────────────── */}
      <section className="bg-[#f0f0f5] py-16 sm:py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section label */}
          <div className="text-center mb-10 sm:mb-14">
            <span className="text-[11px] font-bold tracking-[0.15em] uppercase text-indigo-500">
              How it works
            </span>
            <h2 className="mt-3 text-2xl sm:text-3xl lg:text-[2.5rem] font-black text-gray-900 tracking-tight">
              Up and running in three steps
            </h2>
            <p className="mt-3 text-gray-400 text-sm sm:text-base max-w-xl mx-auto">
              No website to build, no payment gateway to integrate. Just download, list, and sell.
            </p>
          </div>

          {/* Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
            {STEPS.map((step, i) => (
              <div
                key={step.number}
                className="relative bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sm:p-7
                           hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Connector — desktop only */}
                {i < 2 && (
                  <div className="hidden sm:block absolute top-10 -right-3 z-10 w-6">
                    <div className="h-px bg-gradient-to-r from-indigo-200 to-transparent" />
                  </div>
                )}

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center text-[22px] shrink-0">
                    {step.emoji}
                  </div>
                  <span className="text-[2rem] font-black text-gray-100 tabular-nums leading-none">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-[15px] font-bold text-gray-900">{step.title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── USPs ──────────────────────────────────────────────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-14 sm:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-10">
            {USPS.map(({ emoji, title, desc }) => (
              <div key={title} className="flex flex-col items-center text-center">
                <div className="w-13 h-13 rounded-2xl bg-indigo-50 flex items-center justify-center text-[1.6rem] mb-4 w-14 h-14">
                  {emoji}
                </div>
                <h3 className="font-bold text-gray-900 text-base">{title}</h3>
                <p className="mt-2 text-sm text-gray-400 leading-relaxed max-w-[230px]">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ────────────────────────────────────────────────────────── */}
      <section className="bg-[#080810] py-16 sm:py-20 relative overflow-hidden">
        <div className="pointer-events-none absolute inset-0">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full opacity-[0.18]"
            style={{ background: "radial-gradient(ellipse,#4338ca,transparent 70%)" }}
          />
        </div>
        <div className="relative max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            Start selling today — for free.
          </h2>
          <p className="mt-4 text-white/35 text-sm sm:text-base leading-relaxed">
            Download the app, set up your store in minutes, and get your first order today.
          </p>
          <a
            href="#download"
            className="mt-8 inline-block active:scale-[0.97] transition-transform duration-150"
          >
            <Image
              src="/playstore-logo.jpg"
              alt="Get it on Google Play"
              width={200}
              height={60}
              className="h-[54px] w-auto"
            />
          </a>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────────────── */}
      <footer className="bg-[#080810] border-t border-white/[0.05] py-7 sm:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8
                        flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6">
          <Image
            src="/logo.png"
            alt="StoreSnap"
            width={110}
            height={30}
            className="h-6 w-auto opacity-35"
          />
          <p className="text-xs text-white/20 text-center order-last sm:order-none">
            © {new Date().getFullYear()} StoreSnap · Built for Indian sellers
          </p>
          <Link
            href="/demo-store"
            className="text-xs text-white/25 hover:text-white/50 transition-colors"
          >
            View Demo Store →
          </Link>
        </div>
      </footer>

    </div>
  );
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────

function AppleSvg() {
  return (
    <svg
      width="20"
      height="22"
      viewBox="0 0 814 1000"
      className="shrink-0 fill-white/70"
      aria-hidden="true"
    >
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-57.8-155.5-127.4C46 382.8-.2 262.5 0 148.6 0 78.2 39.2 11 99.2 3.5c14.8-2 36.8-3.2 52.8-3.2 28 0 99.2 11.6 140 82.4 18.3-36.1 70-101.5 157.4-101.5 26 0 142.2 22.8 192.7 140.4zM512.9 57.4c-18.3 3.8-71.9 20.8-113.2 76.8-37.1 50.8-58.8 125.8-48.8 160.8l2.2 2c10 .6 41.5 1.3 76.8-18.3 37.7-21.6 107.2-90.1 99.6-214.9-.6-3.8-16.6-6.4-16.6-6.4z" />
    </svg>
  );
}
