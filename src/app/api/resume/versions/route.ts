import { NextRequest, NextResponse } from "next/server";
import { getRequiredSession, unauthorizedResponse } from "@/lib/api/auth";
import {
  listResumeObjects,
  parseResumeStorageKey,
} from "@/lib/resumeStorage";

interface Version {
  key: string;
  label: string;
  company?: string;
  role?: string;
  parsedKey?: string;
  resumeId?: string;
  versionId?: string;
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

function toCreatedAtString(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function toOptionalString(value: unknown): string | undefined {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : undefined;
}

function toTimestamp(value: string): number {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getRequiredSession(request);
    const userId = session.user?.id;
    if (!userId) return unauthorizedResponse();

    const files = await listResumeObjects(`${userId}/`);
    const groupsMap = new Map<
      string,
      {
        originalName: string;
        uploadedAt: string;
        size: number;
        versions: Version[];
      }
    >();
    const parsedKeyByVersion = new Map<string, string>();

    for (const file of files) {
      const parsed = parseResumeStorageKey(file.name);
      if (!parsed || parsed.userId !== userId) {
        continue;
      }

      if (parsed.type === "parsed") {
        parsedKeyByVersion.set(`${parsed.resumeId}:${parsed.versionId}`, file.name);
      }
    }

    for (const file of files) {
      const parsed = parseResumeStorageKey(file.name);
      if (!parsed || parsed.userId !== userId || parsed.type === "parsed") {
        continue;
      }

      const metadata = file.metadata.metadata || {};
      const createdAt = toCreatedAtString(
        metadata.createdAt ??
          metadata.uploadedAt ??
          file.metadata.updated ??
          file.metadata.timeCreated,
      );
      const size = Number(file.metadata.size || 0);
      const parsedKey = parsedKeyByVersion.get(`${parsed.resumeId}:${parsed.versionId}`);
      const group = groupsMap.get(parsed.resumeId) || {
        originalName: parsed.fileName || parsed.resumeId,
        uploadedAt: createdAt,
        size,
        versions: [],
      };

      if (parsed.type === "original") {
        group.originalName = parsed.fileName || group.originalName;
        if (toTimestamp(createdAt) >= toTimestamp(group.uploadedAt)) {
          group.uploadedAt = createdAt;
          group.size = size;
        }
      }

      group.versions.push({
        key: file.name,
        label:
          parsed.type === "original"
            ? toOptionalString(metadata.label) || "Original"
            : toOptionalString(metadata.label) ||
              toOptionalString(metadata.role) ||
              "Tailored Resume",
        company: toOptionalString(metadata.company),
        role: toOptionalString(metadata.role),
        parsedKey,
        resumeId: parsed.resumeId,
        versionId: parsed.versionId,
        createdAt,
        size,
        type: parsed.type,
      });

      groupsMap.set(parsed.resumeId, group);
    }

    const groups: ResumeGroup[] = Array.from(groupsMap.entries()).map(([resumeId, group]) => {
      const originals = group.versions.filter((version) => version.type === "original");
      originals.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      const primaryOriginal = originals[0];

      const versions = [...group.versions].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );

      return {
        originalKey: primaryOriginal?.key || `${userId}/${resumeId}`,
        originalName: primaryOriginal?.label === "Original"
          ? group.originalName
          : primaryOriginal?.label || group.originalName,
        uploadedAt: primaryOriginal?.createdAt || group.uploadedAt,
        size: primaryOriginal?.size || group.size,
        versions,
      };
    });

    groups.sort(
      (a, b) =>
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    );

    return NextResponse.json({ groups });
  } catch (error) {
    if (error instanceof Error && error.message === "Authentication required") {
      return unauthorizedResponse();
    }
    console.error("Resume versions error:", error);
    return NextResponse.json(
      { error: "Failed to load resume versions" },
      { status: 500 }
    );
  }
}
