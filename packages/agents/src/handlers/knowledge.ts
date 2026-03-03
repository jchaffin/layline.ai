import OpenAI from "openai";
import { Pinecone } from "@pinecone-database/pinecone";

const EMBEDDING_MODEL = "text-embedding-3-large";
const NAMESPACE = "knowledge";

export interface KnowledgeConfig {
  openaiApiKey: string;
  pineconeApiKey: string;
  pineconeIndex?: string;
}

export interface KnowledgeInput {
  query: string;
  company?: string;
  limit?: number;
}

export interface KnowledgeResult {
  score: number | undefined;
  text: string;
  company: string;
  filename: string;
}

export async function searchKnowledge(
  config: KnowledgeConfig,
  input: KnowledgeInput,
): Promise<{ resultsFound: number; results: KnowledgeResult[] }> {
  if (!input.query) {
    throw new Error("query is required");
  }

  const openai = new OpenAI({ apiKey: config.openaiApiKey });
  const pinecone = new Pinecone({ apiKey: config.pineconeApiKey });
  const indexName = config.pineconeIndex || "repo-chunks-3072";
  const index = pinecone.index(indexName);
  const ns = index.namespace(NAMESPACE);

  const embRes = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: input.query,
  });
  const vector = embRes.data[0].embedding;

  const filter = input.company
    ? { company: { $eq: input.company } }
    : undefined;

  const results = await ns.query({
    vector,
    topK: input.limit ?? 10,
    includeMetadata: true,
    filter,
  });

  const formatted = (results.matches || []).map((m) => ({
    score: m.score,
    text: (m.metadata as Record<string, unknown>)?.text as string || "",
    company: (m.metadata as Record<string, unknown>)?.company as string || "",
    filename: (m.metadata as Record<string, unknown>)?.filename as string || "",
  }));

  return { resultsFound: formatted.length, results: formatted };
}
