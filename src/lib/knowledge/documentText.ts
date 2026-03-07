import path from "node:path";
import pdfParse from "@jchaffin/pdf-parse";
import { openai } from "@/lib/api/openai";

const TEXT_EXTENSIONS = new Set([
  ".cjs",
  ".css",
  ".html",
  ".js",
  ".json",
  ".jsx",
  ".md",
  ".mjs",
  ".py",
  ".sh",
  ".sql",
  ".ts",
  ".tsx",
  ".txt",
  ".xml",
  ".yaml",
  ".yml",
]);

const IMAGE_EXTENSIONS = new Set([
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

function normalizeExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\t/g, " ")
    .replace(/[^\x20-\x7E\n]/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .replace(/\n\s+/g, "\n")
    .replace(/\s+\n/g, "\n")
    .trim();
}

export async function extractPdfText(buffer: Buffer): Promise<string> {
  function renderPage(pageData: any) {
    const renderOptions = {
      normalizeWhitespace: true,
      disableCombineTextItems: false,
    };

    return pageData.getTextContent(renderOptions).then((textContent: any) => {
      let lastY: number | null = null;
      let text = "";

      for (const item of textContent.items) {
        if (lastY === item.transform[5] || !lastY) {
          text += item.str;
        } else {
          text += "\n" + item.str;
        }
        lastY = item.transform[5];
      }

      return text;
    });
  }

  const data = await pdfParse(buffer, {
    pagerender: renderPage,
    max: 0,
    version: "v1.10.100",
  });

  return normalizeExtractedText(data.text || "");
}

function getImageMimeType(fileName: string, contentType?: string | null): string | null {
  if (contentType?.startsWith("image/")) {
    return contentType;
  }

  const extension = path.extname(fileName).toLowerCase();
  switch (extension) {
    case ".gif":
      return "image/gif";
    case ".jpeg":
    case ".jpg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".webp":
      return "image/webp";
    default:
      return null;
  }
}

async function extractImageText(params: {
  buffer: Buffer;
  fileName: string;
  contentType?: string | null;
}): Promise<string> {
  const mimeType = getImageMimeType(params.fileName, params.contentType);
  if (!mimeType) {
    return "";
  }

  const dataUrl = `data:${mimeType};base64,${params.buffer.toString("base64")}`;
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Extract text and useful visual knowledge from the image for semantic search. " +
          "First transcribe any readable text as faithfully as possible. " +
          "Then add a short description of the important visual content, labels, diagrams, charts, or UI shown. " +
          "Return plain text only.",
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Extract searchable knowledge from this image file: ${params.fileName}`,
          },
          {
            type: "image_url",
            image_url: {
              url: dataUrl,
            },
          },
        ],
      },
    ],
  });

  return normalizeExtractedText(response.choices[0]?.message?.content || "");
}

export function isTextLikeFile(
  fileName: string,
  contentType?: string | null,
): boolean {
  const extension = path.extname(fileName).toLowerCase();

  if (TEXT_EXTENSIONS.has(extension)) {
    return true;
  }

  if (!contentType) {
    return false;
  }

  return (
    contentType.startsWith("text/") ||
    contentType.includes("json") ||
    contentType.includes("javascript") ||
    contentType.includes("xml")
  );
}

export function isImageFile(fileName: string, contentType?: string | null): boolean {
  const extension = path.extname(fileName).toLowerCase();

  return IMAGE_EXTENSIONS.has(extension) || Boolean(contentType?.startsWith("image/"));
}

export async function extractDocumentText(params: {
  buffer: Buffer;
  fileName: string;
  contentType?: string | null;
}): Promise<string | null> {
  const { buffer, fileName, contentType } = params;
  const lowerName = fileName.toLowerCase();

  if (lowerName.endsWith(".pdf") || contentType === "application/pdf") {
    const text = await extractPdfText(buffer);
    return text || null;
  }

  if (isImageFile(fileName, contentType)) {
    const text = await extractImageText({ buffer, fileName, contentType });
    return text || null;
  }

  if (!isTextLikeFile(fileName, contentType)) {
    return null;
  }

  const text = new TextDecoder("utf-8").decode(buffer);
  const normalized = normalizeExtractedText(text);
  return normalized || null;
}
