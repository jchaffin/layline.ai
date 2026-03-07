import path from "node:path";
import type { ParsedResume } from "@/lib/schema";
import { openai } from "@/lib/api/openai";
import type { KnowledgeCorpus } from "./config";
import { getKnowledgeBucket } from "./config";
import { chunkText } from "./chunking";
import { extractDocumentText } from "./documentText";
import {
  downloadBucketObject,
  listBucketObjects,
  toGcsUri,
  type GcsObject,
} from "./gcs";
import {
  createContentHash,
  createKnowledgeDocId,
  upsertKnowledgeDocument,
} from "./pinecone";

export interface IngestSummary {
  processed: number;
  indexed: number;
  skipped: number;
  failed: number;
  chunks: number;
  errors: string[];
}

interface TopicTaggingResult {
  topic?: string;
  tags?: string[];
}

function createEmptySummary(): IngestSummary {
  return {
    processed: 0,
    indexed: 0,
    skipped: 0,
    failed: 0,
    chunks: 0,
    errors: [],
  };
}

function mergeSummary(target: IngestSummary, source: IngestSummary) {
  target.processed += source.processed;
  target.indexed += source.indexed;
  target.skipped += source.skipped;
  target.failed += source.failed;
  target.chunks += source.chunks;
  target.errors.push(...source.errors);
}

function firstPathSegment(filePath: string): string {
  const [segment] = filePath.split("/").filter(Boolean);
  return segment || "";
}

function buildResumeKnowledgeText(
  fileContent: string | undefined,
  parsedData?: ParsedResume | Record<string, unknown> | null,
): string {
  const sections: string[] = [];
  const parsed = parsedData && typeof parsedData === "object" ? parsedData : null;
  const summary = parsed && typeof parsed.summary === "string" ? parsed.summary : "";
  const skills = parsed && Array.isArray(parsed.skills) ? parsed.skills : [];
  const experience = parsed && Array.isArray(parsed.experience) ? parsed.experience : [];

  if (summary) {
    sections.push(`Summary:\n${summary}`);
  }

  if (skills.length) {
    sections.push(`Skills:\n${skills.join(", ")}`);
  }

  for (const item of experience) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const company = typeof item.company === "string" ? item.company : "";
    const role = typeof item.role === "string" ? item.role : "";
    const duration = typeof item.duration === "string" ? item.duration : "";
    const description =
      typeof item.description === "string" ? item.description : "";

    const lines = [
      `Company: ${company}`.trim(),
      `Role: ${role}`.trim(),
      duration ? `Duration: ${duration}` : "",
      description ? `Details:\n${description}` : "",
    ].filter(Boolean);

    if (lines.length) {
      sections.push(lines.join("\n"));
    }
  }

  if (fileContent?.trim()) {
    sections.push(`Raw Resume Text:\n${fileContent}`);
  }

  return sections.join("\n\n").trim();
}

async function inferTopicTags(params: {
  corpus: KnowledgeCorpus;
  filename: string;
  text: string;
  company?: string;
  project?: string;
}): Promise<TopicTaggingResult> {
  const sample = params.text.slice(0, 12000);
  if (!sample.trim()) {
    return {};
  }

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "You classify documents for semantic retrieval. " +
          "Return strict JSON with keys topic and tags. " +
          "topic should be a short specific label. " +
          "tags should be 3-6 concise topic tags. " +
          "Prefer technical/project subject matter over generic labels.",
      },
      {
        role: "user",
        content:
          `Corpus: ${params.corpus}\n` +
          `Filename: ${params.filename}\n` +
          `Company: ${params.company || ""}\n` +
          `Project: ${params.project || ""}\n\n` +
          `Document sample:\n${sample}`,
      },
    ],
  });

  const parsed = JSON.parse(response.choices[0]?.message?.content || "{}") as Record<
    string,
    unknown
  >;

  const topic = typeof parsed.topic === "string" ? parsed.topic.trim() : "";
  const tags = Array.isArray(parsed.tags)
    ? parsed.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    : [];

  return {
    topic: topic || undefined,
    tags: tags.length ? tags : undefined,
  };
}

function buildTaggedKnowledgeText(text: string, tagging: TopicTaggingResult): string {
  const headerLines = [
    tagging.topic ? `Primary Topic: ${tagging.topic}` : "",
    tagging.tags?.length ? `Topic Tags: ${tagging.tags.join(", ")}` : "",
  ].filter(Boolean);

  if (!headerLines.length) {
    return text;
  }

  return `${headerLines.join("\n")}\n\n${text}`;
}

export async function ingestTextDocument(params: {
  corpus: KnowledgeCorpus;
  docId: string;
  text: string;
  metadata: {
    filename: string;
    source: string;
    company?: string;
    gcsPath?: string;
    gcsUri?: string;
    project?: string;
    roleTitle?: string;
    topic?: string;
    tags?: string;
    updatedAt?: string;
    userId?: string;
  };
}): Promise<IngestSummary> {
  const summary = createEmptySummary();
  summary.processed = 1;

  const normalized = params.text.trim();
  if (!normalized) {
    summary.skipped = 1;
    return summary;
  }

  const tagging = await inferTopicTags({
    corpus: params.corpus,
    filename: params.metadata.filename,
    text: normalized,
    company: params.metadata.company,
    project: params.metadata.project,
  });
  const taggedText = buildTaggedKnowledgeText(normalized, tagging);

  const chunks = chunkText(taggedText).map((chunk) => chunk.text);
  if (!chunks.length) {
    summary.skipped = 1;
    return summary;
  }

  const contentHash = createContentHash(taggedText);
  const indexedChunks = await upsertKnowledgeDocument({
    corpus: params.corpus,
    docId: params.docId,
    chunks,
    metadata: {
      ...params.metadata,
      topic: tagging.topic || params.metadata.topic,
      tags: tagging.tags?.join(", "),
      kbType: params.corpus,
      contentHash,
    },
  });

  summary.indexed = 1;
  summary.chunks = indexedChunks;
  return summary;
}

async function ingestBucketObject(params: {
  corpus: KnowledgeCorpus;
  object: GcsObject;
  userId?: string;
}): Promise<IngestSummary> {
  const summary = createEmptySummary();
  summary.processed = 1;

  try {
    const buffer = await downloadBucketObject(params.object.bucket, params.object.name);
    const text = await extractDocumentText({
      buffer,
      fileName: params.object.name,
      contentType: params.object.contentType,
    });

    if (!text) {
      summary.skipped = 1;
      return summary;
    }

    const filename = path.basename(params.object.name);
    const segment = firstPathSegment(params.object.name);
    const docId = createKnowledgeDocId([
      params.corpus,
      params.object.bucket,
      params.object.name,
      params.userId || "shared",
    ]);

    return ingestTextDocument({
      corpus: params.corpus,
      docId,
      text,
      metadata: {
        filename,
        source: "gcs",
        company: params.corpus === "work_experience" ? segment : undefined,
        gcsPath: params.object.name,
        gcsUri: toGcsUri(params.object.bucket, params.object.name),
        project: params.corpus === "work_experience" ? segment : undefined,
        topic: params.corpus === "interview_materials" ? segment : undefined,
        updatedAt: params.object.updated,
        userId: params.userId,
      },
    });
  } catch (error) {
    summary.failed = 1;
    summary.errors.push(
      `${params.object.name}: ${error instanceof Error ? error.message : String(error)}`,
    );
    return summary;
  }
}

export async function ingestBucketCorpus(params: {
  corpus: KnowledgeCorpus;
  bucketName?: string;
  prefix?: string;
  userId?: string;
  extensions?: string[];
}): Promise<IngestSummary> {
  const summary = createEmptySummary();
  const bucketName = params.bucketName || getKnowledgeBucket(params.corpus);
  const objects = await listBucketObjects(bucketName, params.prefix, {
    extensions: params.extensions,
  });

  for (const object of objects) {
    const objectSummary = await ingestBucketObject({
      corpus: params.corpus,
      object,
      userId: params.userId,
    });
    mergeSummary(summary, objectSummary);
  }

  return summary;
}

export async function ingestWorkExperienceResume(params: {
  userId: string;
  fileName: string;
  fileContent?: string;
  parsedData?: ParsedResume | Record<string, unknown> | null;
  resumeId?: string;
}): Promise<IngestSummary> {
  const text = buildResumeKnowledgeText(params.fileContent, params.parsedData);
  const docId = createKnowledgeDocId([
    "resume",
    params.userId,
    params.resumeId || params.fileName,
  ]);

  return ingestTextDocument({
    corpus: "work_experience",
    docId,
    text,
    metadata: {
      filename: params.fileName,
      source: "resume_upload",
      userId: params.userId,
      updatedAt: new Date().toISOString(),
    },
  });
}
