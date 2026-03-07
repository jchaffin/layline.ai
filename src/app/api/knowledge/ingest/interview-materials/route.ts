import { NextRequest, NextResponse } from "next/server";
import { getKnowledgeBucket } from "@/lib/knowledge/config";
import { ingestBucketCorpus } from "@/lib/knowledge/ingest";
import { canManageKnowledge } from "@/lib/knowledge/requestAuth";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const access = await canManageKnowledge(request);
  if (!access.authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const bucketName =
      typeof body.bucketName === "string" && body.bucketName.trim()
        ? body.bucketName.trim()
        : getKnowledgeBucket("interview_materials");
    const prefix =
      typeof body.prefix === "string" && body.prefix.trim()
        ? body.prefix.trim()
        : undefined;
    const pdfOnly = body.pdfOnly !== false;

    const summary = await ingestBucketCorpus({
      corpus: "interview_materials",
      bucketName,
      prefix,
      extensions: pdfOnly ? [".pdf"] : undefined,
    });

    return NextResponse.json({
      success: true,
      corpus: "interview_materials",
      bucketName,
      pdfOnly,
      summary,
    });
  } catch (error) {
    console.error("Interview materials ingest error:", error);
    return NextResponse.json(
      {
        error: "Failed to ingest interview materials",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    );
  }
}
