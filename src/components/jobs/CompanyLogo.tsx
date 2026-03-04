"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

const JOB_BOARD_DOMAINS = new Set([
  "linkedin.com", "indeed.com", "greenhouse.io", "lever.co",
  "workday.com", "glassdoor.com", "ziprecruiter.com", "monster.com",
  "learn4good.com", "simplyhired.com", "dice.com", "careerbuilder.com",
]);

function domainFromUrl(url?: string | null): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase().replace(/^www\./, "");
    if (!host || !host.includes(".")) return null;
    for (const jb of JOB_BOARD_DOMAINS) {
      if (host.includes(jb)) return null;
    }
    return host;
  } catch {
    return null;
  }
}

function domainFromCompanyName(name?: string | null): string | null {
  if (!name?.trim()) return null;
  const slug = name.trim()
    .replace(/\s*(,?\s*(Inc\.?|Corp\.?|Corporation|Co\.?|Company|LLC|L\.?L\.?C\.?|Ltd\.?|Limited|L\.?P\.?|&?\s*Co\.?))\s*$/i, "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
  return slug ? `${slug}.com` : null;
}

function buildFallbackChain(
  src?: string | null,
  url?: string | null,
  companyName?: string | null,
): string[] {
  const chain: string[] = [];
  const domain = domainFromUrl(url) ?? domainFromCompanyName(companyName);
  const favicon = domain
    ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`
    : null;

  if (src?.trim()) {
    chain.push(src.trim().replace(/&amp;/g, "&"));
  }
  if (favicon) chain.push(favicon);
  return chain;
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
  companyName?: string | null;
  size?: "sm" | "md";
  showFallback?: boolean;
}) {
  const chain = buildFallbackChain(src, url, companyName);
  const [idx, setIdx] = useState(0);
  useEffect(() => { setIdx(0); }, [src, url, companyName]);

  const logoUrl = chain[idx] ?? null;
  const showImage = !!logoUrl;
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
          onError={() => setIdx((prev) => prev + 1)}
        />
      ) : (
        <span className={cn("font-semibold", size === "sm" ? "text-sm" : "text-base")}>
          {companyInitial(companyName)}
        </span>
      )}
    </div>
  );
}
