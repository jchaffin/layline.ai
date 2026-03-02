import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") || "";

    if (q.length < 1) {
      return NextResponse.json({ titles: [] });
    }

    const rows = await db.jobListing.findMany({
      where: { title: { contains: q, mode: "insensitive" } },
      select: { title: true },
      distinct: ["title"],
      orderBy: { scrapedAt: "desc" },
      take: 15,
    });

    const titles = rows.map((r) => r.title);
    return NextResponse.json({ titles });
  } catch (error) {
    console.error("Job title autocomplete error:", error);
    return NextResponse.json({ titles: [] });
  }
}
