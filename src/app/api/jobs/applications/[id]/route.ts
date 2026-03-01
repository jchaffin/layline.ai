import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Import the shared storage from the main route
import { jobApplications } from '../route';

const updateStatusSchema = z.object({
  status: z.enum(['applied', 'in-progress', 'rejected', 'offered']),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('PATCH request received:', { id, body, totalApplications: jobApplications.length });
    
    // Validate the request body
    const { status } = updateStatusSchema.parse(body);
    
    const applicationIndex = jobApplications.findIndex(app => app.id === id);
    console.log('Found application at index:', applicationIndex);
    
    if (applicationIndex === -1) {
      console.log('Available application IDs:', jobApplications.map(app => app.id));
      return NextResponse.json(
        { error: 'Job application not found' },
        { status: 404 }
      );
    }
    
    // Update the application
    const updatedApp = {
      ...jobApplications[applicationIndex],
      status,
      lastUpdated: new Date(),
    };
    
    jobApplications[applicationIndex] = updatedApp;
    console.log('Application updated successfully:', updatedApp);
    
    return NextResponse.json(updatedApp);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Validation error:', error.issues);
      return NextResponse.json(
        { error: 'Invalid input', details: error.issues },
        { status: 400 }
      );
    }
    
    console.error('Error updating job application:', error);
    return NextResponse.json(
      { error: 'Failed to update job application' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const applicationIndex = jobApplications.findIndex(app => app.id === id);
    
    if (applicationIndex === -1) {
      return NextResponse.json(
        { error: 'Job application not found' },
        { status: 404 }
      );
    }
    
    // Remove the application
    jobApplications.splice(applicationIndex, 1);
    
    return NextResponse.json({ message: 'Job application deleted successfully' });
  } catch (error) {
    console.error('Error deleting job application:', error);
    return NextResponse.json(
      { error: 'Failed to delete job application' },
      { status: 500 }
    );
  }
}