import { NextResponse } from "next/server";
import { PutBucketCorsCommand } from "@aws-sdk/client-s3";
import { s3Client, S3_BUCKET } from "@/lib/api/s3";

export async function POST() {
  try {
    if (!S3_BUCKET) {
      return NextResponse.json(
        { error: "S3 bucket not configured" },
        { status: 500 }
      );
    }

    const corsConfiguration = {
      CORSRules: [
        {
          AllowedHeaders: ["*"],
          AllowedMethods: ["GET", "HEAD"],
          AllowedOrigins: ["*"],
          ExposeHeaders: ["ETag"],
          MaxAgeSeconds: 3600,
        },
      ],
    };

    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: S3_BUCKET,
        CORSConfiguration: corsConfiguration,
      })
    );

    return NextResponse.json({
      message: "CORS configuration applied successfully",
      corsRules: corsConfiguration.CORSRules,
    });
  } catch (error) {
    console.error("Error configuring CORS:", error);
    return NextResponse.json(
      {
        error: "Failed to configure CORS",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
