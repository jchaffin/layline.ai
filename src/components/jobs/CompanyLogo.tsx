"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

function domainFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (!host || !host.includes(".")) return null;
    // Job boards don't represent the company; use company name instead when provided
    if (host.includes("linkedin.com") || host.includes("indeed.com") || host.includes("greenhouse.io") || host.includes("lever.co") || host.includes("workday.com")) return null;
    return host;
  } catch {
    return null;
  }
}

/** Guess likely company domain from name for Clearbit logo lookup (e.g. "Stripe, Inc." -> stripe.com) */
function domainFromCompanyName(companyName?: string | null): string | null {
  if (!companyName || !companyName.trim()) return null;
  let name = companyName.trim();
  // Strip common corporate suffixes so "Stripe, Inc." -> "Stripe", "Acme Corp" -> "Acme"
  const suffixRegex = /\s*(,?\s*(Inc\.?|Corp\.?|Corporation|Co\.?|Company|LLC|L\.L\.C\.?|Ltd\.?|Limited|L\.P\.?|&?\s*Co\.?))\s*$/i;
  name = name.replace(suffixRegex, "").trim();
  const slug = name.toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!slug) return null;
  return `${slug}.com`;
}

/** Logo URL from domain; avoids Clearbit (often ERR_NAME_NOT_RESOLVED). Uses Google favicon as fallback. */
function logoUrlFromSource(
  src?: string | null,
  url?: string | null,
  companyName?: string | null
): string | null {
  if (src) return src;
  const domain = domainFromUrl(url) ?? domainFromCompanyName(companyName);
  if (!domain) return null;
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

function companyInitial(companyName?: string | null): string {
  if (!companyName || !companyName.trim()) return "?";
  const first = companyName.trim().charAt(0).toUpperCase();
  return /[A-Z0-9]/.test(first) ? first : "?";
}

export function CompanyLogo({
  src,
  url,
  companyName,
  size = "md",
  showFallback = true,
}: {
  src?: string | null;
  url?: string | null;
  /** Company name used to guess domain when url is missing or a job-board URL (e.g. LinkedIn) */
  companyName?: string | null;
  size?: "sm" | "md";
  /** When true, show company initial when logo is unavailable (default true) */
  showFallback?: boolean;
}) {
  const [imgError, setImgError] = useState(false);
  const logoUrl = logoUrlFromSource(src, url, companyName);
  useEffect(() => { setImgError(false); }, [src, url, companyName]);
  const showImage = !!logoUrl && !imgError;
  const showInitial = showFallback && companyName && !showImage;

  if (!showImage && !showInitial) return null;

  return (
    <div
      className={cn(
        "rounded-lg border flex items-center justify-center flex-shrink-0 overflow-hidden",
        size === "sm" ? "w-9 h-9 border-gray-200" : "w-11 h-11 border-gray-200",
        showImage ? "bg-white" : "bg-gray-100 text-gray-600 border-gray-200",
      )}
    >
      {showImage ? (
        <img
          src={logoUrl}
          alt=""
          referrerPolicy="no-referrer"
          className={cn(size === "sm" ? "w-7 h-7" : "w-8 h-8", "object-contain")}
          onError={() => setImgError(true)}
        />
      ) : (
        <span
          className={cn(
            "font-semibold",
            size === "sm" ? "text-sm" : "text-base",
          )}
        >
          {companyInitial(companyName)}
        </span>
      )}
    </div>
  );
}
