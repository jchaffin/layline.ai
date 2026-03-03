import { NextRequest, NextResponse } from "next/server";
import { searchKnowledge } from "@layline/agents/handlers";

export async function POST(request: NextRequest) {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const pineconeApiKey = process.env.PINECONE_API_KEY;

    if (!pineconeApiKey || !openaiApiKey) {
      return NextResponse.json(
        { error: "Knowledge search not configured" },
        { status: 500 },
      );
    }

    const body = await request.json();
    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 },
      );
    }

    const result = await searchKnowledge(
      {
        openaiApiKey,
        pineconeApiKey,
        pineconeIndex: process.env.PINECONE_INDEX,
      },
      body,
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error("Knowledge search error:", error);
    return NextResponse.json(
      { error: "Knowledge search failed", details: String(error) },
      { status: 500 },
    );
  }
}
