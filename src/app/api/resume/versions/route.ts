import { NextResponse } from "next/server";
import {
  S3Client,
  ListObjectsV2Command,
  GetObjectCommand,
} from "@aws-sdk/client-s3";

const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
});

const BUCKET = process.env.AWS_S3_BUCKET || "interview-assistant-resumes";

interface Version {
  key: string;
  label: string;
  company?: string;
  role?: string;
  createdAt: string;
  size: number;
  type: "original" | "tailored";
}

interface ResumeGroup {
  originalKey: string;
  originalName: string;
  uploadedAt: string;
  size: number;
  versions: Version[];
}

async function listPrefix(prefix: string) {
  const cmd = new ListObjectsV2Command({
    Bucket: BUCKET,
    Prefix: prefix,
    MaxKeys: 100,
  });
  const res = await s3.send(cmd);
  return (res.Contents || []).map((o) => ({
    key: o.Key!,
    size: o.Size || 0,
    lastModified: o.LastModified?.toISOString() || "",
    fileName: o.Key!.split("/").pop() || "",
  }));
}

async function readJson(key: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await s3.send(
      new GetObjectCommand({ Bucket: BUCKET, Key: key })
    );
    const body = await res.Body?.transformToString();
    if (!body) return null;
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function stripTimestamp(fileName: string): string {
  return fileName.replace(/^\d+-/, "");
}

export async function GET() {
  try {
    if (!process.env.AWS_ACCESS_KEY_ID) {
      return NextResponse.json({ groups: [] });
    }

    const [originals, tailored] = await Promise.all([
      listPrefix("original-resumes/"),
      listPrefix("tailored-resumes/"),
    ]);

    const tailoredData = await Promise.all(
      tailored.map(async (t) => {
        const data = await readJson(t.key);
        return {
          ...t,
          originalKey: (data?.originalKey as string) || null,
          company: (data?.companyName as string) || undefined,
          role: (data?.roleTitle as string) || undefined,
          createdAt: (data?.createdAt as string) || t.lastModified,
        };
      })
    );

    const groups: ResumeGroup[] = originals.map((orig) => {
      const baseName = stripTimestamp(orig.fileName).replace(/\.[^.]+$/, "");

      const children = tailoredData.filter((t) => {
        if (t.originalKey === orig.key) return true;
        if (t.originalKey) return false;
        const tBase = stripTimestamp(t.fileName).replace(/\.[^.]+$/, "");
        return tBase.toLowerCase().includes(baseName.toLowerCase());
      });

      const versions: Version[] = [
        {
          key: orig.key,
          label: "Original",
          createdAt: orig.lastModified,
          size: orig.size,
          type: "original",
        },
        ...children.map((c, i) => ({
          key: c.key,
          label: c.role
            ? `${c.role}${c.company ? ` @ ${c.company}` : ""}`
            : `Tailored v${i + 2}`,
          company: c.company,
          role: c.role,
          createdAt: c.createdAt,
          size: c.size,
          type: "tailored" as const,
        })),
      ];

      versions.sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      return {
        originalKey: orig.key,
        originalName: stripTimestamp(orig.fileName),
        uploadedAt: orig.lastModified,
        size: orig.size,
        versions,
      };
    });

    // Unlinked tailored resumes that didn't match any original
    const linkedKeys = new Set(
      groups.flatMap((g) => g.versions.map((v) => v.key))
    );
    const orphaned = tailoredData.filter((t) => !linkedKeys.has(t.key));
    if (orphaned.length > 0) {
      groups.push({
        originalKey: "__orphaned__",
        originalName: "Other Tailored Resumes",
        uploadedAt: orphaned[0].lastModified,
        size: 0,
        versions: orphaned.map((o, i) => ({
          key: o.key,
          label: o.role
            ? `${o.role}${o.company ? ` @ ${o.company}` : ""}`
            : `Tailored ${i + 1}`,
          company: o.company,
          role: o.role,
          createdAt: o.createdAt,
          size: o.size,
          type: "tailored" as const,
        })),
      });
    }

    groups.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({ groups });
  } catch (error) {
    console.error("Resume versions error:", error);
    return NextResponse.json(
      { error: "Failed to load resume versions" },
      { status: 500 }
    );
  }
}
