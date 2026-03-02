import { NextRequest, NextResponse } from 'next/server';
import { DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { s3Client, S3_BUCKET } from '@/lib/api/s3';
import { prisma } from '@/lib/db';

async function deleteS3Object(key: string) {
  await s3Client.send(new DeleteObjectCommand({ Bucket: S3_BUCKET, Key: key }));
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Document key is required' }, { status: 400 });
    }

    await deleteS3Object(key);

    if (key.startsWith('original-resumes/')) {
      const parsedKey = key
        .replace('original-resumes/', 'parsed-resumes/')
        .replace(/\.[^.]+$/, '-parsed.json');
      await deleteS3Object(parsedKey).catch(() => {});

      const res = await s3Client.send(
        new ListObjectsV2Command({ Bucket: S3_BUCKET, Prefix: 'tailored-resumes/', MaxKeys: 200 })
      );
      if (res.Contents) {
        const deletes = res.Contents
          .filter((obj) => obj.Key)
          .map(async (obj) => {
            try {
              const getRes = await s3Client.send(
                new (await import('@aws-sdk/client-s3')).GetObjectCommand({ Bucket: S3_BUCKET, Key: obj.Key! })
              );
              const body = await getRes.Body?.transformToString();
              if (body) {
                const data = JSON.parse(body);
                if (data.originalKey === key) {
                  await deleteS3Object(obj.Key!);
                }
              }
            } catch {}
          });
        await Promise.all(deletes);
      }
    }

    const fileName = key.split('/').pop() ?? key;
    await prisma.resume.deleteMany({
      where: {
        OR: [
          { fileName: key },
          { fileName },
        ],
      },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Document deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}