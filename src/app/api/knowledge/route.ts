import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest } from "@/lib/api/auth";
import { openai } from "@/lib/api/openai";
import {
  DEFAULT_KNOWLEDGE_LIMIT,
  isKnowledgeCorpus,
  MAX_KNOWLEDGE_LIMIT,
} from "@/lib/knowledge/config";
import { queryKnowledge } from "@/lib/knowledge/pinecone";

function normalizeCompanyTag(value: string): string {
  const suffixes = new Set([
    "company",
    "computing",
    "corp",
    "corporation",
    "inc",
    "incorporated",
    "llc",
    "ltd",
    "systems",
    "technologies",
    "technology",
  ]);

  const tokens = value
    .toLowerCase()
    .replace(/[^a-z0-9\s&-]+/g, " ")
    .split(/[\s&-]+/)
    .filter(Boolean)
    .filter((token) => !suffixes.has(token));

  if (!tokens.length) {
    return "";
  }

  return tokens.join("");
}

function inferCompanyFromQuery(query: string): string | null {
  const patterns = [
    /\bat\s+([a-z0-9][a-z0-9\s&.-]{1,40})/i,
    /\bfor\s+([a-z0-9][a-z0-9\s&.-]{1,40})/i,
    /\bfrom\s+([a-z0-9][a-z0-9\s&.-]{1,40})/i,
  ];

  for (const pattern of patterns) {
    const match = query.match(pattern);
    const candidate = match?.[1]?.trim();
    if (!candidate) {
      continue;
    }

    const normalized = normalizeCompanyTag(candidate);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function shouldGenerateOverview(corpus: string, query: string): boolean {
  if (corpus !== "work_experience") {
    return false;
  }

  const normalizedQuery = query.toLowerCase();
  return (
    normalizedQuery.includes("what did") ||
    normalizedQuery.includes("overview") ||
    normalizedQuery.includes("high level") ||
    normalizedQuery.includes("worked on") ||
    normalizedQuery.includes("tell me about")
  );
}

async function generateOverview(params: {
  query: string;
  company?: string | null;
  results: Array<{
    filename: string;
    company: string;
    topic?: string;
    tags?: string;
    text: string;
  }>;
}): Promise<string | null> {
  if (!params.results.length) {
    return null;
  }

  const sources = params.results
    .slice(0, 5)
    .map((result, index) => {
      const lines = [
        `Source ${index + 1}: ${result.filename}`,
        result.company ? `Company: ${result.company}` : "",
        result.topic ? `Topic: ${result.topic}` : "",
        result.tags ? `Tags: ${result.tags}` : "",
        `Excerpt: ${result.text.slice(0, 1200)}`,
      ].filter(Boolean);

      return lines.join("\n");
    })
    .join("\n\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You synthesize work-experience retrieval results into a high-level overview. " +
          "Focus on what the person actually worked on, the systems/projects involved, and the technical themes. " +
          "Do not mention missing information or speculate. " +
          "Return 3-5 concise bullet points as plain text.",
      },
      {
        role: "user",
        content:
          `Question: ${params.query}\n` +
          `Company: ${params.company || "unknown"}\n\n` +
          `Retrieved sources:\n${sources}`,
      },
    ],
  });

  return response.choices[0]?.message?.content?.trim() || null;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, company, corpus, filename, topic } = body;
    const limit = Math.min(
      Math.max(Number(body.limit) || DEFAULT_KNOWLEDGE_LIMIT, 1),
      MAX_KNOWLEDGE_LIMIT,
    );

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    if (!isKnowledgeCorpus(corpus)) {
      return NextResponse.json(
        { error: "corpus is required" },
        { status: 400 },
      );
    }

    if (!process.env.PINECONE_API_KEY || !process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "Knowledge search is not configured" },
        { status: 500 }
      );
    }

    const filter: Record<string, unknown> = {};

    const explicitCompany =
      typeof company === "string" && company.trim()
        ? normalizeCompanyTag(company.trim())
        : "";
    const inferredCompany =
      corpus === "work_experience" && !explicitCompany
        ? inferCompanyFromQuery(query)
        : null;
    const companyFilter = explicitCompany || inferredCompany || "";

    if (companyFilter) {
      filter.company = { $eq: companyFilter };
    }

    if (typeof filename === "string" && filename.trim()) {
      filter.filename = { $eq: filename.trim() };
    }

    if (typeof topic === "string" && topic.trim()) {
      filter.topic = { $eq: topic.trim() };
    }

    if (corpus === "work_experience") {
      let userId =
        typeof body.userId === "string" && body.userId.trim()
          ? body.userId.trim()
          : "";

      if (!userId) {
        const session = await getSessionFromRequest(request).catch(() => null);
        userId = session?.user?.id || "";
      }

      if (!userId) {
        return NextResponse.json(
          { error: "Authenticated user required for work experience search" },
          { status: 401 },
        );
      }

      filter.userId = { $eq: userId };
    }

    const baseFilter = Object.keys(filter).length ? { ...filter } : undefined;
    let results = await queryKnowledge({
      corpus,
      query,
      filter: baseFilter,
      limit,
    });

    if (!results.length && inferredCompany) {
      const fallbackFilter = { ...(filter as Record<string, unknown>) };
      delete fallbackFilter.company;
      results = await queryKnowledge({
        corpus,
        query,
        filter: Object.keys(fallbackFilter).length ? fallbackFilter : undefined,
        limit,
      });
    }

    const overview = shouldGenerateOverview(corpus, query)
      ? await generateOverview({
          query,
          company: companyFilter || inferredCompany,
          results,
        })
      : null;

    return NextResponse.json({
      corpus,
      resultsFound: results.length,
      overview,
      results,
    });
  } catch (error) {
    console.error("Knowledge search error:", error);
    return NextResponse.json(
      { error: "Knowledge search failed", details: String(error) },
      { status: 500 }
    );
  }
}
