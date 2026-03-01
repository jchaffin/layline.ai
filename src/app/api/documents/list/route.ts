import { NextRequest, NextResponse } from 'next/server';
import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3';

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
    const type = searchParams.get('type') || 'all'; // 'original', 'tailored', 'parsed', or 'all'
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      return NextResponse.json({
        documents: [],
        message: 'AWS S3 not configured - no stored documents available'
      });
    }

    const prefixes = {
      original: 'original-resumes/',
      tailored: 'tailored-resumes/',
      parsed: '', // No longer storing parsed text files
    };

    let allDocuments: any[] = [];

    // Get documents based on type filter
    if (type === 'all') {
      // Fetch from all prefixes and deduplicate
      const seenKeys = new Set();
      for (const [docType, prefix] of Object.entries(prefixes)) {
        const docs = await fetchDocuments(prefix, limit, docType);
        for (const doc of docs) {
          if (!seenKeys.has(doc.key)) {
            seenKeys.add(doc.key);
            allDocuments.push(doc);
          }
        }
      }
    } else if (prefixes[type as keyof typeof prefixes]) {
      allDocuments = await fetchDocuments(prefixes[type as keyof typeof prefixes], limit, type);
    } else {
      return NextResponse.json(
        { error: 'Invalid document type' },
        { status: 400 }
      );
    }

    // Sort by last modified
    allDocuments.sort((a, b) => 
      new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
    );

    return NextResponse.json({
      documents: allDocuments,
      total: allDocuments.length,
    });
  } catch (error) {
    console.error('Error listing documents:', error);
    return NextResponse.json(
      { error: 'Failed to list documents from S3' },
      { status: 500 }
    );
  }
}

async function fetchDocuments(prefix: string, limit: number, type: string) {
  const command = new ListObjectsV2Command({
    Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
    Prefix: prefix,
    MaxKeys: limit,
  });

  const response = await s3Client.send(command);
  
  if (!response.Contents) {
    return [];
  }

  // Get metadata for each document
  const documents = await Promise.all(
    response.Contents.map(async (object) => {
      try {
        const document = {
          key: object.Key!,
          size: object.Size || 0,
          lastModified: object.LastModified,
          type,
          fileName: object.Key!.split('/').pop() || 'unknown',
          downloadUrl: `/api/documents/download?key=${encodeURIComponent(object.Key!)}`,
          signedDownloadUrl: `/api/documents/download?key=${encodeURIComponent(object.Key!)}&download=true`,
        };

        // For parsed documents, get additional metadata (only for JSON files)
        if (type === 'parsed' && object.Key!.endsWith('.json')) {
          try {
            const getCommand = new GetObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
              Key: object.Key,
            });
            
            const objectResponse = await s3Client.send(getCommand);
            const body = await objectResponse.Body?.transformToString();
            
            // Only parse JSON if it looks like JSON
            let data: Record<string, unknown> = {};
            if (body && body.trim().startsWith('{')) {
              try {
                data = JSON.parse(body) as Record<string, unknown>;
              } catch (parseError) {
                console.warn('JSON parse error for', object.Key, parseError);
                data = {};
              }
            }

            return {
              ...document,
              metadata: {
                originalFileName: (data.fileName ?? data.originalFileName) as string | undefined,
                companyName: data.companyName as string | undefined,
                roleTitle: data.roleTitle as string | undefined,
                uploadedAt: data.uploadedAt as string | undefined,
                createdAt: data.createdAt as string | undefined,
              },
            };
          } catch (error) {
            console.warn('Failed to get metadata for document:', object.Key, error);
          }
        }

        return document;
      } catch (error) {
        console.error('Error processing document object:', error);
        return {
          key: object.Key!,
          size: object.Size || 0,
          lastModified: object.LastModified,
          type,
          fileName: 'Error loading',
          error: 'Failed to load document data',
        };
      }
    })
  );

  // Remove duplicates and filter out errored documents
  const uniqueDocuments = documents
    .filter(doc => !('error' in doc))
    .filter((doc, index, self) => 
      index === self.findIndex(d => d.key === doc.key)
    );
  
  return uniqueDocuments;
}