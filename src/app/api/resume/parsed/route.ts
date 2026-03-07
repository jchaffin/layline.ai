import { NextRequest, NextResponse } from 'next/server';
import { getRequiredSession, unauthorizedResponse } from '@/lib/api/auth';
import {
  assertResumeKeyOwnership,
  listResumeObjects,
  readResumeText,
} from '@/lib/resumeStorage';

export async function GET(request: NextRequest) {
  try {
    const session = await getRequiredSession(request);
    const userId = session.user?.id;
    if (!userId) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const key = searchParams.get('key');

    if (action === 'list') {
      const files = await listResumeObjects(`${userId}/`);
      const parsedResumes = files
        .filter((file) => file.name.includes('/parsed/'))
        .map((file) => ({
          key: file.name,
          lastModified: file.metadata.updated || file.metadata.timeCreated,
          size: Number(file.metadata.size || 0),
          fileName: file.name.split('/').pop(),
        }));

      return NextResponse.json({
        parsedResumes,
        total: parsedResumes.length
      });
    }

    if (action === 'get' && key) {
      assertResumeKeyOwnership(key, userId);
      const body = await readResumeText(key);
      
      if (!body) {
        return NextResponse.json({ error: 'No data found' }, { status: 404 });
      }

      const parsedData = JSON.parse(body);
      return NextResponse.json(parsedData);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorizedResponse();
    }
    console.error('Error accessing parsed resume data:', error);
    return NextResponse.json(
      { error: 'Failed to access parsed resume data' },
      { status: 500 }
    );
  }
}