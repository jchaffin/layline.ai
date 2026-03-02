import { NextRequest, NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

export async function DELETE(request: NextRequest) {
  try {
    const bucketName = process.env.AWS_S3_BUCKET;
    
    if (!bucketName) {
      return NextResponse.json(
        { error: "S3 bucket not configured" },
        { status: 500 }
      );
    }

    console.log("Starting S3 bucket cleanup...");

    // List all objects in the bucket
    const listCommand = new ListObjectsV2Command({
      Bucket: bucketName,
    });

    const listResponse = await s3Client.send(listCommand);
    
    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      console.log("No objects found in S3 bucket");
      return NextResponse.json({
        message: "No documents found to delete",
        deletedCount: 0
      });
    }

    console.log(`Found ${listResponse.Contents.length} objects to delete`);

    // Prepare objects for deletion
    const objectsToDelete = listResponse.Contents.map(obj => ({
      Key: obj.Key!
    }));

    // Delete all objects
    const deleteCommand = new DeleteObjectsCommand({
      Bucket: bucketName,
      Delete: {
        Objects: objectsToDelete,
        Quiet: false
      }
    });

    const deleteResponse = await s3Client.send(deleteCommand);
    
    const deletedCount = deleteResponse.Deleted?.length || 0;
    const errors = deleteResponse.Errors || [];

    console.log(`Successfully deleted ${deletedCount} objects`);
    
    if (errors.length > 0) {
      console.error("Some objects failed to delete:", errors);
    }

    return NextResponse.json({
      message: `Successfully cleared S3 bucket`,
      deletedCount,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error("Error clearing S3 bucket:", error);
    return NextResponse.json(
      {
        error: "Failed to clear S3 bucket",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}