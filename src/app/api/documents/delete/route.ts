import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getRequiredSession, unauthorizedResponse } from '@/lib/api/auth';
import {
  assertResumeKeyOwnership,
  deleteResumeObject,
  deleteResumePrefix,
  parseResumeStorageKey,
} from '@/lib/resumeStorage';

export async function DELETE(request: NextRequest) {
  try {
    const session = await getRequiredSession(request);
    const userId = session.user?.id;
    if (!userId) return unauthorizedResponse();

    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    if (!key) {
      return NextResponse.json({ error: 'Document key is required' }, { status: 400 });
    }

    assertResumeKeyOwnership(key, userId);
    const parsedKey = parseResumeStorageKey(key);
    if (!parsedKey) {
      return NextResponse.json({ error: 'Invalid document key' }, { status: 400 });
    }

    if (parsedKey.type === 'original') {
      await deleteResumePrefix(`${parsedKey.userId}/${parsedKey.resumeId}/`);
    } else {
      await deleteResumeObject(key);
    }

    const fileName = parsedKey.fileName ?? key.split('/').pop() ?? key;
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
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorizedResponse();
    }
    console.error('Error deleting document:', error);
    return NextResponse.json(
      { error: 'Failed to delete document' },
      { status: 500 }
    );
  }
}