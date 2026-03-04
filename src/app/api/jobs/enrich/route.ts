import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { extractLinkedInJobDetail, fetchViaScrapeless } from "@/lib/jobScraper";

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  if (!url || !url.includes("linkedin.com")) {
    return NextResponse.json({ error: "LinkedIn URL required" }, { status: 400 });
  }

  try {
    let html: string | null = await fetchViaScrapeless(url);
    if (!html) {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
      if (!res.ok) return NextResponse.json({ error: "Failed to fetch" }, { status: 502 });
      html = await res.text();
    }

    const detail = extractLinkedInJobDetail(html);
    if (!detail.description) return NextResponse.json({ description: null });

    const description = detail.description.slice(0, 5000);

    const jidMatch = url.match(/(\d{8,})/);
    if (jidMatch) {
      db.jobListing.updateMany({
        where: { externalId: `linkedin-${jidMatch[1]}` },
        data: {
          description: detail.description.slice(0, 10000),
          ...(detail.salary ? { salary: detail.salary } : {}),
          ...(detail.type ? { employmentType: detail.type } : {}),
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      description,
      salary: detail.salary ?? null,
      type: detail.type ?? null,
    });
  } catch {
    return NextResponse.json({ error: "Enrichment failed" }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const result = await db.jobListing.deleteMany({
      where: {
        source: "LinkedIn",
        description: { startsWith: "View full details" },
      },
    });
    return NextResponse.json({ deleted: result.count });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
