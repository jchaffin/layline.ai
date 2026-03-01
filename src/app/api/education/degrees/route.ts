import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export async function GET() {
  try {
    const allDegrees = await prisma.degree.findMany({
      where: { isActive: true },
      orderBy: [{ level: 'asc' }, { name: 'asc' }],
    });

    return NextResponse.json({ degrees: allDegrees });
  } catch (error) {
    console.error('Error fetching degrees:', error);
    return NextResponse.json(
      { error: 'Failed to fetch degrees' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { name, level } = await request.json();

    if (!name || !level) {
      return NextResponse.json(
        { error: 'Name and level are required' },
        { status: 400 }
      );
    }

    const newDegree = await prisma.degree.create({
      data: { name, level },
    });

    return NextResponse.json({ degree: newDegree });
  } catch (error) {
    console.error('Error creating degree:', error);
    return NextResponse.json(
      { error: 'Failed to create degree' },
      { status: 500 }
    );
  }
}
