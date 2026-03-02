import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: NextRequest) {
  const { url } = await request.json();
  if (!url || !url.includes("linkedin.com")) {
    return NextResponse.json({ error: "LinkedIn URL required" }, { status: 400 });
  }

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!res.ok) return NextResponse.json({ error: "Failed to fetch" }, { status: 502 });

    const html = await res.text();
    const descMatch = html.match(
      /class="show-more-less-html__markup[^"]*"[^>]*>([\s\S]*?)<\/div>/,
    );
    if (!descMatch) return NextResponse.json({ description: null });

    const description = descMatch[1]
      .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"').replace(/&#x27;/g, "'")
      .replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
      .slice(0, 5000);

    const salaryMatch = html.match(/class="salary[^"]*"[^>]*>([^<]+)/i);
    const typeMatch = html.match(
      /class="description__job-criteria-text[^"]*"[^>]*>\s*(Full-time|Part-time|Contract|Internship|Temporary)/i,
    );

    const jidMatch = url.match(/(\d{8,})/);
    if (jidMatch) {
      db.jobListing.updateMany({
        where: { externalId: `linkedin-${jidMatch[1]}` },
        data: {
          description: description.slice(0, 10000),
          ...(salaryMatch ? { salary: salaryMatch[1].trim() } : {}),
          ...(typeMatch ? { employmentType: typeMatch[1] } : {}),
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      description,
      salary: salaryMatch ? salaryMatch[1].trim() : null,
      type: typeMatch ? typeMatch[1] : null,
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
