import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { insertJobApplicationSchema } from '@/lib/schema';

// In-memory storage for job applications (exported for sharing with [id] route)
export let jobApplications: Array<{
  id: string;
  userId?: string;
  jobTitle: string;
  company: string;
  jobUrl: string;
  status: 'applied' | 'in-progress' | 'rejected' | 'offered';
  appliedDate: Date;
  lastUpdated: Date;
  notes?: string;
  location?: string;
  salaryRange?: string;
  createdAt: Date;
}> = [];

function generateId(): string {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = insertJobApplicationSchema.parse(body);
    
    const newApplication = {
      id: generateId(),
      ...validatedData,
      userId: validatedData.userId || undefined,
      appliedDate: new Date(),
      lastUpdated: new Date(),
      createdAt: new Date(),
    };
    
    jobApplications.unshift(newApplication);
    
    return NextResponse.json(newApplication, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error creating job application:', error);
    return NextResponse.json(
      { error: 'Failed to create job application' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    let filteredApplications = jobApplications;
    
    if (userId) {
      filteredApplications = jobApplications.filter(app => app.userId === userId);
    }
    
    // Sort by creation date (newest first)
    filteredApplications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    return NextResponse.json({ applications: filteredApplications });
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch job applications' },
      { status: 500 }
    );
  }
}