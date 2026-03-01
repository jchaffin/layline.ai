import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

// Initialize S3 client
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
    const limit = parseInt(searchParams.get('limit') || '10');
    const prefix = searchParams.get('prefix') || 'tailored-resumes/';

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json({
        resumes: [],
        message: 'AWS S3 not configured - no stored resumes available'
      });
    }

    // List objects from S3
    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
      Prefix: prefix,
      MaxKeys: limit,
    });

    const response = await s3Client.send(command);
    
    if (!response.Contents) {
      return NextResponse.json({ resumes: [] });
    }

    // Get metadata for each resume
    const resumePromises = await Promise.all(
      response.Contents.map(async (object) => {
        try {
          const getCommand = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
            Key: object.Key,
          });
          
          const objectResponse = await s3Client.send(getCommand);
          const body = await objectResponse.Body?.transformToString();
          let data: Record<string, unknown> = {};

          if (body) {
            try {
              data = JSON.parse(body) as Record<string, unknown>;
            } catch (parseError) {
              console.error('Invalid JSON in S3 object:', object.Key, 'Content:', body?.substring(0, 100));
              return null;
            }
          }

          return {
            key: object.Key,
            size: object.Size,
            lastModified: object.LastModified,
            companyName: (data.companyName as string) || 'Unknown',
            roleTitle: (data.roleTitle as string) || 'Unknown Role',
            createdAt: data.createdAt,
            s3Url: `s3://${process.env.AWS_S3_BUCKET || 'interview-assistant-resumes'}/${object.Key}`,
            metadata: {
              hasOriginal: !!data.originalResume,
              hasTailored: !!data.tailoredResume,
              hasJobDescription: !!data.jobDescription,
            },
          };
        } catch (error) {
          console.error('Error processing resume object:', error);
          return null;
        }
      })
    );

    // Filter out null values (invalid resumes)
    const resumes = resumePromises.filter(resume => resume !== null);

    return NextResponse.json({
      resumes: resumes.sort((a, b) => 
        new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
      ),
      total: response.KeyCount || 0,
      hasMore: response.IsTruncated || false,
    });
  } catch (error) {
    console.error('Error listing resumes:', error);
    return NextResponse.json(
      { error: 'Failed to list resumes from S3' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Resume key is required' },
        { status: 400 }
      );
    }

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'AWS S3 not configured' },
        { status: 503 }
      );
    }

    // Delete object from S3
    const command = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
      Key: key,
    });

    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}