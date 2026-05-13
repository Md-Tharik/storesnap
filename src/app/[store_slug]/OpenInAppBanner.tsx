"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

export default function OpenInAppBanner({ storeSlug }: { storeSlug: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem("app-banner-dismissed");
    const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
    if (isMobile && !dismissed) setVisible(true);
  }, []);

  if (!visible) return null;

  const intentUrl =
    `intent://store/${storeSlug}#Intent;scheme=storesnap;` +
    `package=in.storesnap.storesnap_app;` +
    `S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Din.storesnap.storesnap_app;end`;

  function dismiss() {
    localStorage.setItem("app-banner-dismissed", "1");
    setVisible(false);
  }

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_16px_rgba(0,0,0,0.08)] px-4 py-3 flex items-center gap-3">
      <Image
        src="/logo.png"
        alt="StoreSnap"
        width={80}
        height={22}
        className="h-7 w-auto shrink-0"
      />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 leading-tight">Open in StoreSnap</p>
        <p className="text-xs text-gray-400">Better experience in the app</p>
      </div>
      <a
        href={intentUrl}
        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3.5 py-2 rounded-lg shrink-0 transition-colors"
      >
        Open
      </a>
      <button
        onClick={dismiss}
        aria-label="Close"
        className="text-gray-300 hover:text-gray-500 shrink-0 p-1 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
