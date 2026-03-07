import crypto from "node:crypto";
import path from "node:path";
import { Storage } from "@google-cloud/storage";

export type ResumeVersionType = "original" | "parsed" | "tailored";

export interface ResumeKeyParts {
  userId: string;
  resumeId: string;
  type: ResumeVersionType;
  versionId: string;
  fileName?: string;
}

let storage: Storage | null = null;

function getStorage(): Storage {
  if (!storage) {
    storage = new Storage();
  }

  return storage;
}

export function getResumeBucketName(): string {
  return process.env.GCS_RESUME_BUCKET || process.env.GCS_BUCKET || "layline-resumes";
}

function bucket() {
  return getStorage().bucket(getResumeBucketName());
}

function sanitizeSegment(value: string): string {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
}

function safeFileName(fileName: string): string {
  const normalized = path.posix.basename(fileName);
  return sanitizeSegment(normalized) || "resume";
}

export function createResumeId(): string {
  return crypto.randomUUID();
}

export function createResumeVersionId(): string {
  return `${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;
}

export function buildOriginalResumeKey(
  userId: string,
  resumeId: string,
  versionId: string,
  fileName: string,
): string {
  return `${userId}/${resumeId}/original/${versionId}/${safeFileName(fileName)}`;
}

export function buildParsedResumeKey(
  userId: string,
  resumeId: string,
  versionId: string,
): string {
  return `${userId}/${resumeId}/parsed/${versionId}.json`;
}

export function buildTailoredResumeKey(
  userId: string,
  resumeId: string,
  versionId: string,
): string {
  return `${userId}/${resumeId}/tailored/${versionId}.json`;
}

export function parseResumeStorageKey(key: string): ResumeKeyParts | null {
  const parts = key.split("/").filter(Boolean);
  if (parts.length < 4) {
    return null;
  }

  const [userId, resumeId, type, ...rest] = parts;
  if (type !== "original" && type !== "parsed" && type !== "tailored") {
    return null;
  }

  if (type === "original") {
    if (rest.length < 2) {
      return null;
    }

    return {
      userId,
      resumeId,
      type,
      versionId: rest[0],
      fileName: rest.slice(1).join("/"),
    };
  }

  const filePart = rest.join("/");
  const versionId = filePart.replace(/\.json$/i, "");
  if (!versionId) {
    return null;
  }

  return {
    userId,
    resumeId,
    type,
    versionId,
    fileName: filePart,
  };
}

export function getResumePrefix(userId: string, resumeId?: string): string {
  return resumeId ? `${userId}/${resumeId}/` : `${userId}/`;
}

export function assertResumeKeyOwnership(key: string, userId: string) {
  if (!key.startsWith(`${userId}/`)) {
    throw new Error("Unauthorized resume key");
  }
}

export async function saveResumeObject(params: {
  key: string;
  body: Buffer | string;
  contentType: string;
  metadata?: Record<string, string | undefined>;
}) {
  const { key, body, contentType, metadata } = params;
  await bucket().file(key).save(body, {
    resumable: false,
    contentType,
    metadata: {
      metadata: Object.fromEntries(
        Object.entries(metadata || {}).filter((entry): entry is [string, string] => Boolean(entry[1])),
      ),
    },
  });
}

export async function readResumeObject(key: string): Promise<Buffer | null> {
  const file = bucket().file(key);
  const [exists] = await file.exists();
  if (!exists) {
    return null;
  }

  const [contents] = await file.download();
  return contents;
}

export async function readResumeText(key: string): Promise<string | null> {
  const buffer = await readResumeObject(key);
  return buffer ? buffer.toString("utf-8") : null;
}

export async function getResumeMetadata(key: string) {
  const [metadata] = await bucket().file(key).getMetadata();
  return metadata;
}

export async function listResumeObjects(prefix: string) {
  const [files] = await bucket().getFiles({
    autoPaginate: true,
    prefix,
  });

  return files
    .filter((file) => file.name && !file.name.endsWith("/"))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function deleteResumeObject(key: string) {
  await bucket().file(key).delete({ ignoreNotFound: true });
}

export async function deleteResumePrefix(prefix: string) {
  const files = await listResumeObjects(prefix);
  await Promise.all(files.map((file) => file.delete({ ignoreNotFound: true })));
}

export async function getResumeDownloadUrl(key: string): Promise<string> {
  const [url] = await bucket().file(key).getSignedUrl({
    action: "read",
    expires: Date.now() + 60 * 60 * 1000,
  });

  return url;
}

export function toGcsUrl(key: string): string {
  return `gs://${getResumeBucketName()}/${key}`;
}
