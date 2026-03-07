import { NextRequest, NextResponse } from 'next/server';
import { getRequiredSession, unauthorizedResponse } from '@/lib/api/auth';
import {
  assertResumeKeyOwnership,
  getResumeDownloadUrl,
  getResumeMetadata,
  readResumeObject,
} from '@/lib/resumeStorage';

export async function GET(request: NextRequest) {
  try {
    const session = await getRequiredSession(request);
    const userId = session.user?.id;
    if (!userId) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    const download = searchParams.get('download') === 'true';

    if (!key) {
      return NextResponse.json(
        { error: 'Document key is required' },
        { status: 400 }
      );
    }

    assertResumeKeyOwnership(key, userId);

    if (download) {
      const signedUrl = await getResumeDownloadUrl(key);

      return NextResponse.json({
        downloadUrl: signedUrl,
        expiresIn: 3600,
      });
    } else {
      const [metadata, body] = await Promise.all([
        getResumeMetadata(key),
        readResumeObject(key),
      ]);

      if (!body) {
        return NextResponse.json(
          { error: 'Document not found' },
          { status: 404 }
        );
      }

      return new NextResponse(body as BufferSource, {
        headers: {
          'Content-Type': metadata.contentType || 'application/pdf',
          'Content-Disposition': `inline; filename="${key.split('/').pop()}"`,
        },
      });
    }
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorizedResponse();
    }
    console.error('Document download error:', error);
    return NextResponse.json(
      { error: 'Failed to download document' },
      { status: 500 }
    );
  }
}