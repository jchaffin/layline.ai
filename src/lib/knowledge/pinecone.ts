import crypto from "node:crypto";
import { Pinecone } from "@pinecone-database/pinecone";
import { openai } from "@/lib/api/openai";
import {
  DEFAULT_KNOWLEDGE_LIMIT,
  EMBEDDING_MODEL,
  KNOWLEDGE_CORPORA,
  getKnowledgeNamespace,
  MAX_KNOWLEDGE_LIMIT,
  type KnowledgeCorpus,
} from "./config";

export interface KnowledgeRecordMetadata {
  [key: string]: string | number | boolean | undefined;
  docId: string;
  text: string;
  filename: string;
  source: string;
  kbType: KnowledgeCorpus;
  contentHash?: string;
  company?: string;
  chunkIndex?: number;
  gcsPath?: string;
  gcsUri?: string;
  project?: string;
  roleTitle?: string;
  topic?: string;
  tags?: string;
  updatedAt?: string;
  userId?: string;
}

interface KnowledgeSearchResult {
  score: number;
  text: string;
  filename: string;
  company: string;
  source: string;
  topic: string;
  tags: string;
  roleTitle: string;
  project: string;
  gcsPath: string;
  docId: string;
}

interface UpsertKnowledgeDocumentParams {
  corpus: KnowledgeCorpus;
  docId: string;
  chunks: string[];
  metadata: Omit<KnowledgeRecordMetadata, "docId" | "text" | "chunkIndex">;
}

let pinecone: Pinecone | null = null;

const KNOWLEDGE_INDEX_BY_CORPUS: Record<KnowledgeCorpus, string> = {
  work_experience:
    process.env.PINECONE_WORK_EXPERIENCE_INDEX || "work-experience",
  interview_materials:
    process.env.PINECONE_INTERVIEW_MATERIALS_INDEX ||
    process.env.PINECONE_INTERVIEW_INDEX ||
    "interview-materials",
};

const KNOWLEDGE_EMBEDDING_DIMENSIONS_BY_CORPUS: Record<KnowledgeCorpus, number> = {
  work_experience: 1024,
  interview_materials: 1024,
};

function getPinecone(): Pinecone {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is not configured");
  }

  if (!pinecone) {
    pinecone = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  }

  return pinecone;
}

function getIndex(corpus: KnowledgeCorpus) {
  return getPinecone().index(KNOWLEDGE_INDEX_BY_CORPUS[corpus]);
}

function isIgnorableDeleteError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.name === "PineconeNotFoundError" ||
    error.message.includes("HTTP status 404")
  );
}

const MAX_UPSERT_BATCH_BYTES = 3_500_000;

function estimateRecordBytes(record: {
  id: string;
  values: number[];
  metadata: Record<string, string | number | boolean>;
}): number {
  return Buffer.byteLength(JSON.stringify(record), "utf8");
}

function createUpsertBatches(
  records: Array<{
    id: string;
    values: number[];
    metadata: Record<string, string | number | boolean>;
  }>,
): Array<
  Array<{
    id: string;
    values: number[];
    metadata: Record<string, string | number | boolean>;
  }>
> {
  const batches: Array<
    Array<{
      id: string;
      values: number[];
      metadata: Record<string, string | number | boolean>;
    }>
  > = [];

  let currentBatch: Array<{
    id: string;
    values: number[];
    metadata: Record<string, string | number | boolean>;
  }> = [];
  let currentBytes = 0;

  for (const record of records) {
    const recordBytes = estimateRecordBytes(record);

    if (currentBatch.length && currentBytes + recordBytes > MAX_UPSERT_BATCH_BYTES) {
      batches.push(currentBatch);
      currentBatch = [];
      currentBytes = 0;
    }

    currentBatch.push(record);
    currentBytes += recordBytes;
  }

  if (currentBatch.length) {
    batches.push(currentBatch);
  }

  return batches;
}

export function createKnowledgeDocId(parts: string[]): string {
  return crypto.createHash("sha1").update(parts.join(":")).digest("hex");
}

export function createContentHash(text: string): string {
  return crypto.createHash("sha1").update(text).digest("hex");
}

function normalizeForMatch(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function queryMentionsField(query: string, value: string): boolean {
  const normalizedQuery = normalizeForMatch(query);
  const normalizedValue = normalizeForMatch(value);

  if (!normalizedQuery || !normalizedValue || normalizedValue.length < 3) {
    return false;
  }

  return normalizedQuery.includes(normalizedValue);
}

function documentContainsAny(result: KnowledgeSearchResult, patterns: RegExp[]): boolean {
  const haystack = `${result.filename}\n${result.gcsPath}\n${result.text}`.toLowerCase();
  return patterns.some((pattern) => pattern.test(haystack));
}

function isAdministrativeDocument(result: KnowledgeSearchResult): boolean {
  return documentContainsAny(result, [
    /\boffer letter\b/,
    /\bemployment letter\b/,
    /\bfixed term offer\b/,
    /\bconfidentiality\b/,
    /\binventions agreement\b/,
    /\bhuman resources\b/,
    /\bovertime pay\b/,
    /\bpage \d+ of \d+\b/,
  ]);
}

function isWorkArtifactDocument(result: KnowledgeSearchResult): boolean {
  return documentContainsAny(result, [
    /\barchitecture\b/,
    /\bspecification\b/,
    /\bdesign\b/,
    /\bwhite paper\b/,
    /\bruntime\b/,
    /\bcompiler\b/,
    /\bbuild\b/,
    /\bmachine\b/,
    /\bsystem\b/,
    /\bproject\b/,
    /\bimplementation\b/,
    /\btutorial\b/,
    /\bengineering\b/,
  ]);
}

function isWorkHistoryQuery(query: string): boolean {
  const normalizedQuery = normalizeForMatch(query);
  return (
    /\bwhat did\b/.test(normalizedQuery) ||
    /\bworked on\b/.test(normalizedQuery) ||
    /\bactual work\b/.test(normalizedQuery) ||
    /\bbuilt\b/.test(normalizedQuery) ||
    /\bshipped\b/.test(normalizedQuery) ||
    /\bexperience\b/.test(normalizedQuery)
  );
}

function dedupeByDocId(results: KnowledgeSearchResult[]): KnowledgeSearchResult[] {
  const seen = new Set<string>();
  const deduped: KnowledgeSearchResult[] = [];

  for (const result of results) {
    if (seen.has(result.docId)) {
      continue;
    }

    seen.add(result.docId);
    deduped.push(result);
  }

  return deduped;
}

function rerankKnowledgeResults(params: {
  corpus: KnowledgeCorpus;
  query: string;
  limit: number;
  results: KnowledgeSearchResult[];
}): KnowledgeSearchResult[] {
  const normalizedQuery = normalizeForMatch(params.query);
  const hasAtCompanyPattern = /\bat\s+[a-z0-9]/.test(normalizedQuery);
  const workHistoryQuery = isWorkHistoryQuery(params.query);

  const reranked = params.results
    .map((result) => {
      let adjustedScore = result.score;

      if (params.corpus === "work_experience") {
        const companyMatch = queryMentionsField(params.query, result.company);
        const projectMatch = queryMentionsField(params.query, result.project);
        const roleMatch = queryMentionsField(params.query, result.roleTitle);

        if (companyMatch) {
          adjustedScore += 0.2;
        } else if (hasAtCompanyPattern && result.company) {
          adjustedScore -= 0.08;
        }

        if (projectMatch) {
          adjustedScore += 0.12;
        }

        if (roleMatch) {
          adjustedScore += 0.08;
        }

        if (result.source === "resume_upload") {
          adjustedScore += 0.08;
        }

        if (workHistoryQuery) {
          if (isWorkArtifactDocument(result)) {
            adjustedScore += 0.12;
          }

          if (isAdministrativeDocument(result)) {
            adjustedScore -= 0.35;
          }
        }
      }

      return {
        ...result,
        score: adjustedScore,
      };
    })
    .sort((a, b) => b.score - a.score);

  return dedupeByDocId(reranked).slice(0, params.limit);
}

async function embedTexts(
  input: string[],
  corpus: KnowledgeCorpus,
): Promise<number[][]> {
  if (!input.length) {
    return [];
  }

  const embeddings: number[][] = [];
  const batchSize = 64;

  for (let index = 0; index < input.length; index += batchSize) {
    const batch = input.slice(index, index + batchSize);
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
      dimensions: KNOWLEDGE_EMBEDDING_DIMENSIONS_BY_CORPUS[corpus],
    });

    embeddings.push(
      ...response.data
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding),
    );
  }

  return embeddings;
}

export async function upsertKnowledgeDocument({
  corpus,
  docId,
  chunks,
  metadata,
}: UpsertKnowledgeDocumentParams): Promise<number> {
  if (!chunks.length) {
    return 0;
  }

  const namespace = getIndex(corpus).namespace(getKnowledgeNamespace(corpus));

  try {
    await namespace.deleteMany({ filter: { docId: { $eq: docId } } });
  } catch (error) {
    if (!isIgnorableDeleteError(error)) {
      console.warn(`Failed to clear existing vectors for ${docId}:`, error);
    }
  }

  const embeddings = await embedTexts(chunks, corpus);
  const records = chunks.reduce<
    Array<{
      id: string;
      values: number[];
      metadata: Record<string, string | number | boolean>;
    }>
  >((acc, chunk, index) => {
    const values = embeddings[index];
    if (!Array.isArray(values) || !values.length) {
      return acc;
    }

    acc.push({
      id: `${docId}:${index}`,
      values,
      metadata: {
        ...(metadata as Record<string, string | number | boolean>),
        docId,
        text: chunk,
        chunkIndex: index,
      },
    });
    return acc;
  }, []);

  if (!records.length) {
    return 0;
  }

  const batches = createUpsertBatches(records);
  for (const batch of batches) {
    await namespace.upsert({ records: batch as any[] });
  }

  return records.length;
}

export async function queryKnowledge(params: {
  corpus: KnowledgeCorpus;
  query: string;
  filter?: Record<string, unknown>;
  limit?: number;
}) {
  const vector = (await embedTexts([params.query], params.corpus))[0];
  const namespace = getIndex(params.corpus).namespace(getKnowledgeNamespace(params.corpus));
  const requestedLimit = Math.min(
    Math.max(params.limit ?? DEFAULT_KNOWLEDGE_LIMIT, 1),
    MAX_KNOWLEDGE_LIMIT,
  );
  const topK = Math.min(Math.max(requestedLimit * 4, requestedLimit), MAX_KNOWLEDGE_LIMIT);

  const results = await namespace.query({
    vector,
    topK,
    includeMetadata: true,
    filter: params.filter,
  });

  const mappedResults: KnowledgeSearchResult[] = (results.matches || []).map((match) => {
    const metadata = (match.metadata || {}) as Record<string, unknown>;

    return {
      score: typeof match.score === "number" ? match.score : 0,
      text: typeof metadata.text === "string" ? metadata.text : "",
      filename: typeof metadata.filename === "string" ? metadata.filename : "",
      company: typeof metadata.company === "string" ? metadata.company : "",
      source: typeof metadata.source === "string" ? metadata.source : "",
      topic: typeof metadata.topic === "string" ? metadata.topic : "",
      tags: typeof metadata.tags === "string" ? metadata.tags : "",
      roleTitle: typeof metadata.roleTitle === "string" ? metadata.roleTitle : "",
      project: typeof metadata.project === "string" ? metadata.project : "",
      gcsPath: typeof metadata.gcsPath === "string" ? metadata.gcsPath : "",
      docId: typeof metadata.docId === "string" ? metadata.docId : "",
    };
  });

  return rerankKnowledgeResults({
    corpus: params.corpus,
    query: params.query,
    limit: requestedLimit,
    results: mappedResults,
  });
}
