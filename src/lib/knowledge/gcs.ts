import { Storage } from "@google-cloud/storage";

export interface GcsObject {
  bucket: string;
  name: string;
  contentType?: string | null;
  updated?: string;
}

let storage: Storage | null = null;

function getStorage(): Storage {
  if (!storage) {
    storage = new Storage();
  }

  return storage;
}

export async function listBucketObjects(
  bucketName: string,
  prefix?: string,
  options?: {
    extensions?: string[];
  },
): Promise<GcsObject[]> {
  const [files] = await getStorage().bucket(bucketName).getFiles({
    autoPaginate: true,
    prefix,
  });

  const normalizedExtensions = (options?.extensions || []).map((extension) =>
    extension.toLowerCase(),
  );

  return files
    .filter((file) => file.name && !file.name.endsWith("/"))
    .filter((file) => {
      if (!normalizedExtensions.length) {
        return true;
      }

      const lowerName = file.name.toLowerCase();
      return normalizedExtensions.some((extension) => lowerName.endsWith(extension));
    })
    .map((file) => ({
      bucket: bucketName,
      name: file.name,
      contentType: file.metadata.contentType,
      updated: file.metadata.updated,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function downloadBucketObject(
  bucketName: string,
  objectName: string,
): Promise<Buffer> {
  const [contents] = await getStorage().bucket(bucketName).file(objectName).download();
  return contents;
}

export function toGcsUri(bucketName: string, objectName: string): string {
  return `gs://${bucketName}/${objectName}`;
}
