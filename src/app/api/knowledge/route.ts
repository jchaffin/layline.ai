import { NextRequest, NextResponse } from "next/server";
import { Pinecone } from "@pinecone-database/pinecone";
import { openai } from "@/lib/api/openai";

const EMBEDDING_MODEL = "text-embedding-3-large";
const NAMESPACE = "knowledge";

let pinecone: Pinecone | null = null;

function getPinecone() {
  if (!pinecone) {
    pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY! });
  }
  return pinecone;
}

function getIndex() {
  const indexName = process.env.PINECONE_INDEX || "repo-chunks-3072";
  return getPinecone().index(indexName);
}

async function embed(text: string): Promise<number[]> {
  const res = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: text,
  });
  return res.data[0].embedding;
}

export async function POST(request: NextRequest) {
  try {
    const { query, company, limit = 10 } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    if (!process.env.PINECONE_API_KEY) {
      return NextResponse.json(
        { error: "Pinecone not configured" },
        { status: 500 }
      );
    }

    const vector = await embed(query);
    const index = getIndex();
    const ns = index.namespace(NAMESPACE);

    const filter = company ? { company: { $eq: company } } : undefined;

    const results = await ns.query({
      vector,
      topK: limit,
      includeMetadata: true,
      filter,
    });

    const formatted = (results.matches || []).map((m) => ({
      score: m.score,
      text: (m.metadata as Record<string, unknown>)?.text || "",
      company: (m.metadata as Record<string, unknown>)?.company || "",
      filename: (m.metadata as Record<string, unknown>)?.filename || "",
    }));

    return NextResponse.json({
      resultsFound: formatted.length,
      results: formatted,
    });
  } catch (error) {
    console.error("Knowledge search error:", error);
    return NextResponse.json(
      { error: "Knowledge search failed", details: String(error) },
      { status: 500 }
    );
  }
}
