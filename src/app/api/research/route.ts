import { NextRequest, NextResponse } from "next/server";
import { researchCompany } from "@layline/agents/handlers";

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Perplexity API key not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();
    const result = await researchCompany(
      { perplexityApiKey: apiKey },
      body,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json(
      { error: "Research failed", details: String(error) },
      { status: 500 },
    );
  }
}
