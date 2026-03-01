import { NextRequest, NextResponse } from 'next/server';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const download = searchParams.get('download') === 'true';

    if (!key) {
      return NextResponse.json(
        { error: 'Document key is required' },
        { status: 400 }
      );
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS S3 not configured' },
        { status: 503 }
      );
    }

    if (download) {
      // Generate signed URL for download
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
        Key: key,
      });

      const signedUrl = await getSignedUrl(s3Client, command, { 
        expiresIn: 3600 // 1 hour
      });

      return NextResponse.json({
        downloadUrl: signedUrl,
        expiresIn: 3600,
      });
    } else {
      // Stream the file directly
      const command = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
        Key: key,
      });

      const response = await s3Client.send(command);
      
      if (!response.Body) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      const body = await response.Body.transformToByteArray();

      return new NextResponse(body as BufferSource, {
        headers: {
          'Content-Type': response.ContentType || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${key.split('/').pop()}"`,
        },
      });
    }
  } catch (error) {
    console.error('Document download error:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}