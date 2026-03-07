import { NextRequest, NextResponse } from 'next/server';
import { getRequiredSession, unauthorizedResponse } from '@/lib/api/auth';
import {
  assertResumeKeyOwnership,
  deleteResumeObject,
  listResumeObjects,
  parseResumeStorageKey,
  readResumeText,
  toGcsUrl,
} from '@/lib/resumeStorage';

export async function GET(request: NextRequest) {
  try {
    const session = await getRequiredSession(request);
    const userId = session.user?.id;
    if (!userId) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const files = await listResumeObjects(`${userId}/`);
    const tailoredFiles = files
      .filter((file) => parseResumeStorageKey(file.name)?.type === 'tailored')
      .slice(0, limit);

    const resumes = (
      await Promise.all(
        tailoredFiles.map(async (file) => {
          try {
            const body = await readResumeText(file.name);
            const data = body ? (JSON.parse(body) as Record<string, unknown>) : {};
            return {
              key: file.name,
              size: Number(file.metadata.size || 0),
              lastModified: file.metadata.updated || file.metadata.timeCreated,
              companyName: (data.companyName as string) || 'Unknown',
              roleTitle: (data.roleTitle as string) || 'Unknown Role',
              createdAt:
                (data.createdAt as string) ||
                file.metadata.updated ||
                file.metadata.timeCreated,
              s3Url: toGcsUrl(file.name),
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
        }),
      )
    ).filter((resume) => resume !== null);

    return NextResponse.json({
      resumes: resumes.sort((a, b) => 
        new Date(b.lastModified || 0).getTime() - new Date(a.lastModified || 0).getTime()
      ),
      total: resumes.length,
      hasMore: false,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorizedResponse();
    }
    console.error('Error listing resumes:', error);
    return NextResponse.json(
      { error: 'Failed to list resumes from S3' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getRequiredSession(request);
    const userId = session.user?.id;
    if (!userId) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json(
        { error: 'Resume key is required' },
        { status: 400 }
      );
    }

    assertResumeKeyOwnership(key, userId);
    await deleteResumeObject(key);

    return NextResponse.json({
      success: true,
      message: 'Resume deleted successfully',
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorizedResponse();
    }
    console.error('Error deleting resume:', error);
    return NextResponse.json(
      { error: 'Failed to delete resume' },
      { status: 500 }
    );
  }
}