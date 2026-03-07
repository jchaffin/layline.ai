import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeBucket } from "@/lib/knowledge/config";
import {
  ingestBucketCorpus,
  ingestWorkExperienceResume,
  type IngestSummary,
} from "@/lib/knowledge/ingest";
import { canManageKnowledge } from "@/lib/knowledge/requestAuth";
import {
  listResumeObjects,
  parseResumeStorageKey,
  readResumeText,
} from "@/lib/resumeStorage";

export const maxDuration = 300;

function addSummary(target: IngestSummary, source: IngestSummary) {
  target.processed += source.processed;
  target.indexed += source.indexed;
  target.skipped += source.skipped;
  target.failed += source.failed;
  target.chunks += source.chunks;
  target.errors.push(...source.errors);
}

function emptySummary(): IngestSummary {
  return {
    processed: 0,
    indexed: 0,
    skipped: 0,
    failed: 0,
    chunks: 0,
    errors: [],
  };
}

export async function POST(request: NextRequest) {
  const access = await canManageKnowledge(request);
  if (!access.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const userId =
      typeof body.userId === "string" && body.userId.trim()
        ? body.userId.trim()
        : access.userId;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required for work experience ingestion" },
        { status: 400 },
      );
    }

    const includeBucket = body.includeBucket !== false;
    const includeResumes = body.includeResumes !== false;
    const bucketName =
      typeof body.bucketName === "string" && body.bucketName.trim()
        ? body.bucketName.trim()
        : getKnowledgeBucket("work_experience");
    const prefix =
      typeof body.prefix === "string" && body.prefix.trim()
        ? body.prefix.trim()
        : undefined;
    const pdfOnly = body.pdfOnly !== false;

    const summary = emptySummary();
    let resumesIndexed = 0;

    if (includeBucket) {
      const bucketSummary = await ingestBucketCorpus({
        corpus: "work_experience",
        bucketName,
        prefix,
        userId,
        extensions: pdfOnly ? [".pdf"] : undefined,
      });
      addSummary(summary, bucketSummary);
    }

    if (includeResumes) {
      const files = await listResumeObjects(`${userId}/`);
      const parsedResumeFiles = files.filter(
        (file) => parseResumeStorageKey(file.name)?.type === "parsed",
      );

      for (const resume of parsedResumeFiles) {
        const parsedKey = parseResumeStorageKey(resume.name);
        if (!parsedKey) {
          continue;
        }

        const body = await readResumeText(resume.name);
        if (!body) {
          continue;
        }

        let parsedData: Record<string, unknown> | null = null;
        try {
          parsedData = JSON.parse(body) as Record<string, unknown>;
        } catch {
          parsedData = null;
        }

        const resumeSummary = await ingestWorkExperienceResume({
          userId,
          resumeId: parsedKey.resumeId,
          fileName: parsedKey.fileName || `${parsedKey.versionId}.json`,
          parsedData,
        });
        addSummary(summary, resumeSummary);
        resumesIndexed += 1;
      }
    }

    return NextResponse.json({
      success: true,
      corpus: "work_experience",
      bucketName: includeBucket ? bucketName : null,
      userId,
      pdfOnly,
      resumesIndexed,
      summary,
    });
  } catch (error) {
    console.error("Work experience ingest error:", error);
    return NextResponse.json(
      {
        error: "Failed to ingest work experience knowledge",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
