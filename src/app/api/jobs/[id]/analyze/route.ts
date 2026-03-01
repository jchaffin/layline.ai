import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();

  // Analyze job by ID (replace with real logic)
  return NextResponse.json({ analyzed: true, jobId: id, analysis: 'Sample analysis result' });
}
