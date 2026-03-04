import { NextRequest, NextResponse } from "next/server";
import { fetchViaScrapeless, extractLinkedInJobDetail } from "@/lib/jobScraper";

async function fetchHtml(url: string): Promise<string | null> {
  let fetchUrl = url;
  if (url.includes("linkedin.com")) {
    const jobIdMatch =
      url.match(/currentJobId=(\d+)/) ||
      url.match(/jobs\/view\/[^/]*?(\d{8,})/) ||
      url.match(/jobs\/view\/(\d+)/);
    if (jobIdMatch) {
      fetchUrl = `https://www.linkedin.com/jobs/view/${jobIdMatch[1]}`;
    }
  }

  const html = await fetchViaScrapeless(fetchUrl);
  if (html) return html;

  const res = await fetch(fetchUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  if (!res.ok) return null;
  return res.text();
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const html = await fetchHtml(url);
    if (!html) {
      return NextResponse.json({ logo: null });
    }

    console.log(`[logo] Fetched ${html.length} chars from ${url}`);

    if (url.includes("linkedin.com")) {
      const detail = extractLinkedInJobDetail(html);
      console.log(`[logo] LinkedIn extraction: logo=${detail.employer_logo || "null"}`);
      return NextResponse.json({ logo: detail.employer_logo || null });
    }

    // For non-LinkedIn, try og:image
    const ogImage =
      html.match(/<meta[^>]*property=["']og:image["'][^>]*content=["'](https?:\/\/[^"']+)["']/i) ||
      html.match(/<meta[^>]*content=["'](https?:\/\/[^"']+)["'][^>]*property=["']og:image["']/i);
    return NextResponse.json({ logo: ogImage?.[1] || null });
  } catch (error) {
    console.error("[logo] Error:", error);
    return NextResponse.json({ logo: null });
  }
}
