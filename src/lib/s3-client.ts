import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY || !process.env.AWS_REGION) {
  throw new Error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION environment variables.');
}

export const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET;

if (!BUCKET_NAME) {
  throw new Error('AWS_S3_BUCKET environment variable not configured');
}

// Helper functions for user-specific S3 operations
export class UserS3Client {
  private userId: string;

  constructor(userId: string) {
    this.userId = userId;
  }

  // Generate user-specific S3 key
  private getUserKey(filename: string): string {
    return `users/${this.userId}/${filename}`;
  }

  // Upload file for specific user
  async uploadFile(filename: string, content: Buffer | Uint8Array | string, contentType?: string): Promise<string> {
    const key = this.getUserKey(filename);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: content,
      ContentType: contentType,
    });

    await s3Client.send(command);
    return key;
  }

  // Get file for specific user
  async getFile(filename: string): Promise<Buffer> {
    const key = this.getUserKey(filename);
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);
    const chunks: Buffer[] = [];
    
    if (response.Body) {
      const stream = response.Body as any;
      for await (const chunk of stream) {
        chunks.push(chunk);
      }
    }
    
    return Buffer.concat(chunks);
  }

  // Delete file for specific user
  async deleteFile(filename: string): Promise<void> {
    const key = this.getUserKey(filename);
    
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  }

  // List files for specific user
  async listFiles(prefix?: string): Promise<string[]> {
    const userPrefix = `users/${this.userId}/${prefix || ''}`;
    
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: userPrefix,
    });

    const response = await s3Client.send(command);
    
    return (response.Contents || [])
      .map(obj => obj.Key || '')
      .filter(key => key)
      .map(key => key.replace(`users/${this.userId}/`, '')); // Remove user prefix from returned keys
  }

  // Generate presigned URL for direct upload
  async getPresignedUploadUrl(filename: string, contentType?: string, expiresIn = 3600): Promise<string> {
    const key = this.getUserKey(filename);
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }

  // Generate presigned URL for download
  async getPresignedDownloadUrl(filename: string, expiresIn = 3600): Promise<string> {
    const key = this.getUserKey(filename);
    
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    return await getSignedUrl(s3Client, command, { expiresIn });
  }
}

// Factory function to create user-specific S3 client
export function createUserS3Client(userId: string): UserS3Client {
  return new UserS3Client(userId);
}