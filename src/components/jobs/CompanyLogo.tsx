"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

function domainFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (!host || !host.includes(".") || host.includes("linkedin.com")) return null;
    return host;
  } catch {
    return null;
  }
}

function logoUrlFromSource(src?: string | null, url?: string | null): string | null {
  if (src) return src;
  const domain = domainFromUrl(url);
  if (!domain) return null;
  return `https://logo.clearbit.com/${domain}`;
}

export function CompanyLogo({
  src,
  url,
  size = "md",
}: {
  src?: string | null;
  url?: string | null;
  size?: "sm" | "md";
}) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = logoUrlFromSource(src, url);
  const showImage = !!logoUrl && !imgError;

  if (!showImage) return null;

  return (
    <div
      className={cn(
        "rounded-lg bg-white border flex items-center justify-center flex-shrink-0 overflow-hidden",
        size === "sm" ? "w-9 h-9 border-gray-200" : "w-11 h-11 border-gray-200",
      )}
    >
      {showImage ? (
        <img
          src={logoUrl}
          alt=""
          className={cn(size === "sm" ? "w-7 h-7" : "w-8 h-8", "object-contain")}
          onError={() => setImgError(true)}
        />
      ) : null}
    </div>
  );
}
