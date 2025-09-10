import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: NextRequest) {
  try {
    const { job, userId = 'demo-user' } = await request.json();

    if (!job || !job.id) {
      return NextResponse.json(
        { error: 'Job data is required' },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const jobKey = `saved-jobs/${userId}/${timestamp}-${job.id}.json`;

    // Prepare job data with metadata
    const jobData = {
      ...job,
      savedAt: new Date().toISOString(),
      userId,
      originalId: job.id,
      id: `${job.id}-${timestamp}`, // Unique ID for saved job
    };

    // Save to S3
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
      Key: jobKey,
      Body: JSON.stringify(jobData, null, 2),
      ContentType: 'application/json',
      Metadata: {
        userId,
        jobTitle: job.title || 'Unknown',
        company: job.company || 'Unknown',
        savedAt: new Date().toISOString(),
      },
    });

    await s3Client.send(command);

    return NextResponse.json({
      success: true,
      message: 'Job saved to job board',
      jobId: jobData.id,
      s3Key: jobKey,
    });
  } catch (error) {
    console.error('Error saving job:', error);
    return NextResponse.json(
      { error: 'Failed to save job' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'demo-user';

    // List saved jobs from S3
    const { ListObjectsV2Command } = await import('@aws-sdk/client-s3');
    
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
      Prefix: `saved-jobs/${userId}/`,
      MaxKeys: 100,
    });

    const response = await s3Client.send(listCommand);
    const savedJobs = [];

    if (response.Contents) {
      // Get each saved job
      const { GetObjectCommand } = await import('@aws-sdk/client-s3');
      
      for (const object of response.Contents) {
        try {
          const getCommand = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
            Key: object.Key,
          });
          
          const jobResponse = await s3Client.send(getCommand);
          const jobBody = await jobResponse.Body?.transformToString();
          
          if (jobBody) {
            const jobData = JSON.parse(jobBody);
            savedJobs.push(jobData);
          }
        } catch (error) {
          console.error('Error fetching saved job:', error);
        }
      }
    }

    // Sort by saved date (newest first)
    savedJobs.sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());

    return NextResponse.json({
      success: true,
      savedJobs,
      total: savedJobs.length,
    });
  } catch (error) {
    console.error('Error fetching saved jobs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch saved jobs' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const userId = searchParams.get('userId') || 'demo-user';

    if (!jobId) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      );
    }

    // Find and delete the job
    const { ListObjectsV2Command, DeleteObjectCommand } = await import('@aws-sdk/client-s3');
    
    const listCommand = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
      Prefix: `saved-jobs/${userId}/`,
    });

    const response = await s3Client.send(listCommand);
    
    if (response.Contents) {
      for (const object of response.Contents) {
        try {
          const { GetObjectCommand } = await import('@aws-sdk/client-s3');
          const getCommand = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
            Key: object.Key,
          });
          
          const jobResponse = await s3Client.send(getCommand);
          const jobBody = await jobResponse.Body?.transformToString();
          
          if (jobBody) {
            const jobData = JSON.parse(jobBody);
            if (jobData.id === jobId) {
              // Delete the job
              const deleteCommand = new DeleteObjectCommand({
                Bucket: process.env.AWS_S3_BUCKET || 'interview-assistant-resumes',
                Key: object.Key,
              });
              
              await s3Client.send(deleteCommand);
              
              return NextResponse.json({
                success: true,
                message: 'Job removed from job board',
              });
            }
          }
        } catch (error) {
          console.error('Error processing job for deletion:', error);
        }
      }
    }

    return NextResponse.json(
      { error: 'Job not found' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error deleting saved job:', error);
    return NextResponse.json(
      { error: 'Failed to delete job' },
      { status: 500 }
    );
  }
}
