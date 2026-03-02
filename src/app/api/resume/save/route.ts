import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET } from "@/lib/api/s3";

export async function POST(request: NextRequest) {
  try {
    const { key, data } = await request.json();

    if (!key || !data) {
      return NextResponse.json({ error: "key and data required" }, { status: 400 });
    }

    const command = new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key.startsWith("parsed-resumes/") ? key : `parsed-resumes/${key}`,
      Body: JSON.stringify(data),
      ContentType: "application/json",
      Metadata: { updatedAt: new Date().toISOString() },
    });

    await s3Client.send(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Resume save error:", error);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}
