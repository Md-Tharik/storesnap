"use client";

import { useState } from "react";

interface Props {
  avatarUrl: string | null;
  displayName: string;
}

export default function SellerAvatar({ avatarUrl, displayName }: Props) {
  const [failed, setFailed] = useState(false);

  const inner =
    "w-full h-full rounded-[14px] sm:rounded-[18px] overflow-hidden";

  const wrapper =
    "p-[3px] rounded-2xl sm:rounded-[21px] bg-gradient-to-br from-indigo-400 via-violet-500 to-purple-600 shadow-2xl shadow-indigo-900/50 " +
    "w-20 h-20 sm:w-28 sm:h-28 md:w-36 md:h-36 lg:w-40 lg:h-40 shrink-0";

  if (avatarUrl && !failed) {
    return (
      <div className={wrapper}>
        <div className={inner}>
          <img
            src={avatarUrl}
            alt={displayName}
            onError={() => setFailed(true)}
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    );
  }

  return (
    <div className={wrapper}>
      <div
        className={
          inner +
          " bg-[#0f0c2a] flex items-center justify-center " +
          "text-3xl sm:text-4xl md:text-5xl font-black text-white select-none"
        }
      >
        {displayName[0].toUpperCase()}
      </div>
    </div>
  );
}
